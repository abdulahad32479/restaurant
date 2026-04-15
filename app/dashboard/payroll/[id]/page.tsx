"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { ArrowLeft, CheckCircle, Loader2, DollarSign } from 'lucide-react';
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

  // Safely define year and month for filters
  const currentYear = Number(runDetails?.year) || new Date().getFullYear();
  const currentMonth = Number(runDetails?.month) || (new Date().getMonth() + 1);

  // Fetch LIVE ledger entries to override backend zeros if needed
  const { ledgerData } = useLedger({
    payroll_year: currentYear,
    payroll_month: currentMonth,
    page_size: 200 // Ensure we get all entries for the month
  });

  const [selectedLine, setSelectedLine] = useState<PayrollLine | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidNote, setPaidNote] = useState('');

  const handleFinalize = () => {
    if (confirm('Are you confirm to finalize this payroll run? This cannot be undone.')) {
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
        <span className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">{row.staff_name || 'Staff Member'}</span>
      )
    },
    { 
      key: 'base_salary', 
      header: 'BASE SALARY',
      render: (v: string) => <span className="text-slate-600 text-xs font-bold">{formatCurrency(v)}</span>
    },
    { 
      key: 'adjustments', 
      header: 'ADJUSTMENTS',
      render: (_: any, row: PayrollLine) => {
        const adds = Number(row.total_bonuses || 0) + Number(row.total_reimbursements || 0);
        const ders = Number(row.total_advances || 0) + Number(row.total_late_penalties || 0) + Number(row.total_meal_deductions || 0) + Number(row.total_other_deductions || 0);
        return (
          <div className="flex gap-2 text-[11px] font-bold">
             <span className="text-success">+{formatCurrency(adds)}</span>
             <span className="text-error">-{formatCurrency(ders)}</span>
          </div>
        );
      }
    },
    { 
      key: 'net_salary', 
      header: 'NET PAYABLE',
      render: (v: string) => <span className="text-slate-900 font-black text-sm">{formatCurrency(v)}</span>
    },
    { 
      key: 'status', 
      header: 'STATUS',
      render: (_: any, row: PayrollLine) => (
        <Badge variant={row.is_paid ? 'success' : 'secondary'} size="sm" className={`font-bold uppercase tracking-widest text-[9px] ${row.is_paid ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'} border-none`}>
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
          className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all disabled:opacity-30"
        >
          {row.is_paid ? 'Cleared' : 'Pay Salary'}
        </button>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-10 text-center max-w-xl mx-auto space-y-4">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl">
          <p className="text-red-400 font-bold uppercase tracking-widest text-xs mb-2">Live Build Error Diagnostic</p>
          <p className="text-white font-mono text-sm break-all">{(error as any)?.response?.data?.detail || (error as any)?.message || 'Unknown Server Error'}</p>
          <p className="text-tertiary text-[10px] uppercase mt-4">Status: {(error as any)?.response?.status || '500'} | Request ID: {id}</p>
        </div>
        <Button onClick={() => router.back()} variant="secondary">Return to Payroll</Button>
      </div>
    );
  }

  if (!runDetails) {
    return (
      <div className="p-10 text-center">
        <p className="text-tertiary">Payroll details not found.</p>
        <Button onClick={() => router.back()} variant="secondary" className="mt-4">Go Back</Button>
      </div>
    );
  }

  // Define safe display values
  const year = runDetails.year || new Date().getFullYear();
  const month = runDetails.month || (new Date().getMonth() + 1);
  const status = runDetails.status || 'draft';
  const lines = Array.isArray(runDetails.lines) ? runDetails.lines : [];

  // Safety fallback for month name calculation
  let monthName = 'Payroll';
  try {
    const dateObj = new Date(Number(year), Number(month) - 1);
    monthName = dateObj.toLocaleString('default', { month: 'long' });
  } catch (e) {
    console.error('Date parsing error', e);
  }

  // Merge live ledger data into the lines for summary calculations
  const processedLines = lines.map(line => {
    // 1. Get base salary
    const base = Number(line.base_salary || 0);

    // 2. Identify API-provided additions and deductions (handling various backend field names)
    // Additions: additions or total_credits or total_bonuses or total_reimbursements
    const apiAdditions = Number(
      (line as any).additions || 
      line.total_credits || 
      line.total_bonuses || 
      line.total_reimbursements || 
      0
    );
    // Deductions: deductions or total_debits or total_advances or aggregate sum of specific penalties
    const apiDeductions = Number(
      (line as any).deductions || 
      line.total_debits || 
      line.total_advances || 
      (Number(line.total_meal_deductions || 0) + Number(line.total_late_penalties || 0) + Number(line.total_other_deductions || 0)) || 
      0
    );

    // 3. Fetch LIVE ledger entries to see if anything changed since last payroll run
    const liveEntries = (ledgerData?.results || []).filter(e => e.staff === line.staff);
    const liveAdd = liveEntries.filter(e => e.direction === 'credit').reduce((s, e) => s + Number(e.amount || 0), 0);
    const liveDed = liveEntries.filter(e => e.direction === 'debit').reduce((s, e) => s + Number(e.amount || 0), 0);
    
    // 4. Determine final values (prioritize live data if non-zero, otherwise use API data)
    const finalAdd = liveAdd > 0 ? liveAdd : apiAdditions;
    const finalDed = liveDed > 0 ? liveDed : apiDeductions;
    
    // 5. Calculate net salary: Base + Additions - Deductions
    // We calculate locally to ensure consistent UI even if API net_salary is stale or incorrect
    const calculatedNet = base + finalAdd - finalDed;
    
    return {
      ...line,
      additions: finalAdd,
      deductions: finalDed,
      net_salary: calculatedNet
    };
  });

  // Calculate totals from processed lines
  const calculatedTotals = processedLines.reduce((acc, line) => {
    acc.base_salary += Number(line.base_salary || 0);
    acc.additions += Number(line.additions || 0);
    acc.deductions += Number(line.deductions || 0);
    acc.net_salary += Number(line.net_salary || 0);
    return acc;
  }, { base_salary: 0, additions: 0, deductions: 0, net_salary: 0 });

  // Always use calculated totals to be safe
  const totalBase = calculatedTotals.base_salary;
  const totalAdditions = calculatedTotals.additions;
  const totalDeductions = calculatedTotals.deductions;
  const netPayable = calculatedTotals.net_salary;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 border border-slate-100 hover:bg-slate-50 transition-all text-slate-400 rounded-lg">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{monthName} {year} Payroll</h2>
            <div className="flex gap-2 items-center mt-0.5">
               <Badge variant={(status === 'paid' ? 'success' : status === 'draft' ? 'warning' : 'secondary') as any} size="sm" className="font-bold uppercase tracking-widest text-[9px]">
                {status}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {status === 'draft' && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRefresh}
              isLoading={isGenerating}
              className="text-xs font-bold"
            >
              Recalculate
            </Button>
          )}
          {status === 'draft' && (
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleFinalize}
              isLoading={isFinalizing}
              className="font-black uppercase shadow-glow-primary px-6"
            >
              Finalize Run
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total Base</p>
           <p className="text-lg text-slate-900 font-black">{formatCurrency(totalBase)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Additions</p>
           <p className="text-lg text-success font-black">+{formatCurrency(totalAdditions).replace('PKR ', '')}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Deductions</p>
           <p className="text-lg text-error font-black">-{formatCurrency(totalDeductions).replace('PKR ', '')}</p>
        </div>
        <div className="bg-primary p-5 rounded-2xl border border-primary shadow-sm text-white">
           <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest mb-1">Net Payable</p>
           <p className="text-lg font-black">{formatCurrency(netPayable)}</p>
        </div>
      </div>
      
      <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
         <Table columns={columns} data={processedLines} className="text-sm border-none" />
      </Card>

      <Modal
        isOpen={!!selectedLine}
        onClose={() => setSelectedLine(null)}
        title="Mark Salary as Paid"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedLine(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleMarkPaid} isLoading={isMarkingPaid}>Confirm Payment</Button>
          </>
        }
      >
        <div className="space-y-4">
            {selectedLine && (
              <div className="bg-slate-50 p-4 rounded-xl mb-4 border border-slate-100 space-y-1">
                <p className="text-sm text-slate-500 font-bold">Staff: <span className="text-slate-900">{selectedLine.staff_name || selectedLine.staff}</span></p>
                <p className="text-sm text-slate-500 font-bold">Net Salary: <span className="text-slate-900 font-black">{formatCurrency(selectedLine.net_salary)}</span></p>
              </div>
            )}
            <Input 
              label="PAID AMOUNT *" type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="PAYMENT NOTE"
              placeholder="e.g. Bank Transfer"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              className="bg-white border-slate-200 text-slate-900"
            />
        </div>
      </Modal>
    </div>
  );
}
