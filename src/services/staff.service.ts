import { staffApi } from './api';
import { 
  StaffMember, 
  StaffRole, 
  PaginatedResponse,
  LedgerSummaryResponse
} from '../types/staff';

export const StaffService = {
  // --- Roles ---
  getRoles: async (): Promise<StaffRole[]> => {
    const response = await staffApi.get<StaffRole[]>('roles/');
    return response.data;
  },

  getRoleById: async (id: string): Promise<StaffRole> => {
    const response = await staffApi.get<StaffRole>(`roles/${id}/`);
    return response.data;
  },

  createRole: async (data: Partial<StaffRole>): Promise<StaffRole> => {
    const response = await staffApi.post<StaffRole>('roles/', data);
    return response.data;
  },

  updateRole: async (id: string, data: Partial<StaffRole>): Promise<StaffRole> => {
    const response = await staffApi.patch<StaffRole>(`roles/${id}/`, data);
    return response.data;
  },

  replaceRole: async (id: string, data: StaffRole): Promise<StaffRole> => {
    const response = await staffApi.put<StaffRole>(`roles/${id}/`, data);
    return response.data;
  },

  deleteRole: async (id: string): Promise<void> => {
    await staffApi.delete(`roles/${id}/`);
  },

  // --- Staff Members ---
  getStaffMembers: async (params?: Record<string, any>): Promise<StaffMember[]> => {
    const response = await staffApi.get<StaffMember[]>('staff/', { params });
    return response.data;
  },

  getStaffMemberById: async (id: string): Promise<StaffMember> => {
    const response = await staffApi.get<StaffMember>(`staff/${id}/`);
    return response.data;
  },

  createStaffMember: async (data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.post<StaffMember>('staff/', data);
    return response.data;
  },

  updateStaffMember: async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.patch<StaffMember>(`staff/${id}/`, data);
    return response.data;
  },

  replaceStaffMember: async (id: string, data: StaffMember): Promise<StaffMember> => {
    const response = await staffApi.put<StaffMember>(`staff/${id}/`, data);
    return response.data;
  },

  deleteStaffMember: async (id: string): Promise<void> => {
    await staffApi.delete(`staff/${id}/`);
  },

  getStaffLedgerSummary: async (id: string, params?: { entry_type?: string; month?: number; year?: number }): Promise<LedgerSummaryResponse> => {
    const response = await staffApi.get<LedgerSummaryResponse>(`staff/${id}/ledger/`, { params });
    return response.data;
  },
};
