import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayrollService } from '../services/payroll.service';
import { PayrollRun, PayrollLine } from '../types/staff';
import toast from 'react-hot-toast';

export const usePayrollRuns = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: payrollRuns, isLoading, error } = useQuery({
    queryKey: ['payrollRuns', filters],
    queryFn: () => PayrollService.getPayrollRuns(filters),
  });

  const createPayrollRun = useMutation({
    mutationFn: (data: Partial<PayrollRun>) => PayrollService.createPayrollRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      toast.success('Payroll run created successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create payroll run'),
  });

  const updatePayrollRun = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<PayrollRun> }) => PayrollService.updatePayrollRun(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll run updated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update payroll run'),
  });

  const deletePayrollRun = useMutation({
    mutationFn: (id: string) => PayrollService.deletePayrollRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      toast.success('Payroll run deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete payroll run'),
  });

  const generatePayrollLines = useMutation({
    mutationFn: (id: string) => PayrollService.generatePayrollLines(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll lines generated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to generate payroll lines'),
  });

  const finalizePayrollRun = useMutation({
    mutationFn: (id: string) => PayrollService.finalizePayrollRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll run finalized');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to finalize payroll run'),
  });

  return {
    payrollRuns,
    isLoading,
    error,
    createPayrollRun: createPayrollRun.mutate,
    isCreating: createPayrollRun.isPending,
    createPayrollRunAsync: createPayrollRun.mutateAsync,
    updatePayrollRun: updatePayrollRun.mutate,
    isUpdating: updatePayrollRun.isPending,
    deletePayrollRun: deletePayrollRun.mutate,
    isDeleting: deletePayrollRun.isPending,
    generatePayrollLines: generatePayrollLines.mutate,
    isGenerating: generatePayrollLines.isPending,
    finalizePayrollRun: finalizePayrollRun.mutate,
    isFinalizing: finalizePayrollRun.isPending,
  };
};

export const usePayrollRunDetails = (id: string) => {
  return useQuery({
    queryKey: ['payrollRunDetails', id],
    queryFn: () => PayrollService.getPayrollRunById(id),
    enabled: !!id,
    staleTime: 1000 * 5, // 5 seconds of freshness
  });
};

export const usePayrollLines = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: payrollLines, isLoading, error } = useQuery({
    queryKey: ['payrollLines', filters],
    queryFn: () => PayrollService.getPayrollLines(filters),
  });

  const markPaid = useMutation({
    mutationFn: ({ id, data }: { id: string, data: { paid_amount?: string | number, payment_note?: string } }) => 
      PayrollService.markLinePaid(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollLines'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      toast.success('Salary marked as paid');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to process payment'),
  });

  return {
    payrollLines,
    isLoading,
    error,
    markPaid: markPaid.mutate,
    isMarkingPaid: markPaid.isPending,
  };
};
