import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PayrollService, PayrollRunFilters, PayrollLineFilters, PayrollRunWriteBody } from '../services/payroll.service';
import { PayrollRun, PayrollLine } from '../types/staff';
import toast from 'react-hot-toast';

// ─── Payroll Runs ──────────────────────────────────────────────────
// Swagger filters: month, year, status (draft|finalized|paid)
export const usePayrollRuns = (filters?: PayrollRunFilters) => {
  const queryClient = useQueryClient();

  const { data: payrollRuns, isLoading, error } = useQuery({
    queryKey: ['payrollRuns', filters],
    queryFn: () => PayrollService.getPayrollRuns(filters),
  });

  const createPayrollRun = useMutation({
    mutationFn: (data: PayrollRunWriteBody) => PayrollService.createPayrollRun(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      toast.success('Payroll run created. Click "Recalculate Lines" to populate it.');
    },
    onError: (err: any) => {
      const data = err.response?.data;
      const msg = data?.detail
        || data?.non_field_errors?.[0]
        || (typeof data === 'object' ? Object.values(data)[0] : null)
        || 'Failed to create payroll run';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const updatePayrollRun = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PayrollRunWriteBody> }) =>
      PayrollService.updatePayrollRun(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll run updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update payroll run'),
  });

  const deletePayrollRun = useMutation({
    mutationFn: (id: string) => PayrollService.deletePayrollRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      toast.success('Payroll run deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Only draft runs can be deleted'),
  });

  const generatePayrollLines = useMutation({
    mutationFn: (id: string) => PayrollService.generatePayrollLines(id),
    onSuccess: (lines) => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success(`Generated ${lines.length} payroll line(s) from ledger & attendance data`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.error || 'Failed to generate lines';
      toast.error(msg); // 400 = run is not in draft
    },
  });

  const finalizePayrollRun = useMutation({
    mutationFn: (id: string) => PayrollService.finalizePayrollRun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Payroll run finalized. Lines can now be marked as paid.');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to finalize — run must be in draft status';
      toast.error(msg); // 400 = not in draft
    },
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

// ─── Payroll Run Detail (with nested lines) ────────────────────────
export const usePayrollRunDetails = (id: string) => {
  return useQuery({
    queryKey: ['payrollRunDetails', id],
    queryFn: () => PayrollService.getPayrollRunById(id),
    enabled: !!id,
    staleTime: 5000,
  });
};

// ─── Payroll Lines ─────────────────────────────────────────────────
// Swagger filters: is_paid, payroll_run (UUID), staff (UUID)
export const usePayrollLines = (filters?: PayrollLineFilters) => {
  const queryClient = useQueryClient();

  const { data: payrollLines, isLoading, error } = useQuery({
    queryKey: ['payrollLines', filters],
    queryFn: () => PayrollService.getPayrollLines(filters),
    enabled: !!filters?.payroll_run || !filters, // skip if no run id
  });

  const markPaid = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { paid_amount?: string | number; payment_note?: string } }) =>
      PayrollService.markLinePaid(id, data),
    onSuccess: (line) => {
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollLines'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['staffLedgerSummary'] });
      toast.success(`Payment recorded for ${(line as any).staff_name || 'staff member'}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to mark as paid — run must be finalized';
      toast.error(msg);
    },
  });

  return {
    payrollLines,
    isLoading,
    error,
    markPaid: markPaid.mutate,
    isMarkingPaid: markPaid.isPending,
  };
};
