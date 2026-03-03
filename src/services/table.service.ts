import apiClient from '../lib/axios';
import { Table } from '../types';

export const tableService = {
  getAll: async () => {
    const response = await apiClient.get<Table[]>('/v1/tables/');
    return response.data;
  },

  create: async (data: Omit<Table, 'id'>) => {
    const response = await apiClient.post<Table>('/v1/tables/', data);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Table>(`/v1/tables/${id}/`);
    return response.data;
  },

  update: async (id: string, data: Partial<Table>) => {
    const response = await apiClient.put<Table>(`/v1/tables/${id}/`, data);
    return response.data;
  },

  patch: async (id: string, data: Partial<Table>) => {
    const response = await apiClient.patch<Table>(`/v1/tables/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/v1/tables/${id}/`);
    return response.data;
  },
};
