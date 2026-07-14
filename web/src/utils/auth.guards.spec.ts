import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkAuthStatus,
  createAuthGuard,
  createAuthRedirectGuard,
  createPublicRouteGuard,
} from './auth.guards';

const axiosGet = vi.hoisted(() => vi.fn());
const getRouteConfigMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() =>
  vi.fn((opts: unknown) => {
    const e = new Error('REDIRECT');
    (e as Error & { opts?: unknown }).opts = opts;
    throw e;
  }),
);
const emitAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/axiosInstance', () => ({
  default: { get: axiosGet },
}));

vi.mock('@/config/routes.config', () => ({
  getRouteConfig: getRouteConfigMock,
}));

vi.mock('@/utils/authEmitter', () => ({
  emit: emitAuthMock,
}));

vi.mock('@tanstack/react-router', () => ({
  redirect: redirectMock,
}));

describe('auth.guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    axiosGet.mockResolvedValue({ data: { authenticated: true } });
    emitAuthMock.mockImplementation(() => undefined);
  });

  describe('createAuthGuard', () => {
    it('returns when route does not require auth', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: false });
      await expect(createAuthGuard('/any')()).resolves.toBeUndefined();
      expect(axiosGet).not.toHaveBeenCalled();
    });

    it('returns when route config is missing', async () => {
      getRouteConfigMock.mockReturnValue(undefined);
      await expect(createAuthGuard('/any')()).resolves.toBeUndefined();
      expect(axiosGet).not.toHaveBeenCalled();
    });

    it('returns when authenticated', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      await expect(createAuthGuard('/dashboard')()).resolves.toBeUndefined();
      expect(axiosGet).toHaveBeenCalledWith('/v1/api/auth/status');
      expect(emitAuthMock).toHaveBeenCalledWith(true);
    });

    it('redirects to login when API reports unauthenticated', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      axiosGet.mockResolvedValue({ data: { authenticated: false } });
      await expect(createAuthGuard('/dashboard')()).rejects.toThrow('REDIRECT');
      expect(redirectMock).toHaveBeenCalledWith({
        to: '/login',
        search: { redirect: '/dashboard' },
      });
    });

    it('redirects to login when auth status request fails', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      axiosGet.mockRejectedValue(new Error('network'));
      await expect(createAuthGuard('/dashboard')()).rejects.toThrow('REDIRECT');
      expect(emitAuthMock).toHaveBeenCalledWith(false);
    });

    it('redirects when authenticated flag is missing in response', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      axiosGet.mockResolvedValue({ data: {} });
      await expect(createAuthGuard('/x')()).rejects.toThrow('REDIRECT');
    });

    it('logs when emit fails after successful status check', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      emitAuthMock.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      axiosGet.mockResolvedValue({ data: { authenticated: true } });
      await expect(createAuthGuard('/dashboard')()).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('logs when emit fails after failed status check', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      axiosGet.mockRejectedValue(new Error('fail'));
      emitAuthMock.mockImplementationOnce(() => {
        throw new Error('emit fail');
      });
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(createAuthGuard('/dashboard')()).rejects.toThrow('REDIRECT');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not log on 401 status check (anonymous visitor)', async () => {
      getRouteConfigMock.mockReturnValue({ requiresAuth: true });
      const axiosError = Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: { status: 401 },
      });
      axiosGet.mockRejectedValue(axiosError);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(createAuthGuard('/dashboard')()).rejects.toThrow('REDIRECT');
      expect(spy).not.toHaveBeenCalled();
      expect(emitAuthMock).toHaveBeenCalledWith(false);
      spy.mockRestore();
    });
  });

  describe('createAuthRedirectGuard', () => {
    it('redirects to target when authenticated', async () => {
      axiosGet.mockResolvedValue({ data: { authenticated: true } });
      await expect(createAuthRedirectGuard('/simulations')()).rejects.toThrow(
        'REDIRECT',
      );
      expect(redirectMock).toHaveBeenCalledWith({ to: '/simulations' });
      expect(emitAuthMock).toHaveBeenCalledWith(true);
    });

    it('resolves without redirect when not authenticated', async () => {
      axiosGet.mockResolvedValue({ data: { authenticated: false } });
      await expect(
        createAuthRedirectGuard('/simulations')(),
      ).resolves.toBeUndefined();
      expect(redirectMock).not.toHaveBeenCalled();
      expect(emitAuthMock).toHaveBeenCalledWith(false);
    });

    it('resolves without redirect when auth status request fails', async () => {
      axiosGet.mockRejectedValue(new Error('network'));
      await expect(
        createAuthRedirectGuard('/simulations')(),
      ).resolves.toBeUndefined();
      expect(redirectMock).not.toHaveBeenCalled();
      expect(emitAuthMock).toHaveBeenCalledWith(false);
    });
  });

  describe('createPublicRouteGuard', () => {
    it('returns early for routes other than login, register, verify-email', async () => {
      await expect(
        createPublicRouteGuard('/forgot-password')(),
      ).resolves.toBeUndefined();
      expect(axiosGet).not.toHaveBeenCalled();
    });

    it('redirects home when already authenticated on login', async () => {
      await expect(createPublicRouteGuard('/login')()).rejects.toThrow(
        'REDIRECT',
      );
      expect(redirectMock).toHaveBeenCalledWith({ to: '/' });
    });

    it('allows register when not authenticated', async () => {
      axiosGet.mockResolvedValue({ data: { authenticated: false } });
      await expect(
        createPublicRouteGuard('/register')(),
      ).resolves.toBeUndefined();
    });

    it('allows verify-email when not authenticated', async () => {
      axiosGet.mockResolvedValue({ data: { authenticated: false } });
      await expect(
        createPublicRouteGuard('/verify-email')(),
      ).resolves.toBeUndefined();
    });

    it('returns early for organization-created (no auth-status call)', async () => {
      // The org-created ack page is reached right after signup while the user
      // is still unauthenticated. It must NOT run an auth-status check: the 401
      // would trip the axios refresh→/login redirect. Kept out of the guard's
      // allow-list on purpose.
      await expect(
        createPublicRouteGuard('/organization-created')(),
      ).resolves.toBeUndefined();
      expect(axiosGet).not.toHaveBeenCalled();
    });
  });

  describe('role-gated guard (B4)', () => {
    it('lets an admin through /organization', async () => {
      getRouteConfigMock.mockReturnValue({
        requiresAuth: true,
        roles: ['admin', 'employee'],
      });
      axiosGet.mockResolvedValue({
        data: { authenticated: true, role: 'admin', organizationId: 'o1' },
      });

      const guard = createAuthGuard('/organization');
      await expect(guard()).resolves.toBeUndefined();
    });

    it('redirects a user-role member away from /organization', async () => {
      getRouteConfigMock.mockReturnValue({
        requiresAuth: true,
        roles: ['admin', 'employee'],
      });
      axiosGet.mockResolvedValue({
        data: { authenticated: true, role: 'user', organizationId: 'o1' },
      });

      const guard = createAuthGuard('/organization');
      await expect(guard()).rejects.toBeDefined();
      expect(redirectMock).toHaveBeenCalledWith({ to: '/' });
    });

    it('still redirects anonymous visitors to login', async () => {
      getRouteConfigMock.mockReturnValue({
        requiresAuth: true,
        roles: ['admin', 'employee'],
      });
      axiosGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 401 },
      });

      const guard = createAuthGuard('/organization');
      await expect(guard()).rejects.toBeDefined();
      expect(redirectMock).toHaveBeenCalledWith({
        to: '/login',
        search: { redirect: '/organization' },
      });
    });

    it('exposes role fields from checkAuthStatus', async () => {
      axiosGet.mockResolvedValue({
        data: { authenticated: true, role: 'employee', organizationId: 'o1' },
      });

      await expect(checkAuthStatus()).resolves.toEqual({
        isAuthenticated: true,
        role: 'employee',
        organizationId: 'o1',
      });
    });
  });
});
