import apiClient from '../lib/axios';
import { Customer } from '../types';

export const customerService = {
  getAll: async () => {
    const response = await apiClient.get<Customer[]>('/v1/customers/');
    return response.data;
  },

  create: async (data: Omit<Customer, 'id'>) => {
    const response = await apiClient.post<Customer>('/v1/customers/', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Customer>(`/v1/customers/${id}/`);
    return response.data;
  },

  update: async (id: string, data: Partial<Customer>) => {
    const response = await apiClient.put<Customer>(`/v1/customers/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<Customer>) => {
    const response = await apiClient.patch<Customer>(`/v1/customers/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/v1/customers/${id}/`);
    return response.data;
  },
};
