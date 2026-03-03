import apiClient from '../lib/axios';
import { SalesSummary, LowStockReport } from '../types';

export const reportService = {
  getSalesSummary: async () => {
    const response = await apiClient.get<SalesSummary>('/v1/reports/sales-summary/');
    return response.data;
  },

  getSalesByBranch: async () => {
    const response = await apiClient.get('/v1/reports/sales-by-branch/');
    return response.data;
  },

  getSalesByProduct: async () => {
    const response = await apiClient.get('/v1/reports/sales-by-product/');
    return response.data;
  },

  getPaymentSummary: async () => {
    const response = await apiClient.get('/v1/reports/payment-summary/');
    return response.data;
  },

  getLowStock: async () => {
    const response = await apiClient.get<LowStockReport[]>('/v1/reports/low-stock/');
    return response.data;
  },

  generateZReport: async () => {
    const response = await apiClient.post('/v1/reports/z-report/');
    return response.data;
  }
};
