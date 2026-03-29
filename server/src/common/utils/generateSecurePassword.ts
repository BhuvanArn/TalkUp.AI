import { randomInt } from "node:crypto";

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*-_=+";

const POOL = LOWER + UPPER + DIGITS + SYMBOLS;

/**
 * Generates a random password that satisfies `CreateUserDto` / `IsStrongPassword` rules
 * (mixed case, digit, symbol, length 8–50). Used for one-time admin credentials.
 */
export function generateSecurePassword(length = 20): string {
  if (length < 8 || length > 50) {
    throw new Error("Password length must be between 8 and 50");
  }

  const required = [
    LOWER[randomInt(LOWER.length)],
    UPPER[randomInt(UPPER.length)],
    DIGITS[randomInt(DIGITS.length)],
    SYMBOLS[randomInt(SYMBOLS.length)],
  ];

  const rest: string[] = [];
  for (let i = 0; i < length - required.length; i++) {
    rest.push(POOL[randomInt(POOL.length)]);
  }

  const chars = [...required, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
