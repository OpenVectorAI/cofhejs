import type { ICryptoSystem } from '../ICryptoSystem.js';
import { abs, nbits_abs } from './internals/bigint_utils.js';

import {
  CLHSM2k,
  CLHSM2kSecretKey,
  CLHSM2kPublicKey,
  CLHSM2kCleartext,
  CLHSM2kCiphertext,
} from './internals/clhsm2k.js';
import type {
  CLHSM2kSecretKeyShare,
  CLHSM2kPartialDecryptionResult,
} from './internals/clhsm2k.js';
import { QFI } from './internals/qfi.js';

export {
  CLHSM2k,
  CLHSM2kSecretKey,
  CLHSM2kPublicKey,
  CLHSM2kCleartext,
  CLHSM2kCiphertext,
};

export type { CLHSM2kSecretKeyShare, CLHSM2kPartialDecryptionResult };

export class CPUCryptoSystem
  implements
    ICryptoSystem<
      CLHSM2kSecretKey,
      CLHSM2kSecretKeyShare,
      CLHSM2kPublicKey,
      CLHSM2kCleartext,
      CLHSM2kCiphertext,
      CLHSM2kPartialDecryptionResult
    >
{
  private k_m: number;
  private clhsm2k: CLHSM2k;
  constructor(sec_bits: number, k: number, clhsm2k?: CLHSM2k) {
    this.k_m = k;
    if (clhsm2k) {
      if (clhsm2k.k !== k) {
        throw new Error(
          `CLHSM2k instance provided has k=${clhsm2k.k} but expected k=${k}`,
        );
      }
      this.clhsm2k = clhsm2k;
    } else {
      this.clhsm2k = CLHSM2k.create(sec_bits, k);
    }
  }
  public static create_from_n(
    n: bigint,
    k: number,
    cl_delta_k_class_number: bigint = 0n,
  ): CPUCryptoSystem {
    return new CPUCryptoSystem(
      0,
      k,
      new CLHSM2k(n, k, cl_delta_k_class_number),
    );
  }

  public keygen(secret_key?: CLHSM2kSecretKey, t?: number, n?: number) {
    // @ts-ignore: allow passing undefined into CLHSM2k.keygen
    return this.clhsm2k.keygen(secret_key, t, n);
  }

  public make_plaintext(value: bigint): CLHSM2kCleartext {
    return this.clhsm2k.create_cleartext(value);
  }
  public get_plaintext_value(plaintext: CLHSM2kCleartext): number {
    return Number(plaintext.m);
  }
  public encrypt(
    pk: CLHSM2kPublicKey,
    pt: CLHSM2kCleartext,
  ): CLHSM2kCiphertext {
    return this.clhsm2k.encrypt(pk, pt);
  }
  public combine_partial_decryption_results(
    ciphertext: CLHSM2kCiphertext,
    partial_decryptions: CLHSM2kPartialDecryptionResult[],
  ): CLHSM2kCleartext {
    return this.clhsm2k.combine_partial_decryption_results(
      ciphertext,
      partial_decryptions,
    );
  }
  public deserialize_public_key(
    serialized_pub_key: Uint8Array,
  ): CLHSM2kPublicKey {
    return new CLHSM2kPublicKey(
      this.deserialize_qfi_binary(serialized_pub_key),
      this.clhsm2k,
    );
  }

  public serialize_partial_decryption_result(
    partial_decryption_result: CLHSM2kPartialDecryptionResult,
  ): Uint8Array {
    return this.serialize_qfi_binary(partial_decryption_result);
  }

  public deserialize_partial_decryption_result(
    serialized_partial_decryption_result: Uint8Array,
  ): CLHSM2kPartialDecryptionResult {
    return this.deserialize_qfi_binary(serialized_partial_decryption_result);
  }

  public serialize_ciphertext(ciphertext: CLHSM2kCiphertext): Uint8Array {
    const c1_ser = this.serialize_qfi_binary(ciphertext.c1);
    const c2_ser = this.serialize_qfi_binary(ciphertext.c2);
    const size = 8 + c1_ser.length + c2_ser.length;
    const result = new Uint8Array(size);
    let table = BigInt(c1_ser.length);
    for (let i = 0; i < 8; i++) {
      result[i] = Number(table & BigInt(0xff));
      table >>= BigInt(8);
    }
    for (let i = 0; i < c1_ser.length; i++) {
      result[i + 8] = c1_ser[i]!;
    }
    for (let i = 0; i < c2_ser.length; i++) {
      result[i + 8 + c1_ser.length] = c2_ser[i]!;
    }
    return result;
  }

  public deserialize_ciphertext(
    serialized_ciphertext: Uint8Array,
  ): CLHSM2kCiphertext {
    let table = BigInt(0);
    for (let i = 0; i < 8; i++) {
      table |= BigInt(serialized_ciphertext[i]!) << BigInt(i * 8);
    }
    const bytes_in_c1 = Number(table);
    const bytes_in_c2 = serialized_ciphertext.length - 8 - bytes_in_c1;
    let c1 = new Uint8Array(bytes_in_c1);
    let c2 = new Uint8Array(bytes_in_c2);
    for (let i = 0; i < bytes_in_c1; i++) {
      c1[i] = serialized_ciphertext[i + 8]!;
    }
    for (let i = 0; i < bytes_in_c2; i++) {
      c2[i] = serialized_ciphertext[i + 8 + bytes_in_c1]!;
    }
    return new CLHSM2kCiphertext(
      this.deserialize_qfi_binary(c1),
      this.deserialize_qfi_binary(c2),
    );
  }

  public serialize_qfi_binary(qfi: QFI): Uint8Array {
    const size_a = Math.ceil(nbits_abs(qfi.a()) / 8);
    const size_b = Math.ceil(nbits_abs(qfi.b()) / 8);
    const size_c = Math.ceil(nbits_abs(qfi.c()) / 8);
    const size = 8 + size_a + size_b + size_c;
    const result = new Uint8Array(size);
    let table =
      (BigInt(qfi.a() > 0n ? 0 : 1) << BigInt(63)) |
      (BigInt(qfi.b() > 0n ? 0 : 1) << BigInt(62)) |
      (BigInt(qfi.c() > 0n ? 0 : 1) << BigInt(61)) |
      (BigInt(size_a) << BigInt(31)) |
      (BigInt(size_b) << BigInt(1));
    for (let i = 0; i < 8; i++) {
      result[i] = Number(table & BigInt(0xff));
      table >>= BigInt(8);
    }
    let a = abs(qfi.a());
    let b = abs(qfi.b());
    let c = abs(qfi.c());
    for (let i = 0; i < size_a; i++) {
      result[i + 8] = Number(a & BigInt(0xff));
      a >>= BigInt(8);
    }
    for (let i = 0; i < size_b; i++) {
      result[i + 8 + size_a] = Number(b & BigInt(0xff));
      b >>= BigInt(8);
    }
    for (let i = 0; i < size_c; i++) {
      result[i + 8 + size_a + size_b] = Number(c & BigInt(0xff));
      c >>= BigInt(8);
    }
    return result;
  }

  private deserialize_qfi_binary(serialized_qfi: Uint8Array): QFI {
    let table = BigInt(0);
    for (let i = 0; i < 8; i++) {
      table |= BigInt(serialized_qfi[i]!) << BigInt(i * 8);
    }
    const is_a_negative = Boolean((table >> BigInt(63)) & BigInt(1))
      ? true
      : false;
    const is_b_negative = Boolean((table >> BigInt(62)) & BigInt(1))
      ? true
      : false;
    const is_c_negative = Boolean((table >> BigInt(61)) & BigInt(1))
      ? true
      : false;
    const bytes_in_a = Number((table >> BigInt(31)) & BigInt(0x3fffffff));
    const bytes_in_b = Number((table >> BigInt(1)) & BigInt(0x3fffffff));
    const bytes_in_c = serialized_qfi.length - 8 - bytes_in_a - bytes_in_b;
    let a = BigInt(0);
    let b = BigInt(0);
    let c = BigInt(0);
    for (let i = 0; i < bytes_in_a; i++) {
      a |= BigInt(serialized_qfi[i + 8]!) << BigInt(i * 8);
    }
    for (let i = 0; i < bytes_in_b; i++) {
      b |= BigInt(serialized_qfi[i + 8 + bytes_in_a]!) << BigInt(i * 8);
    }
    for (let i = 0; i < bytes_in_c; i++) {
      c |=
        BigInt(serialized_qfi[i + 8 + bytes_in_a + bytes_in_b]!) <<
        BigInt(i * 8);
    }
    if (is_a_negative) a = -a;
    if (is_b_negative) b = -b;
    if (is_c_negative) c = -c;
    return new QFI(a, b, c);
  }
}
