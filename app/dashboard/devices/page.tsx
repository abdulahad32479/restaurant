"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import {
  Server, Plus, Loader2, Edit, Trash2, Smartphone, RefreshCw,
  ShieldCheck, Zap, Wifi, CheckCircle2, AlertTriangle, ArrowDownToLine,
  Cpu, Activity, XCircle, HardDrive
} from 'lucide-react';
import { Card } from '@/src/components/Card';
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
    if (!deviceForm.name || !deviceForm.device_type) return toast.error('Check required fields: Name, Type');
    const payload = { ...deviceForm };
    
    if (editingDeviceId) {
      updateDevice({ id: editingDeviceId, data: payload }, { onSuccess: () => setIsDeviceModalOpen(false) });
    } else {
      createDevice(payload, { onSuccess: () => setIsDeviceModalOpen(false) });
    }
  };

  const deviceColumns = [
    {
      key: 'name', header: 'TERMINAL IDENTITY',
      render: (v: string, r: AttendanceDevice) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${r.is_active ? 'bg-violet-600/10 border border-violet-600/20' : 'bg-slate-100 border border-slate-200'}`}>
            <Cpu className={`w-4 h-4 ${r.is_active ? 'text-violet-600' : 'text-slate-400 opacity-60'}`} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800 text-sm">{v}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{r.device_type_display || r.device_type}</span>
          </div>
        </div>
      )
    },
    {
      key: 'network', header: 'NETWORK',
      render: (_: any, r: AttendanceDevice) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-slate-700 font-bold text-xs font-mono">{r.ip_address || '—'}</span>
          <span className="text-[10px] text-slate-400 font-bold">PORT: {r.port || 4370}</span>
        </div>
      )
    },
    {
      key: 'last_synced_at', header: 'LAST SYNC',
      render: (_: any, r: AttendanceDevice) => (
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">
          {r.last_synced_at
            ? new Date(r.last_synced_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
            : 'Never'}
        </span>
      )
    },
    {
      key: 'is_active', header: 'STATE',
      render: (_: any, r: AttendanceDevice) => (
        r.is_active
          ? <Badge variant="success" size="sm" className="font-bold uppercase tracking-widest text-[9px] px-3 border-none rounded-full">Online</Badge>
          : <Badge variant="secondary" size="sm" className="font-bold uppercase tracking-widest text-[9px] px-3 border-none rounded-full opacity-50">Offline</Badge>
      )
    },
    {
      key: 'actions', header: '', align: 'right' as const,
      render: (_: any, r: AttendanceDevice) => {
        const isSyncingThis = syncingDeviceId === r.id;
        return (
          <div className="flex items-center justify-end gap-2 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => syncMutation.mutate(r.id)}
              disabled={isSyncingThis || !r.is_active}
              className={`p-2 rounded-lg transition-all border flex items-center gap-2
                ${r.is_active
                  ? 'bg-violet-600/5 hover:bg-violet-600 text-violet-600 hover:text-white border-violet-600/10'
                  : 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'}`}
              title={r.is_active ? 'Sync attendance' : 'Inactive'}
            >
              {isSyncingThis
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleOpenDeviceModal(r)}
              className="bg-white hover:bg-slate-50 text-slate-500 p-2 rounded-lg border border-slate-200"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { if (window.confirm('Delete device?')) deleteDevice(r.id); }}
              className="bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 p-2 rounded-lg border border-slate-200"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="animate-fade-in -m-6 p-6 min-h-screen bg-[#f4f6f8] font-sans text-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Devices</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Attendance Hardware Nodes</p>
        </div>
        <button onClick={() => handleOpenDeviceModal()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2 px-5 rounded-lg text-xs flex items-center shadow-sm transition-all shadow-violet-200">
           <Plus className="w-4 h-4 mr-2" />
           Register Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Nodes', value: devicesData?.length || 0, icon: Server, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'Network Online', value: devicesData?.filter(d => d.is_active).length || 0, icon: Wifi, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'ZKTeco Bio', value: devicesData?.filter(d => d.device_type === 'biometric').length || 0, icon: Fingerprint, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Sync Health', value: '100%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} border border-slate-200/50 p-5 rounded-2xl shadow-sm relative overflow-hidden`}>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-2xl font-bold tracking-tighter ${color}`}>{value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color.replace('text', 'bg')}/10`}>
                 <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm p-0 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Scanning Network...</p>
          </div>
        ) : (
          <Table columns={deviceColumns} data={devicesData || []} className="border-none" />
        )}
      </Card>

      {/* Device Modal */}
      <Modal theme="light"
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        title="Hardware Node Configuration"
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-4">
            <Button variant="outline" onClick={() => setIsDeviceModalOpen(false)} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-bold px-8">Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSaveDevice}
              isLoading={isCreatingDevice || isUpdatingDevice}
              className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11"
            >
              {editingDeviceId ? 'Save Changes' : 'Register Node'}
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
            <Button variant="primary" onClick={() => setSyncResult(null)} className="w-full font-bold h-11 bg-slate-900 border-none text-white">Dismiss</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

const Fingerprint = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.02-.26 3.02" /><path d="M7 10.1a5 5 0 0 1 9.35-1.5" /><path d="M17.89 12.39a10 10 0 0 1 .11 1.61c0 1.93-.31 3.51-1 4.5" /><path d="M15 11a12 12 0 0 0-1.5-3.5" /><path d="M12.6 19q-.6.3-1.6.3c-2.36 0-4.4-1.67-4.4-4" /><path d="M22 13c0-1.1-.1-2.1-.3-3.1" /><path d="M7 17c.9 1.2 2.1 2 3.5 2" /><path d="M2 11.5a10 10 0 0 1 18.8-3.3" /><path d="M4.9 19a10 10 0 0 1-1.9-6" />
  </svg>
);
