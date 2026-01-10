import axios from 'axios';

// Create a configured instance of Axios
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your Backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Automatically add the Token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // We will save the token here later
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;