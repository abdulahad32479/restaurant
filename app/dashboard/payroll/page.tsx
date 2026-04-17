"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Select, Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { 
  Plus, Loader2, FileText, ChevronRight, Zap, 
  DollarSign, PieChart, TrendingUp, Calendar, Filter,
  CreditCard, ArrowLeft, CheckCircle, RefreshCw, Users,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/src/components/Card';
import { usePayrollRuns, usePayrollRunDetails, usePayrollLines } from '@/src/hooks/usePayroll';
import { PayrollRun, PayrollLine } from '@/src/types/staff';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';

export default function PayrollManagement() {
  const router = useRouter();
  const [yearFilter, setYearFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    period_start: '',
    period_end: '',
    notes: ''
  });

  const { payrollRuns, isLoading, createPayrollRun, isCreating } = usePayrollRuns({
    year: yearFilter || undefined,
    status: statusFilter || undefined,
  });

  const runs = Array.isArray(payrollRuns) ? payrollRuns : (payrollRuns as any)?.results || [];

  const summary = runs.reduce((acc: any, run: any) => {
    // Backend may provide totals directly, or we may need to sum lines
    const runNet = parseFloat(run.total_net_salary || 0);
    const runPaid = parseFloat(run.total_paid_amount || 0);
    return {
      total_net: acc.total_net + runNet,
      total_paid: acc.total_paid + runPaid
    };
  }, { total_net: 0, total_paid: 0 });

  const handleCreateRun = () => {
    if (!formData.period_start || !formData.period_end) {
      alert('Please fill period start and end dates');
      return;
    }
    createPayrollRun(formData, {
      onSuccess: () => setIsAddModalOpen(false)
    });
  };

  const columns = [
    { 
      key: 'period', 
      header: 'RUN PERIOD',
      render: (_: any, row: PayrollRun) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex flex-col items-center justify-center border border-violet-600/20">
             <span className="text-[10px] font-black text-violet-600 leading-none">{row.year}</span>
             <span className="text-sm font-black text-violet-600 leading-tight">{row.month?.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-black text-slate-900 text-sm tracking-tighter uppercase">Phase {row.month}.{row.year.toString().slice(2)}</span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{row.period_start} → {row.period_end}</span>
          </div>
        </div>
      )
    },
    { 
      key: 'staff', 
      header: 'FISCAL PERIOD', 
      render: (_: any, r: PayrollRun) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight">
            {new Date(0, r.month - 1).toLocaleString('default', { month: 'long' })} {r.year}
          </span>
          <span className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest leading-none">
            {r.period_start} to {r.period_end}
          </span>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'VECTOR STATE', 
      render: (v: string) => (
        <span className={`
          inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em]
          ${v === 'draft' ? 'bg-[#f1f5f9] text-[#475569]' : ''}
          ${v === 'finalized' ? 'bg-[#dbeafe] text-[#1e40af]' : ''}
          ${v === 'paid' ? 'bg-[#d1fae5] text-[#065f46]' : ''}
        `}>
          {v}
        </span>
      )
    },
    { 
      key: 'total_net_salary', 
      header: 'TOTAL EXPOSURE', 
      align: 'right' as const, 
      render: (v: string) => <span className="text-[#0f172a] font-extrabold text-xs">Rs. {parseFloat(v || '0').toLocaleString()}</span> 
    },
    { 
      key: 'total_paid_amount', 
      header: 'SETTLED', 
      align: 'right' as const, 
      render: (v: string) => <span className="text-[#059669] font-black text-xs">Rs. {parseFloat(v || '0').toLocaleString()}</span> 
    },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const, 
      render: (_: any, r: PayrollRun) => (
        <div className="flex items-center justify-end gap-2 pr-4">
          <button 
            onClick={() => setSelectedRunId(r.id)}
            className="px-4 py-2 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#0f172a] text-[10px] font-extrabold uppercase tracking-widest rounded-lg transition-all shadow-sm active:scale-95"
          >
            Audit Detail
          </button>
        </div>
      )
    }
  ];

  if (selectedRunId) {
    return (
      <PayrollDetailView 
        id={selectedRunId} 
        onBack={() => setSelectedRunId(null)} 
      />
    );
  }


  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <CreditCard className="text-white w-5 h-5" />
           </div>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">Payroll Cycles</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Treasury Operations</p>
           </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Cycle
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Cycle Volume</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">{payrollRuns?.length || 0}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Total periods</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Net Allocation</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {summary.total_net.toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Current exposure</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Settled Capital</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {summary.total_paid.toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Disbursed funds</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#d97706]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Pending Balance</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. {(summary.total_net - summary.total_paid).toLocaleString()}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">To be settled</p>
          </div>
        </div>

        {/* Data Table Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden min-h-[500px]">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
             <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-widest">Operations History</h3>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">Records: {payrollRuns?.length || 0}</p>
          </div>
          
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-40 gap-3 text-[#94a3b8]">
                <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]">Synchronizing Treasury...</p>
              </div>
            ) : runs.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-40 gap-4 text-[#94a3b8]">
                  <CreditCard className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No active payroll cycles</p>
               </div>
            ) : (
              <Table columns={columns} data={runs} className="border-none" />
            )}
          </div>
        </div>
      </div>

      <Modal theme="light"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Payroll Run"
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-4">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-bold px-8">Cancel</Button>
            <Button variant="primary" onClick={handleCreateRun} isLoading={isCreating} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11">Create Run</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-5">
            <Input 
              label="YEAR *" type="number"
              value={formData.year.toString()}
              onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="MONTH *" type="number"
              value={formData.month.toString()}
              onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <Input 
              label="PERIOD START *" type="date"
              value={formData.period_start}
              onChange={(e) => setFormData({...formData, period_start: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="PERIOD END *" type="date"
              value={formData.period_end}
              onChange={(e) => setFormData({...formData, period_end: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">NOTES</label>
            <textarea
              placeholder="Optional notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full min-h-[100px] p-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/20 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PayrollDetailView({ id, onBack }: { id: string, onBack: () => void }) {
  const { data: runDetails, isLoading, error } = usePayrollRunDetails(id);
  const { finalizePayrollRun, isFinalizing, generatePayrollLines, isGenerating } = usePayrollRuns();
  const { markPaid, isMarkingPaid } = usePayrollLines();

  const [selectedLine, setSelectedLine] = useState<PayrollLine | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidNote, setPaidNote] = useState('');

  const handleFinalize = () => {
    if (window.confirm('Are you sure you want to finalize this payroll run? This will lock calculations and allow payments.')) {
      finalizePayrollRun(id);
    }
  };

  const handleMarkPaid = () => {
    if (!selectedLine) return;
    markPaid({
      id: selectedLine.id,
      data: {
        paid_amount: paidAmount || selectedLine.net_salary,
        payment_note: paidNote
      }
    }, {
      onSuccess: () => {
        setSelectedLine(null);
        toast.success(`Payment recorded for ${selectedLine.staff_name}`);
      }
    });
  };

  const handleRefresh = () => {
    if (!id) return;
    generatePayrollLines(id, {
      onSuccess: () => {
        toast.success('Payroll lines recalculated from ledger & attendance');
      }
    });
  };

  const columns = [
    { 
      key: 'personnel', 
      header: 'PERSONNEL', 
      render: (_: any, r: PayrollLine) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight">{r.staff_name}</span>
          <span className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{r.employee_code}</span>
        </div>
      )
    },
    { 
      key: 'base', 
      header: 'BASE', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#64748b] font-bold text-xs">{formatCurrency(r.base_salary)}</span> 
    },
    { 
      key: 'advances', 
      header: 'ADVANCES', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#ef4444] font-bold text-xs">{formatCurrency(r.total_advances)}</span> 
    },
    { 
      key: 'late', 
      header: 'LATE', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#ef4444] font-bold text-xs">{formatCurrency(r.total_late_penalties)}</span> 
    },
    { 
      key: 'meal', 
      header: 'MEAL', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#ef4444] font-bold text-xs">{formatCurrency(r.total_meal_deductions)}</span> 
    },
    { 
      key: 'bonus', 
      header: 'BONUS', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#10b981] font-bold text-xs">{formatCurrency(parseFloat(r.total_bonuses as any) + parseFloat(r.total_reimbursements as any))}</span> 
    },
    { 
      key: 'net', 
      header: 'NET QUOTE', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#0f172a] font-black text-sm">{formatCurrency(r.net_salary)}</span> 
    },
    { 
      key: 'status', 
      header: 'STATE', 
      render: (v: string, r: PayrollLine) => (
        <span className={`
          inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
          ${r.is_paid ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f1f5f9] text-[#475569]'}
        `}>
          {r.is_paid ? <><Check size={10} className="mr-1"/> Paid</> : 'Pending'}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const, 
      render: (_: any, r: PayrollLine) => (
        <div className="flex justify-end gap-2 pr-2">
          {!r.is_paid && runDetails?.status === 'finalized' ? (
            <button 
              onClick={() => {
                setSelectedLine(r);
                setPaidAmount(r.net_salary.toString());
                setPaidNote('');
              }}
              className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-8 px-4 rounded-lg text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
            >
              Mark Paid
            </button>
          ) : r.is_paid ? (
            <div className="flex items-center gap-2 text-[#059669]">
               <CheckCircle className="w-4 h-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Cleared</span>
            </div>
          ) : (
            <div className="text-[#94a3b8] italic text-[10px] font-bold uppercase tracking-widest opacity-40">Protected</div>
          )}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 min-h-screen bg-[#f0f4f8]">
        <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
      </div>
    );
  }

  if (error || !runDetails) {
    return (
      <div className="p-20 text-center min-h-screen bg-[#f0f4f8]">
        <CreditCard className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-800 font-bold uppercase tracking-widest text-sm">Failed to load payroll details.</p>
        <Button onClick={onBack} variant="ghost" className="mt-4">Go Back</Button>
      </div>
    );
  }

  const lines = Array.isArray(runDetails.lines) ? runDetails.lines : [];
  const totals = lines.reduce((acc, line) => {
    acc.base += Number(line.base_salary || 0);
    acc.net += Number(line.net_salary || 0);
    acc.paid += line.is_paid ? 1 : 0;
    return acc;
  }, { base: 0, net: 0, paid: 0 });

  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <button 
             onClick={onBack}
             className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-all"
           >
              <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">{runDetails.month}/{runDetails.year} Cycle Detail</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Execution Registry · {runDetails.status}</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           {runDetails.status === 'draft' && (
             <button 
               onClick={handleRefresh}
               disabled={isGenerating}
               className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
             >
               {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
               Recalculate Lines
             </button>
           )}
           {runDetails.status === 'draft' && lines.length > 0 && (
             <button 
               onClick={handleFinalize}
               disabled={isFinalizing}
               className="bg-[#059669] hover:bg-[#047857] text-white font-bold h-10 px-6 rounded-lg text-xs shadow-md transition-all active:scale-95"
             >
               Finalize Cycle
             </button>
           )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Cycle Allocation</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">{formatCurrency(totals.base)}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Contract value</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Net Disbursement</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">{formatCurrency(totals.net)}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Final payable</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Settlement Rate</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">{totals.paid} / {lines.length}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Resolved units</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#d97706]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Pending Quantum</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">{formatCurrency(totals.net - (totals.paid * totals.net / lines.length || 0))}</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">To be settled</p>
          </div>
        </div>

        {/* Distribution Matrix Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden min-h-[500px]">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
             <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-widest">Distribution Matrix</h3>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">Enlisted: {lines.length}</p>
          </div>
          
          <div>
            {lines.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-40 gap-4 text-[#94a3b8]">
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No personnel lines detected</p>
                  {runDetails.status === 'draft' && (
                    <Button onClick={handleRefresh} isLoading={isGenerating} variant="primary" className="bg-violet-600">Recalculate Now</Button>
                  )}
               </div>
            ) : (
              <Table columns={columns} data={lines} className="border-none" />
            )}
          </div>
        </div>
      </div>

      <Modal theme="light"
        isOpen={!!selectedLine}
        onClose={() => setSelectedLine(null)}
        title="Execute Settlement"
        size="md"
        footer={
          <div className="flex gap-4 w-full sm:w-auto mt-6">
            <Button variant="outline" onClick={() => setSelectedLine(null)} className="flex-1 sm:flex-none h-14 rounded-2xl border-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs px-10">Cancel</Button>
            <Button variant="primary" onClick={handleMarkPaid} isLoading={isMarkingPaid} className="flex-1 sm:flex-none px-12 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white border-none shadow-2xl shadow-indigo-600/30 font-black uppercase tracking-widest text-xs">Record Transaction</Button>
          </div>
        }
      >
        <div className="space-y-8 pt-4">
            {selectedLine && (
              <div className="bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-all" />
                <div className="relative z-10 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em]">Beneficiary</p>
                    <p className="text-2xl font-black text-white tracking-tight uppercase">{selectedLine.staff_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {selectedLine.employee_code}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">Calculation</p>
                    <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(selectedLine.net_salary)}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Final Net Payable</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ALLOCATION AMOUNT</label>
                 <div className="relative">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                       <DollarSign className="w-5 h-5 text-indigo-600" />
                    </div>
                    <input 
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="w-full bg-slate-50 border-slate-200 h-16 rounded-2xl pl-14 pr-6 text-2xl font-black text-slate-900 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
                    />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">REFERENCE / NOTE</label>
                 <textarea 
                   placeholder="e.g. Wired via Bank Omni #9921..."
                   value={paidNote}
                   onChange={(e) => setPaidNote(e.target.value)}
                   className="w-full bg-slate-50 border-slate-200 rounded-2xl p-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all min-h-[120px] resize-none"
                 />
               </div>
            </div>
        </div>
      </Modal>
    </div>
  );
}
