import apiClient from '../lib/axios';
import { Branch } from '../types';

export const branchService = {
  getAll: async () => {
    const response = await apiClient.get<Branch[]>('v1/branches/');
    return response.data;
  },

  create: async (data: Omit<Branch, 'id'>) => {
    const response = await apiClient.post<Branch>('v1/branches/', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Branch>(`v1/branches/${id}/`);
    return response.data;
  },

  update: async (id: string, data: Partial<Branch>) => {
    const response = await apiClient.put<Branch>(`v1/branches/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<Branch>) => {
    const response = await apiClient.patch<Branch>(`v1/branches/${id}/`, data);
    return response.data;
  },
};
