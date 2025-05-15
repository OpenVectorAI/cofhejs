import type { ICryptoSystem } from '../cryptosystems/ICryptoSystem.js';
import type { Reencryptor } from '../utils/reencryptor.js';
import type {
  ComputeRequest,
  ComputeResponse,
} from './ComputeRequestResponse.js';
import type { NetworkDetails } from './NetworkDetails.js';

export interface Computer {
  usable: boolean;
  connect(): Promise<void>;
  compute(req: ComputeRequest): Promise<ComputeResponse>;
  fetch_network_details(): Promise<NetworkDetails>;
}

export class ClientNode<
  SecretKey,
  SecretKeyShare,
  PublicKey,
  PlainText,
  CipherText,
  PartialDecryptionResult,
  PKCSecretKey,
  PKCPublicKey,
> {
  private cryptosystem_m: ICryptoSystem<
    SecretKey,
    SecretKeyShare,
    PublicKey,
    PlainText,
    CipherText,
    PartialDecryptionResult
  >;
  private reencryptor_m: Reencryptor<
    CipherText,
    PlainText,
    PartialDecryptionResult,
    PKCSecretKey,
    PKCPublicKey
  >;
  private network_encryption_key_m: PublicKey;
  private computer_m: Computer | null;

  constructor(
    cryptosystem: ICryptoSystem<
      SecretKey,
      SecretKeyShare,
      PublicKey,
      PlainText,
      CipherText,
      PartialDecryptionResult
    >,
    reencryptor: Reencryptor<
      CipherText,
      PlainText,
      PartialDecryptionResult,
      PKCSecretKey,
      PKCPublicKey
    >,
    network_encryption_key: PublicKey,
    computer: Computer | null,
  ) {
    this.cryptosystem_m = cryptosystem;
    this.reencryptor_m = reencryptor;
    this.network_encryption_key_m = network_encryption_key;
    this.computer_m = computer;
  }

  public get cryptosystem(): ICryptoSystem<
    SecretKey,
    SecretKeyShare,
    PublicKey,
    PlainText,
    CipherText,
    PartialDecryptionResult
  > {
    return this.cryptosystem_m;
  }

  public get reencryptor(): Reencryptor<
    CipherText,
    PlainText,
    PartialDecryptionResult,
    PKCSecretKey,
    PKCPublicKey
  > {
    return this.reencryptor_m;
  }

  public get network_encryption_key(): PublicKey {
    return this.network_encryption_key_m;
  }

  public async compute(req: ComputeRequest): Promise<ComputeResponse> {
    if (this.computer_m === null) {
      throw new Error('Computer is not set');
    }
    return await this.computer_m.compute(req);
  }
}
