"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { deliveryTripService } from '@/src/services/delivery-trip.service';
import { DispatchBoardItem, TripSuggestion } from '@/src/types';
import { MapPin, Truck, Plus, CheckCircle2, Package, Zap, Clock, MessageSquare, RefreshCw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/src/lib/utils';

export default function DispatchBoardPage() {
  const router = useRouter();
  const [boardItems, setBoardItems] = useState<DispatchBoardItem[]>([]);
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isCreateTripModalOpen, setIsCreateTripModalOpen] = useState(false);
  const [tripNotes, setTripNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [boardData, suggestionsData] = await Promise.all([
        deliveryTripService.getDispatchBoard().catch(() => []),
        deliveryTripService.getTripSuggestions().catch(() => [])
      ]);
      setBoardItems(Array.isArray(boardData) ? boardData : []);
      setSuggestions(Array.isArray(suggestionsData) ? suggestionsData : []);
    } catch (error) {
      toast.error('Failed to load dispatch data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const toggleOrderSelection = (orderId: string, route: string) => {
    if (selectedRoute && selectedRoute !== route) {
      toast.error(`Select orders from ${selectedRoute} only`);
      return;
    }

    setSelectedOrders(prev => {
      const isSelected = prev.includes(orderId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId];
      
      if (newSelection.length === 0) setSelectedRoute(null);
      else if (!selectedRoute) setSelectedRoute(route);
      
      return newSelection;
    });
  };

  const handleCreateTrip = async () => {
    if (selectedOrders.length === 0) return;
    setIsCreating(true);
    try {
      await deliveryTripService.createTrip({
        order_ids: selectedOrders,
        notes: tripNotes,
        is_custom: true
      });
      toast.success('Trip Created');
      setIsCreateTripModalOpen(false);
      setSelectedOrders([]);
      setTripNotes('');
      fetchData();
      router.push('/dashboard/delivery/trips');
    } catch (error) {
      toast.error('Failed to create trip');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendWhatsApp = async (orderId: string) => {
    try {
      await deliveryTripService.sendOrderToRiderWhatsapp(orderId);
      toast.success('Sent');
    } catch (e: any) { 
      toast.error('Rider not assigned'); 
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-primary" />
          <p className="text-xs font-bold text-tertiary uppercase tracking-widest">Updating...</p>
        </div>
      </div>
    );
  }

  const safeOrders: string[] = Array.isArray(selectedOrders) ? selectedOrders : [];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      {/* Simple Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-base shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shrink-0">
            <Truck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white uppercase tracking-tight">Dispatch Board</h1>
            <p className="text-[11px] text-tertiary font-medium uppercase tracking-widest opacity-60">Prepare delivery batches</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            className="flex-1 sm:flex-none h-11 px-6 text-[11px] font-bold uppercase tracking-widest rounded-xl"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            disabled={safeOrders.length === 0}
            onClick={() => setIsCreateTripModalOpen(true)}
            className="flex-1 sm:flex-none h-11 px-8 text-[11px] font-bold uppercase tracking-widest rounded-xl shadow-lg"
            icon={<Plus className="w-4 h-4" />}
          >
            Create Trip ({safeOrders.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Area */}
        <div className="lg:col-span-9 space-y-8">
          {boardItems.length === 0 ? (
            <div className="py-32 text-center bg-card rounded-2xl border border-dashed border-base">
              <Package className="w-12 h-12 text-tertiary/20 mx-auto mb-4" />
              <p className="text-xs font-bold text-tertiary uppercase tracking-widest">No orders ready for dispatch</p>
            </div>
          ) : (
            boardItems.map((route, idx) => (
              <div key={idx} className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <div className="flex items-center gap-3">
                     <div className="w-1 h-6 bg-primary rounded-full"></div>
                     <h2 className="text-lg font-bold text-white uppercase tracking-tight">{route.route}</h2>
                     <Badge className="text-[10px] bg-surface border-base text-tertiary px-2 py-0.5">{route.orders.length}</Badge>
                   </div>
                   <div className="flex items-center gap-2 text-primary">
                      <Zap className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Priority {route.priority_score}</span>
                   </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {route.orders.map(order => (
                    <Card 
                      key={order.id}
                      onClick={() => toggleOrderSelection(order.id, route.route)}
                      className={cn(
                        "p-5 transition-all cursor-pointer border-2 rounded-2xl relative overflow-hidden",
                        safeOrders.includes(order.id) 
                          ? 'border-primary bg-primary/5 shadow-md' 
                          : selectedRoute && selectedRoute !== route.route
                            ? 'border-base opacity-30 cursor-not-allowed grayscale'
                            : 'border-base bg-card hover:border-white/20'
                      )}
                    >
                      {safeOrders.includes(order.id) && (
                        <div className="absolute top-0 right-0 p-2">
                             <CheckCircle2 className="w-4 h-4 text-primary" />
                        </div>
                      )}

                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40 mb-1">#{order.order_number || '---'}</p>
                            <h4 className="text-sm font-bold text-white uppercase truncate">{order.delivery_info?.name}</h4>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order.id); }}
                            className="w-8 h-8 flex items-center justify-center bg-emerald-500/10 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t border-base">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-3.5 h-3.5 text-tertiary shrink-0 mt-0.5" />
                            <p className="text-[12px] text-tertiary font-medium line-clamp-2 leading-snug">{order.delivery_info?.address}</p>
                          </div>
                          
                          <div className="flex items-center justify-between pt-1">
                             <div className="flex items-center gap-1.5 text-tertiary">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold">
                                  {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                             </div>
                             <div className="flex items-center gap-1 text-[11px] font-bold text-white px-2 py-0.5 bg-surface border border-base rounded-md">
                                <Zap className="w-3 h-3 text-primary" />
                                {order.priority_score || '30'}
                             </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-3">
          <div className="sticky top-6 space-y-6">
            <div className="bg-card rounded-2xl border border-base p-6 space-y-6 shadow-sm">
              <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Smart Routing
              </h3>
              
              <div className="space-y-4">
                {suggestions.length === 0 ? (
                  <p className="text-[11px] text-tertiary italic p-4 text-center border border-dashed border-base rounded-xl">Analyzing routes...</p>
                ) : (
                  suggestions.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl bg-surface border border-base hover:border-primary/40 transition-all group">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-[10px] font-bold text-primary uppercase mb-0.5">{s.route}</p>
                          <p className="text-sm font-bold text-white uppercase">{s.total_orders} Orders</p>
                        </div>
                        <button 
                          onClick={() => { 
                            const ids = (s as any).order_ids || ((s as any).orders || []).map((o: any) => o?.id || o);
                            if (ids.length > 0) {
                              setSelectedOrders(ids); 
                              setSelectedRoute(s.route); 
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      {s.reason && <p className="text-[11px] text-tertiary font-medium opacity-60 italic">"{s.reason}"</p>}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-6 border-t border-base space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-bold text-tertiary uppercase tracking-widest opacity-60">Selection</span>
                  {safeOrders.length > 0 && (
                    <button onClick={() => { setSelectedOrders([]); setSelectedRoute(null); }} className="text-[10px] text-rose-500 font-bold hover:underline tracking-widest">CLEAR</button>
                  )}
                </div>
                
                <div className="bg-surface p-4 rounded-xl border border-base text-center">
                  <p className="text-3xl font-bold text-white">{safeOrders.length}</p>
                  <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Orders</p>
                </div>
                
                <Button 
                  variant="primary" 
                  fullWidth 
                  onClick={() => setIsCreateTripModalOpen(true)}
                  disabled={safeOrders.length === 0}
                  className="h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-primary text-black"
                >
                  Create Trip
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        title="Create Delivery Trip"
        size="md"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-surface p-5 rounded-xl border border-base flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest">Trip Manifest</p>
              <h3 className="text-base font-bold text-white uppercase">{safeOrders.length} Orders</h3>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-tertiary uppercase tracking-widest px-1">Trip Notes</p>
            <textarea 
              placeholder="e.g. Please deliver the food warm..."
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              className="w-full min-h-[100px] p-4 bg-[#0A0A0A] border border-base rounded-xl text-sm text-white focus:border-primary transition-all outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-base">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setIsCreateTripModalOpen(false)}
              className="h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleCreateTrip}
              isLoading={isCreating}
              className="h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl"
            >
              Create Trip
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
