import { staffApi } from './api';
import { 
  StaffAttendance, 
  AttendanceDevice, 
  SyncDeviceResult,
  BiometricPunch
} from '../types/staff';

export const AttendanceService = {
  // --- Devices ---
  getDevices: async (params?: Record<string, any>): Promise<AttendanceDevice[]> => {
    const response = await staffApi.get<AttendanceDevice[]>('attendance-devices/', { params });
    return response.data;
  },

  createDevice: async (data: Partial<AttendanceDevice>): Promise<AttendanceDevice> => {
    const response = await staffApi.post<AttendanceDevice>('attendance-devices/', data);
    return response.data;
  },

  getDeviceById: async (id: string): Promise<AttendanceDevice> => {
    const response = await staffApi.get<AttendanceDevice>(`attendance-devices/${id}/`);
    return response.data;
  },

  updateDevice: async (id: string, data: Partial<AttendanceDevice>): Promise<AttendanceDevice> => {
    const response = await staffApi.patch<AttendanceDevice>(`attendance-devices/${id}/`, data);
    return response.data;
  },

  deleteDevice: async (id: string): Promise<void> => {
    await staffApi.delete(`attendance-devices/${id}/`);
  },

  // --- Attendance ---
  getAttendance: async (params?: Record<string, any>): Promise<StaffAttendance[]> => {
    const response = await staffApi.get<StaffAttendance[]>('attendance/', { params });
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

  deleteAttendance: async (id: string): Promise<void> => {
    await staffApi.delete(`attendance/${id}/`);
  },

  // --- Biometric Punches ---
  getPunches: async (params?: Record<string, any>): Promise<BiometricPunch[]> => {
    const response = await staffApi.get<BiometricPunch[]>('biometric-punches/', { params });
    return response.data;
  },

  createPunch: async (data: Partial<BiometricPunch>): Promise<BiometricPunch> => {
    const response = await staffApi.post<BiometricPunch>('biometric-punches/', data);
    return response.data;
  },

  getPunchById: async (id: string): Promise<BiometricPunch> => {
    const response = await staffApi.get<BiometricPunch>(`biometric-punches/${id}/`);
    return response.data;
  },

  updatePunch: async (id: string, data: Partial<BiometricPunch>): Promise<BiometricPunch> => {
    const response = await staffApi.patch<BiometricPunch>(`biometric-punches/${id}/`, data);
    return response.data;
  },

  deletePunch: async (id: string): Promise<void> => {
    await staffApi.delete(`biometric-punches/${id}/`);
  },

  // --- Actions ---
  /**
   * Syncs attendance from a specific device. 
   * This is a two-phase operation on the backend: 
   * 1. Pull (fetch raw punches)
   * 2. Process (convert punches to Attendance records)
   */
  syncDevice: async (id: string): Promise<SyncDeviceResult> => {
    const response = await staffApi.post<SyncDeviceResult>(`attendance-devices/${id}/sync/`);
    return response.data;
  },
};
