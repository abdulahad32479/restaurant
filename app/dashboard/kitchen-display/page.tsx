"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from '@/src/components/DukesTabs';
import { Clock, User, RefreshCw, ChefHat, CheckCheck, PlayCircle, CheckCircle2, PackageCheck } from 'lucide-react';
import { orderService } from '@/src/services/order.service';
import { productService } from '@/src/services/product.service';
import { tableService } from '@/src/services/table.service';
import { Order } from '@/src/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  
  const fetchOrdersAndProducts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const [orderData, productData, tableData] = await Promise.all([
        orderService.getAll(), // Fetch all to be safe and filter on frontend
        productService.getAll(),
        tableService.getAll()
      ]);

      // Create maps for efficient lookup
      const pMap: Record<string, string> = {};
      productData.forEach((p: any) => { pMap[p.id] = p.name; });
      setProducts(pMap);

      const tMap: Record<string, string> = {};
      tableData.forEach((t: any) => { tMap[t.id] = t.name; });
      setTables(tMap);

      // Filter for kitchen-relevant statuses in the frontend
      const kitchenStatuses = ['draft', 'confirmed', 'preparing', 'ready', 'served'];
      const relevantOrders = orderData.filter((o: any) => kitchenStatuses.includes(o.status));

      // FIFO Sorting: Oldest First
      const sortedOrders = relevantOrders.sort((a: any, b: any) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Notify on new orders if not the first load
      if (silent && sortedOrders.length > orders.length) {
        toast.success(`New order received!`, { icon: '🔔' });
      }

      setOrders(sortedOrders);
    } catch (error) {
      console.error('Failed to fetch kitchen data', error);
      if (!silent) toast.error('Failed to load kitchen display');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersAndProducts();
    // Use a shorter interval for a more "live" feel
    const interval = setInterval(() => fetchOrdersAndProducts(true), 5000); 
    return () => clearInterval(interval);
  }, [fetchOrdersAndProducts]);
  
  const handleStatusUpdate = async (order: Order, action: 'prepare' | 'ready' | 'serve' | 'confirm' | 'complete') => {
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
  
  const getFilteredOrders = () => {
    if (activeStatus === 'all') {
      // Active view typically excludes things that are already served for kitchen staff
      return orders.filter(o => o.status !== 'served');
    }
    return orders.filter(o => o.status === activeStatus);
  };

  const filteredOrders = getFilteredOrders();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'border-[#80808050]';
      case 'confirmed': return 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.05)]';
      case 'preparing': return 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.05)]';
      case 'ready': return 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
      case 'served': return 'border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.05)]';
      default: return 'border-[#2A2A2A]';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, JSX.Element> = {
      draft: <span className="text-[#808080] bg-[#80808015] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">New</span>,
      confirmed: <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Queue</span>,
      preparing: <span className="text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Cooking</span>,
      ready: <span className="text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Ready</span>,
      served: <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Served</span>,
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
            className="w-full px-4 py-4 bg-[#404040] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#505050] transition-all active:scale-95 disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Confirm Order'}
          </button>
        );
      case 'confirmed':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'prepare')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            {isProcessing ? 'Starting...' : 'Start Cooking'}
          </button>
        );
      case 'preparing':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'ready')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-500 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isProcessing ? 'Finishing...' : 'Mark as Ready'}
          </button>
        );
      case 'ready':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'serve')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all active:scale-95 shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <PackageCheck className="w-4 h-4" />
            {isProcessing ? 'Serving...' : 'Mark as Served'}
          </button>
        );
      case 'served':
        return (
          <button 
            onClick={() => handleStatusUpdate(order, 'complete')}
            disabled={isProcessing}
            className="w-full px-4 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 transition-all active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            {isProcessing ? 'Completing...' : 'Finalize & Close'}
          </button>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-full animate-fade-in pb-10">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">Kitchen Display</h1>
            <ChefHat className="text-primary w-8 h-8" />
          </div>
          <p className="text-sm text-[#808080] font-bold uppercase tracking-widest">Real-time Order Workflow</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3]">Live Kitchen Feed</span>
             </div>
             <p className="text-[9px] text-[#808080] font-bold">Last update: {new Date().toLocaleTimeString()}</p>
          </div>
          <Tabs 
            tabs={statusTabs} 
            activeTab={activeStatus} 
            onChange={setActiveStatus}
          />
          <button 
            onClick={() => fetchOrdersAndProducts()}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#808080] hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className={`
                  bg-[#1A1A1A] border-2 ${getStatusColor(order.status)}
                  rounded-[2rem] p-6 shadow-2xl flex flex-col
                  animate-scale-in relative group transition-all hover:scale-[1.01]
                `}
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter">#{order.id.slice(-4)}</h3>
                      {getStatusLabel(order.status)}
                    </div>
                    <p className="text-xs text-[#808080] flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      {order.order_type === 'dine_in' 
                        ? (order.table ? `Table ${tables[order.table] || order.table}` : (order.table_no ? `Table ${order.table_no}` : 'Dine In')) 
                        : order.order_type.toUpperCase()
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg font-black">{formatDistanceToNow(new Date(order.created_at), { addSuffix: false })}</span>
                    </div>
                    <p className="text-[10px] text-[#808080] font-black uppercase tracking-widest">Wait Time</p>
                  </div>
                </div>
                
                <div className="flex-1 mb-6">
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div 
                        key={index}
                        className="px-4 py-3 bg-black/40 rounded-2xl border border-[#2A2A2A] flex items-center justify-between group-hover:border-[#404040] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-black">
                            {item.quantity}
                          </div>
                          <p className="text-sm text-white font-bold uppercase tracking-tight">
                            {item.product_name || products[item.product] || 'Product'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mb-6 p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#808080] mb-1">Notes</p>
                    <p className="text-xs text-white italic">"{order.notes}"</p>
                  </div>
                )}
                
                <div className="space-y-3 pt-6 border-t border-[#2A2A2A]">
                  {renderActionButtons(order)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-center bg-[#1A1A1A]/30 rounded-[3rem] border-2 border-dashed border-[#2A2A2A] animate-pulse">
            <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-8 text-5xl shadow-2xl border border-[#2A2A2A]">👨‍🍳</div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">No active orders</h3>
            <p className="text-[#808080] font-bold uppercase tracking-widest text-xs">Orders in this category will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
