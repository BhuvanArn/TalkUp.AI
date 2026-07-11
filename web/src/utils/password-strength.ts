/** Advisory strength score. NOT the validation gate — passwordSchema is. */
export type StrengthScore = 0 | 1 | 2 | 3 | 4;
export type StrengthLabel = 'Empty' | 'Weak' | 'Fair' | 'Good' | 'Strong';
export interface PasswordStrength {
  score: StrengthScore;
  label: StrengthLabel;
}

const LABELS: Record<StrengthScore, StrengthLabel> = {
  0: 'Weak',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/** True when the password is a single repeated character. */
const isSingleCharRepeat = (pw: string): boolean =>
  pw.length > 0 && new Set(pw).size === 1;

/** True when pw is a run of consecutive ascending or descending code points. */
const isSequential = (pw: string): boolean => {
  if (pw.length < 4) return false;
  let asc = true;
  let desc = true;
  for (let i = 1; i < pw.length; i++) {
    const diff = pw.charCodeAt(i) - pw.charCodeAt(i - 1);
    if (diff !== 1) asc = false;
    if (diff !== -1) desc = false;
  }
  return asc || desc;
};

/**
 * Advisory 0–4 strength heuristic. Sits ABOVE the hard gate
 * (8 chars + lower/upper/digit/symbol). Invariant: any password meeting the
 * gate scores >= 2, so the meter never contradicts a password the gate accepts.
 */
export function scorePassword(pw: string): PasswordStrength {
  if (pw.length === 0) return { score: 0, label: 'Empty' };

  const classes =
    (/[a-z]/.test(pw) ? 1 : 0) +
    (/[A-Z]/.test(pw) ? 1 : 0) +
    (/[0-9]/.test(pw) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(pw) ? 1 : 0);

  // Trivial patterns cap low regardless of length.
  if (isSingleCharRepeat(pw) || isSequential(pw)) {
    return { score: 1, label: LABELS[1] };
  }

  const meetsGate = pw.length >= 8 && classes === 4;

  let raw = 0;
  if (meetsGate) {
    raw = 2; // floor for gate-passing passwords
    if (pw.length >= 12) raw += 1;
    if (pw.length >= 16) raw += 1;
  } else {
    // Below the gate: score by breadth + a little length credit.
    raw = Math.min(1 + (classes >= 3 ? 1 : 0), pw.length >= 8 ? 2 : 1);
  }

  const score = Math.max(0, Math.min(4, raw)) as StrengthScore;
  return { score, label: LABELS[score] };
}
