"use client"

import React, { useState, useEffect } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Calendar, Download, Eye, Store, Printer, MoreVertical } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { orderService } from '@/src/services/order.service';
import { branchService } from '@/src/services/branch.service';
import { Order, Branch, OrderStatus } from '@/src/types';
import toast from 'react-hot-toast';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [oData, bData] = await Promise.all([
        orderService.getAll(),
        branchService.getAll()
      ]);
      setOrders(oData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      toast.error('Failed to load orders or branches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (order.table_no || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || order.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled':
      case 'refunded': return 'error';
      case 'preparing':
      case 'confirmed': return 'warning';
      case 'ready': return 'accent' as any;
      default: return 'secondary';
    }
  };
  
  const columns = [
    { 
      key: 'id', 
      header: 'Order', 
      width: 'w-32',
      render: (value: string) => (
        <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded border border-base">
          {value.substring(0, 8).toUpperCase()}
        </span>
      )
    },
    { 
      key: 'created_at', 
      header: 'Date & Time',
      render: (value: string) => (
        <div>
          <p className="text-sm font-bold text-white">{new Date(value).toLocaleDateString()}</p>
          <p className="text-[10px] uppercase tracking-widest text-tertiary">{new Date(value).toLocaleTimeString()}</p>
        </div>
      )
    },
    { 
      key: 'branch_name', 
      header: 'Branch',
      render: (value: string, row: Order) => (
        <span className="text-tertiary text-sm">{value || row.branch || '-'}</span>
      )
    },
    { 
      key: 'table_no', 
      header: 'Table',
      render: (value: string, row: Order) => (
        <span className="text-white font-bold">{value || row.order_type.toUpperCase()}</span>
      )
    },
    {
      key: 'items',
      header: 'Items',
      render: (value: any, row: Order) => (
        <Badge variant="secondary" size="sm" className="font-bold">
          {row.items?.length || 0} PCS
        </Badge>
      )
    },
    { 
      key: 'total', 
      header: 'Total',
      render: (value: string) => (
        <span className="font-black text-accent">${Number(value).toFixed(2)}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: OrderStatus) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm" className="uppercase tracking-widest text-[10px] font-black">
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (value: any, row: Order) => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all group" title="View Details">
            <Eye className="w-4 h-4 text-tertiary group-hover:text-accent" />
          </button>
          <button 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all group" 
            title="Print Receipt"
            onClick={async () => {
              try {
                const blob = await orderService.getReceipt(row.id);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${row.id.substring(0, 8)}.pdf`;
                a.click();
              } catch (e) {
                toast.error('Failed to download receipt');
              }
            }}
          >
            <Printer className="w-4 h-4 text-tertiary group-hover:text-white" />
          </button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 italic uppercase tracking-tighter">Orders Management</h1>
          <p className="text-sm md:text-base text-tertiary">Real-time monitoring and processing of restaurant sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download className="w-5 h-5" />} className="bg-white/5 font-bold">
            Export Export
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <Input
              placeholder="Search by ID or Table..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5 text-tertiary" />}
            />
          </div>
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Branches' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button variant="outline" size="sm" icon={<Calendar className="w-5 h-5" />} fullWidth className="border-base">
            Feb 12, 2026
          </Button>
        </div>
      </div>
      
      {/* Orders Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <Table columns={columns} data={filteredOrders} />
      </Card>
      
      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-tertiary">
          Total Found: <span className="text-white font-black">{filteredOrders.length}</span> orders
        </p>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Live Syncing</span>
        </div>
      </div>
    </div>
  );
}
