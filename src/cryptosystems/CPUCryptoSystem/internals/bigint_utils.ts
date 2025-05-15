import BigNumber from 'bignumber.js';
import { randomProvider } from './rand.js';
/**
 * Performs a ceiling division and returns the quotient and remainder.
 * Calculates q = ceil(n / d) and r = n - q * d.
 * @param n The dividend
 * @param d The divisor
 * @returns A tuple containing the quotient and remainder as first and second elements respectively.
 */
export function cdiv_qr(n: bigint, d: bigint): [bigint, bigint] {
  if (d === 0n) {
    throw new Error('Division by zero');
  }
  const qf = BigNumber(n).dividedBy(d);
  const q = BigInt(qf.integerValue(BigNumber.ROUND_CEIL).toFixed());
  const r = BigInt(n - q * d);
  return [q, r];
}

export function fdiv_qr(n: bigint, d: bigint): [bigint, bigint] {
  if (d === 0n) {
    throw new Error('Division by zero');
  }
  const qf = BigNumber(n).dividedBy(d);
  const q = BigInt(qf.integerValue(BigNumber.ROUND_FLOOR).toFixed());
  const r = BigInt(n - q * d);
  return [q, r];
}

export function mod(n: bigint, d: bigint): bigint {
  if (d === 0n) {
    throw new Error('Division by zero');
  }
  const r = n % d;
  return r < 0n ? r + d : r;
}

export function mod2k_centered(n: bigint, k: number): bigint {
  if (k < 0) {
    throw new Error('Negative exponent');
  }
  const r = mod(n, 2n ** BigInt(k));
  if (tstbit(r, k - 1)) return mod(r - 2n ** BigInt(k), 2n ** BigInt(k));
  return r;
}

export function abs_mod(n: bigint, d: bigint): bigint {
  return mod(abs(n), d);
}

export function divby2(n: bigint): bigint {
  return fdiv_qr(n, 2n)[0];
}
export function divby2k(n: bigint, k: number): bigint {
  if (k < 0) {
    throw new Error(`Negative exponent ${k}`);
  }
  return fdiv_qr(n, 2n ** BigInt(k))[0];
}

/**
 * Calculates the absolute value of a bigint.
 * If the number is negative, it returns its negation.
 * Otherwise, it returns the number itself.
 * @param n The number to calculate the absolute value of
 * @returns The absolute value of the number
 */
export function abs(n: bigint): bigint {
  if (n < 0n) return BigInt(-n);
  return BigInt(n);
}

/**
 * Compares the absolute values of two bigints.
 * @param a The first number
 * @param b The second number
 * @returns -1 if |a| < |b|, 0 if |a| == |b|, 1 if |a| > |b|
 */
export function cmp_abs(a: bigint, b: bigint): number {
  const absA = abs(a);
  const absB = abs(b);
  if (absA < absB) return -1;
  if (absA > absB) return 1;
  return 0;
}

/**
 * Calculates the number of bits required to represent a absolute value of the bigint
 * param n The number to calculate the bit length of
 * @returns The number of bits required to represent the number in binary
 */
export function nbits(n: bigint): number {
  return abs(n).toString(2).length;
}

export function val2(n: bigint): number {
  // check this
  if (n === 0n) {
    return 2 ** 50; // SIZE_MAX
  }
  return abs(n).toString(2).split('').reverse().join('').indexOf('1');
}

/**
 * Calculates the number of bits required to represent a absolute value of the bigint
 * param n The number to calculate the bit length of
 * @returns The number of bits required to represent the number in binary
 */
export function nbits_abs(n: bigint): number {
  return abs(n).toString(2).length;
}

/**
 * Tests if the i-th bit of a bigint is set.
 * The function will behave as if 2's complement representation is used.
 * If the i-th bit is set, it returns true; otherwise, it returns false.
 * @param n The number to test
 * @param i The index of the bit to test
 * @returns True if the i-th bit is set, false otherwise
 * @throws Error if the index is negative
 */
export function tstbit(n: bigint, i: number): boolean {
  if (i < 0) {
    throw new Error('Negative bit index');
  }
  return (n & (1n << BigInt(i))) !== 0n;
}

/**
 * Sets the i-th bit of a bigint to 1.
 * @param n The number to modify
 * @param i The index of the bit to set
 * @returns The modified number with the i-th bit set
 * @throws Error if the index is negative
 */
export function setbit(n: bigint, i: number): bigint {
  if (i < 0) {
    throw new Error('Negative bit index');
  }
  return n | (1n << BigInt(i));
}

/**
 * Clears the i-th bit of a bigint (sets it to 0).
 * @param n The number to modify
 * @param i The index of the bit to clear
 * @returns The modified number with the i-th bit cleared
 * @throws Error if the index is negative
 */
export function clearbit(n: bigint, i: number): bigint {
  if (i < 0) {
    throw new Error('Negative bit index');
  }
  return n & ~(1n << BigInt(i));
}

/**
 * Extracts a range of bits from a bigint(absolute value).
 * @param n The number to extract bits from
 * @param start The starting index of the range
 * @param len The length of the range
 * @returns The extracted bits as a bigint
 * @throws Error if the start index or length is negative
 */
// export function extract_bits(n: bigint, start: number, len: number): bigint {
//   if (start < 0 || len < 0) {
//     throw new Error('Negative bit index or length');
//   }
//   const mask = (1n << BigInt(len)) - 1n;
//   return (abs(n) >> BigInt(start)) & mask;
// }
export function extract_bits(n: bigint, index: number, len: number): bigint {
  // --- Input Validation ---
  if (index < 0) {
    // GMP indices are non-negative
    throw new Error('Index cannot be negative.');
  }
  if (len <= 0) {
    // C++ code assumes positive len. Handling len=0 for completeness.
    // Strictly matching C++ assumption description, we could throw here too.
    // if (len === 0) return 0n; // Or throw:
    throw new Error('Length must be positive (as per C++ assumption).');
  }

  // Ignore sign, matching C++ comment "The sign is not taken into account."
  // Use absolute value for calculations.
  const abs_n = n < 0n ? -n : n;

  // --- Logic ---
  // Calculate the conceptual lowest bit index
  // Use bigint for intermediate calculation to avoid potential number overflow with large indices/lens
  const lowest_bit_index = BigInt(index) - BigInt(len) + 1n;

  // Perform the shift. Right shift if lowest_bit_index >= 0, Left shift otherwise.
  let shifted_n: bigint;
  if (lowest_bit_index >= 0n) {
    // Right shift to bring the lowest desired bit to position 0
    shifted_n = abs_n >> lowest_bit_index;
  } else {
    // The lowest bit is conceptually "below" 0.
    // Shifting right by a negative amount is equivalent to shifting left.
    // Shift left by the absolute value of lowest_bit_index.
    shifted_n = abs_n << -lowest_bit_index; // -lowest_bit_index is positive
  }

  // Create the mask for 'len' bits
  // Use BigInt(len) for the shift amount.
  const mask = (1n << BigInt(len)) - 1n;

  // Apply the mask to get the lowest 'len' bits of the shifted result
  return shifted_n & mask;
}
/**
 * Calculates the greatest common divisor (GCD) of two bigints.
 * Uses the Euclidean algorithm.
 * @param a The first number
 * @param b The second number
 * @returns The GCD of the two numbers
 */
export function gcd(a_: bigint, b_: bigint): bigint {
  let a = abs(a_);
  let b = abs(b_);
  return gcd_int(a, b);
}
function gcd_int(a: bigint, b: bigint): bigint {
  if (b === 0n) return a;
  return gcd(b, a % b);
}

/**
 * Extended Euclidean Algorithm to find the GCD and the coefficients x and y such that
 * a*x + b*y = gcd(a, b).
 * @param a The first number
 * @param b The second number
 * @returns A tuple containing x, y, and the GCD of a and b
 */
export function gcdext(a_: bigint, b_: bigint): [bigint, bigint, bigint] {
  const a_neg = a_ < 0n ? -1n : 1n;
  const b_neg = b_ < 0n ? -1n : 1n;
  let a = abs(a_);
  let b = abs(b_);
  const [x, y, g] = gcdext_int(a, b);
  return [x * a_neg, y * b_neg, g];
}
function gcdext_int(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [1n, 0n, a];
  const [x1, y1, g] = gcdext(b, a % b);
  const x = y1;
  const y = x1 - (a / b) * y1;
  return [x, y, g];
}

/**
 * Calculates the modular inverse of a modulo m using the Extended Euclidean Algorithm.
 * @param a The number to find the inverse of
 * @param m The modulus
 * @returns The modular inverse of a modulo m
 * @throws Error if the inverse does not exist (i.e., gcd(a, m) != 1)
 */
export function mod_inverse(a_: bigint, m_: bigint): bigint {
  let a = BigInt(a_);
  let m = BigInt(m_);
  if (m <= 0n) {
    throw new Error('Modulus must be positive');
  }
  if (m === 1n) {
    return 0n;
  }
  a = a % m;
  if (a < 0n) {
    a += m;
  }
  if (a === 0n) {
    throw new Error('Inverse does not exist');
  }
  if (a === 1n) {
    return 1n;
  }
  const [x, y, g] = gcdext(a, m);
  if (g !== 1n) {
    throw new Error('Inverse does not exist');
  }
  return ((x % m) + m) % m;
}

/**
 * Calculates the modular inverse of a modulo 2^k using the method of successive squaring.
 * @param a The number to find the inverse of
 * @param k The exponent of 2
 * @returns The modular inverse of a modulo 2^k
 * @throws Error if a is even
 */
export function mod_inverse_2exp(a_: bigint, k: number): bigint {
  let a = BigInt(a_);
  if (k < 1) {
    throw new Error('k must be greater than or equal to 1');
  }
  if (a % 2n === 0n) {
    throw new Error('a must be odd.');
  }

  const m = 2n ** BigInt(k);
  a = a % m;
  if (a < 0n) {
    a += m;
  }
  if (a === 0n) {
    throw new Error('Inverse does not exist');
  }
  if (a === 1n) {
    return 1n;
  }
  let r = 1n;
  for (let i = 1; i < k; i <<= 1) {
    let t = 2n - r * a;
    t *= r;
    r = t % 2n ** (BigInt(i) << 1n);
  }
  if (r < 0n) {
    r += m;
  }
  return r;
}

/**
 * Calculates the square root of a bigint using the BigNumber library.
 * @param a The number to find the square root of
 * @returns The square root of the number
 * @throws Error if the number is negative
 */
export function sqrt(a: bigint): bigint {
  if (a < 0n) {
    throw new Error('Square root of negative number');
  }
  if (a === 0n || a === 1n) {
    return a;
  }
  return BigInt(
    BigNumber(a).squareRoot().integerValue(BigNumber.ROUND_DOWN).toFixed(),
  );
}

/**
 * Calculates the fourth root of a bigint by taking the square root twice.
 * @param a The number to find the fourth root of
 * @returns The fourth root of the number
 */
export function fourth_root(a: bigint): bigint {
  return sqrt(sqrt(a));
}

/**
 * Calculates square root of the absolute value of a bigint.
 * If the number is negative, it returns the square root of its absolute value.
 * Otherwise, it returns the square root of the number itself.
 * @param a The number to find the square root of
 * @returns The square root of the absolute value of the number
 */
export function sqrt_abs(a: bigint): bigint {
  return sqrt(abs(a));
}

/**
 * Calculates the fourth root of the absolute value of a bigint.
 * If the number is negative, it returns the fourth root of its absolute value.
 * Otherwise, it returns the fourth root of the number itself.
 * @param a The number to find the fourth root of
 * @returns The fourth root of the absolute value of the number
 */
export function fourth_root_abs(a: bigint): bigint {
  return fourth_root(abs(a));
}

/**
 * Calculates the square root of a bigint modulo a prime number.
 * @param a The number to find the square root of
 * @param p The prime modulus
 * @returns The square root of a modulo p
 * @throws Error if the number is not a quadratic residue modulo p
 */
export function sqrt_mod_prime(s: bigint, l: bigint): bigint {
  let Q = l - 1n;

  let m = 0n;
  while (mod(Q, 2n) === 0n) {
    Q = divby2(Q);
    ++m;
  }
  let z = 1n;
  while (kronecker(z, l) !== -1) {
    z = z + 1n;
  }
  let c = mod(z ** Q, l);
  let t = mod(s ** Q, l);
  let tmp = divby2(Q + 1n);
  let r = mod(s ** tmp, l);

  while (t !== 0n && t !== 1n) {
    let i = 0n;
    tmp = t;
    while (tmp !== 1n) {
      i = i + 1n;
      tmp = mod(tmp ** 2n, l);
    }
    tmp = 1n;
    tmp = tmp << (m - i - 1n);
    let b = mod(c ** tmp, l);
    m = i;
    c = mod(b ** 2n, l);
    t = mod(t * c, l);
    r = mod(r * b, l);
  }

  if (t === 0n) {
    r = 0n;
  }
  return r;
}

// Constants for the hybrid primality test
const DEFAULT_MR_ITERATIONS = 20; // Number of Miller-Rabin iterations.
// Probability of error for a composite is < (1/4)^k.
// For k=20, error prob < 2^-40 (approx 1 in 10^12).
const TRIAL_DIVISION_CUTOFF = 10000n; // Numbers < this use trial division for deterministic results.

/**
 * Deterministic primality test for smaller numbers using trial division.
 */
function is_prime_trial_division(num: bigint): boolean {
  // Base cases (0, 1, negative, 2, 3, evens, multiples of 3)
  // are expected to be handled by the main `is_prime` function before calling this.
  // This function assumes num > 3 and num is not divisible by 2 or 3.

  // Check divisors of the form 6k ± 1 up to sqrt(num).
  for (let i = 5n; i * i <= num; i = i + 6n) {
    if (num % i === 0n || num % (i + 2n) === 0n) {
      return false;
    }
  }
  return true;
}

// Generate a random number in the range [0, limit-1]
// Using the randomProvider to get a random number
export function getRandomBigInt(limit: bigint): bigint {
  const bytes = new Uint8Array(Math.ceil(nbits(limit) / 8));
  randomProvider.getRandomValues(bytes);
  let result = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    result = (result << BigInt(8)) | BigInt(bytes[i]!);
  }
  return result % limit;
}

export function power(base: bigint, exp: bigint, mod: bigint): bigint {
  if (exp < 0n) {
    throw new Error('Negative exponent not supported');
  }
  let result = 1n;
  base = base % mod; // Handle large base
  while (exp > 0n) {
    if (exp % 2n === 1n) {
      result = (result * base) % mod;
    }
    exp = exp >> 1n; // Divide exp by 2
    base = (base * base) % mod; // Square the base
  }
  return result;
}

/**
 * Miller-Rabin probabilistic primality test.
 * @param n The number to test.
 * @param k The number of iterations (witnesses). Higher k reduces error probability.
 * Preconditions: n > 3 and n is odd (handled by the calling `is_prime` function).
 */
function is_prime_miller_rabin_internal(n: bigint, k: number): boolean {
  // Find d and s such that n-1 = (2^s) * d, where d is odd.
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }

  for (let iter = 0; iter < k; iter++) {
    // Pick a random witness 'a' in the range [2, n-2].
    // randomRangeLimit is n-3n because the range [2, n-2] has (n-2)-2+1 = n-3 elements.
    // getRandomBigIntUniform(limit) returns value in [0, limit-1].
    // So, a = random_in_[0, n-3n-1] + 2n.
    // Since n >= 5 here (odd, >3), n-3n >= 2n.
    const randomRangeLimit = n - 3n;
    const a = getRandomBigInt(randomRangeLimit) + 2n;

    let x = power(a, d, n); // x = a^d % n

    if (x === 1n || x === n - 1n) {
      continue; // n might be prime (SPSP test), try next witness
    }

    let witnessFoundComposite = true; // Assume 'a' is a witness for compositeness
    for (let r = 1n; r < s; r++) {
      // Loop s-1 times (from r=1 to s-1)
      x = power(x, 2n, n); // x = x^2 % n
      if (x === n - 1n) {
        witnessFoundComposite = false; // 'a' is not a witness for compositeness for this path
        break; // Go to next witness 'a'
      }
      if (x === 1n) {
        // n is definitely composite (found non-trivial square root of 1 mod n)
        return false;
      }
    }

    if (witnessFoundComposite) {
      // If x !== 1n and x !== n-1n initially, AND
      // after all squarings (r=1 to s-1), x still isn't n-1n,
      // then 'a' is a strong witness for compositeness.
      return false;
    }
  }

  return true; // n is probably prime
}

/**
 * Checks if a BigInt number is prime.
 * Uses a hybrid approach:
 * - Handles base cases (0, 1, negatives, 2, 3).
 * - Checks divisibility by 2 and 3.
 * - Uses trial division for numbers below TRIAL_DIVISION_CUTOFF (deterministic).
 * - Uses Miller-Rabin test for larger numbers (probabilistic, very high accuracy).
 * @param num The number to check for primality.
 * @returns True if the number is (probably) prime, false otherwise.
 */
export function is_prime(num: bigint): boolean {
  // Handle base cases: 0, 1, negative numbers are not prime.
  if (num <= 1n) return false;
  // 2 and 3 are prime.
  if (num === 2n || num === 3n) return true;
  // Even numbers greater than 2 are not prime.
  // Multiples of 3 greater than 3 are not prime.
  if (num % 2n === 0n || num % 3n === 0n) return false;

  // For numbers below the cutoff, use deterministic trial division.
  // It's efficient for small numbers and guarantees correctness.
  if (num < TRIAL_DIVISION_CUTOFF) {
    // is_prime_trial_division assumes num > 3 and not divisible by 2 or 3.
    return is_prime_trial_division(num);
  }

  // For larger numbers, use Miller-Rabin probabilistic test.
  // is_prime_miller_rabin_internal assumes num > 3 and num is odd.
  return is_prime_miller_rabin_internal(num, DEFAULT_MR_ITERATIONS);
}

/**
 * Finds the smallest prime number strictly greater than n.
 * @param n The number after which to find the next prime.
 * @returns The smallest prime number > n.
 */
export function next_prime(n: bigint): bigint {
  if (n < 2n) {
    return 2n;
  }
  if (n === 2n) {
    return 3n;
  }

  // Start searching from the first odd number strictly greater than n.
  // If n is even (e.g., 4), the next odd candidate is n + 1n (e.g., 5).
  // If n is odd (e.g., 3), the next odd candidate is n + 2n (e.g., 5).
  let candidate = n % 2n === 0n ? n + 1n : n + 2n;

  // Loop indefinitely, checking subsequent odd numbers.
  // The `is_prime` function will efficiently handle multiples of small primes (like 3, 5 etc.)
  while (true) {
    if (is_prime(candidate)) {
      return candidate;
    }
    candidate += 2n; // Move to the next odd number
  }
}

/**
 * Calculates the logarithm base 2 of a bigint.
 * This is equivalent to log2(n).
 * @param n The number to calculate the logarithm of
 * @returns The logarithm base 2 of the number
 * @throws Error if the number is non-positive
 */
export function log2(n: bigint): number {
  if (n <= 0n) {
    throw new Error('log2 is undefined for non-positive numbers');
  }
  if (n === 1n) {
    return 0;
  }
  // Calculate the logarithm base 2 using the bit length -1
  return n.toString(2).length - 1;
}

/**
 * Calculates the ceiling of the absolute logarithm squared of a bigint.
 * This is equivalent to ceil(loge(abs(n))^2).
 * @param n The number to calculate the ceiling of the absolute logarithm squared of
 * @returns The ceiling of the absolute logarithm squared of the number
 */
export function ceil_abslog_sqr(
  n_: bigint,
  options?: {
    precisionMargin?: number;
    maxIterations?: number;
    tolerance?: string | number | BigNumber;
  },
): bigint {
  const {
    precisionMargin = nbits(n_),
    maxIterations = 100000,
    tolerance = '1e-15',
  } = options ?? {};

  // Store original config and set working precision
  const originalConfig = BigNumber.config({});
  BigNumber.config({
    DECIMAL_PLACES: precisionMargin,
  });

  let n = BigNumber(n_);

  // Handle edge cases
  if (n.isZero()) {
    throw new Error('Logarithm of zero is undefined.');
  }
  const absN = n.abs();
  if (absN.isEqualTo(1)) {
    return BigInt(0); // ln(1)^2 = 0
  }

  let result: BigNumber;

  try {
    let nf = absN;

    /* compute nf and m such that ln(|n|)^2 = 4^m*ln(nf)^2 with 0<nf<2 */
    let m = 0;
    while (nf.comparedTo(new BigNumber(2))! >= 0) {
      nf = nf.sqrt();
      m += 1;
    }

    const z = new BigNumber(1).minus(nf);

    let acc = new BigNumber(0); // Accumulator for the sum
    let pow = z.times(z); // Starts with z^2 (for i=1 term: z^(1+1))
    let H = new BigNumber(1); // Harmonic number H_i, starts with H_1 = 1
    let term = new BigNumber(0); // Stores the current term t

    for (let i = 1; i < maxIterations; i++) {
      const iPlus1_BN = new BigNumber(i + 1);
      const inv_iPlus1 = new BigNumber(1).dividedBy(iPlus1_BN);
      term = pow.times(H).times(new BigNumber(2)).times(inv_iPlus1);
      acc = acc.plus(term);

      pow = pow.times(z);
      H = H.plus(inv_iPlus1);

      // Convergence check: if |t / acc| <= tolerance
      if (!acc.isZero()) {
        // Avoid division by zero if acc is 0 initially
        const relativeChange = term.dividedBy(acc).abs();
        if (relativeChange.comparedTo(new BigNumber(tolerance))! <= 0) {
          break;
        }
      }

      if (i === maxIterations - 1) {
        // console.warn(
        //   `Taylor series did not converge within ${maxIterations} iterations. Result might be inaccurate.`,
        // );
      }
    }

    acc = acc.times(new BigNumber(4).pow(m));

    result = acc.integerValue(BigNumber.ROUND_CEIL);
  } finally {
    // Restore original BigNumber configuration
    BigNumber.config(originalConfig);
  }

  return BigInt(result.toFixed());
}

/**
 * Calculates the Jacobi symbol (a/n) for a given a and n.
 * The Jacobi symbol is a generalization of the Legendre symbol.
 * @param a The numerator
 * @param n The denominator
 * @returns The Jacobi symbol (a/n)
 * @throws Error if n is not positive integer or if n is not odd
 */
export function jacobi(a_: bigint, n_: bigint): number {
  let a = BigInt(a_);
  let n = BigInt(n_);
  if (n <= 0n || n % 2n === 0n) {
    throw new Error('n must be a positive odd integer');
  }
  a = ((a % n) + n) % n;
  let t = 1;
  while (a !== 0n) {
    while (a % 2n === 0n) {
      a /= 2n;
      if (n % 8n === 3n || n % 8n === 5n) t = -t;
    }
    [a, n] = [n, a];
    if (a % 4n === 3n && n % 4n === 3n) t = -t;
    a %= n;
  }
  if (n === 1n) return t;
  else return 0;
}

/**
 * Calculates the Kronecker symbol (a/n) for a given a and n.
 * @param a The numerator
 * @param n The denominator
 * @returns The Kronecker symbol (a/n)
 */
export function kronecker(a_: bigint, n_: bigint): number {
  let a = BigInt(a_);
  let n = BigInt(n_);
  if (n === 0n) {
    return abs(a) === 1n ? 1 : 0;
  }
  const tab2 = [0, 1, 0, -1, 0, -1, 0, 1];
  let k = 1;
  if (a % 2n === 0n && n % 2n === 0n) return 0;
  {
    let v = 0;
    while (n % 2n === 0n) {
      n /= 2n;
      v++;
    }
    if (v % 2 !== 0) {
      const amod8 = ((a % 8n) + 8n) % 8n;
      if (amod8 === 3n || amod8 === 5n) k = -1;
    }
  }
  if (n < 0n) {
    n = -n;
    if (a < 0n) k = -k;
  }

  while (true) {
    if (a === 0n) return n === 1n ? k : 0;
    let v = 0;
    while (a % 2n === 0n) {
      a /= 2n;
      v++;
    }
    if (v % 2 !== 0) {
      const nmod8 = n % 8n;
      if (nmod8 === 3n || nmod8 === 5n) k = -k;
    }
    const amod4 = ((a % 4n) + 4n) % 4n;
    const nmod4 = n % 4n;
    if (amod4 === 3n && nmod4 === 3n) {
      k = -k;
    }
    [a, n] = [n % abs(a), abs(a)];
  }
}

// Constants based on GMP limb size
export const GMP_LIMB_BITS = 64;
export const LIMB_BASE = BigInt(2) ** BigInt(GMP_LIMB_BITS); // 4294967296n
const HALF_LIMB_BITS = GMP_LIMB_BITS / 2; // 32
// Threshold for switching to single limb loop (ah or bh < 2^32)
const LOW_HALF_THRESHOLD = BigInt(1) << BigInt(HALF_LIMB_BITS); // 4294967296n
// Threshold for stopping in single limb loop (ah or bh < 2^17)
const SINGLE_LOOP_THRESHOLD = BigInt(1) << BigInt(HALF_LIMB_BITS + 1); // 8589934592n
export function hgcd2(
  ah_in: bigint,
  al_in: bigint,
  bh_in: bigint,
  bl_in: bigint,
): [number, bigint, bigint, bigint, bigint] {
  const limb_t = (x: bigint): bigint =>
    ((x % LIMB_BASE) + LIMB_BASE) % LIMB_BASE;
  const limb_t_add = (a: bigint, b: bigint): bigint => (a + b) % LIMB_BASE;
  const limb_t_sub = (a: bigint, b: bigint): bigint =>
    (((a - b) % LIMB_BASE) + LIMB_BASE) % LIMB_BASE;
  const limb_t_mul = (a: bigint, b: bigint): bigint => (a * b) % LIMB_BASE;
  const sub_ddmmss = (
    ah1: bigint,
    al1: bigint,
    ah2: bigint,
    al2: bigint,
  ): [bigint, bigint] => {
    let ah_res = ah1;
    let al_res = al1;
    const borrow = al_res < al2 ? 1n : 0n;
    al_res = limb_t_sub(al_res, al2); //handles wrap around
    ah_res = limb_t_sub(ah_res, ah2);
    ah_res = limb_t_sub(ah_res, borrow);
    return [ah_res, al_res];
  };

  const div2 = (
    nh: bigint,
    nl: bigint,
    dh: bigint,
    dl: bigint,
  ): { q: bigint; rh: bigint; rl: bigint } => {
    const N = nh * LIMB_BASE + nl;
    const D = dh * LIMB_BASE + dl;

    if (D === 0n) {
      throw new Error('Division by zero in div2');
    }

    const q_big = N / D;
    const R_big = N % D;

    const rh_big = R_big / LIMB_BASE;
    const rl_big = R_big % LIMB_BASE;
    return {
      q: q_big,
      rh: rh_big,
      rl: rl_big,
    };
  };

  const div1_simple = (
    dividend: bigint,
    divisor: bigint,
  ): { q: bigint; r: bigint } => {
    const dividend_u32 = dividend;
    const divisor_u32 = divisor;
    if (divisor_u32 === 0n) {
      throw new Error('Division by zero in div1_simple');
    }
    return {
      q: dividend_u32 / divisor_u32,
      r: dividend_u32 % divisor_u32,
    };
  };

  const ASSERT = (condition: boolean): void => {
    if (!condition) {
      throw new Error('Assertion failed');
    }
  };

  let ah = limb_t(ah_in);
  let al = limb_t(al_in);
  let bh = limb_t(bh_in);
  let bl = limb_t(bl_in);

  let u00 = 0n,
    u01 = 0n,
    u10 = 0n,
    u11 = 0n;

  const done = (): [number, bigint, bigint, bigint, bigint] => {
    return [1, u00, u01, u10, u11];
  };

  const early_return = (): [number, bigint, bigint, bigint, bigint] => {
    return [0, 0n, 0n, 0n, 0n];
  };

  if (ah < 2n || bh < 2n) return [0, 0n, 0n, 0n, 0n];

  if (ah > bh || (ah == bh && al > bl)) {
    [ah, al] = sub_ddmmss(ah, al, bh, bl);
    if (ah < 2) return early_return();
    u00 = 1n;
    u01 = 1n;
    u11 = 1n;
    u10 = 0n;
  } else {
    [bh, bl] = sub_ddmmss(bh, bl, ah, al);
    if (bh < 2) return early_return();
    u00 = 1n;
    u01 = 0n;
    u10 = 1n;
    u11 = 1n;
  }

  let skip_first_reduction = false;
  let skip_first_reduction_for_single_limb_loop = false;
  if (ah < bh) skip_first_reduction = true;

  while (true) {
    if (skip_first_reduction === false) {
      ASSERT(ah >= bh);

      if (ah == bh) return done();
      if (ah < BigInt(LOW_HALF_THRESHOLD)) {
        ah = limb_t_add(
          ah << BigInt(HALF_LIMB_BITS),
          al >> BigInt(HALF_LIMB_BITS),
        );
        bh = limb_t_add(
          bh << BigInt(HALF_LIMB_BITS),
          bl >> BigInt(HALF_LIMB_BITS),
        );
        break;
      }

      ASSERT(ah > bh);
      [ah, al] = sub_ddmmss(ah, al, bh, bl);
      if (ah < 2n) {
        return done();
      }
      if (ah <= bh) {
        u01 = limb_t_add(u01, u00);
        u11 = limb_t_add(u11, u10);
      } else {
        const qdiv2_res = div2(ah, al, bh, bl);
        let q = qdiv2_res.q;
        al = qdiv2_res.rl;
        ah = qdiv2_res.rh;
        if (ah < 2n) {
          u01 = limb_t_add(u01, limb_t_mul(q, u00));
          u11 = limb_t_add(u11, limb_t_mul(q, u10));
          return done();
        }
        q++;
        u01 = limb_t_add(u01, limb_t_mul(q, u00));
        u11 = limb_t_add(u11, limb_t_mul(q, u10));
      }
    } else {
      skip_first_reduction = false;
    }
    ASSERT(bh >= ah);
    if (ah == bh) return done();
    if (bh < LOW_HALF_THRESHOLD) {
      ah = limb_t_add(
        ah << BigInt(HALF_LIMB_BITS),
        al >> BigInt(HALF_LIMB_BITS),
      );
      bh = limb_t_add(
        bh << BigInt(HALF_LIMB_BITS),
        bl >> BigInt(HALF_LIMB_BITS),
      );
      skip_first_reduction_for_single_limb_loop = true;
      break;
    }
    [bh, bl] = sub_ddmmss(bh, bl, ah, al);
    if (bh < 2n) {
      return done();
    }
    if (bh <= ah) {
      u00 = limb_t_add(u00, u01);
      u10 = limb_t_add(u10, u11);
    } else {
      const qdiv2_res = div2(bh, bl, ah, al);
      let q = qdiv2_res.q;
      bl = qdiv2_res.rl;
      bh = qdiv2_res.rh;
      if (bh < 2) {
        u00 = limb_t_add(u00, limb_t_mul(q, u01));
        u10 = limb_t_add(u10, limb_t_mul(q, u11));
        return done();
      }
      q++;
      u00 = limb_t_add(u00, limb_t_mul(q, u01));
      u10 = limb_t_add(u10, limb_t_mul(q, u11));
    }
  }

  while (true) {
    if (skip_first_reduction_for_single_limb_loop == false) {
      ASSERT(ah >= bh);
      ah = limb_t_sub(ah, bh);
      if (ah < SINGLE_LOOP_THRESHOLD) break;

      if (ah <= bh) {
        u01 = limb_t_add(u01, u00);
        u11 = limb_t_add(u11, u10);
      } else {
        const qdiv1_res = div1_simple(ah, bh);
        let q = qdiv1_res.q;
        ah = qdiv1_res.r;
        if (ah < SINGLE_LOOP_THRESHOLD) {
          u01 = limb_t_add(u01, limb_t_mul(q, u00));
          u11 = limb_t_add(u11, limb_t_mul(q, u10));
          break;
        }
        q++;
        u01 = limb_t_add(u01, limb_t_mul(q, u00));
        u11 = limb_t_add(u11, limb_t_mul(q, u10));
      }
    } else {
      skip_first_reduction_for_single_limb_loop = false;
    }
    ASSERT(bh >= ah);
    bh = limb_t_sub(bh, ah);
    if (bh < SINGLE_LOOP_THRESHOLD) break;

    if (bh <= ah) {
      u00 = limb_t_add(u00, u01);
      u10 = limb_t_add(u10, u11);
    } else {
      const qdiv1_res = div1_simple(bh, ah);
      let q = qdiv1_res.q;
      bh = qdiv1_res.r;
      if (bh < SINGLE_LOOP_THRESHOLD) {
        u00 = limb_t_add(u00, limb_t_mul(q, u01));
        u10 = limb_t_add(u10, limb_t_mul(q, u11));
        break;
      }
      q++;
      u00 = limb_t_add(u00, limb_t_mul(q, u01));
      u10 = limb_t_add(u10, limb_t_mul(q, u11));
    }
  }

  return done();
}

/**
 * Performs a partial Extended Euclidean Algorithm on bigints a and b.
 *
 * Stops when the bit length of the larger number (in absolute value)
 * drops below targetBitLength.
 *
 * Calculates a', b', and matrix U = [[u00, u01], [u10, u11]] such that:
 * [ a' ] = U * [ a ]
 * [ b' ]       [ b ]
 *
 * where a', b' are the results after the partial reduction.
 *
 * @param a The first bigint input.
 * @param b The second bigint input.
 * @param targetBitLength The target bit length threshold to stop the algorithm.
 * @returns An array containing the final a, b and the transformation matrix U. The first two
 * elements are the final a' and b', followed by the matrix elements u00, u01, u10, u11.
 * The matrix U is represented as a flat array of 6 elements.
 */
export function partial_euclid(
  a_: bigint,
  b_: bigint,
  target_nbits: number,
  is_limbs: boolean = false,
): [bigint, bigint, bigint, bigint, bigint, bigint] {
  if (is_limbs) {
    target_nbits = target_nbits * GMP_LIMB_BITS;
  }
  const get_highest_two_limbs = (
    a: bigint,
    b: bigint,
  ): [bigint, bigint, bigint, bigint] => {
    const count_leading_zeros = (x: string): number => {
      let count = 0;
      for (let i = 0; i < x.length; i++) {
        if (x[i] === '0') count++;
        else break;
      }
      return count;
    };

    let as = a.toString(2);
    let bs = b.toString(2);
    if (as.length > bs.length) {
      bs = '0'.repeat(as.length - bs.length) + bs;
    } else if (bs.length > as.length) {
      as = '0'.repeat(bs.length - as.length) + as;
    }
    if (as.length < 2 * GMP_LIMB_BITS) {
      as = '0'.repeat(2 * GMP_LIMB_BITS - as.length) + as;
    }
    if (bs.length < 2 * GMP_LIMB_BITS) {
      bs = '0'.repeat(2 * GMP_LIMB_BITS - bs.length) + bs;
    }

    let shift = Math.min(count_leading_zeros(as), count_leading_zeros(bs));
    as = as.slice(shift) + '0'.repeat(shift);
    bs = bs.slice(shift) + '0'.repeat(shift);

    return [
      BigInt('0b' + as.slice(0, GMP_LIMB_BITS)),
      BigInt('0b' + as.slice(GMP_LIMB_BITS, 2 * GMP_LIMB_BITS)),
      BigInt('0b' + bs.slice(0, GMP_LIMB_BITS)),
      BigInt('0b' + bs.slice(GMP_LIMB_BITS, 2 * GMP_LIMB_BITS)),
    ];
  };

  const update_process = (n: bigint, target_nbits: number): boolean => {
    return abs(n) >= BigInt(2) ** BigInt(target_nbits);
  };

  let a = BigInt(a_);
  let b = BigInt(b_);
  let swapped = false;

  if (abs(a) > abs(b)) {
    [a, b] = [b, a];
    swapped = true;
  }

  let is_a_neg = a < 0n;
  let is_b_neg = b < 0n;
  a = abs(a);
  b = abs(b);

  if (a < 2n ** BigInt(GMP_LIMB_BITS)) {
    return [a, b, 1n, 0n, 0n, 1n];
  }
  let u00 = 1n;
  let u01 = 0n;
  let u10 = 0n;
  let u11 = 1n;
  let process = true;
  while (process) {
    let [ah, al, bh, bl] = get_highest_two_limbs(a, b);
    let [status, m00, m01, m10, m11] = hgcd2(ah, al, bh, bl);
    if (status !== 0) {
      [a, b] = [
        BigInt(m11) * a - BigInt(m01) * b,
        BigInt(m00) * b - BigInt(m10) * a,
      ];
      if (a < 0n || b < 0n) {
        throw new Error('Assertion failed');
      }
      process =
        update_process(a, target_nbits) || update_process(b, target_nbits);
      // M*[u10, u01], M*[u00, u11]
      let next_u00 = BigInt(m00) * u00 + BigInt(m10) * u01;
      let next_u01 = BigInt(m01) * u00 + BigInt(m11) * u01;
      let next_u10 = BigInt(m00) * u10 + BigInt(m10) * u11;
      let next_u11 = BigInt(m01) * u10 + BigInt(m11) * u11;
      u00 = next_u00;
      u01 = next_u01;
      u10 = next_u10;
      u11 = next_u11;
    } else {
      if (bh < 2) {
        let q = a / b;
        let r = a % b;
        a -= q * b;
        b = r;
        process = update_process(b, target_nbits);
        u01 += q * u00;
        u11 += q * u10;
      } else if (ah < 2) {
        let q = b / a;
        let r = b % a;
        b -= q * a;
        a = r;
        process = update_process(a, target_nbits);
        u00 += q * u01;
        u10 += q * u11;
      } else {
        if (a < b) {
          [a, b] = [a, b - a];
          process = update_process(b, target_nbits);
          u00 += u01;
          u10 += u11;
        } else {
          [a, b] = [a - b, b];
          process = update_process(a, target_nbits);
          u01 += u00;
          u11 += u10;
        }
      }
    }
  }
  a = is_a_neg ? -a : a;
  b = is_b_neg ? -b : b;
  u10 = is_b_neg !== is_a_neg ? -u10 : u10;
  u01 = is_b_neg !== is_a_neg ? -u01 : u01;
  if (swapped) {
    [u10, u01] = [u01, u10];
    [u00, u11] = [u11, u00];
    [a, b] = [b, a];
  }

  return [a, b, u00, u01, u10, u11];
}
