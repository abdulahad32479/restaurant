
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Calendar, Download, Eye, Store, Printer, MoreVertical, PlayCircle, CheckCircle2, PackageCheck, CheckCheck, Edit, CreditCard, X, Banknote, RotateCcw, ChefHat } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { orderService } from '@/src/services/order.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { productService } from '@/src/services/product.service';
import { Order, Branch, OrderStatus } from '@/src/types';
import toast from 'react-hot-toast';
import { Modal } from '@/src/components/Modal';
import { ConfirmModal } from '@/src/components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { KitchenReceipt } from '@/src/components/KitchenReceipt';
import { useRef } from 'react';
import { localSettingsService } from '@/src/services/local-settings.service';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  
  // Payment states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Refund states
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  
  // Confirm dialog states
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<Order | null>(null);
  const [isRefundConfirmOpen, setIsRefundConfirmOpen] = useState(false);
  
  // Printing state
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  } as any);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

  // Kitchen Print State
  const kitchenReceiptRef = useRef<HTMLDivElement>(null);
  const [kitchenPrintOrder, setKitchenPrintOrder] = useState<Order | null>(null);
  const handleKitchenPrint = useReactToPrint({
    contentRef: kitchenReceiptRef,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  } as any);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orderData, productData, tableData, branchData] = await Promise.all([
        orderService.getAll(), // Fetch all to be safe and filter on frontend
        productService.getAll(1000),
        tableService.getAll(),
        branchService.getAll()
      ]);
      
      const tMap: Record<string, string> = {};
      tableData.forEach((t: any) => { tMap[t.id] = t.name; });
      setTables(tMap);

      const pMap: Record<string, string> = {};
      productData.forEach((p: any) => { pMap[p.id] = p.name; });
      setProductsMap(pMap);
      
      setOrders(orderData);
      setBranches(branchData);
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
    if (action === 'cancel') {
      setCancelConfirmOrder(order);
      return;
    }
    await executeStatusUpdate(order, action);
  };

  const executeStatusUpdate = async (order: Order, action: 'confirm' | 'cancel' | 'complete' | 'ready' | 'prepare' | 'serve') => {
    setIsUpdatingStatus(order.id);
    try {
      const payload = { ...order };
      if (action === 'confirm') await orderService.confirm(order.id, payload);
      else if (action === 'prepare') await orderService.markPreparing(order.id, payload);
      else if (action === 'ready') await orderService.markReady(order.id, payload);
      else if (action === 'serve') await orderService.markServed(order.id, payload);
      else if (action === 'complete') await orderService.complete(order.id, payload);
      else if (action === 'cancel') await orderService.cancel(order.id, { ...payload, notes: 'Cancelled from dashboard' });
      
      toast.success(`Order ${action}ed successfully`);
      fetchData();
    } catch (e: any) {
      console.error('Update status failed', e);
      toast.error('Failed to update order');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedOrder || !paymentAmount) return;
    
    try {
      setIsProcessingPayment(true);
      await orderService.addPayment(selectedOrder.id, {
        amount: paymentAmount,
        method: paymentMethod
      });
      toast.success('Payment added successfully');
      fetchData();
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRefund = async () => {
    if (!selectedOrder || !refundAmount) return;
    setIsRefundConfirmOpen(true);
  };

  const executeRefund = async () => {
    if (!selectedOrder) return;
    
    try {
      setIsProcessingRefund(true);
      await orderService.refund(selectedOrder.id, {
        amount: refundAmount,
        method: 'cash',
        notes: refundReason,
      });
      toast.success('Refund processed successfully');
      fetchData();
      setIsRefundModalOpen(false);
      setRefundAmount('');
      setRefundReason('');
      setSelectedOrder(null);
    } catch (error: any) {
      const msg = error.response?.data ? JSON.stringify(error.response.data) : 'Failed to process refund';
      toast.error(msg);
    } finally {
      setIsProcessingRefund(false);
    }
  };
  
  const filteredOrders = orders.filter(order => {
    const historyStatuses = ['completed', 'cancelled', 'refunded'];
    if (!historyStatuses.includes(order.status)) return false;

    const tableIdentifier = order.table ? (tables[order.table] || order.table) : (order.table_no || '');
    const matchesSearch = (order.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tableIdentifier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesBranch = branchFilter === 'all' || order.branch === branchFilter;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const orderDate = new Date(order.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesBranch && matchesDate;
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
      render: (value: string, row: Order) => (
        <span className="font-mono text-xs text-white bg-white/5 px-2 py-1 rounded border border-base">
          {row.order_number || value.substring(0, 8).toUpperCase()}
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
      render: (value: string, row: Order) => {
        const isActive = ['confirmed', 'preparing', 'ready', 'served'].includes(row.status);
        return (
          <span className={`font-bold ${isActive ? 'text-error flex items-center gap-1.5' : 'text-white'}`}>
            {row.order_type === 'dine_in' 
              ? (
                <>
                  {isActive && <Store className="w-3.5 h-3.5" />}
                  Table {tables[value] || row.table_no || '?'}
                </>
              )
              : row.order_type.toUpperCase()}
          </span>
        );
      }
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
      header: 'Gross Total',
      render: (value: string) => (
        <span className="font-black text-accent drop-shadow-glow-accent">Rs. {Number(value).toFixed(2)}</span>
      )
    },
    { 
      key: 'status', 
      header: 'Fulfillment Status',
      render: (value: OrderStatus) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm" className="uppercase tracking-[0.2em] text-[9px] font-black  px-3 border border-white/5 shadow-sm">
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
          {/* Quick Actions */}
          <div className="flex items-center gap-1 mr-2 px-2 border-r border-base/50">
            {['draft', 'confirmed', 'preparing', 'ready', 'served'].includes(row.status) && (
              <button 
                className="p-2 hover:bg-white/10 rounded-xl transition-all text-tertiary hover:text-white" 
                onClick={() => router.push(`/dashboard/pos?edit=${row.id}`)}
                title="Edit Order"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {['confirmed', 'preparing', 'ready', 'served', 'completed'].includes(row.status) && (Number(row.total) - Number(row.paid_amount || 0)) > 0 && (
              <button 
                className="p-2 hover:bg-success/10 rounded-xl transition-all text-success" 
                title="Quick Pay"
                onClick={() => {
                  setSelectedOrder(row);
                  setPaymentAmount((Number(row.total) - Number(row.paid_amount || 0)).toFixed(2));
                  setIsPaymentModalOpen(true);
                }}
              >
                <CreditCard className="w-4 h-4" />
              </button>
            )}

            {/* Receipt Button — available for all orders */}
            <button 
              className="p-2 hover:bg-primary/10 rounded-xl transition-all text-tertiary hover:text-primary" 
              title="Print Receipt"
              onClick={() => {
                setOrderToPrint(row);
                setTimeout(() => handlePrint(), 150);
              }}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Kitchen Receipt Button */}
            <button 
              className="p-2 hover:bg-orange-500/10 rounded-xl transition-all text-tertiary hover:text-orange-400" 
              title="Print Kitchen Ticket"
              onClick={() => {
                setKitchenPrintOrder(row);
                setTimeout(() => handleKitchenPrint(), 150);
              }}
            >
              <ChefHat className="w-4 h-4" />
            </button>

            {['draft', 'confirmed', 'preparing', 'ready', 'served'].includes(row.status) && (
              <button 
                className="p-2 hover:bg-error/10 rounded-xl transition-all text-error/60 hover:text-error" 
                title="Cancel Order"
                onClick={() => handleUpdateStatus(row, 'cancel')}
                disabled={isUpdatingStatus === row.id}
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {row.status === 'completed' && (
              <button 
                className="p-2 hover:bg-orange-500/10 rounded-xl transition-all text-orange-400/60 hover:text-orange-400" 
                title="Issue Refund"
                onClick={() => {
                  setSelectedOrder(row);
                  setRefundAmount(row.paid_amount || row.total);
                  setIsRefundModalOpen(true);
                }}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Progression Matrix */}
          {row.status === 'draft' && (
            <button 
              className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={() => handleUpdateStatus(row, 'confirm')}
              disabled={isUpdatingStatus === row.id}
            >
              Confirm
            </button>
          )}
          {row.status === 'confirmed' && (
            <button 
              className="px-4 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={() => handleUpdateStatus(row, 'prepare')}
              disabled={isUpdatingStatus === row.id}
            >
              Cook
            </button>
          )}
          {row.status === 'preparing' && (
            <button 
              className="px-4 py-2 bg-accent/10 text-accent hover:bg-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={() => handleUpdateStatus(row, 'ready')}
              disabled={isUpdatingStatus === row.id}
            >
              Ready
            </button>
          )}
          {row.status === 'ready' && (
            <button 
              className="px-4 py-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={() => handleUpdateStatus(row, 'serve')}
              disabled={isUpdatingStatus === row.id}
            >
              Serve
            </button>
          )}
          {row.status === 'served' && (
            <button 
              className="px-4 py-2 bg-success/10 text-success hover:bg-success/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all" 
              onClick={() => handleUpdateStatus(row, 'complete')}
              disabled={isUpdatingStatus === row.id}
            >
              Finalize
            </button>
          )}

          {/* Detailed View */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl leading-none">Order History</h1>
          <p className="text-[10px] md:text-xs text-[#808080] font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Real-time transaction processing
          </p>
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
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search ID or Table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5 text-tertiary" />}
          />
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
              { value: 'completed', label: 'Completed' },
              { value: 'refunded', label: 'Refunded' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mb-1.5 ml-1">Start Date</p>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              icon={<Calendar className="w-5 h-5 text-tertiary" />}
              className="bg-[#0A0A0A] border-base text-tertiary"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mb-1.5 ml-1">End Date</p>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              icon={<Calendar className="w-5 h-5 text-tertiary" />}
              className="bg-[#0A0A0A] border-base text-tertiary"
            />
          </div>
          <div className="items-end hidden sm:flex pb-1">
             {(startDate || endDate) && (
               <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }} className="h-[46px] border-base text-tertiary">
                 Clear Dates
               </Button>
             )}
          </div>
        </div>
        <div className="sm:hidden block">
           {(startDate || endDate) && (
             <Button variant="outline" fullWidth onClick={() => { setStartDate(''); setEndDate(''); }} className="border-base text-tertiary">
               Clear Dates
             </Button>
           )}
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
                        <td className="px-4 py-3 text-sm text-white font-medium">
                          {productsMap[String(item.product || '').trim()] || 
                           (item.product_name && item.product_name.toLowerCase().trim() !== 'string' ? item.product_name : null) || 
                           (typeof item.product === 'object' ? (item.product as any)?.name || (item.product as any)?.product_name : null) || 
                           'Product'}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-center">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right text-tertiary">Rs. {Number(item.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-right font-black text-accent whitespace-nowrap">
                          Rs. {Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 0))).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-base">
              <span className="text-sm font-bold text-tertiary uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-accent">Rs. {Number(selectedOrder.total).toFixed(2)}</span>
            </div>

            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-base">
              {['draft', 'confirmed', 'preparing', 'ready', 'served'].includes(selectedOrder.status) && (
                <Button 
                  variant="outline" 
                  className="bg-error/10 text-error hover:bg-error/20 border-error/50 font-black uppercase tracking-widest text-[10px]"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder, 'cancel');
                    setIsDetailsModalOpen(false);
                  }}
                  disabled={isUpdatingStatus === selectedOrder.id}
                >
                  Cancel Order
                </Button>
              )}

              {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                <Button 
                  variant="primary" 
                  className="bg-success hover:bg-success/90 text-white font-black uppercase tracking-widest text-[10px]"
                  onClick={() => {
                    setPaymentAmount((Number(selectedOrder.total) - Number(selectedOrder.paid_amount || 0)).toFixed(2));
                    setIsPaymentModalOpen(true);
                  }}
                >
                  Add Payment
                </Button>
              )}
              
              {['draft', 'confirmed', 'preparing', 'ready', 'served'].includes(selectedOrder.status) && (
                <Button 
                  variant="outline" 
                  onClick={() => router.push(`/dashboard/pos?edit=${selectedOrder.id}`)}
                >
                  Edit Order
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
              <Button 
                variant="outline" 
                icon={<Printer className="w-4 h-4" />}
                onClick={() => {
                  setOrderToPrint(selectedOrder);
                  setTimeout(() => handlePrint(), 150);
                }}
              >
                Print Receipt
              </Button>
              <Button variant="outline" onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Register Payment"
      >
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-base text-center">
             <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-tertiary mb-4 px-2">
                <span>Total: Rs. {Number(selectedOrder?.total || 0).toFixed(2)}</span>
                <span>Paid: Rs. {Number(selectedOrder?.paid_amount || 0).toFixed(2)}</span>
             </div>
             <p className="text-tertiary text-xs uppercase tracking-widest font-black mb-1">Balance Due</p>
             <p className="text-4xl font-black text-accent drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                Rs. {(Number(selectedOrder?.total || 0) - Number(selectedOrder?.paid_amount || 0)).toFixed(2)}
             </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-tertiary mb-2 uppercase tracking-[0.2em]">Payment Amount</p>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="bg-[#0A0A0A] border-base h-14 text-xl font-black"
                icon={<span className="text-tertiary font-bold">Rs.</span>}
              />
            </div>

            <div>
              <p className="text-[10px] font-black text-tertiary mb-2 uppercase tracking-[0.2em]">Method</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('cash')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'cash' ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10' : 'bg-black/40 border-base text-tertiary hover:border-tertiary/30'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Cash</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card' ? 'bg-accent/10 border-accent text-accent shadow-lg shadow-accent/10' : 'bg-black/40 border-base text-tertiary hover:border-tertiary/30'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-black text-[10px] uppercase tracking-widest">Card</span>
                </button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="animate-slide-up space-y-3">
                <p className="text-[10px] font-black text-tertiary mb-2 uppercase tracking-[0.2em]">Tendered</p>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="bg-[#0A0A0A] border-base h-12 font-black"
                />
                {Number(amountTendered) >= Number(paymentAmount) && (
                  <div className="p-4 bg-success/5 rounded-xl border border-success/20 flex justify-between items-center animate-fade-in">
                    <span className="text-[10px] font-black text-success uppercase tracking-[0.2em]">Change</span>
                    <span className="text-xl font-black text-white">Rs. {(Number(amountTendered) - Number(paymentAmount)).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setIsPaymentModalOpen(false)} className="font-black text-[10px] uppercase">Discard</Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleAddPayment}
              isLoading={isProcessingPayment}
              disabled={!paymentAmount || Number(paymentAmount) <= 0}
              className="font-black text-[10px] uppercase shadow-xl shadow-accent/20"
            >
              Complete Payment
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden Receipt for Printing */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {orderToPrint && (
          <Receipt 
            ref={receiptRef} 
            order={orderToPrint} 
            products={productsMap} 
            tables={tables}
            logoUrl={(() => {
              const bId = orderToPrint.branch;
              const b = branches.find(b => b.id === bId);
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.receipt_logo || b?.receipt_logo;
            })()}
            logoUrlBottom={(() => {
              const bId = orderToPrint.branch;
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.receipt_logo_bottom;
            })()}
            paymentAccount={(() => {
              const bId = orderToPrint.branch;
              const b = branches.find(b => b.id === bId);
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.payment_account || b?.payment_account;
            })()}
            businessName={branches.find(b => b.id === orderToPrint.branch)?.name}
            businessAddress={branches.find(b => b.id === orderToPrint.branch)?.address}
            businessPhone={branches.find(b => b.id === orderToPrint.branch)?.phone_number}
          />
        )}
        {kitchenPrintOrder && <KitchenReceipt ref={kitchenReceiptRef} order={kitchenPrintOrder} products={productsMap} />}
      </div>

      {/* Refund Modal */}
      <Modal
        isOpen={isRefundModalOpen}
        onClose={() => { setIsRefundModalOpen(false); setRefundAmount(''); setRefundReason(''); }}
        title="Issue Refund"
      >
        <div className="space-y-6">
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-5 text-center">
            <RotateCcw className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <p className="text-[10px] font-black text-orange-400/70 uppercase tracking-[0.2em] mb-1">Order Total</p>
            <p className="text-3xl font-black text-white">Rs. {Number(selectedOrder?.total || 0).toFixed(2)}</p>
            <p className="text-[10px] text-tertiary mt-1">Paid: Rs. {Number(selectedOrder?.paid_amount || 0).toFixed(2)}</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black text-tertiary mb-2 uppercase tracking-[0.2em]">Refund Amount</p>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="bg-[#0A0A0A] border-base h-14 text-xl font-black"
                icon={<span className="text-tertiary font-bold">Rs.</span>}
              />
            </div>
            <div>
              <p className="text-[10px] font-black text-tertiary mb-2 uppercase tracking-[0.2em]">Reason (Optional)</p>
              <Input
                type="text"
                placeholder="Reason for refund..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="bg-[#0A0A0A] border-base"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setIsRefundModalOpen(false)} className="font-black text-[10px] uppercase">Cancel</Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleRefund}
              isLoading={isProcessingRefund}
              disabled={!refundAmount || Number(refundAmount) <= 0}
              className="font-black text-[10px] uppercase bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20"
            >
              Process Refund
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Confirmation */}
      <ConfirmModal
        isOpen={!!cancelConfirmOrder}
        onClose={() => setCancelConfirmOrder(null)}
        onConfirm={() => {
          if (cancelConfirmOrder) {
            executeStatusUpdate(cancelConfirmOrder, 'cancel');
            setCancelConfirmOrder(null);
          }
        }}
        title="Cancel Order"
        message="Are you sure you want to cancel this order?"
        description={`Order ${cancelConfirmOrder?.id?.substring(0, 8).toUpperCase() || ''} will be cancelled. This may affect inventory and payments.`}
        confirmText="Cancel Order"
        cancelText="Go Back"
        variant="danger"
      />

      {/* Refund Confirmation */}
      <ConfirmModal
        isOpen={isRefundConfirmOpen}
        onClose={() => setIsRefundConfirmOpen(false)}
        onConfirm={() => {
          setIsRefundConfirmOpen(false);
          executeRefund();
        }}
        title="Confirm Refund"
        message={`Issue refund of Rs. ${refundAmount}?`}
        description="This action cannot be undone. The refund will be processed immediately."
        confirmText="Process Refund"
        cancelText="Go Back"
        variant="warning"
      />
    </div>
  );
}
