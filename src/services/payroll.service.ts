import { staffApi } from './api';
import { PayrollRun, PayrollLine, PaginatedResponse } from '../types/staff';

export const PayrollService = {
  // --- Payroll Runs ---
  getPayrollRuns: async (params?: Record<string, any>): Promise<PaginatedResponse<PayrollRun>> => {
    const response = await staffApi.get<PaginatedResponse<PayrollRun>>('payroll/', { params });
    return response.data;
  },

  getPayrollRunById: async (id: string): Promise<PayrollRun> => {
    const response = await staffApi.get<PayrollRun>(`payroll/${id}/`);
    return response.data;
  },

  // --- Payroll Lines ---
  getPayrollLines: async (params?: Record<string, any>): Promise<PaginatedResponse<PayrollLine>> => {
    const response = await staffApi.get<PaginatedResponse<PayrollLine>>('payroll-lines/', { params });
    return response.data;
  },

  getPayrollLineById: async (id: string): Promise<PayrollLine> => {
    const response = await staffApi.get<PayrollLine>(`payroll-lines/${id}/`);
    return response.data;
  },

  // --- Actions ---
  generatePayroll: async (year: number, month: number): Promise<any> => {
    const response = await staffApi.post('payroll/generate/', { year, month });
    return response.data;
  },

  finalizePayroll: async (id: string): Promise<any> => {
    const response = await staffApi.post(`payroll/${id}/finalize/`);
    return response.data;
  },

  markLinePaid: async (id: string, data: { paid_amount?: string | number, note?: string }): Promise<any> => {
    const response = await staffApi.post(`payroll-line/${id}/mark-paid/`, data);
    return response.data;
  },
};
