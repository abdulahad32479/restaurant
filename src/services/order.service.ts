import apiClient from '../lib/axios';
import { Order, OrderItem, Payment } from '../types';

export const orderService = {
  getAll: async (status?: string | string[], limit?: number) => {
    let url = 'v1/orders/';
    const params: string[] = [];
    
    if (status) {
      if (Array.isArray(status)) {
        params.push(`status=${status.join(',')}`);
      } else {
        params.push(`status=${status}`);
      }
    }
    
    if (limit) {
      params.push(`limit=${limit}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
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

  update: async (id: string, data: any) => {
    // Only send writable fields as per PatchedOrderRequest schema
    const payload = orderService.sanitizeOrderForUpdate(data);
    const response = await apiClient.patch<Order>(`v1/orders/${id}/`, payload);
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

  // Sanitizes order data to only include writable fields per PatchedOrderRequest schema.
  // IMPORTANT: items, status, subtotal, taxamount, total, paid_amount, is_paid are all read-only.
  sanitizeOrderForUpdate: (order: any) => {
    const getID = (val: any) => {
      if (!val) return null;
      if (typeof val === 'object' && val.id) return val.id;
      if (typeof val === 'string' && val.length > 0) return val;
      return null;
    };
    
    // Use `table` (the UUID FK field), not `table_id` which is only for order creation
    const payload: any = {
      order_type: order.order_type || 'dine_in',
      notes: order.notes || '',
      branch: getID(order.branch),
      table: getID(order.table) || getID(order.table_id) || getID(order.table_no) || null,
    };

    if (order.customer) {
      payload.customer = getID(order.customer);
    }

    if (order.delivery_person) {
      payload.delivery_person = getID(order.delivery_person);
    }

    if (order.items) {
      payload.items = order.items.map((item: any) => ({
        product: getID(item.product),
        quantity: item.quantity
      }));
    }

    return payload;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('v1/me/');
    return response.data;
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

  refund: async (id: string, paymentData: { method: string; amount: string; notes?: string; idempotency_key?: string }) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/refund/`, paymentData);
    return response.data;
  },

  changeTable: async (id: string, table_id: string | number) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/change_table/`, { table_id });
    return response.data;
  },

  assignDeliveryPerson: async (id: string, person_id: string | number) => {
    // Note: Backend uses 'asign_delivery' (single s) and 'person_id' as per Swagger
    const response = await apiClient.post<Order>(`v1/orders/${id}/asign_delivery/`, { person_id });
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await apiClient.get(`v1/orders/${id}/receipt/`);
    return response.data;
  }
};
