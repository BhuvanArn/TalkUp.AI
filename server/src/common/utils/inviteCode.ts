import { randomInt } from "crypto";

/** A–Z + 2–9 minus ambiguous 0/O/1/I — exactly 32 characters. */
export const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_CODE_LENGTH = 12;

/** Cryptographically random invite code (crypto.randomInt, not Math.random). */
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < INVITE_CODE_LENGTH; i += 1) {
    code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)];
  }
  return code;
}
