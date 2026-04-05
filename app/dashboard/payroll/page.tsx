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
        const adds = Number(l.additions || l.total_credits || l.total_bonuses || l.total_reimbursements || 0);
        const ders = Number(
          l.deductions || 
          l.total_debits || 
          l.total_advances || 
          (Number(l.total_meal_deductions || 0) + Number(l.total_late_penalties || 0) + Number(l.total_other_deductions || 0)) || 
          0
        );
        return sum + (base + adds - ders);
     }, 0);
     
     // Prefer calculated values if summary fields are 0/missing
     finalBase = (displayBase > 0) ? displayBase : (Number(details.total_base_salary) || calBase);
     finalNet = (displayNet !== 0) ? displayNet : (details.net_payable !== undefined ? Number(details.net_payable) : calNet);
     
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
      <p>Base: <span className="text-white font-mono">{formatCurrency(finalBase || 0).replace('PKR ', '')}</span></p>
      <p>Net: <span className="text-accent font-bold font-mono">{formatCurrency(finalNet || 0)}</span></p>
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

  const { payrollRuns, isLoading, generatePayroll, isGenerating } = usePayrollRuns({
    page,
    page_size: 20,
    year: yearFilter || undefined,
    month: monthFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleGenerate = () => {
    generatePayroll({ year: generateYear, month: generateMonth }, {
      onSuccess: () => setIsGenerateModalOpen(false)
    });
  };

  const columns = [
    { 
      key: 'period', 
      header: 'Payroll Period',
      render: (_: any, row: PayrollRun) => {
        const date = new Date(row.year, row.month - 1);
        const monthName = date.toLocaleString('default', { month: 'long' });
        return (
          <div>
            <span className="font-bold text-white">{monthName} {row.year}</span>
          </div>
        )
      }
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => {
        const color = value === 'paid' ? 'success' : value === 'draft' ? 'warning' : 'secondary';
        return (
          <Badge variant={color as any} size="sm" className="uppercase text-[9px]">
            {value}
          </Badge>
        );
      }
    },
    { 
      key: 'stats', 
      header: 'Summary',
      render: (_: any, row: any) => <SummaryCell row={row} />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: PayrollRun) => (
        <div className="flex items-center gap-2 justify-end">
          {row.status === 'draft' && (
            <Button 
               variant="secondary" 
               size="sm"
               icon={<Loader2 className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />}
               onClick={() => generatePayroll({ year: row.year, month: row.month })}
               isLoading={isGenerating}
               className="p-2 aspect-square rounded-lg hover:bg-white/10"
               title="Regenerate & Recalculate"
            />
          )}
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => router.push(`/dashboard/payroll/${row.id}`)}
            className="uppercase tracking-widest text-[9px] px-4"
          >
            Details
          </Button>
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
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsGenerateModalOpen(true)}
          className="font-black uppercase tracking-tighter"
        >
          Generate Payroll
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="number"
          label="Filter Year"
          placeholder="e.g. 2026"
          value={yearFilter}
          onChange={(e) => { setYearFilter(e.target.value); setPage(1); }}
        />
        <Select
          label="Filter Month"
          value={monthFilter}
          onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Months' },
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
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'draft', label: 'Draft' },
            { value: 'finalized', label: 'Finalized' },
            { value: 'paid', label: 'Paid' },
          ]}
        />
      </div>
      
      {/* Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : payrollRuns?.results?.length === 0 ? (
           <div className="p-10 text-center text-tertiary flex flex-col items-center justify-center space-y-3">
              <FileText className="w-10 h-10 text-tertiary/50" />
              <p>No payroll runs found.</p>
           </div>
        ) : (
          <Table columns={columns} data={payrollRuns?.results || []} />
        )}
      </Card>

      <Modal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        title="Generate Payroll"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerate} isLoading={isGenerating}>Build Payroll</Button>
          </>
        }
      >
        <div className="space-y-4">
           <Input 
              label="Year" type="number"
              value={generateYear.toString()}
              onChange={(e) => setGenerateYear(parseInt(e.target.value))}
            />
            <Select 
              label="Month" 
              value={generateMonth.toString()}
              onChange={(e) => setGenerateMonth(parseInt(e.target.value))}
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
            <p className="text-xs text-tertiary pt-2">
               Generating payroll will wipe and recalculate any existing DRAFT payroll for this month. 
               It will pull all base salaries, ledger additions/deductions, and attendance logic.
            </p>
        </div>
      </Modal>
    </div>
  );
}
