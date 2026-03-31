import { staffApi } from './api';
import { 
  StaffMember, 
  StaffRole, 
  PaginatedResponse 
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

  // --- Staff Members ---
  getStaffMembers: async (params?: Record<string, any>): Promise<PaginatedResponse<StaffMember>> => {
    const response = await staffApi.get<PaginatedResponse<StaffMember>>('members/', { params });
    return response.data;
  },

  getStaffMemberById: async (id: string): Promise<StaffMember> => {
    const response = await staffApi.get<StaffMember>(`members/${id}/`);
    return response.data;
  },

  createStaffMember: async (data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.post<StaffMember>('members/', data);
    return response.data;
  },

  updateStaffMember: async (id: string, data: Partial<StaffMember>): Promise<StaffMember> => {
    const response = await staffApi.patch<StaffMember>(`members/${id}/`, data);
    return response.data;
  },
};
