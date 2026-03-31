import axios from 'axios';

import { API_BASE_URL } from '../config/env';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // Dynamically determined API base URL
  withCredentials: true, // Send cookies with requests
});

// Set default headers
axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
axiosInstance.defaults.headers.common['Accept'] = 'application/json';

// Add a response interceptor for handling 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url ?? '';

    // Allowlist of auth endpoints that should NOT trigger redirects on 401
    // (wrong OTP / invalid step must show inline errors, not a full-page jump to login)
    const publicAuthEndpoints = [
      '/auth/status',
      '/auth/login',
      '/auth/register',
      '/auth/verify-email',
      '/auth/resend-otp',
      '/auth/password-reset-request',
      '/auth/password-reset-verify',
      '/auth/password-update',
    ];

    const isPublicAuthEndpoint = publicAuthEndpoints.some((endpoint) =>
      requestUrl.includes(endpoint),
    );

    if (error.response?.status === 401 && !isPublicAuthEndpoint) {
      // All other requests should redirect to /login on 401 (session expired or unauthorized)
      console.warn('Authentication failed. Redirecting to login...');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
