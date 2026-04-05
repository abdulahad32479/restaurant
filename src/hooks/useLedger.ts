import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LedgerService } from '../services/ledger.service';
import { StaffLedgerEntry } from '../types/staff';
import toast from 'react-hot-toast';

export const useLedger = (filters?: Record<string, any>) => {
  const queryClient = useQueryClient();

  const { data: ledgerData, isLoading, error } = useQuery({
    queryKey: ['ledger', filters],
    queryFn: () => LedgerService.getLedgerEntries(filters),
  });

  const createEntry = useMutation({
    mutationFn: (data: Partial<StaffLedgerEntry>) => LedgerService.createLedgerEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Ledger entry created');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create entry'),
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffLedgerEntry> }) => 
      LedgerService.updateLedgerEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Ledger entry updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update entry'),
  });

  return {
    ledgerData,
    isLoading,
    error,
    createEntry: createEntry.mutate,
    isCreating: createEntry.isPending,
    createEntryAsync: createEntry.mutateAsync,
    updateEntry: updateEntry.mutate,
    isUpdating: updateEntry.isPending,
  };
};
