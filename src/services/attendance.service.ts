import { staffApi } from './api';
import { 
  StaffAttendance, 
  AttendanceDevice, 
  SyncDeviceResult,
  BiometricPunch
} from '../types/staff';

// ─── Attendance Devices ────────────────────────────────────────────
// No query filters on the list endpoint per Swagger
export interface DeviceWriteBody {
  name: string;
  device_type: 'biometric' | 'manual';
  ip_address?: string;
  port?: number;       // default 4370 for ZKTeco
  machine_identifier?: string;
  api_url?: string;
  is_active?: boolean;
}

// ─── Attendance Records ────────────────────────────────────────────
// Swagger: date (YYYY-MM-DD), month (1-12), staff (UUID), status, year
export interface AttendanceFilters {
  date?: string;         // YYYY-MM-DD exact date
  month?: number;        // 1–12
  year?: number;
  staff?: string;        // UUID
  status?: 'absent' | 'half_day' | 'leave' | 'present';
}

// ─── Biometric Punches ─────────────────────────────────────────────
// Swagger: biometric_code, date (YYYY-MM-DD), is_processed, punch_type
export interface PunchFilters {
  biometric_code?: string;
  date?: string;          // YYYY-MM-DD
  is_processed?: boolean;
  punch_type?: 'in' | 'out' | 'unknown';
}

export const AttendanceService = {
  // ─── Attendance Devices ──────────────────────────────────────────
  // GET  /api/v1/staff/attendance-devices/
  getDevices: async (): Promise<AttendanceDevice[]> => {
    const response = await staffApi.get<AttendanceDevice[]>('attendance-devices/');
    return response.data;
  },

  // GET  /api/v1/staff/attendance-devices/{id}/
  getDeviceById: async (id: string): Promise<AttendanceDevice> => {
    const response = await staffApi.get<AttendanceDevice>(`attendance-devices/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/attendance-devices/
  // branch is auto-set; ZKTeco: device_type=biometric, port defaults to 4370
  createDevice: async (data: DeviceWriteBody): Promise<AttendanceDevice> => {
    const response = await staffApi.post<AttendanceDevice>('attendance-devices/', data);
    return response.data;
  },

  // PATCH /api/v1/staff/attendance-devices/{id}/
  updateDevice: async (id: string, data: Partial<DeviceWriteBody>): Promise<AttendanceDevice> => {
    const response = await staffApi.patch<AttendanceDevice>(`attendance-devices/${id}/`, data);
    return response.data;
  },

  // PUT  /api/v1/staff/attendance-devices/{id}/
  replaceDevice: async (id: string, data: DeviceWriteBody): Promise<AttendanceDevice> => {
    const response = await staffApi.put<AttendanceDevice>(`attendance-devices/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/attendance-devices/{id}/
  deleteDevice: async (id: string): Promise<void> => {
    await staffApi.delete(`attendance-devices/${id}/`);
  },

  // POST /api/v1/staff/attendance-devices/{id}/sync/
  // Two-phase: 1) Pull raw punches from ZKTeco via TCP/IP (pyzk)
  //            2) Process punches → StaffAttendance rows
  // Device must be is_active=true and reachable. Requires biometric_code on staff member.
  syncDevice: async (id: string): Promise<SyncDeviceResult> => {
    const response = await staffApi.post<SyncDeviceResult>(`attendance-devices/${id}/sync/`);
    return response.data;
  },

  // ─── Staff Attendance Records ────────────────────────────────────
  // GET  /api/v1/staff/attendance/
  // Filters (exact Swagger): date, month, staff (UUID), status, year
  getAttendance: async (params?: AttendanceFilters): Promise<StaffAttendance[]> => {
    // Remove empty-string values before sending to backend
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
      : undefined;
    const response = await staffApi.get<StaffAttendance[]>('attendance/', { params: cleanParams });
    return response.data;
  },

  // GET  /api/v1/staff/attendance/{id}/
  getAttendanceById: async (id: string): Promise<StaffAttendance> => {
    const response = await staffApi.get<StaffAttendance>(`attendance/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/attendance/
  // Required: staff (UUID), date (YYYY-MM-DD), status
  // Optional: check_in, check_out (ISO datetime), late_minutes, early_leave_minutes, source, note
  // Unique constraint: (staff, date) — 400 on duplicate
  // created_by is auto-set by backend
  createManualAttendance: async (data: Partial<StaffAttendance>): Promise<StaffAttendance> => {
    const response = await staffApi.post<StaffAttendance>('attendance/', data);
    return response.data;
  },

  // PATCH /api/v1/staff/attendance/{id}/
  // updated_by is auto-set by backend
  updateAttendance: async (id: string, data: Partial<StaffAttendance>): Promise<StaffAttendance> => {
    const response = await staffApi.patch<StaffAttendance>(`attendance/${id}/`, data);
    return response.data;
  },

  // PUT  /api/v1/staff/attendance/{id}/
  replaceAttendance: async (id: string, data: Partial<StaffAttendance>): Promise<StaffAttendance> => {
    const response = await staffApi.put<StaffAttendance>(`attendance/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/attendance/{id}/
  deleteAttendance: async (id: string): Promise<void> => {
    await staffApi.delete(`attendance/${id}/`);
  },

  // ─── Biometric Punches ────────────────────────────────────────────
  // GET  /api/v1/staff/biometric-punches/
  // Filters (exact Swagger): biometric_code, date (YYYY-MM-DD), is_processed, punch_type
  getPunches: async (params?: PunchFilters): Promise<BiometricPunch[]> => {
    const cleanParams = params
      ? Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
      : undefined;
    const response = await staffApi.get<BiometricPunch[]>('biometric-punches/', { params: cleanParams });
    return response.data;
  },

  // GET  /api/v1/staff/biometric-punches/{id}/
  getPunchById: async (id: string): Promise<BiometricPunch> => {
    const response = await staffApi.get<BiometricPunch>(`biometric-punches/${id}/`);
    return response.data;
  },

  // POST /api/v1/staff/biometric-punches/
  // Required: device (UUID), biometric_code, punch_time (ISO), punch_type, source
  // branch is auto-set by backend
  createPunch: async (data: Partial<BiometricPunch>): Promise<BiometricPunch> => {
    const response = await staffApi.post<BiometricPunch>('biometric-punches/', data);
    return response.data;
  },

  // PATCH /api/v1/staff/biometric-punches/{id}/
  updatePunch: async (id: string, data: Partial<BiometricPunch>): Promise<BiometricPunch> => {
    const response = await staffApi.patch<BiometricPunch>(`biometric-punches/${id}/`, data);
    return response.data;
  },

  // PUT  /api/v1/staff/biometric-punches/{id}/
  replacePunch: async (id: string, data: Partial<BiometricPunch>): Promise<BiometricPunch> => {
    const response = await staffApi.put<BiometricPunch>(`biometric-punches/${id}/`, data);
    return response.data;
  },

  // DELETE /api/v1/staff/biometric-punches/{id}/
  deletePunch: async (id: string): Promise<void> => {
    await staffApi.delete(`biometric-punches/${id}/`);
  },
};
