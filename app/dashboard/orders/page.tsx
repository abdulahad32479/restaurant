
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Calendar, Download, Eye, Store, Printer, MoreVertical, PlayCircle, CheckCircle2, PackageCheck, CheckCheck, Edit, CreditCard, X, Banknote, RotateCcw, ChefHat, History } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { orderService } from '@/src/services/order.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { productService } from '@/src/services/product.service';
import { userService } from '@/src/services/user.service';
import { Order, Branch, OrderStatus } from '@/src/types';
import apiClient, { printerClient } from '@/src/lib/axios';
import toast from 'react-hot-toast';
import { Modal } from '@/src/components/Modal';
import { ConfirmModal } from '@/src/components/ConfirmModal';
import { useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { KitchenReceipt } from '@/src/components/KitchenReceipt';
import { useRef } from 'react';
import { localSettingsService } from '@/src/services/local-settings.service';
import { formatOrderToReceiptText, formatOrderToKitchenText } from '@/src/lib/print-utils';

export default function Orders() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Record<string, string>>({});
  const [productsMap, setProductsMap] = useState<Record<string, string>>({});
  const [usersMap, setUsersMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordering, setOrdering] = useState('-created_at');
  
  // Explicit filters state
  const [orderNumberFilter, setOrderNumberFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [customerPhoneFilter, setCustomerPhoneFilter] = useState('');
  const [createdByFilter, setCreatedByFilter] = useState('');
  const [deliveryPersonFilter, setDeliveryPersonFilter] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'simplified' | 'history'>('simplified');
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

  const triggerDirectPrint = async (targetOrder: Order, printerType: 'main' | 'kitchen' | 'both' = 'both') => {
    // 1. Identify Branch ID robustly
    const rawBranch = targetOrder.branch || (targetOrder as any).branch_id;
    let branchId = '';
    
    if (typeof rawBranch === 'object' && rawBranch !== null) {
      branchId = (rawBranch as any).id || '';
    } else if (typeof rawBranch === 'string') {
      branchId = rawBranch;
    }

    const activeBranch = branches.find(b => b.id === branchId);
    const localSettings = localSettingsService.getForBranch(branchId);
    
    if (!localSettings.direct_printing) {
      console.log('Direct printing is disabled in settings');
      return false;
    }

    try {
      toast.loading('Sending to printers...', { id: 'print-job' });
      
      const printJobs = [];
      
      if (printerType === 'main' || printerType === 'both') {
        printJobs.push(
          printerClient.post('print/counter', {
            order: targetOrder,
            businessName: activeBranch?.name,
            businessAddress: activeBranch?.address,
            businessPhone: activeBranch?.phone_number
          })
        );
      }
      
      if (printerType === 'kitchen' || printerType === 'both') {
        const kitchenText = formatOrderToKitchenText(targetOrder, activeBranch?.name, tables);
        
        printJobs.push(
          printerClient.post('print/kitchen', {
            text: kitchenText
          })
        );
      }

      if (printJobs.length === 0) {
        toast.dismiss('print-job');
        return false;
      }

      await Promise.all(printJobs);
      
      toast.success('Printed successfully!', { id: 'print-job' });
      return true;
    } catch (printErr: any) {
       console.error('Silent print failed:', printErr);
       const errorMsg = printErr.response?.data?.error || printErr.message || 'Failed to print';
       toast.error(`Silent print failed: ${errorMsg}. Falling back to manual print.`, { id: 'print-job' });
       return false;
    }
  };

  const fetchData = useCallback(async (background = false) => {
    if (!background) setIsLoading(true);
    try {
      const filters: any = {
        page,
        page_size: pageSize,
        ordering,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        order_type: orderTypeFilter !== 'all' ? orderTypeFilter : undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        date: dateFilter || undefined,
        order_number: orderNumberFilter || undefined,
        customer_name: customerNameFilter || undefined,
        customer_phone: customerPhoneFilter || undefined,
        created_by: createdByFilter || undefined,
        delivery_person: deliveryPersonFilter || undefined,
      };

      // Branch filter is handled slightly differently if it's 'all'
      // If we had a specific branch field in OrderFilters, we'd use it here.
      // Based on previous code, we might need a branch-specific endpoint or filter.
      
      const [orderResponse, productData, tableData, branchData, userData] = await Promise.all([
        orderService.getAll(filters),
        productService.getAll(1000),
        tableService.getAll(),
        branchService.getAll(),
        userService.getAll()
      ]);
      
      const tMap: Record<string, string> = {};
      tableData.forEach((t: any) => { tMap[t.id] = t.name; });
      setTables(tMap);

      const pMap: Record<string, string> = {};
      productData.forEach((p: any) => { pMap[p.id] = p.name; });
      setProductsMap(pMap);
      
      const uMap: Record<string, string> = {};
      userData.forEach((u: any) => { uMap[u.id] = u.username; });
      setUsersMap(uMap);
      
      if (orderResponse && orderResponse.results) {
        setOrders(orderResponse.results);
        setTotalOrders(orderResponse.count || 0);
      } else if (Array.isArray(orderResponse)) {
        setOrders(orderResponse);
        setTotalOrders(orderResponse.length);
      } else {
        setOrders([]);
        setTotalOrders(0);
      }
      
      setBranches(branchData);
    } catch (error) {
      console.error('Failed to fetch orders', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [
    page, pageSize, ordering, searchQuery, statusFilter, orderTypeFilter, 
    startDate, endDate, startTime, endTime, dateFilter, 
    orderNumberFilter, customerNameFilter, customerPhoneFilter, 
    createdByFilter, deliveryPersonFilter
  ]);

  useEffect(() => {
    fetchData();
    
    // Background polling every 30 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000);
    
    return () => clearInterval(interval);
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
  
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setBranchFilter('all');
    setOrderTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setStartTime('');
    setEndTime('');
    setDateFilter('');
    setOrderNumberFilter('');
    setCustomerNameFilter('');
    setCustomerPhoneFilter('');
    setCreatedByFilter('');
    setDeliveryPersonFilter('');
    setPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    searchQuery, statusFilter, orderTypeFilter, startDate, endDate, 
    startTime, endTime, dateFilter, orderNumberFilter, 
    customerNameFilter, customerPhoneFilter, createdByFilter, deliveryPersonFilter
  ]);

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
      key: 'created_by_name',
      header: 'Created By',
      render: (value: string, row: Order) => {
        const creatorId = row.created_by;
        const creatorName = creatorId ? (usersMap[creatorId] || creatorId) : 'System';
        return (
          <span className="text-tertiary text-xs bg-white/5 px-2 py-1 rounded border border-white/5">{creatorName}</span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: OrderStatus) => (
        <Badge variant={getStatusBadgeVariant(value)} size="sm" className="uppercase tracking-[0.2em] text-[9px] font-black  px-3 border border-white/5 shadow-sm">
          {value.replace('_', ' ')}
        </Badge>
      )
    },
    { 
      key: 'total', 
      header: 'Total Amount',
      render: (value: string) => (
        <span className="font-black text-accent drop-shadow-glow-accent">Rs. {Number(value).toFixed(2)}</span>
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
              onClick={() => triggerDirectPrint(row, 'main')}
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Kitchen Receipt Button */}
            <button 
              className="p-2 hover:bg-orange-500/10 rounded-xl transition-all text-tertiary hover:text-orange-400" 
              title="Send to Kitchen"
              onClick={() => triggerDirectPrint(row, 'kitchen')}
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
              setModalViewMode('simplified');
              setIsDetailsModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4 text-tertiary group-hover:text-accent" />
          </button>

        </div>
      )
    }
  ];

  // Removed top-level full page loading blocker so filters don't unmount and lose focus
  
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Universal Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5 text-tertiary" />}
          />
          <Input
            placeholder="Order #"
            value={orderNumberFilter}
            onChange={(e) => setOrderNumberFilter(e.target.value)}
          />
          <Input
            placeholder="Customer Name"
            value={customerNameFilter}
            onChange={(e) => setCustomerNameFilter(e.target.value)}
          />
          <Input
            placeholder="Phone"
            value={customerPhoneFilter}
            onChange={(e) => setCustomerPhoneFilter(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'preparing', label: 'Preparing' },
              { value: 'ready', label: 'Ready' },
              { value: 'served', label: 'Served' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
          <Select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'dine_in', label: 'Dine In' },
              { value: 'takeaway', label: 'Takeaway' },
              { value: 'delivery', label: 'Delivery' },
            ]}
          />
           <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Branches' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <Input
            placeholder="Created By"
            value={createdByFilter}
            onChange={(e) => setCreatedByFilter(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex-1">
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mb-1.5 ml-1">Start Time</p>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-[#0A0A0A] border-base text-tertiary"
            />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mb-1.5 ml-1">End Time</p>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-[#0A0A0A] border-base text-tertiary"
            />
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <Button 
            variant="outline" 
            onClick={resetFilters} 
            className="border-base text-tertiary hover:text-white"
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Filters
          </Button>
        </div>
      
      {/* Orders Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 relative min-h-[400px]">
        {isLoading && orders.length === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {isLoading && (
               <div className="absolute top-0 left-0 w-full h-1 bg-white/5 overflow-hidden z-20">
                  <div className="h-full bg-primary animate-pulse w-1/3 rounded-full" />
               </div>
            )}
            <Table columns={columns} data={orders} />
          </>
        )}
      </Card>
      
      {/* Footer Info & Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-secondary/50 border border-base p-6 rounded-2xl">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-tertiary uppercase tracking-widest font-black">
            Total Orders Found: <span className="text-white drop-shadow-glow-accent">{totalOrders}</span>
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#808080]">Real-time API Link</span>
          </div>
        </div>

        {totalOrders > pageSize && (
          <Pagination 
            currentPage={page} 
            totalPages={Math.ceil(totalOrders / pageSize)} 
            onPageChange={(p) => setPage(p)} 
          />
        )}
        
        <div className="flex items-center gap-4">
           <p className="text-[10px] text-tertiary uppercase font-black tracking-widest">Show</p>
           <select 
             value={pageSize} 
             onChange={(e) => setPageSize(Number(e.target.value))}
             className="bg-black/40 border border-base rounded-lg text-xs font-black text-white px-3 py-2 outline-none focus:border-accent transition-all"
           >
             <option value={20}>20</option>
             <option value={50}>50</option>
             <option value={100}>100</option>
           </select>
        </div>
      </div>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => { setIsDetailsModalOpen(false); setSelectedOrder(null); }}
        title={`${modalViewMode === 'history' ? 'Order Edit History' : 'Order Details'} - ${selectedOrder?.id.substring(0, 8).toUpperCase()}`}
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

            {/* Order Timeline */}
            <div className="bg-white/5 p-4 rounded-xl border border-base">
              <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px]">Order Timeline</h4>
              <div className="flex flex-wrap gap-4 text-[9px] uppercase tracking-tighter">
                <div className="flex flex-col gap-1">
                  <span className="text-tertiary">Created</span>
                  <span className="text-white font-bold">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#606060]">Updated</span>
                  <span className="text-white font-bold">{new Date(selectedOrder.updated_at).toLocaleString()}</span>
                </div>
                {selectedOrder.confirmed_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-primary">Confirmed</span>
                    <span className="text-white font-bold">{new Date(selectedOrder.confirmed_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.preparing_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-orange-400">Preparing</span>
                    <span className="text-white font-bold">{new Date(selectedOrder.preparing_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.ready_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-accent">Ready</span>
                    <span className="text-white font-bold">{new Date(selectedOrder.ready_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.served_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-indigo-400">Served</span>
                    <span className="text-white font-bold">{new Date(selectedOrder.served_at).toLocaleString()}</span>
                  </div>
                )}
                {selectedOrder.completed_at && (
                  <div className="flex flex-col gap-1">
                    <span className="text-success">Completed</span>
                    <span className="text-white font-bold">{new Date(selectedOrder.completed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-white uppercase tracking-widest text-xs">
                  {modalViewMode === 'history' ? 'Transaction Audit Log' : 'Order Items'}
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setModalViewMode(modalViewMode === 'simplified' ? 'history' : 'simplified')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-black uppercase tracking-widest ${
                      modalViewMode === 'history' 
                        ? 'bg-amber-500/10 border-amber-500/50 text-amber-400' 
                        : 'bg-white/5 border-base text-tertiary hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {modalViewMode === 'history' ? (
                      <>
                        <Eye className="w-3 h-3" />
                        View Items
                      </>
                    ) : (
                      <>
                        <History className="w-3 h-3" />
                        View History
                      </>
                    )}
                  </button>
                  {modalViewMode === 'history' && (
                    <Badge variant="accent" size="sm" className="text-[9px] uppercase tracking-widest px-3 border border-accent/20">Audit Trail Active</Badge>
                  )}
                </div>
              </div>
              <div className="bg-bg-main border border-base rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary">Item</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-center">Qty</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-center">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-right">Price</th>
                      <th className="px-4 py-3 text-xs font-bold text-tertiary text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base/50">
                    {(() => {
                      const items = selectedOrder.items || [];
                      
                      if (modalViewMode === 'simplified') {
                        // INTEGRATED AGGREGATION LOGIC
                        const grouped: Record<string, any> = {};
                        items.forEach((item: any) => {
                          const pId = String(item.product || '').trim();
                          if (!grouped[pId]) {
                            grouped[pId] = { 
                              ...item, 
                              originalQty: 0, 
                              addedQty: 0, 
                              voidedQty: 0, 
                              finalQty: 0,
                              finalTotal: 0 
                            };
                          }
                          const qty = Number(item.quantity || 0);
                          const price = Number(item.total_price || (Number(item.unit_price || 0) * qty));
                          const action = item.action || 'original';
                          
                          if (action === 'original') grouped[pId].originalQty += qty;
                          else if (action === 'addition') grouped[pId].addedQty += qty;
                          else if (action === 'void') grouped[pId].voidedQty += qty;

                          if (action === 'void') {
                            grouped[pId].finalQty -= qty;
                            grouped[pId].finalTotal -= price;
                          } else {
                            grouped[pId].finalQty += qty;
                            grouped[pId].finalTotal += price;
                          }
                        });

                        return Object.values(grouped).filter(g => g.finalQty > 0 || g.voidedQty > 0).map((item: any, idx: number) => (
                           <tr key={idx} className="hover:bg-white/5 group/row">
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm text-white font-medium">
                                  {productsMap[String(item.product || '').trim()] || 
                                   (item.product_name && item.product_name.toLowerCase().trim() !== 'string' ? item.product_name : null) || 
                                   'Product'}
                                </span>
                                {(item.addedQty > 0 || item.voidedQty > 0) && (
                                  <div className="flex gap-2 mt-1">
                                    {item.originalQty > 0 && <span className="text-[8px] text-tertiary uppercase font-bold">Orig: {item.originalQty}</span>}
                                    {item.addedQty > 0 && <span className="text-[8px] text-accent font-bold uppercase">+{item.addedQty} Added</span>}
                                    {item.voidedQty > 0 && <span className="text-[8px] text-error font-bold uppercase">-{item.voidedQty} Voided</span>}
                                  </div>
                                )}
                              </div>
                            </td>
                             <td className="px-4 py-3 text-sm font-black text-center text-white">x{item.finalQty}</td>
                             <td className="px-4 py-3 text-center">
                               {item.finalQty > 0 ? (
                                 <Badge variant="secondary" size="sm" className="text-[8px] uppercase">Current</Badge>
                               ) : (
                                 <Badge variant="error" size="sm" className="text-[8px] uppercase">Removed</Badge>
                               )}
                             </td>
                             <td className="px-4 py-3 text-sm text-right text-tertiary">Rs. {Number(item.unit_price || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right font-black text-accent whitespace-nowrap">
                              Rs. {Number(item.finalTotal).toFixed(2)}
                            </td>
                          </tr>
                        ));
                      }

                      // DETAILED LOG VIEW (Showing additions and voids)
                      return items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-4 py-3 text-sm text-white font-medium">
                            {productsMap[String(item.product || '').trim()] || 
                             (item.product_name && item.product_name.toLowerCase().trim() !== 'string' ? item.product_name : null) || 
                             'Product'}
                          </td>
                           <td className="px-4 py-3 text-sm font-bold text-center">{item.quantity}</td>
                           <td className="px-4 py-3 text-center">
                             <Badge variant={item.action === 'void' ? 'error' : item.action === 'addition' ? 'accent' as any : 'secondary'} size="sm" className="text-[8px] uppercase">
                               {item.action === 'addition' ? 'Added' : item.action === 'void' ? 'Voided' : 'Original'}
                             </Badge>
                           </td>
                           <td className="px-4 py-3 text-sm text-right text-tertiary">Rs. {Number(item.unit_price || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-black text-accent whitespace-nowrap">
                            Rs. {Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 0))).toFixed(2)}
                          </td>
                        </tr>
                      ));
                    })()}
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
                onClick={() => triggerDirectPrint(selectedOrder)}
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
        {kitchenPrintOrder && (
          <KitchenReceipt 
            ref={kitchenReceiptRef} 
            order={kitchenPrintOrder} 
            products={productsMap} 
            tables={tables}
          />
        )}
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
