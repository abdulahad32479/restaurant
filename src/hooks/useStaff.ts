import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffService } from '../services/staff.service';
import { StaffMember, StaffRole } from '../types/staff';
import toast from 'react-hot-toast';

export const useStaff = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: membersResponse, isLoading: isLoadingMembers, error: membersError } = useQuery({
    queryKey: ['staffMembers', filters],
    queryFn: () => StaffService.getStaffMembers(filters),
  });

  const createMemberMutation = useMutation({
    mutationFn: (data: Partial<StaffMember>) => StaffService.createStaffMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
      toast.success('Staff member created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create staff member');
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffMember> }) => 
      StaffService.updateStaffMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
      toast.success('Staff member updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update staff member');
    },
  });

  return {
    membersResponse,
    isLoadingMembers,
    membersError,
    createMember: createMemberMutation.mutate,
    isCreatingMember: createMemberMutation.isPending,
    createMemberAsync: createMemberMutation.mutateAsync,
    updateMember: updateMemberMutation.mutate,
    isUpdatingMember: updateMemberMutation.isPending,
    updateMemberAsync: updateMemberMutation.mutateAsync,
  };
};

export const useRoles = () => {
  const queryClient = useQueryClient();

  const { data: roles, isLoading: isLoadingRoles, error: rolesError } = useQuery({
    queryKey: ['staffRoles'],
    queryFn: () => StaffService.getRoles(),
  });

  const createRoleMutation = useMutation({
    mutationFn: (data: Partial<StaffRole>) => StaffService.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRoles'] });
      toast.success('Role created successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to create role';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          // Flatten Django field errors: {"name": ["already exists"]} -> "name: already exists"
          const errors = Object.entries(error.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
          if (errors) errorMessage = errors;
        }
      }
      toast.error(errorMessage);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffRole> }) => 
      StaffService.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staffRoles'] });
      toast.success('Role updated successfully');
    },
    onError: (error: any) => {
      let errorMessage = 'Failed to update role';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else {
          const errors = Object.entries(error.response.data)
            .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ');
          if (errors) errorMessage = errors;
        }
      }
      toast.error(errorMessage);
    },
  });

  return {
    roles,
    isLoadingRoles,
    rolesError,
    createRole: createRoleMutation.mutate,
    isCreatingRole: createRoleMutation.isPending,
    updateRole: updateRoleMutation.mutate,
    isUpdatingRole: updateRoleMutation.isPending,
  };
};

export const useStaffMember = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['staffMember', id],
    queryFn: () => StaffService.getStaffMemberById(id),
    enabled: !!id && enabled,
  });
};
