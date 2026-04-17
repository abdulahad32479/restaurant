"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Network, ShieldCheck, Loader2, Edit, Trash2, Clock, Calendar, RefreshCw, Cpu } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useAttendance, useDevices, useBiometricActions, usePunches } from '@/src/hooks/useAttendance';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffAttendance, AttendanceDevice, BiometricPunch } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'punches'>('attendance');

  // Attendance Filters
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Punches (Hardware Logs) Filters
  const [punchDate, setPunchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [punchBioCodeFilter, setPunchBioCodeFilter] = useState('');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  // Hooks
  const { membersResponse } = useStaff({ is_active: true });
  const { devicesData } = useDevices(); 
  
  const { attendanceData, isLoading: isLoadingAtt, createAttendance, isCreating: isCreatingAtt, updateAttendance, isUpdating: isUpdatingAtt, deleteAttendance } = useAttendance({
    date: dateFilter || undefined,
    staff: staffFilter || undefined,
    status: statusFilter || undefined,
  });
  
  const { punchesData, isLoading: isLoadingPunches } = usePunches({
    date: punchDate || undefined,
    biometric_code: punchBioCodeFilter || undefined,
  });
  
  const { syncDevice, isSyncing } = useBiometricActions();

  // Forms
  const [attForm, setAttForm] = useState<Partial<StaffAttendance>>({
    staff: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present', source: 'manual', note: '', late_minutes: 0, early_leave_minutes: 0
  });

  const handleOpenAttendanceModal = (att?: StaffAttendance) => {
    if (att) {
       setEditingAttendanceId(att.id);
       setAttForm({
          staff: att.staff,
          date: att.date,
          check_in: att.check_in ? new Date(att.check_in).toISOString().slice(0, 16) : '',
          check_out: att.check_out ? new Date(att.check_out).toISOString().slice(0, 16) : '',
          status: att.status,
          source: att.source,
          note: att.note || '',
          late_minutes: att.late_minutes || 0,
          early_leave_minutes: att.early_leave_minutes || 0
       });
    } else {
       setEditingAttendanceId(null);
       setAttForm({ 
         staff: '', 
         date: new Date().toISOString().split('T')[0], 
         check_in: '', 
         check_out: '', 
         status: 'present', 
         source: 'manual', 
         note: '', 
         late_minutes: 0, 
         early_leave_minutes: 0 
       });
    }
    setIsManualModalOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!attForm.staff || !attForm.date || !attForm.status) return toast.error('Check required fields: Staff, Date, Status');
    
    // Convert local datetime-local back to ISO for API
    const payload = { ...attForm };
    if (payload.check_in) payload.check_in = new Date(payload.check_in).toISOString();
    if (payload.check_out) payload.check_out = new Date(payload.check_out).toISOString();
    
    if (editingAttendanceId) {
      updateAttendance({ id: editingAttendanceId, data: payload }, { onSuccess: () => setIsManualModalOpen(false) });
    } else {
      createAttendance(payload, { onSuccess: () => setIsManualModalOpen(false) });
    }
  };

  const handleSyncDevice = (id: string | number) => {
    syncDevice(id.toString(), { onSuccess: () => {
      toast.success('Device logs pulled successfully');
      setIsSyncModalOpen(false);
    }});
  };

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return '—';
    }
  };

  const attColumns = [
    { key: 'date', header: 'DATE', render: (v: string) => <span className="text-slate-600 font-medium text-sm">{v}</span> },
    { 
      key: 'staff', 
      header: 'STAFF', 
      render: (_: any, r: StaffAttendance) => (
        <span className="font-bold text-slate-800 text-sm">{r.staff_name || '---'}</span>
      )
    },
    { key: 'status', header: 'STATUS', render: (v: string) => (
        <Badge variant={v === 'present' ? 'success' : v === 'absent' ? 'error' : 'secondary'} size="sm" className="font-bold uppercase tracking-widest text-[9px] border-none px-3 py-0.5 rounded-full">
          {v.replace('_', ' ')}
        </Badge>
    )},
    { key: 'check_in', header: 'CHECK IN', render: (v: string) => <span className="text-slate-900 font-bold text-xs">{formatTime(v)}</span> },
    { key: 'check_out', header: 'CHECK OUT', render: (v: string) => <span className="text-slate-900 font-bold text-xs">{formatTime(v)}</span> },
    { key: 'late', header: 'LATE', render: (_: any, r: StaffAttendance) => (
       <span className="text-slate-600 text-xs">{r.late_minutes ? `${r.late_minutes}m` : '—'}</span>
    )},
    { key: 'note', header: 'NOTE', render: (v: string) => <span className="text-slate-400 text-xs italic">{v || '—'}</span> },
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: StaffAttendance) => (
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleOpenAttendanceModal(r)} className="p-1 px-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 rounded-lg transition-all"><Edit className="w-3.5 h-3.5"/></button>
        <button onClick={() => { if(window.confirm('Delete record?')) deleteAttendance(r.id) }} className="p-1 px-2 text-slate-400 hover:text-red-600 transition-all font-bold"> <Trash2 className="w-3.5 h-3.5"/> </button>
      </div>
    )}
  ];

  const punchColumns = [
    { 
      key: 'staff', 
      header: 'STAFF / ID', 
      render: (_: any, r: BiometricPunch) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm leading-tight">{r.staff_name || 'Unmatched'}</span>
          <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">CODE: {r.biometric_code}</span>
        </div>
      )
    },
    { key: 'time', header: 'TIMESTAMP', render: (_: any, r: BiometricPunch) => (
      <div className="flex flex-col">
        <span className="text-slate-900 font-bold text-xs">{new Date(r.punch_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="text-violet-600 font-bold text-xs">{new Date(r.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
      </div>
    )},
    { key: 'device_name', header: 'HARDWARE NODE', render: (v: string) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v || 'Unknown'}</span> },
    { key: 'is_processed', header: 'STATE', render: (v: boolean) => (
      v ? 
      <Badge variant="success" size="sm" className="text-[9px] font-bold uppercase tracking-widest border-none px-3 py-0.5 rounded-full">Processed</Badge> : 
      <Badge variant="warning" size="sm" className="text-[9px] font-bold uppercase tracking-widest border-none px-3 py-0.5 rounded-full">Raw Sync</Badge>
    ) }
  ];

  return (
    <div className="animate-fade-in -m-6 p-6 min-h-screen bg-[#f4f6f8] font-sans text-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance</h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[500px]">
        {/* Header Tabs & Filters */}
        <div className="px-5 py-4 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-slate-50 border border-slate-200 rounded-xl">
              <button onClick={() => setActiveTab('attendance')} className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>Activity Ledger</button>
              <button onClick={() => setActiveTab('punches')} className={`px-5 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${activeTab === 'punches' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}>Hardware Logs</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsSyncModalOpen(true)} className="bg-white border border-slate-200 text-slate-700 font-bold h-9 px-4 rounded-lg text-xs flex items-center shadow-sm hover:bg-slate-50 transition-all">
                <Network className="w-4 h-4 mr-2 text-violet-600"/> Terminal workbench
              </button>
              <button onClick={() => handleOpenAttendanceModal()} className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-9 px-5 rounded-lg text-xs flex items-center shadow-sm transition-all shadow-violet-200">
                <Plus className="w-4 h-4 mr-2"/> Record
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-bold text-slate-800">Attendance Records</span>
            {activeTab === 'attendance' ? (
              <div className="flex items-center gap-3">
                <Select 
                  value={staffFilter} 
                  onChange={(e) => setStaffFilter(e.target.value)} 
                  className="bg-white border-slate-200 h-9 w-48 font-medium text-xs rounded-lg" 
                  options={[{ value: '', label: 'All Staff' }, ...(membersResponse || []).map(m => ({ value: m.id, label: m.full_name }))]} 
                />
                <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="bg-white border-slate-200 h-9 w-40 text-xs font-medium rounded-lg" />
                <Select 
                   value={statusFilter} 
                   onChange={(e) => setStatusFilter(e.target.value)} 
                   className="bg-white border-slate-200 h-9 w-36 font-medium text-xs rounded-lg" 
                   options={[
                     { value: '', label: 'All Status' },
                     { value: 'present', label: 'Present' },
                     { value: 'absent', label: 'Absent' },
                     { value: 'leave', label: 'Leave' },
                     { value: 'half_day', label: 'Half Day' }
                   ]} 
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Input type="date" value={punchDate} onChange={(e) => setPunchDate(e.target.value)} className="bg-white border-slate-200 h-9 w-40 text-xs font-medium rounded-lg" />
                <Input placeholder="Bio ID..." value={punchBioCodeFilter} onChange={(e) => setPunchBioCodeFilter(e.target.value)} className="bg-white border-slate-200 h-9 w-28 text-xs font-medium rounded-lg px-3" />
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'attendance' ? (
          isLoadingAtt ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
            </div>
          ) : (
            <Table columns={attColumns} data={attendanceData || []} className="border-none" />
          )
        ) : (
          isLoadingPunches ? (
            <div className="flex flex-col items-center justify-center py-40">
              <Loader2 className="animate-spin text-violet-600 w-10 h-10" />
            </div>
          ) : (
            <Table columns={punchColumns} data={punchesData || []} className="border-none" />
          )
        )}
      </div>

      {/* Sync workbench modal */}
      <Modal theme="light" isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Terminal Sync Workbench" size="md">
        <div className="space-y-6">
          <div className="p-5 bg-violet-600/5 border border-violet-600/10 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Active Hardware Nodes
            </h4>
            <div className="space-y-2">
              {devicesData?.filter(d => d.is_active).map(device => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-violet-600/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-violet-600/5 transition-colors">
                      <Cpu className="w-4 h-4 text-slate-400 group-hover:text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{device.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{device.ip_address || 'Cloud Node'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSyncDevice(device.id)}
                    disabled={isSyncing}
                    className="p-2 border border-slate-100 bg-white hover:bg-violet-600 text-slate-700 hover:text-white rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!devicesData || devicesData.filter(d => d.is_active).length === 0) && (
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4">No active nodes detected</p>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
               <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Sync & Auto-Process</p>
               <p className="text-[9px] text-slate-500 font-bold leading-relaxed">
                 All synchronization jobs automatically consolidate raw punches into attendance records for the relevant staff members and dates.
               </p>
            </div>
          </div>
        </div>
      </Modal>

      {/* Manual Recording Modal */}
      <Modal theme="light"
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Record Attendance"
        size="md"
        footer={
          <div className="flex gap-3 mt-4 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsManualModalOpen(false)} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-bold px-8">Cancel</Button>
            <Button variant="primary" onClick={handleSaveAttendance} isLoading={isCreatingAtt || isUpdatingAtt} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11">Save</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-5">
            <Select 
              label="STAFF MEMBER *" 
              value={attForm.staff as string}
              onChange={(e) => setAttForm({...attForm, staff: e.target.value})}
              options={[{ value: '', label: '--- select ---' }, ...(membersResponse || []).map(m => ({ value: m.id, label: m.full_name }))]}
              disabled={!!editingAttendanceId}
              className="bg-white border-slate-200 h-11 font-medium"
            />
            <Input label="DATE *" type="date" value={attForm.date} onChange={(e) => setAttForm({...attForm, date: e.target.value})} className="bg-white border-slate-200 h-11 font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Select 
              label="STATUS *" 
              value={attForm.status}
              onChange={(e) => setAttForm({...attForm, status: e.target.value as any})}
              options={[{ value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'leave', label: 'Leave' }, { value: 'half_day', label: 'Half Day' }]}
              className="bg-white border-slate-200 h-11 font-medium"
            />
            <Select label="SOURCE" value={attForm.source} onChange={(e) => setAttForm({...attForm, source: e.target.value as any})} options={[{ value: 'manual', label: 'Manual' }, { value: 'biometric', label: 'Biometric' }]} className="bg-white border-slate-200 h-11 font-medium" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Input label="CHECK IN" type="datetime-local" value={attForm.check_in as string} onChange={(e) => setAttForm({...attForm, check_in: e.target.value})} className="bg-white border-slate-200 h-11 text-xs" />
            <Input label="CHECK OUT" type="datetime-local" value={attForm.check_out as string} onChange={(e) => setAttForm({...attForm, check_out: e.target.value})} className="bg-white border-slate-200 h-11 text-xs" />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <Input label="LATE MINUTES" type="number" value={attForm.late_minutes?.toString()} onChange={(e) => setAttForm({...attForm, late_minutes: parseInt(e.target.value) || 0})} className="bg-white border-slate-200 h-11" />
            <Input label="EARLY LEAVE MINUTES" type="number" value={attForm.early_leave_minutes?.toString()} onChange={(e) => setAttForm({...attForm, early_leave_minutes: parseInt(e.target.value) || 0})} className="bg-white border-slate-200 h-11" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">NOTE</label>
            <textarea
              placeholder="Optional"
              value={attForm.note || ''}
              onChange={(e) => setAttForm({...attForm, note: e.target.value})}
              className="w-full min-h-[80px] p-3 rounded-xl border border-slate-200 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600/20 transition-all resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
