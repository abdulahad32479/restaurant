import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayrollService } from '../services/payroll.service';
import toast from 'react-hot-toast';

export const usePayrollRuns = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: payrollRuns, isLoading, error } = useQuery({
    queryKey: ['payrollRuns', filters],
    queryFn: () => PayrollService.getPayrollRuns(filters),
  });

  const generatePayroll = useMutation({
    mutationFn: ({ year, month }: { year: number, month: number }) => PayrollService.generatePayroll(year, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll generated successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to generate payroll'),
  });

  const finalizePayroll = useMutation({
    mutationFn: (id: string) => PayrollService.finalizePayroll(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll finalized');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to finalize payroll'),
  });

  return {
    payrollRuns,
    isLoading,
    error,
    generatePayroll: generatePayroll.mutate,
    isGenerating: generatePayroll.isPending,
    finalizePayroll: finalizePayroll.mutate,
    isFinalizing: finalizePayroll.isPending,
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
    mutationFn: ({ id, data }: { id: string, data: { paid_amount?: string | number, note?: string } }) => 
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
