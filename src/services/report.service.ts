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
  getSalesSummary: async () => {
    const response = await apiClient.get<SalesSummary>('v1/reports/sales-summary/');
    return response.data;
  },

  getSalesByBranch: async () => {
    const response = await apiClient.get<SalesByBranchReport[]>('v1/reports/sales-by-branch/');
    return response.data;
  },

  getSalesByProduct: async () => {
    const response = await apiClient.get<SalesByProductReport[]>('v1/reports/sales-by-product/');
    return response.data;
  },

  getPaymentSummary: async () => {
    const response = await apiClient.get<PaymentSummaryReport[]>('v1/reports/payment-summary/');
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get<LowStockReport[]>('v1/reports/low-stock/');
    return response.data;
  },

  generateZReport: async (data: { date: string; counted_cash: string; branch: string }) => {
    const response = await apiClient.post<ZReport>('v1/reports/z-report/', data);
    return response.data;
  }
};
