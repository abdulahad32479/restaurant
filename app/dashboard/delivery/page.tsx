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
  ExternalLink, ChevronRight, Filter, Settings
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

const TEXT_META = "text-[10px] uppercase font-bold text-tertiary tracking-widest mb-1";

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3 sm:px-6 py-3 sm:py-4 border-b-2 transition-all duration-200 outline-none flex-1 sm:flex-none justify-center sm:justify-start",
      active 
        ? "border-primary text-primary bg-primary/5 font-bold" 
        : "border-transparent text-secondary hover:text-white hover:bg-white/[0.02] font-medium"
    )}
  >
    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
    <span className="text-[10px] sm:text-sm whitespace-nowrap uppercase tracking-wider">{label}</span>
  </button>
);

const SectionHeading = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-6">
    <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
    <p className="text-sm text-tertiary mt-1">{subtitle}</p>
  </div>
);

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
    } catch (error) { toast.error('Failed to sync board'); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSelection = (orderId: string, route: string) => {
    if (selectedRoute && selectedRoute !== route) {
      toast.error(`Restriction: Select orders from ${selectedRoute} only`);
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

  if (isLoading) return <div className="py-40 text-center opacity-30 text-lg">Initializing board...</div>;

  const handleSendWhatsApp = async (orderId: string) => {
    try {
      await deliveryTripService.sendOrderToRiderWhatsapp(orderId);
      toast.success('Signal Transmitted to Rider');
    } catch (e: any) { 
      const msg = e.response?.data?.error || e.message || 'Transmission Failed';
      toast.error(msg === 'Order has no assigned rider' ? 'Assign a rider before signaling' : msg); 
    }
  };

  const handleUpdateZone = async () => {
    if (!selectedOrderForZone || !newZoneId) return;
    try {
      await orderService.updateDeliveryZone(selectedOrderForZone.id, newZoneId);
      toast.success('Vector Calibrated: Zone Updated');
      setIsZoneModalOpen(false);
      fetchData();
    } catch (e) { toast.error('Calibration Failed'); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
      <div className="lg:col-span-3 space-y-6 sm:space-y-10 order-2 lg:order-1">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
            <input 
              placeholder="Search ready orders by name or #ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 bg-surface text-sm pl-12 pr-4 rounded-xl border border-base focus:border-primary transition-all outline-none"
            />
          </div>
          <button onClick={fetchData} className="px-4 py-3 bg-card border border-base rounded-xl hover:bg-surface transition-all flex items-center gap-2 text-sm font-semibold">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-base rounded-3xl opacity-30">
            <Package className="w-16 h-16 mx-auto mb-6 text-tertiary" />
            <h3 className="text-xl font-bold text-white mb-2">No Ready Orders</h3>
            <p className="text-sm">When orders are marked as ready for delivery, they will appear here.</p>
          </div>
        ) : (
          filtered.map((route, idx) => (
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                <h3 className="text-lg font-bold text-white uppercase">{route.route}</h3>
                <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-tertiary">{route.orders.length} Ready</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {route.orders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => toggleSelection(order.id, route.route)}
                    className={cn(
                      "p-4 sm:p-6 rounded-2xl border-2 transition-all cursor-pointer bg-card group",
                      selectedOrders.includes(order.id) ? "border-primary bg-primary/[0.03] shadow-lg" : "border-base hover:border-white/20"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                      <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">#{order.order_number || order.id.substring(0,8)}</span>
                      <div className="flex gap-2 items-center">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedOrderForZone(order); setNewZoneId(order.delivery_info?.delivery_zone || ''); setIsZoneModalOpen(true); }}
                          className="p-1.5 bg-white/5 rounded-lg text-tertiary hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          title="Recalibrate Zone"
                        >
                          <MapPin className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order.id); }}
                          className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500/60 hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
                          title="WhatsApp Signal"
                        >
                          <MessageSquare className="w-3 h-3" />
                        </button>
                        {selectedOrders.includes(order.id) ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <div className="w-5 h-5 rounded-full border border-base group-hover:border-white/20" />}
                      </div>
                    </div>
                    <div className="mb-5">
                      <h4 className="text-lg font-bold text-white mb-1 truncate">{order.delivery_info?.name}</h4>
                      <p className="text-xs text-emerald-500 font-bold flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {order.delivery_info?.phone}</p>
                    </div>
                    <div className="pt-4 border-t border-base space-y-4">
                       <p className="text-sm text-tertiary leading-snug line-clamp-2 min-h-[40px]">{order.delivery_info?.address}</p>
                       <div className="flex justify-between items-center bg-surface/50 p-2.5 rounded-xl">
                          <span className="text-xs font-bold text-tertiary">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={cn("text-xs font-bold uppercase", (order.priority_score || 0) > 70 ? 'text-rose-500' : 'text-primary')}>Score: {order.priority_score || '0'}</span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {unroutedOrders.length > 0 && (
          <div className="space-y-4 pt-10 border-t border-dashed border-base">
            <div className="flex items-center gap-3 px-1">
              <div className="w-1.5 h-6 bg-rose-500 rounded-full animate-pulse"></div>
              <h3 className="text-lg font-bold text-white uppercase">Un-routed Payload</h3>
              <span className="px-3 py-1 bg-rose-500/10 rounded-full text-xs font-bold text-rose-500 border border-rose-500/20">{unroutedOrders.length} Detection(s)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {unroutedOrders.map(order => (
                <div key={order.id} className="p-6 rounded-2xl border-2 border-rose-500/20 bg-rose-500/[0.02] shadow-sm hover:border-rose-500/40 transition-all group relative overflow-hidden">
                   <div className="flex justify-between items-start mb-4">
                      <span className="text-[11px] font-bold text-tertiary uppercase tracking-wider">#{order.order_number || order.id.substring(0,8)}</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedOrderForZone(order); setNewZoneId(order.delivery_info?.delivery_zone || ''); setIsZoneModalOpen(true); }}
                          className="p-1.5 bg-white/5 rounded-lg text-tertiary hover:text-white transition-all"
                          title="Assign Zone"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleSendWhatsApp(order.id); }}
                          className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500/60 hover:text-emerald-500 transition-all"
                          title="WhatsApp Signal"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      </div>
                   </div>
                   <div className="mb-5">
                      <h4 className="text-lg font-bold text-white mb-1 truncate">{order.delivery_info?.name}</h4>
                      <p className="text-xs text-emerald-500 font-bold flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {order.delivery_info?.phone}</p>
                   </div>
                   <div className="pt-4 border-t border-rose-500/10 space-y-4">
                      <p className="text-sm text-tertiary leading-snug line-clamp-2 min-h-[40px]">{order.delivery_info?.address}</p>
                      <div className="flex justify-between items-center bg-black/20 p-2.5 rounded-xl">
                         <span className="text-xs font-bold text-tertiary">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                         <span className="text-xs font-black text-rose-500 uppercase tracking-widest">MISSING ZONE</span>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6 order-1 lg:order-2">
        <div className="p-6 sm:p-8 bg-card border border-base rounded-[2rem] space-y-6 sm:space-y-8 lg:sticky lg:top-8 shadow-xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-bold">Suggested Trips</h3>
            </div>
            <p className="text-sm text-tertiary">Grouped orders based on location sector.</p>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((s, i) => (
              <div key={i} className="p-5 bg-surface rounded-2xl border border-base hover:border-primary/40 transition-all cursor-default group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">{s.route}</span>
                  <button 
                    onClick={() => {
                      const ids = (s as any).order_ids || ((s as any).orders || []).map((o:any) => o.id || o);
                      setSelectedOrders(ids);
                      setSelectedRoute(s.route);
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-primary text-black text-[11px] font-bold rounded-lg hover:bg-white transition-all shadow-md active:scale-95"
                  >
                    SELECT
                  </button>
                </div>
                <p className="text-base font-bold text-white mb-2">{s.total_orders} Linked Orders</p>
                {s.reason && <p className="text-xs text-tertiary italic leading-relaxed bg-black/20 p-3 rounded-xl">"{s.reason}"</p>}
              </div>
            ))}
            {suggestions.length === 0 && <div className="text-center py-12 opacity-30 text-sm">Searching for efficient routes...</div>}
          </div>

          <div className="pt-8 border-t border-base">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-surface p-4 rounded-2xl border border-base text-center">
                <p className="text-[10px] text-tertiary uppercase font-bold tracking-widest mb-1">Payload</p>
                <p className="text-2xl font-bold text-white">{selectedOrders.length}</p>
              </div>
              <div className="bg-surface p-4 rounded-2xl border border-base text-center overflow-hidden">
                <p className={TEXT_META}>Target Sector</p>
                <p className="text-xs font-bold text-white truncate mt-1">{selectedRoute || '---'}</p>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-[10px] text-tertiary font-black uppercase tracking-widest px-1">Mission Strategy</p>
              <Select 
                value={targetTripId} 
                onChange={e => setTargetTripId(e.target.value)}
                options={[
                  { value: 'new', label: '+ CREATE NEW TRIP' },
                  ...trips.filter(t => t.route_name === selectedRoute || !t.route_name).map(t => ({ 
                    value: t.id, 
                    label: `ADD TO #${t.trip_number || t.id.substring(0,8)} (${t.delivery_person_name || 'NO RIDER'})` 
                  }))
                ]}
                className="h-12 text-xs font-bold uppercase transition-all"
              />
            </div>

            <Button 
              variant="primary" 
              fullWidth 
              disabled={selectedOrders.length === 0}
              onClick={() => setIsModalOpen(true)}
              className="h-14 font-bold text-lg rounded-2xl"
            >
              {targetTripId === 'new' ? 'Assemble Trip' : 'Inject Orders'}
            </Button>
            <button 
              onClick={() => { setSelectedOrders([]); setSelectedRoute(null); }}
              className="w-full text-center text-xs text-tertiary mt-6 hover:text-white transition-colors"
            >
              Discard Selections
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={targetTripId === 'new' ? "Create Delivery Trip" : "Update Delivery Manifest"} size="md">
        <div className="space-y-8 pt-2">
          <div className="p-8 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
               {targetTripId === 'new' ? <Truck className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
            </div>
            <div>
              <p className="text-sm text-primary font-bold">Preparation Summary</p>
              <h3 className="text-2xl font-bold">{selectedOrders.length} Orders to {targetTripId === 'new' ? 'Initialize' : 'Inject'}</h3>
            </div>
          </div>
          {targetTripId === 'new' && (
            <Input 
              label="Internal Notes" 
              placeholder="e.g. Call customer before arrival..." 
              value={tripNotes} 
              onChange={e => setTripNotes(e.target.value)}
              className="h-14"
            />
          )}
          <div className="flex gap-4">
            <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)} className="h-14 font-bold rounded-2xl">Abort</Button>
            <Button variant="primary" fullWidth isLoading={isCreating} onClick={async () => {
              setIsCreating(true);
              try {
                if (targetTripId === 'new') {
                  await deliveryTripService.createTrip({ order_ids: selectedOrders, notes: tripNotes, is_custom: true });
                  toast.success('Trip Finalized');
                } else {
                  await deliveryTripService.addOrdersToTrip({ trip_id: targetTripId, order_ids: selectedOrders });
                  toast.success('Manifest Expanded');
                }
                setIsModalOpen(false); setSelectedOrders([]); setTripNotes(''); setTargetTripId('new');
                fetchData(); onTripCreated();
              } catch (e) { toast.error(targetTripId === 'new' ? 'Creation failed' : 'Update failed'); }
              finally { setIsCreating(false); }
            }} className="h-14 font-bold rounded-2xl">Confirm Manifest</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isZoneModalOpen} onClose={() => setIsZoneModalOpen(false)} title="Sector Calibration" size="sm">
        <div className="space-y-6 pt-2">
           <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                 <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] text-primary font-bold uppercase">Target: #{selectedOrderForZone?.order_number || '---'}</p>
                <h3 className="text-xl font-bold uppercase tracking-tighter">Adjust Zone</h3>
              </div>
           </div>
           
           <div className="space-y-2">
              <p className="text-[10px] font-bold text-tertiary uppercase px-1">Choose New Sector</p>
              <Select 
                value={newZoneId}
                onChange={e => setNewZoneId(e.target.value)}
                options={[{value:'', label:'UNSET / MANUAL'}, ...zones.map(z => ({value:z.id, label:z.name.toUpperCase()}))]}
                className="h-14 font-bold uppercase"
              />
           </div>

           <div className="flex gap-4 pt-4 border-t border-base">
              <Button variant="outline" fullWidth onClick={() => setIsZoneModalOpen(false)} className="h-14 font-bold rounded-xl">Abort</Button>
              <Button variant="primary" fullWidth onClick={handleUpdateZone} className="h-14 font-bold rounded-xl">Confirm Calibration</Button>
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
  const [selectedRider, setSelectedRider] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [tripsData, ridersResponse] = await Promise.all([
        deliveryTripService.getTrips({}),
        apiClient.get('v1/delivery-persons/').then(res => res.data).catch(() => [])
      ]);
      setTrips(tripsData.results || []);
      setRiders(ridersResponse || []);
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string, action: string) => {
    if (action === 'cancel' && !confirm('Dissolve this trip? Orders will be returned to dispatch board.')) return;
    setIsProcessing(true);
    try {
      if (action === 'dispatch') await deliveryTripService.dispatchTrip(id);
      else if (action === 'complete') await deliveryTripService.completeTrip(id);
      else if (action === 'cancel') await deliveryTripService.cancelTrip(id);
      else if (action === 'whatsapp') await deliveryTripService.sendTripToRiderWhatsapp(id);
      else if (action === 'whatsapp_order') await deliveryTripService.sendOrderToRiderWhatsapp(id);
      else if (action === 'served') await orderService.markServed(id, {});
      toast.success('Operation Successful');
      fetchData(true);
    } catch (e) { toast.error('Operation Failed'); }
    finally { setIsProcessing(false); }
  };

  const removeOrder = async (tripId: string, orderId: string) => {
    if (!confirm('Remove this order from the manifest?')) return;
    try {
      await deliveryTripService.removeOrderFromTrip({ trip_id: tripId, order_id: orderId });
      toast.success('Manifest Updated');
      fetchData(true);
    } catch (e) { toast.error('Action Failed'); }
  };

  if (isLoading) return <div className="py-40 text-center opacity-30 text-lg">Retrieving missions...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {trips.length === 0 ? (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-base rounded-[3rem] opacity-30">
            <Truck className="w-20 h-20 mx-auto mb-6 text-tertiary" />
            <h3 className="text-xl font-bold text-white">No Active Missions</h3>
            <p className="text-sm text-tertiary mt-2">Active and pending trips will be listed here.</p>
          </div>
        ) : (
          trips.map(trip => (
            <Card key={trip.id} className="relative border-base bg-card hover:border-white/10 transition-all flex flex-col shadow-lg overflow-hidden rounded-[2.5rem]">
              <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-tertiary tracking-widest mb-1.5">Mission Code</p>
                    <h3 className="text-2xl font-black text-white">#{trip.trip_number || trip.id.substring(0,8)}</h3>
                  </div>
                  <Badge className={cn("px-4 py-1.5 rounded-full uppercase text-xs font-black tracking-widest border", 
                    trip.status === 'out' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                    trip.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                    "bg-white/5 text-secondary border-white/5")}>
                    {trip.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="p-4 bg-surface rounded-2xl border border-base">
                    <p className="text-[10px] uppercase font-bold text-tertiary tracking-widest mb-1">Route Sector</p>
                    <p className="text-sm font-bold text-white truncate">{trip.route_name || 'Generic'}</p>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-base overflow-hidden relative group/rider">
                    <p className="text-[10px] uppercase font-bold text-tertiary tracking-widest mb-1">Assigned Rider</p>
                    <div className="flex justify-between items-center gap-2">
                      <p className={cn("text-sm font-bold truncate", trip.delivery_person_name ? "text-info" : "text-rose-500/60")}>
                        {trip.delivery_person_name || 'NOT SET'}
                      </p>
                      {['assigned', 'out'].includes(trip.status) && (
                        <button 
                          onClick={() => setAssignModal(trip)}
                          className="p-1.5 opacity-0 group-hover/rider:opacity-100 bg-white/5 hover:bg-white/10 rounded-lg text-tertiary hover:text-white transition-all"
                          title="Change Rider"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4 border-t border-base">
                  {trip.status === 'draft' && <Button variant="primary" fullWidth className="h-14 font-bold rounded-2xl text-base" onClick={() => setAssignModal(trip)}>Assign Rider</Button>}
                  {trip.status === 'assigned' && <Button variant="primary" fullWidth className="h-14 font-bold rounded-2xl text-base bg-amber-500 border-amber-500 text-black shadow-lg" onClick={() => handleAction(trip.id, 'dispatch')} isLoading={isProcessing}>Launch Dispatch</Button>}
                  {trip.status === 'out' && <Button variant="primary" fullWidth className="h-14 font-bold rounded-2xl text-base bg-emerald-500 border-emerald-500 text-black shadow-lg" onClick={() => handleAction(trip.id, 'complete')} isLoading={isProcessing}>Return Registry</Button>}
                  
                  <div className="flex w-full gap-3">
                    {trip.delivery_person && (trip.status === 'assigned' || trip.status === 'out') && (
                      <button 
                        onClick={() => handleAction(trip.id, 'whatsapp')}
                        className="flex-1 h-14 flex items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                        title="Re-send manifest to WhatsApp"
                      >
                        <MessageSquare className="w-6 h-6" />
                      </button>
                    )}
                    <button 
                      onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}
                      className={cn("h-14 flex items-center justify-center rounded-2xl border transition-all active:scale-95", 
                        expanded === trip.id ? "bg-primary border-primary text-black flex-[2]" : "bg-white/5 border-white/10 text-white/30 hover:text-white flex-1")}
                    >
                      <Eye className="w-6 h-6 mr-2" /> <span className={expanded === trip.id ? 'block' : 'hidden'}>Manifest</span>
                    </button>
                    {['draft', 'assigned'].includes(trip.status) && (
                      <button 
                        onClick={() => handleAction(trip.id, 'cancel')}
                        className="flex-1 h-14 flex items-center justify-center rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-500/60 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {expanded === trip.id && (
                <div className="bg-black/20 border-t border-base p-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <h4 className="text-[11px] uppercase font-black text-tertiary tracking-[0.2em]">Package Manifest</h4>
                    <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">{(trip.trip_orders || trip.orders || []).length} Units</span>
                  </div>
                  {(trip.trip_orders || trip.orders || []).map((o: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-card border border-white/5 rounded-2xl hover:border-primary/40 transition-all group">
                      <div className="overflow-hidden">
                        <p className="text-base font-bold text-white mb-0.5">{o.customer_name || 'Unknown Client'}</p>
                        <div className="flex items-center gap-4 text-xs font-semibold text-tertiary">
                           <span className="opacity-40">#{o.order_number || o.id.substring(0,8)}</span>
                           <span className="text-emerald-500/80 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {o.customer_phone || o.delivery_info?.phone}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAction(o.id, 'whatsapp_order')}
                          className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500/40 hover:bg-emerald-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          title="Send individual order to WhatsApp"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </button>
                        {trip.status === 'out' && o.status !== 'served' && (
                          <button 
                            onClick={() => handleAction(o.id, 'served')}
                            className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary/60 hover:bg-primary hover:text-black transition-all opacity-0 group-hover:opacity-100"
                            title="Mark as Delivered"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => removeOrder(trip.id, o.id)}
                          className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-rose-500/40 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          title="Remove from trip"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={!!assignModal} onClose={() => setAssignModal(null)} title="Elite Fleet Selection" size="lg">
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-3 custom-scrollbar">
            {riders.map(r => (
              <button 
                key={r.id} 
                onClick={() => setSelectedRider(r.id)}
                className={cn(
                  "flex items-center justify-between p-6 rounded-2xl border-2 transition-all",
                  selectedRider === r.id ? "border-primary bg-primary/10" : "border-base bg-card hover:bg-surface"
                )}
              >
                <div className="flex items-center gap-6 text-left">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all", 
                    selectedRider === r.id ? "bg-primary text-black" : "bg-surface text-tertiary")}>
                    <Bike className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white mb-0.5">{r.name}</p>
                    <div className="flex items-center gap-4 text-xs font-semibold text-tertiary opacity-60">
                       <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {r.phone_number}</span>
                       <Badge variant={r.status === 'available' ? 'success' : 'warning'} className="text-[10px] rounded-md">{r.status}</Badge>
                    </div>
                  </div>
                </div>
                {selectedRider === r.id && <div className="bg-primary p-1.5 rounded-full shadow-lg"><CheckCircle2 className="w-5 h-5 text-black" /></div>}
              </button>
            ))}
          </div>
          <div className="flex gap-4 pt-6 mt-2 border-t border-base">
            <Button variant="outline" fullWidth onClick={async () => {
              if (!selectedRider || !assignModal) return;
              setIsProcessing(true);
              try { 
                if (assignModal.delivery_person) {
                  await deliveryTripService.reassignTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: true });
                } else {
                  await deliveryTripService.assignTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: true });
                }
                toast.success(assignModal.delivery_person ? 'Personnel Reallocated' : 'Personnel Allocated'); 
                setAssignModal(null); 
                fetchData(true); 
              } 
              catch (e) { toast.error('Action Failed'); } finally { setIsProcessing(false); }
            }} disabled={!selectedRider} className="h-16 font-bold text-base rounded-2xl">
              {assignModal?.delivery_person ? 'RE-ASSIGN' : 'SOLO ASSIGN'}
            </Button>
            <Button variant="primary" fullWidth onClick={async () => {
              if (!selectedRider || !assignModal) return;
              setIsProcessing(true);
              try { 
                if (assignModal.delivery_person) {
                  await deliveryTripService.reassignTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: true });
                  await deliveryTripService.dispatchTrip(assignModal.id);
                } else {
                  await deliveryTripService.assignAndDispatchTrip({ trip_id: assignModal.id, person_id: selectedRider, send_whatsapp: true });
                }
                toast.success('Trip Deployed'); 
                setAssignModal(null); 
                fetchData(true); 
              } 
              catch (e) { toast.error('Action Failed'); } finally { setIsProcessing(false); }
            }} disabled={!selectedRider} className="h-16 font-bold text-base rounded-2xl shadow-xl">
              {assignModal?.delivery_person ? 'RE-ASSIGN & LAUNCH' : 'ASSIGN & LAUNCH'}
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
    catch (e) { toast.error('Registry sync failure'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    if (!edit?.name || !edit?.phone_number) return;
    setIsSaving(true);
    try {
      if (edit.id) await deliveryPersonService.update(edit.id, edit);
      else await deliveryPersonService.create(edit as any);
      toast.success('Fleet registry updated');
      setModalOpen(false);
      fetchData();
    } catch (e) { toast.error('Commit failed'); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Fleet Registry</h2>
          <p className="text-sm text-tertiary mt-1">Manage active logistic units and field personnel.</p>
        </div>
        <Button variant="primary" onClick={() => { setEdit({ is_active: true, status: 'available' }); setModalOpen(true); }} className="h-14 px-8 font-bold rounded-2xl text-base shadow-lg">
          <Plus className="w-6 h-6 mr-3" /> Initialize Node
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full py-40 text-center opacity-30 text-lg">Scanning nodes...</div>
        ) : people.length === 0 ? (
           <div className="col-span-full py-24 text-center border-2 border-dashed border-base rounded-3xl opacity-30">
              <UserIcon className="w-16 h-16 mx-auto mb-6 opacity-10" />
              <p className="text-lg font-bold">No registered personnel found</p>
           </div>
        ) : people.map(p => (
          <div key={p.id} className="bg-card border border-base rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-8 shadow-sm hover:border-primary/40 hover:bg-surface/30 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-16 h-16 rounded-[1.5rem] bg-surface border border-base flex items-center justify-center text-tertiary group-hover:bg-primary group-hover:text-black transition-all">
                <UserIcon className="w-8 h-8" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEdit(p); setModalOpen(true); }} className="p-2.5 text-tertiary hover:text-white transition-all bg-white/5 rounded-xl"><Edit2 className="w-4 h-4" /></button>
                <button 
                  onClick={async () => {
                    if (!confirm('Deregister personnel node? All active links will be severed.')) return;
                    try { await deliveryPersonService.delete(p.id); toast.success('Identity Purged'); fetchData(); } catch (e) { toast.error('Action Failed'); }
                  }} 
                  className="p-2.5 text-tertiary hover:text-rose-500 transition-all bg-white/5 rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 relative z-10">
              <div>
                <h4 className="text-2xl font-black text-white mb-2 leading-tight uppercase tracking-tighter">{p.name}</h4>
                <Badge className={cn("px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase border", 
                  p.status === 'available' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20')}>
                  {p.status}
                </Badge>
              </div>
              
              <div className="pt-6 border-t border-base space-y-3">
                <div className="flex justify-between items-center bg-surface/40 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-tertiary opacity-40" />
                    <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">Phone</span>
                  </div>
                  <span className="text-xs font-bold text-white">{p.phone_number}</span>
                </div>
                {p.whatsapp_number && (
                  <div className="flex justify-between items-center bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500/40" />
                      <span className="text-[10px] font-black text-emerald-500/40 uppercase tracking-widest">WhatsApp</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-500">{p.whatsapp_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Fleet Node Registry Form" size="md">
        <div className="space-y-8 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Full Identity Name *" value={edit?.name || ''} onChange={e => setEdit({...edit, name: e.target.value.toUpperCase()})} placeholder="E.G. JOHN SMITH" className="h-14 font-bold" />
            <div className="space-y-2">
              <p className="text-xs font-black text-tertiary uppercase tracking-widest px-1">Active Status</p>
              <Select 
                value={edit?.status || 'available'} 
                onChange={e => setEdit({...edit, status: e.target.value as any})} 
                options={[{value:'available', label:'READY / ACTIVE'}, {value:'busy', label:'OCCUPIED EN ROUTE'}, {value:'off_duty', label:'OFF-DUTY / INACTIVE'}]}
                className="h-14 text-sm font-bold uppercase"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Signal Phone *" value={edit?.phone_number || ''} onChange={e => setEdit({...edit, phone_number: e.target.value})} icon={<Phone className="w-4 h-4" />} placeholder="XXX-XXXXXXX" className="h-14" />
            <Input label="WhatsApp Line" value={edit?.whatsapp_number || ''} onChange={e => setEdit({...edit, whatsapp_number: e.target.value})} icon={<MessageSquare className="w-4 h-4 text-emerald-500" />} placeholder="XXX-XXXXXXX" className="h-14" />
          </div>
          <div className="flex gap-4 pt-6 mt-4 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)} className="h-16 font-bold rounded-2xl text-base">ABORT</Button>
            <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave} className="h-16 font-bold rounded-2xl text-base shadow-xl">COMMIT NODE</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const LogsTab = () => {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`v1/whatsapp-logs/?page=${page}`);
      const data = response.data;
      if (data.results) {
        setLogs(data.results);
        setTotal(data.count || 0);
      } else {
        setLogs(Array.isArray(data) ? data : []);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = logs.filter(l => l.phone_number?.includes(query) || l.message_text?.toLowerCase().includes(query.toLowerCase()) || l.delivery_person_name?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <SectionHeading title="Communication Stream" subtitle="Audit log of all WhatsApp signals transmitted from this branch." />
      
      <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-6 rounded-[2rem] border border-base shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-tertiary" />
          <input 
            placeholder="Search transmission logs by signal node or payload..." 
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-16 bg-surface pl-16 pr-6 text-sm font-semibold rounded-2xl border border-base focus:border-primary transition-all outline-none"
          />
        </div>
        <button onClick={fetchData} className="px-8 h-16 bg-surface border border-base rounded-2xl hover:bg-card transition-all flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-tertiary hover:text-primary">
          <RefreshCw className="w-5 h-5" /> RE-SCAN
        </button>
      </div>

      <div className="bg-card border border-base rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface/50 text-[11px] font-black text-white/20 uppercase tracking-[0.4em] border-b border-base">
                <th className="px-4 sm:px-10 py-6 sm:py-10">Signal Node</th>
                <th className="px-4 sm:px-10 py-6 sm:py-10">Object Reference</th>
                <th className="px-4 sm:px-10 py-6 sm:py-10">Status Flux</th>
                <th className="px-4 sm:px-10 py-6 sm:py-10">Decrypted Payload</th>
                <th className="px-4 sm:px-10 py-6 sm:py-10">Registry Clock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base">
              {loading ? (
                <tr><td colSpan={5} className="py-20 sm:py-40 text-center opacity-30 text-[12px] font-bold uppercase tracking-[2em]">Analyzing frequencies...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 sm:py-40 text-center opacity-30">Frequency Static: No Logs Found</td></tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.015] transition-all group">
                  <td className="px-4 sm:px-10 py-6 sm:py-10">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-surface border border-base flex items-center justify-center text-white/10 group-hover:text-primary transition-colors"><UserIcon className="w-5 h-5 sm:w-6 sm:h-6" /></div>
                       <div>
                          <p className="font-bold text-white text-sm sm:text-base leading-tight uppercase group-hover:text-primary transition-colors">{log.delivery_person_name || 'Rider'}</p>
                          <p className="text-[10px] sm:text-xs font-semibold text-tertiary opacity-40">{log.phone_number}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-10 py-6 sm:py-10">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{log.target_type}</span>
                        <span className="text-xs font-bold text-white/40 truncate max-w-[120px]">{log.target_id.split('-')[0]}...</span>
                     </div>
                  </td>
                  <td className="px-4 sm:px-10 py-6 sm:py-10">
                    <Badge className={cn("px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black tracking-widest uppercase border", 
                      ['sent', 'delivered', 'read'].includes(log.status) ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20")}>
                      {log.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 sm:px-10 py-6 sm:py-10 max-w-sm xl:max-w-lg">
                    <div className="p-3 sm:p-4 bg-surface rounded-2xl border border-white/5 group-hover:border-white/10 transition-all">
                      <p className="text-xs sm:text-sm text-tertiary font-medium leading-relaxed italic opacity-80 group-hover:opacity-100">"{log.message_text || 'System signal transmitted'}"</p>
                    </div>
                  </td>
                  <td className="px-4 sm:px-10 py-6 sm:py-10">
                     <div className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-tertiary opacity-40">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && total > 20 && (
          <div className="px-10 py-6 bg-surface/30 border-t border-base flex justify-between items-center">
            <p className="text-xs text-tertiary font-bold">Total Signals: {total}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-10 px-4 rounded-xl">Previous</Button>
              <Button size="sm" variant="outline" disabled={logs.length < 20 && page * 20 >= total} onClick={() => setPage(p => p + 1)} className="h-10 px-4 rounded-xl">Next</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SetupTab = () => {
  const [type, setType] = useState<'routes' | 'zones'>('routes');
  const [data, setData] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<any>(null);
  const [form, setForm] = useState<any>({ name: '', sort_order: 1, route: '', default_travel_minutes: 30 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [res, rRes] = await Promise.all([
        apiClient.get(type === 'routes' ? 'v1/delivery-routes/' : 'v1/delivery-zones/'),
        apiClient.get('v1/delivery-routes/')
      ]);
      setData(res.data || []); setRoutes(rRes.data || []);
    } finally { setLoading(false); }
  }, [type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async () => {
    if (!form.name) return;
    try {
      const ep = type === 'routes' ? 'v1/delivery-routes/' : 'v1/delivery-zones/';
      if (modal?.id) await apiClient.patch(`${ep}${modal.id}/`, form);
      else await apiClient.post(ep, form);
      toast.success('Matrix Configured'); setModal(null); fetchData();
    } catch (e) { toast.error('Handshake Failed'); }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8">
        <div className="flex bg-card p-1.5 rounded-2xl border border-base shadow-inner">
          <button onClick={() => setType('routes')} className={cn("px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", type === 'routes' ? "bg-primary text-black shadow-lg" : "text-tertiary hover:text-white")}>Matrix Routes</button>
          <button onClick={() => setType('zones')} className={cn("px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all", type === 'zones' ? "bg-primary text-black shadow-lg" : "text-tertiary hover:text-white")}>Sector Zones</button>
        </div>
        <Button variant="primary" onClick={() => { setForm({ name: '', sort_order: data.length + 1, route: '', default_travel_minutes: 30 }); setModal({}); }} className="h-14 px-8 font-bold rounded-2xl">
          <Plus className="w-6 h-6 mr-3" /> Initialize Sector
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {loading ? (
          <div className="col-span-full py-40 text-center opacity-30 text-lg uppercase tracking-[1em]">Decoding matrix...</div>
        ) : data.length === 0 ? (
           <div className="col-span-full py-24 text-center border-2 border-dashed border-base rounded-3xl opacity-30">
              <Layers className="w-16 h-16 mx-auto mb-6 opacity-10" />
              <p className="text-lg font-bold">No mapping sectors defined</p>
           </div>
        ) : data.map(item => (
          <div key={item.id} className="bg-card border border-base rounded-[2.5rem] p-6 sm:p-10 space-y-6 sm:space-y-10 hover:border-primary/40 hover:bg-surface/30 transition-all shadow-sm group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-surface border border-base flex items-center justify-center text-white/20 group-hover:text-primary transition-all">
                 <Layers className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setModal(item); setForm(item); }} className="p-2.5 bg-white/5 rounded-xl text-tertiary hover:text-white transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={async () => {
                  if (!confirm('Abort sector node? Registry link will be deleted.')) return;
                  try { await apiClient.delete(`${type === 'routes' ? 'v1/delivery-routes/' : 'v1/delivery-zones/'}${item.id}/`); toast.success('Sector Purged'); fetchData(); } catch (e) { toast.error('Action Failed'); }
                }} className="p-2.5 bg-white/5 rounded-xl text-tertiary hover:text-rose-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="relative z-10">
              <h4 className="text-2xl font-black text-white leading-tight uppercase tracking-tighter mb-1.5">{item.name}</h4>
              <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em] flex items-center gap-2 opacity-60">
                 <MapPin className="w-3.5 h-3.5" /> {item.route_name || (type === 'routes' ? 'HUB ORIGIN' : 'ZONE NODE')}
              </p>
            </div>
            <div className="pt-8 border-t border-base flex justify-between items-center text-[11px] font-black uppercase tracking-widest relative z-10">
              <span className="text-tertiary opacity-40">Matrix Rank</span>
              <span className="text-white font-mono text-lg">#{item.sort_order.toString().padStart(2, '0')}</span>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(null)} title={type === 'routes' ? 'Route Matrix Config' : 'Sector Zone Config'} size="md">
        <div className="space-y-8 pt-4">
          <div className="p-6 sm:p-10 bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 sm:gap-10 group shadow-inner">
             <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-[1.5rem] sm:rounded-[1.8rem] flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-glow-amber/10 group-hover:scale-105 transition-transform duration-700">
                <Zap className="w-8 h-8 sm:w-10 sm:h-10" />
             </div>
             <div className="text-center sm:text-left">
                <p className="text-[10px] sm:text-xs font-black text-amber-500/60 uppercase tracking-widest mb-1.5">Nodal Matrix</p>
                <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter leading-none">Sector Setup</h3>
             </div>
          </div>
          
          <div className="space-y-8">
             <Input label="Descriptor Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value.toUpperCase()})} placeholder="E.G. SECTOR SEVEN" className="h-16 font-bold" />
             {type === 'zones' && (
               <div className="space-y-3">
                 <p className="text-xs font-black text-tertiary uppercase tracking-widest px-1">Parent Identity *</p>
                 <Select value={form.route} onChange={e => setForm({...form, route: e.target.value})} options={[{value:'', label:'CHOOSE PARENT SECTOR...'}, ...routes.map(r => ({value:r.id, label:r.name.toUpperCase()}))]} className="h-16 text-sm font-bold uppercase" />
               </div>
             )}
             <div className="grid grid-cols-2 gap-8">
               <Input type="number" label="Rank Scale" value={form.sort_order} onChange={e => setForm({...form, sort_order: parseInt(e.target.value)})} className="h-16 font-bold" />
               {type === 'routes' && <Input type="number" label="Shift Time (M)" value={form.default_travel_minutes} onChange={e => setForm({...form, default_travel_minutes: parseInt(e.target.value)})} className="h-16 font-bold" />}
             </div>
          </div>
          
          <div className="flex gap-6 pt-10 mt-2 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setModal(null)} className="h-18 font-bold rounded-3xl text-sm">ABORT</Button>
            <Button variant="primary" fullWidth onClick={handleSave} className="h-18 font-bold rounded-3xl text-sm bg-amber-500 border-amber-500 text-black shadow-glow-amber/20">COMMIT SCRIPTS</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- MAIN EXPORT ---

export default function UnifiedLogisticsDashboard() {
  const [tab, setTab] = useState<'dispatch' | 'trips' | 'people' | 'logs' | 'setup'>('dispatch');

  return (
    <div className="p-4 sm:p-6 md:p-12 max-w-[1700px] mx-auto min-h-screen bg-bg-main text-white selection:bg-primary selection:text-white">
      {/* PROFESSIONAL HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 md:gap-10 mb-8 md:mb-12">
        <div className="flex items-center gap-4 sm:gap-8 group">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl sm:rounded-[1.8rem] flex items-center justify-center border border-primary/20 shadow-glow-primary/5 transition-all duration-700 hover:rounded-2xl hover:scale-105 active:scale-95 group-hover:bg-primary/20">
             <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-primary shadow-glow-primary" />
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-2xl sm:text-4xl font-black tracking-tighter uppercase group-hover:text-primary transition-colors">Fleet Central</h1>
            <div className="flex items-center gap-3 sm:gap-4">
               <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald"></div>
                  <span className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-widest opacity-80">Sync Online</span>
               </div>
               <span className="text-[8px] sm:text-[10px] font-black text-white/10 uppercase tracking-[0.2em] sm:tracking-[0.5em] group-hover:text-white/20 transition-colors">V: BRANCH-LOGS.4</span>
            </div>
          </div>
        </div>
        
        {/* CLEAN TAB NAVIGATION */}
        <div className="bg-card w-full lg:w-auto p-1.5 rounded-[2rem] border border-base shadow-lg flex overflow-x-auto no-scrollbar scroll-smooth">
          <TabButton active={tab === 'dispatch'} onClick={() => setTab('dispatch')} icon={LayoutDashboard} label="Dispatch" />
          <TabButton active={tab === 'trips'} onClick={() => setTab('trips')} icon={Truck} label="Missions" />
          <TabButton active={tab === 'people'} onClick={() => setTab('people')} icon={Bike} label="Personnel" />
          <TabButton active={tab === 'logs'} onClick={() => setTab('logs')} icon={MessageSquare} label="Signals" />
          <TabButton active={tab === 'setup'} onClick={() => setTab('setup')} icon={Settings} label="Matrix" />
        </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className="bg-card rounded-[2rem] sm:rounded-[3rem] border border-base shadow-[0_48px_96px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="p-5 sm:p-8 md:p-12 lg:p-16">
          {tab === 'dispatch' && <DispatchTab onTripCreated={() => setTab('trips')} />}
          {tab === 'trips' && <TripsTab />}
          {tab === 'people' && <PersonnelTab />}
          {tab === 'logs' && <LogsTab />}
          {tab === 'setup' && <SetupTab />}
        </div>
      </div>

      {/* STRATEGIC FOOTER */}
      <div className="mt-20 pt-10 border-t border-base flex flex-col md:flex-row justify-between items-center gap-8 opacity-10 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-1000 select-none">
         <div className="flex items-center gap-6">
            <div className="w-20 h-px bg-white/20"></div>
            <p className="text-[11px] font-black uppercase tracking-[0.8em] whitespace-nowrap">Operational Command Central Infrastructure</p>
         </div>
         <div className="flex gap-10">
           {['Network', 'Auth', 'Sync'].map(tag => (
             <div key={tag} className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{tag} OK</span>
             </div>
           ))}
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 hover:text-white/30 truncate transition-colors">© 2026 DUKE'S CLOUD LOGISTICS INC.</p>
      </div>
    </div>
  );
}
