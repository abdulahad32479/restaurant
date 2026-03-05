import apiClient from '../lib/axios';
import { Order, OrderItem, Payment } from '../types';

export const orderService = {
  getAll: async (status?: string | string[]) => {
    let url = 'v1/orders/';
    if (status) {
      if (Array.isArray(status)) {
        const params = status.map(s => `status=${s}`).join('&');
        url += `?${params}`;
      } else {
        url += `?status=${status}`;
      }
    }
    const response = await apiClient.get<any>(url);
    // Handle both direct array and DRF paginated response
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return [];
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

  // Helper to sanitize order data for status transitions
  // Backend expects specific fields and may fail if read-only or nested fields are present
  sanitizeOrderForUpdate: (order: any) => {
    const getID = (val: any) => {
      if (!val) return null;
      if (typeof val === 'object' && val.id) return val.id;
      if (typeof val === 'string') return val;
      return null;
    };
    
    const payload = {
      order_number: order.order_number || '',
      order_type: order.order_type || 'dine_in',
      notes: order.notes || '',
      paid_at: order.paid_at || null,
      branch: getID(order.branch),
      created_by: getID(order.created_by),
      table: getID(order.table) || getID(order.table_id),
      customer: getID(order.customer)
    };

    console.log('Sanitized fulfillment payload:', payload);
    return payload;
  },

  confirm: async (id: string, data: any) => {
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.post<Order>(`v1/orders/${id}/confirm/`, payload);
    return response.data;
  },

  markPreparing: async (id: string, data: any) => {
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_preparing/`, payload);
    return response.data;
  },

  markReady: async (id: string, data: any) => {
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_ready/`, payload);
    return response.data;
  },

  markServed: async (id: string, data: any) => {
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.post<Order>(`v1/orders/${id}/mark_served/`, payload);
    return response.data;
  },

  complete: async (id: string, data: any) => {
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.post<Order>(`v1/orders/${id}/complete/`, payload);
    return response.data;
  },

  cancel: async (id: string, data: any) => {
    const payload = { ...orderService.sanitizeOrderForUpdate(data), notes: data.notes || 'Cancelled' };
    const response = await apiClient.post<Order>(`v1/orders/${id}/cancel/`, payload);
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
};
