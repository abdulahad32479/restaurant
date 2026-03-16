import apiClient from '../lib/axios';
import { DeliveryPerson } from '../types';

export const deliveryPersonService = {
  getAll: async (params?: { is_active?: boolean; branch?: string }) => {
    const response = await apiClient.get<DeliveryPerson[]>('v1/delivery-persons/', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<DeliveryPerson>(`v1/delivery-persons/${id}/`);
    return response.data;
  },

  create: async (data: Partial<DeliveryPerson>) => {
    const response = await apiClient.post<DeliveryPerson>('v1/delivery-persons/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<DeliveryPerson>) => {
    const response = await apiClient.patch<DeliveryPerson>(`v1/delivery-persons/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`v1/delivery-persons/${id}/`);
    return response.data;
  }
};
