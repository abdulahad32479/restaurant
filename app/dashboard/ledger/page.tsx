"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useLedger } from '@/src/hooks/useLedger';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffLedgerEntry } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';

export default function LedgerManagement() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  
  const { ledgerData, isLoading, createEntry, isCreating, updateEntry, isUpdating } = useLedger({
    page,
    page_size: 20,
    start_date: startDate,
    end_date: endDate,
    entry_type: typeFilter || undefined,
    direction: directionFilter || undefined,
    staff: staffFilter || undefined,
  });

  const { membersResponse } = useStaff({ is_active: true });

  const [formData, setFormData] = useState<Partial<StaffLedgerEntry>>({
    staff: '',
    entry_date: new Date().toISOString().split('T')[0],
    entry_type: 'advance',
    direction: 'debit',
    amount: '',
    note: '',
    payroll_period_year: null,
    payroll_period_month: null,
  });

  const handleOpenLedgerModal = (entry?: StaffLedgerEntry) => {
    if (entry) {
       setEditingLedgerId(entry.id);
       setFormData({
          staff: entry.staff,
          entry_date: entry.entry_date,
          entry_type: entry.entry_type,
          direction: entry.direction,
          amount: entry.amount.toString(),
          note: entry.note || '',
          payroll_period_year: entry.payroll_period_year || null,
          payroll_period_month: entry.payroll_period_month || null
       });
    } else {
       setEditingLedgerId(null);
       setFormData({
         staff: '', entry_date: new Date().toISOString().split('T')[0], entry_type: 'advance', direction: 'debit', amount: '', note: '', payroll_period_year: null, payroll_period_month: null
       });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = () => {
    if (!formData.staff || !formData.entry_date || !formData.entry_type || !formData.amount || !formData.direction) {
      toast.error('Please fill required fields (Staff, Date, Type, amount, direction)');
      return;
    }

    if (editingLedgerId) {
      updateEntry({ id: editingLedgerId, data: formData }, {
        onSuccess: () => {
          setIsAddModalOpen(false);
        }
      });
    } else {
      createEntry(formData, {
        onSuccess: () => {
          setIsAddModalOpen(false);
          setFormData({ ...formData, amount: '', note: '', payroll_period_year: null, payroll_period_month: null });
        }
      });
    }
  };

  const entryTypes = [
    { value: 'advance', label: 'Advance' },
    { value: 'late_penalty', label: 'Late Penalty' },
    { value: 'meal_deduction', label: 'Meal Deduction' },
    { value: 'deduction', label: 'Other Deduction' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'reimbursement', label: 'Reimbursement' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'salary_payment', label: 'Salary Payment' }
  ];

  const columns = [
    { 
      key: 'staff', 
      header: 'Staff Member',
      render: (_: any, row: StaffLedgerEntry) => {
        const staffName = membersResponse?.results.find(m => m.id === row.staff)?.full_name || row.staff;
        return <span className="font-bold text-white">{staffName}</span>;
      }
    },
    { 
      key: 'date', 
      header: 'Date',
      render: (_: any, row: StaffLedgerEntry) => <span className="text-tertiary">{row.entry_date}</span>
    },
    { 
      key: 'type', 
      header: 'Entry Type',
      render: (value: string) => {
        const label = entryTypes.find(e => e.value === value)?.label || value;
        return <span className="uppercase text-xs tracking-widest text-[#888]">{label}</span>;
      }
    },
    { 
      key: 'direction', 
      header: 'Type',
      render: (value: string) => (
        <Badge variant={value === 'credit' ? 'success' : 'error'} size="sm" className="uppercase text-[9px] flex items-center gap-1 w-max">
          {value === 'credit' ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
          {value}
        </Badge>
      )
    },
    { 
      key: 'amount', 
      header: 'Amount',
      align: 'right' as const,
      render: (value: string, row: StaffLedgerEntry) => (
        <span className={`font-bold ${row.direction === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
          {row.direction === 'credit' ? '+' : '-'}{formatCurrency(value).replace('PKR ', '')} PKR
        </span>
      )
    },
    { 
      key: 'actions', 
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffLedgerEntry) => (
         <Button variant="secondary" size="sm" onClick={() => handleOpenLedgerModal(row)} className="text-[10px] uppercase tracking-widest">Edit</Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Salary Ledger</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage advances, deductions, and bonuses</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenLedgerModal()}
          className="font-black uppercase tracking-tighter"
        >
          Add Ledger Entry
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-5 gap-4">
        <Select
           label="Staff Member"
           value={staffFilter}
           onChange={(e) => { setStaffFilter(e.target.value); setPage(1); }}
           options={[
             { value: '', label: 'All Staff' },
             ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])
           ]}
        />
        <Input
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
        />
        <Input
          type="date"
          label="End Date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
        />
        <Select
          label="Entry Type"
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Types' },
            ...entryTypes
          ]}
        />
        <Select
          label="Direction"
          value={directionFilter}
          onChange={(e) => { setDirectionFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Directions' },
            { value: 'debit', label: 'Debit (Deduction)' },
            { value: 'credit', label: 'Credit (Addition)' },
          ]}
        />
      </div>
      
      {/* Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : ledgerData?.results?.length === 0 ? (
          <div className="p-10 text-center text-tertiary flex flex-col items-center justify-center space-y-3">
             <FileText className="w-10 h-10 text-tertiary/50" />
             <p>No ledger entries found.</p>
          </div>
        ) : (
          <Table columns={columns} data={ledgerData?.results || []} />
        )}
      </Card>
      
      {/* Pagination */}
      {!isLoading && ledgerData && (
        <div className="flex justify-between items-center text-sm text-tertiary">
          <p>Showing <span className="text-white font-bold">{ledgerData.results.length}</span> of <span className="text-white font-bold">{ledgerData.count}</span> records</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={!ledgerData.previous} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <Button variant="secondary" size="sm" disabled={!ledgerData.next} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingLedgerId ? "Edit Ledger Entry" : "Add Ledger Entry"}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveEntry} isLoading={isCreating || isUpdating}>{editingLedgerId ? "Save Changes" : "Save Entry"}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select 
            label="Staff Member" 
            value={formData.staff as string}
            onChange={(e) => setFormData({...formData, staff: e.target.value})}
            options={[
              { value: '', label: 'Select Staff' },
              ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])
            ]} 
            disabled={!!editingLedgerId}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Date" type="date"
              value={formData.entry_date}
              onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
            />
            <Select 
              label="Entry Type" 
              value={formData.entry_type}
              onChange={(e) => {
                const type = e.target.value as any;
                // Auto-set direction based on type
                let dir = formData.direction;
                if (['advance', 'late_penalty', 'meal_deduction', 'deduction'].includes(type)) dir = 'debit';
                if (['bonus', 'reimbursement'].includes(type)) dir = 'credit';
                setFormData({...formData, entry_type: type, direction: dir});
              }}
              options={entryTypes.filter(e => e.value !== 'salary_payment')} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Select 
                label="Direction (Impact)" 
                value={formData.direction}
                onChange={(e) => setFormData({...formData, direction: e.target.value as any})}
                options={[
                  { value: 'debit', label: 'Debit (Reduces Salary)' },
                  { value: 'credit', label: 'Credit (Increases Salary)' },
                ]}
                disabled={['advance', 'late_penalty', 'meal_deduction', 'deduction', 'bonus', 'reimbursement'].includes(formData.entry_type || '')}
              />
              <Input 
                label="Amount" type="number"
                placeholder="0.00"
                value={formData.amount as string}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
              />
          </div>
          <Input 
            label="Notes (Reason)"
            value={formData.note || ''}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            placeholder="Reason for adjustment..."
          />
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
             <Input 
               label="Payroll Year (Optional)" type="number"
               placeholder="2026"
               value={formData.payroll_period_year?.toString() || ''}
               onChange={(e) => setFormData({...formData, payroll_period_year: parseInt(e.target.value) || null})}
             />
             <Input 
               label="Payroll Month (Optional)" type="number"
               placeholder="3"
               value={formData.payroll_period_month?.toString() || ''}
               onChange={(e) => setFormData({...formData, payroll_period_month: parseInt(e.target.value) || null})}
             />
          </div>
        </div>
      </Modal>
    </div>
  );
}
