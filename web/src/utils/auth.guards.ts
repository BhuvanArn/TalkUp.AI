import { getRouteConfig } from '@/config/routes.config';
import axiosInstance from '@/services/axiosInstance';
import { emit as emitAuth } from '@/utils/authEmitter';
import { redirect } from '@tanstack/react-router';
import axios from 'axios';

export interface AuthGuardContext {
  isAuthenticated: boolean;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  role: string | null;
  organizationId: string | null;
}

const ANONYMOUS: AuthStatus = {
  isAuthenticated: false,
  role: null,
  organizationId: null,
};

/**
 * Validates authentication with the backend (HTTP-only cookie) and returns
 * the caller's org role/id (B4). Anonymous → all-null AuthStatus.
 */
export const checkAuthStatus = async (): Promise<AuthStatus> => {
  try {
    const response = await axiosInstance.get('/v1/api/auth/status');

    // Backend returns { authenticated: true } with 200 status when authenticated
    const isAuth = response.data?.authenticated === true;
    try {
      emitAuth(isAuth);
    } catch (error) {
      console.error('Auth emitter failed:', error);
    }

    if (!isAuth) return ANONYMOUS;
    return {
      isAuthenticated: true,
      role: typeof response.data?.role === 'string' ? response.data.role : null,
      organizationId:
        typeof response.data?.organizationId === 'string'
          ? response.data.organizationId
          : null,
    };
  } catch (error) {
    // 401 = anonymous visitor; not an error worth logging.
    const isUnauthorized =
      axios.isAxiosError(error) && error.response?.status === 401;
    if (!isUnauthorized) {
      console.error('Error on auth status check', error);
    }
    try {
      emitAuth(false);
    } catch (emitError) {
      console.error('Auth emitter failed:', emitError);
    }
    return ANONYMOUS;
  }
};

/**
 * Creates an authentication guard function for a given route path.
 *
 * The returned async function checks if the route requires authentication.
 * If authentication is required, it verifies authentication status with the backend.
 * If not authenticated, it redirects to the login page. When the route config
 * lists `roles`, the caller's org role must match one of them (requireRole
 * behavior from the design's B4 plumbing), otherwise it redirects home.
 *
 * @param routePath - The path of the route to guard.
 * @returns An async function that enforces authentication for the specified route.
 * @throws Redirects to the login page if authentication fails, or to '/' on role mismatch.
 */
export const createAuthGuard = (routePath: string) => {
  return async () => {
    const config = getRouteConfig(routePath);

    if (!config?.requiresAuth) {
      return;
    }

    const status = await checkAuthStatus();

    if (!status.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: routePath,
        },
      });
    }

    if (config.roles && !config.roles.includes(status.role ?? '')) {
      throw redirect({ to: '/' });
    }
  };
};

/**
 * Creates a guard for routes that render different content based on auth status.
 * If authenticated, redirects to the given target route.
 * If not authenticated, allows the route to render.
 *
 * @param target - Route to redirect authenticated users to.
 */
export const createAuthRedirectGuard = (target: string) => {
  return async () => {
    const { isAuthenticated } = await checkAuthStatus();

    if (isAuthenticated) {
      throw redirect({ to: target });
    }
  };
};

/**
 * Creates a guard function for public routes such as '/login' and '/register'.
 * If the user is already authenticated, they are redirected to '/'.
 * Otherwise, the route is accessible.
 *
 * @param routePath - The path of the route to guard (e.g., '/login', '/register').
 * @returns An asynchronous guard function to be used in route protection.
 *
 * @throws Redirects to '/' if the user is already authenticated.
 */
export const createPublicRouteGuard = (routePath: string) => {
  return async () => {
    if (
      routePath !== '/login' &&
      routePath !== '/register' &&
      routePath !== '/register-organization' &&
      routePath !== '/verify-email'
    ) {
      return;
    }

    const { isAuthenticated } = await checkAuthStatus();

    if (isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  };
};
