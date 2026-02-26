import apiClient from '../lib/axios';
import { Product } from '../types';

export const productService = {
  getAll: async () => {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (productData: Omit<Product, 'id'>) => {
    const response = await apiClient.post<Product>('/products', productData);
    return response.data;
  },

  update: async (id: string, productData: Partial<Product>) => {
    const response = await apiClient.put<Product>(`/products/${id}`, productData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  }
};
