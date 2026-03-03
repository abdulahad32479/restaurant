import apiClient from '../lib/axios';
import { InventoryItem, StockMovement } from '../types';

export const inventoryService = {
  getAll: async () => {
    const response = await apiClient.get<InventoryItem[]>('/v1/inventory/');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<InventoryItem>(`/v1/inventory/${id}/`);
    return response.data;
  },

  create: async (data: Omit<InventoryItem, 'id'>) => {
    const response = await apiClient.post<InventoryItem>('/v1/inventory/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<InventoryItem>) => {
    const response = await apiClient.put<InventoryItem>(`/v1/inventory/${id}/`, data);
    return response.data;
  },

  addStock: async (data: { product: string; branch: string; quantity: number; reason?: string }) => {
    const response = await apiClient.post<StockMovement>('/v1/inventory/add_stock/', data);
    return response.data;
  },

  reduceStock: async (data: { product: string; branch: string; quantity: number; reason?: string }) => {
    const response = await apiClient.post<StockMovement>('/v1/inventory/reduce_stock/', data);
    return response.data;
  },

  getMovements: async () => {
    const response = await apiClient.get<StockMovement[]>('/v1/stock-movements/');
    return response.data;
  }
};
