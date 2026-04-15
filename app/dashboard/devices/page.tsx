"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Server, Network, Plus, Loader2, Edit, Trash2, Smartphone, RefreshCw } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useDevices, useBiometricActions } from '@/src/hooks/useAttendance';
import { AttendanceDevice } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function DevicesManagement() {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

  const { devicesData, isLoading, createDevice, isCreatingDevice, updateDevice, isUpdatingDevice, deleteDevice } = useDevices({ page: 1, page_size: 100 });
  const { syncDevice, isSyncing } = useBiometricActions();

  const [deviceForm, setDeviceForm] = useState<Partial<AttendanceDevice>>({
    name: '', device_type: 'biometric', ip_address: '192.168.1.201', port: 4370, machine_identifier: '', api_url: '', is_active: true
  });

  const handleOpenDeviceModal = (device?: AttendanceDevice) => {
    if (device) {
       setEditingDeviceId(device.id);
       setDeviceForm({
          name: device.name,
          device_type: device.device_type,
          ip_address: device.ip_address || '',
          port: device.port || 4370,
          machine_identifier: device.machine_identifier || '',
          api_url: device.api_url || '',
          is_active: device.is_active
       });
    } else {
       setEditingDeviceId(null);
       setDeviceForm({ name: '', device_type: 'biometric', ip_address: '192.168.1.201', port: 4370, machine_identifier: '', api_url: '', is_active: true });
    }
    setIsDeviceModalOpen(true);
  };

  const handleCreateDevice = () => {
    if (!deviceForm.name || !deviceForm.device_type) return toast.error('Fill required fields (Name, Type)');

    const payload = { ...deviceForm };
    if (!payload.ip_address) payload.ip_address = null;
    if (!payload.machine_identifier) payload.machine_identifier = null;
    if (!payload.api_url) payload.api_url = null;
    if (isNaN(payload.port as number) || !payload.port) payload.port = null;

    if (editingDeviceId) {
       updateDevice({ id: editingDeviceId, data: payload }, { onSuccess: () => setIsDeviceModalOpen(false) });
    } else {
       createDevice(payload, { onSuccess: () => setIsDeviceModalOpen(false) });
    }
  };

  const handleSyncAll = () => {
    if (!devicesData?.results || devicesData.results.length === 0) {
      toast.error('No devices found to sync.');
      return;
    }
    const activeBiometrics = devicesData.results.filter(d => d.is_active && d.device_type === 'biometric');
    if (activeBiometrics.length === 0) {
      toast.error('No active biometric terminals found.');
      return;
    }
    activeBiometrics.forEach(device => {
      syncDevice(device.id);
    });
  };

  const deviceColumns = [
    { key: 'name', header: 'Device Name', render: (v: string) => <span className="font-black text-white uppercase tracking-[0.1em] text-sm drop-shadow-sm">{v}</span> },
    { key: 'type', header: 'Type', render: (v: string) => <Badge variant="secondary" className="uppercase font-black text-[10px] tracking-widest w-max px-3 border-white/5">{v === 'biometric' ? 'Biometric (ZKTeco)' : v}</Badge> },
    { key: 'network', header: 'Connection', render: (_: any, r: AttendanceDevice) => <span className="text-tertiary font-black bg-bg-main/50 border border-base px-3 py-1.5 rounded-xl text-[10px] tracking-widest flex items-center gap-2 w-max shadow-inner"><Network className="w-3.5 h-3.5 opacity-40"/>{r.ip_address}:{r.port}</span> },
    { key: 'synced', header: 'Last Synced', render: (_: any, r: AttendanceDevice) => <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{r.last_synced_at ? new Date(r.last_synced_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never Synced'}</span> },
    { key: 'active', header: 'Status', render: (_: any, r: AttendanceDevice) => (r.is_active ? <Badge variant="success" size="sm" className="font-black uppercase tracking-widest text-[9px]">Active</Badge> : <Badge variant="error" size="sm" className="font-black uppercase tracking-widest text-[9px]">Offline</Badge>) },
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: AttendanceDevice) => (
      <div className="flex items-center justify-end gap-2">
        <button 
          onClick={() => syncDevice(r.id)}
          className="bg-white/5 hover:bg-primary/20 text-tertiary hover:text-primary p-2 rounded-xl transition-all font-black border border-white/5 hover:border-primary/30"
          title="Sync Device"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
        <button 
          onClick={() => handleOpenDeviceModal(r)}
          className="bg-white/5 hover:bg-primary/10 text-tertiary hover:text-white p-2 rounded-xl transition-all font-black border border-white/5 hover:border-white/20"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button 
          onClick={() => { if(window.confirm('Are you sure you want to delete this device?')) deleteDevice(r.id) }} 
          className="bg-white/5 hover:bg-error/10 text-tertiary hover:text-error p-2 rounded-xl transition-all font-black border border-white/5 hover:border-error/20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )}
  ];

  const totalDevices = devicesData?.results?.length || 0;
  const activeDevices = devicesData?.results?.filter(d => d.is_active).length || 0;
  const biometricDevices = devicesData?.results?.filter(d => d.device_type === 'biometric').length || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Attendance Devices</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Connect and manage ZKTeco hardware</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">TOTAL DEVICES</p>
           <p className="text-3xl text-slate-900 font-black">{totalDevices}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">ACTIVE</p>
           <p className="text-3xl text-slate-900 font-black">{activeDevices}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">BIOMETRIC</p>
           <p className="text-3xl text-slate-900 font-black">{biometricDevices}</p>
        </div>
      </div>

      <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0">
        <div className="flex justify-between items-center p-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Attendance Devices</h2>
          <div className="flex gap-3">
             <Button variant="secondary" size="sm" onClick={handleSyncAll} isLoading={isSyncing} className="bg-info/10 text-info border-none font-bold">
               <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} /> Sync All
             </Button>
             <Button variant="primary" size="sm" onClick={() => handleOpenDeviceModal()} className="font-black uppercase tracking-tighter shadow-glow-primary px-6">
               <Plus className="w-4 h-4 mr-2"/> Add Device
             </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
        ) : totalDevices === 0 ? (
          <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Server className="w-8 h-8 opacity-20" />
            </div>
            <p className="font-bold text-sm tracking-tight">No devices configured yet. Add your ZKTeco K70 to get started.</p>
          </div>
        ) : (
          <Table columns={deviceColumns} data={devicesData?.results || []} className="text-sm border-none" />
        )}
      </Card>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Setup Guide</h3>
        
        <div className="space-y-6">
          <div className="flex gap-4 items-start">
             <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">1</div>
             <div className="flex flex-col gap-1">
               <h4 className="text-slate-800 font-bold text-sm tracking-tight">Connect K70 to your network</h4>
               <p className="text-xs text-slate-500 font-medium">Assign a static IP to the device via its on-screen menu or router DHCP reservation.</p>
             </div>
          </div>
          <div className="flex gap-4 items-start">
             <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">2</div>
             <div className="flex flex-col gap-1">
               <h4 className="text-slate-800 font-bold text-sm tracking-tight">Add the device here</h4>
               <p className="text-xs text-slate-500 font-medium font-medium">Enter the IP, leave port as 4370 (ZKTeco default). Click "Add Device".</p>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title={editingDeviceId ? "Edit Device" : "Add Device"} size="md" footer={<div className="flex gap-3 mt-2 w-full sm:w-auto"><Button variant="ghost" onClick={() => setIsDeviceModalOpen(false)} className="flex-1 sm:flex-none uppercase tracking-widest">Cancel</Button><Button variant="primary" onClick={handleCreateDevice} isLoading={isCreatingDevice || isUpdatingDevice} className="flex-1 sm:flex-none px-10 shadow-glow-primary">Save Device</Button></div>}>
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="DEVICE NAME *" placeholder="e.g. K70 Main Entrance" value={deviceForm.name} onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
            <Select label="DEVICE TYPE" value={deviceForm.device_type} onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value as any})} options={[{ value: 'biometric', label: 'Biometric (ZKTeco)' }]} className="bg-white border-slate-200 text-slate-900" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Input label="IP ADDRESS" placeholder="192.168.1.201" value={deviceForm.ip_address || ''} onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
             <Input label="PORT" type="number" placeholder="4370" value={deviceForm.port?.toString() || ''} onChange={(e) => setDeviceForm({...deviceForm, port: parseInt(e.target.value)})} className="bg-white border-slate-200 text-slate-900" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Input label="MACHINE IDENTIFIER" placeholder="Optional device serial / ID" value={deviceForm.machine_identifier || ''} onChange={(e) => setDeviceForm({...deviceForm, machine_identifier: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
             <Input label="API URL" placeholder="Optional HTTP URL" value={deviceForm.api_url || ''} onChange={(e) => setDeviceForm({...deviceForm, api_url: e.target.value})} className="bg-white border-slate-200 text-slate-900" />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={deviceForm.is_active} onChange={(e) => setDeviceForm({...deviceForm, is_active: e.target.checked})} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
              <span className="text-[11px] font-black text-slate-500 group-hover:text-primary transition-colors uppercase tracking-widest">ACTIVE</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
