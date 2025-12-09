import { describe, expect, it } from 'vitest';

import { getBackendUrl } from './env';

describe('getBackendUrl', () => {
  describe('Development', () => {
    it('should use VITE_BASE_URL when DEV is true', () => {
      expect(
        getBackendUrl({ DEV: true, VITE_BASE_URL: 'http://localhost:3000' }),
      ).toBe('http://localhost:3000');
    });

    it('should fallback to localhost:3000 when VITE_BASE_URL is not set', () => {
      expect(getBackendUrl({ DEV: true })).toBe('http://localhost:3000');
    });
  });

  describe('Production', () => {
    it('should use VITE_BASE_URL_PRODUCTION when VERCEL_ENV is production', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'production',
          VITE_BASE_URL_PRODUCTION: 'https://prod.railway.app',
        }),
      ).toBe('https://prod.railway.app');
    });

    it('should use VITE_BASE_URL_PRODUCTION when PROD is true', () => {
      expect(
        getBackendUrl({
          PROD: true,
          VITE_BASE_URL_PRODUCTION: 'https://prod.railway.app',
        }),
      ).toBe('https://prod.railway.app');
    });

    it('should fallback to default production URL', () => {
      expect(getBackendUrl({ VITE_VERCEL_ENV: 'production' })).toBe(
        'https://talk-up-ai.up.railway.app',
      );
    });
  });

  describe('Preview', () => {
    it('should use VITE_VERCEL_GIT_PULL_REQUEST_ID when available', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'preview',
          VITE_VERCEL_GIT_PULL_REQUEST_ID: '42',
        }),
      ).toBe('https://backend-talkupai-pr-42.up.railway.app');
    });

    it('should parse PR number from branch name as fallback', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'preview',
          VITE_VERCEL_GIT_COMMIT_REF: '123-fix-bug',
        }),
      ).toBe('https://backend-talkupai-pr-123.up.railway.app');
    });

    it('should prefer VITE_VERCEL_GIT_PULL_REQUEST_ID over branch parsing', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'preview',
          VITE_VERCEL_GIT_PULL_REQUEST_ID: '99',
          VITE_VERCEL_GIT_COMMIT_REF: '42-feature',
        }),
      ).toBe('https://backend-talkupai-pr-99.up.railway.app');
    });

    it('should fallback to production when no PR number found', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'preview',
          VITE_VERCEL_GIT_COMMIT_REF: 'feature-branch',
          VITE_BASE_URL_PRODUCTION: 'https://prod.railway.app',
        }),
      ).toBe('https://prod.railway.app');
    });

    it('should fallback when no PR indicators present', () => {
      expect(
        getBackendUrl({
          VITE_VERCEL_ENV: 'preview',
          VITE_BASE_URL_PRODUCTION: 'https://prod.railway.app',
        }),
      ).toBe('https://prod.railway.app');
    });
  });

  describe('Default fallback', () => {
    it('should fallback to localhost when no environment matches', () => {
      expect(getBackendUrl({})).toBe('http://localhost:3000');
    });

    it('should use VITE_BASE_URL as final fallback', () => {
      expect(getBackendUrl({ VITE_BASE_URL: 'http://custom:4000' })).toBe(
        'http://custom:4000',
      );
    });
  });
});
