"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, FileText, Trash2, Edit } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useLedger } from '@/src/hooks/useLedger';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffLedgerEntry } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';

export default function LedgerManagement() {
  const [yearFilter, setYearFilter] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  
  const { ledgerData, isLoading, createEntry, isCreating, updateEntry, isUpdating, deleteEntry } = useLedger({
    year: yearFilter || undefined,
    month: monthFilter || undefined,
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
    payroll_period_year: new Date().getFullYear(),
    payroll_period_month: new Date().getMonth() + 1,
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
         staff: staffFilter || '', 
         entry_date: new Date().toISOString().split('T')[0], 
         entry_type: 'advance', 
         direction: 'debit', 
         amount: '', 
         note: '', 
         payroll_period_year: new Date().getFullYear(), 
         payroll_period_month: new Date().getMonth() + 1
       });
    }
    setIsAddModalOpen(true);
  };

  const handleSaveEntry = () => {
    if (!formData.staff || !formData.entry_date || !formData.entry_type || !formData.amount || !formData.direction) {
      toast.error('Please fill required fields (Staff, Date, Type, Amount, Direction)');
      return;
    }

    if (editingLedgerId) {
      updateEntry({ id: editingLedgerId, data: formData }, {
        onSuccess: () => setIsAddModalOpen(false)
      });
    } else {
      createEntry(formData, {
        onSuccess: () => {
          setIsAddModalOpen(false);
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
      render: (v: string) => <span className="text-xs font-medium text-slate-500">{v}</span>
    },
    { 
      key: 'staff', 
      header: 'STAFF',
      render: (_: any, row: StaffLedgerEntry) => (
        <span className="font-bold text-slate-900 text-sm">{row.staff_name || 'Individual Staff'}</span>
      )
    },
    { 
      key: 'entry_type', 
      header: 'TYPE',
      render: (v: string, row: StaffLedgerEntry) => (
        <span className="text-sm text-slate-700">{row.entry_type_display || v.replace('_', ' ')}</span>
      )
    },
    { 
      key: 'direction', 
      header: 'DIRECTION',
      render: (v: string) => (
        <Badge variant={v === 'credit' ? 'success' : 'error'} size="sm" className="font-bold uppercase tracking-widest text-[9px] px-3 py-0.5 rounded-full border-none">
          {v === 'credit' ? 'Credit' : 'Debit'}
        </Badge>
      )
    },
    { 
      key: 'amount', 
      header: 'AMOUNT',
      render: (v: string, row: StaffLedgerEntry) => (
        <span className={`font-bold text-sm ${row.direction === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
          {formatCurrency(v)}
        </span>
      )
    },
    {
      key: 'period',
      header: 'PERIOD',
      render: (_: any, row: StaffLedgerEntry) => (
        <span className="text-sm text-slate-600 font-medium">
          {row.payroll_period_month ? `${row.payroll_period_month}/${row.payroll_period_year}` : '—'}
        </span>
      )
    },
    {
        key: 'note',
        header: 'NOTE',
        render: (v: string) => <span className="text-sm text-slate-400 max-w-[200px] truncate block">{v || '—'}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffLedgerEntry) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-sm"
            onClick={() => handleOpenLedgerModal(row)}
          >
            Edit
          </button>
          <button 
             onClick={() => { if(window.confirm('Are you sure you want to delete this ledger entry?')) deleteEntry(row.id) }} 
             className="p-1.5 text-slate-400 hover:text-red-500 transition-all"
           >
             <Trash2 className="w-4 h-4" />
           </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in -m-6 p-6 min-h-screen bg-[#f4f6f8] font-sans text-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ledger Entries</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
             <span className="text-sm font-bold text-slate-800 mr-2">Ledger Entries</span>
             <Select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 w-48 h-9 text-sm font-medium"
                options={[
                  { value: '', label: 'All Staff' },
                  ...(membersResponse || []).map(m => ({ value: m.id, label: m.full_name }))
                ]}
              />
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 w-40 h-9 text-sm font-medium"
                options={[
                  { value: '', label: 'All Types' },
                  ...entryTypes
                ]}
              />
              <Input 
                placeholder="Year"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-20 h-9 text-sm border-slate-200"
              />
              <Input 
                placeholder="Month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-20 h-9 text-sm border-slate-200"
              />
          </div>
          <button 
            onClick={() => handleOpenLedgerModal()}
            className="bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center rounded-lg px-4 h-9 text-sm font-bold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-2 text-white" />
            Add Entry
          </button>
        </div>
        
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-40">
              <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
            </div>
          ) : !ledgerData || ledgerData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-3">
              <FileText className="w-12 h-12 text-slate-200"/>
              <p className="text-slate-500 font-medium text-sm">No ledger entries found.</p>
            </div>
          ) : (
            <Table columns={columns} data={ledgerData || []} className="border-none" />
          )}
        </div>
      </div>
      
      <Modal theme="light"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Ledger Entry"
        size="md"
        footer={
          <div className="flex gap-3 mt-4 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-bold px-8">Cancel</Button>
            <Button 
               variant="primary" 
               onClick={handleSaveEntry} 
               isLoading={isCreating || isUpdating}
               className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11"
            >
              Save Entry
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4">
          <Select 
              label="STAFF MEMBER *" 
              value={formData.staff as string}
              onChange={(e) => setFormData({...formData, staff: e.target.value})}
              options={[
                { value: '', label: '--- select ---' },
                ...(membersResponse || []).map(m => ({ value: m.id, label: m.full_name }))
              ]} 
              disabled={!!editingLedgerId}
              className="bg-white border-slate-200 text-slate-900"
           />

          <div className="grid grid-cols-2 gap-5">
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
                { value: 'credit', label: 'Credit (adds to salary)' },
              ]}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
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

          <div className="grid grid-cols-2 gap-5">
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
