"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Calendar, Download, Eye, Store, Printer, MoreVertical, PlayCircle, CheckCircle2, PackageCheck, CheckCheck } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { orderService } from '@/src/services/order.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { Order, Branch, OrderStatus } from '@/src/types';
import toast from 'react-hot-toast';
import { Modal } from '@/src/components/Modal';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [oData, bData, tData] = await Promise.all([
        orderService.getAll(),
        branchService.getAll(),
        tableService.getAll()
      ]);
      
      const tMap: Record<string, string> = {};
      tData.forEach((t: any) => { tMap[t.id] = t.name; });
      setTables(tMap);
      
      setOrders(oData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdateStatus = async (order: Order, action: 'confirm' | 'cancel' | 'complete' | 'ready' | 'prepare' | 'serve') => {
    setIsUpdatingStatus(order.id);
    try {
      const payload = { ...order };
      if (action === 'confirm') await orderService.confirm(order.id, payload);
      else if (action === 'prepare') await orderService.markPreparing(order.id, payload);
      else if (action === 'ready') await orderService.markReady(order.id, payload);
      else if (action === 'serve') await orderService.markServed(order.id, payload);
      else if (action === 'complete') await orderService.complete(order.id, payload);
      else if (action === 'cancel') await orderService.cancel(order.id, { ...payload, notes: 'Cancelled from dashboard' });
      
      toast.success(`Order updated successfully`);
      fetchData();
    } catch (e: any) {
      console.error('Update status failed', e);
      const errorData = e.response?.data;
      let errorMessage = `Failed to update order`;
      
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) errorMessage = errorData.detail;
        else errorMessage = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join(' | ');
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(null);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    const tableIdentifier = order.table ? (tables[order.table] || order.table) : (order.table_no || '');
    const matchesSearch = (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tableIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || order.branch === branchFilter;
    return matchesSearch && matchesStatus && matchesBranch;
  });

  const getStatusBadgeVariant = (status: OrderStatus) => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled':
      case 'refunded': return 'error';
      case 'preparing': return 'warning';
      case 'confirmed': return 'warning';
      case 'ready': return 'accent' as any;
      case 'served': return 'secondary';
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
      key: 'table', 
      header: 'Table / Type',
      render: (value: string, row: Order) => (
        <span className="text-white font-bold">
          {row.order_type === 'dine_in' 
            ? `Table ${tables[value] || row.table_no || '?'}` 
            : row.order_type.toUpperCase()}
        </span>
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
          {row.status === 'draft' && (
            <button 
              className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-tertiary hover:text-white" 
              onClick={() => handleUpdateStatus(row, 'confirm')}
              disabled={isUpdatingStatus === row.id}
            >
              Confirm
            </button>
          )}
          {row.status === 'confirmed' && (
            <button 
              className="p-1.5 hover:bg-blue-500/10 rounded-lg transition-all text-blue-400" 
              onClick={() => handleUpdateStatus(row, 'prepare')}
              disabled={isUpdatingStatus === row.id}
            >
              Cook
            </button>
          )}
          {row.status === 'preparing' && (
            <button 
              className="p-1.5 hover:bg-accent/10 rounded-lg transition-all text-accent" 
              onClick={() => handleUpdateStatus(row, 'ready')}
              disabled={isUpdatingStatus === row.id}
            >
              Ready
            </button>
          )}
          {row.status === 'ready' && (
            <button 
              className="p-1.5 hover:bg-indigo-500/10 rounded-lg transition-all text-indigo-400" 
              onClick={() => handleUpdateStatus(row, 'serve')}
              disabled={isUpdatingStatus === row.id}
            >
              Serve
            </button>
          )}
          {row.status === 'served' && (
            <button 
              className="p-1.5 hover:bg-success/10 rounded-lg transition-all text-success font-bold" 
              onClick={() => handleUpdateStatus(row, 'complete')}
              disabled={isUpdatingStatus === row.id}
            >
              Complete
            </button>
          )}
          
          <button 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all group" 
            title="View Details"
            onClick={() => {
              setSelectedOrder(row);
              setIsDetailsModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4 text-tertiary group-hover:text-accent" />
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
          <p className="text-sm md:text-base text-tertiary">Monitor and process restaurant transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Download className="w-5 h-5" />} 
            className="bg-white/5 font-bold"
            onClick={() => toast.error('Export service coming soon')}
          >
            Export
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <Input
              placeholder="Search ID or Table..."
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
              { value: 'draft', label: 'New' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
              { value: 'served', label: 'Served' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Button variant="outline" size="sm" icon={<Calendar className="w-5 h-5" />} fullWidth className="border-base">
            Today
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

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedOrder(null); }}
        title={`Order - ${selectedOrder?.id.substring(0, 8).toUpperCase()}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-base">
                <p className="text-xs text-tertiary uppercase tracking-widest mb-1">Customer / Table</p>
                <p className="font-bold text-white text-lg">
                  {selectedOrder.order_type === 'dine_in' 
                    ? `Table ${tables[selectedOrder.table || ''] || selectedOrder.table_no || '?'}` 
                    : selectedOrder.order_type.toUpperCase()}
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-base">
                <p className="text-xs text-tertiary uppercase tracking-widest mb-1">Status</p>
                <Badge variant={getStatusBadgeVariant(selectedOrder.status)}>
                  {selectedOrder.status.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-xs">Order Items</h4>
              <div className="bg-bg-main border border-base rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary">Item</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-center">Qty</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-right">Price</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base/50">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/5">
                        <td className="px-4 py-3 text-sm text-white font-medium">{item.product_name || item.product}</td>
                        <td className="px-4 py-3 text-sm font-bold text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-tertiary">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-accent">
                          ${Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 0))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-base">
              <span className="text-sm font-bold text-tertiary uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-accent">${Number(selectedOrder.total).toFixed(2)}</span>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-base">
              {['draft', 'confirmed', 'preparing', 'ready', 'served'].includes(selectedOrder.status) && (
                <Button 
                  variant="outline" 
                  className="bg-error/10 text-error hover:bg-error/20 border-error/20"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder, 'cancel');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Cancel Order
                </Button>
              )}
              
              {selectedOrder.status === 'draft' && (
                <Button variant="primary" onClick={() => { handleUpdateStatus(selectedOrder, 'confirm'); setIsDetailsModalOpen(false); }}>
                  Confirm Order
                </Button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button variant="primary" onClick={() => { handleUpdateStatus(selectedOrder, 'prepare'); setIsDetailsModalOpen(false); }}>
                   Start Cooking
                </Button>
              )}
              {selectedOrder.status === 'preparing' && (
                <Button variant="primary" onClick={() => { handleUpdateStatus(selectedOrder, 'ready'); setIsDetailsModalOpen(false); }}>
                  Mark Ready
                </Button>
              )}
              {selectedOrder.status === 'ready' && (
                <Button variant="primary" onClick={() => { handleUpdateStatus(selectedOrder, 'serve'); setIsDetailsModalOpen(false); }}>
                  Mark Served
                </Button>
              )}
              {selectedOrder.status === 'served' && (
                <Button variant="primary" onClick={() => { handleUpdateStatus(selectedOrder, 'complete'); setIsDetailsModalOpen(false); }}>
                   Finalize Order
                </Button>
              )}
              
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
