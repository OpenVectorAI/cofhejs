import { CPUCryptoSystem } from '../cryptosystems/index.js';
import {
  CLHSM2kSecretKey,
  CLHSM2kPublicKey,
  CLHSM2kCleartext,
  CLHSM2kCiphertext,
} from '../cryptosystems/CPUCryptoSystem/CPUCryptoSystem.js';
import type {
  CLHSM2kSecretKeyShare,
  CLHSM2kPartialDecryptionResult,
} from '../cryptosystems/CPUCryptoSystem/CPUCryptoSystem.js';
import { CPURSAReencryptor, RSAEncryptor } from '../utils/rsa.js';
import type {
  RSAEncryptorPrivateKey,
  RSAEncryptorPublicKey,
} from '../utils/rsa.js';

import { ClientNode, type Computer } from './ClientNode.js';

export class CPUCryptoSystemRSAReencryptorClientNode extends ClientNode<
  CLHSM2kSecretKey,
  CLHSM2kSecretKeyShare,
  CLHSM2kPublicKey,
  CLHSM2kCleartext,
  CLHSM2kCiphertext,
  CLHSM2kPartialDecryptionResult,
  RSAEncryptorPrivateKey,
  RSAEncryptorPublicKey
> {
  constructor(
    security_level: number,
    k: number,
    N: string,
    reencryptor_key_size: number,
    computer: Computer | null,
    network_encryption_key: Uint8Array,
    cl_delta_k_class_number: bigint = 0n,
  ) {
    const cs = CPUCryptoSystem.create_from_n(
      BigInt(N),
      k,
      cl_delta_k_class_number,
    );
    super(
      cs,
      new CPURSAReencryptor(new RSAEncryptor(reencryptor_key_size), cs),
      cs.deserialize_public_key(network_encryption_key),
      computer,
    );
  }
}

export async function make_cpu_crypto_system_rsa_reencryptor_client_node(
  computer: Computer,
  cl_delta_k_class_number: bigint = 0n,
): Promise<CPUCryptoSystemRSAReencryptorClientNode> {
  const network_details = await computer.fetch_network_details();
  return new CPUCryptoSystemRSAReencryptorClientNode(
    network_details.cryptosystem_details.security_level,
    network_details.cryptosystem_details.k,
    network_details.cryptosystem_details.N,
    network_details.reencryption_details.key_size,
    computer,
    network_details.cryptosystem_details.public_key,
    cl_delta_k_class_number,
  );
}
