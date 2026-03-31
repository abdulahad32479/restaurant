import apiClient from '../lib/axios';

/**
 * Report Service v2
 * Strictly follows the technical specification provided for /api/v1/v2/ endpoints.
 */

export interface DashboardKPIs {
  total_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  refunded_orders: number;
  partially_refunded_orders: number;
  net_sales: string;
  avg_order_value: string;
  items_sold: string;
  voided_qty: string;
  order_type_split: { order_type: string; count: number }[];
  payment_split: { method: string; total: string }[];
}

export interface DeliveryPersonPerformance {
  delivery_person__id: string;
  delivery_person__name: string;
  total_orders: number;
  total_sales: string;
  avg_order_value: string;
}

export interface DeliverySummary {
  total_delivery_orders: number;
  completed_delivery_orders: number;
  cancelled_delivery_orders: number;
  avg_delivery_order_value: string;
  total_delivery_sales: string;
}

export interface OperationsSummary {
  avg_confirm_to_prepare: string;
  avg_prepare_to_ready: string;
  avg_ready_to_complete: string;
  avg_confirm_to_complete: string;
}

export interface PaymentReconciliation {
  expected_total: string;
  collected_total: string;
  difference: string;
  unpaid_completed_orders: number;
  pending_payments: number;
  failed_payments: number;
  refund_payments: number;
  method_split: { method: string; total: string; count: number }[];
}

export interface ProductPerformance {
  product__id: string;
  product__name: string;
  quantity_sold: string;
  revenue: string;
  voided_qty: string;
  order_count: number;
}

export interface StaffPerformance {
  created_by__id: string;
  created_by__username: string;
  total_orders: number;
  total_sales: string;
  avg_order_value: string;
  payment_split: { method: string; total: string; count: number }[];
}

export interface DailySalesTrend {
  day: string;
  orders_count: number;
  sales: string;
}

export interface HourlyTrend {
  hour: number;
  orders_count: number;
  sales: string;
  quantity: string;
}

export interface ZReportV2Response {
  z_report: {
    id: number;
    date: string;
    total_orders: number;
    paid_orders: number;
    unpaid_completed_orders: number;
    cancelled_orders: number;
    refunded_orders: number;
    total_sales: string;
    total_tax: string;
    total_discount: string;
    total_items: string;
    collected_total: string;
    total_cash: string;
    total_card: string;
    total_wallet: string;
    total_other: string;
    pending_payment_count: number;
    failed_payment_count: number;
    refund_payment_count: number;
    counted_cash: string;
    cash_difference: string;
    notes: string;
    anomaly_flags: string;
    start_time: string;
    end_time: string;
  };
  exceptions: Record<string, string>;
}

export const reportServiceV2 = {
  getDashboardKPIs: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<DashboardKPIs>('v1/v2/dashboard/', { params });
    return response.data;
  },

  getDeliveryPerformance: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<DeliveryPersonPerformance[]>('v1/v2/delivery/person-performance/', { params });
    return response.data;
  },

  getDeliverySummary: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<DeliverySummary>('v1/v2/delivery/summary/', { params });
    return response.data;
  },

  getOperationsSummary: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<OperationsSummary>('v1/v2/operations/summary/', { params });
    return response.data;
  },

  getPaymentReconciliation: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<PaymentReconciliation>('v1/v2/payments/reconciliation/', { params });
    return response.data;
  },

  getProductPerformance: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<ProductPerformance[]>('v1/v2/products/performance/', { params });
    return response.data;
  },

  getStaffPerformance: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<StaffPerformance[]>('v1/v2/staff/performance/', { params });
    return response.data;
  },

  getDailySalesTrend: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<DailySalesTrend[]>('v1/v2/trends/daily-sales/', { params });
    return response.data;
  },

  getHourlySalesTrend: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<HourlyTrend[]>('v1/v2/trends/hourly-sales/', { params });
    return response.data;
  },

  getHourlyItemsTrend: async (params: { start_date: string; end_date: string }) => {
    const response = await apiClient.get<HourlyTrend[]>('v1/v2/trends/hourly-items/', { params });
    return response.data;
  },

  generateZReportV2: async (data: { 
    counted_cash: string; 
    custom_start?: string; 
    custom_end?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post<ZReportV2Response>('v1/v2/z-report/generate/', data);
    return response.data;
  }
};
