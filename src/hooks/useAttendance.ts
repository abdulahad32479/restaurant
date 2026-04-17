import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceService, AttendanceFilters, PunchFilters } from '../services/attendance.service';
import { StaffAttendance, AttendanceDevice, BiometricPunch } from '../types/staff';
import toast from 'react-hot-toast';

// ─── Attendance Records ────────────────────────────────────────────
export const useAttendance = (filters?: AttendanceFilters) => {
  const queryClient = useQueryClient();

  const { data: attendanceData, isLoading, error } = useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => AttendanceService.getAttendance(filters),
  });

  const createAttendance = useMutation({
    mutationFn: (data: Partial<StaffAttendance>) => AttendanceService.createManualAttendance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || Object.values(err.response?.data || {})[0] || 'Failed to record attendance'),
  });

  const updateAttendance = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffAttendance> }) =>
      AttendanceService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update attendance'),
  });

  const deleteAttendance = useMutation({
    mutationFn: (id: string) => AttendanceService.deleteAttendance(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance record deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete attendance'),
  });

  return {
    attendanceData,
    isLoading,
    error,
    createAttendance: createAttendance.mutate,
    isCreating: createAttendance.isPending,
    updateAttendance: updateAttendance.mutate,
    isUpdating: updateAttendance.isPending,
    deleteAttendance: deleteAttendance.mutate,
    isDeleting: deleteAttendance.isPending,
  };
};

// ─── Attendance Devices ────────────────────────────────────────────
export const useDevices = () => {
  const queryClient = useQueryClient();

  const { data: devicesData, isLoading, error } = useQuery({
    queryKey: ['devices'],
    queryFn: () => AttendanceService.getDevices(),
  });

  const createDevice = useMutation({
    mutationFn: (data: Partial<AttendanceDevice>) => AttendanceService.createDevice(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device registered successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to register device'),
  });

  const updateDevice = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AttendanceDevice> }) =>
      AttendanceService.updateDevice(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update device'),
  });

  const deleteDevice = useMutation({
    mutationFn: (id: string) => AttendanceService.deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete device'),
  });

  return {
    devicesData,
    isLoading,
    error,
    createDevice: createDevice.mutate,
    isCreatingDevice: createDevice.isPending,
    updateDevice: updateDevice.mutate,
    isUpdatingDevice: updateDevice.isPending,
    deleteDevice: deleteDevice.mutate,
    isDeletingDevice: deleteDevice.isPending,
  };
};

// ─── Biometric Sync Action ─────────────────────────────────────────
export const useBiometricActions = () => {
  const queryClient = useQueryClient();

  const syncDevice = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.syncDevice(deviceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success(
        `${data.device} — Pulled ${data.pull.created} new punch(es), ` +
        `${data.process.processed} processed, ${data.process.skipped_unmatched} unmatched`,
        { duration: 6000 }
      );
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Device sync failed';
      toast.error(msg, { duration: 5000 });
    },
  });

  return {
    syncDevice: syncDevice.mutate,
    isSyncing: syncDevice.isPending,
    syncingDeviceId: syncDevice.variables,
  };
};

// ─── Biometric Punches ─────────────────────────────────────────────
// Filters: biometric_code, date (YYYY-MM-DD), is_processed, punch_type
export const usePunches = (filters?: PunchFilters) => {
  const queryClient = useQueryClient();

  const { data: punchesData, isLoading, error } = useQuery({
    queryKey: ['punches', filters],
    queryFn: () => AttendanceService.getPunches(filters),
  });

  const createPunch = useMutation({
    mutationFn: (data: Partial<BiometricPunch>) => AttendanceService.createPunch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      toast.success('Punch recorded manually');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to record punch'),
  });

  const updatePunch = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<BiometricPunch> }) =>
      AttendanceService.updatePunch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      toast.success('Punch updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update punch'),
  });

  const deletePunch = useMutation({
    mutationFn: (id: string) => AttendanceService.deletePunch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      toast.success('Punch deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete punch'),
  });

  return {
    punchesData,
    isLoading,
    error,
    createPunch: createPunch.mutate,
    isCreatingPunch: createPunch.isPending,
    updatePunch: updatePunch.mutate,
    isUpdatingPunch: updatePunch.isPending,
    deletePunch: deletePunch.mutate,
    isDeletingPunch: deletePunch.isPending,
  };
};
