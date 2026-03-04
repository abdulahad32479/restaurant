import apiClient from '../lib/axios';
import { Product } from '../types';

export const productService = {
  getAll: async () => {
    const response = await apiClient.get<Product[]>('v1/products/');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Product>(`v1/products/${id}/`);
    return response.data;
  },

  create: async (productData: FormData | Omit<Product, 'id'>) => {
    const config = productData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await apiClient.post<Product>('v1/products/', productData, config);
    return response.data;
  },

  update: async (id: string, productData: FormData | Partial<Product>) => {
    const config = productData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await apiClient.put<Product>(`v1/products/${id}/`, productData, config);
    return response.data;
  },

  patch: async (id: string, productData: FormData | Partial<Product>) => {
    const config = productData instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    const response = await apiClient.patch<Product>(`v1/products/${id}/`, productData, config);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`v1/products/${id}/`);
    return response.data;
  }
};
