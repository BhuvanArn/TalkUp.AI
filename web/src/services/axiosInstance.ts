import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { API_BASE_URL } from '../config/env';
import { API_ROUTES } from './api';

/**
 * API client: httpOnly auth cookies require withCredentials.
 *
 * On 401: one in-flight POST /auth/refresh; other failing requests queue and retry after.
 * Without this, parallel 401s would race refresh rotation and log users out.
 * /auth/refresh is allowlisted so a failed refresh does not recurse. /auth/status is not
 * allowlisted: a 401 there still attempts refresh once (session may be recoverable).
 * If refresh fails, we redirect to /login except on public auth routes (avoids reload loops).
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // Dynamically determined API base URL
  withCredentials: true, // Send cookies with requests
});

// Set default headers
axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
axiosInstance.defaults.headers.common['Accept'] = 'application/json';

/** Endpoints where 401 must not trigger POST /auth/refresh (refresh itself must not recurse). */
const PUBLIC_AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-otp',
  '/auth/password-reset-request',
  '/auth/password-reset-verify',
  '/auth/password-update',
  '/auth/refresh',
];

/** Routes where failed refresh must not assign `/login` (public routes — landing + auth pages). */
const NO_LOGIN_REDIRECT_AFTER_REFRESH_FAIL = new Set([
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
]);

type QueueEntry = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

let isRefreshing = false;

// Queue of requests that failed due to 401 and need to be retried after a successful refresh
let failedQueue: QueueEntry[] = [];

// Process the queue of requests that failed due to 401 and need to be retried after a successful refresh
function processQueue(error: unknown | null) {
  for (const entry of failedQueue) {
    if (error) {
      entry.reject(error);
    } else {
      entry.resolve();
    }
  }
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const requestUrl = originalRequest?.url ?? '';

    const isPublicAuthEndpoint = PUBLIC_AUTH_ENDPOINTS.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (
      error.response?.status !== 401 ||
      isPublicAuthEndpoint ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Wait for the single refresh; then retry once (_retry avoids refresh loops).
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        originalRequest._retry = true;
        return axiosInstance(originalRequest);
      });
    }

    // Start the refresh process
    // (if we get a 401 not in public endpoints and not already refreshing, we need to refresh the token)
    isRefreshing = true;
    originalRequest._retry = true;

    try {
      await axiosInstance.post(`${API_ROUTES.auth}/refresh`);

      // put the original request back in the queue
      processQueue(null);
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      if (!NO_LOGIN_REDIRECT_AFTER_REFRESH_FAIL.has(window.location.pathname)) {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
