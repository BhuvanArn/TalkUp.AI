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
    // Don't redirect on 401 for auth status checks - they're expected to return 401 when not authenticated
    const isAuthStatusCheck = error.config?.url?.includes('/auth/status');

    if (error.response?.status === 401 && !isAuthStatusCheck) {
      console.warn('Authentication failed. Redirecting to login...');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
