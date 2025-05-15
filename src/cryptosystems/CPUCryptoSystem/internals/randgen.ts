import { nbits, next_prime, setbit } from './bigint_utils.js';
import { randomProvider, secureProviderAvailable } from './rand.js';

export class RandGen {
  constructor(secure: boolean = secureProviderAvailable) {
    if (secure && !secureProviderAvailable) {
      throw new Error(
        'Secure random number generation is not supported in this environment.',
      );
    }
  }

  // Generates a random number in the range [0, n]
  public random_bigint(n: bigint): bigint {
    if (n < 0n) {
      throw new Error('n must be greater than or equal to 0');
    }
    if (n === 0n) {
      return 0n;
    }
    const bytes = RandGen.get_bytes(Math.ceil(nbits(n) / 8));
    let result = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
      result = (result << BigInt(8)) | BigInt(bytes[i]!);
    }
    return result % (n + 1n);
  }

  // Generates a random number in the range [0, 2^n]
  public random_bigint_2exp(n: number): bigint {
    return this.random_bigint(BigInt(2n ** BigInt(n)));
  }

  public random_bytes(n: number): Uint8Array {
    if (n < 0) {
      throw new Error('n must be greater than or equal to 0');
    }
    if (n > 65536) {
      throw new Error('n must be less than 65536');
    }
    if (n === 0) {
      return new Uint8Array(0);
    }
    return RandGen.get_bytes(n);
  }

  public random_bool(): boolean {
    const bytes = RandGen.get_bytes(1);
    return bytes[0]! % 2 === 0;
  }

  public random_prime(nbits_: number): bigint {
    if (nbits_ <= 0) {
      throw new Error('nbits_ must be greater than 0');
    }
    if (nbits_ <= 1) return 2n;
    else if (nbits_ === 2) return this.random_bool() ? 3n : 2n;
    else {
      let p: bigint;
      do {
        p = this.random_bigint_2exp(nbits_);
        setbit(p, nbits_ - 1);
        p = next_prime(p);
      } while (nbits(p) !== nbits_);
      return p;
    }
  }

  private static get_bytes(n: number): Uint8Array {
    const randomBytes = new Uint8Array(n);
    randomProvider.getRandomValues(randomBytes);
    return randomBytes;
  }
}
