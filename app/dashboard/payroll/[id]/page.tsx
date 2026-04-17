"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { 
  ArrowLeft, CheckCircle, Loader2, DollarSign, RefreshCw, 
  TrendingUp, TrendingDown, Wallet, Users, AlertCircle, 
  Clock, ShieldCheck, Zap, Info
} from 'lucide-react';
import { Card } from '@/src/components/Card';
import { usePayrollRunDetails, usePayrollRuns, usePayrollLines } from '@/src/hooks/usePayroll';
import { PayrollLine } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PayrollDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

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
          <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight italic">{r.staff_name}</span>
          <span className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{r.employee_code}</span>
        </div>
      )
    },
    { 
      key: 'base', 
      header: 'BASE', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#64748b] font-bold text-xs italic">{formatCurrency(r.base_salary)}</span> 
    },
    { 
      key: 'net', 
      header: 'NET QUOTE', 
      align: 'right' as const, 
      render: (v: string, r: PayrollLine) => <span className="text-[#0f172a] font-black text-sm italic">{formatCurrency(r.net_salary)}</span> 
    },
    { 
      key: 'status', 
      header: 'STATE', 
      render: (v: string, r: PayrollLine) => (
        <span className={`
          inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest
          ${r.is_paid ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f1f5f9] text-[#475569]'}
        `}>
          {r.is_paid ? 'Paid' : 'Pending'}
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
               <span className="text-[10px] font-black uppercase tracking-widest italic">Cleared</span>
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
      <div className="flex flex-col items-center justify-center p-40">
        <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
      </div>
    );
  }

  if (error || !runDetails) {
    return (
      <div className="p-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <p className="text-slate-800 font-bold uppercase tracking-widest text-sm">Failed to load payroll details.</p>
        <Button onClick={() => router.back()} variant="ghost" className="mt-4">Go Back</Button>
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
             onClick={() => router.back()}
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
             <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-widest italic">Distribution Matrix</h3>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">Enlisted: {lines.length}</p>
          </div>
          
          <div>
            {lines.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-40 gap-4 text-[#94a3b8]">
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No personnel lines detected</p>
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
                    <p className="text-2xl font-black text-white tracking-tight uppercase italic">{selectedLine.staff_name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">ID: {selectedLine.employee_code}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em]">Calculation</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{formatCurrency(selectedLine.net_salary)}</p>
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
                      className="w-full bg-slate-50 border-slate-200 h-16 rounded-2xl pl-14 pr-6 text-2xl font-black italic text-slate-900 focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all"
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
