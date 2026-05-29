import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// __DEV__ es true en Expo Go (desarrollo), false en APK (producción)
// En el APK hardcodeamos la URL del servidor para garantizar que nunca falle
const API_URL = __DEV__
  ? (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api')
  : 'http://185.202.223.66:3020/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Endpoints that should NEVER have an auth header
const PUBLIC_ENDPOINTS = ['/users/register/', '/token/', '/health/'];

// Request interceptor: ONLY add token to non-public endpoints
api.interceptors.request.use(
  async (config) => {
    const isPublic = PUBLIC_ENDPOINTS.some((ep) => config.url?.includes(ep));
    if (!isPublic) {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublic = PUBLIC_ENDPOINTS.some((ep) => originalRequest.url?.includes(ep));

    if (error.response?.status === 401 && !originalRequest._retry && !isPublic) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) {
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/token/refresh/`, { refresh: refreshToken });
        const { access } = response.data;
        await AsyncStorage.setItem('accessToken', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (_refreshError) {
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
