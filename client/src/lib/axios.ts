// FILE: client/src/lib/axios.ts
import axios from 'axios';

// 1. Create Instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  // 2. THIS IS REQUIRED. It tells the browser to send/receive cookies.
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// 3. Response Interceptor (Optional but professional)
// Automatically logs you out if your session expires
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Redirect to login or clear store
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default api;