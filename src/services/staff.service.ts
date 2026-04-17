import { staffApi } from './api';
import { 
  StaffMember, 
  StaffRole, 
  LedgerSummaryResponse
} from '../types/staff';

// Filter params matching Swagger: employment_status, is_active, role (UUID), search
export interface StaffMemberFilters {
  employment_status?: 'active' | 'inactive' | 'terminated';
  is_active?: boolean;
  role?: string; // UUID
  search?: string;
}

export const StaffService = {
  // ─── Staff Roles ───────────────────────────────────────────────
  // GET    /api/v1/staff/roles/
  getRoles: async (): Promise<StaffRole[]> => {
    const response = await staffApi.get<StaffRole[]>('roles/');
    return response.data;
  },

  // GET    /api/v1/staff/roles/{id}/
  getRoleById: async (id: string): Promise<StaffRole> => {
    const response = await staffApi.get<StaffRole>(`roles/${id}/`);
    return response.data;
  },

  // POST   /api/v1/staff/roles/
  createRole: async (data: Partial<StaffRole>): Promise<StaffRole> => {
    const response = await staffApi.post<StaffRole>('roles/', data);
    return response.data;
  },

  // PATCH  /api/v1/staff/roles/{id}/
  updateRole: async (id: string, data: Partial<StaffRole>): Promise<StaffRole> => {
    const response = await staffApi.patch<StaffRole>(`roles/${id}/`, data);
    return response.data;
  },

  // PUT    /api/v1/staff/roles/{id}/
  replaceRole: async (id: string, data: StaffRole): Promise<StaffRole> => {
    const response = await staffApi.put<StaffRole>(`roles/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/roles/{id}/
  deleteRole: async (id: string): Promise<void> => {
    await staffApi.delete(`roles/${id}/`);
  },

  // ─── Staff Members ─────────────────────────────────────────────
  // GET    /api/v1/staff/members/
  // Filters: employment_status, is_active, role (UUID), search
  getStaffMembers: async (params?: StaffMemberFilters): Promise<StaffMember[]> => {
    const response = await staffApi.get<StaffMember[]>('members/', { params });
    return response.data;
  },

  // GET    /api/v1/staff/members/{id}/
  getStaffMemberById: async (id: string): Promise<StaffMember> => {
    const response = await staffApi.get<StaffMember>(`members/${id}/`);
    return response.data;
  },

  // POST   /api/v1/staff/members/
  // Required: employee_code, full_name, phone, address, role (UUID),
  //           joining_date, employment_status, salary_type, base_salary,
  //           default_late_penalty, default_meal_deduction, biometric_code,
  //           is_delivery_staff, is_kitchen_staff, is_cashier, is_manager, is_active
  // Note: branch is auto-set by backend – do NOT include in body
  createStaffMember: async (data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.post<StaffMember>('members/', data);
    return response.data;
  },

  // PATCH  /api/v1/staff/members/{id}/
  updateStaffMember: async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.patch<StaffMember>(`members/${id}/`, data);
    return response.data;
  },

  // PUT    /api/v1/staff/members/{id}/
  replaceStaffMember: async (id: string, data: StaffMember): Promise<StaffMember> => {
    const response = await staffApi.put<StaffMember>(`members/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/members/{id}/
  deleteStaffMember: async (id: string): Promise<void> => {
    await staffApi.delete(`members/${id}/`);
  },

  // ─── Staff Member Ledger Sub-resource ──────────────────────────
  // GET    /api/v1/staff/members/{id}/ledger/
  // Filters: entry_type, month (1–12), year
  getStaffLedgerSummary: async (
    id: string,
    params?: { entry_type?: string; month?: number; year?: number }
  ): Promise<LedgerSummaryResponse> => {
    const response = await staffApi.get<LedgerSummaryResponse>(`members/${id}/ledger/`, { params });
    return response.data;
  },
};
