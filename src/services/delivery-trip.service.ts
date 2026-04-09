import apiClient from '../lib/axios';
import { DeliveryTrip, DispatchBoardItem, TripSuggestion, PaginatedResponse, WhatsAppLog } from '../types';

export const deliveryTripService = {
  getTrips: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<DeliveryTrip>>('v1/delivery-trips/', { params });
    return response.data;
  },

  getTripDetail: async (id: string) => {
    const response = await apiClient.get<DeliveryTrip>(`v1/delivery-trips/${id}/`);
    return response.data;
  },

  createTrip: async (data: { order_ids: string[]; notes?: string; is_custom?: boolean }) => {
    const payload: any = { order_ids: data.order_ids, is_custom: data.is_custom ?? false };
    if (data.notes && data.notes.trim() !== '') {
        payload.notes = data.notes;
    }
    const response = await apiClient.post<DeliveryTrip>('v1/orders/create_trip/', payload);
    return response.data;
  },

  updateTrip: async (data: { trip_id: string; notes: string }) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/update_trip/', data);
    return response.data;
  },

  assignTrip: async (data: { trip_id: string; person_id: string; send_whatsapp?: boolean }) => {
    const payload = {
      trip_id: data.trip_id,
      person_id: data.person_id,
      send_whatsapp: data.send_whatsapp ?? true
    };
    const response = await apiClient.post<DeliveryTrip>('v1/orders/assign_trip/', payload);
    return response.data;
  },

  reassignTrip: async (data: { trip_id: string; person_id: string; send_whatsapp?: boolean }) => {
    const payload = {
      trip_id: data.trip_id,
      person_id: data.person_id,
      send_whatsapp: data.send_whatsapp ?? true
    };
    const response = await apiClient.post<DeliveryTrip>('v1/orders/reassign_trip/', payload);
    return response.data;
  },

  dispatchTrip: async (tripId: string) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/dispatch_trip/', { trip_id: tripId });
    return response.data;
  },

  completeTrip: async (tripId: string) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/complete_trip/', { trip_id: tripId });
    return response.data;
  },

  cancelTrip: async (tripId: string) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/cancel_trip/', { trip_id: tripId });
    return response.data;
  },

  assignAndDispatchTrip: async (data: { trip_id: string; person_id: string; send_whatsapp?: boolean }) => {
    const payload = { 
      trip_id: data.trip_id, 
      person_id: data.person_id, 
      send_whatsapp: data.send_whatsapp ?? true
    };
    const response = await apiClient.post<DeliveryTrip>('v1/orders/assign_and_dispatch_trip/', payload);
    return response.data;
  },

  addOrdersToTrip: async (data: { trip_id: string; order_ids: string[] }) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/add_orders_to_trip/', data);
    return response.data;
  },

  removeOrderFromTrip: async (data: { trip_id: string; order_id: string }) => {
    const response = await apiClient.post<DeliveryTrip>('v1/orders/remove_order_from_trip/', data);
    return response.data;
  },

  getDispatchBoard: async (): Promise<DispatchBoardItem[]> => {
    const response = await apiClient.get<any>('v1/orders/delivery_dispatch_board/');
    // Handle DRF paginated response { count, results: [...] }
    if (response.data && Array.isArray(response.data.results)) {
      return response.data.results as DispatchBoardItem[];
    }
    // Handle direct array response
    if (Array.isArray(response.data)) {
      return response.data as DispatchBoardItem[];
    }
    return [];
  },

  getTripSuggestions: async () => {
    const response = await apiClient.get<TripSuggestion[]>('v1/orders/trip_suggestions/');
    return response.data;
  },

  sendOrderToRiderWhatsapp: async (orderId: string) => {
    const response = await apiClient.post(`v1/orders/${orderId}/send_order_to_rider_whatsapp/`);
    return response.data;
  },

  sendTripToRiderWhatsapp: async (tripId: string) => {
    const response = await apiClient.post('v1/orders/send_trip_to_rider_whatsapp/', { trip_id: tripId });
    return response.data;
  },

  getWhatsAppLogs: async (params?: any) => {
    const response = await apiClient.get<PaginatedResponse<WhatsAppLog>>('v1/whatsapp-logs/', { params });
    return response.data;
  },

  getWhatsAppLogDetail: async (id: string) => {
    const response = await apiClient.get<WhatsAppLog>(`v1/whatsapp-logs/${id}/`);
    return response.data;
  }
};
