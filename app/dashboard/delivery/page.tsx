"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Input, Select } from '@/src/components/Input';
import { 
  LayoutDashboard, Truck, MessageSquare, MapPin, Layers, 
  Search, RefreshCw, Plus, Clock, Bike, 
  CheckCircle2, Package, User as UserIcon, Phone, 
  Eye, Trash2, Edit2, Zap, AlertTriangle, X,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { deliveryTripService } from '@/src/services/delivery-trip.service';
import { deliveryPersonService } from '@/src/services/delivery-person.service';
import { orderService } from '@/src/services/order.service';
import apiClient from '@/src/lib/axios';
import { 
  DispatchBoardItem, DeliveryTrip, TripSuggestion, DeliveryPerson, 
  WhatsAppLog, Order, DeliveryZone 
} from '@/src/types';
import { cn } from '@/src/lib/utils';

// --- SHARED UI ---

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2.5 px-6 py-4 border-b-2 transition-all duration-200 outline-none flex-1 sm:flex-none justify-center",
      active 
        ? "border-primary text-primary bg-primary/5 font-bold" 
        : "border-transparent text-tertiary hover:text-white hover:bg-surface font-semibold"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
    <span className="text-[11px] 2xl:text-xs uppercase tracking-widest">{label}</span>
  </button>
);

const SectionHeading = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-8">
    <h2 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-tight">{title}</h2>
    <p className="text-xs sm:text-sm text-tertiary mt-1 font-medium opacity-60 italic">{subtitle}</p>
  </div>
);

const KPICard = ({ label, value, sub, color = "text-white", trend }: { label: string, value: string | number, sub: string, color?: string, trend?: string }) => (
  <Card className="p-8 border-base bg-card flex flex-col justify-between hover:border-primary/20 transition-all rounded-[1.5rem] relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
       <Zap className="w-12 h-12 text-primary" />
    </div>
    <div>
      <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] mb-4 opacity-60">{label}</p>
      <h3 className={cn("text-4xl font-black tracking-tighter mb-1", color)}>{value}</h3>
      <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40">{sub}</p>
    </div>
    {trend && (
      <div className="mt-6 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow-primary"></div>
        <span className="text-[9px] font-black text-primary uppercase tracking-[0.1em]">{trend}</span>
      </div>
    )}
  </Card>
);

const OverviewTab = () => {
  const [metrics, setMetrics] = useState({ queue: 0, active: 0, riders: 0, value: 0 });
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sync = useCallback(async () => {
    try {
      const [board, trips, riders] = await Promise.all([
        deliveryTripService.getDispatchBoard(),
        deliveryTripService.getTrips({ status__in: 'assigned,out' }),
        apiClient.get('v1/delivery-persons/').then(res => res.data).catch(() => [])
      ]);
      
      const queueOrders = board.reduce((acc, r) => acc + (r.orders?.length || 0), 0);
      const queueVal = board.reduce((acc, r) => acc + (r.orders?.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0) || 0), 0);
      
      setMetrics({
        queue: queueOrders,
        active: trips.count || 0,
        riders: Array.isArray(riders) ? riders.filter((r: any) => r.status === 'available').length : 0,
        value: queueVal
      });

      // Extract latest ready orders for feed
      const allOrders = board.flatMap(r => r.orders || []).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLiveOrders(allOrders.slice(0, 10));
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    sync();
    const inv = setInterval(sync, 30000);
    return () => clearInterval(inv);
  }, [sync]);

  if (isLoading) return <div className="py-20 text-center animate-pulse text-xs font-bold uppercase tracking-widest opacity-20 text-primary">Synchronizing Command Center...</div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        <KPICard label="QUEUE LOAD" value={metrics.queue} sub="AWAITING DISPATCH" trend="LIVE OPS" />
        <KPICard label="FLEET MOTION" value={metrics.active} sub="ACTIVE TRIPS" color="text-primary" />
        <KPICard label="READY RIDERS" value={metrics.riders} sub="PERSONNEL AVAILABLE" color="text-emerald-500" />
        <KPICard label="SESSION VAL" value={`Rs. ${Math.round(metrics.value).toLocaleString()}`} sub="VALUE IN FLOW" color="text-white" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 mt-10">
        <div className="xl:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-2">
             <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
               <Layers className="w-5 h-5 text-primary" /> Live Order Stream
             </h3>
             <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[9px] px-3">Real-Time</Badge>
          </div>
          <div className="space-y-4">
             {liveOrders.map((order, i) => (
               <div key={i} className="flex items-center justify-between p-5 bg-surface border border-base rounded-2xl hover:border-primary/10 transition-all group">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-xl bg-card border border-base flex items-center justify-center font-black text-white text-xs">
                       {order.order_number?.slice(-3) || '000'}
                     </div>
                     <div>
                       <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40">#{order.order_number || order.id.substring(0,8)}</p>
                       <h4 className="text-[13px] font-bold text-white uppercase">{order.delivery_info?.name || 'Guest'}</h4>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[11px] font-black text-white">Rs. {parseFloat(order.total || '0').toLocaleString()}</p>
                     <p className="text-[9px] font-bold text-tertiary uppercase tracking-tighter opacity-40">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
               </div>
             ))}
             {liveOrders.length === 0 && <div className="py-20 text-center border-2 border-dashed border-base rounded-3xl opacity-10 uppercase font-black tracking-widest text-xs">Waiting for incoming traffic</div>}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 px-2">
             <Clock className="w-5 h-5 text-emerald-500" /> System Velocity
           </h3>
           <div className="bg-card border border-base rounded-3xl p-8 space-y-8">
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">Avg Dispatch Time</p>
                    <p className="text-2xl font-black text-white">12m</p>
                 </div>
                 <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%]" />
                 </div>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">Rider Utilization</p>
                    <p className="text-2xl font-black text-white">88%</p>
                 </div>
                 <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[88%]" />
                 </div>
              </div>
              <div className="pt-6 border-t border-base">
                 <p className="text-[9px] font-bold text-tertiary uppercase leading-relaxed opacity-40">System pulse is normal. Performance within optimized parameters for current traffic load.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- TABS ---

const DispatchTab = ({ onTripCreated }: { onTripCreated: () => void }) => {
  const [boardItems, setBoardItems] = useState<DispatchBoardItem[]>([]);
  const [suggestions, setSuggestions] = useState<TripSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripNotes, setTripNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [targetTripId, setTargetTripId] = useState<string>('new');
  const [unroutedOrders, setUnroutedOrders] = useState<Order[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [selectedOrderForZone, setSelectedOrderForZone] = useState<Order | null>(null);
  const [newZoneId, setNewZoneId] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [boardData, suggestionsData, tripsData, allReadyOrders, zonesData] = await Promise.all([
        deliveryTripService.getDispatchBoard(),
        deliveryTripService.getTripSuggestions(),
        deliveryTripService.getTrips({ status__in: 'draft,assigned' }),
        apiClient.get('v1/orders/?status=ready&delivery_route__isnull=true').then(res => res.data),
        orderService.getZones()
      ]);
      setBoardItems(boardData || []);
      setSuggestions(suggestionsData || []);
      setTrips(tripsData.results || []);
      setUnroutedOrders(Array.isArray(allReadyOrders) ? allReadyOrders : (allReadyOrders?.results || []));
      setZones(Array.isArray(zonesData) ? zonesData : (zonesData?.results || []));
    } catch (error) { toast.error('Sync failed'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelection = (orderId: string, route: string) => {
    if (selectedRoute && selectedRoute !== route) {
      toast.error(`Area: ${selectedRoute}`);
      return;
    }
    setSelectedOrders(prev => {
      const isSelected = prev.includes(orderId);
      const next = isSelected ? prev.filter(id => id !== orderId) : [...prev, orderId];
      if (next.length === 0) setSelectedRoute(null);
      else if (!selectedRoute) setSelectedRoute(route);
      return next;
    });
  };

  const filtered = boardItems.map(item => ({
    ...item,
    orders: (item.orders || []).filter(o => 
      o.delivery_info?.name?.toLowerCase().includes(search.toLowerCase()) || 
      o.order_number?.includes(search)
    )
  })).filter(item => item.orders.length > 0);

  if (isLoading) return <div className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">Loading...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-3 space-y-10">
        {/* Tactical Overview Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <KPICard 
             label="TOTAL QUEUE" 
             value={filtered.reduce((acc, r) => acc + r.orders.length, 0)} 
             sub="ORDERS READY" 
             trend="LIVE"
          />
          <KPICard 
             label="QUEUE VALUE" 
             value={`Rs. ${filtered.reduce((acc, r) => acc + r.orders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0), 0).toLocaleString()}`} 
             sub="TOTAL PAYLOAD"
             color="text-emerald-500" 
          />
          <KPICard 
             label="AVG PRIORITY" 
             value={Math.round(filtered.reduce((acc, r) => acc + r.priority_score, 0) / (filtered.length || 1))} 
             sub="SYSTEM PULSE"
             color="text-amber-500" 
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary opacity-40" />
            <input 
              placeholder="Search ready orders..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 bg-[#0A0A0A] text-[13px] pl-12 pr-4 rounded-xl border border-base focus:border-primary transition-all outline-none"
            />
          </div>
          <button onClick={fetchData} className="px-6 h-12 bg-card border border-base rounded-xl hover:bg-surface transition-all flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white shrink-0">
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-base rounded-2xl opacity-20">
            <Package className="w-10 h-10 mx-auto mb-3" />
            <p className="text-xs font-bold uppercase tracking-widest">Board Clear</p>
          </div>
        ) : (
          filtered.map((route, idx) => (
            <div key={idx} className="space-y-6">
              <div className="flex items-center justify-between px-2">
                 <div className="flex items-center gap-4">
                    <div className="w-1 h-8 bg-primary rounded-full shadow-glow-primary"></div>
                    <div>
                      <h2 className="text-xl font-bold text-white uppercase tracking-tight">{route.route}</h2>
                      <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40">{route.orders.length} Ready Units</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 px-4 py-2 bg-surface border border-base rounded-xl">
                   <Zap className="w-4 h-4 text-primary" />
                   <span className="text-[11px] font-black text-white uppercase tracking-tighter">Route Priority: {route.priority_score}</span>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {(route.orders || []).map((order: any) => (
                  <Card 
                    key={order.id} 
                    onClick={() => toggleSelection(order.id, route.route)}
                    className={cn(
                      "group p-6 transition-all duration-300 cursor-pointer border-2 rounded-2xl relative overflow-hidden",
                      selectedOrders.includes(order.id) 
                        ? "border-primary bg-primary/5 shadow-glow-primary/10" 
                        : selectedRoute && selectedRoute !== route.route
                          ? "opacity-30 grayscale cursor-not-allowed border-base"
                          : "border-base bg-card hover:border-white/20 hover:translate-y-[-2px] shadow-sm"
                    )}
                  >
                    {selectedOrders.includes(order.id) && (
                      <div className="absolute top-0 right-0 p-3 animate-in zoom-in duration-300">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-surface border border-base flex items-center justify-center text-[11px] font-mono font-black text-tertiary">
                            {order.order_number?.slice(-3) || '000'}
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40">#{order.order_number || order.id.substring(0,8)}</p>
                            <div className="flex items-center gap-2">
                               <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-md uppercase border", 
                                 order.payment_status === 'paid' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border-rose-500/20")}>
                                 {order.payment_status || 'COD'}
                               </span>
                            </div>
                         </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                           onClick={(e) => { 
                             e.stopPropagation(); 
                             try { 
                               deliveryTripService.sendOrderToRiderWhatsapp(order.id); 
                               toast.success('Signal Sent'); 
                             } catch { toast.error('Signal Refused'); }
                           }}
                           className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <h4 className="text-sm font-bold text-white uppercase truncate mb-1">{order.delivery_info?.name}</h4>
                      <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5 mb-3"><Phone className="w-3 h-3" /> {order.delivery_info?.phone}</p>
                      
                      <div className="space-y-1.5 mb-4 max-h-[100px] overflow-hidden">
                        {(order.items || []).slice(0, 2).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[10px] font-bold text-tertiary uppercase tracking-tight">
                            <span className="truncate max-w-[140px] opacity-70">{item.product_name}</span>
                            <span className="text-white shrink-0">x{item.quantity}</span>
                          </div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <p className="text-[9px] font-bold text-primary uppercase opacity-60">+{order.items.length - 2} more items</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-base space-y-4">
                       <p className="text-[11px] text-tertiary font-medium line-clamp-2 min-h-[30px] opacity-60">{order.delivery_info?.address}</p>
                       <div className="flex justify-between items-center bg-surface/50 p-3 rounded-xl border border-base group-hover:bg-surface transition-colors">
                          <div className="flex flex-col">
                             <span className="text-[12px] font-black text-white">Rs. {parseFloat(order.total || '0').toLocaleString()}</span>
                             <span className="text-[8px] font-bold text-tertiary uppercase tracking-widest opacity-40">{order.items?.length || 0} Products</span>
                          </div>
                          <div className="text-right">
                             <span className="text-[10px] font-black text-primary flex items-center justify-end gap-1.5"><Zap className="w-3.5 h-3.5" /> {order.priority_score || '30'}</span>
                             <span className="text-[9px] font-black text-tertiary opacity-40 uppercase">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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

      <div className="lg:col-span-1">
        <div className="sticky top-10 space-y-6">
           <div className="bg-card rounded-2xl border border-base p-6 space-y-6 shadow-xl sticky top-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                  <Zap className="w-4 h-4 text-primary" /> Suggestions
                </h3>
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] px-2">AI Routing</Badge>
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                {suggestions.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-base rounded-xl opacity-30">
                     <p className="text-[10px] font-bold uppercase tracking-widest">No Suggestions</p>
                  </div>
                ) : (
                  suggestions.map((s, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-surface border border-base hover:border-primary/40 transition-all group">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-[9px] font-bold text-primary uppercase mb-1">{s.route}</p>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{s.total_orders} Orders</p>
                        </div>
                        <button 
                          onClick={() => { 
                            const ids = (s as any).order_ids || ((s as any).orders || []).map((o: any) => o?.id || o);
                            if (ids.length > 0) {
                              setSelectedOrders(ids); 
                              setSelectedRoute(s.route); 
                            }
                          }}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary shadow-glow-primary text-black hover:bg-accent transition-all scale-95 group-hover:scale-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-tertiary font-bold uppercase opacity-50 italic">"{s.reason || 'Optimal route batching'}"</p>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-6 border-t border-base space-y-5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">Batch Size</span>
                  <Badge className="bg-surface text-white border-base">{selectedOrders.length} Units</Badge>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-1">Trip Storage</p>
                  <Select 
                    value={targetTripId} 
                    onChange={e => setTargetTripId(e.target.value)}
                    options={[
                      { value: 'new', label: 'CREATE NEW TRIP' },
                      ...trips.filter(t => t.route_name === selectedRoute || !t.route_name).map(t => ({ 
                        value: t.id, 
                        label: `TRIP #${t.trip_number || t.id.substring(0,8)}` 
                      }))
                    ]}
                    className="h-12 text-[11px] font-bold uppercase"
                  />
                </div>
                
                <Button 
                   variant="primary" 
                   fullWidth 
                   disabled={selectedOrders.length === 0}
                   onClick={() => setIsModalOpen(true)}
                   className="h-14 font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 bg-primary text-black hover:bg-accent rounded-2xl"
                   icon={<Plus className="w-5 h-5" />}
                >
                   Create Trip
                </Button>

                {unroutedOrders.length > 0 && (
                   <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">{unroutedOrders.length} Orders Unrouted</p>
                      <p className="text-[8px] font-bold text-tertiary uppercase opacity-40">Ready orders without mapped areas</p>
                   </div>
                )}
              </div>
            </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Delivery Trip" size="md">
        <div className="space-y-6 pt-2">
          <div className="bg-surface p-5 rounded-xl border border-base flex items-center gap-4">
            <Truck className="w-6 h-6 text-primary" />
            <div>
              <p className="text-[10px] font-bold text-tertiary uppercase">Confirm Trip</p>
              <h3 className="text-base font-bold text-white uppercase">{selectedOrders.length} Orders Loaded</h3>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-1">Rider Instructions</p>
            <textarea 
              placeholder="Enter notes..." 
              value={tripNotes} 
              onChange={e => setTripNotes(e.target.value)}
              className="w-full min-h-[100px] p-4 bg-surface border border-base rounded-xl text-[13px] text-white outline-none focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)} className="h-12 text-[11px] font-bold uppercase rounded-xl">Discard</Button>
            <Button variant="primary" fullWidth isLoading={isCreating} onClick={async () => {
              setIsCreating(true);
              try {
                if (targetTripId === 'new') {
                  await deliveryTripService.createTrip({ order_ids: selectedOrders, notes: tripNotes, is_custom: true });
                } else {
                  await deliveryTripService.addOrdersToTrip({ trip_id: targetTripId, order_ids: selectedOrders });
                }
                setIsModalOpen(false); setSelectedOrders([]); setTripNotes(''); setTargetTripId('new');
                fetchData(); onTripCreated();
                toast.success('Done');
              } catch (e) { toast.error('Failed'); }
              finally { setIsCreating(false); }
            }} className="h-12 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">Confirm</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} title="Change Zone" size="sm">
        <div className="space-y-6 pt-2">
           <Select 
             value={newZoneId}
             onChange={e => setNewZoneId(e.target.value)}
             options={[{value:'', label:'CHOOSE ZONE...'}, ...zones.map(z => ({value:z.id, label:z.name.toUpperCase()}))]}
             className="h-12 text-[11px] font-bold uppercase"
           />
           <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setIsZoneModalOpen(false)} className="h-12 text-[11px] font-bold uppercase rounded-xl">Cancel</Button>
              <Button variant="primary" fullWidth onClick={async () => {
                if (!selectedOrderForZone || !newZoneId) return;
                try {
                  await orderService.updateDeliveryZone(selectedOrderForZone.id, newZoneId);
                  toast.success('Updated');
                  setIsZoneModalOpen(false);
                  fetchData();
                } catch (e) { toast.error('Error'); }
              }} className="h-12 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">Save</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

const TripsTab = () => {
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [riders, setRiders] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<DeliveryTrip | null>(null);
  const [addOrderModal, setAddOrderModal] = useState<DeliveryTrip | null>(null);
  const [eligibleOrders, setEligibleOrders] = useState<any[]>([]);
  const [selectedEligible, setSelectedEligible] = useState<string[]>([]);
  const [selectedRider, setSelectedRider] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const [tripDetails, setTripDetails] = useState<Record<string, DeliveryTrip>>({});
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const params: any = { page, page_size: 12 };
      if (statusFilter) params.status = statusFilter;
      if (routeFilter) params.route = routeFilter;
      
      const [tripsData, ridersResponse] = await Promise.all([
        deliveryTripService.getTrips(params),
        apiClient.get('v1/delivery-persons/').then(res => res.data).catch(() => [])
      ]);
      setTrips(tripsData.results || []);
      setTotalPages(Math.ceil((tripsData.count || 1) / 12));
      setRiders(ridersResponse || []);
    } finally { setIsLoading(false); }
  }, [page, statusFilter, routeFilter]);

  const fetchDetails = async (id: string) => {
    try {
       const detail = await deliveryTripService.getTripDetail(id);
       setTripDetails(prev => ({ ...prev, [id]: detail }));
    } catch (e) {}
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (addOrderModal) {
      deliveryTripService.getDispatchBoard().then(boards => {
         const matchingRoute = boards.find(b => b.route === addOrderModal.route_name);
         setEligibleOrders(matchingRoute?.orders || []);
      });
      setSelectedEligible([]);
    }
  }, [addOrderModal]);

  const handleAction = async (id: string, action: string) => {
    setIsProcessing(true);
    try {
      if (action === 'dispatch') await deliveryTripService.dispatchTrip(id);
      else if (action === 'complete') await deliveryTripService.completeTrip(id);
      else if (action === 'cancel') await deliveryTripService.cancelTrip(id);
      else if (action === 'whatsapp') await deliveryTripService.sendTripToRiderWhatsapp(id);
      toast.success('Command Acknowledged');
      fetchData(true);
    } catch (e: any) { 
      toast.error(e?.response?.data?.detail || 'Command Refused'); 
    } finally { setIsProcessing(false); }
  };

  if (isLoading) return <div className="py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">Loading Trips...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={[{value:'', label:'ALL STATUSES'},{value:'draft', label:'DRAFT'},{value:'assigned', label:'ASSIGNED'},{value:'out', label:'OUT'},{value:'completed', label:'COMPLETED'}]} className="h-11 w-48 text-[11px] font-bold uppercase" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {trips.length === 0 ? (
        <div className="col-span-full py-20 text-center border-2 border-dashed border-base rounded-2xl opacity-20">
          <Truck className="w-10 h-10 mx-auto mb-3" />
          <p className="text-xs font-bold uppercase tracking-widest">No Active Trips</p>
        </div>
      ) : (
        trips.map(trip => (
          <Card key={trip.id} className="p-6 border-base bg-card hover:border-base transition-all flex flex-col rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 opacity-50">Trip ID</p>
                <h3 className="text-xl font-bold text-white tracking-tight">#{trip.trip_number || trip.id.substring(0,8)}</h3>
              </div>
              <Badge className={cn("px-3 py-1 rounded-full uppercase text-[10px] font-bold border", 
                trip.status === 'out' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                trip.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                "bg-base text-tertiary border-base")}>
                {trip.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-3 bg-surface rounded-xl border border-base">
                <p className="text-[9px] font-bold text-tertiary uppercase mb-1 opacity-40">Area</p>
                <p className="text-xs font-bold text-white truncate uppercase">{trip.route_name || 'HUB'}</p>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-base flex justify-between items-center group/r">
                <div className="overflow-hidden">
                   <p className="text-[9px] font-bold text-tertiary uppercase mb-1 opacity-40">Rider</p>
                   <p className={cn("text-xs font-bold truncate uppercase", trip.delivery_person_name ? "text-primary" : "text-rose-500/50")}>
                    {trip.delivery_person_name || 'NONE'}
                   </p>
                 </div>
                 {['draft', 'assigned'].includes(trip.status) && (
                   <button onClick={() => setAssignModal(trip)} className="text-tertiary hover:text-white opacity-0 group-hover/r:opacity-100"><Edit2 className="w-3.5 h-3.5" /></button>
                 )}
               </div>
            </div>

            {editingNotes === trip.id ? (
              <div className="mb-8 flex gap-2">
                <input 
                  autoFocus 
                  value={tempNotes} 
                  onChange={e => setTempNotes(e.target.value)} 
                  placeholder="Trip Notes..." 
                  className="w-full text-xs bg-surface border border-base rounded-xl px-3 outline-none focus:border-primary" 
                />
                <button onClick={async () => {
                  try {
                    await deliveryTripService.updateTrip({ trip_id: trip.id, notes: tempNotes });
                    toast.success('Notes Updated');
                    setEditingNotes(null);
                    await fetchDetails(trip.id);
                  } catch(e) { toast.error('Error'); }
                }} className="px-3 bg-primary text-black text-[10px] font-bold uppercase rounded-xl">Save</button>
                <button onClick={() => setEditingNotes(null)} className="px-3 bg-surface border border-base text-[10px] font-bold uppercase rounded-xl">X</button>
              </div>
            ) : (
              tripDetails[trip.id]?.notes ? (
                <div 
                  onClick={() => { setEditingNotes(trip.id); setTempNotes(tripDetails[trip.id]?.notes || ''); }} 
                  className="mb-8 p-3 bg-base border border-base rounded-xl cursor-pointer hover:bg-base transition-colors group/note"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[9px] font-bold text-tertiary uppercase opacity-40">Trip Notes</p>
                    <Edit2 className="w-3 h-3 text-tertiary opacity-0 group-hover/note:opacity-100" />
                  </div>
                  <p className="text-xs text-white/80 italic">"{tripDetails[trip.id].notes}"</p>
                </div>
              ) : null
            )}
            
            {/* If no notes, allow adding */}
            {!tripDetails[trip.id]?.notes && editingNotes !== trip.id && (
               <div className="mb-8">
                 <button onClick={() => { setEditingNotes(trip.id); setTempNotes(''); }} className="text-[10px] font-bold text-tertiary hover:text-white uppercase flex items-center gap-1 opacity-50 hover:opacity-100 transition-all">
                   <Plus className="w-3 h-3" /> Add Trip Notes
                 </button>
               </div>
            )}

            <div className="space-y-3 mt-auto">
              {trip.status === 'draft' && <Button variant="primary" fullWidth className="h-11 font-bold rounded-xl text-[11px] uppercase" onClick={() => setAssignModal(trip)}>Assign Rider</Button>}
              {trip.status === 'assigned' && <Button variant="primary" fullWidth className="h-11 font-bold rounded-xl text-[11px] bg-amber-500 border-amber-500 text-black uppercase" onClick={() => handleAction(trip.id, 'dispatch')} isLoading={isProcessing}>Start Trip</Button>}
              {trip.status === 'out' && <Button variant="primary" fullWidth className="h-11 font-bold rounded-xl text-[11px] bg-emerald-500 border-emerald-500 text-black uppercase" onClick={() => handleAction(trip.id, 'complete')} isLoading={isProcessing}>Deliver All</Button>}
              
              <div className="flex gap-2">
                <button onClick={() => {
                  if (expanded === trip.id) setExpanded(null);
                  else { setExpanded(trip.id); fetchDetails(trip.id); }
                }} className="flex-1 h-11 flex items-center justify-center rounded-xl bg-base border border-base hover:border-base text-white text-[10px] font-bold uppercase tracking-widest"><Eye className="w-3.5 h-3.5 mr-2" /> Orders</button>
                {trip.delivery_person && (trip.status === 'assigned' || trip.status === 'out') && (
                  <button onClick={() => handleAction(trip.id, 'whatsapp')} className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><MessageSquare className="w-4 h-4" /></button>
                )}
                {['draft', 'assigned'].includes(trip.status) && (
                  <button onClick={() => handleAction(trip.id, 'cancel')} className="w-11 h-11 flex items-center justify-center rounded-xl bg-base border border-base text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            </div>

            {expanded === trip.id && (
              <div className="mt-6 pt-6 border-t border-base space-y-3 animate-in fade-in duration-200">
                {!tripDetails[trip.id] ? (
                  <div className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-tertiary opacity-50">Fetching detail...</div>
                ) : (
                  <>
                  {(tripDetails[trip.id]?.trip_orders || []).map((o: any, i: number) => (
                    <div key={i} className="p-3 bg-surface/50 border border-base rounded-xl flex justify-between items-center group/it">
                      <div className="overflow-hidden flex-1">
                        <p className="text-[12px] font-bold text-white uppercase truncate mb-0.5">{o.customer_name || 'Customer'}</p>
                        <div className="space-y-0.5 mb-1.5">
                          {(o.items || []).map((item:any, idx:number) => (
                             <p key={idx} className="text-[9px] font-bold text-tertiary uppercase flex justify-between">
                                <span className="truncate opacity-60">{item.product_name}</span>
                                <span className="text-white">x{item.quantity}</span>
                             </p>
                          ))}
                        </div>
                        <p className="text-[10px] text-tertiary opacity-40 uppercase truncate tracking-tighter">#{o.order_number || o.id?.substring(0,8)}</p>
                      </div>
                      {['draft', 'assigned'].includes(trip.status) && (
                         <button 
                          onClick={async () => {
                            try { await deliveryTripService.removeOrderFromTrip({ trip_id: trip.id, order_id: o.order }); toast.success('Removed'); await fetchDetails(trip.id); fetchData(true); } 
                            catch (e) { toast.error('Error'); }
                          }}
                          className="p-1 text-tertiary hover:text-rose-500 opacity-0 group-hover/it:opacity-100"
                         ><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  ))}
                  {['draft', 'assigned'].includes(trip.status) && (
                     <button onClick={() => setAddOrderModal(trip)} className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-base text-[10px] font-bold uppercase text-tertiary hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2">
                       <Plus className="w-3 h-3" /> Add Eligible Orders
                     </button>
                  )}
                  </>
                )}
              </div>
            )}
          </Card>
        ))
      )}
      </div>

      <Modal isOpen={!!assignModal} onClose={() => { setAssignModal(null); setSelectedRider(''); setSendWhatsapp(false); }} title="Select Rider" size="md">
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-1">
            {riders.map(r => (
              <button 
                key={r.id} 
                onClick={() => {
                  setSelectedRider(r.id);
                  // Auto-enable WhatsApp only if rider has a WhatsApp number
                  setSendWhatsapp(!!(r as any).whatsapp_number);
                }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl border transition-all",
                  selectedRider === r.id ? "border-primary bg-primary/5 shadow-sm" : "border-base bg-surface hover:border-base"
                )}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-base"><Bike className="w-5 h-5" /></div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-tight">{r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-bold text-tertiary opacity-40 tracking-widest">{r.phone_number}</p>
                      {(r as any).whatsapp_number && <span className="text-[9px] font-bold text-emerald-500 uppercase">WhatsApp ✓</span>}
                    </div>
                  </div>
                </div>
                {selectedRider === r.id && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>

          {/* WhatsApp toggle — only relevant if rider has a number */}
          {selectedRider && (
            <div className="bg-surface p-4 rounded-xl border border-base flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                   <Phone className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">WhatsApp Integration</p>
                    <p className="text-[10px] font-bold text-tertiary uppercase mt-0.5 opacity-60">Push manifest details to rider mobile unit</p>
                </div>
             </div>
             <div 
                onClick={() => setSendWhatsapp(!sendWhatsapp)}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${sendWhatsapp ? 'bg-emerald-500' : 'bg-surface border border-base'}`}
             >
                <div className={`w-4 h-4 rounded-full bg-tertiary transition-all duration-300 shadow-sm ${sendWhatsapp ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => { setAssignModal(null); setSelectedRider(''); setSendWhatsapp(false); }} className="h-11 text-[11px] font-bold uppercase rounded-xl">Cancel</Button>
            <Button variant="primary" fullWidth onClick={async () => {
              if (!selectedRider || !assignModal) return;
              setIsProcessing(true);
              try { 
                if (assignModal.delivery_person) {
                  await deliveryTripService.reassignTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: sendWhatsapp });
                  toast.success('Reassigned');
                } else {
                  await deliveryTripService.assignTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: sendWhatsapp });
                  toast.success('Assigned');
                }
                setAssignModal(null); setSelectedRider(''); fetchData(true); 
              } catch (e: any) { 
                toast.error(e?.response?.data?.detail || 'Assign failed');
              } finally { setIsProcessing(false); }
            }} disabled={!selectedRider || isProcessing} className="h-11 text-[11px] font-bold uppercase rounded-xl bg-primary/20 text-primary border border-primary/20 hover:bg-primary/30">Assign</Button>
            <Button variant="primary" fullWidth onClick={async () => {
              if (!selectedRider || !assignModal) return;
              setIsProcessing(true);
              try { 
                await deliveryTripService.assignAndDispatchTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: sendWhatsapp });
                toast.success('Dispatched!'); setAssignModal(null); setSelectedRider(''); fetchData(true); 
              } catch (e: any) { 
                toast.error(e?.response?.data?.detail || 'Dispatch failed');
              } finally { setIsProcessing(false); }
            }} disabled={!selectedRider || isProcessing} className="h-11 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">Fast Dispatch</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!addOrderModal} onClose={() => setAddOrderModal(null)} title="Add Orders to Trip" size="md">
        <div className="space-y-4 pt-2">
           <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
             {eligibleOrders.length === 0 ? (
               <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-tertiary opacity-50">No eligible orders for {addOrderModal?.route_name || 'THIS ROUTE'}</div>
             ) : (
               eligibleOrders.map(o => (
                 <button 
                  key={o.id}
                  onClick={() => setSelectedEligible(prev => prev.includes(o.id) ? prev.filter(id => id !== o.id) : [...prev, o.id])}
                  className={cn("w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center", selectedEligible.includes(o.id) ? "border-primary bg-primary/5" : "border-base bg-surface hover:border-base")}
                 >
                   <div>
                     <p className="text-xs font-bold text-white uppercase">{o.delivery_info?.name || 'Customer'}</p>
                     <p className="text-[10px] text-tertiary uppercase">#{o.order_number || o.id.substring(0,8)}</p>
                   </div>
                   {selectedEligible.includes(o.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                 </button>
               ))
             )}
           </div>
           
          <div className="flex gap-3 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setAddOrderModal(null)} className="h-11 text-[11px] font-bold uppercase rounded-xl">Cancel</Button>
            <Button variant="primary" fullWidth onClick={async () => {
              if (!addOrderModal || selectedEligible.length === 0) return;
              setIsProcessing(true);
              try { 
                await deliveryTripService.addOrdersToTrip({ trip_id: addOrderModal.id, order_ids: selectedEligible });
                toast.success('Orders Added'); setAddOrderModal(null); fetchData(true); 
              } catch (e) { toast.error('Error'); } finally { setIsProcessing(false); }
            }} disabled={selectedEligible.length === 0} className="h-11 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">
              Add Selected ({selectedEligible.length})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const PersonnelTab = () => {
  const [people, setPeople] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<DeliveryPerson> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try { const data = await deliveryPersonService.getAll(); setPeople(data || []); } 
    catch (e) { toast.error('Error'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!edit?.name || !edit?.phone_number) return;
    setIsSaving(true);
    try {
      if (edit.id) await deliveryPersonService.update(edit.id, edit);
      else await deliveryPersonService.create(edit as any);
      toast.success('Saved'); setModalOpen(false); fetchData();
    } catch (e) { toast.error('Error'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Riders</h2>
        <Button variant="primary" onClick={() => { setEdit({ is_active: true, status: 'available' }); setModalOpen(true); }} className="h-11 px-6 font-bold rounded-xl text-[11px] uppercase bg-primary text-black">
          <Plus className="w-4 h-4 mr-2" /> Add Rider
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">Loading...</div>
        ) : (
          people.map(p => (
            <Card key={p.id} className="p-8 border-base bg-card hover:border-primary/20 transition-all rounded-[2rem] group flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <UserIcon className="w-12 h-12" />
              </div>
              
              <div className="flex justify-between items-start mb-8">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-base flex items-center justify-center text-primary shadow-sm"><UserIcon className="w-6 h-6" /></div>
                <div className="flex gap-2">
                  <button onClick={() => { setEdit(p); setModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:bg-base transition-all"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={async () => {
                    if (!confirm('Security Protocol: Permanent Removal?')) return;
                    try { await deliveryPersonService.delete(p.id); toast.success('Removed'); fetchData(); } catch (e) { toast.error('Error'); }
                  }} className="w-8 h-8 flex items-center justify-center rounded-lg text-tertiary hover:text-rose-500 hover:bg-rose-500/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-lg font-black text-white uppercase tracking-tight mb-2 truncate">{p.name}</h4>
                <div className="flex items-center gap-3">
                   <Badge className={cn("text-[9px] font-black px-2 py-0.5 rounded-md uppercase border", 
                     p.status === 'available' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20")}>
                     {p.status}
                   </Badge>
                   {(p as any).whatsapp_number && (
                     <Badge className="bg-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" /> WhatsApp ✓
                     </Badge>
                   )}
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-base space-y-4">
                <div className="flex justify-between items-center">
                   <p className="text-[10px] font-black text-tertiary uppercase tracking-widest opacity-40">Personnel Unit</p>
                   <p className="text-[11px] font-mono font-bold text-white tracking-tighter">{p.phone_number}</p>
                </div>
                {/* Deployment Toggle Toggle */}
                <div className="h-10 bg-surface rounded-xl border border-base flex items-center p-1">
                   <button className="flex-1 h-full text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 rounded-lg">Active</button>
                   <button className="flex-1 h-full text-[9px] font-black uppercase tracking-widest text-tertiary opacity-40">Standby</button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Rider Details" size="sm">
        <div className="space-y-6 pt-2">
          <Input label="Name" value={edit?.name || ''} onChange={e => setEdit({...edit, name: e.target.value.toUpperCase()})} placeholder="FULL NAME" className="h-12 font-bold uppercase" />
          <Input label="Phone" value={edit?.phone_number || ''} onChange={e => setEdit({...edit, phone_number: e.target.value})} placeholder="NUMBER" className="h-12 font-bold" />
          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)} className="h-12 text-[11px] font-bold uppercase rounded-xl">Cancel</Button>
            <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave} className="h-12 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const LogsTab = () => {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // All filters matching backend swagger spec exactly
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');       // target_type: order|trip
  const [providerFilter, setProviderFilter] = useState(''); // webhook|twilio|meta
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedLog, setSelectedLog] = useState<WhatsAppLog | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, page_size: 20 };
      if (statusFilter)   params.status      = statusFilter;
      if (typeFilter)     params.target_type = typeFilter;
      if (providerFilter) params.provider    = providerFilter;
      if (startDate)      params.start_date  = startDate;
      if (endDate)        params.end_date    = endDate;
      
      const response = await apiClient.get('v1/whatsapp-logs/', { params });
      setLogs(response.data.results || []);
      setTotalPages(Math.ceil((response.data.count || 0) / 20));
    } finally { setLoading(false); }
  }, [page, statusFilter, typeFilter, providerFilter, startDate, endDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const viewDetails = async (id: string) => {
    setLoadingDetail(true);
    setSelectedLog({} as WhatsAppLog);
    try {
      const response = await deliveryTripService.getWhatsAppLogDetail(id);
      setSelectedLog(response);
    } catch { 
      toast.error("Failed to load details"); 
      setSelectedLog(null);
    }
    finally { setLoadingDetail(false); }
  };

  const resetFilters = () => {
    setStatusFilter(''); setTypeFilter(''); setProviderFilter('');
    setStartDate(''); setEndDate(''); setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar — all 5 query filters from swagger */}
      <div className="flex flex-col gap-3 bg-card p-4 rounded-xl border border-base shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* status: pending | sent | failed  (exact backend values) */}
          <Select 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }} 
            options={[
              {value: '', label: 'ALL STATUS'}, 
              {value: 'pending',  label: 'PENDING'}, 
              {value: 'sent',     label: 'SENT'}, 
              {value: 'failed',   label: 'FAILED'}
            ]}
            className="h-11 font-bold uppercase text-[11px] sm:w-44"
          />
          {/* target_type: order | trip */}
          <Select 
            value={typeFilter} 
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }} 
            options={[
              {value: '', label: 'ALL TYPES'}, 
              {value: 'order', label: 'ORDER'}, 
              {value: 'trip',  label: 'TRIP'}
            ]}
            className="h-11 font-bold uppercase text-[11px] sm:w-44"
          />
          {/* provider: webhook | twilio | meta */}
          <Select 
            value={providerFilter} 
            onChange={e => { setProviderFilter(e.target.value); setPage(1); }} 
            options={[
              {value: '',        label: 'ALL PROVIDERS'}, 
              {value: 'webhook', label: 'WEBHOOK'}, 
              {value: 'twilio',  label: 'TWILIO'}, 
              {value: 'meta',    label: 'META'}
            ]}
            className="h-11 font-bold uppercase text-[11px] sm:w-44"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          {/* start_date / end_date */}
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest shrink-0">From</span>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="h-11 flex-1 bg-surface border border-base rounded-xl px-3 text-[11px] text-white font-bold outline-none focus:border-primary transition-all" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest shrink-0">To</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="h-11 flex-1 bg-surface border border-base rounded-xl px-3 text-[11px] text-white font-bold outline-none focus:border-primary transition-all" />
          </div>
          <Button variant="outline" onClick={resetFilters} className="h-11 px-5 text-[10px] font-bold uppercase rounded-xl shrink-0">Reset</Button>
          <Button variant="outline" onClick={() => fetchData()} className="h-11 px-5 text-[10px] font-bold uppercase rounded-xl shrink-0">Refresh</Button>
        </div>
      </div>

      <div className="bg-card border border-base rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface/50 text-[10px] font-bold text-tertiary uppercase tracking-widest border-b border-base">
              <th className="px-6 py-4">Rider</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Provider</th>
              <th className="px-6 py-4">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center text-xs opacity-20 font-bold uppercase tracking-widest">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-xs opacity-20 font-bold uppercase tracking-widest">No Logs Found</td></tr>
            ) : logs.map(log => (
              <tr 
                key={log.id} 
                onClick={() => viewDetails(log.id)}
                className="text-xs cursor-pointer hover:bg-surface transition-colors"
                title="Click to view details"
              >
                <td className="px-6 py-4 font-bold text-white uppercase truncate max-w-[140px]">{log.delivery_person_name || 'N/A'}</td>
                <td className="px-6 py-4 text-tertiary uppercase font-bold">{log.target_type}</td>
                <td className="px-6 py-4">
                   <Badge className={cn("px-2 py-0.5 rounded-md text-[9px] font-bold uppercase", 
                    ['sent', 'delivered', 'read'].includes(log.status) ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500")}>
                    {log.status}
                   </Badge>
                </td>
                <td className="px-6 py-4 text-tertiary font-mono text-[10px] uppercase opacity-60">{log.provider || 'UNKNOWN'}</td>
                <td className="px-6 py-4 text-tertiary opacity-40 italic">{new Date(log.created_at).toLocaleString([], { hour:'2-digit', minute:'2-digit', month: 'short', day: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="p-5 border-b border-base bg-surface flex flex-col md:flex-row justify-between items-center gap-6">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-9 px-4 text-[10px] font-bold uppercase rounded-lg">Previous</Button>
          <span className="text-[10px] font-bold text-tertiary uppercase opacity-50">Page {page} of {totalPages || 1}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-9 px-4 text-[10px] font-bold uppercase rounded-lg">Next</Button>
        </div>
      </div>

      <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Communication Log" size="md">
        <div className="space-y-6 pt-2">
           {loadingDetail ? (
             <div className="py-20 text-center text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Decrypting Payload...</div>
           ) : selectedLog?.id ? (
             <>
               <div className="bg-surface p-4 rounded-xl border border-base flex justify-between items-center">
                 <div>
                   <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Rider</p>
                   <p className="text-sm font-bold text-white uppercase">{selectedLog.delivery_person_name}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] text-tertiary font-bold uppercase mb-1">Phone</p>
                   <p className="text-[11px] font-mono text-emerald-500">{selectedLog.phone_number}</p>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-2">
                   <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-1">Message Content</p>
                   <div className="p-4 bg-surface border border-base rounded-xl text-[12px] text-white leading-relaxed italic opacity-80 min-h-[80px]">
                     {selectedLog.message_text || "No message content recorded."}
                   </div>
                 </div>

                 {selectedLog.error_message && (
                   <div className="space-y-2">
                     <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest px-1">Error Information</p>
                     <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 font-mono text-[11px] rounded-xl">
                       {selectedLog.error_message}
                     </div>
                   </div>
                 )}

                 {selectedLog.provider_message_id && (
                   <div className="flex justify-between items-center text-[10px] font-bold uppercase px-1">
                     <span className="text-tertiary">Provider ID</span>
                     <span className="text-white font-mono opacity-50 truncate max-w-[200px]">{selectedLog.provider_message_id}</span>
                   </div>
                 )}
               </div>

               <div className="pt-4 border-t border-base">
                 <Button variant="outline" fullWidth onClick={() => setSelectedLog(null)} className="h-11 text-[11px] font-bold uppercase rounded-xl">Close log</Button>
               </div>
             </>
           ) : null}
        </div>
      </Modal>
    </div>
  );
};

const SetupTab = () => {
  const [type, setType] = useState<'routes' | 'zones'>('routes');
  const [data, setData] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', sort_order: 1, route: '', default_travel_minutes: 30, is_active: true });
  const [filterRoute, setFilterRoute] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = type === 'routes' 
        ? 'v1/delivery-routes/' 
        : `v1/delivery-zones/${filterRoute ? `?route_id=${filterRoute}` : ''}`;
      
      const [res, rRes] = await Promise.all([
        apiClient.get(endpoint),
        apiClient.get('v1/delivery-routes/')
      ]);
      setData(res.data || []); setRoutes(rRes.data || []);
    } finally { setLoading(false); }
  }, [type, filterRoute]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name) return;
    try {
      const ep = type === 'routes' ? 'v1/delivery-routes/' : 'v1/delivery-zones/';
      
      // Strict payload typing matching swagger definition
      const payload: any = { 
        name: form.name, 
        sort_order: form.sort_order, 
        is_active: form.is_active 
      };
      
      if (type === 'routes') payload.default_travel_minutes = form.default_travel_minutes;
      if (type === 'zones') payload.route = form.route;

      if (modal?.id) await apiClient.patch(`${ep}${modal.id}/`, payload);
      else await apiClient.post(ep, payload);
      
      toast.success('Saved'); setModal(null); fetchData();
    } catch (e) { toast.error('Error'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex bg-surface p-1 rounded-xl border border-base">
          <button onClick={() => { setType('routes'); setFilterRoute(''); }} className={cn("px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all", type === 'routes' ? "bg-primary text-black" : "text-tertiary hover:text-white")}>Matrix Routes</button>
          <button onClick={() => setType('zones')} className={cn("px-6 py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all", type === 'zones' ? "bg-primary text-black" : "text-tertiary hover:text-white")}>Sector Zones</button>
        </div>
        
        <div className="flex items-center gap-3">
          {type === 'zones' && (
            <Select 
              value={filterRoute} 
              onChange={e => setFilterRoute(e.target.value)} 
              options={[{value:'', label:'ALL ROUTES'}, ...routes.map(r => ({value:r.id, label:r.name.toUpperCase()}))]} 
              className="h-11 w-48 text-[11px] font-bold uppercase" 
            />
          )}
          <Button variant="primary" onClick={() => { setForm({ name: '', sort_order: data.length + 1, route: filterRoute || '', default_travel_minutes: 30, is_active: true }); setModal({}); }} className="h-11 px-6 font-bold rounded-xl text-[11px] uppercase bg-primary text-black">
            <Plus className="w-4 h-4 mr-2" /> {type === 'routes' ? 'Initialize Matrix' : 'Initialize Sect'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center opacity-30 text-xs font-bold uppercase tracking-widest">Scanning Grid...</div>
        ) : data.length === 0 ? (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-base rounded-2xl opacity-20">
              <Layers className="w-10 h-10 mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-widest">Grid Empty</p>
           </div>
        ) : data.map(item => (
          <Card key={item.id} className="p-6 border-base bg-card hover:border-base transition-all rounded-2xl group flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-xl bg-surface border border-base flex items-center justify-center text-tertiary group-hover:text-primary transition-all"><Layers className="w-5 h-5" /></div>
              <div className="flex gap-2">
                <button onClick={() => { setModal(item); setForm(item); }} className="p-2 text-tertiary hover:text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={async () => {
                  if (!confirm(`Delete ${type}?`)) return;
                  try { await apiClient.delete(`${type === 'routes' ? 'v1/delivery-routes/' : 'v1/delivery-zones/'}${item.id}/`); toast.success('Deleted'); fetchData(); } catch (e) { toast.error('Error'); }
                }} className="p-2 text-tertiary hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            
            <h4 className="text-base font-bold text-white uppercase tracking-tight mb-1 truncate">{item.name}</h4>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">{item.route_name || (type === 'routes' ? 'ROOT MATRIX' : 'SUB-SECTOR')}</p>
              {!item.is_active && <Badge className="text-[9px] bg-rose-500/10 text-rose-500 border-rose-500/20 px-1 py-0 uppercase">Offline</Badge>}
            </div>
            
            <div className="mt-auto pt-4 border-t border-base flex justify-between items-center text-[10px] font-bold text-tertiary uppercase">
              <span>PRIORITY ID</span>
              <span className="text-white">#{item.sort_order.toString().padStart(2, '0')}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={type === 'routes' ? 'Matrix Config' : 'Sector Config'} size="sm">
        <div className="space-y-4 pt-2">
           <Input label="Designation Name" value={form.name} onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} placeholder="E.G. ALPHA SECTOR" className="h-12 font-bold uppercase" />
           {type === 'zones' && (
             <Select label="Parent Route" value={form.route} onChange={e => setForm({...form, route: e.target.value})} options={[{value:'', label:'ASSIGN PARENT...'}, ...routes.map(r => ({value:r.id, label:r.name.toUpperCase()}))]} className="h-12 font-bold uppercase" />
           )}
           <div className="grid grid-cols-2 gap-4">
             <Input label="Priority Level" type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="h-12 font-bold" />
             {type === 'routes' && (
               <Input label="Est. Time (Mins)" type="number" value={form.default_travel_minutes} onChange={e => setForm({...form, default_travel_minutes: parseInt(e.target.value)})} className="h-12 font-bold" />
             )}
           </div>
           <div className="flex items-center gap-3 pt-2">
             <input type="checkbox" checked={form.is_active !== false} onChange={e => setForm({...form, is_active: e.target.checked})} className="w-5 h-5 accent-primary rounded cursor-pointer" />
             <span className="text-xs font-bold text-white uppercase tracking-widest opacity-80">System Active</span>
           </div>
           
          <div className="flex gap-3 pt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setModal(null)} className="h-12 text-[11px] font-bold uppercase rounded-xl">Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleSave} className="h-12 text-[11px] font-bold uppercase rounded-xl bg-primary text-black">Synchronize</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function DeliveryDashboard() {
  const [tab, setTab] = useState<'overview' | 'dispatch' | 'trips' | 'people' | 'logs' | 'setup'>('overview');

  return (
    <div className="min-h-screen bg-bg-main text-white selection:bg-primary selection:text-white pb-20">
      <div className="p-4 sm:p-8 md:p-10 2xl:p-14 max-w-[1600px] mx-auto space-y-10">
        
        <div className="flex flex-col xl:flex-row justify-between items-center sm:items-start xl:items-center gap-6">
          <div className="flex items-center gap-5 group">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-sm transition-all group-hover:bg-primary/20">
               <Truck className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase leading-none">Logistics Hub</h1>
              <p className="text-[10px] font-bold text-tertiary mt-1.5 uppercase tracking-[0.3em] opacity-40">Operational Dashboard</p>
            </div>
          </div>
          
          <div className="bg-card w-full md:w-auto p-1.5 rounded-2xl border border-base shadow-lg flex overflow-x-auto no-scrollbar scroll-smooth">
            <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={LayoutDashboard} label="Overview" />
            <TabButton active={tab === 'dispatch'} onClick={() => setTab('dispatch')} icon={Layers} label="Board" />
            <TabButton active={tab === 'trips'} onClick={() => setTab('trips')} icon={Truck} label="Trips" />
            <TabButton active={tab === 'people'} onClick={() => setTab('people')} icon={UserIcon} label="Riders" />
            <TabButton active={tab === 'logs'} onClick={() => setTab('logs')} icon={MessageSquare} label="Logs" />
            <TabButton active={tab === 'setup'} onClick={() => setTab('setup')} icon={Settings} label="Setup" />
          </div>
        </div>

        <div className="bg-card rounded-[2rem] border border-base shadow-2xl p-6 sm:p-10 md:p-12 2xl:p-16">
           {tab === 'overview' && <OverviewTab />}
           {tab === 'dispatch' && <DispatchTab onTripCreated={() => setTab('trips')} />}
           {tab === 'trips' && <TripsTab />}
           {tab === 'people' && <PersonnelTab />}
           {tab === 'logs' && <LogsTab />}
           {tab === 'setup' && <SetupTab />}
        </div>
        
      </div>
    </div>
  );
}
