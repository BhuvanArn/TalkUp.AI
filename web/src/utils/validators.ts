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
