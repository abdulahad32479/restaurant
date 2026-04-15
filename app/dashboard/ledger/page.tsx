"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, FileText, Trash2, Edit } from 'lucide-react';
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
  
  const { ledgerData, isLoading, createEntry, isCreating, updateEntry, isUpdating, deleteEntry } = useLedger({
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
      key: 'entry_date', 
      header: 'DATE',
      render: (v: string) => <span className="text-xs font-bold text-slate-500">{v}</span>
    },
    { 
      key: 'staff', 
      header: 'STAFF',
      render: (_: any, row: StaffLedgerEntry) => (
        <span className="font-black text-slate-900 text-sm group-hover:text-primary transition-colors">{row.staff_name || row.staff}</span>
      )
    },
    { 
      key: 'entry_type', 
      header: 'TYPE',
      render: (v: string, row: StaffLedgerEntry) => (
        <span className="text-xs font-bold text-slate-500">{row.entry_type_display || v}</span>
      )
    },
    { 
      key: 'direction', 
      header: 'DIRECTION',
      render: (v: string) => (
        <Badge variant={v === 'credit' ? 'success' : 'error'} size="sm" className={`font-bold uppercase tracking-widest text-[9px] ${v === 'credit' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} border-none`}>
          {v === 'credit' ? 'Credit' : 'Debit'}
        </Badge>
      )
    },
    { 
      key: 'amount', 
      header: 'AMOUNT',
      render: (v: string, row: StaffLedgerEntry) => (
        <span className={`font-black text-sm whitespace-nowrap ${row.direction === 'credit' ? 'text-success' : 'text-error'}`}>
          {formatCurrency(v)}
        </span>
      )
    },
    { 
      key: 'period', 
      header: 'PERIOD',
      render: (_: any, row: StaffLedgerEntry) => (
        <span className="text-xs font-bold text-slate-400">
          {row.payroll_period_month && row.payroll_period_year ? `${row.payroll_period_month}/${row.payroll_period_year}` : '—'}
        </span>
      )
    },
    { 
      key: 'note', 
      header: 'NOTE',
      render: (v: string) => <span className="text-xs font-medium text-slate-400 truncate max-w-[200px]">{v || '—'}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffLedgerEntry) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all"
            onClick={() => handleOpenLedgerModal(row)}
          >
            Edit
          </button>
          <button 
             onClick={() => { if(window.confirm('Delete this ledger entry?')) deleteEntry(row.id) }} 
             className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-slate-400 hover:text-red-500"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-wrap items-center gap-4">
        <span className="text-sm font-black text-slate-800 uppercase tracking-widest whitespace-nowrap">Ledger Entries</span>
        <div className="flex-1 min-w-[300px] flex gap-3">
          <Select
            value={staffFilter}
            onChange={(e) => { setStaffFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border-slate-200"
            options={[
              { value: '', label: 'All Staff' },
              ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 border-slate-200"
            options={[
              { value: '', label: 'All Types' },
              ...entryTypes
            ]}
          />
        </div>
        <div className="flex items-center gap-3">
           <Input
            placeholder="Year"
            className="bg-slate-50 border-slate-200 w-24"
            type="number"
            value={formData.payroll_period_year?.toString() || ''}
            onChange={(e) => { /* local state update for filter if needed */ }}
          />
          <Input
            placeholder="Month"
            className="bg-slate-50 border-slate-200 w-24"
            type="number"
            value={formData.payroll_period_month?.toString() || ''}
            onChange={(e) => { /* local state update for filter if needed */ }}
          />
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => handleOpenLedgerModal()}
            className="font-black uppercase tracking-tighter shadow-glow-primary px-6"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>
      
      {/* Table Section */}
      <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : ledgerData?.results?.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">No records found for this period.</div>
        ) : (
          <Table columns={columns} data={ledgerData?.results || []} className="text-sm border-none" />
        )}
      </Card>
      
      {/* Pagination Section */}
      {!isLoading && ledgerData && (
        <div className="flex justify-between items-center text-sm font-bold uppercase tracking-widest text-tertiary">
          <p className="text-[10px]">Showing <span className="text-white">{ledgerData.results.length}</span> of <span className="text-white">{ledgerData.count}</span> records</p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!ledgerData.previous} 
              onClick={() => setPage(p => p - 1)}
              className="border-base hover:border-primary/50 text-[10px]"
            >
              Prev
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!ledgerData.next} 
              onClick={() => setPage(p => p + 1)}
              className="border-base hover:border-primary/50 text-[10px]"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Entry Modal Section */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingLedgerId ? "Modify Ledger Entry" : "Create Ledger Entry"}
        size="lg"
        footer={
          <div className="flex gap-3 mt-2 w-full sm:w-auto">
            <Button 
              variant="ghost" 
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 sm:flex-none uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveEntry} 
              isLoading={isCreating || isUpdating}
              className="flex-1 sm:flex-none px-10 shadow-glow-primary"
            >
              {editingLedgerId ? "Save Changes" : "Confirm Entry"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          {/* Assignment Section */}
          <Select 
              label="STAFF MEMBER *" 
              value={formData.staff as string}
              onChange={(e) => setFormData({...formData, staff: e.target.value})}
              options={[
                { value: '', label: '--- select ---' },
                ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])
              ]} 
              disabled={!!editingLedgerId}
              className="bg-white border-slate-200 text-slate-900"
           />

          {/* Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Select 
              label="ENTRY TYPE *" 
              value={formData.entry_type}
              onChange={(e) => {
                const type = e.target.value as any;
                let dir = formData.direction;
                if (['advance', 'late_penalty', 'meal_deduction', 'deduction'].includes(type)) dir = 'debit';
                if (['bonus', 'reimbursement'].includes(type)) dir = 'credit';
                setFormData({...formData, entry_type: type, direction: dir});
              }}
              options={entryTypes.filter(e => e.value !== 'salary_payment')} 
              className="bg-white border-slate-200 text-slate-900"
            />
            <Select 
              label="DIRECTION *" 
              value={formData.direction}
              onChange={(e) => setFormData({...formData, direction: e.target.value as any})}
              options={[
                { value: 'debit', label: 'Debit (reduces salary)' },
                { value: 'credit', label: 'Credit (increases salary)' },
              ]}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input 
                label="AMOUNT *" type="number"
                placeholder="0.00"
                value={formData.amount as string}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="bg-white border-slate-200 text-slate-900"
              />
              <Input 
                label="ENTRY DATE *" type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                className="bg-white border-slate-200 text-slate-900"
              />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Input 
                label="PAYROLL YEAR" type="number"
                placeholder="2026"
                value={formData.payroll_period_year?.toString() || ''}
                onChange={(e) => setFormData({...formData, payroll_period_year: parseInt(e.target.value) || null})}
                className="bg-white border-slate-200 text-slate-900"
              />
              <Input 
                label="PAYROLL MONTH" type="number"
                placeholder="4"
                value={formData.payroll_period_month?.toString() || ''}
                onChange={(e) => setFormData({...formData, payroll_period_month: parseInt(e.target.value) || null})}
                className="bg-white border-slate-200 text-slate-900"
              />
          </div>

          <Input 
            label="NOTE"
            value={formData.note || ''}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            placeholder="Reason / description"
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </Modal>
    </div>
  );
}
