import apiClient from '../lib/axios';
import { User } from '../types';

export const userService = {
  getAll: async () => {
    const response = await apiClient.get<User[]>('v1/users/');
    return response.data;
  },

  create: async (data: Omit<User, 'id'>) => {
    const response = await apiClient.post<User>('v1/users/', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<User>(`v1/users/${id}/`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>) => {
    const response = await apiClient.put<User>(`v1/users/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch(`/v1/users/${id}/`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/v1/users/${id}/`);
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/v1/me/');
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('v1/logout/');
    return response.data;
  }
};
