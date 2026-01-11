import axios from 'axios';

// 1. Create the Instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. The "Request Interceptor" (Outgoing)
// This runs BEFORE every request leaves your browser
api.interceptors.request.use(
  (config) => {
    // A. Try to find the token in the "school-auth-storage" (Zustand's default name)
    const storageData = localStorage.getItem('school-auth-storage');
    
    if (storageData) {
      try {
        // Zustand stores data as: { state: { token: "...", user: ... }, version: 0 }
        const parsed = JSON.parse(storageData);
        const token = parsed.state?.token;

        if (token) {
          // B. Attach it to the Authorization Header
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error("Failed to parse auth token:", error);
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. The "Response Interceptor" (Incoming)
// This catches 401 errors globally so you don't have to handle them in every component
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is expired or invalid (401)
    if (error.response?.status === 401) {
      console.warn("⚠️ Session expired or unauthorized. Logging out...");
      
      // Optional: Clear storage to prevent infinite loops
      // localStorage.removeItem('school-auth-storage');
      
      // Force redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;