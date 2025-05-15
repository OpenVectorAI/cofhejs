/**
 * Interface for a cryptographic system
 * @template SecretKey - The type of the secret key
 * @template SecretKeyShare - The type of the secret key share
 * @template PublicKey - The type of the public key
 * @template PlainText - The type of the plaintext
 * @template CipherText - The type of the ciphertext
 * @template PartialDecryptionResult - The type of the partial decryption result
 * @interface ICryptoSystem
 * @description This interface defines the methods and properties that a cryptographic system should implement.
 * It includes methods for encryption, decryption, serialization, and deserialization of keys and ciphertexts.
 * It also includes methods for converting between plaintext and ciphertext, and for combining partial decryptions.
 */
export interface ICryptoSystem<
  SecretKey,
  SecretKeyShare,
  PublicKey,
  PlainText,
  CipherText,
  PartialDecryptionResult,
> {
  /**
   * Generates a secret key
   * @returns A secret key
   */
  keygen(): SecretKey;

  /**
   * Generates a public key from a secret key
   * @param secret_key A secret key to be used for generating the public key
   * @returns A public key
   */
  keygen(secret_key: SecretKey): PublicKey;

  /**
   * Generates secret key shares from a secret key for threshold setting
   * @param secret_key A secret key to be used for generating the secret key shares
   * @param threshold The threshold for the secret key shares
   * @param total The total number of parties
   * @returns An array of arrays of secret key shares for each party for each threshold combination
   */
  keygen(
    secret_key: SecretKey,
    threshold: number,
    total: number,
  ): SecretKeyShare[][];

  /**
   * Converts normal float number to a plaintext object
   * @param value  A number to be converted to a plaintext
   * @returns A plaintext object
   * @throws TypeError if the value is not a number
   * @throws RangeError if the value is not in the range of the plaintext
   */
  make_plaintext: (value: bigint) => PlainText;
  /**
   *
   * Converts a plaintext object to a normal float number
   * @param plaintext A plaintext object to be converted to a number
   * @returns A number
   * @throws TypeError if the plaintext is not a correct plaintext object
   */
  get_plaintext_value: (plaintext: PlainText) => number;
  /**
   * Encrypts a plaintext object using the public key
   * @param pk A public key to be used for encryption
   * @param plaintext A plaintext object to be encrypted
   * @returns A ciphertext object
   * @throws TypeError if the plaintext is not a correct plaintext object or/and the public key is not a correct public key object
   */
  encrypt: (pk: PublicKey, pt: PlainText) => CipherText;
  /**
   * Combine partial decryptions to get the final plaintext
   * @param ciphertext A ciphertext object to be decrypted
   * @param partial_decryptions An array of partial decryptions to be combined
   * @returns A plaintext object
   * @throws TypeError if the ciphertext is not a correct ciphertext object or/and the partial decryptions are not correct partial decryption objects
   * @throws CoFHEValueError if the partial decryptions are not correct partial decryption objects
   */
  combine_partial_decryption_results: (
    ciphertext: CipherText,
    partial_decryptions: PartialDecryptionResult[],
  ) => PlainText;
  /**
   * Deserializes a secret key from a byte array
   * @param serialized_secret_key A byte array to be deserialized
   * @returns A secret key object
   * @throws TypeError if the byte array is not a correct byte array
   * @throws CoFHEValueError if the byte array is not a correct byte array
   */
  deserialize_public_key: (serialized_pub_key: Uint8Array) => PublicKey;
  /**
   * Serializes a ciphertext to a byte array
   * @param ciphertext A ciphertext object to be serialized
   * @returns A byte array
   * @throws TypeError if the ciphertext is not a correct ciphertext object
   */
  serialize_ciphertext: (ciphertext: CipherText) => Uint8Array;
  /**
   * Deserializes a ciphertext from a byte array
   * @param serialized_ciphertext A byte array to be deserialized
   * @returns A ciphertext object
   * @throws TypeError if the byte array is not a correct byte array
   */
  deserialize_ciphertext: (serialized_ciphertext: Uint8Array) => CipherText;
  /**
   * Serializes a partial decryption result to a byte array
   * @param partial_decryption_result A partial decryption result to be serialized
   * @returns A byte array
   * @throws TypeError if the partial decryption result is not a correct partial decryption result object
   */
  serialize_partial_decryption_result: (
    partial_decryption_result: PartialDecryptionResult,
  ) => Uint8Array;
  /**
   * Deserializes a partial decryption result from a byte array
   * @param serialized_partial_decryption_result A byte array to be deserialized
   * @throws TypeError if the byte array is not a correct byte array
   * @throws CoFHEValueError if the byte array is not a correct byte array
   */
  deserialize_partial_decryption_result: (
    serialized_partial_decryption_result: Uint8Array,
  ) => PartialDecryptionResult;
  //todo : add more other methods
}
