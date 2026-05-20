import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  message: string;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/token/', { email, password });
    const { access, refresh } = response.data;
    
    await AsyncStorage.setItem('accessToken', access);
    await AsyncStorage.setItem('refreshToken', refresh);
    
    return response.data;
  },

  async register(email: string, password: string, password_confirm: string, first_name?: string, last_name?: string): Promise<any> {
    const payload: any = { email, password, password_confirm };
    if (first_name) payload.first_name = first_name;
    if (last_name) payload.last_name = last_name;
    const response = await api.post('/users/register/', payload);
    return response.data;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  },

  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  },

  async getUser(): Promise<User | null> {
    try {
      const response = await api.get<User>('/users/profile/');
      return response.data;
    } catch {
      return null;
    }
  },
};
