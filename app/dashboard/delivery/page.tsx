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
        : "border-transparent text-tertiary hover:text-white hover:bg-white/[0.02] font-semibold"
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary opacity-40" />
            <input 
              placeholder="Search ready orders..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 bg-surface text-[13px] pl-12 pr-4 rounded-xl border border-base focus:border-primary transition-all outline-none"
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
            <div key={idx} className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <div className="w-1 h-5 bg-primary rounded-full"></div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight">{route.route}</h3>
                <span className="text-[10px] font-bold text-tertiary opacity-60">({route.orders.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {route.orders.map(order => (
                  <Card 
                    key={order.id} 
                    onClick={() => toggleSelection(order.id, route.route)}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all cursor-pointer bg-card group relative",
                      selectedOrders.includes(order.id) 
                        ? "border-primary bg-primary/5 shadow-md" 
                        : "border-base hover:border-white/10"
                    )}
                  >
                    {selectedOrders.includes(order.id) && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest opacity-40">#{order.order_number || '---'}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                           onClick={async (e) => { 
                             e.stopPropagation(); 
                             try { 
                               await deliveryTripService.sendOrderToRiderWhatsapp(order.id); 
                               toast.success('WhatsApp sent!'); 
                             } catch { toast.error('WhatsApp failed'); }
                           }}
                           title="Send order to rider on WhatsApp"
                           className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button 
                           onClick={(e) => { e.stopPropagation(); setSelectedOrderForZone(order); setNewZoneId(order.delivery_info?.delivery_zone || ''); setIsZoneModalOpen(true); }}
                           className="p-1.5 rounded-lg text-tertiary hover:bg-white/5 transition-all"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-5">
                      <h4 className="text-sm font-bold text-white uppercase truncate mb-1">{order.delivery_info?.name}</h4>
                      <p className="text-[11px] text-emerald-500 font-bold flex items-center gap-1.5"><Phone className="w-3 h-3" /> {order.delivery_info?.phone}</p>
                    </div>

                    <div className="pt-4 border-t border-base space-y-4">
                       <p className="text-[12px] text-tertiary font-medium line-clamp-2 min-h-[32px]">{order.delivery_info?.address}</p>
                       <div className="flex justify-between items-center bg-surface p-2.5 rounded-xl border border-base">
                          <span className="text-[10px] font-bold text-white uppercase">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] font-bold text-primary flex items-center gap-1"><Zap className="w-3 h-3" /> {order.priority_score || '0'}</span>
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
          <div className="bg-card border border-base rounded-2xl p-6 space-y-8 shadow-sm">
            <h3 className="text-[11px] font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" /> Suggestions
            </h3>
            
            <div className="space-y-4">
              {suggestions.map((s, i) => (
                <div key={i} className="p-4 bg-surface rounded-xl border border-base hover:border-primary/30 transition-all group">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-bold text-primary uppercase">{s.route}</p>
                    <button 
                      onClick={() => {
                        const ids = (s as any).order_ids || ((s as any).orders || []).map((o:any) => o.id || o);
                        setSelectedOrders(ids);
                        setSelectedRoute(s.route);
                      }}
                      className="w-7 h-7 flex items-center justify-center bg-primary/10 rounded-lg text-primary hover:bg-primary hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white uppercase">{s.total_orders} Orders</p>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-base space-y-6">
              <div className="bg-surface p-4 rounded-xl border border-base text-center">
                <p className="text-2xl font-bold text-white">{selectedOrders.length}</p>
                <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Batch Load</p>
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
                className="h-12 text-[11px] font-bold uppercase tracking-widest rounded-xl bg-primary text-black"
              >
                Create Trip
              </Button>
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
      toast.success('Done');
      fetchData(true);
    } catch (e) { toast.error('Failed'); }
    finally { setIsProcessing(false); }
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
          <Card key={trip.id} className="p-6 border-base bg-card hover:border-white/10 transition-all flex flex-col rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mb-1 opacity-50">Trip ID</p>
                <h3 className="text-xl font-bold text-white tracking-tight">#{trip.trip_number || trip.id.substring(0,8)}</h3>
              </div>
              <Badge className={cn("px-3 py-1 rounded-full uppercase text-[10px] font-bold border", 
                trip.status === 'out' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                trip.status === 'completed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                "bg-white/5 text-tertiary border-white/5")}>
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
                  className="mb-8 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors group/note"
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
                }} className="flex-1 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-white text-[10px] font-bold uppercase tracking-widest"><Eye className="w-3.5 h-3.5 mr-2" /> Orders</button>
                {trip.delivery_person && (trip.status === 'assigned' || trip.status === 'out') && (
                  <button onClick={() => handleAction(trip.id, 'whatsapp')} className="w-11 h-11 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><MessageSquare className="w-4 h-4" /></button>
                )}
                {['draft', 'assigned'].includes(trip.status) && (
                  <button onClick={() => handleAction(trip.id, 'cancel')} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
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
                      <div className="overflow-hidden">
                        <p className="text-[12px] font-bold text-white uppercase truncate">{o.customer_name || 'Customer'}</p>
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
                  selectedRider === r.id ? "border-primary bg-primary/5 shadow-sm" : "border-base bg-surface hover:border-white/10"
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
            <div
              onClick={() => setSendWhatsapp(v => !v)}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                sendWhatsapp ? "border-emerald-500/30 bg-emerald-500/5" : "border-base bg-surface opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-4 h-4 text-emerald-500" />
                <span className="text-[11px] font-bold text-white uppercase tracking-widest">Send WhatsApp Notification</span>
              </div>
              <div className={`w-10 h-5 rounded-full p-0.5 transition-all duration-300 ${sendWhatsapp ? 'bg-emerald-500' : 'bg-surface border border-base'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${sendWhatsapp ? 'translate-x-5' : 'translate-x-0'}`}></div>
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
                  className={cn("w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center", selectedEligible.includes(o.id) ? "border-primary bg-primary/5" : "border-base bg-surface hover:border-white/10")}
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
            <Card key={p.id} className="p-6 border-base bg-card hover:border-white/10 transition-all rounded-2xl group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-surface border border-base flex items-center justify-center text-tertiary group-hover:text-primary transition-all"><UserIcon className="w-6 h-6" /></div>
                <div className="flex gap-2">
                  <button onClick={() => { setEdit(p); setModalOpen(true); }} className="p-2 text-tertiary hover:text-white"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={async () => {
                    if (!confirm('Delete?')) return;
                    try { await deliveryPersonService.delete(p.id); toast.success('Deleted'); fetchData(); } catch (e) { toast.error('Error'); }
                  }} className="p-2 text-tertiary hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="text-base font-bold text-white uppercase tracking-tight mb-2 truncate">{p.name}</h4>
              <Badge variant={p.status === 'available' ? 'success' : 'warning'} className="text-[10px] font-bold px-2 py-0.5 rounded-md self-start uppercase">{p.status}</Badge>
              <div className="mt-8 pt-4 border-t border-base space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-tertiary/60">
                   <span>PHONE</span>
                   <span className="text-white">{p.phone_number}</span>
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
                className="text-xs cursor-pointer hover:bg-white/[0.02] transition-colors"
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
        
        <div className="p-4 border-t border-base flex justify-between items-center bg-surface">
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
          <Card key={item.id} className="p-6 border-base bg-card hover:border-white/10 transition-all rounded-2xl group flex flex-col">
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

  const [tab, setTab] = useState<'dispatch' | 'trips' | 'people' | 'logs' | 'setup'>('dispatch');

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
            <TabButton active={tab === 'dispatch'} onClick={() => setTab('dispatch')} icon={LayoutDashboard} label="Board" />
            <TabButton active={tab === 'trips'} onClick={() => setTab('trips')} icon={Truck} label="Trips" />
            <TabButton active={tab === 'people'} onClick={() => setTab('people')} icon={UserIcon} label="Riders" />
            <TabButton active={tab === 'logs'} onClick={() => setTab('logs')} icon={MessageSquare} label="Logs" />
            <TabButton active={tab === 'setup'} onClick={() => setTab('setup')} icon={Settings} label="Setup" />
          </div>
        </div>

        <div className="bg-card rounded-[2rem] border border-base shadow-2xl p-6 sm:p-10 md:p-12 2xl:p-16">
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
