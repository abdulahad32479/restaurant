"use client"

import React, { useState } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Calendar, Download, Eye } from 'lucide-react';
import { Card } from '@/src/components/Card';

const ordersData = [
  { id: '#1248', date: '2026-02-12', time: '14:23', table: 'Table 5', items: 4, amount: '$42.50', status: 'completed', payment: 'Cash' },
  { id: '#1247', date: '2026-02-12', time: '14:15', table: 'Table 12', items: 3, amount: '$67.80', status: 'completed', payment: 'Card' },
  { id: '#1246', date: '2026-02-12', time: '14:08', table: 'Table 3', items: 9, amount: '$126.40', status: 'preparing', payment: 'Card' },
  { id: '#1245', date: '2026-02-12', time: '13:56', table: 'Table 8', items: 3, amount: '$55.40', status: 'ready', payment: 'Digital' },
  { id: '#1244', date: '2026-02-12', time: '13:42', table: 'Table 15', items: 2, amount: '$38.20', status: 'completed', payment: 'Cash' },
  { id: '#1243', date: '2026-02-12', time: '13:28', table: 'Table 6', items: 5, amount: '$78.90', status: 'completed', payment: 'Card' },
  { id: '#1242', date: '2026-02-12', time: '13:15', table: 'Table 11', items: 4, amount: '$64.30', status: 'completed', payment: 'Digital' },
  { id: '#1241', date: '2026-02-12', time: '13:02', table: 'Table 2', items: 6, amount: '$92.60', status: 'cancelled', payment: 'Card' },
];

export default function Orders() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const filteredOrders = ordersData.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         order.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.payment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });
  
  const columns = [
    { 
      key: 'id', 
      header: 'Order ID', 
      width: 'w-24',
      render: (value: string) => <span className="font-black text-white">{value}</span>
    },
    { 
      key: 'date', 
      header: 'Date & Time',
      render: (value: string, row: any) => (
        <div>
          <p className="text-sm font-bold text-white">{value}</p>
          <p className="text-[10px] uppercase tracking-widest text-tertiary">{row.time}</p>
        </div>
      )
    },
    { key: 'table', header: 'Table' },
    { key: 'items', header: 'Items', align: 'center' as const },
    { 
      key: 'amount', 
      header: 'Amount',
      render: (value: string) => (
        <span className="font-black text-accent">{value}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value as any} size="sm" className="uppercase tracking-widest text-[10px] font-black">
          {value}
        </Badge>
      )
    },
    { 
      key: 'payment', 
      header: 'Payment',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          <span className="text-sm text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
            <Eye className="w-4 h-4 text-tertiary hover:text-white" />
          </button>
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all">
            <Download className="w-4 h-4 text-tertiary hover:text-white" />
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Orders Management</h1>
          <p className="text-sm md:text-base text-tertiary">View and manage all restaurant orders</p>
        </div>
        <Button variant="accent" size="sm" icon={<Download className="w-5 h-5" />} className="text-black font-bold">
          Export Orders
        </Button>
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by ID, table, or payment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button variant="secondary" size="sm" icon={<Calendar className="w-5 h-5" />} fullWidth className="bg-white/5 border-base">
            Date Range
          </Button>
        </div>
      </div>
      
      {/* Orders Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <Table columns={columns} data={filteredOrders} />
      </Card>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-tertiary">
          Showing <span className="text-white font-bold">{filteredOrders.length}</span> of <span className="text-white font-bold">{ordersData.length}</span> orders
        </p>
        <Pagination 
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
