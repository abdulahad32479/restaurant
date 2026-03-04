import apiClient from '../lib/axios';
import { Category } from '../types';

export const categoryService = {
  getAll: async () => {
    const response = await apiClient.get<Category[]>('v1/categories/');
    return response.data;
  },

  create: async (data: Omit<Category, 'id'>) => {
    const response = await apiClient.post<Category>('v1/categories/', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Category>(`v1/categories/${id}/`);
    return response.data;
  },

  update: async (id: string, data: Partial<Category>) => {
    const response = await apiClient.put<Category>(`v1/categories/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<Category>) => {
    const response = await apiClient.patch<Category>(`v1/categories/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`v1/categories/${id}/`);
    return response.data;
  },
};
