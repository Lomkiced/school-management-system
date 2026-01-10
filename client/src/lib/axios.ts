// FILE: client/src/lib/axios.ts

import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Backend URL
  // CRITICAL FIX: We removed the default 'Content-Type' header.
  // Axios will now automatically set 'multipart/form-data' for file uploads
  // and 'application/json' for regular data.
});

// Interceptor: Automatically add the Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); 
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;