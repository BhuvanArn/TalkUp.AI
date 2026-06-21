import { z } from 'zod';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

/**
 * Password validation schema for registration
 */
export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max(50, 'Password must be less than 50 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one symbol');

/**
 * Password validation schema for login
 */
export const loginPasswordSchema = z.string().min(1, 'Password is required');

/**
 * Username validation schema
 */
export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Username must contain only letters and numbers');

/** 6-digit email verification / OTP code */
export const otpCodeSchema = z
  .string()
  .min(1, 'Code is required')
  .length(6, 'Code must be 6 digits')
  .regex(/^\d{6}$/, 'Code must be 6 digits');

/**
 * Protocols allowed for a user-provided job-offer URL.
 *
 * Restricted to `https:` because this URL is intended to be handed to a
 * server-side scraper. Allowing arbitrary protocols (or `http:`) would widen
 * the SSRF surface (`file:`, `gopher:`, internal `http://169.254.x.x`, etc.).
 */
const ALLOWED_JOB_URL_PROTOCOLS = ['https:'];

/**
 * Validates a user-provided job-offer URL.
 *
 * Uses the `URL` parser (not a naive `startsWith('http')`) and enforces an
 * `https:`-only protocol allowlist. This is the client-side gate; any
 * server-side fetch must re-validate and allowlist before scraping.
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
 * Returns the first error message or undefined if valid
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
