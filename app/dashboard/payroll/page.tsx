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
      render: (_: any, row: PayrollRun) => (
        <div className="flex flex-col gap-1 text-xs text-tertiary">
          <p>Base: <span className="text-white">{formatCurrency(row.total_base_salary || 0).replace('PKR ', '')}</span></p>
          <p>Net Payable: <span className="text-accent font-bold">{formatCurrency(row.net_payable || 0)}</span></p>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right' as const,
      render: (_: any, row: PayrollRun) => (
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => router.push(`/dashboard/payroll/${row.id}`)}
          className="uppercase tracking-widest text-[10px]"
        >
          View Details
        </Button>
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
