import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh on login/register endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/token/') ||
      originalRequest.url?.includes('/users/register/');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token - reject with original error
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        await AsyncStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (_refreshError) {
        // Refresh failed - clear tokens but reject with ORIGINAL error
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
