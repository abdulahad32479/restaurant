"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Input, Select } from '@/src/components/Input';
import { MapPin, Plus, Edit2, Trash2, LayoutList, Search, RefreshCw, Layers, ShieldCheck, ChevronRight, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '@/src/lib/axios';
import { useSearchParams } from 'next/navigation';

export default function DeliveryZonesPage() {
  const searchParams = useSearchParams();
  const routeIdFilter = searchParams.get('route_id');

  const [zones, setZones] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    route: '',
    sort_order: 1,
    is_active: true
  });

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [zonesRes, routesRes] = await Promise.all([
        apiClient.get('v1/delivery-zones/', { params: routeIdFilter ? { route_id: routeIdFilter } : {} }),
        apiClient.get('v1/delivery-routes/')
      ]);
      setZones(zonesRes.data);
      setRoutes(routesRes.data);
      
      if (routeIdFilter && !formData.route) {
          setFormData(prev => ({ ...prev, route: routeIdFilter }));
      }
    } catch (error) {
      console.error('Failed to fetch zones', error);
      toast.error('Failed to sync delivery zones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [routeIdFilter, formData.route]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdate = async () => {
    if (!formData.name || !formData.route) {
      toast.error('Name and route are required');
      return;
    }
    setIsProcessing(true);
    try {
      if (editingZone) {
        await apiClient.patch(`v1/delivery-zones/${editingZone.id}/`, formData);
        toast.success('Zone re-configured successfully!');
      } else {
        await apiClient.post('v1/delivery-zones/', formData);
        toast.success('New zone deployed to fleet!');
      }
      setIsModalOpen(false);
      setEditingZone(null);
      setFormData({ name: '', route: routeIdFilter || '', sort_order: zones.length + 1, is_active: true });
      fetchData(true);
    } catch (error) {
       console.error('Operation failed', error);
       toast.error('Failed to update delivery zone');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Are you sure you want to deactivate this delivery zone?')) return;
    try {
      await apiClient.delete(`v1/delivery-zones/${zoneId}/`);
      toast.success('Zone deactivated and removed from fleet');
      fetchData(true);
    } catch (error) {
      toast.error('Failed to delete zone');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center animate-in fade-in duration-500">
        <div className="flex flex-col items-center gap-6">
          <div className="h-14 w-14 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-glow-amber"></div>
          <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.4em] animate-pulse">Syncing Zone Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-secondary p-5 rounded-2xl border border-base relative overflow-hidden group">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Zap className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white uppercase tracking-tight flex items-center gap-2">
              DELIVERY ZONES
            </h1>
            <p className="text-tertiary text-[10px] mt-0.5 uppercase tracking-widest font-bold">Precise zone mapping & route assignment</p>
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
            onClick={() => { setEditingZone(null); setFormData({ name: '', route: routeIdFilter || '', sort_order: zones.length + 1, is_active: true }); setIsModalOpen(true); }}
            className="h-10 px-8 uppercase tracking-widest text-[10px] font-bold shadow-lg shadow-amber-500/20 bg-amber-500 border-amber-500 text-black rounded-xl"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Zone
          </Button>
        </div>
      </div>

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {zones.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-secondary rounded-2xl border border-dashed border-base group">
             <div className="w-16 h-16 bg-base rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner group-hover:scale-105 transition-all">
                <Layers className="w-8 h-8 text-tertiary/20" />
             </div>
             <h3 className="text-lg font-bold text-white tracking-widest uppercase mb-2">No Zones Data</h3>
             <p className="text-tertiary text-[10px] uppercase tracking-widest font-bold max-w-sm mx-auto opacity-50">Initialize your first delivery zone to assign it to a fleet route.</p>
          </div>
        ) : (
          zones.map((zone, i) => (
             <Card key={zone.id} className="group relative p-6 bg-secondary border border-base rounded-2xl shadow-lg hover:border-amber-500/30 transition-all duration-300 animate-in zoom-in-95 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-base rounded-xl flex items-center justify-center border border-base group-hover:bg-amber-500/20 group-hover:border-amber-500/20 transition-all duration-300">
                      <Zap className="w-6 h-6 text-[#777] group-hover:text-amber-500 transition-colors duration-300" />
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingZone(zone); setFormData({ name: zone.name, route: zone.route, sort_order: zone.sort_order, is_active: zone.is_active }); setIsModalOpen(true); }}
                        className="w-10 h-10 rounded-xl bg-base border border-base flex items-center justify-center hover:bg-amber-500/20 hover:text-amber-500 transition-all shadow-md"
                      >
                         <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(zone.id)}
                        className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center hover:bg-rose-600 text-tertiary hover:text-white transition-all shadow-md"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                </div>

                <div className="space-y-4">
                   <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-tight mb-0.5 select-none">{zone.name}</h3>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {zone.route_name || 'Assigned Sector'}
                      </p>
                   </div>

                   <div className="py-4 border-y border-base">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-tertiary uppercase tracking-widest opacity-50">Sort Rank</span>
                        <span className="text-base font-black text-white font-mono">#{String(zone.sort_order).padStart(2, '0')}</span>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-2">
                       <Badge className={`${zone.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-glow-emerald/5' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'} uppercase text-[9px] font-black tracking-widest px-4 py-1.5 rounded-full`}>
                          {zone.is_active ? 'Unit Linked' : 'Offline'}
                       </Badge>
                   </div>
                </div>
             </Card>
          ))
        )}
      </div>

      {/* Zone Formation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingZone ? "EDIT ZONE" : "ADD ZONE"}
        size="md"
      >
        <div className="space-y-6 pt-2">
           <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 flex items-center gap-4 group">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-0.5">Zone Mapping</p>
                    <h3 className="text-base font-bold text-white uppercase tracking-tight">Sector Unit Initialization</h3>
                </div>
           </div>

           <div className="space-y-4">
              <Input 
                label="Zone Name *"
                placeholder="e.g. BLOCK A, SECTOR 7..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                className="bg-black/60 border-base text-white font-bold uppercase tracking-widest placeholder-[#444]"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest px-1">Parent Sector Unit *</p>
                    <Select 
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    options={[
                        { value: '', label: 'SELECT PARENT ROUTE...' },
                        ...routes.map(r => ({ value: r.id, label: r.name.toUpperCase() }))
                    ]}
                    className="h-10 bg-black/60 border-base text-[10px] font-bold uppercase tracking-widest"
                    />
                </div>
                <Input 
                  label="Dispatch Sort Order"
                  type="number"
                  placeholder="Rank..."
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="bg-black/60 border-base"
                />
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-base shadow-inner">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-base rounded-lg flex items-center justify-center border border-base">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                 </div>
                 <div>
                     <p className="text-[10px] font-bold text-white uppercase tracking-widest">Zone Unit Status</p>
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
                className="h-10 font-bold uppercase tracking-widest text-[10px] bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/20 rounded-xl"
              >
                Deploy Unit
              </Button>
           </div>
        </div>
      </Modal>
    </div>
  );
}
