"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Select } from '@/src/components/Input';
import { deliveryTripService } from '@/src/services/delivery-trip.service';
import { DeliveryTrip, DeliveryPerson, TripStatus } from '@/src/types';
import { 
  Plus, Truck, CheckCircle2, Bike, XCircle, Send, MoreVertical, 
  MapPin, Clock, Calendar, Search, Filter, Phone, User as UserIcon, AlertCircle, ShoppingBag, Eye, Trash2, LayoutList, ChevronRight, Zap, Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/src/lib/axios';

export default function DeliveryTripsPage() {
  const [trips, setTrips] = useState<DeliveryTrip[]>([]);
  const [riders, setRiders] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riderFilter, setRiderFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Action states
  const [selectedTrip, setSelectedTrip] = useState<DeliveryTrip | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRider, setSelectedRider] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [tripsData, ridersData] = await Promise.all([
        deliveryTripService.getTrips({ 
           status: statusFilter !== 'all' ? statusFilter : undefined,
           delivery_person: riderFilter !== 'all' ? riderFilter : undefined,
           search: searchQuery || undefined
        }),
        apiClient.get('v1/delivery-persons/').then(res => res.data).catch(() => [])
      ]);
      
      setTrips(tripsData.results || []);
      setRiders(ridersData);
    } catch (error) {
      console.error('Failed to fetch trips', error);
      toast.error('Failed to load trips');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [statusFilter, riderFilter, searchQuery]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAssignTrip = async (dispatchImmediately = false) => {
    if (!selectedTrip || !selectedRider) return;
    setIsProcessing(true);
    try {
      if (dispatchImmediately) {
        await deliveryTripService.assignAndDispatchTrip({
          trip_id: selectedTrip.id,
          person_id: selectedRider,
          send_whatsapp: sendWhatsApp
        });
        toast.success(`Trip assigned and dispatched!`);
      } else {
        await deliveryTripService.assignTrip({
          trip_id: selectedTrip.id,
          person_id: selectedRider,
          send_whatsapp: sendWhatsApp
        });
        toast.success(`Trip assigned successfully!`);
      }
      setIsAssignModalOpen(false);
      setSelectedTrip(null);
      setSelectedRider('');
      fetchData(true);
    } catch (error) {
      console.error('Failed to process trip assignment', error);
      toast.error('Failed to process trip assignment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = async (tripId: string, action: 'dispatch' | 'complete' | 'cancel' | 'remove_order', orderId?: string) => {
    setIsProcessing(true);
    try {
      if (action === 'dispatch') await deliveryTripService.dispatchTrip(tripId);
      else if (action === 'complete') await deliveryTripService.completeTrip(tripId);
      else if (action === 'cancel') await deliveryTripService.cancelTrip(tripId);
      else if (action === 'remove_order' && orderId) {
        await deliveryTripService.removeOrderFromTrip({ trip_id: tripId, order_id: orderId });
      }
      
      toast.success(`Operation successfully registered: ${action.toUpperCase()}`);
      fetchData(true);
    } catch (error) {
      console.error(`Failed to execute trip action: ${action}`, error);
      toast.error(`Error: Trip ${action} refused by server`);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColors: Record<TripStatus | string, string> = {
    draft: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    assigned: 'bg-info/10 text-info border-info/20',
    out: 'bg-warning/10 text-warning border-warning/20',
    completed: 'bg-success/10 text-success border-success/20',
    cancelled: 'bg-error/10 text-error border-error/20'
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-glow-primary"></div>
          <p className="text-sm font-black text-tertiary uppercase tracking-widest animate-pulse">Syncing Fleet Operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Truck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              ACTIVE LOGISTICS
            </h1>
            <p className="text-tertiary text-[10px] mt-0.5 uppercase tracking-widest font-bold">Trip orchestration & commander control</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            className="border-white/10 hover:bg-white/5 h-10 px-6 uppercase tracking-widest text-[10px] font-bold rounded-xl"
          >
            System Sync
          </Button>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/dashboard/delivery/dispatch'}
            className="h-10 px-6 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-primary/20 rounded-xl"
            icon={<Plus className="w-4 h-4" />}
          >
            Create Trip
          </Button>
        </div>
      </div>

      {/* Logic Matrix Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#0F0F0F] p-4 rounded-3xl border border-white/5 shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input 
             type="text" 
             placeholder="LOGISTIC SEARCH..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-12 bg-black/40 border border-white/5 rounded-2xl pl-12 pr-4 text-[10px] font-black text-white uppercase tracking-widest focus:border-primary/50 transition-all placeholder-[#333]"
          />
        </div>
        <Select 
           value={statusFilter}
           onChange={(e) => setStatusFilter(e.target.value)}
           options={[
             { value: 'all', label: 'All Operations' },
             { value: 'draft', label: 'Unassigned/Formation' },
             { value: 'assigned', label: 'Assigned/Ready' },
             { value: 'out', label: 'In Transit' },
             { value: 'completed', label: 'Mission Accomplished' }
           ]}
           className="h-12 bg-black/40 border-white/5 text-[10px] font-black uppercase tracking-widest"
        />
        <Select 
           value={riderFilter}
           onChange={(e) => setRiderFilter(e.target.value)}
           options={[
             { value: 'all', label: 'All Units' },
             ...riders.map(r => ({ value: r.id, label: r.name ? r.name.toUpperCase() : 'UNKNOWN' }))
           ]}
           className="h-12 bg-black/40 border-white/5 text-[10px] font-black uppercase tracking-widest"
        />
        <div className="flex items-center justify-center p-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
          <div className="flex gap-8">
             <div className="text-center">
               <p className="text-xl font-black text-warning uppercase leading-none">{trips.filter(t => t.status === 'out').length}</p>
               <p className="text-[8px] font-black text-tertiary uppercase mt-1 tracking-widest opacity-40">ACTIVE TRIP</p>
             </div>
             <div className="w-px h-8 bg-white/10"></div>
             <div className="text-center">
               <p className="text-xl font-black text-emerald-300 uppercase leading-none">{trips.filter(t => t.status === 'completed').length}</p>
               <p className="text-[8px] font-black text-tertiary uppercase mt-1 tracking-widest opacity-40">DONE TODAY</p>
             </div>
          </div>
        </div>
      </div>

      {/* Grid of Command Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {trips.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0F0F0F] rounded-2xl border border-dashed border-white/5">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group">
              <ShoppingBag className="w-8 h-8 text-tertiary/20 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-widest uppercase mb-2">No Logistic Movement</h3>
            <p className="text-tertiary text-[10px] uppercase tracking-widest font-bold max-w-sm mx-auto opacity-50">Initialize a NEW TRIP mission from the dispatch board to populate the logistics floor.</p>
          </div>
        ) : (
          trips.map(trip => (
            <Card key={trip.id} className={`group relative p-0 overflow-hidden border transition-all duration-300 rounded-2xl shadow-lg ${expandedTrip === trip.id ? 'border-primary/40 bg-[#0C0C0C]' : 'border-white/5 bg-[#0F0F0F]'}`}>
              {/* Vertical Status Bar */}
              <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-300 ${
                trip.status === 'out' ? 'bg-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 
                trip.status === 'completed' ? 'bg-emerald-500' : 
                trip.status === 'assigned' ? 'bg-info/60' : 'bg-[#333]'
              }`}></div>
              
              <div className="p-6">
                {/* Deployment Header */}
                <div className="flex justify-between items-start mb-6 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                      trip.status === 'out' ? 'bg-warning/15 border-warning/30' : 'bg-white/5 border-white/10'
                    }`}>
                      {trip.status === 'out' ? <Bike className="w-6 h-6 text-warning" /> : <Package className="w-6 h-6 text-[#777]" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-bold text-white tracking-widest uppercase">TRIP #{trip.trip_number || trip.id?.substring(0,8)}</span>
                        <Badge className={`${statusColors[trip.status]} uppercase text-[8px] font-black tracking-[0.2em] px-3 py-1 rounded-full border shadow-sm`}>
                          {trip.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-tertiary text-[9px] font-black uppercase tracking-widest opacity-60">
                        <span className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> {new Date(trip.created_at).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-white/20"></span>
                        <span className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {new Date(trip.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                      className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-tertiary group/btn"
                    >
                      {expandedTrip === trip.id ? <Trash2 className="w-5 h-5 group-hover:text-rose-500" /> : <Eye className="w-5 h-5 group-hover:text-primary" />}
                    </button>
                  </div>
                </div>

                {/* Data Matrix */}
                <div className="grid grid-cols-2 gap-8 mb-10">
                  <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-inner group-hover:bg-white/[0.05] transition-all duration-500">
                    <p className="text-[9px] font-black text-[#555] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        Target Route
                    </p>
                    <span className="text-sm font-black text-white uppercase tracking-widest truncate block">{trip.route_name || trip.route || 'Custom Deployment'}</span>
                  </div>
                  <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 shadow-inner group-hover:bg-white/[0.05] transition-all duration-500">
                    <p className="text-[9px] font-black text-[#555] uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5" />
                        Lead Rider
                    </p>
                    {trip.delivery_person_name ? (
                      <span className="text-sm font-black text-white uppercase tracking-widest truncate block">{trip.delivery_person_name}</span>
                    ) : (
                      <button 
                        onClick={() => { setSelectedTrip(trip); setIsAssignModalOpen(true); }}
                        className="text-[10px] font-black text-info uppercase tracking-widest hover:underline text-left animate-pulse"
                      >
                        Awaiting Personnel...
                      </button>
                    )}
                  </div>
                </div>

                {/* Operations Ribbon */}
                <div className="flex flex-wrap gap-4 pt-8 border-t border-white/5">
                  {trip.status === 'assigned' && (
                    <Button 
                       variant="primary" 
                       onClick={() => handleAction(trip.id, 'dispatch')}
                       isLoading={isProcessing}
                       fullWidth
                       className="h-16 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-warning/20 bg-warning hover:bg-warning/90 border-warning text-black rounded-2xl"
                       icon={<Send className="w-5 h-5" />}
                    >
                       Mark Route Active (OUT)
                    </Button>
                  )}
                  {trip.status === 'out' && (
                    <Button 
                       variant="primary" 
                       onClick={() => handleAction(trip.id, 'complete')}
                       isLoading={isProcessing}
                       fullWidth
                       className="h-16 font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white rounded-2xl"
                       icon={<CheckCircle2 className="w-5 h-5" />}
                    >
                       Register Successful Mission
                    </Button>
                  )}
                  {trip.status === 'draft' && (
                    <Button 
                       variant="outline" 
                       onClick={() => { setSelectedTrip(trip); setIsAssignModalOpen(true); }}
                       fullWidth
                       className="h-16 font-black uppercase tracking-[0.3em] text-[10px] border-info/30 text-info hover:bg-info/10 rounded-2xl"
                    >
                       Deploy Personnel Units
                    </Button>
                  )}
                </div>

                {/* Logistic Payload Details (Expanded) */}
                {expandedTrip === trip.id && (
                  <div className="mt-10 pt-10 border-t border-dashed border-white/10 animate-in slide-in-from-top duration-700">
                    <div className="flex items-center justify-between mb-6 px-4">
                       <h4 className="text-[10px] font-black text-tertiary uppercase tracking-[0.2em] flex items-center gap-2">
                           <LayoutList className="w-4 h-4" />
                           Payload Manifest
                       </h4>
                       <span className="text-[10px] font-black text-white bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">{(trip.trip_orders || trip.orders || []).length} Unit Load</span>
                    </div>
                    <div className="space-y-4">
                      {(trip.trip_orders || trip.orders || []).map((order: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl group/row hover:bg-white/[0.04] transition-all duration-300">
                          <div className="flex items-center gap-6">
                            <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center text-[11px] font-black text-tertiary border border-white/5 font-mono">
                               {String(idx + 1).padStart(2, '0')}
                            </div>
                            <div>
                               <p className="text-xs font-black text-white uppercase tracking-widest mb-1">{order.order_number || order.id?.substring(0,8)}</p>
                               <div className="flex items-center gap-3 text-[9px] text-tertiary font-black uppercase tracking-[0.1em] opacity-60">
                                 <span className="flex items-center gap-1.5"><UserIcon className="w-3 h-3" /> {order.customer_name}</span>
                                 <span className="w-1.5 h-1.5 rounded-full bg-white/10"></span>
                                 <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {order.delivery_zone_name || 'Generic Zone'}</span>
                               </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover/row:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0">
                             <Button size="sm" variant="outline" className="h-9 text-[9px] font-black uppercase px-6 rounded-xl border-white/10">View Mission</Button>
                             {['draft', 'assigned'].includes(trip.status) && (
                               <button 
                                 onClick={() => handleAction(trip.id, 'remove_order', order.id)}
                                 className="w-9 h-9 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all"
                                 title="Detach from Mission"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Personnel Deployment */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setSelectedTrip(null); setSelectedRider(''); }}
        title="Logistic Unit Activation"
        size="md"
      >
        <div className="space-y-6 pt-2">
          <div className="bg-info/10 p-4 rounded-xl border border-info/20 flex items-center gap-4 group">
            <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center text-info border border-info/20">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-info uppercase tracking-widest mb-0.5">Selection Phase</p>
              <h3 className="text-base font-bold text-white uppercase tracking-tight">Personnel for Mission #{selectedTrip?.trip_number || selectedTrip?.id?.substring(0,8)}</h3>
            </div>
          </div>

          <div className="space-y-3">
             <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest px-2">Available Fleet Personnel</p>
             <div className="grid grid-cols-1 gap-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-2">
                {riders.map(rider => (
                  <button
                    key={rider.id}
                    onClick={() => setSelectedRider(rider.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      selectedRider === rider.id 
                        ? 'border-info bg-info/10 text-info' 
                        : 'border-white/5 bg-white/[0.02] text-tertiary hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${selectedRider === rider.id ? 'bg-info/20 border-info/20' : 'bg-black/40 border-white/5'}`}>
                        <Bike className={`w-5 h-5 transition-all ${selectedRider === rider.id ? 'text-info' : 'opacity-40'}`} />
                      </div>
                      <div className="text-left">
                        <p className={`text-xs font-bold uppercase tracking-widest ${selectedRider === rider.id ? 'text-white' : 'text-tertiary'}`}>{rider.name}</p>
                        <p className="text-[10px] font-bold opacity-60 tracking-widest text-[#777] mt-0.5">{rider.phone_number}</p>
                      </div>
                    </div>
                    {selectedRider === rider.id && <CheckCircle2 className="w-5 h-5 text-info animate-in zoom-in" />}
                  </button>
                ))}
                {riders.length === 0 && (
                     <div className="text-center py-10 px-4 bg-white/[0.02] border border-dashed border-white/5 rounded-xl">
                        <p className="text-[10px] font-bold text-[#777] uppercase tracking-widest italic leading-relaxed">No active field personnel detected in current branch sectors.</p>
                     </div>
                )}
             </div>
          </div>

          <div className="bg-[#0F0F0F] p-4 rounded-xl border border-white/5 flex items-center justify-between">
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
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${sendWhatsApp ? 'bg-emerald-500' : 'bg-[#333]'}`}
             >
                <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${sendWhatsApp ? 'translate-x-6' : 'translate-x-0'}`}></div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4 border-t border-white/5">
            <Button 
               variant="outline" 
               fullWidth 
               onClick={() => handleAssignTrip(false)}
               isLoading={isProcessing}
               disabled={!selectedRider}
               className="h-10 font-bold uppercase tracking-widest text-[10px] border-info/30 text-info hover:bg-info/10 rounded-xl"
            >
               Only Assign
            </Button>
            <Button 
               variant="primary" 
               fullWidth 
               onClick={() => handleAssignTrip(true)}
               isLoading={isProcessing}
               disabled={!selectedRider}
               className="h-10 font-bold uppercase tracking-widest text-[10px] bg-info border-info text-white shadow-lg shadow-info/30 rounded-xl"
               icon={<Zap className="w-4 h-4" />}
            >
               Assign & Dispatch
            </Button>
          </div>
          <Button variant="ghost" fullWidth onClick={() => setIsAssignModalOpen(false)} className="h-10 mt-1 font-bold uppercase tracking-widest text-[10px] text-tertiary hover:bg-white/5 rounded-xl">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
