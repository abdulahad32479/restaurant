import { staffApi } from './api';
import { 
  StaffAttendance, 
  AttendanceDevice, 
  PaginatedResponse, 
  SyncDeviceResult,
  BiometricPunch
} from '../types/staff';

export const AttendanceService = {
  // --- Devices ---
  getDevices: async (params?: Record<string, any>): Promise<PaginatedResponse<AttendanceDevice>> => {
    const response = await staffApi.get<PaginatedResponse<AttendanceDevice>>('devices/', { params });
    return response.data;
  },

  createDevice: async (data: Partial<AttendanceDevice>): Promise<AttendanceDevice> => {
    const response = await staffApi.post<AttendanceDevice>('devices/', data);
    return response.data;
  },

  getDeviceById: async (id: string): Promise<AttendanceDevice> => {
    const response = await staffApi.get<AttendanceDevice>(`devices/${id}/`);
    return response.data;
  },

  updateDevice: async (id: string, data: Partial<AttendanceDevice>): Promise<AttendanceDevice> => {
    const response = await staffApi.patch<AttendanceDevice>(`devices/${id}/`, data);
    return response.data;
  },

  // --- Attendance ---
  getAttendance: async (params?: Record<string, any>): Promise<PaginatedResponse<StaffAttendance>> => {
    const response = await staffApi.get<PaginatedResponse<StaffAttendance>>('attendance/', { params });
    return response.data;
  },

  createManualAttendance: async (data: Partial<StaffAttendance>): Promise<StaffAttendance> => {
    const response = await staffApi.post<StaffAttendance>('attendance/', data);
    return response.data;
  },

  getAttendanceById: async (id: string): Promise<StaffAttendance> => {
    const response = await staffApi.get<StaffAttendance>(`attendance/${id}/`);
    return response.data;
  },

  updateAttendance: async (id: string, data: Partial<StaffAttendance>): Promise<StaffAttendance> => {
    const response = await staffApi.patch<StaffAttendance>(`attendance/${id}/`, data);
    return response.data;
  },

  // --- Biometric Punches ---
  getPunches: async (params?: Record<string, any>): Promise<PaginatedResponse<BiometricPunch>> => {
    const response = await staffApi.get<PaginatedResponse<BiometricPunch>>('punches/', { params });
    return response.data;
  },

  getPunchById: async (id: string): Promise<BiometricPunch> => {
    const response = await staffApi.get<BiometricPunch>(`punches/${id}/`);
    return response.data;
  },

  // --- Actions ---
  syncDevice: async (device_id: string): Promise<SyncDeviceResult> => {
    const response = await staffApi.post('biometric/sync-device/', { device_id });
    return response.data;
  },

  processAttendance: async (target_date: string): Promise<any> => {
    const response = await staffApi.post('biometric/process-attendance/', { target_date });
    return response.data;
  },
};
