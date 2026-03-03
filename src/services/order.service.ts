import apiClient from '../lib/axios';
import { Order, OrderItem, Payment } from '../types';

export const orderService = {
  getAll: async () => {
    const response = await apiClient.get<Order[]>('/v1/orders/');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Order>(`/v1/orders/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Order>) => {
    const response = await apiClient.post<Order>('/v1/orders/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>) => {
    const response = await apiClient.put<Order>(`/v1/orders/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/v1/orders/${id}/`);
    return response.data;
  },

  addItem: async (orderId: string, itemData: OrderItem) => {
    const response = await apiClient.post<Order>(`/v1/orders/${orderId}/add_item/`, itemData);
    return response.data;
  },

  updateItem: async (orderId: string, itemData: { product: string; quantity: number }) => {
    const response = await apiClient.post<Order>(`/v1/orders/${orderId}/update_item/`, itemData);
    return response.data;
  },

  removeItem: async (orderId: string, product: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${orderId}/remove_item/`, { product });
    return response.data;
  },

  addPayment: async (orderId: string, paymentData: Payment) => {
    const response = await apiClient.post<Order>(`/v1/orders/${orderId}/add_payment/`, paymentData);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/confirm/`);
    return response.data;
  },

  markPreparing: async (id: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/mark_preparing/`);
    return response.data;
  },

  markReady: async (id: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/mark_ready/`);
    return response.data;
  },

  markServed: async (id: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/mark_served/`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/complete/`);
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/cancel/`, { reason });
    return response.data;
  },

  refund: async (id: string, reason?: string) => {
    const response = await apiClient.post<Order>(`/v1/orders/${id}/refund/`, { reason });
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await apiClient.get(`/v1/orders/${id}/receipt/`, { responseType: 'blob' });
    return response.data;
  }
};
