import { describe, test, expect } from 'vitest';
import { RandGen } from '../../../../src/cryptosystems/CPUCryptoSystem/internals/randgen';
import {
  is_prime,
  nbits,
} from '../../../../src/cryptosystems/CPUCryptoSystem/internals/bigint_utils';

const ITERATIONS_FOR_VARIABILITY = 30; // Number of times to call for variabiltesty checks
const ITERATIONS_FOR_DISTRIBUTION = 100; // For checking if bool produces both true/false

describe('RandGen (using environment crypto)', () => {
  describe('constructor', () => {
    test('should instantiate With secure=true if crypto is available', () => {
      if (
        typeof crypto !== 'undefined' &&
        typeof crypto.getRandomValues === 'function'
      ) {
        expect(() => new RandGen(true)).not.toThrow();
      } else {
        expect(() => new RandGen(true)).toThrow(
          'Secure random number generation is not supported in this environment.',
        );
      }
    });

    test('should instantiate With secure=false regardless of crypto availabiltesty', () => {
      expect(() => new RandGen(false)).not.toThrow();
    });

    test('should instantiate With default secure settings (adapts to crypto availabiltesty)', () => {
      expect(() => new RandGen()).not.toThrow();
    });
  });

  const randGen = new RandGen();

  describe('random_bytes', () => {
    test('should return a Uint8Array of the specified length', () => {
      const length = 16;
      const bytes = randGen.random_bytes(length);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(length);
    });

    test('should return different byte arrays on subsequent calls', () => {
      const bytes1 = randGen.random_bytes(8);
      const bytes2 = randGen.random_bytes(8);
      expect(bytes1).not.toEqual(bytes2);
    });

    test('should return empty array for 0 length', () => {
      const bytes = randGen.random_bytes(0);
      expect(bytes.length).toBe(0);
    });
  });

  describe('random_bool', () => {
    test('should return a boolean', () => {
      expect(typeof randGen.random_bool()).toBe('boolean');
    });

    test('should be capable of returning both true and false over many calls', () => {
      const results = new Set<boolean>();
      for (let i = 0; i < ITERATIONS_FOR_DISTRIBUTION; i++) {
        results.add(randGen.random_bool());
        if (results.size === 2) break;
      }
      expect(results.has(true)).toBe(true);
      expect(results.has(false)).toBe(true);
      expect(results.size).toBe(2);
    });
  });

  describe('random_bigint', () => {
    test('should return 0n when n is 0n', () => {
      expect(randGen.random_bigint(0n)).toBe(0n);
    });

    test('should generate numbers Within the range [0, n]', () => {
      const nValues = [1n, 10n, BigInt(Date.now()), 2n ** 64n - 1n];
      for (const n of nValues) {
        for (let i = 0; i < ITERATIONS_FOR_VARIABILITY / 5; i++) {
          const result = randGen.random_bigint(n);
          expect(result).toBeTypeOf('bigint');
          expect(result >= 0n).toBe(true);
          expect(result <= n).toBe(true);
        }
      }
    });

    test('should generate different numbers on subsequent calls (for n > 0)', () => {
      const n = 100000n;
      const results = new Set<bigint>();
      for (let i = 0; i < ITERATIONS_FOR_VARIABILITY; i++) {
        results.add(randGen.random_bigint(n));
      }
      // Expect high variabiltesty With real crypto for a decent range
      expect(results.size).toBeGreaterThan(ITERATIONS_FOR_VARIABILITY / 2);
      expect(results.size).toBe(ITERATIONS_FOR_VARIABILITY); // Ideally all unique
    });
  });

  describe('random_bigint_2exp', () => {
    test('should generate numbers Within the range [0, 2^exp]', () => {
      const exponents = [0, 1, 8, 16, 32]; // Test various exponent sizes
      for (const exp of exponents) {
        const upper_bound = 2n ** BigInt(exp);
        for (let i = 0; i < ITERATIONS_FOR_VARIABILITY / 5; i++) {
          const result = randGen.random_bigint_2exp(exp);
          expect(result).toBeTypeOf('bigint');
          expect(result >= 0n).toBe(true);
          expect(result <= upper_bound).toBe(true);
        }
      }
    });

    test('should generate different numbers on subsequent calls', () => {
      const exp = 20;
      const results = new Set<bigint>();
      for (let i = 0; i < ITERATIONS_FOR_VARIABILITY; i++) {
        results.add(randGen.random_bigint_2exp(exp));
      }
      expect(results.size).toBeGreaterThan(ITERATIONS_FOR_VARIABILITY / 2);
      expect(results.size).toBe(ITERATIONS_FOR_VARIABILITY); // Ideally all unique
    });
  });

  describe('random_prime', () => {
    test('should throw an error for nbits_ <= 0', () => {
      expect(() => randGen.random_prime(0)).toThrow(
        'nbits_ must be greater than 0',
      );
      expect(() => randGen.random_prime(-1)).toThrow(
        'nbits_ must be greater than 0',
      );
    });
    test('should return 2n for nbits_ <= 1', () => {
      expect(randGen.random_prime(1)).toBe(2n);
    });

    test('should return 2n or 3n for nbits_ === 2', () => {
      const results = new Set<bigint>();
      for (let i = 0; i < ITERATIONS_FOR_DISTRIBUTION; i++) {
        results.add(randGen.random_prime(2));
        if (results.size === 2) break;
      }
      expect(results.has(2n)).toBe(true);
      expect(results.has(3n)).toBe(true);
      expect(results.size).toBe(2);
    });

    test('should generate a prime of exactly given nbits_ (takes time for larger bits)', () => {
      const bits = [4, 8, 12, 16];
      for (const bit of bits) {
        const primeTestiterations = bit < 16 ? 5 : 2;
        for (let i = 0; i < primeTestiterations; i++) {
          const p = randGen.random_prime(bit);
          expect(p).toBeTypeOf('bigint');
          expect(is_prime(p)).toBe(true);
          expect(nbits(p)).toBe(bit);
        }
      }
    }, 15000);

    test('should generate different primes on subsequent calls for nbits_ > 2', () => {
      const bits = 50; // A reasonably small bit size for faster testing
      const results = new Set<bigint>();
      for (let i = 0; i < ITERATIONS_FOR_VARIABILITY / 2; i++) {
        // Fewer iterations for prime
        results.add(randGen.random_prime(bits));
      }
      expect(results.size).toBeGreaterThan(1);
      // With real crypto, test's highly likely they are all unique
      expect(results.size).toBe(ITERATIONS_FOR_VARIABILITY / 2);
    }, 10000); // Timeout for multiple prime generations
  });
});
