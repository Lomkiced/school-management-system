// FILE: client/src/lib/axios.ts
// 2026 Standard: Centralized axios configuration with environment support

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * API Configuration
 * Uses environment variable with fallback for development
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Axios Instance
 * Pre-configured for the School Management System API
 */
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Required for cookie-based authentication
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request Interceptor
 * - Adds timestamps for debugging
 * - Could add auth token from local storage if needed
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request timestamp for debugging
    config.headers['X-Request-Time'] = new Date().toISOString();

    // Log requests in development
    if (import.meta.env.DEV) {
      console.debug(`📤 [${config.method?.toUpperCase()}] ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Request configuration error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Handles 401 (unauthorized) responses
 * - Logs errors in development
 * - Provides consistent error handling
 */
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.debug(`📥 [${response.status}] ${response.config.url}`);
    }
    return response;
  },
  (error: AxiosError<{ message?: string; success?: boolean }>) => {
    // Handle 401 Unauthorized - session expired
    if (error.response?.status === 401) {
      // Check if not already on login page to prevent infinite redirects
      if (!window.location.pathname.includes('/login')) {
        console.warn('🔒 Session expired. Redirecting to login...');
        // Clear any stored auth data
        localStorage.removeItem('user');
        // Redirect to login with return URL
        window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.warn('⛔ Access denied:', error.response.data?.message);
    }

    // Handle network errors
    if (!error.response) {
      console.error('🌐 Network error:', error.message);
    }

    // Log errors in development
    if (import.meta.env.DEV && error.response) {
      console.error(
        `❌ [${error.response.status}] ${error.config?.url}:`,
        error.response.data?.message || error.message
      );
    }

    return Promise.reject(error);
  }
);

/**
 * Type declaration for Vite environment variables
 */
declare global {
  interface ImportMetaEnv {
    VITE_API_URL: string;
    VITE_SOCKET_URL: string;
    VITE_ENABLE_CHAT: string;
    VITE_ENABLE_LMS: string;
    VITE_APP_ENV: string;
  }
}

export default api;