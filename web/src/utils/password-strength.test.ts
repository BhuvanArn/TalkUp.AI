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
    expect(scorePassword('Abcdefgh1*jklmno')).toEqual({ score: 4, label: 'Strong' });
  });

  it('penalizes a single-class long repeat', () => {
    // 16 identical lowercase chars: long but trivial => not Strong.
    expect(scorePassword('aaaaaaaaaaaaaaaa').score).toBeLessThanOrEqual(1);
  });

  it('penalizes an obvious ascending sequence', () => {
    expect(scorePassword('abcdefghijkl').score).toBeLessThanOrEqual(1);
  });
});
