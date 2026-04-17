import { staffApi } from './api';
import { StaffLedgerEntry } from '../types/staff';

// ─── Exact Swagger filter params for GET /api/v1/staff/ledger/ ────
// direction, entry_type, month, staff (UUID), year
export interface LedgerEntryFilters {
  direction?: 'credit' | 'debit';
  entry_type?:
    | 'adjustment'
    | 'advance'
    | 'bonus'
    | 'deduction'
    | 'late_penalty'
    | 'meal_deduction'
    | 'reimbursement'
    | 'salary_payment';
  month?: number;   // 1–12 payroll period month
  staff?: string;   // UUID
  year?: number;    // payroll period year
}

// ─── Request body for POST / PUT / PATCH ──────────────────────────
// Required: staff, entry_date, entry_type, direction, amount
// Optional: note, payroll_period_year, payroll_period_month, is_active
// branch and created_by are auto-set by backend
export interface LedgerEntryWriteBody {
  staff: string;
  entry_date: string;       // YYYY-MM-DD
  entry_type: NonNullable<LedgerEntryFilters['entry_type']>;
  direction: 'debit' | 'credit';
  amount: string | number;
  note?: string;
  payroll_period_year?: number;
  payroll_period_month?: number;
  is_active?: boolean;
}

export const LedgerService = {
  // GET  /api/v1/staff/ledger/
  // Filters: direction, entry_type, month, staff, year
  getLedgerEntries: async (params?: LedgerEntryFilters): Promise<StaffLedgerEntry[]> => {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
      : undefined;
    const response = await staffApi.get<StaffLedgerEntry[]>('ledger/', { params: cleanParams });
    return response.data;
  },

  // GET  /api/v1/staff/ledger/{id}/
  getLedgerEntryById: async (id: string): Promise<StaffLedgerEntry> => {
    const response = await staffApi.get<StaffLedgerEntry>(`ledger/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/ledger/
  // Important: always set payroll_period_year/month so generate step picks it up
  createLedgerEntry: async (data: Partial<LedgerEntryWriteBody>): Promise<StaffLedgerEntry> => {
    const response = await staffApi.post<StaffLedgerEntry>('ledger/', data);
    return response.data;
  },

  // PATCH /api/v1/staff/ledger/{id}/  — updated_by auto-set
  updateLedgerEntry: async (id: string, data: Partial<LedgerEntryWriteBody>): Promise<StaffLedgerEntry> => {
    const response = await staffApi.patch<StaffLedgerEntry>(`ledger/${id}/`, data);
    return response.data;
  },

  // PUT  /api/v1/staff/ledger/{id}/  — full replacement, updated_by auto-set
  replaceLedgerEntry: async (id: string, data: LedgerEntryWriteBody): Promise<StaffLedgerEntry> => {
    const response = await staffApi.put<StaffLedgerEntry>(`ledger/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/ledger/{id}/
  // Hard delete — soft delete (is_active=false) preferred to preserve audit trail
  deleteLedgerEntry: async (id: string): Promise<void> => {
    await staffApi.delete(`ledger/${id}/`);
  },
};
