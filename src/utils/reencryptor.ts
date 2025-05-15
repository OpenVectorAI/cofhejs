export interface PKCEncryptor<
  PKCSecretKey,
  PKCPublicKey,
  PKCPlainText,
  PKCCipherText,
> {
  encrypt: (pk: PKCPublicKey, pt: PKCPlainText) => Promise<PKCCipherText>;
  decrypt: (sk: PKCSecretKey, ct: PKCCipherText) => Promise<PKCPlainText>;
  generate_key: () => Promise<{
    public_key: PKCPublicKey;
    secret_key: PKCSecretKey;
  }>;
  serialize_public_key: (pk: PKCPublicKey) => Promise<Uint8Array>;
  serialize_secret_key: (sk: PKCSecretKey) => Promise<Uint8Array>;
  deserialize_public_key: (
    serialized_pub_key: Uint8Array,
  ) => Promise<PKCPublicKey>;
  deserialize_secret_key: (
    serialized_secret_key: Uint8Array,
  ) => Promise<PKCSecretKey>;
}

export interface Reencryptor<
  CipherText,
  PlainText,
  PartialDecryptionResult,
  PKCSecretKey,
  PKCPublicKey,
> {
  reencrypt: (
    partial_decryption_result: PartialDecryptionResult,
    pkc_public_key: PKCPublicKey,
  ) => Promise<Uint8Array>;

  decrypt: (
    reencrypted_partial_decryption_results: Uint8Array[],
    ct: CipherText,
    reencryption_private_key: PKCSecretKey,
  ) => Promise<PlainText>;

  generate_reencryption_key_pair(): Promise<{
    public_key: PKCPublicKey;
    secret_key: PKCSecretKey;
  }>;
  serialize_reencryption_private_key: (sk: PKCSecretKey) => Promise<Uint8Array>;
  serialize_reencryption_public_key: (pk: PKCPublicKey) => Promise<Uint8Array>;
  deserialize_reencryption_private_key: (
    serialized_reencryption_private_key: Uint8Array,
  ) => Promise<PKCSecretKey>;
  deserialize_reencryption_public_key: (
    serialized_reencryption_public_key: Uint8Array,
  ) => Promise<PKCPublicKey>;

  concatenate_reencrypted_partial_decryption_results: (
    reencrypted_partial_decryption_results: Uint8Array[],
  ) => Promise<Uint8Array>;
  split_reencrypted_partial_decryption_results: (
    reencrypted_partial_decryption_results: Uint8Array,
  ) => Promise<Uint8Array[]>;
}
