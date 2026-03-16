import apiClient from '../lib/axios';
import { 
  SalesSummary, 
  LowStockReport, 
  SalesByBranchReport, 
  SalesByProductReport, 
  PaymentSummaryReport,
  ZReport
} from '../types';

export const reportService = {
  getSalesSummary: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<SalesSummary>('v1/reports/sales-summary/', { params });
    return response.data;
  },

  getSalesByBranch: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<SalesByBranchReport[]>('v1/reports/sales-by-branch/', { params });
    return response.data;
  },

  getSalesByProduct: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<SalesByProductReport[]>('v1/reports/sales-by-product/', { params });
    return response.data;
  },

  getPaymentSummary: async (params?: { start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<PaymentSummaryReport[]>('v1/reports/payment-summary/', { params });
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get<LowStockReport[]>('v1/reports/low-stock/');
    return response.data;
  },

  generateZReport: async (data: { 
    counted_cash: string; 
    custom_start?: string; 
    custom_end?: string;
  }) => {
    const response = await apiClient.post<ZReport>('v1/reports/z-report/', data);
    return response.data;
  }
};
