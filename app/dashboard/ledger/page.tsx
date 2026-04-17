"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';
import { 
  Plus, Loader2, FileText, Trash2, Edit, TrendingUp, 
  TrendingDown, Wallet, Search, Filter, Calendar, Users, Briefcase, BookOpen
} from 'lucide-react';
import { useLedger } from '@/src/hooks/useLedger';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffLedgerEntry } from '@/src/types/staff';

export default function LedgerManagement() {
  const [filters, setFilters] = useState<Record<string, any>>({
    staff: '',
    entry_type: '',
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
  
  const { ledgerData, isLoading, createEntry, isCreating, updateEntry, isUpdating, deleteEntry } = useLedger(filters);
  const { membersResponse: staffMembers } = useStaff({ is_active: true });

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
         staff: filters.staff || '', 
         entry_date: new Date().toISOString().split('T')[0], 
         entry_type: 'advance', 
         direction: 'debit', 
         amount: '', 
         note: '', 
         payroll_period_year: new Date().getFullYear(), 
         payroll_period_month: new Date().getMonth() + 1
       });
    }
    setIsModalOpen(true);
  };

  const handleSaveEntry = () => {
    if (!formData.staff || !formData.entry_date || !formData.entry_type || !formData.amount || !formData.direction) {
      toast.error('Required fields missing');
      return;
    }

    if (editingLedgerId) {
      updateEntry({ id: editingLedgerId, data: formData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createEntry(formData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const sumEntries = (direction: 'credit' | 'debit') => {
    const data = Array.isArray(ledgerData) ? ledgerData : (ledgerData as any)?.results || [];
    return data.reduce((acc: number, entry: StaffLedgerEntry) => {
      return entry.direction === direction ? acc + parseFloat(entry.amount as any || 0) : acc;
    }, 0);
  };

  const columns = [
    { 
      key: 'entry_date', 
      header: 'RECORD DATE',
      render: (v: string) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v}</span>
    },
    { 
      key: 'staff', 
      header: 'PERSONNEL', 
      render: (_: any, r: StaffLedgerEntry) => (
        <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight">{r.staff_name || '---'}</span>
      )
    },
    { 
      key: 'type', 
      header: 'VALUATION', 
      render: (_: any, r: StaffLedgerEntry) => (
        <span className="text-[#64748b] text-[10px] font-extrabold uppercase tracking-widest">{r.entry_type_display || r.entry_type}</span>
      )
    },
    { 
      key: 'direction', 
      header: 'VECTOR', 
      render: (v: string) => (
        <span className={`
          inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
          ${v === 'credit' ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}
        `}>
          {v}
        </span>
      )
    },
    { 
      key: 'amount', 
      header: 'QUANTUM', 
      align: 'right' as const, 
      render: (v: string, r: StaffLedgerEntry) => (
        <span className={`font-black text-sm ${r.direction === 'credit' ? 'text-[#059669]' : 'text-[#dc2626]'}`}>
          {r.direction === 'credit' ? '+' : '-'}Rs. {parseFloat(v).toLocaleString()}
        </span>
      ) 
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, r: StaffLedgerEntry) => (
        <div className="flex items-center justify-end gap-2 pr-4">
          <button 
            onClick={() => handleOpenLedgerModal(r)}
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => { if(window.confirm('Exterminate record?')) deleteEntry(r.id) }} 
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-red-50 text-[#94a3b8] hover:text-red-600 rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <BookOpen className="text-white w-5 h-5" />
           </div>
           <div>
              <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-widest">Transaction Log</h3>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Transaction Registry</p>
           </div>
        </div>
        <button 
          onClick={() => handleOpenLedgerModal()}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Entry
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Total Credits</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {sumEntries('credit').toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Personnel gains</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#dc2626]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Total Debits</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {sumEntries('debit').toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Adjustments / Penalties</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Net Adjustment</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {(sumEntries('credit') - sumEntries('debit')).toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Fiscal balance</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Volume</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {Array.isArray(ledgerData) ? ledgerData.length : (ledgerData as any)?.results?.length || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Active records</p>
          </div>
        </div>

        {/* Data Table Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex flex-wrap items-center gap-3">
                <Select 
                  value={filters.staff || ''} 
                  onChange={(e) => setFilters(prev => ({ ...prev, staff: e.target.value }))}
                  className="bg-white border border-[#e2e8f0] rounded-lg h-10 px-3 text-xs font-medium w-48 focus:ring-4 focus:ring-violet-600/5 focus:border-[#7c3aed] outline-none transition-all"
                  options={[{ value: '', label: 'All Personnel' }, ...(Array.isArray(staffMembers) ? staffMembers : (staffMembers as any)?.results || [])?.map((m: any) => ({ value: m.id, label: m.full_name })) || []]}
                />
                <Select 
                  value={filters.entry_type || ''} 
                  onChange={(e) => setFilters(prev => ({ ...prev, entry_type: e.target.value }))}
                  className="bg-white border border-[#e2e8f0] rounded-lg h-10 px-3 text-xs font-medium w-40 focus:ring-4 focus:ring-violet-600/5 focus:border-[#7c3aed] outline-none transition-all"
                  options={[
                    { value: '', label: 'All Types' },
                    { value: 'advance', label: 'Advance' },
                    { value: 'late_penalty', label: 'Late Penalty' },
                    { value: 'meal_deduction', label: 'Meal Deduction' },
                    { value: 'bonus', label: 'Bonus' },
                    { value: 'adjustment', label: 'Adjustment' }
                  ]}
                />
             </div>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">Registry Capture: {Array.isArray(ledgerData) ? ledgerData.length : (ledgerData as any)?.results?.length || 0}</p>
          </div>
          
          <div className="min-h-[400px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-32 gap-3 text-[#94a3b8]">
                <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Auditing Entries...</span>
              </div>
            ) : (Array.isArray(ledgerData) ? ledgerData : (ledgerData as any)?.results || [])?.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-32 gap-4 text-[#94a3b8]">
                  <Search className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No entries documented</p>
               </div>
            ) : (
              <Table columns={columns} data={(Array.isArray(ledgerData) ? ledgerData : (ledgerData as any)?.results || [])} className="border-none" />
            )}
          </div>
        </div>
      </div>
      
      <Modal theme="light"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLedgerId ? "Modify Protocol" : "Enlist Ledger Entry"}
        size="md"
        footer={
          <div className="flex gap-3 mt-4 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button 
               variant="primary" 
               onClick={handleSaveEntry} 
               isLoading={isCreating || isUpdating}
               className="flex-1 sm:flex-none px-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-none shadow-none font-bold"
            >
              Confirm
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
                ...((Array.isArray(staffMembers) ? staffMembers : (staffMembers as any)?.results || [])?.map((m: any) => ({ value: m.id, label: m.full_name })) || [])
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
              options={[
                { value: 'advance', label: 'Advance' },
                { value: 'late_penalty', label: 'Late Penalty' },
                { value: 'meal_deduction', label: 'Meal Deduction' },
                { value: 'deduction', label: 'Other Deduction' },
                { value: 'bonus', label: 'Bonus' },
                { value: 'reimbursement', label: 'Reimbursement' },
                { value: 'adjustment', label: 'Adjustment' }
              ]} 
              className="bg-white border-slate-200 text-slate-900"
            />
            <Select 
              label="DIRECTION *" 
              value={formData.direction}
              onChange={(e) => setFormData({...formData, direction: e.target.value as any})}
              options={[
                { value: 'debit', label: 'Debit (-)' },
                { value: 'credit', label: 'Credit (+)' },
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
                placeholder="04"
                value={formData.payroll_period_month?.toString() || ''}
                onChange={(e) => setFormData({...formData, payroll_period_month: parseInt(e.target.value) || null})}
                className="bg-white border-slate-200 text-slate-900"
              />
          </div>

          <Input 
            label="NOTE"
            value={formData.note || ''}
            onChange={(e) => setFormData({...formData, note: e.target.value})}
            placeholder="Protocol Context..."
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </Modal>
    </div>
  );
}
