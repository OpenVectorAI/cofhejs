import type {
  CLHSM2k,
  CLHSM2kCiphertext,
  CLHSM2kCleartext,
  CLHSM2kPartialDecryptionResult,
} from '../cryptosystems/CPUCryptoSystem/internals/clhsm2k.js';
import type { CPUCryptoSystem } from '../cryptosystems/index.js';
import type { PKCEncryptor, Reencryptor } from './reencryptor.js';

export let rsaProvider: SubtleCrypto | null = null;

// if in nodejs, use crypto module
if (typeof window === 'undefined') {
  try {
    let crypto_ = await import('node:crypto');
    // @ts-ignore
    rsaProvider = crypto_.webcrypto.subtle;
  } catch (err) {
    console.error('crypto support is disabled!');
  }
} else {
  // if in browser, use window.crypto
  // @ts-ignore
  rsaProvider = window.crypto?.subtle;
}

export type RSAEncryptorPublicKey = CryptoKey;
export type RSAEncryptorPrivateKey = CryptoKey;
type RSAEncryptorPlainText = Uint8Array;
type RSAEncryptorCipherText = Uint8Array;

export class RSAEncryptor
  implements
    PKCEncryptor<
      RSAEncryptorPrivateKey,
      RSAEncryptorPublicKey,
      RSAEncryptorPlainText,
      RSAEncryptorCipherText
    >
{
  private key_size: number;
  constructor(key_size: number) {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    this.key_size = key_size;
  }

  async encrypt(
    pk: RSAEncryptorPublicKey,
    pt: Uint8Array,
  ): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return new Uint8Array(
      await rsaProvider.encrypt({ name: 'RSA-OAEP' }, pk, pt),
    );
  }

  async decrypt(
    sk: RSAEncryptorPrivateKey,
    ct: Uint8Array,
  ): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return new Uint8Array(
      await rsaProvider.decrypt({ name: 'RSA-OAEP' }, sk, ct),
    );
  }
  async generate_key(): Promise<{
    public_key: RSAEncryptorPublicKey;
    secret_key: RSAEncryptorPrivateKey;
  }> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    const keyPair = await rsaProvider.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: this.key_size,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );
    return {
      public_key: keyPair.publicKey,
      secret_key: keyPair.privateKey,
    };
  }

  async serialize_public_key(pk: RSAEncryptorPublicKey): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return new Uint8Array(await rsaProvider.exportKey('spki', pk));
  }

  async serialize_secret_key(sk: RSAEncryptorPrivateKey): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return new Uint8Array(await rsaProvider.exportKey('pkcs8', sk));
  }

  async deserialize_public_key(
    serialized_pub_key: Uint8Array,
  ): Promise<RSAEncryptorPublicKey> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return rsaProvider.importKey(
      'spki',
      serialized_pub_key,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt'],
    );
  }
  async deserialize_secret_key(
    serialized_secret_key: Uint8Array,
  ): Promise<RSAEncryptorPrivateKey> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return rsaProvider.importKey(
      'pkcs8',
      serialized_secret_key,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt'],
    );
  }
  async serialize_ciphertext(ct: RSAEncryptorCipherText): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    return ct;
  }
}

export class CPURSAReencryptor
  implements
    Reencryptor<
      CLHSM2kCiphertext,
      CLHSM2kCleartext,
      CLHSM2kPartialDecryptionResult,
      RSAEncryptorPrivateKey,
      RSAEncryptorPublicKey
    >
{
  private rsaEncryptor: RSAEncryptor;
  private cs: CPUCryptoSystem;

  constructor(rsaEncryptor: RSAEncryptor, clhsm2k: CPUCryptoSystem) {
    this.rsaEncryptor = rsaEncryptor;
    this.cs = clhsm2k;
  }

  async reencrypt(
    partial_decryption_result: CLHSM2kPartialDecryptionResult,
    pkc_public_key: RSAEncryptorPublicKey,
  ): Promise<Uint8Array> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    const serialized_partial_decryption_result =
      this.cs.serialize_partial_decryption_result(partial_decryption_result);

    return await this.rsaEncryptor.encrypt(
      pkc_public_key,
      serialized_partial_decryption_result,
    );
  }

  async decrypt(
    reencrypted_partial_decryption_results: Uint8Array[],
    ct: CLHSM2kCiphertext,
    reencryption_private_key: RSAEncryptorPrivateKey,
  ): Promise<CLHSM2kCleartext> {
    if (!rsaProvider) {
      throw new Error('RSA provider is not available');
    }
    const decrypted_partial_decryptions = await Promise.all(
      reencrypted_partial_decryption_results.map(
        async (pds) =>
          await this.rsaEncryptor.decrypt(reencryption_private_key, pds),
      ),
    );

    const deser_partial_decryptions = decrypted_partial_decryptions.map((pd) =>
      this.cs.deserialize_partial_decryption_result(pd),
    );

    return this.cs.combine_partial_decryption_results(
      ct,
      deser_partial_decryptions,
    );
  }

  async generate_reencryption_key_pair(): Promise<{
    public_key: RSAEncryptorPublicKey;
    secret_key: RSAEncryptorPrivateKey;
  }> {
    return await this.rsaEncryptor.generate_key();
  }

  async serialize_reencryption_private_key(
    sk: RSAEncryptorPrivateKey,
  ): Promise<Uint8Array> {
    return await this.rsaEncryptor.serialize_secret_key(sk);
  }

  async serialize_reencryption_public_key(
    pk: RSAEncryptorPublicKey,
  ): Promise<Uint8Array> {
    return await this.rsaEncryptor.serialize_public_key(pk);
  }

  async deserialize_reencryption_private_key(
    serialized_reencryption_private_key: Uint8Array,
  ): Promise<RSAEncryptorPrivateKey> {
    return await this.rsaEncryptor.deserialize_secret_key(
      serialized_reencryption_private_key,
    );
  }

  async deserialize_reencryption_public_key(
    serialized_reencryption_public_key: Uint8Array,
  ): Promise<RSAEncryptorPublicKey> {
    return await this.rsaEncryptor.deserialize_public_key(
      serialized_reencryption_public_key,
    );
  }

  async concatenate_reencrypted_partial_decryption_results(
    reencrypted_partial_decryption_results: Uint8Array[],
  ): Promise<Uint8Array> {
    const offsets: bigint[] = [];
    let offset =
      8n + BigInt(reencrypted_partial_decryption_results.length) * 8n;
    for (let i = 0; i < reencrypted_partial_decryption_results.length; i++) {
      offsets.push(BigInt(offset));
      offset += BigInt(reencrypted_partial_decryption_results[i]!.length);
    }
    const result = new Uint8Array(Number(offset));
    let num_messages = BigInt(reencrypted_partial_decryption_results.length);
    for (let i = 0; i < 8; i++) {
      result[i] = Number(num_messages & BigInt(0xff));
      num_messages >>= BigInt(8);
    }
    for (let i = 0; i < reencrypted_partial_decryption_results.length; i++) {
      let offset_c = BigInt(offsets[i]!);
      for (let j = 0; j < 8; j++) {
        result[i * 8 + j + 8] = Number(offset_c & BigInt(0xff));
        offset_c >>= BigInt(8);
      }
      for (
        let j = 0;
        j < reencrypted_partial_decryption_results[i]!.length;
        j++
      ) {
        result[Number(offsets[i]) + j] =
          reencrypted_partial_decryption_results[i]![j]!;
      }
    }
    return result;
  }

  async split_reencrypted_partial_decryption_results(
    reencrypted_partial_decryption_results: Uint8Array,
  ): Promise<Uint8Array[]> {
    let num_messages = 0n;
    for (let i = 0; i < 8; i++) {
      num_messages |=
        BigInt(reencrypted_partial_decryption_results[i]!) << BigInt(i * 8);
    }
    const offsets: bigint[] = [];
    for (let i = 0; i < num_messages; i++) {
      let offset = 0n;
      for (let j = 0; j < 8; j++) {
        offset |=
          BigInt(reencrypted_partial_decryption_results[i * 8 + j + 8]!) <<
          BigInt(j * 8);
      }
      offsets.push(offset);
    }
    const result: Uint8Array[] = [];
    for (let i = 0; i < num_messages - 1n; i++) {
      const size = Number(offsets[i + 1]!) - Number(offsets[i]!);
      const subarray = reencrypted_partial_decryption_results.slice(
        Number(offsets[i]),
        Number(offsets[i]) + size,
      );
      result.push(subarray);
    }
    result.push(
      reencrypted_partial_decryption_results.slice(
        Number(offsets[Number(num_messages - 1n)]!),
      ),
    );
    return result;
  }
}
