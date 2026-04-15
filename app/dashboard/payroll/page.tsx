"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Select, Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, FileText, ChevronRight } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { usePayrollRuns } from '@/src/hooks/usePayroll';
import { PayrollRun } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePayrollRunDetails } from '@/src/hooks/usePayroll';

const SummaryCell = ({ row }: { row: any }) => {
  // If the list already has non-zero stats, show them immediately
  const base = row.total_base_salary ?? row.totalBaseSalary ?? row.base_salary ?? row.total_base ?? 0;
  const net = row.net_payable ?? row.netPayable ?? row.net_amount ?? row.payable_amount ?? row.total_net ?? 0;
  
  const displayBase = typeof base === 'string' ? parseFloat(base) : Number(base);
  const displayNet = typeof net === 'string' ? parseFloat(net) : Number(net);

  // If both are zero, we use the detailed hook to fetch the real data (which has lines)
  const shouldFetch = (displayBase === 0 && displayNet === 0);
  const { data: details, isLoading } = usePayrollRunDetails(shouldFetch ? row.id : '');

  let finalBase = displayBase;
  let finalNet = displayNet;

  if (shouldFetch && details) {
     const lines = Array.isArray(details.lines) ? details.lines : [];
     // Calculate from lines with robust field mapping
     const calBase = lines.reduce((sum, l) => sum + Number(l.base_salary || 0), 0);
     const calNet = lines.reduce((sum, l) => {
        const base = Number(l.base_salary || 0);
        const adds = Number((l as any).additions || l.total_credits || l.total_bonuses || l.total_reimbursements || 0);
        const ders = Number(
          (l as any).deductions || 
          l.total_debits || 
          l.total_advances || 
          (Number(l.total_meal_deductions || 0) + Number(l.total_late_penalties || 0) + Number(l.total_other_deductions || 0)) || 
          0
        );
        return sum + (base + adds - ders);
     }, 0);
     
     // Prefer calculated values if summary fields are 0/missing
     finalBase = (displayBase > 0) ? displayBase : (Number((details as any).total_base_salary) || calBase);
     finalNet = (displayNet !== 0) ? displayNet : ((details as any).net_payable !== undefined ? Number((details as any).net_payable) : calNet);
     
     // If the summary net is still the same as base but we have lines with deductions, use the calculated net
     if (finalNet === finalBase && calNet !== calBase && calNet < finalNet) {
        finalNet = calNet;
     }
  }

  if (shouldFetch && isLoading) {
    return (
      <div className="flex items-center gap-2 text-[10px] text-tertiary italic">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Calculating...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-[10px] text-tertiary">
      <div className="flex items-center gap-2 justify-between">
        <span className="opacity-70">Base:</span>
        <span className="text-white font-mono">{formatCurrency(finalBase || 0).replace('PKR ', '')}</span>
      </div>
      <div className="flex items-center gap-2 justify-between">
        <span className="text-primary opacity-80">Net:</span>
        <span className="text-accent font-bold font-mono">{formatCurrency(finalNet || 0)}</span>
      </div>
    </div>
  );
};

export default function PayrollManagement() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);

  const { payrollRuns, isLoading, createPayrollRun, isCreating } = usePayrollRuns({
    page,
    page_size: 20,
    year: yearFilter || undefined,
    month: monthFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleGenerate = () => {
    // Generate draft run
    createPayrollRun({ year: generateYear, month: generateMonth }, {
      onSuccess: () => setIsGenerateModalOpen(false)
    });
  };

  const columns = [
    { 
      key: 'period', 
      header: 'PERIOD',
      render: (_: any, row: PayrollRun) => (
        <span className="font-bold text-slate-900 text-sm">{row.month}/{row.year}</span>
      )
    },
    { 
      key: 'dates', 
      header: 'DATES',
      render: (_: any, row: PayrollRun) => (
        <span className="text-xs font-semibold text-slate-500">{row.period_start} — {row.period_end}</span>
      )
    },
    { 
      key: 'staff_count', 
      header: 'STAFF',
      render: (_: any, row: PayrollRun) => (
        <span className="text-sm font-medium text-slate-600">{(row.lines?.length || 0)} staff</span>
      )
    },
    { 
      key: 'status', 
      header: 'STATUS',
      render: (v: string) => (
        <Badge variant={v === 'paid' ? 'success' : v === 'draft' ? 'warning' : 'secondary'} size="sm" className="font-bold">
          {v}
        </Badge>
      )
    },
    { 
      key: 'generated_by', 
      header: 'GENERATED BY',
      render: (_: any, row: PayrollRun) => (
        <span className="text-xs font-medium text-slate-500">{row.generated_by_name || '—'}</span>
      )
    },
    { 
      key: 'date', 
      header: 'DATE',
      render: (_: any, row: PayrollRun) => (
        <span className="text-xs font-bold text-slate-400">{row.generated_at ? new Date(row.generated_at).toISOString().split('T')[0] : '—'}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: PayrollRun) => (
        <button 
          onClick={() => router.push(`/dashboard/payroll/${row.id}`)}
          className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all"
        >
          View
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Payroll History</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage staff salaries and payouts</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          icon={<Plus className="w-5 h-5 text-white" />}
          onClick={() => setIsGenerateModalOpen(true)}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-8"
        >
          Initialize Run
        </Button>
      </div>
      
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Payroll Runs</h2>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => setIsGenerateModalOpen(true)}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Run
        </Button>
      </div>
      
      {/* Table Section */}
      <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : payrollRuns?.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">No payroll history found.</div>
        ) : (
          <Table columns={columns} data={payrollRuns || []} className="text-sm border-none" />
        )}
      </Card>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Create Payroll Run"
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setIsGenerateModalOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
            <Button variant="primary" onClick={handleGenerate} isLoading={isCreating} className="flex-1 sm:flex-none px-10 shadow-glow-primary">Create Run</Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
            <div className="grid grid-cols-2 gap-5">
              <Input 
                label="YEAR *" type="number"
                value={generateYear.toString()}
                onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                className="bg-white border-slate-200 text-slate-900"
              />
              <Input 
                label="MONTH *" type="number"
                value={generateMonth.toString()}
                onChange={(e) => setGenerateMonth(parseInt(e.target.value))}
                className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <Input 
                 label="PERIOD START *" type="date"
                 className="bg-white border-slate-200 text-slate-900"
              />
              <Input 
                 label="PERIOD END *" type="date"
                 className="bg-white border-slate-200 text-slate-900"
              />
            </div>
            <Input 
              label="NOTES" 
              placeholder="Optional notes" 
              className="bg-white border-slate-200 text-slate-900"
            />
        </div>
      </Modal>
    </div>
  );
}
