"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { ArrowLeft, CheckCircle, Loader2, DollarSign, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Wallet, Users } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { usePayrollRunDetails, usePayrollRuns, usePayrollLines } from '@/src/hooks/usePayroll';
import { PayrollLine } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';

import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useLedger } from '@/src/hooks/useLedger';

export default function PayrollDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: runDetails, isLoading, error } = usePayrollRunDetails(id);
  const { finalizePayrollRun, isFinalizing, generatePayrollLines, isGenerating } = usePayrollRuns();
  const { markPaid, isMarkingPaid } = usePayrollLines();

  const currentYear = Number(runDetails?.year) || new Date().getFullYear();
  const currentMonth = Number(runDetails?.month) || (new Date().getMonth() + 1);

  const { ledgerData } = useLedger({
    payroll_year: currentYear,
    payroll_month: currentMonth,
    page_size: 200
  });

  const [selectedLine, setSelectedLine] = useState<PayrollLine | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidNote, setPaidNote] = useState('');

  const handleFinalize = () => {
    if (window.confirm('Are you confirm to finalize this payroll run? This cannot be undone.')) {
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
      onSuccess: () => setSelectedLine(null)
    });
  };

  const handleRefresh = () => {
    if (!runDetails) return;
    generatePayrollLines(id, {
      onSuccess: () => {
        toast.success('Payroll data refreshed and recalculated');
      }
    });
  };

  const columns = [
    { 
      key: 'staff', 
      header: 'STAFF MEMBER',
      render: (_: any, row: PayrollLine) => (
        <div className="flex flex-col">
          <span className="font-black text-white text-sm uppercase tracking-tighter">{row.staff_name || 'Staff Member'}</span>
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{row.employee_code || '---'}</span>
        </div>
      )
    },
    { 
      key: 'base_salary', 
      header: 'BASE SALARY',
      render: (v: string) => <span className="text-white text-xs font-black">{formatCurrency(v)}</span>
    },
    { 
      key: 'adjustments', 
      header: 'ADJUSTMENTS',
      render: (_: any, row: PayrollLine) => {
        const adds = Number(row.total_bonuses || 0) + Number(row.total_reimbursements || 0);
        const ders = Number(row.total_advances || 0) + Number(row.total_late_penalties || 0) + Number(row.total_meal_deductions || 0) + Number(row.total_other_deductions || 0);
        return (
          <div className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest">
             <span className="text-success flex items-center gap-1.5"><TrendingUp className="w-2.5 h-2.5" /> +{formatCurrency(adds).replace('PKR ', '')}</span>
             <span className="text-error flex items-center gap-1.5"><TrendingDown className="w-2.5 h-2.5" /> -{formatCurrency(ders).replace('PKR ', '')}</span>
          </div>
        );
      }
    },
    { 
      key: 'net_salary', 
      header: 'NET PAYABLE',
      render: (v: string) => <span className="text-secondary-foreground font-black text-sm bg-primary/20 px-3 py-1 rounded-lg border border-primary/20">{formatCurrency(v)}</span>
    },
    { 
      key: 'status', 
      header: 'STATE',
      render: (_: any, row: PayrollLine) => (
        <Badge variant={row.is_paid ? 'success' : 'secondary'} size="sm" className={`font-black uppercase tracking-widest text-[9px] border-none px-4`}>
          {row.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: PayrollLine) => (
        <button 
          disabled={row.is_paid || runDetails?.status !== 'finalized'}
          onClick={() => {
            setSelectedLine(row);
            setPaidAmount(row.net_salary.toString());
            setPaidNote('');
          }}
          className="px-5 py-2 border border-base bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-20 disabled:grayscale"
        >
          {row.is_paid ? 'Cleared' : 'Process Payment'}
        </button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-40 gap-4">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
        <p className="text-tertiary font-black uppercase tracking-[0.2em] text-xs">Loading Payroll Registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center max-w-xl mx-auto space-y-6">
        <div className="bg-error/10 border border-error/20 p-8 rounded-[2rem] shadow-2xl">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <p className="text-error font-black uppercase tracking-widest text-xs mb-3">Api Synchronicity Failure</p>
          <p className="text-white font-mono text-xs break-all opacity-80 leading-relaxed">{(error as any)?.response?.data?.detail || (error as any)?.message || 'Unknown Server Error'}</p>
          <div className="h-px bg-error/10 my-6" />
          <p className="text-tertiary text-[10px] uppercase font-bold">Trace Identifier: {id}</p>
        </div>
        <Button onClick={() => router.back()} variant="secondary" className="px-10 font-black uppercase tracking-widest text-xs">Return to Ledger</Button>
      </div>
    );
  }

  if (!runDetails) return null;

  const year = runDetails.year || new Date().getFullYear();
  const month = runDetails.month || (new Date().getMonth() + 1);
  const status = runDetails.status || 'draft';
  const lines = Array.isArray(runDetails.lines) ? runDetails.lines : [];

  let monthName = 'Payroll';
  try {
    monthName = new Date(Number(year), Number(month) - 1).toLocaleString('default', { month: 'long' });
  } catch (e) {}

  const calculatedTotals = lines.reduce((acc, line) => {
    acc.base_salary += Number(line.base_salary || 0);
    acc.net_salary += Number(line.net_salary || 0);
    return acc;
  }, { base_salary: 0, net_salary: 0 });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-secondary border border-base rounded-[2rem] p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-transparent to-primary opacity-50" />
        <div className="flex items-center gap-6 relative z-10">
          <button onClick={() => router.back()} className="p-4 bg-bg-main border border-base hover:bg-white/5 transition-all text-tertiary hover:text-white rounded-2xl shadow-inner">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div className="flex flex-col">
            <div className="flex gap-3 items-center mb-1">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">{monthName} {year} Execution</h2>
              <Badge variant={(status === 'paid' ? 'success' : status === 'draft' ? 'warning' : 'secondary') as any} size="sm" className="font-black uppercase tracking-widest text-[9px] border-none px-4 h-5">
                {status}
              </Badge>
            </div>
            <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em]">{lines.length} Staff Members Enrolled</p>
          </div>
        </div>
        
        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          {status === 'draft' && (
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
              isLoading={isGenerating}
              className="flex-1 md:flex-none border-base hover:bg-white/5 font-black uppercase tracking-widest text-[10px]"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Recalculate Table
            </Button>
          )}
          {status === 'draft' && (
            <Button 
              variant="primary" 
              onClick={handleFinalize}
              isLoading={isFinalizing}
              className="flex-1 md:flex-none font-black uppercase tracking-widest text-[10px] shadow-glow-primary px-8"
            >
              <CheckCircle className="w-3 h-3 mr-2" />
              Finalize Run
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Collective Base', val: calculatedTotals.base_salary, icon: Wallet, color: 'text-white' },
          { label: 'Staff Count', val: lines.length, icon: Users, color: 'text-tertiary', isCurrency: false },
          { label: 'Processed Payouts', val: lines.filter(l => l.is_paid).length, icon: CheckCircle, color: 'text-success', isCurrency: false },
          { label: 'Net Payable', val: calculatedTotals.net_salary, icon: DollarSign, color: 'text-primary', isMain: true }
        ].map((stat, i) => (
          <div key={i} className={`bg-secondary p-6 rounded-[1.5rem] border border-base shadow-xl group transition-all hover:border-primary/30 h-max ${stat.isMain ? 'bg-primary/5' : ''}`}>
             <div className="flex items-center justify-between mb-3">
               <p className="text-[10px] text-tertiary font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</p>
               <stat.icon className={`w-4 h-4 ${stat.color} opacity-40 group-hover:opacity-80`} />
             </div>
             <p className={`text-2xl font-black ${stat.isMain ? 'text-white drop-shadow-glow' : 'text-white'}`}>
               {stat.isCurrency === false ? stat.val : formatCurrency(stat.val)}
             </p>
          </div>
        ))}
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
         <Table columns={columns} data={lines} className="text-sm border-none" />
      </Card>

      <Modal
        isOpen={!!selectedLine}
        onClose={() => setSelectedLine(null)}
        title="Mark Salary as Paid"
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setSelectedLine(null)} className="flex-1 sm:flex-none">Cancel Allocation</Button>
            <Button variant="primary" onClick={handleMarkPaid} isLoading={isMarkingPaid} className="flex-1 sm:flex-none px-10 shadow-glow-primary font-black uppercase text-[10px] tracking-widest">Authorize Transaction</Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
            {selectedLine && (
              <div className="bg-bg-main p-6 rounded-2xl border border-base shadow-inner flex justify-between items-center group">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] text-tertiary font-black uppercase tracking-widest opacity-60">Recipient Identity</p>
                  <p className="text-sm text-white font-black uppercase tracking-tighter group-hover:text-primary transition-colors">{selectedLine.staff_name || 'Individual Staff'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[10px] text-tertiary font-black uppercase tracking-widest opacity-60">Contracted Net</p>
                  <p className="text-lg text-white font-black drop-shadow-sm">{formatCurrency(selectedLine.net_salary)}</p>
                </div>
              </div>
            )}
            <Input 
              label="DISBURSED AMOUNT *" type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="bg-bg-main border-base text-white text-lg font-black h-14"
            />
            <Input 
              label="PAYMENT NOTE / REFERENCE"
              placeholder="e.g. TRN-99281-BANK-X"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              className="bg-bg-main border-base text-white"
            />
            <div className="p-4 bg-success/5 border border-success/20 rounded-xl flex gap-4 items-start">
               <CheckCircle className="w-5 h-5 text-success shrink-0" />
               <p className="text-[10px] text-tertiary font-medium leading-relaxed">By authorizing this action, the amount will be reconciled on the backend and recorded in the staff ledger as a salary payment. This action is linked to your administrative identity.</p>
            </div>
        </div>
      </Modal>
    </div>
  );
}
