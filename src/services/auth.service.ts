import apiClient from '../lib/axios';
import { AuthResponse } from '../types';

export const authService = {
  login: async (credentials: { username: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('auth/login/', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await apiClient.post<AuthResponse>('auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  logout: async () => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refreshToken) {
      await apiClient.post('v1/logout/', { refresh: refreshToken });
    }
    return true;
  }
};
