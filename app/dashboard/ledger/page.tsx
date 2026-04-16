"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, ArrowUpRight, ArrowDownRight, FileText, Trash2, Edit, Filter, Search, Calendar, User, CreditCard } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useLedger } from '@/src/hooks/useLedger';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffLedgerEntry } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';

export default function LedgerManagement() {
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
      render: (v: string) => <span className="text-[11px] font-black text-white uppercase tracking-tighter opacity-80">{v}</span>
    },
    { 
      key: 'staff', 
      header: 'STAFF MEMBER',
      render: (_: any, row: StaffLedgerEntry) => (
        <span className="font-black text-white text-sm uppercase tracking-tighter drop-shadow-sm">{row.staff_name || 'Individual Staff'}</span>
      )
    },
    { 
      key: 'entry_type', 
      header: 'ENTRY TYPE',
      render: (v: string, row: StaffLedgerEntry) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-white uppercase tracking-[0.1em]">{row.entry_type_display || v.replace('_', ' ')}</span>
          <span className="text-[9px] font-bold text-tertiary uppercase tracking-widest opacity-60">
            Cycle: {row.payroll_period_month}/{row.payroll_period_year}
          </span>
        </div>
      )
    },
    { 
      key: 'direction', 
      header: 'FINANCIAL STATE',
      render: (v: string) => (
        <Badge variant={v === 'credit' ? 'success' : 'error'} size="sm" className="font-black uppercase tracking-widest text-[9px] border-none px-4">
          {v === 'credit' ? 'Inward / Credit' : 'Outward / Debit'}
        </Badge>
      )
    },
    { 
      key: 'amount', 
      header: 'VALUE',
      render: (v: string, row: StaffLedgerEntry) => (
        <span className={`font-black text-sm whitespace-nowrap px-3 py-1 rounded-lg border ${row.direction === 'credit' ? 'text-success bg-success/5 border-success/10' : 'text-error bg-error/5 border-error/10'}`}>
          {row.direction === 'credit' ? '+' : '-'}{formatCurrency(v)}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffLedgerEntry) => (
        <div className="flex items-center justify-end gap-3">
          <button 
            className="p-2 border border-base bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all group"
            onClick={() => handleOpenLedgerModal(row)}
          >
            <Edit className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </button>
          <button 
             onClick={() => { if(window.confirm('Are you sure you want to delete this ledger entry?')) deleteEntry(row.id) }} 
             className="p-2 border border-base bg-white/5 hover:bg-error/20 hover:border-error/50 text-tertiary hover:text-white rounded-xl transition-all"
           >
             <Trash2 className="w-3.5 h-3.5" />
           </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Staff Ledger</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Financial audit trail for all staff movements</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => handleOpenLedgerModal()}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-8"
        >
          <Plus className="w-5 h-5 mr-3" />
          Post New Entry
        </Button>
      </div>

      <div className="bg-secondary border border-base rounded-[2rem] p-6 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
           <div className="md:col-span-4 flex flex-col gap-2">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Staff Member</label>
              <Select
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="bg-bg-main border-base h-12"
                options={[
                  { value: '', label: 'VIEW ALL STAFF' },
                  ...(membersResponse?.results || []).map(m => ({ value: m.id, label: m.full_name }))
                ]}
              />
           </div>
           <div className="md:col-span-3 flex flex-col gap-2">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Inflow/Outflow</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setDirectionFilter(directionFilter === 'debit' ? '' : 'debit')}
                  className={`h-12 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${directionFilter === 'debit' ? 'bg-error border-error text-white shadow-glow-error' : 'bg-bg-main border-base text-tertiary hover:text-white'}`}
                >
                  Debits
                </button>
                <button 
                  onClick={() => setDirectionFilter(directionFilter === 'credit' ? '' : 'credit')}
                  className={`h-12 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${directionFilter === 'credit' ? 'bg-success border-success text-white shadow-glow-success' : 'bg-bg-main border-base text-tertiary hover:text-white'}`}
                >
                  Credits
                </button>
              </div>
           </div>
           <div className="md:col-span-5 flex flex-col gap-2">
              <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-1">Category / Type</label>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-bg-main border-base h-12"
                options={[
                  { value: '', label: 'ALL FINANCIAL TYPES' },
                  ...entryTypes
                ]}
              />
           </div>
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="text-tertiary font-black uppercase tracking-[0.2em] text-xs text-center">Reading Ledger Tapes...</p>
          </div>
        ) : !ledgerData || ledgerData.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="p-6 bg-white/5 rounded-full"><FileText className="w-12 h-12 text-tertiary opacity-30"/></div>
            <p className="text-tertiary font-black uppercase tracking-widest text-xs">No records found for the active scope</p>
          </div>
        ) : (
          <Table columns={columns} data={ledgerData || []} className="text-sm border-none" />
        )}
      </Card>
      
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingLedgerId ? "Modify Audit Record" : "Post New Ledger Entry"}
        size="lg"
        footer={
          <div className="flex gap-3 mt-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)} className="flex-1 sm:flex-none uppercase tracking-widest font-black text-[10px]">Cancel</Button>
            <Button 
               variant="primary" 
               onClick={handleSaveEntry} 
               isLoading={isCreating || isUpdating}
               className="flex-1 sm:flex-none px-12 shadow-glow-primary font-black uppercase text-[10px] tracking-widest"
            >
              {editingLedgerId ? "Overwrite Record" : "Commit to General Ledger"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <Select 
              label="TARGET STAFF MEMBER *" 
              value={formData.staff as string}
              onChange={(e) => setFormData({...formData, staff: e.target.value})}
              options={[
                { value: '', label: '--- SELECT RECIPIENT ---' },
                ...(membersResponse?.results || []).map(m => ({ value: m.id, label: m.full_name }))
              ]} 
              disabled={!!editingLedgerId}
              className="bg-bg-main border-base text-white h-14 font-black uppercase tracking-tighter"
           />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select 
              label="TRANSACTION CATEGORY *" 
              value={formData.entry_type}
              onChange={(e) => {
                const type = e.target.value as any;
                let dir = formData.direction;
                if (['advance', 'late_penalty', 'meal_deduction', 'deduction'].includes(type)) dir = 'debit';
                if (['bonus', 'reimbursement'].includes(type)) dir = 'credit';
                setFormData({...formData, entry_type: type, direction: dir});
              }}
              options={entryTypes.filter(e => e.value !== 'salary_payment')} 
              className="bg-bg-main border-base text-white"
            />
            <Select 
              label="DIRECTION / POLARITY *" 
              value={formData.direction}
              onChange={(e) => setFormData({...formData, direction: e.target.value as any})}
              options={[
                { value: 'debit', label: 'DEBIT (Removes from Pay)' },
                { value: 'credit', label: 'CREDIT (Adds to Pay)' },
              ]}
              className="bg-bg-main border-base text-white font-black"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="CURRENCY VALUE (PKR) *" type="number"
                placeholder="0.00"
                value={formData.amount as string}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="bg-bg-main border-base text-white text-xl font-black h-14"
              />
              <Input 
                label="RECORDING DATE *" type="date"
                value={formData.entry_date}
                onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                className="bg-bg-main border-base text-white"
              />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input 
                label="PAYROLL CYCLE YEAR" type="number"
                placeholder="2026"
                value={formData.payroll_period_year?.toString() || ''}
                onChange={(e) => setFormData({...formData, payroll_period_year: parseInt(e.target.value) || null})}
                className="bg-bg-main border-base text-white"
              />
              <Select 
                label="PAYROLL CYCLE MONTH"
                value={formData.payroll_period_month?.toString() || ''}
                onChange={(e) => setFormData({...formData, payroll_period_month: parseInt(e.target.value) || null})}
                className="bg-bg-main border-base text-white"
                options={[
                  { value: '', label: 'NOT ASSIGNED' },
                  { value: '1', label: 'January' },
                  { value: '2', label: 'February' },
                  { value: '3', label: 'March' },
                  { value: '4', label: 'April' },
                  { value: '5', label: 'May' },
                  { value: '6', label: 'June' },
                  { value: '7', label: 'July' },
                  { value: '8', label: 'August' },
                  { value: '9', label: 'September' },
                  { value: '10', label: 'October' },
                  { value: '11', label: 'November' },
                  { value: '12', label: 'December' },
                ]}
              />
          </div>

          <Input 
            label="TRANSACTION AUDIT NOTE"
            value={formData.note || ''}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            placeholder="Describe the nature of this transaction..."
            className="bg-bg-main border-base text-white"
          />
        </div>
      </Modal>
    </div>
  );
}
