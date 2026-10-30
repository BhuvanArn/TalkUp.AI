import { changeLanguage } from '@/i18n';
import i18next from 'i18next';
import { afterEach, describe, expect, it } from 'vitest';

import { extractErrorMessage } from './error';

const GENERIC_EN = 'Something went wrong. Please try again.';
const GENERIC_FR = 'Une erreur est survenue. Veuillez réessayer.';

describe('extractErrorMessage', () => {
  it('falls back to the generic error when there is nothing to show', () => {
    expect(extractErrorMessage(undefined)).toBe(GENERIC_EN);
    expect(extractErrorMessage({})).toBe(GENERIC_EN);
  });

  it('uses a custom fallback when one is passed', () => {
    expect(extractErrorMessage(undefined, 'Custom')).toBe('Custom');
  });

  it('returns a string error as is', () => {
    expect(extractErrorMessage('Plain message')).toBe('Plain message');
  });

  it('prefers the server message from the response body', () => {
    expect(
      extractErrorMessage({
        response: { data: { message: ['Email taken', 'Too short'] } },
        message: 'Request failed with status code 400',
      }),
    ).toBe('Email taken, Too short');
    expect(
      extractErrorMessage({ response: { data: { error: 'Forbidden' } } }),
    ).toBe('Forbidden');
  });

  it('does not expose a raw response body', () => {
    expect(extractErrorMessage({ response: { data: { code: 42 } } })).toBe(
      GENERIC_EN,
    );
  });

  it('keeps a user-friendly error message', () => {
    expect(extractErrorMessage(new Error('Invalid credentials'))).toBe(
      'Invalid credentials',
    );
  });

  it.each([
    'Network Error',
    'Request failed with status code 500',
    'timeout of 10000ms exceeded',
    'Request aborted',
    'canceled',
    'maxContentLength size of 2000 exceeded',
    'maxBodyLength size of 2000 exceeded',
    'Unsupported protocol ftp:',
    'Failed to fetch',
    'TypeError: x is undefined',
  ])('treats the client-side message "%s" as technical', (message) => {
    expect(extractErrorMessage(new Error(message))).toBe(GENERIC_EN);
  });

  describe('in French', () => {
    afterEach(async () => {
      await i18next.changeLanguage('en');
      localStorage.clear();
    });

    it('replaces an English axios message with the French fallback', async () => {
      await changeLanguage('fr');

      expect(
        extractErrorMessage(new Error('Request failed with status code 404')),
      ).toBe(GENERIC_FR);
      expect(extractErrorMessage(new Error('timeout of 5000ms exceeded'))).toBe(
        GENERIC_FR,
      );
    });
  });
});
