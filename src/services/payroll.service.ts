import { staffApi } from './api';
import { PayrollRun, PayrollLine, PaginatedResponse } from '../types/staff';

export const PayrollService = {
  // --- Payroll Runs ---
  getPayrollRuns: async (params?: Record<string, any>): Promise<PayrollRun[]> => {
    // API returns a list directly according to the schema
    const response = await staffApi.get<PayrollRun[]>('payroll-runs/', { params });
    return response.data;
  },

  getPayrollRunById: async (id: string): Promise<PayrollRun> => {
    const response = await staffApi.get<PayrollRun>(`payroll-runs/${id}/`);
    return response.data;
  },

  createPayrollRun: async (data: Partial<PayrollRun>): Promise<PayrollRun> => {
    const response = await staffApi.post<PayrollRun>('payroll-runs/', data);
    return response.data;
  },

  updatePayrollRun: async (id: string, data: Partial<PayrollRun>): Promise<PayrollRun> => {
    const response = await staffApi.patch<PayrollRun>(`payroll-runs/${id}/`, data);
    return response.data;
  },

  deletePayrollRun: async (id: string): Promise<void> => {
    await staffApi.delete(`payroll-runs/${id}/`);
  },

  finalizePayrollRun: async (id: string): Promise<PayrollRun> => {
    const response = await staffApi.post<PayrollRun>(`payroll-runs/${id}/finalize/`);
    return response.data;
  },

  generatePayrollLines: async (id: string): Promise<PayrollLine[]> => {
    const response = await staffApi.post<PayrollLine[]>(`payroll-runs/${id}/generate/`);
    return response.data;
  },

  // --- Payroll Lines ---
  getPayrollLines: async (params?: Record<string, any>): Promise<PayrollLine[]> => {
    const response = await staffApi.get<PayrollLine[]>('payroll-lines/', { params });
    return response.data;
  },

  getPayrollLineById: async (id: string): Promise<PayrollLine> => {
    const response = await staffApi.get<PayrollLine>(`payroll-lines/${id}/`);
    return response.data;
  },

  markLinePaid: async (id: string, data: { paid_amount?: string | number, payment_note?: string }): Promise<any> => {
    const response = await staffApi.post<any>(`payroll-lines/${id}/mark-paid/`, data);
    return response.data;
  },
};
