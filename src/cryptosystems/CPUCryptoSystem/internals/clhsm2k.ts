import {
  divby2k,
  kronecker,
  mod,
  mod2k_centered,
  mod_inverse_2exp,
  nbits,
  next_prime,
  setbit,
  tstbit,
  val2,
} from './bigint_utils.js';
import { ClassGroup, QFI } from './qfi.js';
import { RandGen } from './randgen.js';

export class CLHSM2kSecretKey {
  private sk_m: bigint;

  constructor(sk: bigint) {
    this.sk_m = sk;
  }

  public get sk(): bigint {
    return BigInt(this.sk_m);
  }

  public static create_new(cs: CLHSM2k, randgen: RandGen): CLHSM2kSecretKey {
    return new CLHSM2kSecretKey(randgen.random_bigint(cs.secretkey_bound));
  }
}

export class CLHSM2kPublicKey {
  private pk_m: QFI;
  private d_m: number;
  private e_m: number;
  private pk_e_precomp_m: QFI;
  private pk_d_precomp_m: QFI;
  private pk_de_precomp_m: QFI;

  constructor(pk: QFI, cs: CLHSM2k) {
    this.pk_m = pk;
    this.d_m = Math.floor((nbits(cs.encrypt_randomness_bound) + 1) / 2);
    this.e_m = Math.floor(this.d_m / 2) + 1;
    this.pk_de_precomp_m = pk.clone();
    this.pk_d_precomp_m = pk.clone(); // just for typescript
    this.pk_e_precomp_m = pk.clone(); // just for typescript
    for (let i = 0; i < this.d_m + this.e_m; i++) {
      if (i === this.e_m) {
        this.pk_e_precomp_m = this.pk_de_precomp_m.clone();
      }
      if (i === this.d_m) {
        this.pk_d_precomp_m = this.pk_de_precomp_m.clone();
      }
      this.pk_de_precomp_m = cs.cl_g.nudupl(this.pk_de_precomp_m);
    }
  }

  public get pk(): QFI {
    return this.pk_m.clone();
  }

  public exponentiation(cs: CLHSM2k, n: bigint): QFI {
    return cs.cl_g.nupow_2_forms_2exp(
      this.pk_m,
      n,
      this.d_m,
      this.e_m,
      this.pk_e_precomp_m,
      this.pk_d_precomp_m,
      this.pk_de_precomp_m,
    );
  }

  public static create_new(
    cs: CLHSM2k,
    sk: CLHSM2kSecretKey,
  ): CLHSM2kPublicKey {
    return new CLHSM2kPublicKey(cs.power_of_h(sk.sk), cs);
  }
}

export class CLHSM2kCleartext {
  private m_m: bigint;

  constructor(m: bigint) {
    this.m_m = m;
  }

  public get m(): bigint {
    return this.m_m;
  }

  public static create_new(m: bigint): CLHSM2kCleartext {
    return new CLHSM2kCleartext(m);
  }

  public static decrypt(
    cs: CLHSM2k,
    sk: CLHSM2kSecretKey,
    ct: CLHSM2kCiphertext,
  ): CLHSM2kCleartext {
    return new CLHSM2kCleartext(
      cs.dlog_in_F(cs.cl_delta.nucompinv(ct.c2, cs.cl_g.nupow(ct.c1, sk.sk))),
    );
  }
}

export class CLHSM2kCiphertext {
  private c1_m: QFI;
  private c2_m: QFI;

  constructor(c1: QFI, c2: QFI) {
    this.c1_m = c1;
    this.c2_m = c2;
  }

  public get c1(): QFI {
    return this.c1_m.clone();
  }

  public get c2(): QFI {
    return this.c2_m.clone();
  }

  public static create_new(
    cs: CLHSM2k,
    pk: CLHSM2kPublicKey,
    m: CLHSM2kCleartext,
    r: bigint,
  ): CLHSM2kCiphertext {
    let c1 = cs.power_of_h(r);
    let c2 = cs.cl_delta.nucomp(cs.power_of_f(m.m), pk.exponentiation(cs, r));
    return new CLHSM2kCiphertext(c1, c2);
  }

  public static add_ciphertexts(
    cs: CLHSM2k,
    pk: CLHSM2kPublicKey,
    ct1: CLHSM2kCiphertext,
    ct2: CLHSM2kCiphertext,
    r: bigint,
  ): CLHSM2kCiphertext {
    let c1 = cs.cl_g.nucomp(cs.cl_g.nucomp(ct1.c1, ct2.c1), cs.power_of_h(r));
    let c2 = cs.cl_delta.nucomp(
      cs.cl_delta.nucomp(ct1.c2, ct2.c2),
      pk.exponentiation(cs, r),
    );
    return new CLHSM2kCiphertext(c1, c2);
  }

  public static scal_ciphertexts(
    cs: CLHSM2k,
    pk: CLHSM2kPublicKey,
    pt: CLHSM2kCleartext,
    ct: CLHSM2kCiphertext,
    r: bigint,
  ): CLHSM2kCiphertext {
    let c1 = cs.cl_g.nucomp(cs.power_of_h(r), cs.cl_g.nupow(ct.c1, pt.m));
    let c2 = cs.cl_delta.nucomp(
      cs.cl_delta.nupow(ct.c2, pt.m),
      pk.exponentiation(cs, r),
    );
    return new CLHSM2kCiphertext(c1, c2);
  }
}

class AccessStructure {
  private t_m: number;
  private n_m: number;

  constructor(t: number, n: number) {
    if (t < 1) {
      throw new Error('t must be greater than or equal to 1');
    }
    if (n < t) {
      throw new Error('n must be greater than or equal to t');
    }
    if (Number.isInteger(t) === false) {
      throw new Error('t must be an integer');
    }
    if (Number.isInteger(n) === false) {
      throw new Error('n must be an integer');
    }

    this.t_m = t;
    this.n_m = n;
  }

  public get t(): number {
    return this.t_m;
  }

  public get n(): number {
    return this.n_m;
  }
}

class ISP {
  private M_m: number[][];
  private Sie_m: number[][];

  constructor(M: number[][], Sie: number[][]) {
    if (M.length < 1) {
      throw new Error('M and Sie must have at least one row');
    }
    this.M_m = M;
    this.Sie_m = Sie;
  }
  public get M(): number[][] {
    return this.M_m;
  }
  public get Sie(): number[][] {
    return this.Sie_m;
  }
  public get rows(): number {
    return this.M_m.length;
  }
  public get cols(): number {
    return this.M_m[0]!.length;
  }
}

function compute_M_OR(Ma: number[][], Mb: number[][]): number[][] {
  const da = Ma.length;
  const ea = Ma[0]!.length;
  const db = Mb.length;
  const eb = Mb[0]!.length;

  const M_OR_rows = da + db;
  const M_OR_cols = ea + eb - 1;

  const M_OR: number[][] = Array.from({ length: M_OR_rows }, () =>
    Array(M_OR_cols).fill(0),
  );

  for (let i = 0; i < da; ++i) {
    M_OR[i]![0] = Ma[i]![0]!;
  }
  for (let i = 0; i < db; ++i) {
    M_OR[da + i]![0] = Mb[i]![0]!;
  }

  for (let i = 0; i < da; ++i) {
    for (let j = 1; j < ea; ++j) {
      M_OR[i]![j] = Ma[i]![j]!;
    }
  }

  for (let i = 0; i < db; ++i) {
    for (let j = 1; j < eb; ++j) {
      M_OR[da + i]![ea + j - 1] = Mb[i]![j]!;
    }
  }

  return M_OR;
}

function compute_M_AND(Ma: number[][], Mb: number[][]): number[][] {
  const da = Ma.length;
  const ea = Ma[0]!.length;
  const db = Mb.length;
  const eb = Mb[0]!.length;

  const M_AND_rows = da + db;
  const M_AND_cols = ea + eb;

  const M_AND: number[][] = Array.from({ length: M_AND_rows }, () =>
    Array(M_AND_cols).fill(0),
  );

  for (let i = 0; i < da; ++i) {
    M_AND[i]![0] = Ma[i]![0]!;
    M_AND[i]![1] = Ma[i]![0]!;
  }
  for (let i = 0; i < db; ++i) {
    M_AND[da + i]![1] = Mb[i]![0]!;
  }

  for (let i = 0; i < da; ++i) {
    for (let j = 1; j < ea; ++j) {
      M_AND[i]![j + 1] = Ma[i]![j]!;
    }
  }

  for (let i = 0; i < db; ++i) {
    for (let j = 1; j < eb; ++j) {
      M_AND[da + i]![ea + j] = Mb[i]![j]!;
    }
  }

  return M_AND;
}

function generate_distribution_matrix_M(
  n: number,
  t: number,
  threshold_combinations: number,
): number[][] {
  const Mu = [[1]];
  let Mt = [[1]];

  for (let i = 1; i < t; i++) {
    Mt = compute_M_AND(Mt, Mu);
  }

  let M = Mt;
  for (let i = 1; i < threshold_combinations; i++) {
    M = compute_M_OR(M, Mt);
  }
  return M;
}

function nCr(n: number, r: number): number {
  if (r > n) {
    return 0;
  }
  if (r === 0 || r === n) {
    return 1;
  }
  if (r > n - r) {
    r = n - r;
  }
  let res = 1;
  for (let i = 0; i < r; i++) {
    res *= n - i;
    res /= i + 1;
  }
  return res;
}

function generate_isp(A: AccessStructure): ISP {
  const n = A.n;
  const t = A.t;
  const threshold_combinations = nCr(n, t);
  const M = generate_distribution_matrix_M(n, t, threshold_combinations);

  const Sie: number[][] = Array.from({ length: threshold_combinations }, () =>
    Array(t).fill(0),
  );
  let M_row_num = 0;
  for (let i = 0; i < threshold_combinations; i++) {
    for (let j = 0; j < t; j++) {
      Sie[i]![j] = M_row_num++;
    }
  }

  return new ISP(M, Sie);
}

function compute_rho(
  secret: bigint,
  e: number,
  hsm2k: CLHSM2k,
  randgen: RandGen,
): bigint[] {
  const rho: bigint[] = new Array(e);
  rho[0] = secret;
  for (let i = 1; i < e; i++) {
    rho[i] = randgen.random_bigint(hsm2k.encrypt_randomness_bound);
  }
  return rho;
}

function compute_shares(isp: ISP, rho: bigint[]): bigint[][] {
  const M = isp.M;
  const Sie = isp.Sie;
  const rows = isp.rows;
  const cols = isp.cols;

  const shares: bigint[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0n),
  );

  let ii = 0;
  for (const Sp of Sie) {
    let jj = 0;
    for (const i of Sp) {
      let sij = BigInt(0);
      if (i !== -1) {
        for (let j = 0; j < cols; j++) {
          sij += rho[j]! * BigInt(M[i]![j]!);
        }
      }
      shares[ii]![jj] = sij;
      jj++;
    }
    ii++;
  }
  return shares;
}

function get_shares(
  hsm2k: CLHSM2k,
  randgen: RandGen,
  isp: ISP,
  secret: bigint,
): bigint[][] {
  const rho = compute_rho(secret, isp.cols, hsm2k, randgen);
  return compute_shares(isp, rho);
}

function compute_lambda(t: number): bigint[] {
  const lambda: bigint[] = [BigInt(1)];
  for (let i = 0; i < t; i++) {
    lambda.push(BigInt(-1));
  }
  return lambda;
}

function compute_d(hsm2k: CLHSM2k, ds: QFI[], lambda: bigint[]): QFI {
  let d = new QFI(1n, 1n, 1n);
  for (let i = 0; i < ds.length; i++) {
    const r = hsm2k.cl_delta.nupow(ds[i]!, lambda[i]!);
    d = hsm2k.cl_delta.nucomp(d, r);
  }
  return d;
}

function partialDecrypt(
  hsm2k: CLHSM2k,
  ct: CLHSM2kCiphertext,
  ski: bigint,
): QFI {
  return hsm2k.cl_g.nupow(ct.c1, ski);
}

function finalDecrypt(
  hsm2k: CLHSM2k,
  ct: CLHSM2kCiphertext,
  ds: QFI[],
): CLHSM2kCleartext {
  const lambda = compute_lambda(ds.length);
  const d = compute_d(hsm2k, ds, lambda);
  let r = hsm2k.cl_delta.nucompinv(ct.c2, d); /* c2 . d^-1 */
  return new CLHSM2kCleartext(hsm2k.dlog_in_F(r));
}

function get_next_lexio_combination(
  current_combination: number[],
  n: number,
  t: number,
): number[] {
  const next_combination = [...current_combination];
  let j = t - 1;
  while (j >= 0 && next_combination[j] === n - t + j) {
    j--;
  }
  if (j >= 0) {
    next_combination[j]!++;
    for (let k = j + 1; k < t; k++) {
      next_combination[k] = next_combination[j]! + k - j;
    }
  }
  return next_combination;
}

export type CLHSM2kSecretKeyShare = bigint;
export type CLHSM2kPartialDecryptionResult = QFI;

export class CLHSM2k {
  private randgen: RandGen;
  private large_message_variant_used_m: boolean;
  private n_m: bigint;
  private k_m: number;
  private m_m: bigint;
  private cl_delta_k_m: ClassGroup;
  private cl_delta_m: ClassGroup;
  private h_m: QFI;
  private distance_m: bigint;
  private exponent_bound_m: bigint;
  private d_m: number;
  private e_m: number;
  private h_e_precomp_m: QFI;
  private h_d_precomp_m: QFI;
  private h_de_precomp_m: QFI;

  constructor(
    n: bigint,
    k: number,
    cl_delta_k_class_number_bound: bigint = 0n,
  ) {
    if (k < 1) {
      throw new Error('k must be greater than or equal to 1');
    }
    this.randgen = new RandGen();
    this.n_m = n;
    this.k_m = k;
    this.cl_delta_k_m = new ClassGroup(
      this.compute_delta_k(this.n_m),
      cl_delta_k_class_number_bound,
    );
    this.cl_delta_m = new ClassGroup(
      this.compute_delta(this.cl_delta_k_m.disc(), k),
    );
    // see this
    this.distance_m = 0n;

    this.m_m = 2n ** BigInt(this.k_m);
    this.large_message_variant_used_m = this.m_m ** 2n - 1n + this.delta_k > 0n;

    let l = 2n;
    while (kronecker(l, this.delta) !== 1) {
      l = next_prime(l);
    }
    this.h_m = this.cl_delta_m.primeform(l);
    this.h_m = this.cl_delta_m.nudupl(this.h_m);

    this.h_m = this.raise_to_power_m(this.cl_delta_m, this.h_m);
    this.exponent_bound_m = this.cl_delta_k_m.class_number_bound();
    this.distance_m = this.distance_m < 2n ? 42n : this.distance_m;
    this.exponent_bound_m =
      this.exponent_bound_m * 2n ** (this.distance_m - 2n);

    this.d_m = Math.floor((nbits(this.exponent_bound_m) + 1) / 2);
    this.e_m = Math.floor(this.d_m / 2) + 1;
    this.h_de_precomp_m = this.h_m.clone();
    this.h_d_precomp_m = this.h_m.clone(); // just for typescript
    this.h_e_precomp_m = this.h_m.clone(); // just for typescript
    for (let i = 0; i < this.d_m + this.e_m; i++) {
      if (i === this.e_m) {
        this.h_e_precomp_m = this.h_de_precomp_m.clone();
      }
      if (i === this.d_m) {
        this.h_d_precomp_m = this.h_de_precomp_m.clone();
      }
      this.h_de_precomp_m = this.cl_g.nudupl(this.h_de_precomp_m);
    }
  }

  public static create(sec_bits: number, k: number): CLHSM2k {
    return new CLHSM2k(CLHSM2k.random_n(sec_bits, new RandGen()), k);
  }

  public get large_message_variant_used(): boolean {
    return this.large_message_variant_used_m;
  }

  public get n(): bigint {
    return this.n_m;
  }

  public get k(): number {
    return this.k_m;
  }

  public get m(): bigint {
    return this.m_m;
  }

  public get delta_k(): bigint {
    return this.cl_delta_k_m.disc();
  }

  public get delta(): bigint {
    return this.cl_delta_m.disc();
  }

  public get cl_delta_k(): ClassGroup {
    return this.cl_delta_k_m;
  }
  public get cl_delta(): ClassGroup {
    return this.cl_delta_m;
  }

  public get cl_g(): ClassGroup {
    return this.cl_delta_m;
  }

  public get h(): QFI {
    return this.h_m;
  }

  public get secretkey_bound(): bigint {
    return this.exponent_bound_m;
  }
  public get cleartext_bound(): bigint {
    return this.m_m;
  }
  public get encrypt_randomness_bound(): bigint {
    return this.exponent_bound_m;
  }
  public get lambda_distance(): bigint {
    return this.distance_m;
  }

  public power_of_h(n: bigint): QFI {
    return this.cl_g.nupow_2_forms_2exp(
      this.h_m,
      n,
      this.d_m,
      this.e_m,
      this.h_e_precomp_m,
      this.h_d_precomp_m,
      this.h_de_precomp_m,
    );
  }

  public power_of_f(m: bigint): QFI {
    const val2_ = val2(m);
    if (val2_ >= this.k_m) {
      return this.cl_delta_m.one();
    } else {
      let m00 = 1n;
      let m01 = 0n;
      let m10 = 0n;
      let m11 = 1n;
      let minusQ = this.delta_k - 1n;

      for (let i = Number(this.k_m); i > 0; i--) {
        const t0 = mod(m00 * m00 + m01 * m10, this.m_m);
        const t1 = mod(m00 * m01 + m01 * m11, this.m_m);
        const t2 = mod(m10 * m00 + m11 * m10, this.m_m);
        const t3 = mod(m10 * m01 + m11 * m11, this.m_m);
        m00 = t0;
        m01 = t1;
        m10 = t2;
        m11 = t3;

        if (tstbit(m, i - 1)) {
          m00 = mod(m00 * minusQ + m10 * 2n, this.m_m);
          m01 = mod(m01 * minusQ + m11 * 2n, this.m_m);
          [m00, m10] = [m10, m00];
          [m01, m11] = [m11, m01];
        }
      }

      let t0 = m00 + m01;
      let t1 = divby2k(m01, val2_);
      let t2 = mod_inverse_2exp(t1, this.k_m - val2_);
      t0 = mod2k_centered(t0 * t2, this.k_m - val2_);
      t1 = 2n ** BigInt(2 * (this.k_m - val2_));
      t2 = 2n ** BigInt(this.k_m - val2_ + 1) * t0;
      let t3 = 2n ** BigInt(2 * val2_ + 3) * this.n_m;
      t3 += t0 ** 2n;
      return new QFI(t1, t2, t3);
    }
  }

  public dlog_in_F(fm: QFI): bigint {
    if (fm.is_one()) return 0n;
    let m = 0n;
    let tm = 0n;
    if (this.large_message_variant_used) {
      tm = fm.kernel_representative_2exp(this.k_m + 1, this.delta_k);
    } else {
      const j = val2(fm.b()) - 1;
      tm =
        mod_inverse_2exp(divby2k(fm.b(), j + 1), j) *
        2n ** BigInt(this.k_m - j);
    }
    tm = mod(tm, this.m_m);
    let t = 1n;
    for (let i = 0; i < this.k_m; i++) {
      const val2_ = tm > 0n ? val2(tm) : Number.MAX_SAFE_INTEGER;
      if (val2_ === i) {
        m = setbit(m, i);
        tm = this.F_kerphi_div(tm, t);
      }
      t = this.F_kerphi_square(t);
    }
    return m;
  }

  public from_Cl_DeltaK_to_Cl_Delta(f: QFI): QFI {
    let r = f.clone();
    r.lift_2exp(this.k_m + 1);
    r = this.raise_to_power_m(this.cl_delta_m, r);
    if (mod(r.a(), 4n) === 3n || mod(r.c(), 4n) === 3n) {
      r = this.cl_delta_m.nucomp(
        r,
        new QFI(4n, 4n, this.delta_k * 2n ** BigInt(2 * (this.k_m - 1)) - 1n),
      );
    }
    return r;
  }

  public keygen(): CLHSM2kSecretKey;
  public keygen(sk: CLHSM2kSecretKey): CLHSM2kPublicKey;
  public keygen(
    sk: CLHSM2kSecretKey,
    t: number,
    n: number,
  ): CLHSM2kSecretKeyShare[][];
  public keygen(
    sk?: CLHSM2kSecretKey,
    t?: number,
    n?: number,
  ): CLHSM2kSecretKey | CLHSM2kPublicKey | CLHSM2kSecretKeyShare[][] {
    if (sk === undefined)
      return CLHSM2kSecretKey.create_new(this, this.randgen);
    if (t === undefined || n === undefined)
      return CLHSM2kPublicKey.create_new(this, sk);

    let isp = generate_isp(new AccessStructure(t, n));
    let shares = get_shares(this, this.randgen, isp, sk.sk);
    let secret_key_shares: CLHSM2kSecretKeyShare[][] = Array.from(
      { length: n },
      () => Array(),
    );
    let current_threshold_combination = Array.from({ length: n }, (_, i) => i);
    for (let i = 0; i < nCr(n, t); i++) {
      for (let j = 0; j < t; j++)
        secret_key_shares[current_threshold_combination[j]!]!.push(
          shares[i]![j]!,
        );
      current_threshold_combination = get_next_lexio_combination(
        current_threshold_combination,
        n,
        t,
      );
    }
    return secret_key_shares;
  }

  public create_cleartext(m: bigint): CLHSM2kCleartext {
    if (m < 0n || m >= this.cleartext_bound) {
      throw new Error('Cleartext out of bounds');
    }
    return CLHSM2kCleartext.create_new(m);
  }

  public encrypt(
    pk: CLHSM2kPublicKey,
    m: CLHSM2kCleartext,
    r?: bigint,
  ): CLHSM2kCiphertext {
    if (r === undefined) {
      r = this.randgen.random_bigint(this.encrypt_randomness_bound);
    }
    return CLHSM2kCiphertext.create_new(this, pk, m, r);
  }

  public decrypt(
    sk: CLHSM2kSecretKey,
    ct: CLHSM2kCiphertext,
  ): CLHSM2kCleartext {
    return CLHSM2kCleartext.decrypt(this, sk, ct);
  }

  public partial_decryption(
    ski: CLHSM2kSecretKeyShare,
    ct: CLHSM2kCiphertext,
  ): CLHSM2kPartialDecryptionResult {
    return partialDecrypt(this, ct, ski);
  }

  public combine_partial_decryption_results(
    ct: CLHSM2kCiphertext,
    ds: CLHSM2kPartialDecryptionResult[],
  ): CLHSM2kCleartext {
    return finalDecrypt(this, ct, ds);
  }

  public add_ciphertexts(
    pk: CLHSM2kPublicKey,
    ca: CLHSM2kCiphertext,
    cb: CLHSM2kCiphertext,
  ): CLHSM2kCiphertext {
    return CLHSM2kCiphertext.add_ciphertexts(
      this,
      pk,
      ca,
      cb,
      this.randgen.random_bigint(this.encrypt_randomness_bound),
    );
  }

  public scal_ciphertexts(
    pk: CLHSM2kPublicKey,
    pt: CLHSM2kCleartext,
    ct: CLHSM2kCiphertext,
  ): CLHSM2kCiphertext {
    return CLHSM2kCiphertext.scal_ciphertexts(
      this,
      pk,
      pt,
      ct,
      this.randgen.random_bigint(this.encrypt_randomness_bound),
    );
  }

  private static random_n(n_bits: number, randgen: RandGen): bigint {
    let p = randgen.random_prime(Math.floor((n_bits + 1) / 2));
    while (mod(p, 8n) !== 3n && mod(p, 8n) !== 5n) {
      p = next_prime(p);
    }

    let q = randgen.random_prime(Math.floor(n_bits / 2));
    const q_mod_8 = mod(p, 8n) === 3n ? 5n : 3n;
    while (mod(q, 8n) !== q_mod_8) {
      q = next_prime(q);
    }

    return p * q;
  }

  private compute_delta_k(n: bigint): bigint {
    return -8n * n;
  }

  private compute_delta(delta_k: bigint, k: number): bigint {
    return 2n ** BigInt(2 * (k + 1)) * delta_k;
  }

  private raise_to_power_m(cl: ClassGroup, f_: QFI): QFI {
    let f = f_.clone();
    for (let i = 0; i < this.k_m; i++) {
      f = cl.nudupl(f);
    }
    return f;
  }

  private F_kerphi_square(t: bigint): bigint {
    return mod(
      t *
        2n *
        mod_inverse_2exp(
          mod(mod(t ** 2n, this.m_m) * this.delta_k + 1n, this.m_m),
          this.k_m,
        ),
      this.m_m,
    );
  }
  private F_kerphi_div(t: bigint, s: bigint): bigint {
    return mod(
      (t - s) *
        mod_inverse_2exp(
          mod(1n - mod(t * s, this.m_m) * this.delta_k, this.m_m),
          this.k_m,
        ),
      this.m_m,
    );
  }
}
