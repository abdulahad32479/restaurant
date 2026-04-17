import { staffApi } from './api';
import { PayrollRun, PayrollLine } from '../types/staff';

// ─── Exact Swagger filter params ──────────────────────────────────

// GET /api/v1/staff/payroll-runs/ filters: month, status, year
export interface PayrollRunFilters {
  month?: number;   // 1–12
  year?: number;    // e.g. 2026
  status?: 'draft' | 'finalized' | 'paid';
}

// GET /api/v1/staff/payroll-lines/ filters: is_paid, payroll_run, staff
export interface PayrollLineFilters {
  is_paid?: boolean;
  payroll_run?: string;  // UUID
  staff?: string;        // UUID
}

// POST /api/v1/staff/payroll-runs/ — branch & generated_by auto-set
// Only one run per (branch, year, month) allowed
export interface PayrollRunWriteBody {
  year: number;
  month: number;           // 1–12
  period_start: string;    // YYYY-MM-DD
  period_end: string;      // YYYY-MM-DD
  notes?: string;
}

// PUT / PATCH body also allows status (draft only)
export interface PayrollRunUpdateBody extends Partial<PayrollRunWriteBody> {
  status?: 'draft';        // only draft mutations allowed per Swagger
}

export const PayrollService = {
  // ─── Payroll Runs ────────────────────────────────────────────────
  // GET  /api/v1/staff/payroll-runs/
  // Lifecycle: draft → (generate) → finalized → (mark-paid per line) → paid
  getPayrollRuns: async (params?: PayrollRunFilters): Promise<PayrollRun[]> => {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
      : undefined;
    const response = await staffApi.get<PayrollRun[]>('payroll-runs/', { params: cleanParams });
    return response.data;
  },

  // GET  /api/v1/staff/payroll-runs/{id}/
  // Returns full run with nested PayrollLine records
  getPayrollRunById: async (id: string): Promise<PayrollRun> => {
    const response = await staffApi.get<PayrollRun>(`payroll-runs/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/payroll-runs/
  // Creates in draft status. After creation call /{id}/generate/ to populate lines.
  createPayrollRun: async (data: PayrollRunWriteBody): Promise<PayrollRun> => {
    const response = await staffApi.post<PayrollRun>('payroll-runs/', data);
    return response.data;
  },

  // PATCH /api/v1/staff/payroll-runs/{id}/
  // Update notes or dates. Only allowed on DRAFT runs.
  updatePayrollRun: async (id: string, data: PayrollRunUpdateBody): Promise<PayrollRun> => {
    const response = await staffApi.patch<PayrollRun>(`payroll-runs/${id}/`, data);
    return response.data;
  },

  // PUT  /api/v1/staff/payroll-runs/{id}/
  // Full replacement. Only allowed on DRAFT runs.
  replacePayrollRun: async (id: string, data: PayrollRunWriteBody): Promise<PayrollRun> => {
    const response = await staffApi.put<PayrollRun>(`payroll-runs/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/payroll-runs/{id}/  — CASCADE deletes all lines
  // Only delete DRAFT runs; finalized runs should be kept for audit.
  deletePayrollRun: async (id: string): Promise<void> => {
    await staffApi.delete(`payroll-runs/${id}/`);
  },

  // POST /api/v1/staff/payroll-runs/{id}/finalize/
  // Locks run: draft → finalized. After this, lines can be marked paid.
  // Returns 400 if run is not in draft status.
  finalizePayrollRun: async (id: string): Promise<PayrollRun> => {
    const response = await staffApi.post<PayrollRun>(`payroll-runs/${id}/finalize/`);
    return response.data;
  },

  // POST /api/v1/staff/payroll-runs/{id}/generate/
  // Calculates/recalculates PayrollLine for every active staff member.
  // Sums ledger entries for run's period. Only works on DRAFT runs.
  // Formula: net_salary = base_salary + (bonuses+reimbursements) - (advances+penalties+meal+deductions)
  // Returns 400 if run is not in draft status.
  generatePayrollLines: async (id: string): Promise<PayrollLine[]> => {
    const response = await staffApi.post<PayrollLine[]>(`payroll-runs/${id}/generate/`);
    return response.data;
  },

  // ─── Payroll Lines ───────────────────────────────────────────────
  // GET  /api/v1/staff/payroll-lines/
  // Filters: is_paid, payroll_run (UUID), staff (UUID)
  getPayrollLines: async (params?: PayrollLineFilters): Promise<PayrollLine[]> => {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
      : undefined;
    const response = await staffApi.get<PayrollLine[]>('payroll-lines/', { params: cleanParams });
    return response.data;
  },

  // GET  /api/v1/staff/payroll-lines/{id}/
  getPayrollLineById: async (id: string): Promise<PayrollLine> => {
    const response = await staffApi.get<PayrollLine>(`payroll-lines/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/payroll-lines/{id}/mark-paid/
  // Records salary payment for one staff member.
  // Sets is_paid=true, paid_at=now(), stores paid_amount & payment_note.
  // Also creates StaffLedgerEntry of type salary_payment/credit.
  // If paid_amount omitted, defaults to net_salary.
  // Only works on FINALIZED runs.
  markLinePaid: async (
    id: string,
    data: { paid_amount?: string | number; payment_note?: string }
  ): Promise<PayrollLine> => {
    const response = await staffApi.post<PayrollLine>(`payroll-lines/${id}/mark-paid/`, data);
    return response.data;
  },
};
