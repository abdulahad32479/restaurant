"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { ArrowLeft, CheckCircle, Loader2, DollarSign, RefreshCw, TrendingUp, TrendingDown, Wallet, Users, AlertCircle } from 'lucide-react';
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
      key: 'staff', 
      header: 'STAFF MEMBER',
      render: (_: any, row: PayrollLine) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm uppercase tracking-tighter">{row.staff_name || 'Staff Member'}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{row.employee_code || '---'}</span>
        </div>
      )
    },
    { 
      key: 'base_salary', 
      header: 'BASE SALARY',
      render: (v: string) => <span className="text-slate-700 text-xs font-bold">{formatCurrency(v)}</span>
    },
    { 
      key: 'adjustments', 
      header: 'ADJUSTMENTS',
      render: (_: any, row: PayrollLine) => {
        const adds = Number(row.total_bonuses || 0) + Number(row.total_reimbursements || 0);
        const ders = Number(row.total_advances || 0) + Number(row.total_late_penalties || 0) + Number(row.total_meal_deductions || 0) + Number(row.total_other_deductions || 0);
        return (
          <div className="flex flex-col gap-0.5 text-[9px] font-bold uppercase tracking-widest">
             <span className="text-emerald-600">+{formatCurrency(adds).replace('PKR ', '')}</span>
             <span className="text-rose-600">-{formatCurrency(ders).replace('PKR ', '')}</span>
          </div>
        );
      }
    },
    { 
      key: 'net_salary', 
      header: 'NET PAYABLE',
      render: (v: string) => <span className="text-slate-900 font-bold text-sm">{formatCurrency(v)}</span>
    },
    { 
      key: 'attendance', 
      header: 'ATTENDANCE',
      render: (_: any, row: PayrollLine) => (
        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tight">
           <div className="flex flex-col"><span className="text-emerald-600">P: {row.attendance_days || 0}</span></div>
           <div className="flex flex-col"><span className="text-rose-600">A: {row.absent_days || 0}</span></div>
           <div className="flex flex-col"><span className="text-amber-600">L: {row.late_days || 0}</span></div>
        </div>
      )
    },
    { 
      key: 'status', 
      header: 'STATE',
      render: (_: any, row: PayrollLine) => (
        <Badge variant={row.is_paid ? 'success' : 'secondary'} size="sm" className={`font-bold uppercase tracking-widest text-[9px] border-none px-3 py-0.5 rounded-full`}>
          {row.is_paid ? 'Paid' : 'Unpaid'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: PayrollLine) => (
        <div className="flex justify-end gap-2">
          {!row.is_paid && runDetails?.status === 'finalized' ? (
            <button 
              onClick={() => {
                setSelectedLine(row);
                setPaidAmount(row.net_salary.toString());
                setPaidNote('');
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-1.5 px-4 rounded-lg text-[10px] uppercase tracking-widest shadow-sm transition-all"
            >
              Pay Now
            </button>
          ) : row.is_paid ? (
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Cleared
            </span>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Locked</span>
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
    <div className="space-y-6 animate-fade-in -m-6 p-6 min-h-screen bg-[#f4f6f8] font-sans text-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 bg-white border border-slate-200 hover:bg-slate-50 transition-all text-slate-500 hover:text-slate-900 rounded-lg shadow-sm">
            <ArrowLeft className="w-4 h-4"/>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payroll Detail</h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{runDetails.month}/{runDetails.year} Cycle</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {runDetails.status === 'draft' && (
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              isLoading={isGenerating}
              className="border-slate-200 bg-white text-slate-700 font-bold uppercase tracking-widest text-[10px] h-10 px-6"
            >
              <RefreshCw className={`w-3 h-3 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
              Recalculate
            </Button>
          )}
          {runDetails.status === 'draft' && (
            <Button 
              variant="primary" 
              onClick={handleFinalize}
              isLoading={isFinalizing}
              className="bg-violet-600 hover:bg-violet-700 text-white border-none font-bold uppercase tracking-widest text-[10px] h-10 px-8"
            >
              Finalize Run
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Salary</span>
                <Wallet className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.base)}</p>
        </Card>
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Enrollment</span>
                <Users className="w-3 h-3 text-slate-400" />
            </div>
            <p className="text-xl font-bold text-slate-900">{lines.length} Staff</p>
        </Card>
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Settled</span>
                <CheckCircle className="w-3 h-3 text-emerald-500" />
            </div>
            <p className="text-xl font-bold text-slate-900">{totals.paid} / {lines.length}</p>
        </Card>
        <Card className="bg-white border-slate-200 p-5 shadow-sm space-y-2 border-l-4 border-l-violet-600">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Net Payable</span>
                <DollarSign className="w-3 h-3 text-violet-600" />
            </div>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totals.net)}</p>
        </Card>
      </div>
      
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm p-0 min-h-[400px]">
         <Table columns={columns} data={lines} className="border-none" />
      </Card>

      <Modal theme="light"
        isOpen={!!selectedLine}
        onClose={() => setSelectedLine(null)}
        title="Mark Salary as Paid"
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-4">
            <Button variant="outline" onClick={() => setSelectedLine(null)} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-bold px-8">Cancel</Button>
            <Button variant="primary" onClick={handleMarkPaid} isLoading={isMarkingPaid} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11">Record Payment</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4">
            {selectedLine && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Staff Member</p>
                  <p className="text-sm text-slate-900 font-bold">{selectedLine.staff_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Net Salary</p>
                  <p className="text-lg text-slate-900 font-bold">{formatCurrency(selectedLine.net_salary)}</p>
                </div>
              </div>
            )}
            <Input 
              label="PAID AMOUNT *" type="number"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="bg-white border-slate-200 h-12 text-lg font-bold"
            />
            <Input 
              label="PAYMENT NOTE"
              placeholder="e.g. Bank Transfer Ref"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
              className="bg-white border-slate-200 h-12"
            />
        </div>
      </Modal>
    </div>
  );
}
