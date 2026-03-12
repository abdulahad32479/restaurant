"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from '@/src/components/DukesTabs';
import { Modal } from '@/src/components/Modal';
import { Clock, User, RefreshCw, ChefHat, CheckCheck, PlayCircle, CheckCircle2, PackageCheck, Printer, CreditCard, Banknote, AlertTriangle } from 'lucide-react';
import { orderService } from '@/src/services/order.service';
import { productService } from '@/src/services/product.service';
import { tableService } from '@/src/services/table.service';
import { branchService } from '@/src/services/branch.service';
import { localSettingsService } from '@/src/services/local-settings.service';
import { Order, Branch } from '@/src/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import { KitchenReceipt } from '@/src/components/KitchenReceipt';
import { useRef } from 'react';
import { formatOrderToKitchenText } from '@/src/lib/print-utils';

const statusTabs = [
  { id: 'all', label: 'Active' },
  { id: 'draft', label: 'New' },
  { id: 'confirmed', label: 'Queue' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready', label: 'Ready' },
  { id: 'served', label: 'Served' },
];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [tables, setTables] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  const [branches, setBranches] = useState<Branch[]>([]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountTendered, setAmountTendered] = useState('');
  
  // Kitchen Receipt Print State
  const kitchenReceiptRef = useRef<HTMLDivElement>(null);
  const [kitchenPrintOrder, setKitchenPrintOrder] = useState<Order | null>(null);
  const handleKitchenPrint = useReactToPrint({
    contentRef: kitchenReceiptRef,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  } as any);

  const fetchOrdersAndProducts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const { customerService } = await import('@/src/services/customer.service');
      const { userService } = await import('@/src/services/user.service');
      const [orderData, productData, tableData, customerData, userData, branchData] = await Promise.all([
        orderService.getAll(undefined, 1000), // Fetch all to be safe and filter on frontend
        productService.getAll(1000),
        tableService.getAll(),
        customerService.getAll().catch(() => []),
        userService.getAll().catch(() => []),
        branchService.getAll().catch(() => [])
      ]);

      // Create maps for efficient lookup
      const pMap: Record<string, string> = {};
      productData.forEach((p: any) => { pMap[p.id] = p.name; });
      setProducts(pMap);

      const tMap: Record<string, string> = {};
      tableData.forEach((t: any) => { tMap[t.id] = t.name; });
      setTables(tMap);

      const cMap: Record<string, string> = {};
      customerData.forEach((c: any) => { cMap[c.id || c.username] = c.name; });
      setCustomers(cMap);

      const uMap: Record<string, string> = {};
      userData.forEach((u: any) => { uMap[u.id] = u.name || u.username; });
      setUsers(uMap);
      setBranches(branchData);

      // Filter for kitchen-relevant statuses in the frontend
      const kitchenStatuses = ['draft', 'confirmed', 'preparing', 'ready', 'served'];
      const relevantOrders = orderData.filter((o: any) => kitchenStatuses.includes(o.status));

      // FIFO Sorting: Oldest First
      const sortedOrders = relevantOrders.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Notify on new orders if not the first load (only for 'confirmed' orders typically)
      if (silent && sortedOrders.length > orders.length) {
        const hasNewConfirmed = sortedOrders.some(
          (o: Order) => o.status === 'confirmed' && !orders.some(old => old.id === o.id)
        );
        if (hasNewConfirmed) {
          toast.success(`New order received!`, { icon: '🔔' });
        }
      }

      setOrders(sortedOrders);
      setBranches(branchData);
    } catch (error) {
      console.error('Failed to fetch kitchen data', error);
      if (!silent) toast.error('Failed to load kitchen display');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [orders.length]);

  useEffect(() => {
    fetchOrdersAndProducts();
    // Use a shorter interval for a more "live" feel
    const interval = setInterval(() => fetchOrdersAndProducts(true), 5000); 
    return () => clearInterval(interval);
  }, [fetchOrdersAndProducts]);
  
  const handleStatusUpdate = async (order: Order, action: 'prepare' | 'ready' | 'serve' | 'confirm' | 'complete') => {
    // Intercept complete action if order is not paid
    if (action === 'complete' && !order.is_paid) {
      setPaymentOrder(order);
      setAmountTendered('');
      setPaymentMethod('cash');
      setIsPaymentModalOpen(true);
      return;
    }

    setProcessingOrders(prev => ({ ...prev, [order.id]: true }));
    try {
      if (action === 'confirm') await orderService.confirm(order.id, order);
      else if (action === 'prepare') await orderService.markPreparing(order.id, order);
      else if (action === 'ready') await orderService.markReady(order.id, order);
      else if (action === 'serve') await orderService.markServed(order.id, order);
      else if (action === 'complete') await orderService.complete(order.id, order);
      
      toast.success(`Order ${action}d successfully`);
      await fetchOrdersAndProducts(true);
    } catch (error: any) {
      console.error(`Update (${action}) failed`, error);
      const errorData = error.response?.data;
      let errorMessage = `Failed to ${action} order`;
      
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
      setProcessingOrders(prev => ({ ...prev, [order.id]: false }));
    }
  };

  const triggerDirectPrint = async (targetOrder: Order) => {
    // 1. Identify Branch ID robustly
    const rawBranch = targetOrder.branch || (targetOrder as any).branch_id;
    let branchId = '';
    
    if (typeof rawBranch === 'object' && rawBranch !== null) {
      branchId = (rawBranch as any).id || '';
    } else if (typeof rawBranch === 'string') {
      branchId = rawBranch;
    }

    const localSettings = localSettingsService.getForBranch(branchId);
    
    if (!localSettings.direct_printing) {
      console.log('Direct printing is disabled in settings');
      return false;
    }

    try {
      toast.loading('Sending to kitchen printer...', { id: 'print-job' });
      
      const activeBranch = branches.find(b => b.id === branchId);
      const kitchenText = formatOrderToKitchenText(targetOrder, activeBranch?.name);
      
      const response = await fetch('/api/print/kitchen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: kitchenText
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to print');
      }

      toast.success('Printed successfully!', { id: 'print-job' });
      return true;
    } catch (printErr: any) {
       console.error('Silent print failed:', printErr);
       toast.error(`Silent print failed: ${printErr.message}. Falling back to manual print.`, { id: 'print-job' });
       return false;
    }
  };

  const handleProcessPayment = async () => {
    if (!paymentOrder) return;
    
    setIsUpdating(true);
    try {
      const orderTotal = parseFloat(paymentOrder.total);
      const paidAmount = parseFloat(paymentOrder.paid_amount || '0');
      const remainingBalance = orderTotal - paidAmount;
      
      let finalPayAmount = parseFloat(amountTendered || '0');
      if (paymentMethod === 'card' || finalPayAmount === 0 || finalPayAmount > remainingBalance) {
        finalPayAmount = remainingBalance;
      }

      // 1. Add Payment
      await orderService.addPayment(paymentOrder.id, {
        method: paymentMethod,
        amount: finalPayAmount.toFixed(2),
        idempotency_key: `KITCHEN-${Date.now()}`,
      });

      // 2. Complete Order
      await orderService.complete(paymentOrder.id, paymentOrder);

      toast.success('Order paid and completed!');
      setIsPaymentModalOpen(false);
      setPaymentOrder(null);
      await fetchOrdersAndProducts(true);
    } catch (error: any) {
      console.error('Payment processing failed', error);
      toast.error('Failed to process payment and complete order');
    } finally {
      setIsUpdating(false);
    }
  };

  const getFilteredOrders = () => {
    if (activeStatus === 'all') {
      // Active shows confirmed, preparing, and ready orders
      return orders.filter(o => ['confirmed', 'preparing', 'ready'].includes(o.status));
    }
    return orders.filter(o => o.status === activeStatus);
  };

  const filteredOrders = getFilteredOrders();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'border-[#80808020] bg-white/5';
      case 'confirmed': return 'border-amber-500/30 bg-amber-500/[0.02] shadow-[0_0_40px_rgba(245,158,11,0.05)]';
      case 'preparing': return 'border-blue-500/30 bg-blue-500/[0.02] shadow-[0_0_40px_rgba(59,130,246,0.05)]';
      case 'ready': return 'border-emerald-500/30 bg-emerald-500/[0.02] shadow-[0_0_40px_rgba(16,185,129,0.05)]';
      case 'served': return 'border-indigo-500/30 bg-indigo-500/[0.02] shadow-[0_0_40px_rgba(99,102,241,0.05)]';
      default: return 'border-[#2A2A2A] bg-white/5';
    }
  }

  const getWaitTimeColor = (createdAt: string) => {
    const minutes = (new Date().getTime() - new Date(createdAt).getTime()) / 60000;
    if (minutes > 20) return 'text-red-500';
    if (minutes > 10) return 'text-amber-500';
    return 'text-primary';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, JSX.Element> = {
      draft: <span className="text-[#808080] bg-[#80808010] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/5">New</span>,
      confirmed: <span className="text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/20">Queue</span>,
      preparing: <span className="text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20">Cooking</span>,
      ready: <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">Ready</span>,
      served: <span className="text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-500/20">Served</span>,
    };
    return labels[status] || null;
  };
  
  const renderActionButtons = (order: Order) => {
    const isProcessing = processingOrders[order.id];
    
    switch (order.status) {
      case 'draft':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'confirm')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-[#2A2A2A] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-[#333] transition-all active:scale-95 disabled:opacity-50 border border-white/5 shadow-xl"
          >
            {isProcessing ? 'Processing' : 'Confirm Order'}
          </button>
        );
      case 'confirmed':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'prepare')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-2xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2 border border-blue-400/20"
          >
            <PlayCircle className="w-4 h-4" />
            {isProcessing ? 'Starting' : 'Start Cooking'}
          </button>
        );
      case 'preparing':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'ready')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-500 transition-all active:scale-95 shadow-2xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 border border-emerald-400/20"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isProcessing ? 'Finishing' : 'Mark as Ready'}
          </button>
        );
      case 'ready':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'serve')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 border border-indigo-400/20"
          >
            <PackageCheck className="w-4 h-4" />
            {isProcessing ? 'Serving' : 'Mark as Served'}
          </button>
        );
      case 'served':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'complete')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {isProcessing ? 'Completing' : 'Finalize & Close'}
          </button>
        );
      default:
        return null;
    }
  };

  const renderPrintButton = (order: Order) => {
    return (
      <button 
        onClick={async () => {
          await triggerDirectPrint(order);
          // Auto-fallback removed to avoid annoying browser dialogs
        }}
        className="w-full mt-2 px-4 py-3 bg-white/5 text-primary hover:text-white font-black text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-primary/20 transition-all border border-primary/10 flex items-center justify-center gap-2"
      >
        <ChefHat className="w-3.5 h-3.5" />
        Send to Kitchen
      </button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-full animate-fade-in pb-4">
      <div className="mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <ChefHat className="text-primary w-6 h-6" />
            </div>
            <h1 className="text-lg font-black text-white uppercase tracking-tighter">Kitchen Registry</h1>
          </div>
          <p className="text-[10px] text-[#808080] font-black uppercase tracking-[0.3em] ml-1">Precision Cooking Management</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B3B3B3]">Live Stream</span>
             </div>
             <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest">Update: {new Date().toLocaleTimeString()}</p>
          </div>
          <Tabs 
            tabs={statusTabs} 
            activeTab={activeStatus} 
            onChange={setActiveStatus}
          />
          <button 
            onClick={() => fetchOrdersAndProducts()}
            className="flex items-center gap-2 group"
          >
            <div className="p-2 bg-white/5 rounded-xl border border-white/5 group-hover:bg-white/10 group-hover:border-white/10 transition-all">
              <RefreshCw className={`w-4 h-4 text-[#808080] group-hover:text-white ${isRefreshing ? 'animate-spin' : ''}`} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#808080] group-hover:text-white transition-colors">Sync</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className={`
                  flex flex-col h-[460px] rounded-[2rem] p-5 border-2 ${getStatusColor(order.status)}
                  backdrop-blur-xl shadow-2xl relative animate-scale-in transition-all overflow-hidden
                `}
              >
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-xl font-black text-white tracking-tighter">#{order.id.slice(-4).toUpperCase()}</h3>
                      {getStatusLabel(order.status)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-[#808080] font-black uppercase tracking-widest">
                       <User className="w-3.5 h-3.5 text-primary" />
                       <span className="truncate">
                        {order.order_type === 'dine_in' 
                          ? (order.table ? `TABLE ${tables[order.table] || order.table}` : (order.table_no ? `TABLE ${order.table_no}` : 'DINE IN')) 
                          : order.order_type.toUpperCase()
                        }
                       </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0">
                    <div className="text-right">
                      <div className={`flex items-center justify-end gap-1.5 mb-0.5 ${getWaitTimeColor(order.created_at)}`}>
                        <Clock className="w-4 h-4" />
                        <span className="text-xl font-black tabular-nums">
                          {Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000)}m
                        </span>
                      </div>
                      <p className="text-[9px] text-[#808080] font-black uppercase tracking-[0.2em]">Idle Time</p>
                    </div>
                  </div>
                </div>
                
                {/* Items Section - Scrollable */}
                <div className="flex-1 overflow-y-auto mb-3 pr-1 custom-scrollbar">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-white/[0.03] rounded-[1.5rem] border border-white/5 flex items-center justify-between transition-colors shadow-inner group/item hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center text-[11px] font-black shadow-lg shadow-primary/20">
                            {item.quantity}
                          </div>
                          <p className="text-xs text-white font-black uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                            {products[String(item.product || '').trim()] || 
                             (item.product_name && item.product_name.toLowerCase().trim() !== 'string' ? item.product_name : null) || 
                             (typeof item.product === 'object' ? (item.product as any)?.name || (item.product as any)?.product_name : null) || 
                             'Product'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes Section */}
                {order.notes && (
                  <div className="mb-4 p-3 bg-primary/5 border border-primary/10 rounded-2xl relative overflow-hidden group/note">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#808080] mb-1">Notes</p>
                    <p className="text-[11px] text-white  font-medium leading-normal">"{order.notes}"</p>
                  </div>
                )}
                
                {/* Action Section */}
                <div className="mt-auto space-y-4">
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        order.status === 'confirmed' ? 'w-1/4 bg-amber-500' : 
                        order.status === 'preparing' ? 'w-2/4 bg-blue-500' : 
                        order.status === 'ready' ? 'w-3/4 bg-emerald-500' : 
                        order.status === 'served' ? 'w-full bg-indigo-500' : 'w-0'
                      }`}
                    />
                  </div>
                  {renderActionButtons(order)}
                  {renderPrintButton(order)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[600px] text-center bg-white/[0.02] rounded-[4rem] border-2 border-dashed border-[#2A2A2A]">
            <div className="w-32 h-32 bg-[#1a1a1a] rounded-[2.5rem] shadow-2xl border border-white/5 flex items-center justify-center mb-10 text-6xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              👨‍🍳
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-4">The Grill is Silent</h3>
            <p className="text-[#808080] font-black uppercase tracking-[0.3em] text-xs">Awaiting fresh orders to ignite</p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => !isUpdating && setIsPaymentModalOpen(false)}
        title="Process Payment & Finalize"
        size="md"
      >
        {paymentOrder && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#808080] mb-2">Total Amount Due</p>
              <h2 className="text-4xl font-black text-white tracking-tighter">
                Rs. {(parseFloat(paymentOrder.total) - parseFloat(paymentOrder.paid_amount || '0')).toFixed(2)}
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['cash', 'card', 'other'] as const).map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300 gap-2
                    ${paymentMethod === method 
                      ? 'bg-primary/10 border-primary text-white shadow-[0_0_30px_rgba(212,175,55,0.2)]' 
                      : 'bg-white/5 border-white/5 text-[#808080] hover:bg-white/10 hover:border-white/10'
                    }
                  `}
                >
                  {method === 'cash' ? <Banknote className="w-6 h-6" /> : 
                   method === 'card' ? <CreditCard className="w-6 h-6" /> : 
                   <RefreshCw className="w-6 h-6" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                </button>
              ))}
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#808080] px-1">Amount Tendered</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] font-bold">Rs.</span>
                  <input
                    type="number"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={(parseFloat(paymentOrder.total) - parseFloat(paymentOrder.paid_amount || '0')).toFixed(2)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white font-bold focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {parseFloat(amountTendered || '0') > (parseFloat(paymentOrder.total) - parseFloat(paymentOrder.paid_amount || '0')) && (
                  <div className="flex items-center justify-between px-1 text-success animate-scale-in">
                    <span className="text-[10px] font-black uppercase tracking-widest">Change Return</span>
                    <span className="text-lg font-black">
                      Rs. {(parseFloat(amountTendered) - (parseFloat(paymentOrder.total) - parseFloat(paymentOrder.paid_amount || '0'))).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleProcessPayment}
              disabled={isUpdating}
              className={`
                w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-2 shadow-2xl
                ${isUpdating 
                  ? 'bg-white/5 text-[#444] cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-gray-100 active:scale-[0.98]'
                }
              `}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Process & Finalize Order
                </>
              )}
            </button>
          </div>
        )}
      </Modal>

      {/* Hidden Receipt for Printing */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {kitchenPrintOrder && (
          <KitchenReceipt 
            ref={kitchenReceiptRef} 
            order={kitchenPrintOrder} 
            products={products}
            tables={tables}
            customers={customers}
            users={users}
          />
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

    </div>
  );
}
