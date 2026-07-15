import type { AxiosRequestConfig } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import axiosInstance from './axiosInstance';

/**
 * Drives the real interceptor with only the transport (adapter) swapped, so the
 * refresh-then-redirect chain is exercised rather than mocked away.
 */
const setLocation = (pathname: string) => {
  const assigned: string[] = [];
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      pathname,
      get href() {
        return `http://localhost${pathname}`;
      },
      set href(value: string) {
        assigned.push(value);
      },
    },
  });
  return assigned;
};

const unauthorized = (config: AxiosRequestConfig) =>
  Promise.reject(
    Object.assign(new Error('401'), {
      isAxiosError: true,
      config,
      response: { status: 401, data: {}, headers: {}, config },
    }),
  );

describe('axiosInstance 401 handling', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('escalates a 401 to refresh and redirects to /login on an unknown path', async () => {
    const assigned = setLocation('/some-404-url');
    const requested: string[] = [];
    axiosInstance.defaults.adapter = (config) => {
      requested.push(config.url ?? '');
      return unauthorized(config);
    };

    await expect(axiosInstance.get('/v1/api/auth/status')).rejects.toThrow();

    expect(requested).toContain('/v1/api/auth/status');
    expect(requested.some((u) => u.includes('/refresh'))).toBe(true);
    expect(assigned).toEqual(['/login']);
  });

  it('treats a 401 as anonymous when anonymousAllowed is set: no refresh, no redirect', async () => {
    const assigned = setLocation('/some-404-url');
    const requested: string[] = [];
    axiosInstance.defaults.adapter = (config) => {
      requested.push(config.url ?? '');
      return unauthorized(config);
    };

    await expect(
      axiosInstance.get('/v1/api/auth/status', { anonymousAllowed: true }),
    ).rejects.toThrow();

    expect(requested).toEqual(['/v1/api/auth/status']);
    expect(requested.some((u) => u.includes('/refresh'))).toBe(false);
    expect(assigned).toEqual([]);
  });
});
