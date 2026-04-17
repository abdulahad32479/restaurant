"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import {
  Server, Plus, Loader2, Edit, Trash2, RefreshCw,
  ShieldCheck, Wifi, CheckCircle2, AlertTriangle, 
  Cpu, Activity, Layers, HardDrive
} from 'lucide-react';
import { useDevices } from '@/src/hooks/useAttendance';
import { AttendanceDevice, SyncDeviceResult } from '@/src/types/staff';
import toast from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AttendanceService } from '@/src/services/attendance.service';

export default function DevicesManagement() {
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncDeviceResult | null>(null);
  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);

  const { devicesData, isLoading, createDevice, isCreatingDevice, updateDevice, isUpdatingDevice, deleteDevice } = useDevices();

  const queryClient = useQueryClient();

  // Per-device sync mutation
  const syncMutation = useMutation({
    mutationFn: (deviceId: string) => AttendanceService.syncDevice(deviceId),
    onMutate: (deviceId) => setSyncingDeviceId(deviceId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setSyncingDeviceId(null);
      setSyncResult(data);
    },
    onError: (err: any) => {
      setSyncingDeviceId(null);
      const msg = err?.response?.data?.detail || err?.response?.data?.error || 'Failed to sync device';
      toast.error(msg);
    },
  });

  const [deviceForm, setDeviceForm] = useState<Partial<AttendanceDevice>>({
    name: '', device_type: 'biometric', ip_address: '', port: 4370,
    machine_identifier: '', api_url: '', is_active: true
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
      setDeviceForm({ name: '', device_type: 'biometric', ip_address: '', port: 4370, machine_identifier: '', api_url: '', is_active: true });
    }
    setIsDeviceModalOpen(true);
  };

  const handleSaveDevice = () => {
    if (!deviceForm.name || !deviceForm.device_type) return toast.error('Required fields missing');
    const payload = { ...deviceForm };
    
    if (editingDeviceId) {
      updateDevice({ id: editingDeviceId, data: payload }, { onSuccess: () => setIsDeviceModalOpen(false) });
    } else {
      createDevice(payload, { onSuccess: () => setIsDeviceModalOpen(false) });
    }
  };

  const deviceColumns = [
    {
      key: 'name', 
      header: 'TERMINAL IDENTITY',
      render: (v: string, r: AttendanceDevice) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight">{v}</span>
          <span className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{r.device_type} · ID: {r.machine_identifier || 'UNSET'}</span>
        </div>
      )
    },
    {
      key: 'network', 
      header: 'NETWORK PARAMETERS',
      render: (_: any, r: AttendanceDevice) => (
        <div className="flex flex-col gap-1">
          <span className="text-slate-700 font-black text-[11px] font-mono tracking-tight">{r.ip_address || 'Cloud Node'}</span>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">PORT: {r.port || 4370}</p>
        </div>
      )
    },
    {
      key: 'is_active', 
      header: 'INTEGRITY', 
      render: (v: boolean) => (
        <span className={`
          inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em]
          ${v ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#fee2e2] text-[#991b1b]'}
        `}>
          {v ? 'Active' : 'Offline'}
        </span>
      )
    },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const, 
      render: (_: any, r: AttendanceDevice) => (
        <div className="flex items-center justify-end gap-2 pr-4">
          <button 
            disabled={syncingDeviceId === r.id}
            onClick={() => syncMutation.mutate(r.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-sm
              ${syncingDeviceId === r.id ? 'bg-[#f1f5f9] text-[#94a3b8]' : 'bg-white border border-[#e2e8f0] text-[#7c3aed] hover:bg-[#f8fafc] active:scale-95'}
            `}
          >
            <RefreshCw className={`w-3 h-3 ${syncingDeviceId === r.id ? 'animate-spin' : ''}`} />
            {syncingDeviceId === r.id ? 'Syncing...' : 'Sync Node'}
          </button>
          <button 
            onClick={() => handleOpenDeviceModal(r)}
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] rounded-lg shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => { if(window.confirm('Decommission node?')) deleteDevice(r.id) }} 
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-red-50 text-[#94a3b8] hover:text-red-600 rounded-lg shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <Layers className="text-white w-5 h-5" />
           </div>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">Network Registry</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Global Hardware Infrastructure</p>
           </div>
        </div>
        <button 
          onClick={() => handleOpenDeviceModal()}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Register Node
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Network Points</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {Array.isArray(devicesData) ? devicesData.length : (devicesData as any)?.results?.length || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Global distribution</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Active Signals</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {(Array.isArray(devicesData) ? devicesData : (devicesData as any)?.results || [])?.filter((d: any) => d.is_active).length || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Operational nodes</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Protocol Health</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">100%</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Communication integrity</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#d97706]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Polling Latency</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">~2s</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Packet transmission</p>
          </div>
        </div>

        {/* Matrix Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
             <h3 className="text-xs font-extrabold text-[#0f172a] uppercase tracking-widest">Inventory Matrix</h3>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">
               Enlisted: {Array.isArray(devicesData) ? devicesData.length : (devicesData as any)?.results?.length || 0}
             </p>
          </div>
          
          <div className="min-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-32 gap-3 text-[#94a3b8]">
                <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Interrogating Subnet...</span>
              </div>
            ) : (
              <Table columns={deviceColumns} data={(Array.isArray(devicesData) ? devicesData : (devicesData as any)?.results || [])} className="border-none" />
            )}
          </div>
        </div>
      </div>

      {/* Device Modal */}
      <Modal theme="light"
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title={editingDeviceId ? "Modify Terminal" : "Register Hardware Node"}
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-4">
            <Button variant="ghost" onClick={() => setIsDeviceModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveDevice}
              isLoading={isCreatingDevice || isUpdatingDevice}
              className="flex-1 sm:flex-none px-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-none shadow-none font-bold"
            >
              Confirm
            </Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 gap-5">
            <Input label="DEVICE NAME *" placeholder="e.g. Main Gate K70" value={deviceForm.name || ''} onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })} className="bg-white border-slate-200 h-11 font-medium" />
            <Select label="TYPE" value={deviceForm.device_type || 'biometric'} onChange={(e) => setDeviceForm({ ...deviceForm, device_type: e.target.value as any })} options={[{ value: 'biometric', label: 'ZKTeco Biometric' }]} className="bg-white border-slate-200 h-11 font-medium" />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <Input label="IP ADDRESS" placeholder="192.168.1.100" value={deviceForm.ip_address || ''} onChange={(e) => setDeviceForm({ ...deviceForm, ip_address: e.target.value })} className="bg-white border-slate-200 h-11 font-mono tracking-wider" />
            <Input label="TCP PORT" type="number" placeholder="4370" value={deviceForm.port?.toString() || ''} onChange={(e) => setDeviceForm({ ...deviceForm, port: parseInt(e.target.value) })} className="bg-white border-slate-200 h-11 font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Input label="MACHINE ID" placeholder="Serial No." value={deviceForm.machine_identifier || ''} onChange={(e) => setDeviceForm({ ...deviceForm, machine_identifier: e.target.value })} className="bg-white border-slate-200 h-11" />
            <Input label="CLOUD URL" placeholder="Remote API" value={deviceForm.api_url || ''} onChange={(e) => setDeviceForm({ ...deviceForm, api_url: e.target.value })} className="bg-white border-slate-200 h-11" />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-violet-600" />
               </div>
               <div>
                  <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">Active Engagement</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Allow automated sync operations</p>
               </div>
            </div>
            <input
              type="checkbox"
              checked={!!deviceForm.is_active}
              onChange={(e) => setDeviceForm({ ...deviceForm, is_active: e.target.checked })}
              className="w-5 h-5 rounded-lg border-slate-300 text-violet-600 focus:ring-violet-600/20"
            />
          </div>
        </div>
      </Modal>

      {/* Sync Result Summary */}
      <Modal theme="light" isOpen={!!syncResult} onClose={() => setSyncResult(null)} title="Sync Intelligence Report" size="sm">
        {syncResult && (
          <div className="space-y-5 pt-2">
            <div className="flex items-center gap-3 p-4 bg-emerald-600/5 border border-emerald-400/20 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Terminal Operational</p>
                <p className="text-slate-900 font-bold text-sm">{syncResult.device}</p>
              </div>
            </div>

            <div className="space-y-3">
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center">
                     <p className="text-2xl font-bold text-violet-600">{syncResult.pull.created}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">New Logs</p>
                  </div>
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl text-center">
                     <p className="text-2xl font-bold text-emerald-600">{syncResult.process.processed}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Processed</p>
                  </div>
               </div>
               
               {syncResult.process.skipped_unmatched > 0 && (
                 <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                   <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                   <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase tracking-tight">
                     {syncResult.process.skipped_unmatched} Unknown code matches detected. Update staff biometric IDs.
                   </p>
                 </div>
               )}
            </div>
            <Button variant="primary" onClick={() => setSyncResult(null)} className="w-full font-bold h-11 bg-slate-900 border-none text-white shadow-xl shadow-slate-950/10">Dismiss</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
