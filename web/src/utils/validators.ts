import type { ParseKeys } from 'i18next';
import { z } from 'zod';

/**
 * i18n key of a validation message. Schemas hold keys, not text: translate the
 * error where it is displayed, with `t(error as ValidationKey)` from
 * `useTranslation(['auth', 'common'])`.
 */
export type ValidationKey = ParseKeys<['auth', 'common']>;

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'auth:validation.emailRequired' satisfies ValidationKey)
  .email('auth:validation.emailInvalid' satisfies ValidationKey);

/**
 * Allowlisted "symbol" character class for password validation. Shared with
 * the advisory strength meter (`@/utils/password-strength`) so the meter
 * never scores a symbol the hard gate below would reject.
 */
export const PASSWORD_SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/;

/**
 * Password validation schema for registration
 */
export const passwordSchema = z
  .string()
  .min(1, 'auth:validation.passwordRequired' satisfies ValidationKey)
  .min(8, 'auth:validation.passwordMinLength' satisfies ValidationKey)
  .max(50, 'auth:validation.passwordMaxLength' satisfies ValidationKey)
  .regex(/[a-z]/, 'auth:validation.passwordLowercase' satisfies ValidationKey)
  .regex(/[A-Z]/, 'auth:validation.passwordUppercase' satisfies ValidationKey)
  .regex(/[0-9]/, 'auth:validation.passwordNumber' satisfies ValidationKey)
  .regex(
    PASSWORD_SYMBOL_REGEX,
    'auth:validation.passwordSymbol' satisfies ValidationKey,
  );

/**
 * Password validation schema for login
 */
export const loginPasswordSchema = z
  .string()
  .min(1, 'auth:validation.passwordRequired' satisfies ValidationKey);

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(1, 'auth:validation.usernameRequired' satisfies ValidationKey)
  .min(3, 'auth:validation.usernameMinLength' satisfies ValidationKey)
  .max(20, 'auth:validation.usernameMaxLength' satisfies ValidationKey)
  .regex(
    /^[a-zA-Z0-9]+$/,
    'auth:validation.usernameAlphanumeric' satisfies ValidationKey,
  );

/** 6-digit email verification / OTP code */
export const otpCodeSchema = z
  .string()
  .min(1, 'auth:validation.codeRequired' satisfies ValidationKey)
  .length(6, 'auth:validation.codeLength' satisfies ValidationKey)
  .regex(/^\d{6}$/, 'auth:validation.codeLength' satisfies ValidationKey);

/**
 * Protocols allowed for a user-provided job-offer URL.
 *
 * Restricted to `https:` because this URL is intended to be handed to a
 * server-side scraper. Rejecting other protocols (`file:`, `gopher:`, `http:`,
 * etc.) removes the most obvious SSRF vectors at the protocol level.
 */
const ALLOWED_JOB_URL_PROTOCOLS = ['https:'];

/**
 * Validates a user-provided job-offer URL.
 *
 * Uses the `URL` parser (not a naive `startsWith('http')`) and enforces an
 * `https:`-only protocol allowlist. This is a PROTOCOL filter only — it does
 * NOT block internal hosts (e.g. `https://169.254.169.254`, `https://localhost`).
 * Host-level SSRF defense (internal-range blocklist, DNS-rebind protection) is
 * the server-side fetcher's responsibility; any server-side fetch must
 * re-validate and host-allowlist before scraping.
 *
 * @param value Raw URL string from the input field.
 * @returns `true` when the value parses to an `https:` URL.
 */
export const isAllowedJobUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return ALLOWED_JOB_URL_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
};

/**
 * Helper function to validate a field with a Zod schema
 * Returns the first error message (a {@link ValidationKey} for the schemas
 * above) or undefined if valid
 */
export const validateWithSchema = <T>(
  value: T,
  schema: z.ZodSchema<T>,
): string | undefined => {
  const result = schema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0]?.message;
  }
  return undefined;
};
