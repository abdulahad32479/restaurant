"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from '@/src/components/DukesTabs';
import { Clock, User, CheckCircle2 as CheckCircle, RefreshCw, ChefHat } from 'lucide-react';
import { orderService } from '@/src/services/order.service';
import { productService } from '@/src/services/product.service';
import { Order, OrderStatus } from '@/src/types';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

const statusTabs = [
  { id: 'all', label: 'All active' },
  { id: 'draft', label: 'New' },
  { id: 'confirmed', label: 'Queue' },
  { id: 'preparing', label: 'Cooking' },
  { id: 'ready', label: 'Ready' },
];

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeStatus, setActiveStatus] = useState('all');
  const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
  
  const fetchOrdersAndProducts = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      // Fetch only relevant statuses for kitchen
      const kitchenStatuses = 'draft,confirmed,preparing,ready,served';
      const [orderData, productData] = await Promise.all([
        orderService.getAll(kitchenStatuses),
        productService.getAll()
      ]);

      // Create product name map
      const pMap: Record<string, string> = {};
      productData.forEach((p: any) => { pMap[p.id] = p.name; });
      setProducts(pMap);

      setOrders(orderData);
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
    const interval = setInterval(() => fetchOrdersAndProducts(true), 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchOrdersAndProducts]);
  
  const handleStatusUpdate = async (order: Order, action: 'prepare' | 'ready' | 'serve' | 'confirm') => {
    setProcessingOrders(prev => ({ ...prev, [order.id]: true }));
    try {

      if (action === 'confirm') {
        await orderService.confirmPost(order.id);
      } else if (action === 'prepare') {
        await orderService.markPreparingPost(order.id);
      } else if (action === 'ready') {
        await orderService.markReadyPost(order.id);
      } else if (action === 'serve') {
        await orderService.markServedPost(order.id);
      }
      
      toast.success(`Order ${action}ed!`);
      await fetchOrdersAndProducts(true);
    } catch (error: any) {
      console.error(`Update (${action}) failed`, error);
      const errorData = error.response?.data;
      let errorMessage = `Failed to ${action} order`;
      
      if (typeof errorData === 'string' && !errorData.includes('<!doctype html>')) {
        errorMessage = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join(', ');
      }
      
      toast.error(errorMessage);
    } finally {
      setProcessingOrders(prev => ({ ...prev, [order.id]: false }));
    }
  };
  
  const filteredOrders = activeStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeStatus);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'border-[#80808050]';
      case 'confirmed': return 'border-[#F59E0B50] shadow-[0_0_20px_rgba(245,158,11,0.05)]';
      case 'preparing': return 'border-[#3B82F650] shadow-[0_0_20px_rgba(59,130,246,0.05)]';
      case 'ready': return 'border-[#10B98150] shadow-[0_0_20px_rgba(16,185,129,0.05)]';
      default: return 'border-[#2A2A2A]';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return <span className="text-[#808080] bg-[#80808015] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Received</span>;
      case 'confirmed': return <span className="text-[#F59E0B] bg-[#F59E0B15] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">In Queue</span>;
      case 'preparing': return <span className="text-[#3B82F6] bg-[#3B82F615] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Cooking</span>;
      case 'ready': return <span className="text-[#10B981] bg-[#10B98115] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Ready</span>;
      default: return null;
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
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">Kitchen Display</h1>
            <ChefHat className="text-primary w-8 h-8" />
          </div>
          <p className="text-sm text-[#808080] font-bold uppercase tracking-widest">Real-time Order Processing</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
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
      
      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className={`
                  bg-[#1A1A1A] border-2 ${getStatusColor(order.status)}
                  rounded-[2rem] p-6 shadow-2xl flex flex-col
                  animate-scale-in relative group transition-all hover:scale-[1.02]
                `}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter">#{order.id.slice(-4)}</h3>
                      {getStatusLabel(order.status)}
                    </div>
                    <p className="text-xs text-[#808080] flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <User className="w-3.5 h-3.5" />
                      {order.order_type === 'dine_in' ? `Table ${order.table_no || order.table || '?'}` : order.order_type.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-lg font-black">{formatDistanceToNow(new Date(order.created_at), { addSuffix: false })}</span>
                    </div>
                    <p className="text-[10px] text-[#808080] font-black uppercase tracking-widest">Elapsed</p>
                  </div>
                </div>
                
                {/* Order Items */}
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
                    <p className="text-[9px] font-black uppercase tracking-widest text-[#808080] mb-1">Special Instructions</p>
                    <p className="text-xs text-white italic">"{order.notes}"</p>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="space-y-3 pt-6 border-t border-[#2A2A2A]">
                  {order.status === 'draft' && (
                    <button 
                      onClick={() => handleStatusUpdate(order, 'confirm')}
                      disabled={processingOrders[order.id]}
                      className="w-full px-4 py-4 bg-[#808080] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#999] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrders[order.id] ? 'Confirming...' : 'Confirm Order'}
                    </button>
                  ) || order.status === 'confirmed' && (
                    <button 
                      onClick={() => handleStatusUpdate(order, 'prepare')}
                      disabled={processingOrders[order.id]}
                      className="w-full px-4 py-4 bg-[#3B82F6] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#3B82F6]/90 transition-all active:scale-95 shadow-lg shadow-[#3B82F6]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrders[order.id] ? 'Starting...' : 'Start Cooking'}
                    </button>
                  ) || order.status === 'preparing' && (
                    <button 
                      onClick={() => handleStatusUpdate(order, 'ready')}
                      disabled={processingOrders[order.id]}
                      className="w-full px-4 py-4 bg-[#10B981] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-[#10B981]/90 transition-all active:scale-95 shadow-lg shadow-[#10B981]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrders[order.id] ? 'Finalizing...' : 'Mark as Ready'}
                    </button>
                  ) || order.status === 'ready' && (
                    <button 
                      onClick={() => handleStatusUpdate(order, 'serve')}
                      disabled={processingOrders[order.id]}
                      className="w-full px-4 py-4 bg-white text-black font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-white/90 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingOrders[order.id] ? (
                        'Completing...'
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Complete & Serve
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[500px] text-center bg-[#1A1A1A]/30 rounded-[3rem] border-2 border-dashed border-[#2A2A2A] animate-pulse">
            <div className="w-24 h-24 bg-[#1A1A1A] rounded-full flex items-center justify-center mb-8 text-5xl shadow-2xl border border-[#2A2A2A]">👨‍🍳</div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">Kitchen is Clear</h3>
            <p className="text-[#808080] font-bold uppercase tracking-widest text-xs">All caught up! New orders will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
