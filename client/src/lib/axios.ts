// FILE: client/src/lib/axios.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore'; // Import the store directly

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    // PROFESSIONAL: Access the store state directly outside of a component
    // This removes the need for manual localStorage parsing
    const token = useAuthStore.getState().token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalRequest = error.config;

    // Check for 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("⚠️ Session expired. Redirecting to login...");
      
      // PROFESSIONAL: Use the store's logout action to clean up state
      useAuthStore.getState().logout();
      
      // Only redirect if not already on public pages
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;