import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LedgerService, LedgerEntryFilters } from '../services/ledger.service';
import { StaffLedgerEntry } from '../types/staff';
import toast from 'react-hot-toast';

// ─── Ledger Entries ────────────────────────────────────────────────
// Swagger filters: direction, entry_type, month, staff (UUID), year
export const useLedger = (filters?: LedgerEntryFilters) => {
  const queryClient = useQueryClient();

  const { data: ledgerData, isLoading, error } = useQuery({
    queryKey: ['ledger', filters],
    queryFn: () => LedgerService.getLedgerEntries(filters),
  });

  const createEntry = useMutation({
    mutationFn: (data: Partial<StaffLedgerEntry>) => LedgerService.createLedgerEntry(data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['staffLedgerSummary'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Ledger entry created');
    },
    onError: (err: any) => {
      const data = err.response?.data;
      const msg = data?.detail || (typeof data === 'object' ? Object.values(data)[0] : null) || 'Failed to create entry';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    },
  });

  const updateEntry = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<StaffLedgerEntry> }) =>
      LedgerService.updateLedgerEntry(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['staffLedgerSummary'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Ledger entry updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update entry'),
  });

  const deleteEntry = useMutation({
    mutationFn: (id: string) => LedgerService.deleteLedgerEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['staffLedgerSummary'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRuns'] });
      queryClient.invalidateQueries({ queryKey: ['payrollRunDetails'] });
      toast.success('Ledger entry deleted');
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete entry'),
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
    deleteEntry: deleteEntry.mutate,
    isDeleting: deleteEntry.isPending,
  };
};
