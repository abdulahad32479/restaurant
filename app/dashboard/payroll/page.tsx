"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Select, Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, FileText, ChevronRight, Calendar, Users } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { usePayrollRuns } from '@/src/hooks/usePayroll';
import { PayrollRun } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { usePayrollRunDetails } from '@/src/hooks/usePayroll';

const SummaryCell = ({ row }: { row: any }) => {
  const base = row.total_base_salary ?? row.totalBaseSalary ?? row.base_salary ?? row.total_base ?? 0;
  const net = row.net_payable ?? row.netPayable ?? row.net_amount ?? row.payable_amount ?? row.total_net ?? 0;
  
  const displayBase = typeof base === 'string' ? parseFloat(base) : Number(base);
  const displayNet = typeof net === 'string' ? parseFloat(net) : Number(net);

  const shouldFetch = (displayBase === 0 && displayNet === 0);
  const { data: details, isLoading } = usePayrollRunDetails(shouldFetch ? row.id : '');

  let finalBase = displayBase;
  let finalNet = displayNet;

  if (shouldFetch && details) {
     const lines = Array.isArray(details.lines) ? details.lines : [];
     const calBase = lines.reduce((sum, l) => sum + Number(l.base_salary || 0), 0);
     const calNet = lines.reduce((sum, l) => sum + Number(l.net_salary || 0), 0);
     
     finalBase = (displayBase > 0) ? displayBase : (Number((details as any).total_base_salary) || calBase);
     finalNet = (displayNet !== 0) ? displayNet : ((details as any).net_payable !== undefined ? Number((details as any).net_payable) : calNet);
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
    <div className="flex flex-col gap-1 text-[10px]">
      <div className="flex items-center gap-3 justify-between">
        <span className="text-tertiary font-bold uppercase tracking-widest opacity-60">Base:</span>
        <span className="text-white font-black">{formatCurrency(finalBase || 0).replace('PKR ', '')}</span>
      </div>
      <div className="flex items-center gap-3 justify-between">
        <span className="text-primary font-bold uppercase tracking-widest opacity-80">Net:</span>
        <span className="text-white font-black">{formatCurrency(finalNet || 0)}</span>
      </div>
    </div>
  );
};

export default function PayrollManagement() {
  const router = useRouter();
  const [yearFilter, setYearFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);

  const { payrollRuns, isLoading, createPayrollRun, isCreating } = usePayrollRuns({
    year: yearFilter || undefined,
    month: monthFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleGenerate = () => {
    createPayrollRun({ 
      year: generateYear, 
      month: generateMonth,
      period_start: `${generateYear}-${String(generateMonth).padStart(2, '0')}-01`,
      period_end: `${generateYear}-${String(generateMonth).padStart(2, '0')}-30`
    }, {
      onSuccess: () => setIsGenerateModalOpen(false)
    });
  };

  const columns = [
    { 
      key: 'period', 
      header: 'PERIOD / BATCH',
      render: (_: any, row: PayrollRun) => (
        <div className="flex flex-col">
          <span className="font-black text-white text-sm uppercase tracking-tighter">
            {new Date(0, row.month - 1).toLocaleString('default', { month: 'long' })} {row.year}
          </span>
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">Run #{row.id.slice(0, 8)}</span>
        </div>
      )
    },
    { 
      key: 'dates', 
      header: 'CYCLE DATES',
      render: (_: any, row: PayrollRun) => (
        <span className="text-[11px] font-black text-white uppercase tracking-tight opacity-80">
          {row.period_start} <span className="text-tertiary mx-1">→</span> {row.period_end}
        </span>
      )
    },
    { 
      key: 'summary', 
      header: 'FINANCIAL SUMMARY',
      render: (_: any, row: PayrollRun) => <SummaryCell row={row} />
    },
    { 
      key: 'status', 
      header: 'STATUS',
      render: (v: string) => (
        <Badge 
          variant={v === 'paid' ? 'success' : v === 'draft' ? 'warning' : 'secondary'} 
          size="sm" 
          className="font-black uppercase tracking-widest text-[9px] border-none px-3"
        >
          {v}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: PayrollRun) => (
        <div className="flex justify-end gap-2">
           <button 
            onClick={() => router.push(`/dashboard/payroll/${row.id}`)}
            className="flex items-center gap-2 px-5 py-2 border border-base bg-white/5 hover:bg-primary/20 hover:border-primary/50 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all group"
          >
            Review Details
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
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
          onClick={() => setIsGenerateModalOpen(true)}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-8"
        >
          <Plus className="w-5 h-5 mr-2" />
          Initialize New Run
        </Button>
      </div>
      
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
        <div className="flex flex-wrap items-center gap-4 relative z-10">
           <div className="flex-1 min-w-[200px] flex items-center gap-4">
              <span className="text-xs font-black text-white uppercase tracking-widest whitespace-nowrap">Filter History</span>
              <div className="h-px flex-1 bg-base" />
           </div>
           <div className="flex gap-3">
              <Select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-bg-main border-base min-w-[120px]"
                options={[
                  { value: '', label: 'All Years' },
                  { value: '2024', label: '2024' },
                  { value: '2025', label: '2025' },
                  { value: '2026', label: '2026' },
                ]}
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-bg-main border-base min-w-[150px]"
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'draft', label: 'Drafts' },
                  { value: 'finalized', label: 'Finalized' },
                  { value: 'paid', label: 'Fully Paid' },
                ]}
              />
           </div>
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : payrollRuns?.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <div className="p-4 bg-white/5 rounded-full"><FileText className="w-8 h-8 text-tertiary opacity-30"/></div>
            <p className="text-tertiary font-bold uppercase tracking-widest text-sm">No payroll history found matching filters</p>
          </div>
        ) : (
          <Table columns={columns} data={payrollRuns || []} className="text-sm border-none" />
        )}
      </Card>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Initialize Payroll Run"
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
                label="PAYROLL YEAR *" type="number"
                value={generateYear.toString()}
                onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                className="bg-bg-main border-base text-white"
              />
              <Select 
                label="PAYROLL MONTH *"
                value={generateMonth.toString()}
                onChange={(e) => setGenerateMonth(parseInt(e.target.value))}
                className="bg-bg-main border-base text-white"
                options={[
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
            
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
               <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-1">Information</p>
               <p className="text-[11px] text-tertiary leading-relaxed">
                 Initializing a payroll run will prepare a draft for the selected month. You will need to click <strong>"Recalculate"</strong> in the details view to populate the staff lines.
               </p>
            </div>
        </div>
      </Modal>
    </div>
  );
}
