"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Server, Network, Plus, Loader2, Edit, Trash2, Smartphone, RefreshCw, ShieldCheck, Zap, Wifi } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useDevices, useBiometricActions } from '@/src/hooks/useAttendance';
import { AttendanceDevice } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function DevicesManagement() {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);

  const { devicesData, isLoading, createDevice, isCreatingDevice, updateDevice, isUpdatingDevice, deleteDevice } = useDevices();
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
    if (!devicesData || devicesData.length === 0) {
      toast.error('No devices found to sync.');
      return;
    }
    const activeBiometrics = devicesData.filter(d => d.is_active && d.device_type === 'biometric');
    if (activeBiometrics.length === 0) {
      toast.error('No active biometric terminals found.');
      return;
    }
    activeBiometrics.forEach(device => {
      syncDevice(device.id);
    });
  };

  const deviceColumns = [
    { key: 'name', header: 'TERMINAL IDENTITY', render: (v: string) => <span className="font-black text-white uppercase tracking-[0.1em] text-sm drop-shadow-sm">{v}</span> },
    { key: 'device_type', header: 'IDENTIFIER', render: (v: string) => <Badge variant="secondary" className="uppercase font-black text-[9px] tracking-[0.2em] w-max px-4 bg-white/5 border-white/5 text-tertiary">{v === 'biometric' ? 'Physical / ZKTeco' : v}</Badge> },
    { key: 'network', header: 'NETWORK PROTOCOL', render: (_: any, r: AttendanceDevice) => <div className="flex flex-col gap-0.5"><span className="text-white font-black text-xs tracking-tight">{r.ip_address || '---'}</span><span className="text-[9px] text-tertiary font-black opacity-40">PORT: {r.port || 4370}</span></div> },
    { key: 'synced', header: 'LAST ACTIVITY', render: (_: any, r: AttendanceDevice) => <span className="text-[10px] font-black text-tertiary uppercase tracking-widest">{r.last_synced_at ? new Date(r.last_synced_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending Handshake'}</span> },
    { key: 'is_active', header: 'STATE', render: (_: any, r: AttendanceDevice) => (r.is_active ? <Badge variant="success" size="sm" className="font-black uppercase tracking-widest text-[9px] px-4 border-none shadow-glow-success/20">Operational</Badge> : <Badge variant="error" size="sm" className="font-black uppercase tracking-widest text-[9px] px-4 border-none shadow-glow-error/20">Inactive</Badge>) },
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: AttendanceDevice) => (
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => syncDevice(r.id)}
          className="bg-white/5 hover:bg-primary/20 text-tertiary hover:text-white p-2.5 rounded-xl transition-all border border-base hover:border-primary/50 group"
          title="Manual Sync Handshake"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : 'opacity-60 group-hover:opacity-100'}`} />
        </button>
        <button 
          onClick={() => handleOpenDeviceModal(r)}
          className="bg-white/5 hover:bg-white/10 text-tertiary hover:text-white p-2.5 rounded-xl transition-all border border-base opacity-60 hover:opacity-100"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => { if(window.confirm('Erase this device registration?')) deleteDevice(r.id) }} 
          className="bg-white/5 hover:bg-error/20 text-tertiary hover:text-white p-2.5 rounded-xl transition-all border border-base opacity-60 hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )}
  ];

  const totalDevices = devicesData?.length || 0;
  const activeDevices = devicesData?.filter(d => d.is_active).length || 0;
  const biometricDevices = devicesData?.filter(d => d.device_type === 'biometric').length || 0;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full -ml-16 -mt-16 blur-3xl pointer-events-none" />
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Terminal Management</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Global configuration for hardware synchronization nodes</p>
        </div>
        <div className="flex gap-3 relative z-10">
           <Button variant="secondary" onClick={handleSyncAll} isLoading={isSyncing} className="bg-secondary border-base text-white font-black uppercase tracking-widest text-[10px] px-6 hover:bg-white/5">
              <RefreshCw className={`w-4 h-4 mr-3 ${isSyncing ? 'animate-spin' : ''}`} /> 
              Global Broadcast Sync
            </Button>
            <Button variant="primary" onClick={() => handleOpenDeviceModal()} className="font-black uppercase tracking-tighter shadow-glow-primary px-8">
              <Plus className="w-5 h-5 mr-3"/> 
              Register Terminal
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-secondary border border-base p-7 rounded-[2rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Server className="w-20 h-20 text-white" /></div>
           <p className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] mb-2">NETWORK NODES</p>
           <p className="text-4xl text-white font-black tracking-tighter">{totalDevices}</p>
        </div>
        <div className="bg-secondary border border-base p-7 rounded-[2rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Wifi className="w-20 h-20 text-success" /></div>
           <p className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] mb-2">LIVE / OPERATIONAL</p>
           <p className="text-4xl text-success font-black tracking-tighter drop-shadow-glow-success">{activeDevices}</p>
        </div>
        <div className="bg-secondary border border-base p-7 rounded-[2rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Zap className="w-20 h-20 text-primary" /></div>
           <p className="text-[10px] text-tertiary font-black uppercase tracking-[0.2em] mb-2">BIOMETRIC ASSETS</p>
           <p className="text-4xl text-primary font-black tracking-tighter drop-shadow-glow-primary">{biometricDevices}</p>
        </div>
      </div>

      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <div className="flex justify-between items-center p-8 border-b border-base/50">
          <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Configured Attendance Terminals</h2>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-40 gap-4">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <p className="text-tertiary font-black uppercase tracking-[0.2em] text-xs text-center">Scanning Network Grid...</p>
          </div>
        ) : totalDevices === 0 ? (
          <div className="p-32 text-center text-tertiary flex flex-col items-center justify-center gap-6">
            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center border border-base">
              <Smartphone className="w-10 h-10 opacity-20" />
            </div>
            <div className="space-y-2">
              <p className="font-black text-white uppercase tracking-widest text-sm">No Terminals Isolated</p>
              <p className="font-bold text-xs tracking-tight opacity-50 uppercase tracking-widest">Add your ZKTeco hardware to enable biometric pulling</p>
            </div>
          </div>
        ) : (
          <Table columns={deviceColumns} data={devicesData || []} className="text-sm border-none" />
        )}
      </Card>

      <div className="bg-secondary/50 border border-base rounded-[2.5rem] p-8 shadow-inner space-y-8">
        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-primary"/> Technical Integration Protocol</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex gap-6 items-start group">
             <div className="w-12 h-12 rounded-2xl bg-bg-main border border-base text-primary flex items-center justify-center font-black text-lg shrink-0 shadow-lg group-hover:border-primary/50 transition-colors">01</div>
             <div className="flex flex-col gap-2">
               <h4 className="text-white font-black text-sm uppercase tracking-tight">LAN Calibration</h4>
               <p className="text-[11px] text-tertiary font-bold uppercase tracking-tight leading-relaxed opacity-60">Provision the terminal with a <span className="text-primary font-black underline">Static IP Address</span> within your local subnet. Ensure the backend server is physically adjacent to this network node.</p>
             </div>
          </div>
          <div className="flex gap-6 items-start group">
             <div className="w-12 h-12 rounded-2xl bg-bg-main border border-base text-primary flex items-center justify-center font-black text-lg shrink-0 shadow-lg group-hover:border-primary/50 transition-colors">02</div>
             <div className="flex flex-col gap-2">
               <h4 className="text-white font-black text-sm uppercase tracking-tight">Service Registration</h4>
               <p className="text-[11px] text-tertiary font-bold uppercase tracking-tight leading-relaxed opacity-60">Register the IP and Port (Default: <span className="text-primary font-black">4370</span>) here. The system will attempt an encrypted handshake to verify data transmission.</p>
             </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title={editingDeviceId ? "Overwrite Terminal Config" : "Register Hardware Node"} size="md" footer={<div className="flex gap-3 mt-2 w-full sm:w-auto"><Button variant="ghost" onClick={() => setIsDeviceModalOpen(false)} className="flex-1 sm:flex-none uppercase tracking-widest font-black text-[10px]">Close</Button><Button variant="primary" onClick={handleCreateDevice} isLoading={isCreatingDevice || isUpdatingDevice} className="flex-1 sm:flex-none px-12 shadow-glow-primary font-black uppercase text-[10px] tracking-widest">Commit Hardware</Button></div>}>
        <div className="space-y-6 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input label="TERMINAL LABEL *" placeholder="e.g. K70 Main Lobby" value={deviceForm.name} onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})} className="bg-bg-main border-base text-white h-14 font-black uppercase tracking-tighter" />
            <Select label="HARDWARE STACK" value={deviceForm.device_type} onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value as any})} options={[{ value: 'biometric', label: 'ZKTeco / Biometric' }]} className="bg-bg-main border-base h-14 font-black text-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Input label="IPV4 ADDRESS" placeholder="192.168.1.201" value={deviceForm.ip_address || ''} onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})} className="bg-bg-main border-base text-white text-center font-mono tracking-widest h-14" />
             <Input label="TCP PORT" type="number" placeholder="4370" value={deviceForm.port?.toString() || ''} onChange={(e) => setDeviceForm({...deviceForm, port: parseInt(e.target.value)})} className="bg-bg-main border-base text-white text-center font-black h-14" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Input label="MACHINE SERIAL ID" placeholder="Optional identifier" value={deviceForm.machine_identifier || ''} onChange={(e) => setDeviceForm({...deviceForm, machine_identifier: e.target.value})} className="bg-bg-main border-base text-white h-14" />
             <Input label="API HUB URL" placeholder="Optional HTTP endpoint" value={deviceForm.api_url || ''} onChange={(e) => setDeviceForm({...deviceForm, api_url: e.target.value})} className="bg-bg-main border-base text-white h-14" />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-bg-main/50 border border-base rounded-2xl">
            <label className="flex items-center gap-4 cursor-pointer group">
              <input type="checkbox" checked={deviceForm.is_active} onChange={(e) => setDeviceForm({...deviceForm, is_active: e.target.checked})} className="w-5 h-5 rounded-lg border-base bg-secondary text-primary focus:ring-primary shadow-glow-primary/20" />
              <div className="flex flex-col">
                <span className="text-[11px] font-black text-white group-hover:text-primary transition-colors uppercase tracking-[0.2em]">Operational Status</span>
                <span className="text-[9px] text-tertiary font-bold uppercase tracking-widest opacity-40">Allow biometric signal pulling</span>
              </div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
