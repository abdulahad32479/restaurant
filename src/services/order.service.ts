import apiClient from '../lib/axios';
import { Order, OrderItem, Payment } from '../types';

export const orderService = {
  getAll: async (status?: string) => {
    const url = status ? `v1/orders/?status=${status}` : 'v1/orders/';
    const response = await apiClient.get<Order[]>(url);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Order>(`v1/orders/${id}/`);
    return response.data;
  },

  create: async (data: Partial<Order>) => {
    const response = await apiClient.post<Order>('v1/orders/', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Order>) => {
    const response = await apiClient.put<Order>(`v1/orders/${id}/`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`v1/orders/${id}/`);
    return response.data;
  },

  addItem: async (orderId: string, itemData: OrderItem) => {
    const response = await apiClient.post<Order>(`v1/orders/${orderId}/add_item/`, itemData);
    return response.data;
  },

  updateItem: async (orderId: string, itemData: { product: string; quantity: number }) => {
    const response = await apiClient.post<Order>(`v1/orders/${orderId}/update_item/`, itemData);
    return response.data;
  },

  removeItem: async (orderId: string, product: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${orderId}/remove_item/`, { product });
    return response.data;
  },

  addPayment: async (orderId: string, paymentData: Partial<Payment>) => {
    const response = await apiClient.post<Order>(`v1/orders/${orderId}/add_payment/`, paymentData);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'confirmed' });
    return response.data;
  },

  markPreparing: async (id: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'preparing' });
    return response.data;
  },

  markReady: async (id: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'ready' });
    return response.data;
  },

  markServed: async (id: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'served' });
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'completed' });
    return response.data;
  },

  cancel: async (id: string, reason?: string) => {
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, { status: 'cancelled', notes: reason });
    return response.data;
  },

  refund: async (id: string, paymentData: { method: string; amount: string; idempotency_key?: string }) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/refund/`, paymentData);
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await apiClient.get(`v1/orders/${id}/receipt/`);
    return response.data;
  }
  ,
  // Explicit POST endpoints (match backend routes)
  markPreparingPost: async (id: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_preparing/`);
    return response.data;
  },

  markReadyPost: async (id: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_ready/`);
    return response.data;
  },

  markServedPost: async (id: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_served/`);
    return response.data;
  },

  confirmPost: async (id: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/confirm/`);
    return response.data;
  },

  completePost: async (id: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/complete/`);
    return response.data;
  },

  cancelPost: async (id: string, reason?: string) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/cancel/`, { reason });
    return response.data;
  }
};
