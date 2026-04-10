"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Input, Select } from '@/src/components/Input';
import { MapPin, Plus, Edit2, Trash2, LayoutList, Search, RefreshCw, Layers, ShieldCheck, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/src/lib/axios';

export default function DeliveryRoutesPage() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sort_order: 0,
    default_travel_minutes: 30,
    is_active: true
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const response = await apiClient.get('v1/delivery-routes/');
      setRoutes(response.data);
    } catch (error) {
      console.error('Failed to fetch routes', error);
      toast.error('Failed to sync fleet routes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async () => {
    if (!formData.name) {
      toast.error('Route name is required');
      return;
    }
    setIsProcessing(true);
    try {
      if (editingRoute) {
        await apiClient.patch(`v1/delivery-routes/${editingRoute.id}/`, formData);
        toast.success('Route re-configured successfully!');
      } else {
        await apiClient.post('v1/delivery-routes/', formData);
        toast.success('New route deployed to fleet!');
      }
      setIsModalOpen(false);
      setEditingRoute(null);
      setFormData({ name: '', sort_order: 0, default_travel_minutes: 30, is_active: true });
      fetchData(true);
    } catch (error) {
       console.error('Operation failed', error);
       toast.error('Failed to update fleet route');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (routeId: string) => {
    if (!confirm('Are you sure you want to deactivate this fleet route?')) return;
    try {
      await apiClient.delete(`v1/delivery-routes/${routeId}/`);
      toast.success('Route deactivated and removed from fleet');
      fetchData(true);
    } catch (error) {
      toast.error('Failed to delete route');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-glow-primary"></div>
          <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.4em] animate-pulse">Syncing Map Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary p-5 rounded-2xl border border-base relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              FLEET ROUTES
            </h1>
            <p className="text-tertiary text-[10px] mt-0.5 uppercase tracking-widest font-bold">Strategic logistic mapping & sector control</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <Button 
            variant="outline" 
            onClick={() => fetchData(true)}
            isLoading={isRefreshing}
            className="border-base hover:bg-base h-10 px-6 uppercase tracking-widest text-[10px] font-bold rounded-xl"
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh
          </Button>
          <Button 
            variant="primary" 
            onClick={() => { setEditingRoute(null); setFormData({ name: '', sort_order: routes.length + 1, default_travel_minutes: 30, is_active: true }); setIsModalOpen(true); }}
            className="h-10 px-8 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-primary/20 rounded-xl"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Route
          </Button>
        </div>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {routes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-secondary rounded-2xl border border-dashed border-base group">
             <div className="w-16 h-16 bg-base rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-105 transition-all">
                <LayoutList className="w-8 h-8 text-tertiary/20" />
             </div>
             <h3 className="text-lg font-bold text-white tracking-widest uppercase mb-2">No Routes Data</h3>
             <p className="text-tertiary text-[10px] uppercase tracking-widest font-bold max-w-sm mx-auto opacity-50">Initialize your first fleet routing protocol to start managing logistic sectors.</p>
          </div>
        ) : (
          routes.map((route, i) => (
             <Card key={route.id} className="group relative p-6 bg-secondary border border-base rounded-2xl shadow-lg hover:border-primary/30 transition-all duration-300 animate-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-base rounded-xl flex items-center justify-center border border-base group-hover:bg-primary/20 group-hover:border-primary/20 transition-all duration-300">
                      <MapPin className="w-6 h-6 text-[#777] group-hover:text-primary transition-colors duration-300" />
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingRoute(route); setFormData({ name: route.name, sort_order: route.sort_order, default_travel_minutes: route.default_travel_minutes, is_active: route.is_active }); setIsModalOpen(true); }}
                        className="w-10 h-10 rounded-xl bg-base border border-base flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-all shadow-md"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(route.id)}
                        className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-rose-600 text-tertiary hover:text-white transition-all shadow-md"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight mb-0.5 select-none">{route.name}</h3>
                      <p className="text-[10px] font-bold text-[#777] uppercase tracking-widest">Sector Routing Protocol Active</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4 py-6 border-y border-base">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1 opacity-50">Sort Rank</span>
                        <span className="text-base font-black text-white font-mono">#{String(route.sort_order).padStart(2, '0')}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-tertiary uppercase tracking-widest mb-1 opacity-50">Transit Estimate</span>
                        <span className="text-base font-black text-white font-mono">{route.default_travel_minutes}m</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-2">
                       <Badge className={`${route.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald/5' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} uppercase text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full`}>
                          {route.is_active ? 'Fully Operational' : 'Offline'}
                       </Badge>
                       <div 
                         onClick={() => window.location.href=`/dashboard/delivery/zones?route_id=${route.id}`}
                         className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-[0.2em] cursor-pointer hover:underline"
                       >
                         Manage Zones
                         <ChevronRight className="w-3 h-3" />
                       </div>
                   </div>
                </div>
             </Card>
          ))
        )}
      </div>

      {/* Route Formation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoute ? "EDIT SECTOR" : "ADD SECTOR"}
        size="md"
      >
        <div className="space-y-6 pt-2">
           <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-center gap-4 group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                    <MapPin className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">Fleet Engineering</p>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Sector Initialization Protocol</h3>
                </div>
           </div>

           <div className="space-y-4">
              <Input 
                label="Sector Name *"
                placeholder="e.g. DOWNTOWN CORE, NORTH SECTOR..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="bg-black/60 border-base text-white font-bold uppercase tracking-widest"
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Dispatch Sort Order"
                  type="number"
                  placeholder="Rank..."
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-black/60 border-base"
                />
                <Input 
                  label="Default ETA (Mins)"
                  type="number"
                  placeholder="Minutes..."
                  value={formData.default_travel_minutes}
                  onChange={(e) => setFormData({ ...formData, default_travel_minutes: parseInt(e.target.value) || 0 })}
                  className="bg-black/60 border-base"
                />
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-base">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-base rounded-lg flex items-center justify-center border border-base shadow-inner">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div>
                     <p className="text-[10px] font-bold text-white uppercase tracking-widest">Route Status</p>
                     <p className="text-[10px] font-bold text-tertiary uppercase mt-0.5 opacity-60">Set operational availability</p>
                 </div>
              </div>
              <div 
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${formData.is_active ? 'bg-emerald-500' : 'bg-[#333]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#B3B3B3] transition-all duration-300 shadow-sm ${formData.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-3 pt-4 border-t border-base">
              <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)} className="h-10 font-bold uppercase tracking-widest text-[10px] rounded-xl border-base hover:bg-base">Cancel</Button>
              <Button 
                variant="primary" 
                fullWidth 
                onClick={handleCreateOrUpdate}
                isLoading={isProcessing}
                className="h-10 font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 rounded-xl"
              >
                Deploy Sector
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}


