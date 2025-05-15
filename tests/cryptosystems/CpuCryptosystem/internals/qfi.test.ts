import { expect, test } from 'vitest';

import {
  QFI,
  ClassGroup,
} from '../../../../src/cryptosystems/CPUCryptoSystem/internals/qfi.js';
import { qfiCompTestData } from './data_qfi_comp_test.js';
import { qfiDuplTestData } from './data_qfi_dupl_test.js';
import { qfiPowTestData } from './data_qfi_pow_test.js';
import { qfiPow2TestData } from './data_qfi_pow2_test.js';
import { classgroupNumberTestData } from './data_qfi_class_number.js';
import { classgroupNuPowTestData } from './data_classgroup_nupow_test.js';

test('QFI: test QFI constructor', () => {
  const qfi = new QFI(4n, 5n, 3n);
  expect([qfi.a(), qfi.b(), qfi.c()]).toEqual([4n, 5n, 3n]);
});

test('ClassGroup: test nupow', () => {
  for (const { q1, n, q1exp, q1cpp } of classgroupNuPowTestData.slice(0, 10)) {
    const cl = new ClassGroup(q1.discriminant());
    expect(
      cl.nupow(q1, n),
      `For classgroup ${cl.disc()}, expected ${q1cpp} but got ${cl.nupow(q1, n)}` +
        `input ${q1}, n ${n}, expected ${q1cpp} but got ${cl.nupow(q1, n)}`,
    ).toEqual(q1cpp);
  }
});

test('QFI: test QFI nucomp', () => {
  for (const { q1, q2, L, is_neg, r } of qfiCompTestData) {
    const res = QFI.nucomp(q1, q2, L, is_neg);
    expect(
      res,
      `For qfi q1(${q1.a()}, ${q1.b()}, ${q1.c()})\} and q2 (${q2.a()}, ${q2.b()}, ${q2.c()})` +
        `and L ${L} with is_neg ${is_neg}, expected r(${r.a()}, ${r.b()}, ${r.c()})` +
        ` but got res(${res.a()}, ${res.b()}, ${res.c()})`,
    ).toEqual(r);
  }
});

test('QFI: test QFI nudupl', () => {
  for (const { f, L, r } of qfiDuplTestData) {
    const res = QFI.nudupl(f, L);
    expect(
      res,
      `For qfi f(${f.a()}, ${f.b()}, ${f.c()}) and L ${L}, expected r(${r.a()}, ${r.b()}, ${r.c()})` +
        ` but got res(${res.a()}, ${res.b()}, ${res.c()})`,
    ).toEqual(r);
  }
});

test('QFI: test QFI nupow', () => {
  for (const { f, n, L, r } of qfiPowTestData) {
    const res = QFI.nupow(f, n, L);
    expect(
      res,
      `For qfi f(${f.a()}, ${f.b()}, ${f.c()}) and n ${n} with L ${L}, expected r(${r.a()}, ${r.b()}, ${r.c()})` +
        ` but got res(${res.a()}, ${res.b()}, ${res.c()})`,
    ).toEqual(r);
  }
});

test('QFI: test QFI nupow_2_forms', () => {
  for (const { q1, q2, n1, n2, L } of qfiPow2TestData) {
    const res = QFI.nupow_2_forms(q1, n1, q2, n2, L);
    expect(
      res,
      `For qfi q1(${q1.a()}, ${q1.b()}, ${q1.c()}) and q2 (${q2.a()}, ${q2.b()}, ${q2.c()})` +
        `and n1 ${n1} and n2 ${n2} with L ${L}, expected r(${res.a()}, ${res.b()}, ${res.c()})` +
        ` but got res(${res.a()}, ${res.b()}, ${res.c()})`,
    ).toEqual(res);
  }
});

test('ClassGroup: test classnumber', () => {
  for (const [cl, expected, cppCodeValue] of classgroupNumberTestData) {
    expect(
      cl.class_number_bound(),
      `For classgroup ${cl.disc()}, expected ${cppCodeValue} but got ${cl.class_number_bound()}`,
    ).toEqual(cppCodeValue);
  }
}, 1000000);
