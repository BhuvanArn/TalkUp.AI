import { getRouteConfig } from '@/config/routes.config';
import axiosInstance from '@/services/axiosInstance';
import { emit as emitAuth } from '@/utils/authEmitter';
import { redirect } from '@tanstack/react-router';

export interface AuthGuardContext {
  isAuthenticated: boolean;
}

/**
 * Validates authentication by checking with the backend.
 * The backend will verify the HTTP-only cookie.
 *
 * @returns `true` if authenticated (200 status), `false` otherwise (401 status or error)
 */
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get('/v1/api/auth/status');

    // Backend returns { authenticated: true } with 200 status when authenticated
    const isAuth = response.data?.authenticated === true;
    try {
      emitAuth(isAuth);
    } catch (error) {
      console.error('Auth emitter failed:', error);
    }

    return isAuth;
  } catch (error) {
    console.error('Error on auth status check', error);
    // Backend throws 401 Unauthorized when not authenticated or token is invalid
    try {
      emitAuth(false);
    } catch (emitError) {
      console.error('Auth emitter failed:', emitError);
    }
    return false;
  }
};

/**
 * Creates an authentication guard function for a given route path.
 *
 * The returned async function checks if the route requires authentication.
 * If authentication is required, it verifies authentication status with the backend.
 * If not authenticated, it redirects to the login page.
 *
 * @param routePath - The path of the route to guard.
 * @returns An async function that enforces authentication for the specified route.
 * @throws Redirects to the login page if authentication fails.
 */
export const createAuthGuard = (routePath: string) => {
  return async () => {
    const config = getRouteConfig(routePath);

    if (!config?.requiresAuth) {
      return;
    }

    const isAuthenticated = await checkAuthStatus();

    if (!isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: routePath,
        },
      });
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
      routePath !== '/verify-email'
    ) {
      return;
    }

    const isAuthenticated = await checkAuthStatus();

    if (isAuthenticated) {
      throw redirect({
        to: '/',
      });
    }
  };
};
