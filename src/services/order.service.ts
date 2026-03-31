import apiClient from '../lib/axios';
import { Order, OrderItem, Payment, OrderFilters } from '../types';

export const orderService = {
  getAll: async (filters: OrderFilters = {}) => {
    let url = 'v1/orders/';
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      // Skip undefined, null, or empty strings
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await apiClient.get<any>(url);
    
    // Handle both direct array and DRF paginated response
    // If it's a paginated response, return the full object so the UI can use 'count', 'next', etc.
    if (response.data && response.data.results && Array.isArray(response.data.results)) {
      return response.data;
    }
    
    // If it's just an array, return it (backward compatibility or non-paginated endpoints)
    if (Array.isArray(response.data)) {
      return response.data;
    }

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

    // Item management must be done via separate endpoints (add_item, update_item, remove_item)
    // Sending items in patch/put to v1/orders/{id}/ is disabled/read-only on backend.

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

  syncOrderItems: async (orderId: string, currentCart: { product: any; quantity: number }[], originalItems: OrderItem[]) => {
    // Helper to extract product ID robustly
    const getProductId = (item: any): string => {
      if (!item) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object' && item !== null) {
        return (item.id || item.product || '').toString().trim();
      }
      return String(item).trim();
    };

    console.log(`[syncOrderItems] Syncing items for order ${orderId}`, {
      cartCount: currentCart.length,
      originalCount: originalItems.length
    });

    // 1. Calculate EFFECTIVE quantities from original items
    // (Backend sends all actions, we need the current net state)
    const effectiveOriginalMap = new Map<string, number>();
    originalItems.forEach(item => {
      const pId = getProductId(item.product);
      if (!pId) return;
      const qty = Number(item.quantity || 0);
      const current = effectiveOriginalMap.get(pId) || 0;
      if (item.action === 'void') {
        effectiveOriginalMap.set(pId, current - qty);
      } else {
        effectiveOriginalMap.set(pId, current + qty);
      }
    });

    // 2. Identify what to add, update, or remove
    const currentItemsMap = new Map(currentCart.map(item => [getProductId(item.product), item]));

    const promises: Promise<any>[] = [];

    // Remove or Update existing items
    Array.from(effectiveOriginalMap.entries()).forEach(([prodId, origQty]) => {
      const currentItem = currentItemsMap.get(prodId);
      
      if (!currentItem || currentItem.quantity <= 0) {
        // If it was effectively in the order (qty > 0) but now it's not, remove it
        if (origQty > 0) {
          console.log(`[syncOrderItems] Removing product: ${prodId} (Effective qty was ${origQty})`);
          promises.push(orderService.removeItem(orderId, prodId).catch(err => {
            console.error(`[syncOrderItems] Failed to remove product ${prodId}`, err);
            throw err;
          }));
        }
      } else if (Number(origQty) !== Number(currentItem.quantity)) {
        // Quantity changed
        console.log(`[syncOrderItems] Updating quantity for product: ${prodId} (${origQty} -> ${currentItem.quantity})`);
        promises.push(orderService.updateItem(orderId, { product: prodId, quantity: currentItem.quantity }).catch(err => {
          console.error(`[syncOrderItems] Failed to update product ${prodId}`, err);
          throw err;
        }));
      }
    });

    // Add entirely new items
    Array.from(currentItemsMap.entries()).forEach(([prodId, item]) => {
      if (!prodId || item.quantity <= 0) return;
      
      const origQty = effectiveOriginalMap.get(prodId) || 0;
      if (origQty <= 0) {
        // New item (not effectively in order before)
        console.log(`[syncOrderItems] Adding new product: ${prodId} with quantity ${item.quantity}`);
        promises.push(orderService.addItem(orderId, { product: prodId, quantity: item.quantity }).catch(err => {
          console.error(`[syncOrderItems] Failed to add product ${prodId}`, err);
          throw err;
        }));
      }
    });

    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        console.log(`[syncOrderItems] Successfully synced all items for order ${orderId}`);
        return await orderService.getById(orderId);
      } catch (syncError) {
        console.error(`[syncOrderItems] Error during item synchronization for order ${orderId}`, syncError);
        throw syncError;
      }
    }
    
    return null;
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

  applyDiscount: async (id: string, data: { type: string; value: string; reason: string }) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/apply_discount/`, data);
    return response.data;
  },

  removeDiscount: async (id: string, discount_id: number) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/remove_discount/`, { discount_id });
    return response.data;
  },

  updateDiscount: async (id: string, data: { discount_id: number; type: string; value: string; reason: string }) => {
    const response = await apiClient.post<Order>(`v1/orders/${id}/update_discount/`, data);
    return response.data;
  },

  getReceipt: async (id: string) => {
    const response = await apiClient.get(`v1/orders/${id}/receipt/`);
    return response.data;
  }
};
