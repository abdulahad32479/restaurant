"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Input, Select } from '@/src/components/Input';
import { deliveryTripService } from '@/src/services/delivery-trip.service';
import { Order, DispatchBoardItem, DeliveryPerson, TripSuggestion } from '@/src/types';
import { MapPin, Truck, Plus, CheckCircle2, Package, Search, LayoutDashboard, Send, Zap, Clock, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import apiClient from '@/src/lib/axios';

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
      console.error('Failed to fetch dispatch board', error);
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
      toast.error(`One trip can only contain orders from the SAME route (${selectedRoute})`);
      return;
    }

    setSelectedOrders(prev => {
      const isSelected = prev.includes(orderId);
      const newSelection = isSelected 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId];
      
      // Update selected route
      if (newSelection.length === 0) setSelectedRoute(null);
      else if (!selectedRoute) setSelectedRoute(route);
      
      return newSelection;
    });
  };

  const handleCreateTrip = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order');
      return;
    }
    setIsCreating(true);
    try {
      await deliveryTripService.createTrip({
        order_ids: selectedOrders,
        notes: tripNotes,
        is_custom: true
      });
      toast.success('Trip created successfully');
      setIsCreateTripModalOpen(false);
      setSelectedOrders([]);
      setTripNotes('');
      fetchData();
      router.push('/dashboard/delivery/trips');
    } catch (error) {
      console.error('Failed to create trip', error);
      toast.error('Failed to create trip');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSendWhatsApp = async (orderId: string) => {
    try {
      await deliveryTripService.sendOrderToRiderWhatsapp(orderId);
      toast.success('Signal Transmitted to Rider');
    } catch (e: any) { 
      const msg = e.response?.data?.error || e.message || 'Transmission Failed';
      toast.error(msg === 'Order has no assigned rider' ? 'Assign a rider before signaling' : msg); 
    }
  };


  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-glow-primary"></div>
          <p className="text-sm font-black text-tertiary uppercase tracking-widest animate-pulse">Syncing Dispatch Board...</p>
        </div>
      </div>
    );
  }

  // Safe alias — guards against API suggestions setting state to undefined
  const safeOrders: string[] = Array.isArray(selectedOrders) ? selectedOrders : [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#0F0F0F] p-5 sm:p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              Dispatch Board
            </h1>
            <p className="text-tertiary text-[10px] mt-0.5 uppercase tracking-widest font-bold">Batch dispatch operations & zone grouping</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            className="border-white/10 hover:bg-white/5 h-10 px-6 uppercase tracking-widest text-[10px] font-bold rounded-xl"
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            disabled={safeOrders.length === 0}
            onClick={() => setIsCreateTripModalOpen(true)}
            className="h-10 px-8 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-primary/20 rounded-xl"
            icon={<Truck className="w-4 h-4" />}
          >
            Create Trip ({safeOrders.length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Route Groupings */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {boardItems.length === 0 ? (
            <div className="py-32 text-center bg-[#0F0F0F] rounded-3xl border-2 border-dashed border-white/5">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <Package className="w-10 h-10 text-tertiary/20" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Zero Load</h3>
              <p className="text-tertiary text-xs uppercase tracking-widest font-black max-w-xs mx-auto opacity-50">No ready delivery orders found on the board at this moment.</p>
            </div>
          ) : (
            (boardItems || []).map((routeItem, idx) => (
              <div key={idx} className="space-y-4 animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="flex items-center justify-between px-4 pb-2 border-b border-white/5">
                   <div className="flex items-center gap-3">
                     <MapPin className="w-5 h-5 text-primary" />
                     <h2 className="text-lg font-black text-white uppercase tracking-tighter">{routeItem.route}</h2>
                     <span className="text-[10px] font-black text-[#555] uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">{(routeItem.orders || []).length} Ready</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Priority Score: {routeItem.priority_score}</span>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(routeItem.orders || []).map(order => (
                    <Card 
                      key={order.id}
                      onClick={() => toggleOrderSelection(order.id, routeItem.route)}
                      className={`group relative p-4 sm:p-6 transition-all duration-300 cursor-pointer border-2 overflow-hidden ${
                        safeOrders.includes(order.id) 
                        ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                        : selectedRoute && selectedRoute !== routeItem.route
                        ? 'border-white/5 bg-[#0F0F0F] opacity-40 grayscale cursor-not-allowed'
                        : 'border-white/5 bg-[#0F0F0F] hover:border-white/10'
                      }`}
                    >
                      {/* Selection Indicator */}
                      <div className={`absolute top-0 right-0 w-16 h-16 transition-all duration-500 ${safeOrders.includes(order.id) ? 'translate-x-0' : 'translate-x-full'}`}>
                         <div className="absolute top-0 right-0 w-0 h-0 border-t-[40px] border-l-[40px] border-t-primary border-l-transparent"></div>
                         <CheckCircle2 className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-black" />
                      </div>

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <p className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] leading-none mb-2">#{order.order_number || order.id?.substring(0,8)}</p>
                          <h4 className="text-base font-black text-white uppercase truncate max-w-[200px] tracking-tight">{order.delivery_info?.name}</h4>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order.id); }}
                             className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500/60 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                             title="WhatsApp Signal"
                           >
                             <MessageSquare className="w-3.5 h-3.5" />
                           </button>
                           <Badge className={`${
                             order.status === 'ready' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-warning/10 text-warning border-warning/20'
                           } uppercase text-[8px] font-black px-2 py-0.5 rounded-lg`}>
                             {order.status}
                           </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[10px] text-tertiary font-bold uppercase tracking-widest">
                          <MapPin className="w-3.5 h-3.5 opacity-40 shrink-0" />
                          <span className="truncate">{order.delivery_info?.address}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Clock className="w-3.5 h-3.5 text-tertiary opacity-40" />
                               <span className="text-[10px] font-black text-tertiary uppercase">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <Zap className={`w-3.5 h-3.5 ${order.priority_score && order.priority_score > 70 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                               <span className="text-[10px] font-black text-tertiary uppercase">SCORE: {order.priority_score || '30'}</span>
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

        <div className="space-y-6">
          <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-5 lg:sticky lg:top-24 overflow-hidden shadow-2xl">
            <h3 className="text-[10px] sm:text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
              </div>
              ROUTING INTEL
            </h3>
            
            {suggestions.length === 0 ? (
              <div className="py-12 px-6 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-2xl">
                <p className="text-[10px] font-black text-[#444] uppercase tracking-widest italic">Scanning data for trip optimization suggestions...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suggestions.map((s, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all group/s">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">{s.route}</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">{s.total_orders} Orders Grouped</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="primary" 
                        onClick={() => { 
                          const sData: any = s;
                          const routeOrders = Array.isArray(sData.order_ids) ? sData.order_ids : (Array.isArray(sData.orders) ? sData.orders.map((o: any) => o?.id || o) : []);
                          if (routeOrders.length === 0) {
                            toast.error("This suggestion has no valid orders");
                            return;
                          }
                          setSelectedOrders(routeOrders); 
                          setSelectedRoute(s.route); 
                          setIsCreateTripModalOpen(true); 
                        }}
                        className="h-8 text-[8px] font-black px-4 bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-white"
                      >
                        Auto-Form
                      </Button>
                    </div>
                    {s.reason && (
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                        <p className="text-[9px] text-tertiary font-bold italic leading-relaxed">Logic: {s.reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-white/5 space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Active Load</span>
                <button 
                  onClick={() => { setSelectedOrders([]); setSelectedRoute(null); }}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-400 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[8px] font-black text-[#555] uppercase mb-1">Payload</p>
                    <p className="text-xl font-black text-white">{safeOrders.length}</p>
                 </div>
                 <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[8px] font-black text-[#555] uppercase mb-1">Active Zones</p>
                    <p className="text-xl font-black text-white">
                        {(() => {
                        const routes = new Set();
                        (boardItems || []).forEach(ri => {
                            (ri.orders || []).forEach(o => {
                            if (safeOrders.includes(o.id)) routes.add(ri.route);
                            });
                        });
                        return routes.size;
                        })()}
                    </p>
                 </div>
              </div>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={() => setIsCreateTripModalOpen(true)}
                disabled={safeOrders.length === 0}
                className="mt-6 h-12 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl bg-primary text-black"
              >
                Form Trip & Deploy ({safeOrders.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Deployment Formation */}
      <Modal
        isOpen={isCreateTripModalOpen}
        onClose={() => setIsCreateTripModalOpen(false)}
        title="Fleet Trip Formation"
        size="md"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Payload Ready</p>
              <h3 className="text-base font-bold text-white mt-0.5 uppercase tracking-tight">{safeOrders.length} Ready Deliveries Grouped</h3>
            </div>
          </div>

          <div className="space-y-4">
            <Input 
              label="Fleet Commander Notes *"
              placeholder="Enter specific instructions for the rider..."
              value={tripNotes}
              onChange={(e) => setTripNotes(e.target.value)}
              className="bg-[#0A0A0A] border-white/10"
            />
            
            <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Manual Override Notice</p>
                <p className="text-[10px] text-tertiary mt-1 leading-relaxed font-normal">This formation results in a custom trip ID. Ensure the rider acknowledges multi-zone routing if applicable.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <Button 
              variant="outline" 
              fullWidth 
              onClick={() => setIsCreateTripModalOpen(false)}
              className="h-10 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={handleCreateTrip}
              isLoading={isCreating}
              className="h-10 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl"
            >
              Form Trip & Deploy
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
