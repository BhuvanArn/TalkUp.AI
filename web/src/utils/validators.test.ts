import i18next from 'i18next';
import { describe, expect, it } from 'vitest';

import {
  type ValidationKey,
  emailSchema,
  isAllowedJobUrl,
  loginPasswordSchema,
  otpCodeSchema,
  passwordSchema,
  usernameSchema,
  validateWithSchema,
} from './validators';

describe('validators', () => {
  describe('emailSchema', () => {
    it('should validate a valid email address', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject an empty string', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.emailRequired',
        );
      }
    });

    it('should reject an invalid email format', () => {
      const result = emailSchema.safeParse('not-an-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.emailInvalid',
        );
      }
    });

    it('should reject email without @ symbol', () => {
      const result = emailSchema.safeParse('testexample.com');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });
  });

  describe('passwordSchema (for registration)', () => {
    it('should validate a strong password', () => {
      const result = passwordSchema.safeParse('StrongP@ss123');
      expect(result.success).toBe(true);
    });

    it('should reject an empty string', () => {
      const result = passwordSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordRequired',
        );
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordMinLength',
        );
      }
    });

    it('should reject password longer than 50 characters', () => {
      const result = passwordSchema.safeParse(
        'A'.repeat(40) + 'a1!' + 'B'.repeat(10),
      );
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordMaxLength',
        );
      }
    });

    it('should reject password without lowercase letter', () => {
      const result = passwordSchema.safeParse('PASSWORD123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordLowercase',
        );
      }
    });

    it('should reject password without uppercase letter', () => {
      const result = passwordSchema.safeParse('password123!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordUppercase',
        );
      }
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('Password!');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordNumber',
        );
      }
    });

    it('should reject password without special character', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordSymbol',
        );
      }
    });

    it('should accept various special characters', () => {
      const specialChars = '!@#$%^&*(),.?":{}|<>';
      for (const char of specialChars) {
        const result = passwordSchema.safeParse(`Password1${char}`);
        expect(result.success).toBe(true);
      }
    });

    it('should reject a password whose only symbol is not in the allowlist', () => {
      // `_` and space are non-alphanumeric but NOT in PASSWORD_SYMBOL_REGEX,
      // so a password relying on them as its "symbol" must be rejected. This
      // pins agreement between the gate and the advisory strength meter, which
      // share PASSWORD_SYMBOL_REGEX — neither treats `_` as a symbol.
      for (const pw of ['Password1_', 'Password1 ']) {
        const result = passwordSchema.safeParse(pw);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0]?.message).toBe(
            'auth:validation.passwordSymbol',
          );
        }
      }
    });
  });

  describe('loginPasswordSchema', () => {
    it('should validate any non-empty password', () => {
      const result = loginPasswordSchema.safeParse('anypassword');
      expect(result.success).toBe(true);
    });

    it('should validate weak passwords (no complexity requirements)', () => {
      const result = loginPasswordSchema.safeParse('weak');
      expect(result.success).toBe(true);
    });

    it('should reject empty string', () => {
      const result = loginPasswordSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.passwordRequired',
        );
      }
    });

    it('should not enforce minimum length for login', () => {
      const result = loginPasswordSchema.safeParse('a');
      expect(result.success).toBe(true);
    });

    it('should not enforce complexity requirements for login', () => {
      const result = loginPasswordSchema.safeParse('simplepassword');
      expect(result.success).toBe(true);
    });
  });

  describe('usernameSchema', () => {
    it('should validate a valid username', () => {
      const result = usernameSchema.safeParse('validUser123');
      expect(result.success).toBe(true);
    });

    it('should reject an empty string', () => {
      const result = usernameSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.usernameRequired',
        );
      }
    });

    it('should reject username shorter than 3 characters', () => {
      const result = usernameSchema.safeParse('ab');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.usernameMinLength',
        );
      }
    });

    it('should reject username longer than 20 characters', () => {
      const result = usernameSchema.safeParse('a'.repeat(21));
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.usernameMaxLength',
        );
      }
    });

    it('should reject username with special characters', () => {
      const result = usernameSchema.safeParse('user@name');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.usernameAlphanumeric',
        );
      }
    });

    it('should reject username with spaces', () => {
      const result = usernameSchema.safeParse('user name');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toBe(
          'auth:validation.usernameAlphanumeric',
        );
      }
    });

    it('should accept username with only letters', () => {
      const result = usernameSchema.safeParse('username');
      expect(result.success).toBe(true);
    });

    it('should accept username with only numbers', () => {
      const result = usernameSchema.safeParse('12345');
      expect(result.success).toBe(true);
    });

    it('should accept username with mixed letters and numbers', () => {
      const result = usernameSchema.safeParse('user123');
      expect(result.success).toBe(true);
    });

    it('should accept exactly 3 characters', () => {
      const result = usernameSchema.safeParse('abc');
      expect(result.success).toBe(true);
    });

    it('should accept exactly 20 characters', () => {
      const result = usernameSchema.safeParse('a'.repeat(20));
      expect(result.success).toBe(true);
    });
  });

  describe('validateWithSchema', () => {
    it('should return undefined for valid input', () => {
      const result = validateWithSchema('test@example.com', emailSchema);
      expect(result).toBeUndefined();
    });

    it('should return first error message for invalid input', () => {
      const result = validateWithSchema('', emailSchema);
      expect(result).toBe('auth:validation.emailRequired');
    });

    it('should work with different schema types', () => {
      const result = validateWithSchema('ab', usernameSchema);
      expect(result).toBe('auth:validation.usernameMinLength');
    });

    it('should return first error when multiple errors exist', () => {
      const result = validateWithSchema('', passwordSchema);
      expect(result).toBe('auth:validation.passwordRequired');
    });

    it('should handle complex validation failures', () => {
      const result = validateWithSchema('weakpassword', passwordSchema);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('returns keys that resolve to the English message', () => {
      const result = validateWithSchema('ab', usernameSchema);
      const t = i18next.getFixedT('en', ['auth', 'common']);
      expect(t(result as ValidationKey)).toBe(
        'Username must be at least 3 characters',
      );
    });

    it('returns keys that resolve to the French message', () => {
      const result = validateWithSchema('', emailSchema);
      const t = i18next.getFixedT('fr', ['auth', 'common']);
      expect(t(result as ValidationKey)).toBe(
        'L’adresse e-mail est obligatoire',
      );
    });
  });

  describe('otpCodeSchema', () => {
    it('accepts 6 digits', () => {
      expect(otpCodeSchema.safeParse('123456').success).toBe(true);
    });

    it('rejects non-numeric or wrong length', () => {
      expect(otpCodeSchema.safeParse('12345').success).toBe(false);
      expect(otpCodeSchema.safeParse('1234567').success).toBe(false);
      expect(otpCodeSchema.safeParse('12a456').success).toBe(false);
    });
  });

  describe('isAllowedJobUrl', () => {
    it('accepts a well-formed https URL', () => {
      expect(isAllowedJobUrl('https://www.linkedin.com/jobs/view/123')).toBe(
        true,
      );
    });

    it('trims surrounding whitespace before validating', () => {
      expect(isAllowedJobUrl('  https://example.com/job  ')).toBe(true);
    });

    it('rejects an empty or whitespace-only string', () => {
      expect(isAllowedJobUrl('')).toBe(false);
      expect(isAllowedJobUrl('   ')).toBe(false);
    });

    it('rejects plain http (only https is allowed)', () => {
      expect(isAllowedJobUrl('http://example.com/job')).toBe(false);
    });

    it('rejects non-http(s) protocols that widen the SSRF surface', () => {
      expect(isAllowedJobUrl('file:///etc/passwd')).toBe(false);
      expect(isAllowedJobUrl('ftp://example.com')).toBe(false);
      expect(isAllowedJobUrl('javascript:alert(1)')).toBe(false);
    });

    it('rejects a value that is not a parseable URL', () => {
      expect(isAllowedJobUrl('not a url')).toBe(false);
      expect(isAllowedJobUrl('httpsexample.com')).toBe(false);
    });
  });
});
