import { CLHSM2k } from '../../../../src/cryptosystems/CPUCryptoSystem/internals/clhsm2k.js';

import { expect, test } from 'vitest';
import { RandGen } from '../../../../src/cryptosystems/CPUCryptoSystem/internals/randgen.js';
import { mod } from '../../../../src/cryptosystems/CPUCryptoSystem/internals/bigint_utils.js';

const ITERATIONS = 2;
const OP_ITERATIONS = 10;
const LAMDA = 128;
const K = 128;

test('CLHSM2k', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    const clhsm2k = CLHSM2k.create(LAMDA, K);
    const sk = clhsm2k.keygen();
    const pk = clhsm2k.keygen(sk);
    for (let i = 0; i < OP_ITERATIONS; i++) {
      let m = clhsm2k.create_cleartext(
        BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
      );
      if (i == 0) m = clhsm2k.create_cleartext(0n);
      const c = clhsm2k.encrypt(pk, m);
      const d = clhsm2k.decrypt(sk, c);
      expect(d).toEqual(m);

      const m1 = clhsm2k.create_cleartext(
        BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
      );
      const m2 = clhsm2k.create_cleartext(
        BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
      );
      const c1 = clhsm2k.encrypt(pk, m1);
      const c2 = clhsm2k.encrypt(pk, m2);
      const c3 = clhsm2k.add_ciphertexts(pk, c1, c2);
      const d3 = clhsm2k.decrypt(sk, c3);
      expect(d3).toEqual(
        clhsm2k.create_cleartext(mod(m1.m + m2.m, clhsm2k.cleartext_bound)),
      );

      const scalar = clhsm2k.create_cleartext(
        BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
      );
      const m3 = clhsm2k.create_cleartext(
        BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
      );
      const c4 = clhsm2k.encrypt(pk, m3);
      const c5 = clhsm2k.scal_ciphertexts(pk, scalar, c4);
      const d5 = clhsm2k.decrypt(sk, c5);
      expect(d5).toEqual(
        clhsm2k.create_cleartext(mod(m3.m * scalar.m, clhsm2k.cleartext_bound)),
      );
    }
    expect(clhsm2k.cleartext_bound).toBe(2n ** BigInt(K));
  }
});

test('CLHSM2k: partial decryption', () => {
  const clhsm2k = CLHSM2k.create(LAMDA, K);
  const sk = clhsm2k.keygen();
  const sk_shares = clhsm2k.keygen(sk, 2, 3);
  const party0_0_sk = sk_shares[0][0];
  const party1_0_sk = sk_shares[1][0];
  const pk = clhsm2k.keygen(sk);
  for (let i = 0; i < ITERATIONS; i++) {
    const m = clhsm2k.create_cleartext(
      BigInt(new RandGen().random_bigint(clhsm2k.cleartext_bound)),
    );
    const c = clhsm2k.encrypt(pk, m);
    const d = clhsm2k.decrypt(sk, c);
    expect(d).toEqual(m);

    const pd1 = clhsm2k.partial_decryption(party0_0_sk, c);
    const pd2 = clhsm2k.partial_decryption(party1_0_sk, c);

    const fd = clhsm2k.combine_partial_decryption_results(c, [pd1, pd2]);
    expect(fd).toEqual(m);
  }
});
