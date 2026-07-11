import { describe, expect, it } from 'vitest';

import { scorePassword } from './password-strength';

describe('scorePassword', () => {
  it('scores empty string as 0 / Empty', () => {
    expect(scorePassword('')).toEqual({ score: 0, label: 'Empty' });
  });

  it('never labels a gate-passing password Weak (4 classes + len>=8 => score>=2)', () => {
    // Abcdefg1* is the server DTO example: 9 chars, all 4 classes, meets the hard gate.
    const r = scorePassword('Abcdefg1*');
    expect(r.score).toBeGreaterThanOrEqual(2);
    expect(r.label).not.toBe('Weak');
    // Pin exact tier: 9 chars, all classes, no length bonus, no penalty => Fair.
    expect(r).toEqual({ score: 2, label: 'Fair' });
  });

  it('scores a short weak password as Weak', () => {
    // 7 chars, fails length gate, few classes.
    expect(scorePassword('abcdef1').label).toBe('Weak');
  });

  it('rewards length: >=12 all-class => Good', () => {
    expect(scorePassword('Abcdefgh1*jk')).toEqual({ score: 3, label: 'Good' });
  });

  it('rewards length: >=16 all-class => Strong', () => {
    expect(scorePassword('Abcdefgh1*jklmno')).toEqual({
      score: 4,
      label: 'Strong',
    });
  });

  it('penalizes a single-class long repeat', () => {
    // 16 identical lowercase chars: long but trivial => not Strong.
    expect(scorePassword('aaaaaaaaaaaaaaaa').score).toBeLessThanOrEqual(1);
  });

  it('penalizes an obvious ascending sequence', () => {
    expect(scorePassword('abcdefghijkl').score).toBeLessThanOrEqual(1);
  });

  // Regression: the sequential/repeat cap must NOT fire on a gate-passing
  // password. A long enough consecutive ASCII run spans all four classes
  // (digit → symbol → upper → symbol → lower) and clears the gate + the Zod
  // passwordSchema (max 50), yet the naive cap labeled it "Weak", violating the
  // invariant that a gate-passing password never scores below 2.
  it('does not cap a gate-passing consecutive-ASCII run to Weak', () => {
    // code points 57..97 (len 41): '9' digit, ':;<=>?@' symbols, 'A'-'Z' upper,
    // '[\]^_`' then 'a' lower => all 4 classes, fully consecutive, <=50 chars.
    let seq = '';
    for (let c = 57; c <= 97; c++) seq += String.fromCharCode(c);
    expect(seq.length).toBeLessThanOrEqual(50);
    const r = scorePassword(seq);
    expect(r.score).toBeGreaterThanOrEqual(2);
    expect(r.label).not.toBe('Weak');
  });

  // Regression: the meter's symbol class must match the gate's allowlist
  // (PASSWORD_SYMBOL_REGEX), NOT any non-alphanumeric char. `_` is not an
  // allowlisted symbol, so it must earn zero symbol-class credit — otherwise
  // the meter would flatter a password the real gate (passwordSchema) rejects.
  it('does not count a non-allowlist symbol (_) as a symbol class', () => {
    // `_` is the only non-alphanumeric char => 3 classes (upper/lower/digit),
    // so it must score exactly as if the `_` were simply absent.
    expect(scorePassword('PasswordAbc1_').score).toEqual(
      scorePassword('PasswordAbc1').score,
    );
  });

  it('scores an allowlist symbol (!) strictly higher than a disallowed one (_)', () => {
    // `!` is in the allowlist => 4 classes + len>=12 length bonus (Good),
    // while `_` stays a 3-class below-gate password (Fair). Proves the meter
    // and gate agree that `_` is not a symbol.
    expect(scorePassword('PasswordAbc1!').score).toBeGreaterThan(
      scorePassword('PasswordAbc1_').score,
    );
  });
});
