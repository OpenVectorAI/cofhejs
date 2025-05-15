import BigNumber from 'bignumber.js';

import {
  abs_mod,
  cdiv_qr,
  ceil_abslog_sqr,
  cmp_abs,
  divby2,
  divby2k,
  extract_bits,
  fdiv_qr,
  fourth_root_abs,
  gcd,
  gcdext,
  GMP_LIMB_BITS,
  kronecker,
  mod,
  mod_inverse,
  mod_inverse_2exp,
  nbits,
  nbits_abs,
  next_prime,
  partial_euclid,
  sqrt_abs,
  sqrt_mod_prime,
  tstbit,
  val2,
} from './bigint_utils.js';

class JSF {
  private vec: Uint8Array;

  public constructor(n0: bigint, n1: bigint) {
    this.vec = new Uint8Array(Math.max(nbits(n0), nbits(n1)) + 1);
    let d0 = 0;
    let d1 = 0;
    let n0j = tstbit(n0, 0) ? 1 : 0;
    let n0jp1 = tstbit(n0, 1) ? 1 : 0;
    let n0jp2 = tstbit(n0, 2) ? 1 : 0;
    let n1j = tstbit(n1, 0) ? 1 : 0;
    let n1jp1 = tstbit(n1, 1) ? 1 : 0;
    let n1jp2 = tstbit(n1, 2) ? 1 : 0;

    for (let j = 0; j < this.vec.length; j++) {
      let u0, u1;
      let b0 = Number(d0 == n0j) && n0jp1 ^ d0;
      let b1 = Number(d1 == n1j) && n1jp1 ^ d1;

      if (d0 == n0j) {
        u0 = 0;
      } else {
        u0 = n0jp1 ^ ((n0jp2 ^ n0jp1) & b1) ? 3 : 1;
        d0 = u0 >> 1;
      }

      if (d1 == n1j) {
        u1 = 0;
      } else {
        u1 = n1jp1 ^ ((n1jp2 ^ n1jp1) & b0) ? 3 : 1;
        d1 = u1 >> 1;
      }

      // this.vec[j] = u0 | (u1 << 2);
      this.set(j, u0, u1);
      n0j = n0jp1;
      n0jp1 = n0jp2;
      n0jp2 = tstbit(n0, j + 3) ? 1 : 0;
      n1j = n1jp1;
      n1jp1 = n1jp2;
      n1jp2 = tstbit(n1, j + 3) ? 1 : 0;
    }
    if (this.vec[this.vec.length - 1] == 0) {
      this.vec = this.vec.slice(0, this.vec.length - 1);
    }
  }

  public size(): number {
    return this.vec.length;
  }

  public get(i: number): number {
    if (i < 0 || i >= this.vec.length) {
      return 0;
    }
    return this.vec[i] ?? 0;
  }

  public set(i: number, u0: number, u1: number) {
    if (i < 0 || i >= this.vec.length) {
      return;
    }
    this.vec[i] = u0 | (u1 << 4);
  }
}

export class OpsAuxVars {
  // Ax, Ay, Bx, By, Cx, Cy, Dx, Dy, m00, m01, m10, m11, t0, t1,
  // m, s,  F, u, v, x, y, H, l, q, by;
  public Ax: bigint;
  public Bx: bigint;
  public Ay: bigint;
  public By: bigint;
  public Cx: bigint;
  public Cy: bigint;
  public Dx: bigint;
  public Dy: bigint;
  public m00: bigint;
  public m01: bigint;
  public m10: bigint;
  public m11: bigint;
  public t0: bigint;
  public t1: bigint;
  public m: bigint;
  public s: bigint;
  public F: bigint;
  public u: bigint;
  public v: bigint;
  public x: bigint;
  public y: bigint;
  public H: bigint;
  public l: bigint;
  public q: bigint;
  public by: bigint;
  constructor() {
    this.Ax = 0n;
    this.Bx = 0n;
    this.Ay = 0n;
    this.By = 0n;
    this.Cx = 0n;
    this.Cy = 0n;
    this.Dx = 0n;
    this.Dy = 0n;
    this.m00 = 0n;
    this.m01 = 0n;
    this.m10 = 0n;
    this.m11 = 0n;
    this.t0 = 0n;
    this.t1 = 0n;
    this.m = 0n;
    this.s = 0n;
    this.F = 0n;
    this.u = 0n;
    this.v = 0n;
    this.x = 0n;
    this.y = 0n;
    this.H = 0n;
    this.l = 0n;
    this.q = 0n;
    this.by = 0n;
  }
}

export class QFI {
  private a_m: bigint;
  private b_m: bigint;
  private c_m: bigint;

  constructor(a: bigint, b: bigint, c: bigint) {
    this.a_m = a;
    this.b_m = b;
    this.c_m = c;
  }

  public clone(): QFI {
    return new QFI(this.a_m, this.b_m, this.c_m);
  }

  public a(): bigint {
    return this.a_m;
  }
  public b(): bigint {
    return this.b_m;
  }
  public c(): bigint {
    return this.c_m;
  }

  /**
   * Calculates the discriminant of the form
   */
  public discriminant(): bigint {
    return this.b_m ** 2n - 4n * this.a_m * this.c_m;
  }

  /**
   * Checks if the form is the neutral element of the class group
   */
  public is_one(): boolean {
    return this.a_m == 1n;
  }

  /**
   * Makes the form negative
   */
  public neg() {
    if (this.a_m != this.c_m && this.a_m != this.b_m) this.b_m = -this.b_m;
  }

  /**
   * Returns ax^2 + bxy + cy^2
   * @param x
   * @param y
   */
  public eval(x: bigint, y: bigint): bigint {
    return this.a_m * x ** 2n + this.b_m * x * y + this.c_m * y ** 2n;
  }

  /*
   * Lift the qfi into an qfi of discriminant l^2 times the discriminant of the
   * form.
   *
   * Assumes l is a prime power.
   *
   * Ref: Algorithm 2 (GoToNonMaxOrder) of [HJPT1998]_.
   *
   * The l-lift of f=(a,b,c) is (a, l*b, l^2*c) if a is prime to l.
   * So, first we need to move f to a an equivalent representation with the first
   * coeff prime to l. Then we apply the above formula. And finally we reduce the
   * new form.
   */
  public lift(l: bigint) {
    this.prime_to(l);
    this.b_m *= l;
    this.c_m *= l ** 2n;
    this.reduction();
  }

  public lift_2exp(k: number) {
    this.prime_to_2exp();
    let k_b = BigInt(k);
    this.b_m *= 2n ** k_b;
    this.c_m *= 2n ** (2n * k_b);
    this.reduction();
  }

  public to_maximal_order(
    l: bigint,
    deltaK: bigint,
    with_reduction: boolean = true,
  ) {
    if (l <= 1n || (l & (l - 1n)) === 0n) {
      throw new Error('l must be a prime power.');
    }
    if (abs_mod(deltaK, 2n) === 0n) {
      throw new Error('deltaK must be odd.');
    }
    this.prime_to(l);
    let [g0, g1, _] = gcdext(l, this.a_m);
    this.b_m = this.b_m * g0 + this.a_m * g1;
    this.set_c_from_disc(deltaK);
    if (with_reduction) {
      this.reduction();
    }
  }

  public to_maximal_order_2exp(
    k: number,
    deltaK: bigint,
    with_reduction: boolean = true,
  ) {
    if (abs_mod(deltaK, 2n) !== 0n) {
      throw new Error('deltaK must be even.');
    }
    this.prime_to_2exp();
    let k_b = BigInt(k);
    let u = (1n - this.a_m * mod_inverse_2exp(this.a_m, k)) / 2n ** k_b;
    this.b_m = this.b_m * u;
    this.set_c_from_disc(deltaK);
    if (with_reduction) {
      this.reduction();
    }
  }

  public kernel_representative(l: bigint, deltaK: bigint): bigint {
    let g0 = 1n;
    let g1 = 0n;
    const ft = this.clone();
    ft.to_maximal_order(l, deltaK, false);

    ft.normalize();
    while (cmp_abs(ft.a_m, ft.c_m) > 0) {
      let tmp0 = g1 * deltaK;
      g1 = g1 * ft.b_m + g0;
      g0 = g0 * ft.b_m + tmp0;
      ft.rho();
    }

    if (ft.a_m !== 1n || ft.b_m !== 1n) {
      throw new Error('The form is not in the kernel.');
    }

    const g0_g1_gcd = gcd(g0, g1);
    g0 /= g0_g1_gcd;
    g1 /= g0_g1_gcd;

    const inv = mod_inverse(g0, l);
    g1 = -g1;
    return mod(inv * g1, l);
  }

  public kernel_representative_2exp(k: number, deltaK: bigint): bigint {
    let g0 = 1n;
    let g1 = 0n;
    const ft = new QFI(this.a_m, this.b_m, this.c_m);
    ft.to_maximal_order_2exp(k, deltaK, false);

    ft.normalize();
    while (cmp_abs(ft.a_m, ft.c_m) > 0) {
      let tmp0 = g1 * deltaK;
      g1 = g1 * ft.b_m + g0;
      g0 = g0 * ft.b_m + tmp0;
      ft.rho();
    }

    if (ft.a_m !== 1n || ft.b_m !== 0n) {
      throw new Error('The form is not in the kernel.');
    }

    const v = val2(g0);
    const two_pow_v = 2n ** BigInt(v);
    g0 /= two_pow_v;
    g1 /= two_pow_v;

    const inv = mod(mod_inverse_2exp(g0, k), 2n ** BigInt(k));
    g1 = -g1;
    return mod(inv * g1, 2n ** BigInt(k));
  }

  public set_c_from_disc(disc: bigint) {
    this.c_m = (this.b_m * this.b_m - disc) / (4n * this.a_m);
  }

  public normalize() {
    let [q, r] = cdiv_qr(this.b_m, this.a_m);
    if (abs_mod(q, 2n) === 1n) r += this.a_m;
    q = divby2(q);
    [this.b_m, r] = [r, this.b_m];
    r += this.b_m;
    r = divby2(r);
    this.c_m -= q * r;
  }

  public rho() {
    [this.a_m, this.c_m] = [this.c_m, this.a_m];
    this.b_m = -this.b_m;
    this.normalize();
  }

  public reduction() {
    let cmp = 0;
    this.normalize();
    while ((cmp = cmp_abs(this.a_m, this.c_m)) > 0) this.rho();
    if (cmp == 0 && this.b_m < 0n) this.b_m = -this.b_m;
  }

  public prime_to(l: bigint) {
    let g = gcd(this.a_m, l);
    if (g > 1n) {
      g = gcd(this.c_m, l);
      if (g > 1n) {
        // Transform f into (a+b+c, -b-2a, a)
        const old_a = this.a_m;
        const old_b = this.b_m;
        const old_c = this.c_m;
        this.a_m = old_a + old_b + old_c; // New 'a'
        this.b_m = -old_b - 2n * old_a; // New 'b'
        this.c_m = old_a; // New 'c'
      } else {
        // Transform f into (c, -b, a)
        const old_a = this.a_m;
        this.a_m = this.c_m;
        this.c_m = old_a;
        this.b_m = -this.b_m;
      }
    }
  }

  public prime_to_2exp() {
    if (abs_mod(this.a_m, 2n) === 0n) {
      if (abs_mod(this.c_m, 2n) === 0n) {
        // c is also even
        // Transform f into (a+b+c, -b-2a, a)
        const old_a = this.a_m;
        const old_b = this.b_m;
        const old_c = this.c_m;
        this.a_m = old_a + old_b + old_c; // New 'a'
        this.b_m = -old_b - 2n * old_a; // New 'b'
        this.c_m = old_a; // New 'c'
      } else {
        // c is odd
        // Transform f into (c, -b, a)
        const old_a = this.a_m;
        this.a_m = this.c_m;
        this.c_m = old_a;
        this.b_m = -this.b_m;
      }
    }
  }

  public static nucomp(f1: QFI, f2: QFI, L: bigint, negf2: boolean): QFI {
    let tmp = new OpsAuxVars();
    let r = new QFI(0n, 0n, 0n);
    tmp.s = divby2(f1.b_m + f2.b_m);
    tmp.m = f2.b_m - tmp.s;
    if (negf2) [tmp.m, tmp.s] = [-tmp.s, -tmp.m];

    [tmp.u, tmp.v, tmp.F] = gcdext(f1.a_m, f2.a_m);

    if (tmp.F == 1n) {
      tmp.Ax = 1n;
      tmp.Bx = tmp.m * tmp.v; // Bx = m*v
      tmp.By = f1.a();
    } else if (abs_mod(tmp.s, tmp.F) === 0n) {
      tmp.Ax = tmp.F;
      tmp.Bx = tmp.m * tmp.v; // Bx = m*v
      tmp.By = f1.a() / tmp.Ax;
    } else {
      [tmp.x, tmp.y, tmp.Ax] = gcdext(tmp.F, tmp.s);
      tmp.H = tmp.F / tmp.Ax;
      tmp.t0 = mod(f1.c_m, tmp.H);
      tmp.t1 = mod(f2.c_m, tmp.H);
      tmp.t0 = mod(tmp.t0 * tmp.v + tmp.t1 * tmp.u, tmp.H);
      tmp.l = mod(tmp.t0 * tmp.y, tmp.H);
      tmp.By = f1.a_m / tmp.Ax;
      tmp.Bx = (tmp.v * tmp.m + tmp.l * tmp.By) / tmp.H;
    }

    tmp.Cy = f2.a_m / tmp.Ax;
    tmp.Dy = tmp.s / tmp.Ax;
    tmp.Bx = mod(tmp.Bx, tmp.By);
    tmp.by = tmp.By;

    const Lsize = Math.ceil(nbits_abs(L) / GMP_LIMB_BITS);
    [tmp.Bx, tmp.by, tmp.m00, tmp.m01, tmp.m10, tmp.m11] = partial_euclid(
      tmp.Bx,
      tmp.by,
      Lsize,
    );

    tmp.Ay = -1n * (tmp.m10 * tmp.Ax);

    tmp.Cx = (tmp.Bx * tmp.Cy - tmp.m * tmp.m11) / tmp.By;
    if (tmp.Bx == 0n) tmp.Cy = (f2.a_m * tmp.by - tmp.Ay * tmp.m) / f1.a_m;
    else tmp.Cy = (tmp.Cx * tmp.by + tmp.m) / tmp.Bx;

    tmp.Dx = (tmp.Bx * tmp.Dy - f2.c_m * tmp.m11) / tmp.By;
    tmp.Dy -= tmp.Dx * tmp.m10;
    tmp.Dy /= tmp.m11;
    tmp.Ax *= tmp.m11;
    r.a_m = tmp.by * tmp.Cy - tmp.Ay * tmp.Dy;
    r.c_m = tmp.Bx * tmp.Cx - tmp.Ax * tmp.Dx;
    r.b_m =
      tmp.Ax * tmp.Dy + tmp.Ay * tmp.Dx - tmp.Bx * tmp.Cy - tmp.by * tmp.Cx;
    r.reduction();
    return r;
  }

  public static nudupl(f: QFI, L: bigint): QFI {
    let tmp = new OpsAuxVars();
    let r = new QFI(0n, 0n, 0n);
    [tmp.m11, tmp.m01, tmp.Ax] = gcdext(f.a_m, f.b_m);
    if (tmp.Ax !== 1n) {
      r.a_m = f.a_m / tmp.Ax;
      r.b_m = f.b_m / tmp.Ax;
    } else {
      r.a_m = f.a_m;
      r.b_m = f.b_m;
    }
    tmp.Dx = -f.c_m * tmp.m11;
    r.c_m = f.c_m * tmp.m01;
    [tmp.t0, r.c_m] = fdiv_qr(r.c_m, r.a_m);
    tmp.Dx = tmp.Dx - tmp.t0 * r.b_m;

    const Lsize = Math.ceil(nbits_abs(L) / GMP_LIMB_BITS);
    [r.c_m, r.a_m, tmp.m00, tmp.m01, tmp.m10, tmp.m11] = partial_euclid(
      r.c_m,
      r.a_m,
      Lsize,
    );
    tmp.t1 = -tmp.Ax * tmp.m10;
    tmp.Ax = tmp.Ax * tmp.m11;

    tmp.t0 = tmp.Dx * tmp.m11 - r.b_m * tmp.m01;
    r.b_m = r.b_m * tmp.m00 - tmp.Dx * tmp.m10;
    [tmp.Dx, tmp.t0] = [tmp.t0, tmp.Dx];

    tmp.t0 = r.a_m * r.c_m;

    r.a_m = r.a_m ** 2n - tmp.t1 * r.b_m;

    r.c_m = r.c_m ** 2n - tmp.Ax * tmp.Dx;

    r.b_m = tmp.Ax * r.b_m + tmp.t1 * tmp.Dx - 2n * tmp.t0;
    r.reduction();
    return r;
  }

  public static nupow(f: QFI, n: bigint, L: bigint): QFI {
    let r = new QFI(0n, 0n, 0n);
    if (n === 0n) {
      return new ClassGroup(f.discriminant()).one();
    }
    const w = 7;
    const pow2w = 1 << w; /* 2^w */
    const u = 1 << (w - 2); /* u = 2^(w-2) */

    let ff = this.nudupl(f, L); /* f^2 */
    let tab: QFI[] = [];

    tab.push(new QFI(f.a_m, f.b_m, f.c_m));
    for (let i = 1; i < u; i++) {
      tab.push(this.nucomp(tab[i - 1]!, ff, L, false));
    }

    let j = nbits(n) - 1;
    let c = 0n;

    // /* first digit is done out of the main loop */
    {
      // /* for the first digit we know that dj=1 and c=0 */
      let m = extract_bits(n, j, w);
      c = m & 0x1n; /* d_{j-w+1} */
      let t = m + (m & 0x1n); /* + d_{j-w+1} */
      let val2 = t.toString(2).split('').reverse().join('').indexOf('1');
      let tau = val2 < w ? val2 : w - 1;
      t >>= BigInt(tau);

      r = t == 2n ? ff : tab[Math.floor(Number(t) / 2)]!;
      let b = j < w - 1 ? tau + 1 + j - w : tau;
      for (let i = 0; i < b; i++) {
        r = this.nudupl(r, L);
      }
      j -= w;
    }

    while (j >= 0) {
      let m = extract_bits(n, j, w);
      let dj = (m >> BigInt(w - 1)) & 0x1n;
      let djmwp1 = m & 0x1n;

      if (c == dj) {
        r = this.nudupl(r, L);
        j -= 1;
      } else {
        let neg = c ? true : false;
        let t = m + djmwp1;
        t = c ? BigInt(pow2w) - t : t;
        c = djmwp1;

        let val2 =
          t > 0n
            ? t.toString(2).split('').reverse().join('').indexOf('1')
            : w - 1;
        let tau = val2 < w ? val2 : w - 1;
        t >>= BigInt(tau);
        for (let i = 0; i < w - tau; i++) r = this.nudupl(r, L);
        r = this.nucomp(r, t == 2n ? ff : tab[Number(t >> 1n)]!, L, neg);
        let b = j < w - 1 ? tau + 1 + j - w : tau;
        for (let i = 0; i < b; i++) r = this.nudupl(r, L);
        j -= w;
      }
    }

    if (c !== 0n) {
      r = this.nucomp(r, tab[0]!, L, true);
    }

    if (n < 0n) {
      r.neg();
    }
    return r;
  }

  public static nupow_2_forms(
    f0: QFI,
    n0: bigint,
    f1: QFI,
    n1: bigint,
    L: bigint,
  ): QFI {
    if (n0 == 0n && n1 == 0n) {
      return new ClassGroup(f0.discriminant()).one();
    } else if (n0 == 0n) {
      return QFI.nupow(f1, n1, L);
    } else if (n1 == 0n) {
      return QFI.nupow(f0, n0, L);
    } else {
      let r = new QFI(0n, 0n, 0n);

      let tab: QFI[] = [];
      tab.push(new QFI(f0.a_m, f0.b_m, f0.c_m));
      tab.push(new QFI(f1.a_m, f1.b_m, f1.c_m));
      tab.push(QFI.nucomp(f0, f1, L, false));
      tab.push(QFI.nucomp(f0, f1, L, true));

      let jsf = new JSF(n0, n1);

      let most_significant = jsf.get(jsf.size() - 1);
      if (most_significant == 0x01) {
        r = tab[0]!;
      } else if (most_significant == 0x10) {
        r = tab[1]!;
      } else if (most_significant == 0x11) {
        r = tab[2]!;
      }

      for (let j = jsf.size() - 1; j > 0; j--) {
        let d = jsf.get(j - 1);
        QFI.nudupl(r, L);
        if (d == 0x01) {
          r = QFI.nucomp(r, tab[0]!, L, false);
        } else if (d == 0x03) {
          r = QFI.nucomp(r, tab[0]!, L, true);
        } else if (d == 0x10) {
          r = QFI.nucomp(r, tab[1]!, L, false);
        } else if (d == 0x30) {
          r = QFI.nucomp(r, tab[1]!, L, true);
        } else if (d == 0x11) {
          r = QFI.nucomp(r, tab[2]!, L, false);
        } else if (d == 0x13) {
          r = QFI.nucomp(r, tab[3]!, L, true);
        } else if (d == 0x31) {
          r = QFI.nucomp(r, tab[3]!, L, false);
        } else if (d == 0x33) {
          r = QFI.nucomp(r, tab[2]!, L, true);
        }
      }
      return r;
    }
  }

  public static nupow_2_forms_2exp(
    f: QFI,
    n: bigint,
    d: number,
    e: number,
    fe: QFI,
    fd: QFI,
    fed: QFI,
    L: bigint,
  ): QFI {
    if (n === 0n) {
      return new ClassGroup(f.discriminant()).one();
    }
    if (nbits(n) < e) {
      return QFI.nupow(f, n, L);
    }
    let t00 = mod(n, 2n ** BigInt(d));
    let t01 = divby2k(n, d);

    let jsf = new JSF(t00, t01);

    let tab: QFI[] = new Array(40);

    tab[0] = f;
    tab[2] = fd;
    tab[8] = fe;
    tab[26] = fed;

    for (let B = 1, pow3 = 3, i = 0; i < 3; i++, B += pow3, pow3 *= 3) {
      for (let k = 0; k < B; k++) {
        tab[pow3 + k] = QFI.nucomp(tab[pow3 - 1]!, tab[k]!, L, false);
        tab[pow3 - k - 2] = QFI.nucomp(tab[pow3 - 1]!, tab[k]!, L, true);
      }
    }

    let r = new ClassGroup(f.discriminant()).one();
    for (let j = jsf.size(); j > 2 * e; j--) {
      let digh = jsf.get(j - 1);

      r = QFI.nudupl(r, L);

      if (digh != 0) {
        let idx = 0;
        idx += digh & 0x02 ? -9 : digh & 0x01 ? 9 : 0;
        idx += digh & 0x20 ? -27 : digh & 0x10 ? 27 : 0;

        let s = idx < 0;
        idx = idx < 0 ? -idx : idx;
        r = QFI.nucomp(r, tab[idx - 1]!, L, s);
      }
    }

    for (let j = 2 * e; j > e; j--) {
      let digh = jsf.get(j - 1);
      let digl = jsf.get(j - e - 1);

      r = QFI.nudupl(r, L);

      if (digh != 0 || digl != 0) {
        let idx = 0;
        idx += digl & 0x02 ? -1 : digl & 0x01 ? 1 : 0;
        idx += digl & 0x20 ? -3 : digl & 0x10 ? 3 : 0;
        idx += digh & 0x02 ? -9 : digh & 0x01 ? 9 : 0;
        idx += digh & 0x20 ? -27 : digh & 0x10 ? 27 : 0;

        let s = idx < 0;
        idx = idx < 0 ? -idx : idx;
        r = QFI.nucomp(r, tab[idx - 1]!, L, s);
      }
    }
    return r;
  }
}

export class ClassGroup {
  kronecker(l: bigint) {
    throw new Error('Method not implemented.');
  }
  private disc_m: bigint;
  private default_nucomp_bound_m: bigint;
  private class_number_bound_m: bigint;

  public constructor(disc_in: bigint, class_number_bound: bigint = 0n) {
    let disc = BigInt(disc_in);
    this.disc_m = disc;
    this.default_nucomp_bound_m = 0n;
    this.class_number_bound_m = class_number_bound;
    if (disc > 0n) {
      throw new Error('The discriminant must be negative.');
    }

    let dmod4 = mod(this.disc_m, 4n);
    if (dmod4 != 0n && dmod4 != 1n) {
      throw new Error(
        `The discriminant must be congruent to 0 or 1 mod 4, disc = ${this.disc_m}`,
      );
    }
    this.default_nucomp_bound_m = fourth_root_abs(this.disc_m);
  }

  public disc(): bigint {
    return this.disc_m;
  }

  public default_nucomp_bound(): bigint {
    return this.default_nucomp_bound_m;
  }

  public one(): QFI {
    return new QFI(
      1n,
      abs_mod(this.disc_m, 2n),
      (abs_mod(this.disc_m, 2n) - this.disc_m) / 4n,
    );
  }

  public primeform(l: bigint): QFI {
    let r = new QFI(l, sqrt_mod_prime(this.disc_m, l), 0n);
    if (abs_mod(r.b(), 2n) != abs_mod(this.disc_m, 2n)) {
      r = new QFI(r.a(), l - r.b(), r.c());
    }
    r.set_c_from_disc(this.disc_m);
    r.reduction();
    return r;
  }

  public class_number_bound(): bigint {
    if (this.class_number_bound_m == 0n) {
      this.class_number_bound_m = this.calc_class_number_bound();
    }
    return this.class_number_bound_m;
  }

  private calc_class_number_bound(): bigint {
    let primebound = ceil_abslog_sqr(this.disc_m);

    let prec = nbits(this.disc_m);

    BigNumber.config({
      DECIMAL_PLACES: prec,
      POW_PRECISION: prec,
    });
    let acc = new BigNumber(1);
    let t = new BigNumber(0);
    let d = new BigNumber(0);

    for (let l = 2n; l < primebound; l = next_prime(l)) {
      let k = kronecker(this.disc_m, l);
      let tmp: bigint = 0n;
      if (k < 0) tmp = l + BigInt(-k);
      else tmp = l - BigInt(k);
      t = new BigNumber(l);
      d = new BigNumber(tmp);
      t = t.div(d);
      acc = acc.multipliedBy(t);
    }

    let tmp = sqrt_abs(this.disc_m) * 21n;
    acc = acc.div(88n);
    t = new BigNumber(tmp);
    t = t.multipliedBy(acc);
    t = t.integerValue(BigNumber.ROUND_CEIL);
    this.class_number_bound_m = BigInt(t.toFixed());
    return this.class_number_bound_m;
  }

  public nucomp(f1: QFI, f2: QFI): QFI {
    return QFI.nucomp(f1, f2, this.default_nucomp_bound_m, false);
  }

  public nucompinv(f1: QFI, f2: QFI): QFI {
    return QFI.nucomp(f1, f2, this.default_nucomp_bound_m, true);
  }

  public nudupl(f: QFI): QFI {
    return QFI.nudupl(f, this.default_nucomp_bound_m);
  }

  public nudupl_niter(f: QFI, niter: number): QFI {
    let L = this.default_nucomp_bound_m;
    if (niter > 0) {
      for (let i = 0; i < niter; i++) {
        f = QFI.nudupl(f, L);
      }
    }
    return f;
  }

  public nupow(f: QFI, n: bigint): QFI {
    return QFI.nupow(f, n, this.default_nucomp_bound_m);
  }

  public nupow_2_forms(f0: QFI, n0: bigint, f1: QFI, n1: bigint): QFI {
    return QFI.nupow_2_forms(f0, n0, f1, n1, this.default_nucomp_bound_m);
  }
  public nupow_2_forms_2exp(
    f: QFI,
    n: bigint,
    d: number,
    e: number,
    fe: QFI,
    fd: QFI,
    fed: QFI,
  ): QFI {
    return QFI.nupow_2_forms_2exp(
      f,
      n,
      d,
      e,
      fe,
      fd,
      fed,
      this.default_nucomp_bound_m,
    );
  }
}
