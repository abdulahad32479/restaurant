import { staffApi } from './api';
import { StaffLedgerEntry, PaginatedResponse } from '../types/staff';

export const LedgerService = {
  getLedgerEntries: async (params?: Record<string, any>): Promise<PaginatedResponse<StaffLedgerEntry>> => {
    const response = await staffApi.get<PaginatedResponse<StaffLedgerEntry>>('ledger/', { params });
    return response.data;
  },

  createLedgerEntry: async (data: Partial<StaffLedgerEntry>): Promise<StaffLedgerEntry> => {
    const response = await staffApi.post<StaffLedgerEntry>('ledger/', data);
    return response.data;
  },

  getLedgerEntryById: async (id: string): Promise<StaffLedgerEntry> => {
    const response = await staffApi.get<StaffLedgerEntry>(`ledger/${id}/`);
    return response.data;
  },

  updateLedgerEntry: async (id: string, data: Partial<StaffLedgerEntry>): Promise<StaffLedgerEntry> => {
    const response = await staffApi.patch<StaffLedgerEntry>(`ledger/${id}/`, data);
    return response.data;
  },
};
