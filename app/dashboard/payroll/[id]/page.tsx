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

export default function PayrollDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: runDetails, isLoading } = usePayrollRunDetails(id);
  const { finalizePayroll, isFinalizing } = usePayrollRuns();
  const { markPaid, isMarkingPaid } = usePayrollLines();

  const [selectedLine, setSelectedLine] = useState<PayrollLine | null>(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [paidNote, setPaidNote] = useState('');

  const handleFinalize = () => {
    if (confirm('Are you confirm to finalize this payroll run? This cannot be undone.')) {
      finalizePayroll(id);
    }
  };

  const handleMarkPaid = () => {
    if (!selectedLine) return;
    markPaid({
      id: selectedLine.id,
      data: {
        paid_amount: paidAmount || selectedLine.net_salary,
        note: paidNote
      }
    }, {
      onSuccess: () => setSelectedLine(null)
    });
  };

  const columns = [
    { 
      key: 'staff', 
      header: 'Staff Member',
      render: (_: any, row: PayrollLine) => (
        <span className="font-bold text-white">{row.staff_name || 'Staff Member'}</span>
      )
    },
    { 
      key: 'base_salary', 
      header: 'Base Salary',
      render: (value: string) => <span className="text-white">{formatCurrency(value).replace('PKR ', '')} PKR</span>
    },
    { 
      key: 'adjustments', 
      header: 'Additions / Deductions',
      render: (_: any, row: PayrollLine) => (
        <div className="text-xs">
           <span className="text-green-500">+{formatCurrency(row.additions).replace('PKR ', '')}</span>
           <span className="text-white/20 mx-2">|</span>
           <span className="text-red-500">-{formatCurrency(row.deductions).replace('PKR ', '')}</span>
        </div>
      )
    },
    { 
      key: 'net_salary', 
      header: 'Net Payable',
      render: (value: string) => <span className="text-accent font-black tracking-widest">{formatCurrency(value)}</span>
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (_: any, row: PayrollLine) => (
        <Badge variant={row.is_paid ? 'success' : 'secondary'} size="sm" className="uppercase text-[9px]">
          {row.is_paid ? 'PAID' : 'UNPAID'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: PayrollLine) => (
        <Button 
          variant="primary" 
          size="sm"
          disabled={row.is_paid || runDetails?.status !== 'finalized'}
          onClick={() => {
            setSelectedLine(row);
            setPaidAmount(row.net_salary.toString());
            setPaidNote('');
          }}
          className="uppercase tracking-widest text-[9px]"
        >
          {row.is_paid ? 'Cleared' : 'Pay Salary'}
        </Button>
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

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-secondary rounded-xl hover:bg-white/5 transition-all text-tertiary">
            <ArrowLeft className="w-5 h-5"/>
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">
              {monthName} {year} Payroll
            </h1>
            <div className="flex gap-2 items-center">
              <Badge variant={(status === 'paid' ? 'success' : status === 'draft' ? 'warning' : 'secondary') as any} size="sm" className="uppercase text-[9px]">
                {status}
              </Badge>
            </div>
          </div>
        </div>
        
        {status === 'draft' && (
          <Button 
            variant="primary" 
            size="sm"
            icon={<CheckCircle className="w-5 h-5" />}
            onClick={handleFinalize}
            isLoading={isFinalizing}
            className="font-black uppercase tracking-tighter"
          >
            Finalize Payroll
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-secondary p-5 rounded-2xl border border-base shadow-xl">
           <p className="text-[10px] text-tertiary uppercase tracking-widest mb-1">Total Base Salary</p>
           <p className="text-xl text-white font-bold">{formatCurrency(runDetails.total_base_salary || 0)}</p>
        </div>
        <div className="bg-secondary p-5 rounded-2xl border border-base shadow-xl">
           <p className="text-[10px] text-tertiary uppercase tracking-widest mb-1">Total Additions</p>
           <p className="text-xl text-green-500 font-bold">+{formatCurrency(runDetails.total_additions || 0).replace('PKR ', '')} PKR</p>
        </div>
        <div className="bg-secondary p-5 rounded-2xl border border-base shadow-xl">
           <p className="text-[10px] text-tertiary uppercase tracking-widest mb-1">Total Deductions</p>
           <p className="text-xl text-red-500 font-bold">-{formatCurrency(runDetails.total_deductions || 0).replace('PKR ', '')} PKR</p>
        </div>
        <div className="bg-secondary p-5 rounded-transform border-2 border-primary/20 bg-primary/5 shadow-xl">
           <p className="text-[10px] text-primary uppercase tracking-widest font-bold mb-1">Net Payable</p>
           <p className="text-2xl text-accent font-black tracking-tighter">{formatCurrency(runDetails.net_payable || 0)}</p>
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
         <Table columns={columns} data={lines} />
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
             <div className="bg-base/50 p-4 rounded-xl mb-4 border border-white/5 space-y-1">
                <p className="text-sm text-tertiary font-bold">Staff: <span className="text-white">{selectedLine.staff_name || selectedLine.staff}</span></p>
                <p className="text-sm text-tertiary font-bold">Net Salary: <span className="text-accent">{formatCurrency(selectedLine.net_salary)}</span></p>
             </div>
           )}
           <Input 
              label="Paid Amount" type="number"
              value={paidAmount}
              icon={<DollarSign className="w-4 h-4" />}
              onChange={(e) => setPaidAmount(e.target.value)}
            />
            <Input 
              label="Payment Note"
              placeholder="e.g. Paid in cash"
              value={paidNote}
              onChange={(e) => setPaidNote(e.target.value)}
            />
        </div>
      </Modal>
    </div>
  );
}
