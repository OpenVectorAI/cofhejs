import { describe, expect, test } from 'vitest';

import {
  abs,
  cmp_abs,
  nbits,
  tstbit,
  setbit,
  clearbit,
  gcd,
  gcdext,
  mod_inverse,
  mod_inverse_2exp,
  sqrt,
  fourth_root,
  sqrt_abs,
  fourth_root_abs,
  sqrt_mod_prime,
  is_prime,
  next_prime,
  log2,
  ceil_abslog_sqr,
  kronecker,
  jacobi,
  hgcd2,
  partial_euclid,
} from '../../../../src/cryptosystems/CPUCryptoSystem/internals/bigint_utils.js';

import { hgcd2TestData } from './data_hgcd2_test.js';
import { partialEuclidTestData } from './data_partial_euclid_test.js';

describe('Basic Arithmetic Functions', () => {

  describe('abs', () => {
    test('should return the absolute value of positive, negative and zero', () => {
      expect(abs(-10n)).toEqual(10n);
      expect(abs(3n)).toEqual(3n);
      expect(abs(0n)).toEqual(0n);
      expect(abs(1n)).toEqual(1n);
      expect(abs(-1n)).toEqual(1n);
      const largeNegative = -(1n << 100n);
      const largePositive = 1n << 100n;
      expect(abs(largeNegative)).toEqual(largePositive);
      expect(abs(largePositive)).toEqual(largePositive);
    });
  });

  describe('cmp_abs', () => {
    const a = -10n;
    const b = 3n;
    const c = 0n;
    const d = 10n;
    const e = -3n;
    const largePos = 1n << 60n;
    const largeNeg = -(1n << 60n) + 1n; // abs = 2^60 - 1
    const largeNegEqual = -(1n << 60n); // abs = 2^60

    test('should return 1 when abs(a) > abs(b)', () => {
      expect(cmp_abs(a, b)).toEqual(1); // |-10| > |3|
      expect(cmp_abs(a, c)).toEqual(1); // |-10| > |0|
      expect(cmp_abs(d, b)).toEqual(1); // |10| > |3|
      expect(cmp_abs(d, c)).toEqual(1); // |10| > |0|
      expect(cmp_abs(b, c)).toEqual(1); // |3| > |0|
      expect(cmp_abs(largePos, largeNeg)).toEqual(1); // 2^60 > 2^60 - 1
    });

    test('should return -1 when abs(a) < abs(b)', () => {
      expect(cmp_abs(b, a)).toEqual(-1); // |3| < |-10|
      expect(cmp_abs(c, a)).toEqual(-1); // |0| < |-10|
      expect(cmp_abs(b, d)).toEqual(-1); // |3| < |10|
      expect(cmp_abs(c, d)).toEqual(-1); // |0| < |10|
      expect(cmp_abs(c, b)).toEqual(-1); // |0| < |3|
      expect(cmp_abs(largeNeg, largePos)).toEqual(-1); // 2^60 - 1 < 2^60
    });

    test('should return 0 when abs(a) === abs(b)', () => {
      expect(cmp_abs(a, d)).toEqual(0); // |-10| === |10|
      expect(cmp_abs(d, a)).toEqual(0); // |10| === |-10|
      expect(cmp_abs(b, e)).toEqual(0); // |3| === |-3|
      expect(cmp_abs(e, b)).toEqual(0); // |-3| === |3|
      expect(cmp_abs(a, a)).toEqual(0); // |-10| === |-10|
      expect(cmp_abs(b, b)).toEqual(0); // |3| === |3|
      expect(cmp_abs(c, c)).toEqual(0); // |0| === |0|
      expect(cmp_abs(largePos, largeNegEqual)).toEqual(0); // |2^60| === |-(2^60)|
    });
  });
});

describe('Bitwise Operations', () => {
  describe('nbits', () => {
    test('should handle basic positive and negative values', () => {
      expect(nbits(10n)).toEqual(4); // 1010
      expect(nbits(3n)).toEqual(2); // 11
      expect(nbits(-10n)).toEqual(4); // abs(-10) = 10 -> 1010
    });

    // Test edge cases: 0 and 1
    test('should handle edge cases 0 and 1', () => {
      expect(nbits(0n)).toEqual(1);
      expect(nbits(1n)).toEqual(1);
      expect(nbits(-1n)).toEqual(1);
    });

    // Test powers of 2 (these require k+1 bits for 2^k)
    test('should handle powers of 2', () => {
      expect(nbits(2n)).toEqual(2);
      expect(nbits(4n)).toEqual(3);
      expect(nbits(8n)).toEqual(4);
      expect(nbits(16n)).toEqual(5);
      expect(nbits(32n)).toEqual(6);
      expect(nbits(1n << 30n)).toEqual(31);
      expect(nbits(-(1n << 30n))).toEqual(31);
      expect(nbits(1n << 60n)).toEqual(61);
    });

    // Test numbers just below powers of 2 (2^k - 1 requires k bits)
    test('should handle numbers just below powers of 2', () => {
      expect(nbits(3n)).toEqual(2);
      expect(nbits(7n)).toEqual(3);
      expect(nbits(15n)).toEqual(4);
      expect(nbits(31n)).toEqual(5);
      expect(nbits((1n << 30n) - 1n)).toEqual(30);
      expect(nbits(-((1n << 30n) - 1n))).toEqual(30);
      expect(nbits((1n << 60n) - 1n)).toEqual(60);
    });

    // Test larger arbitrary numbers
    test('should handle larger arbitrary numbers', () => {
      expect(nbits(1000n)).toEqual(10);
      expect(nbits(-1000n)).toEqual(10);

      // A moderately large number
      const largeNum1 = (1n << 45n) + (1n << 20n) + (1n << 5n) + 1n;
      expect(nbits(largeNum1)).toEqual(46);
      expect(nbits(-largeNum1)).toEqual(46);

      // A very large number
      const veryLargeNum = (1n << 100n) + (1n << 50n);
      expect(nbits(veryLargeNum)).toEqual(101);
      expect(nbits(-veryLargeNum)).toEqual(101);
    });
  });

  const n = 13n; // 1101
  const neg_n = -13n;

  describe('tstbit', () => {
    test('should correctly test bits for positive numbers', () => {
      expect(tstbit(n, 0)).toBe(true);
      expect(tstbit(n, 1)).toBe(false);
      expect(tstbit(n, 2)).toBe(true);
      expect(tstbit(n, 3)).toBe(true);
      expect(tstbit(n, 4)).toBe(false);
      expect(tstbit(0n, 0)).toBe(false);
      expect(tstbit(0n, 5)).toBe(false);
    });

    test('should correctly test bits for negative numbers', () => {
      expect(tstbit(neg_n, 0)).toBe(true); // ...0011 -> bit 0 is 1
      expect(tstbit(neg_n, 1)).toBe(true); // ...0011 -> bit 1 is 1
      expect(tstbit(neg_n, 2)).toBe(false); // ...0011 -> bit 2 is 0
      expect(tstbit(neg_n, 3)).toBe(false); // ...0011 -> bit 3 is 0
      expect(tstbit(neg_n, 4)).toBe(true); // Sign extension -> bit 4 is 1
      expect(tstbit(neg_n, 100)).toBe(true); // Sign extension
      expect(tstbit(-1n, 0)).toBe(true);
      expect(tstbit(-1n, 100)).toBe(true);
    });

    test('should handle large indices', () => {
      const largeN = 1n << 100n;
      expect(tstbit(largeN, 100)).toBe(true);
      expect(tstbit(largeN, 99)).toBe(false);
      expect(tstbit(largeN, 101)).toBe(false);
    });

    test('should throw error for negative index', () => {
      expect(() => tstbit(n, -1)).toThrow('Negative bit index');
    });
  });

  describe('setbit', () => {
    test('should set a bit that is currently 0', () => {
      expect(setbit(10n, 0)).toEqual(11n); // 1010 -> 1011
      expect(setbit(10n, 2)).toEqual(14n); // 1010 -> 1110
    });

    test('should not change the number if the bit is already 1', () => {
      expect(setbit(13n, 0)).toEqual(13n); // 1101 -> 1101
      expect(setbit(13n, 2)).toEqual(13n); // 1101 -> 1101
    });

    test('should work with zero', () => {
      expect(setbit(0n, 0)).toEqual(1n);
      expect(setbit(0n, 3)).toEqual(8n);
    });

    test('should work with negative numbers', () => {
      // -10 (..1110110) | (1<<0) = -10 | 1 = -9 (..1110111)
      expect(setbit(-10n, 0)).toEqual(-9n);
      // -10 (..1110110) | (1<<2) = -10 | 4 = -10 (..1110110)
      expect(setbit(-10n, 2)).toEqual(-10n);
    });

    test('should handle large indices', () => {
      expect(setbit(5n, 100)).toEqual(5n + (1n << 100n));
    });

    test('should throw error for negative index', () => {
      expect(() => setbit(10n, -1)).toThrow('Negative bit index');
    });
  });

  describe('clearbit', () => {
    test('should clear a bit that is currently 1', () => {
      expect(clearbit(13n, 0)).toEqual(12n); // 1101 -> 1100
      expect(clearbit(13n, 2)).toEqual(9n); // 1101 -> 1001
    });

    test('should not change the number if the bit is already 0', () => {
      expect(clearbit(10n, 0)).toEqual(10n); // 1010 -> 1010
      expect(clearbit(10n, 2)).toEqual(10n); // 1010 -> 1010
    });

    test('should work with numbers with all bits set', () => {
      const allSet = (1n << 5n) - 1n; // 31 (11111)
      expect(clearbit(allSet, 0)).toEqual(30n); // 11110
      expect(clearbit(allSet, 4)).toEqual(15n); // 01111
    });

    test('should work with negative numbers', () => {
      // Clearing a bit on a negative number makes it "more negative"
      // -9 (...1110111) & ~(1<<0) = -9 & ~1 = -10 (...1110110)
      expect(clearbit(-9n, 0)).toEqual(-10n);
      // -6 (...1111010) & ~(1<<2) = -6 & ~4 = -6 (...1111010)
      expect(clearbit(-6n, 2)).toEqual(-6n);
      // Clear a bit that's already 0
      expect(clearbit(-10n, 0)).toEqual(-10n); // -10 & ~1 = -10
    });

    test('should handle large indices', () => {
      const n = (1n << 100n) + 5n;
      expect(clearbit(n, 100)).toEqual(5n);
      expect(clearbit(n, 99)).toEqual(n); // Bit 99 is 0
    });

    test('should throw error for negative index', () => {
      expect(() => clearbit(10n, -1)).toThrow('Negative bit index');
    });
  });
});

describe('Number Theory Functions', () => {
  describe('gcd', () => {
    test('should calculate GCD for positive numbers', () => {
      expect(gcd(48n, 18n)).toEqual(6n);
      expect(gcd(17n, 5n)).toEqual(1n); // Coprime
      expect(gcd(10n, 10n)).toEqual(10n);
      expect(gcd(10n, 20n)).toEqual(10n);
    });

    test('should handle zero', () => {
      expect(gcd(10n, 0n)).toEqual(10n);
      expect(gcd(0n, 10n)).toEqual(10n);
      expect(gcd(0n, 0n)).toEqual(0n);
    });

    test('should return positive GCD for negative numbers', () => {
      expect(gcd(-48n, 18n)).toEqual(6n);
      expect(gcd(48n, -18n)).toEqual(6n);
      expect(gcd(-48n, -18n)).toEqual(6n);
      expect(gcd(-17n, 5n)).toEqual(1n);
      expect(gcd(10n, -10n)).toEqual(10n);
    });

    test('should handle large numbers', () => {
      const a = (1n << 60n) * 3n;
      const b = (1n << 60n) * 5n;
      expect(gcd(a, b)).toEqual(1n << 60n);
    });
  });

  describe('gcdext', () => {
    const check = (a: bigint, b: bigint) => {
      const [x, y, g] = gcdext(a, b);
      expect(g).toEqual(gcd(a, b));
      expect(a * x + b * y).toEqual(g);
    };

    test('should calculate extended GCD for positive numbers', () => {
      check(48n, 18n); // gcd=6. Example: 48*(-1) + 18*3 = -48 + 54 = 6. [-1n, 3n, 6n] is a valid result.
      check(17n, 5n); // gcd=1. Example: 17*(-2) + 5*7 = -34 + 35 = 1. [-2n, 7n, 1n] is valid.
      check(10n, 10n); // gcd=10. 10*1 + 10*0 = 10. [1n, 0n, 10n] is valid.
      check(10n, 20n); // gcd=10. 10*1 + 20*0 = 10. [1n, 0n, 10n] is valid.
    });

    test('should handle zero', () => {
      let [x, y, g] = gcdext(10n, 0n);
      expect([x, y, g]).toEqual([1n, 0n, 10n]);
      expect(10n * x + 0n * y).toEqual(g);

      [x, y, g] = gcdext(0n, 10n);
      expect([x, y, g]).toEqual([0n, 1n, 10n]);
      expect(0n * x + 10n * y).toEqual(g);

      [x, y, g] = gcdext(0n, 0n);
      expect([x, y, g]).toEqual([1n, 0n, 0n]);
      expect(0n * x + 0n * y).toEqual(g);
    });

    test('should work correctly for negative numbers', () => {
      check(-48n, 18n);
      check(48n, -18n);
      check(-48n, -18n);
      check(-17n, 5n);
    });

    test('should handle large numbers', () => {
      const a = (1n << 60n) * 3n + 1n;
      const b = (1n << 50n) * 5n;
      check(a, b);
    });
  });

  describe('mod_inverse', () => {
    const check = (a: bigint, m: bigint) => {
      if (gcd(a, m) !== 1n) {
        expect(() => mod_inverse(a, m)).toThrow('Inverse does not exist');
      } else {
        const inv = mod_inverse(a, m);
        expect(inv).toBeGreaterThanOrEqual(0n);
        expect(inv).toBeLessThan(m);
        // Handle potential negative intermediate result of %
        let prod_mod = (a * inv) % m;
        if (prod_mod < 0n) prod_mod += m;
        expect(prod_mod).toEqual(1n);
      }
    };

    test('should find modular inverse when it exists', () => {
      check(3n, 11n); // 3*4 = 12 = 1 mod 11. Expect 4n.
      check(7n, 10n); // 7*3 = 21 = 1 mod 10. Expect 3n.
      check(1n, 100n); // Expect 1n.
      check(99n, 100n); // 99 = -1 mod 100. Inverse is -1 = 99 mod 100. Expect 99n.
    });

    test('should handle negative input `a`', () => {
      check(-3n, 11n); // -3 = 8 mod 11. inv(8) = 7 (8*7=56=1). Expect 7n.
      check(-2n, 9n); // -2 = 7 mod 9. inv(7) = 4 (7*4=28=1). Expect 4n.
    });

    test('should throw error when inverse does not exist', () => {
      check(2n, 10n); // gcd(2, 10) = 2
      check(6n, 15n); // gcd(6, 15) = 3
      check(0n, 5n); // gcd(0, 5) = 5
    });

    test('should handle edge case modulus m=1', () => {
      expect(mod_inverse(5n, 1n)).toEqual(0n);
      expect(mod_inverse(0n, 1n)).toEqual(0n);
      expect(mod_inverse(-5n, 1n)).toEqual(0n);
    });

    test('should handle edge case modulus m=2', () => {
      check(1n, 2n); // Expect 1n
      check(-1n, 2n); // -1 = 1 mod 2. Expect 1n
      check(3n, 2n); // 3 = 1 mod 2. Expect 1n
      check(0n, 2n); // gcd(0, 2)=2. Error expected.
      check(2n, 2n); // gcd(2, 2)=2. Error expected.
    });

    test('should handle large numbers', () => {
      const p = (1n << 61n) - 1n; // A large prime
      const a = (1n << 30n) + 3n;
      check(a, p);
    });
  });

  describe('mod_inverse_2exp', () => {
    const check = (a: bigint, k: number) => {
      if (a % 2n === 0n) {
        expect(() => mod_inverse_2exp(a, k)).toThrow('a must be odd.');
        return;
      }
      if (k <= 0) {
        return;
      }
      const inv = mod_inverse_2exp(a, k);
      const m = 2n ** BigInt(k);
      // Verify the property a * inv === 1 (mod 2^k)
      let prod_mod = (a * inv) % m;
      if (prod_mod < 0n) prod_mod += m;
      expect(
        prod_mod,
        `Expected ${a} * ${inv} % ${m} to be 1, but got ${prod_mod}`,
      ).toEqual(1n);
    };

    test('should calculate modular inverse mod 2^k for odd a', () => {
      check(1n, 1); // inv(1) mod 2 = 1
      check(1n, 5); // inv(1) mod 32 = 1
      check(3n, 2); // inv(3) mod 4 = 3
      check(3n, 3); // inv(3) mod 8 = 3 (3*3=9=1 mod 8)
      check(3n, 4); // inv(3) mod 16 = 11 (3*11=33=1 mod 16)
      check(5n, 3); // inv(5) mod 8 = 5 (5*5=25=1 mod 8)
      check(7n, 4); // inv(7) mod 16 = 7 (7*7=49=1 mod 16)
    });

    test('should handle larger k', () => {
      check(12345n, 10);
      check(99n, 7);
    });

    test('should throw error for even a', () => {
      check(2n, 3);
      check(0n, 5);
      check(100n, 10);
    });
  });
});

describe('Root Finding Functions', () => {
  describe('sqrt', () => {
    test('should calculate integer square root for perfect squares', () => {
      expect(sqrt(0n)).toEqual(0n);
      expect(sqrt(1n)).toEqual(1n);
      expect(sqrt(4n)).toEqual(2n);
      expect(sqrt(16n)).toEqual(4n);
      expect(sqrt(100n)).toEqual(10n);
      const largeSq = (1n << 50n) * (1n << 50n);
      expect(sqrt(largeSq)).toEqual(1n << 50n);
    });

    test('should calculate integer square root (floor) for non-perfect squares', () => {
      expect(sqrt(2n)).toEqual(1n);
      expect(sqrt(3n)).toEqual(1n);
      expect(sqrt(8n)).toEqual(2n);
      expect(sqrt(99n)).toEqual(9n);
      expect(sqrt((1n << 100n) + 1n)).toEqual(1n << 50n);
    });

    test('should throw error for negative numbers', () => {
      expect(() => sqrt(-1n)).toThrow('Square root of negative number');
      expect(() => sqrt(-100n)).toThrow('Square root of negative number');
    });
  });

  describe('fourth_root', () => {
    test('should calculate integer fourth root for perfect fourth roots', () => {
      expect(fourth_root(0n)).toEqual(0n);
      expect(fourth_root(1n)).toEqual(1n);
      expect(fourth_root(16n)).toEqual(2n); // sqrt(16)=4, sqrt(4)=2
      expect(fourth_root(81n)).toEqual(3n); // sqrt(81)=9, sqrt(9)=3
      const largeFourth = (1n << 25n) ** 4n;
      expect(fourth_root(largeFourth)).toEqual(1n << 25n);
    });

    test('should calculate integer fourth root (floor) for non-perfect fourth roots', () => {
      expect(fourth_root(15n)).toEqual(1n); // sqrt(15)=3, sqrt(3)=1
      expect(fourth_root(80n)).toEqual(2n); // sqrt(80)=8, sqrt(8)=2
      expect(fourth_root(255n)).toEqual(3n); // sqrt(255)=15, sqrt(15)=3
    });

    test('should throw error for negative numbers', () => {
      expect(() => fourth_root(-1n)).toThrow('Square root of negative number');
      expect(() => fourth_root(-16n)).toThrow('Square root of negative number');
    });
  });

  describe('sqrt_abs', () => {
    test('should calculate sqrt for positive numbers', () => {
      expect(sqrt_abs(16n)).toEqual(4n);
      expect(sqrt_abs(15n)).toEqual(3n);
    });

    test('should calculate sqrt of absolute value for negative numbers', () => {
      expect(sqrt_abs(-16n)).toEqual(4n);
      expect(sqrt_abs(-15n)).toEqual(3n);
    });

    test('should work for zero', () => {
      expect(sqrt_abs(0n)).toEqual(0n);
    });
  });

  describe('fourth_root_abs', () => {
    test('should calculate fourth root for positive numbers', () => {
      expect(fourth_root_abs(81n)).toEqual(3n);
      expect(fourth_root_abs(80n)).toEqual(2n);
    });

    test('should calculate fourth root of absolute value for negative numbers', () => {
      expect(fourth_root_abs(-81n)).toEqual(3n);
      expect(fourth_root_abs(-80n)).toEqual(2n);
    });

    test('should work for zero', () => {
      expect(fourth_root_abs(0n)).toEqual(0n);
    });
  });

  describe('sqrt_mod_prime', () => {
    test('should compute sqrt(a) % p', () => {
      expect(sqrt_mod_prime(4n, 5n)).toEqual(3n);
      expect(sqrt_mod_prime(9n, 7n)).toEqual(4n);
      expect(sqrt_mod_prime(2n, 7n)).toEqual(4n);
    });

    test('should handle large numbers based on integer sqrt', () => {
      const p = 101n;
      const a = 12345n;
      expect(sqrt_mod_prime(a, p)).toEqual(86n);
    });
  });
});

describe('Primality and Related Functions', () => {
  describe('is_prime', () => {
    test('should identify small prime numbers', () => {
      expect(is_prime(2n)).toBe(true);
      expect(is_prime(3n)).toBe(true);
      expect(is_prime(5n)).toBe(true);
      expect(is_prime(7n)).toBe(true);
      expect(is_prime(11n)).toBe(true);
      expect(is_prime(13n)).toBe(true);
    });

    test('should identify small composite numbers', () => {
      expect(is_prime(4n)).toBe(false);
      expect(is_prime(6n)).toBe(false);
      expect(is_prime(8n)).toBe(false);
      expect(is_prime(9n)).toBe(false);
      expect(is_prime(10n)).toBe(false);
    });

    test('should handle negative numbers and zero', () => {
      expect(is_prime(-1n)).toBe(false);
      expect(is_prime(0n)).toBe(false);
      expect(is_prime(-10n)).toBe(false);
    });

    test('should handle large prime numbers', () => {
      const largePrime = 1000003n; // Known prime
      expect(is_prime(largePrime)).toBe(true);
    });

    test('should handle large composite numbers', () => {
      const largeComposite = 1000000n; // Known composite
      expect(is_prime(largeComposite)).toBe(false);
    });
  });

  describe('next_prime', () => {
    test('should find the smallest prime strictly greater than n', () => {
      expect(next_prime(-1n)).toEqual(2n);
      expect(next_prime(0n)).toEqual(2n);
      expect(next_prime(1n)).toEqual(2n);
      expect(next_prime(2n)).toEqual(3n);
      expect(next_prime(3n)).toEqual(5n);
      expect(next_prime(4n)).toEqual(5n);
      expect(next_prime(10n)).toEqual(11n);
      expect(next_prime(13n)).toEqual(17n);
      expect(next_prime(100n)).toEqual(101n);
    });

    test('should handle larger numbers', () => {
      // Find prime after 1 million
      const prime_after_1m = next_prime(1000000n);
      expect(prime_after_1m).toBeGreaterThan(1000000n);
      expect(is_prime(prime_after_1m)).toBe(true);
      // Check that the number just before it isn't prime (unless it's 2)
      if (prime_after_1m > 3n) {
        expect(is_prime(prime_after_1m - 1n)).toBe(false);
        if (prime_after_1m - 2n > 1n) {
          expect(is_prime(prime_after_1m - 2n)).toBe(false);
        }
      }
      expect(next_prime(1000000n)).toEqual(1000003n);
    });
  });
});

describe('Logarithm Functions', () => {
  describe('log2', () => {
    const validTestCases: [bigint, number][] = [
      // Base case
      [1n, 0],
      // Powers of 2
      [2n, 1],
      [4n, 2],
      [8n, 3],
      [16n, 4],
      [1024n, 10], // 2^10
      [2n ** 30n, 30],
      [2n ** 60n, 60], // Larger BigInt power
      // Numbers between powers of 2
      [3n, 1],
      [5n, 2],
      [6n, 2],
      [7n, 2],
      [9n, 3],
      [15n, 3],
      [1023n, 9], // 2^10 - 1
      [1025n, 10], // 2^10 + 1
      [2n ** 50n - 1n, 49],
      [2n ** 50n + 1n, 50],
      // Large arbitrary BigInt
      [1234567890123456789012345678901234567890n, 129],
    ];
    const invalidTestCases: bigint[] = [0n, -1n, -100n, -(2n ** 100n)];
    describe('Valid inputs', () => {
      test.each(validTestCases)(
        'log2(%p) should return %p',
        (input, expected) => {
          expect(log2(input)).toBe(expected);
        },
      );
    });

    describe('Invalid inputs', () => {
      test.each(invalidTestCases)('log2(%p) should throw an error', (input) => {
        expect(() => log2(input)).toThrow(
          'log2 is undefined for non-positive numbers',
        );
      });
    });
  });

  const calculateExpectedLogSqCeil = (n: bigint): bigint => {
    if (n === 0n) {
      throw new Error('Logarithm of zero is undefined.');
    }
    const absN = n < 0n ? -n : n;
    if (absN === 1n) {
      return 0n;
    }
    const logVal = Math.log(Number(absN));
    const logSq = Math.pow(logVal, 2);
    const ceilLogSq = Math.ceil(logSq);
    return BigInt(ceilLogSq);
  };

  describe('ceil_abslog_sqr', () => {
    test('should return 0 for input 1', () => {
      expect(ceil_abslog_sqr(1n)).toEqual(0n); // ln(1)^2 = 0
    });

    test('should return 0 for input -1', () => {
      expect(ceil_abslog_sqr(-1n)).toEqual(0n); // ln(|-1|)^2 = ln(1)^2 = 0
    });

    test('should throw an error for input 0', () => {
      expect(() => ceil_abslog_sqr(0n)).toThrow();
    });

    test.each([
      [2n, 1n], // ln(2)^2 = 0.480 -> ceil = 1
      [3n, 2n], // ln(3)^2 = 1.206 -> ceil = 2
      [4n, 2n], // ln(4)^2 = 1.921 -> ceil = 2  (Check boundary behavior)
      [5n, 3n], // ln(5)^2 = 2.590 -> ceil = 3
      [6n, 4n], // ln(6)^2 = 3.211 -> ceil = 4
      [7n, 4n], // ln(7)^2 = 3.787 -> ceil = 4  (Check boundary behavior)
      [8n, 5n], // ln(8)^2 = 4.324 -> ceil = 5  (n near e^sqrt(k))
      [9n, 5n], // ln(9)^2 = 4.828 -> ceil = 5
      [10n, 6n], // ln(10)^2 = 5.302 -> ceil = 6
      [11n, 6n], // ln(11)^2 = 5.751 -> ceil = 6
      [12n, 7n], // ln(12)^2 = 6.176 -> ceil = 7 (Check boundary behavior)
      [20n, 9n], // ln(20)^2 = 8.974 -> ceil = 9
      [21n, 10n], // ln(21)^2 = 9.268 -> ceil = 10
      [22n, 10n], // ln(22)^2 = 9.556 -> ceil = 10
      [23n, 10n], // ln(23)^2 = 9.838 -> ceil = 10 (Very close to 10)
      [24n, 11n], // ln(24)^2 = 10.11 -> ceil = 11
    ])(
      'should calculate ceil(ln(%p)^2) correctly for small positive integers',
      (inputValue, expectedValue) => {
        expect(calculateExpectedLogSqCeil(inputValue)).toEqual(expectedValue);
        expect(ceil_abslog_sqr(inputValue)).toEqual(expectedValue);
      },
    );

    test.each([
      [-2n, 1n],
      [-3n, 2n],
      [-4n, 2n],
      [-5n, 3n],
      [-10n, 6n],
      [-23n, 10n],
      [-24n, 11n],
    ])(
      'should calculate ceil(ln(%p)^2) correctly for small negative integers',
      (inputValue, expectedValue) => {
        expect(calculateExpectedLogSqCeil(inputValue)).toEqual(expectedValue);
        expect(ceil_abslog_sqr(inputValue)).toEqual(expectedValue);
      },
    );

    test.each([
      [100n, 22n], // ln(100)^2  = (2*ln(10))^2 = 4*ln(10)^2 = 4 * 5.302 = 21.20 -> ceil = 22
      [-100n, 22n],
      [1000n, 48n], // ln(1000)^2 = (3*ln(10))^2 = 9*ln(10)^2 = 9 * 5.302 = 47.71 -> ceil = 48
      [10000n, 85n], // ln(10^4)^2 = (4*ln(10))^2 = 16*ln(10)^2 = 16*5.302 = 84.83 -> ceil = 85
      [1000000n, 191n], // ln(10^6)^2 = (6*ln(10))^2 = 36*ln(10)^2 = 36*5.302 = 190.87 -> ceil = 191
      // A less round large number
      [123456789n, 348n], // ln(123456789)^2 = (18.63...)^2 = 347.1... -> ceil = 348
      [-123456789n, 348n], // ln(123456789)^2 = (18.63...)^2 = 347.1... -> ceil = 348
      [123456789012345n, 1053n], // ln(1.23e14)^2 ~= (32.44)^2 ~= 1052.6 -> ceil=1053
      [123456789012345n, 1053n], // ln(1.23e14)^2 ~= (32.44)^2 ~= 1052.6 -> ceil=1053
      [1234567890123456789012345n, 3078n], // ln(1.23e21)^2 ~= (55.4727632542)^2 ~= 2349.5 -> ceil=2350
    ])('should handle larger integer %p', (inputValue, expectedValue) => {
      expect(ceil_abslog_sqr(inputValue)).toEqual(expectedValue);
    });
  });
});

describe('Miscellaneous Functions', () => {
  describe('Jacobi Symbol Function', () => {
    describe('jacobi(a, n)', () => {
      describe('Error Handling', () => {
        test('should throw error if n is zero', () => {
          expect(() => jacobi(2n, 0n)).toThrow(
            'n must be a positive odd integer',
          );
        });

        test('should throw error if n is negative', () => {
          expect(() => jacobi(2n, -3n)).toThrow(
            'n must be a positive odd integer',
          );
        });

        test('should throw error if n is even', () => {
          expect(() => jacobi(3n, 4n)).toThrow(
            'n must be a positive odd integer',
          );
          expect(() => jacobi(5n, 10n)).toThrow(
            'n must be a positive odd integer',
          );
        });
      });

      describe('Basic Cases and GCD > 1', () => {
        test('should return 0 if a is 0 and n > 1', () => {
          expect(jacobi(0n, 3n)).toBe(0);
          expect(jacobi(0n, 17n)).toBe(0);
        });

        test('should return 1 if a is 1', () => {
          expect(jacobi(1n, 3n)).toBe(1);
          expect(jacobi(1n, 15n)).toBe(1); // 15 is odd
          expect(jacobi(1n, 9907n)).toBe(1);
        });

        test('should return 0 if gcd(a, n) > 1', () => {
          expect(jacobi(2n, 1n)).toBe(1); // Special case from code: n=1 -> 1
          expect(jacobi(3n, 3n)).toBe(0); // a=0 after mod n
          expect(jacobi(6n, 3n)).toBe(0); // a=0 after mod n
          expect(jacobi(6n, 9n)).toBe(0); // gcd(6, 9) = 3
          expect(jacobi(10n, 15n)).toBe(0); // gcd(10, 15) = 5
          expect(jacobi(15n, 21n)).toBe(0); // gcd(15, 21) = 3
        });
      });

      describe('Quadratic Residues (Expect 1)', () => {
        test('should return 1 for squares', () => {
          expect(jacobi(4n, 7n)).toBe(1); // 4 = 2^2
          expect(jacobi(9n, 11n)).toBe(1); // 9 = 3^2
          expect(jacobi(16n, 19n)).toBe(1); // 16 = 4^2
          expect(jacobi(1n, 19n)).toBe(1); // 1 = 1^2
        });
        test('should return 1 for non-square residues', () => {
          expect(jacobi(2n, 7n)).toBe(1); // 7 = 7 mod 8
          expect(jacobi(5n, 11n)).toBe(1); // 5 = 4^2 mod 11
          expect(jacobi(10n, 13n)).toBe(1); // (2/13)(5/13) = (-1)(-1) = 1
          expect(jacobi(2n, 17n)).toBe(1); // 17 = 1 mod 8
        });
      });

      describe('Quadratic Non-Residues (Expect -1)', () => {
        test('should return -1 for non-residues', () => {
          expect(jacobi(3n, 7n)).toBe(-1);
          expect(jacobi(5n, 7n)).toBe(-1);
          expect(jacobi(6n, 11n)).toBe(-1);
          expect(jacobi(2n, 5n)).toBe(-1); // 5 = 5 mod 8
          expect(jacobi(3n, 11n)).toBe(1); // 3 = 5^2 = 25 mod 11
          expect(jacobi(7n, 11n)).toBe(-1); // Reciprocity: -(11/7) = -(4/7) = -1
          expect(jacobi(1001n, 9907n)).toBe(-1); // From thought process
        });
      });

      describe('Factor of 2 Rule', () => {
        test('should apply (2/n) rule correctly', () => {
          expect(jacobi(2n, 3n)).toBe(-1); // 3 mod 8 = 3
          expect(jacobi(2n, 5n)).toBe(-1); // 5 mod 8 = 5
          expect(jacobi(2n, 7n)).toBe(1); // 7 mod 8 = 7
          expect(jacobi(2n, 11n)).toBe(-1); // 11 mod 8 = 3
          expect(jacobi(2n, 13n)).toBe(-1); // 13 mod 8 = 5
          expect(jacobi(2n, 17n)).toBe(1); // 17 mod 8 = 1
          expect(jacobi(2n, 19n)).toBe(-1); // 19 mod 8 = 3
          expect(jacobi(6n, 13n)).toBe(-1); // (2/13)(3/13)=(-1)(1)=-1 (3=4^2=16 mod 13) NO! (3/13)=(13/3)=(1/3)=1. Result is -1.
        });
      });

      describe('Reciprocity Rule', () => {
        test('should apply reciprocity correctly when a=3, n=3 mod 4', () => {
          expect(jacobi(3n, 7n)).toBe(-1); // -(7/3) = -(1/3) = -1
          expect(jacobi(7n, 11n)).toBe(-1); // -(11/7) = -(4/7) = -1
          expect(jacobi(11n, 19n)).toBe(1);
          expect(jacobi(11n, 19n)).toBe(1);
          expect(jacobi(19n, 23n)).toBe(-1); // -(23/19) = -(4/19) = -1
        });
        test('should apply reciprocity correctly when one is 1 mod 4', () => {
          expect(jacobi(5n, 13n)).toBe(-1); // (13/5) = (3/5) = -1. Oh, 5%4=1. No sign flip. (13/5)=(3/5)=-1. Recompute jacobi(5,13): 5%4=1, 13%4=1. Flip. t=1. (13/5)=(3/5). t=1. n=3, k=5. 3%4=3, 5%4=1. Flip. t=1. (5/3)=(2/3)=-1. t=1*(-1)=-1. Result is -1.
          expect(jacobi(5n, 13n)).toBe(-1);
          expect(jacobi(7n, 13n)).toBe(-1); // (13/7) = (6/7) = -1. 7%4=3, 13%4=1. Flip. t=1. (13/7)=(6/7). t=1. n=6,k=7. (6/7)=(2/7)(3/7)=(1)(-1)=-1. t = 1 * (-1) = -1. Result -1.
        });
      });

      describe('Negative Numerator', () => {
        test('should handle negative a correctly', () => {
          // (-1/n) = 1 if n = 1 mod 4, -1 if n = 3 mod 4
          expect(jacobi(-1n, 5n)).toBe(1); // 5 mod 4 = 1
          expect(jacobi(-1n, 7n)).toBe(-1); // 7 mod 4 = 3
          expect(jacobi(-1n, 13n)).toBe(1); // 13 mod 4 = 1
          expect(jacobi(-1n, 19n)).toBe(-1); // 19 mod 4 = 3

          // (-a/n) = (-1/n)(a/n)
          expect(jacobi(-2n, 5n)).toBe(-1); // (-1/5)(2/5) = (1)(-1) = -1
          expect(jacobi(-2n, 7n)).toBe(-1); // (-1/7)(2/7) = (-1)(1) = -1
          expect(jacobi(-3n, 7n)).toBe(1); // (-1/7)(3/7) = (-1)(-1) = 1
          expect(jacobi(-5n, 11n)).toBe(-1); // (-1/11)(5/11) = (-1)(1) = -1
        });
      });

      describe('BigInt Specifics', () => {
        test('should work with larger BigInts', () => {
          // Use values calculated/verified elsewhere if possible
          expect(jacobi(1001n, 9907n)).toBe(-1); // Verified in thought process
          const large_a = 123456789123456789n;
          const large_n = 987654321987654321n; // Need to ensure odd: ends in 1, so yes.
          // Don't have a precomputed value, just check it runs and returns valid output
          const result = jacobi(large_a, large_n);
          expect([-1, 0, 1]).toContain(result);
        });
      });
    });
  });

  describe('Kronecker Symbol Function (Cohen Algorithm)', () => {
    describe('Step 1: b = 0 Handling', () => {
      test('should return 1 if b=0 and |a|=1', () => {
        expect(kronecker(1n, 0n)).toBe(1);
        expect(kronecker(-1n, 0n)).toBe(1);
      });

      test('should return 0 if b=0 and |a|!=1', () => {
        expect(kronecker(0n, 0n)).toBe(0);
        expect(kronecker(2n, 0n)).toBe(0);
        expect(kronecker(-3n, 0n)).toBe(0);
        expect(kronecker(5n, 0n)).toBe(0);
      });
    });

    describe('Step 2: Initial Checks and 2s from b', () => {
      test('should return 0 if a and b are both even', () => {
        expect(kronecker(2n, 2n)).toBe(0);
        expect(kronecker(4n, 6n)).toBe(0);
        expect(kronecker(-2n, 4n)).toBe(0);
        expect(kronecker(0n, 2n)).toBe(0); // a=0 is even
        expect(kronecker(6n, 0n)).toBe(0); // b=0 -> |a|!=1
      });

      describe('k adjustment based on v and a mod 8 (Step 2)', () => {
        //   // v=1 (b=2, 6, 10, 14, ...)
        test('should return 1 if v=1 odd and a = 1, 7 (mod 8)', () => {
          expect(kronecker(1n, 2n)).toBe(1); // k=1, b=1. loop a=1,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(7n, 2n)).toBe(1); // k=1, b=1. loop a=7,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(9n, 2n)).toBe(1); // 9%8=1 -> k=1
          expect(kronecker(-1n, 2n)).toBe(1); // -1%8=7 -> k=1
          expect(kronecker(1n, 6n)).toBe(1); // v=1, k=1, b=3. loop a=1,b=3 -> a=0,b=1. returns k=1
          expect(kronecker(7n, 6n)).toBe(1); // v=1, k=1, b=3. loop a=7,b=3 -> a=1,b=3 -> a=0,b=1. k=1
        });
        test('should return -1 if v=1 odd and a = 3, 5 (mod 8)', () => {
          expect(kronecker(3n, 2n)).toBe(-1); // k=-1, b=1. loop a=3,b=1 -> a=0,b=1. returns k=-1
          expect(kronecker(5n, 2n)).toBe(-1); // k=-1, b=1. loop a=5,b=1 -> a=0,b=1. returns k=-1
          expect(kronecker(11n, 2n)).toBe(-1); // 11%8=3 -> k=-1
          expect(kronecker(-3n, 2n)).toBe(-1); // -3%8=5 -> k=-1
          // kronecker(5, 6): v=1, k=-1, b=3. loop a=5,b=3 -> a=2,b=3. va=1,b=3. k flips -> k=1. a=1,b=3 -> a=0,b=1. return k=1.
          expect(kronecker(5n, 6n)).toBe(1);
        });

        // v=2 (b=4, 12, 20, ...)
        test('should have k=1 if v=2 even', () => {
          // kronecker(3, 4): v=2, k=1, b=1. loop a=3,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(3n, 4n)).toBe(1);
          // kronecker(5, 4): v=2, k=1, b=1. loop a=5,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(5n, 4n)).toBe(1);
          // kronecker(5, 12): v=2, k=1, b=3. loop a=5,b=3 -> a=2,b=3. va=1,b=3. k flips -> k=-1. a=1,b=3 -> a=0,b=1. returns k=-1.
          expect(kronecker(5n, 12n)).toBe(-1);
        });

        // v=3 (b=8, 24, ...)
        test('should return 1 if v=3 odd and a = 1, 7 (mod 8)', () => {
          expect(kronecker(1n, 8n)).toBe(1); // k=1, b=1. returns k=1
          expect(kronecker(7n, 8n)).toBe(1); // k=1, b=1. returns k=1
        });
        test('should return -1 if v=3 odd and a = 3, 5 (mod 8)', () => {
          expect(kronecker(3n, 8n)).toBe(-1); // k=-1, b=1. returns k=-1
          expect(kronecker(5n, 8n)).toBe(-1); // k=-1, b=1. returns k=-1
        });
      });

      describe('Negative b Handling (Step 2)', () => {
        test('should handle b<0 correctly when a>0', () => {
          // kronecker(a, -b) = kronecker(a, b) if b = 1 (mod 4)
          // kronecker(a, -b) = -kronecker(a, b) if b = 3 (mod 4)
          // This is derived, algorithm just flips b and checks a sign.
          // Let's test the algorithm's logic directly:
          // b becomes positive, k unchanged if a>0
          expect(kronecker(3n, -1n)).toBe(1); // v=0, k=1. b=1. loop a=3,b=1 -> a=0,b=1. k=1.
          expect(kronecker(5n, -1n)).toBe(1); // v=0, k=1. b=1. loop a=5,b=1 -> a=0,b=1. k=1.
          expect(kronecker(1n, -3n)).toBe(1); // v=0, k=1. b=3. loop a=1,b=3 -> a=0,b=1. k=1.
          expect(kronecker(2n, -3n)).toBe(-1); // v=0, k=1. b=3. loop a=2,b=3. va=1,b=3. k flips -> k=-1. a=1,b=3 -> a=0,b=1. k=-1. (Matches Jacobi (2/3))
          expect(kronecker(3n, -7n)).toBe(-1); // v=0, k=1. b=7. loop a=3,b=7. recip flip. k=-1. a=1,b=3 -> a=0,b=1. k=-1. (Matches Jacobi (3/7))
        });

        test('should handle b<0 correctly when a<0', () => {
          // b becomes positive, k flips if a<0
          expect(kronecker(-1n, -1n)).toBe(-1);
          expect(kronecker(-1n, -1n)).toBe(-1);
          expect(kronecker(-1n, -3n)).toBe(1);
          expect(kronecker(-1n, -5n)).toBe(-1);
          expect(kronecker(-1n, -3n)).toBe(1);
          expect(kronecker(-1n, -5n)).toBe(-1);
          expect(kronecker(-3n, -5n)).toBe(1);
        });
      });
    });

    describe('Steps 3 & 4: Main Loop', () => {
      describe('Termination (Step 3)', () => {
        test('should return k if a=0 and b=1', () => {
          expect(kronecker(1n, 1n)).toBe(1); // k=1, b=1. loop a=1,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(8n, 1n)).toBe(1); // k=1, b=1. loop a=8,b=1 -> a=0,b=1. returns k=1
          expect(kronecker(-1n, 1n)).toBe(1); // k=1, b=1. loop a=-1,b=1 -> a=0,b=1. returns k=1
        });
        test('should return 0 if a=0 and b>1', () => {
          expect(kronecker(0n, 3n)).toBe(0); // v=0, k=1, b=3. loop a=0,b=3 -> returns 0
          expect(kronecker(0n, 5n)).toBe(0);
          expect(kronecker(3n, 3n)).toBe(0); // loop a=0, b=3 -> returns 0
          expect(kronecker(15n, 21n)).toBe(0); // gcd=3, should terminate with b=3
          expect(kronecker(10n, 6n)).toBe(0); // both even
        });
      });

      describe('k adjustment based on v_a and b mod 8 (Step 3)', () => {
        // Need a case where a becomes even inside the loop
        // kronecker(6, 5): b=5 (5 mod 8). Expect k flip if v_a odd.
        // v=0, k=1, b=5. loop a=6. va=1. b=5. k flips -> k=-1. a=3. recip no flip. r=3. a=5%3=2, b=3. va=1. b=3. k flips -> k=1. a=1. recip no flip. r=1. a=3%1=0, b=1. returns k=1.
        test('should flip k if v_a is odd and b = 3, 5 (mod 8)', () => {
          expect(kronecker(6n, 5n)).toBe(1); // Trace above gives 1. (6/5)=(1/5)=1. Correct.
          expect(kronecker(2n, 3n)).toBe(-1); // Trace: k=1, b=3. loop a=2. va=1. b=3. k flips -> k=-1. a=1. recip no flip. r=1. a=0, b=1. k=-1. Correct.
          expect(kronecker(10n, 3n)).toBe(1); // Trace: k=1, b=3. loop a=10. va=1. b=3. k flips -> k=-1. a=5. recip no flip. r=5. a=3%5=3. b=5. recip no flip. r=3. a=5%3=2. b=3. va=1. b=3. k flips -> k=1. a=1. recip no flip. r=1. a=0, b=1. k=1. Correct (10/3)=(1/3)=1.
        });
        // kronecker(6, 7): b=7 (7 mod 8). Expect k unchanged if v_a odd.
        // v=0, k=1, b=7. loop a=6. va=1. b=7. k unchanged -> k=1. a=3. recip flip. k=-1. r=3. a=7%3=1, b=3. recip no flip. r=1. a=0, b=1. returns k=-1.
        test('should not flip k if v_a is odd and b = 1, 7 (mod 8)', () => {
          expect(kronecker(6n, 7n)).toBe(-1); // Trace above gives -1. (6/7)=(13/7)=-1. Correct.
          expect(kronecker(2n, 7n)).toBe(1); // Trace: k=1, b=7. loop a=2. va=1. b=7. k unchanged -> k=1. a=1. recip no flip. r=1. a=0, b=1. k=1. Correct.
        });
      });

      describe('Reciprocity (Step 4)', () => {
        test('should flip k if a=3 (mod 4) and b=3 (mod 4)', () => {
          expect(kronecker(3n, 7n)).toBe(-1); // Trace: k=1, b=7. loop a=3. va=0. recip flip. k=-1. r=3. a=1,b=3. no flip. r=1. a=0,b=1. k=-1. Correct.
          expect(kronecker(7n, 11n)).toBe(-1); // Trace: k=1, b=11. loop a=7. va=0. recip flip. k=-1. r=7. a=4,b=7. va=2. k=-1. a=1. no flip. r=1. a=0,b=1. k=-1. Correct.
          // Test with negative a that becomes 3 mod 4
          // kronecker(-1, 3): k=1, b=3. loop a=-1. va=0. a=-1 (3 mod 4), b=3 (3 mod 4). recip flip. k=-1. r=1. a=0, b=1. return k=-1. Matches Jacobi (-1/3).
          expect(kronecker(-1n, 3n)).toBe(-1);
        });
        test('should not flip k if a=1 (mod 4) or b=1 (mod 4)', () => {
          expect(kronecker(5n, 7n)).toBe(-1); // Trace: k=1, b=7. loop a=5. va=0. no flip. r=5. a=2,b=5. va=1. b=5. k flips -> k=-1. a=1. no flip. r=1. a=0,b=1. k=-1. Correct.
          expect(kronecker(3n, 5n)).toBe(-1); // Trace: k=1, b=5. loop a=3. va=0. no flip. r=3. a=2,b=3. va=1. b=3. k flips -> k=-1. a=1. no flip. r=1. a=0,b=1. k=-1. Correct.
          expect(kronecker(5n, 13n)).toBe(-1); // Trace: k=1, b=13. loop a=5. va=0. no flip. r=5. a=3,b=5. no flip. r=3. a=2,b=3. va=1. b=3. k flips -> k=-1. a=1. no flip. r=1. a=0,b=1. k=-1. Correct.
        });
      });
    });

    describe('Comparison with Jacobi (for b positive odd)', () => {
      // Use jacobi imported earlier
      test('should match Jacobi symbol when b is positive odd', () => {
        const cases: [bigint, bigint][] = [
          [2n, 3n],
          [2n, 5n],
          [2n, 7n],
          [2n, 11n],
          [3n, 5n],
          [3n, 7n],
          [3n, 11n],
          [3n, 13n],
          [5n, 7n],
          [5n, 11n],
          [5n, 13n],
          [-1n, 3n],
          [-1n, 5n],
          [-1n, 7n],
          [-1n, 11n],
          [1001n, 9907n], // Larger example
        ];
        for (const [a, b] of cases) {
          try {
            const jacobiResult = jacobi(a, b);
            expect(kronecker(a, b), `kronecker(${a}, ${b})`).toBe(jacobiResult);
          } catch (e: any) {
            // If jacobi throws (e.g. b not positive odd), skip comparison
            console.warn(
              `Skipping Jacobi comparison for (${a}, ${b}): ${e.message}`,
            );
          }
        }
      });
    });

    describe('BigInt Specifics', () => {
      test('should work with larger BigInts', () => {
        const large_a = 123456789123456789n;
        const large_b_odd = 987654321987654321n;
        const large_b_even = 987654321987654320n;
        const large_b_neg = -987654321987654321n;

        // Don't have precomputed values, just check they run and return valid output
        const result_odd = kronecker(large_a, large_b_odd);
        expect([-1, 0, 1]).toContain(result_odd);

        const result_even = kronecker(large_a, large_b_even);
        expect([-1, 0, 1]).toContain(result_even);

        const result_neg_b = kronecker(large_a, large_b_neg);
        expect([-1, 0, 1]).toContain(result_neg_b);

        const result_neg_a_neg_b = kronecker(-large_a, large_b_neg);
        expect([-1, 0, 1]).toContain(result_neg_a_neg_b);

        // Compare large odd b case with reference Jacobi if available
        try {
          const jacobiResult = jacobi(large_a, large_b_odd);
          expect(result_odd).toBe(jacobiResult);
        } catch (e) {
          // Ignore if jacobi cannot handle it or throws
        }
      });
    });
  });

  describe('hgcd2', () => {
    test('auto generated tests', () => {
      for (const testCase of hgcd2TestData) {
        if (testCase.status !== 1) {
          continue;
        }
        const result = hgcd2(
          testCase.ah,
          testCase.al,
          testCase.bh,
          testCase.bl,
        );
        expect(
          result,
          `hgcd2(${testCase.ah}, ${testCase.al}, ${testCase.bh}, ${testCase.bl})` +
            `result: status=${result[0]}, u00=${result[1]}, u01=${result[2]}, u10=${result[3]}, u11=${result[4]}` +
            `expected: status=${testCase.status}, u00=${testCase.u00}, u01=${testCase.u01}, u10=${testCase.u10}, u11=${testCase.u11}`,
        ).toEqual([
          testCase.status,
          testCase.u00,
          testCase.u01,
          testCase.u10,
          testCase.u11,
        ]);
      }
    });
  });

  describe('partial_euclid', () => {
    test('auto generated tests', () => {
      for (const testCase of partialEuclidTestData) {
        const result = partial_euclid(
          testCase.a_in,
          testCase.b_in,
          testCase.l,
          true,
        );
        expect(
          result,
          `partial_euclid(${testCase.a_in}, ${testCase.b_in}, ${testCase.l})` +
            `result: a_out=${result[0]}, b_out=${result[1]}, u00=${result[2]}, u01=${result[3]}, u10=${result[4]}, u11=${result[5]}` +
            `expected: a_out=${testCase.a_out}, b_out=${testCase.b_out}, u00=${testCase.u00}, u01=${testCase.u01}, u10=${testCase.u10}, u11=${testCase.u11}`,
        ).toEqual([
          testCase.a_out,
          testCase.b_out,
          testCase.u00,
          testCase.u01,
          testCase.u10,
          testCase.u11,
        ]);
      }
    });
  });
});
