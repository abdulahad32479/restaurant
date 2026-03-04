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
import { Modal } from '@/src/components/Modal';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

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

  const handleUpdateStatus = async (orderId: string, action: 'confirm' | 'cancel' | 'complete' | 'ready') => {
    setIsUpdatingStatus(orderId);
    try {
      if (action === 'confirm') await orderService.confirmPost(orderId);
      if (action === 'cancel') await orderService.cancelPost(orderId, 'Cancelled from dashboard');
      if (action === 'complete') await orderService.completePost(orderId);
      if (action === 'ready') await orderService.markReadyPost(orderId);
      toast.success(`Order ${action}d successfully`);
      fetchData();
    } catch (e) {
      toast.error(`Failed to ${action} order`);
    } finally {
      setIsUpdatingStatus(null);
    }
  };
  
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
          {row.status === 'draft' && (
            <button 
              className="p-1.5 hover:bg-success/10 rounded-lg transition-all text-success" 
              title="Confirm Order"
              onClick={() => handleUpdateStatus(row.id, 'confirm')}
              disabled={isUpdatingStatus === row.id}
            >
              Confirm
            </button>
          )}
          {row.status === 'confirmed' && (
            <button 
              className="p-1.5 hover:bg-accent/10 rounded-lg transition-all text-accent" 
              title="Mark Ready"
              onClick={() => handleUpdateStatus(row.id, 'ready')}
              disabled={isUpdatingStatus === row.id}
            >
              Ready
            </button>
          )}
          {row.status === 'ready' && (
            <button 
              className="p-1.5 hover:bg-success/10 rounded-lg transition-all text-success font-bold" 
              title="Complete Order"
              onClick={() => handleUpdateStatus(row.id, 'complete')}
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

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedOrder(null); }}
        title={`Order Details - ${selectedOrder?.id.substring(0, 8).toUpperCase()}`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-base">
                <p className="text-xs text-tertiary uppercase tracking-widest mb-1">Customer / Table</p>
                <p className="font-bold text-white text-lg">{selectedOrder.table_no || selectedOrder.order_type.toUpperCase()}</p>
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
                        <td className="px-4 py-3 text-sm text-white">{item.product_name || item.product}</td>
                        <td className="px-4 py-3 text-sm font-bold text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-tertiary">${Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-accent">
                          ${Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 0))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {!selectedOrder.items?.length && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-tertiary italic text-sm">No items found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-base">
              <span className="text-sm font-bold text-tertiary uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-accent">${Number(selectedOrder.total).toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-base">
              {['draft', 'confirmed', 'ready'].includes(selectedOrder.status) && (
                <Button 
                  variant="outline" 
                  className="bg-error/10 text-error hover:bg-error/20 border-error/20"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, 'cancel');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Cancel Order
                </Button>
              )}
              {selectedOrder.status === 'draft' && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, 'confirm');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Confirm Order
                </Button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, 'ready');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Mark Ready
                </Button>
              )}
              {selectedOrder.status === 'ready' && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, 'complete');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Complete Order
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
