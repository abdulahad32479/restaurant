import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceService } from '../services/attendance.service';
import { StaffAttendance, AttendanceDevice } from '../types/staff';
import toast from 'react-hot-toast';

export const useAttendance = (filters?: Record<string, any>) => {
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
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to record attendance'),
  });

  const updateAttendance = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<StaffAttendance> }) => AttendanceService.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update attendance'),
  });

  return {
    attendanceData,
    isLoading,
    error,
    createAttendance: createAttendance.mutate,
    isCreating: createAttendance.isPending,
    updateAttendance: updateAttendance.mutate,
    isUpdating: updateAttendance.isPending,
  };
};

export const useDevices = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: devicesData, isLoading, error } = useQuery({
    queryKey: ['devices', filters],
    queryFn: () => AttendanceService.getDevices(filters),
  });

  const createDevice = useMutation({
    mutationFn: (data: Partial<AttendanceDevice>) => AttendanceService.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device added successfully');
    },
    onError: () => toast.error('Failed to add device'),
  });

  const updateDevice = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<AttendanceDevice> }) => AttendanceService.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device updated successfully');
    },
    onError: () => toast.error('Failed to update device'),
  });

  return {
    devicesData,
    isLoading,
    error,
    createDevice: createDevice.mutate,
    isCreatingDevice: createDevice.isPending,
    updateDevice: updateDevice.mutate,
    isUpdatingDevice: updateDevice.isPending,
  };
};

export const useBiometricActions = () => {
  const queryClient = useQueryClient();

  const syncDevice = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.syncDevice(deviceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      toast.success(`Synced! Created ${data.created_count}, Unmatched: ${data.unmatched_count}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to sync device'),
  });

  const processAttendance = useMutation({
    mutationFn: (date: string) => AttendanceService.processAttendance(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['punches'] });
      toast.success('Attendance processed for date');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to process attendance'),
  });

  return {
    syncDevice: syncDevice.mutate,
    isSyncing: syncDevice.isPending,
    processAttendance: processAttendance.mutate,
    isProcessing: processAttendance.isPending,
  };
};

export const usePunches = (filters?: Record<string, any>) => {
  const { data: punchesData, isLoading, error } = useQuery({
    queryKey: ['punches', filters],
    queryFn: () => AttendanceService.getPunches(filters),
  });

  return {
    punchesData,
    isLoading,
    error,
  };
};
