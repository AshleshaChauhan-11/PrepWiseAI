import axios from 'axios';
import { BASE_URL } from './apiPaths';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically add JWT token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors gracefully
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if expired or invalid
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Dispatch custom event so app components can react
        window.dispatchEvent(new Event('auth-expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
