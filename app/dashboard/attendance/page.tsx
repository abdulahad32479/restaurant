"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Calendar, Fingerprint, Plus, Server, Network, ShieldCheck, Loader2, ListOrdered, Smartphone, Edit, Trash2, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useAttendance, useDevices, useBiometricActions, usePunches } from '@/src/hooks/useAttendance';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffAttendance, AttendanceDevice, BiometricPunch } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'punches'>('attendance');

  // Tab: Attendance Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [staffFilter, setStaffFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  
  // Tab: Punches Filters
  const [punchDate, setPunchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [punchStaffFilter, setPunchStaffFilter] = useState('');
  const [punchProcessedFilter, setPunchProcessedFilter] = useState('');
  const [punchBioCodeFilter, setPunchBioCodeFilter] = useState('');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  // Hooks
  const { membersResponse } = useStaff({ is_active: true });
  const { devicesData } = useDevices(); 
  
  const { attendanceData, isLoading: isLoadingAtt, createAttendance, isCreating: isCreatingAtt, updateAttendance, isUpdating: isUpdatingAtt, deleteAttendance } = useAttendance({
    start_date: startDate,
    end_date: endDate,
    status: statusFilter || undefined,
    staff: staffFilter || undefined,
    source: sourceFilter || undefined,
  });
  
  const { punchesData, isLoading: isLoadingPunches } = usePunches({
    date: punchDate || undefined,
    staff: punchStaffFilter || undefined,
    is_processed: punchProcessedFilter === 'true' ? true : punchProcessedFilter === 'false' ? false : undefined,
    biometric_code: punchBioCodeFilter || undefined,
  });
  
  const { syncDevice, isSyncing, processAttendance, isProcessing } = useBiometricActions();

  // Forms
  const [attForm, setAttForm] = useState<Partial<StaffAttendance>>({
    staff: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present', source: 'manual', note: '', late_minutes: 0, early_leave_minutes: 0
  });
  const [processDate, setProcessDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSyncDevice, setSelectedSyncDevice] = useState('');

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
       setAttForm({ staff: '', date: new Date().toISOString().split('T')[0], check_in: '', check_out: '', status: 'present', source: 'manual', note: '', late_minutes: 0, early_leave_minutes: 0 });
    }
    setIsManualModalOpen(true);
  };

  const handleSaveAttendance = () => {
    if (!attForm.staff || !attForm.date || !attForm.status) return toast.error('Fill required fields (Staff, Date, Status)');
    
    const payload = { ...attForm };
    if (!payload.check_in) payload.check_in = null;
    if (!payload.check_out) payload.check_out = null;
    
    if (editingAttendanceId) {
      updateAttendance({ id: editingAttendanceId, data: payload }, { onSuccess: () => setIsManualModalOpen(false) });
    } else {
      createAttendance(payload, { onSuccess: () => setIsManualModalOpen(false) });
    }
  };

  const handleSyncDevice = () => {
    if (!selectedSyncDevice) return toast.error('Select a device');
    syncDevice(selectedSyncDevice);
  };

  const handleProcessAttendance = () => {
    if (!processDate) return toast.error('Select a process date');
    processAttendance(processDate);
  };

  const attColumns = [
    { 
      key: 'staff', 
      header: 'STAFF MEMBER', 
      render: (_: any, r: StaffAttendance) => (
        <div className="flex flex-col">
          <span className="font-black text-white text-sm uppercase tracking-tighter drop-shadow-sm">{r.staff_name || 'Staff Member'}</span>
          <span className="text-[10px] text-tertiary font-bold uppercase tracking-widest opacity-60">Recorded via: {r.source_display || r.source}</span>
        </div>
      )
    },
    { key: 'date', header: 'DATE', render: (v: string) => <span className="text-[11px] font-black text-white uppercase tracking-tighter opacity-80">{v}</span> },
    { key: 'time', header: 'TIMELINE', render: (_: any, r: StaffAttendance) => (
      <div className="flex gap-5 items-center">
        <div className="flex flex-col">
           <span className="text-[9px] text-tertiary font-black uppercase tracking-[0.2em] mb-1">Check-In</span>
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-success shadow-glow-success" />
             <span className="font-black text-white text-[13px] tracking-tight">{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
           </div>
        </div>
        <div className="flex flex-col border-l border-base pl-5">
           <span className="text-[9px] text-tertiary font-black uppercase tracking-[0.2em] mb-1">Check-Out</span>
           <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-error shadow-glow-error" />
             <span className="font-black text-white text-[13px] tracking-tight">{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
           </div>
        </div>
      </div>
    )},
    { key: 'status', header: 'RECOGNITION', render: (v: string) => (
        <Badge variant={v === 'present' ? 'success' : v === 'absent' ? 'error' : 'warning'} size="sm" className="font-black uppercase tracking-widest text-[9px] border-none px-4">
          {v.replace('_', ' ')}
        </Badge>
    )},
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: StaffAttendance) => (
      <div className="flex items-center justify-end gap-3">
        <button 
          onClick={() => handleOpenAttendanceModal(r)}
          className="p-2 border border-base bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all group"
        >
          <Edit className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
        </button>
      </div>
    )
  }
  ];

  const punchColumns = [
    { 
      key: 'staff', 
      header: 'HARDWARE IDENTIFIER', 
      render: (_: any, r: BiometricPunch) => (
        <div className="flex flex-col">
          <span className="font-black text-white text-sm uppercase tracking-tighter drop-shadow-sm">{r.staff_name || 'Unmatched Asset'}</span>
          <span className="text-[10px] text-tertiary font-black tracking-widest uppercase opacity-60">BIOMETRIC CODE: {r.biometric_code}</span>
        </div>
      )
    },
    { key: 'time', header: 'PUNCH PROTOCOL', render: (_: any, r: BiometricPunch) => (
      <div className="flex flex-col">
        <span className="text-white font-black text-xs uppercase tracking-tighter">{new Date(r.punch_time).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span className="text-primary font-black text-[13px] tracking-tight">{new Date(r.punch_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
      </div>
    )},
    { key: 'device_name', header: 'TERMINAL NODE', render: (v: string) => <span className="text-[10px] font-black text-tertiary uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-base">{v || 'Unknown Terminal'}</span> },
    { key: 'is_processed', header: 'STATE', render: (v: boolean) => (
      v ? 
      <Badge variant="success" size="sm" className="text-[9px] font-black uppercase tracking-widest px-3 border-none shadow-glow-success/20">Consolidated</Badge> : 
      <Badge variant="warning" size="sm" className="text-[9px] font-black uppercase tracking-widest px-3 border-none shadow-glow-warning/20">Raw Log</Badge>
    ) }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full -ml-16 -mt-16 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Attendance & Bio-Sync</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage physical workforce logs and terminal synchronization</p>
        </div>
        <div className="flex gap-3 relative z-10">
           <Button variant="secondary" onClick={() => setIsSyncModalOpen(true)} className="bg-secondary border-base text-white font-black uppercase tracking-widest text-[10px] px-6 hover:bg-white/5">
              <Network className="w-4 h-4 mr-2 text-primary"/> 
              Open Workbench
            </Button>
            <Button variant="primary" onClick={() => handleOpenAttendanceModal()} className="font-black uppercase tracking-tighter shadow-glow-primary px-8">
              <Plus className="w-5 h-5 mr-3"/> 
              Register Manual Log
            </Button>
        </div>
      </div>

      <div className="inline-flex p-1.5 bg-bg-main border border-base rounded-[1.5rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <button onClick={() => setActiveTab('attendance')} className={`relative z-10 flex items-center gap-3 px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === 'attendance' ? 'bg-secondary text-white shadow-2xl border border-base' : 'text-tertiary hover:text-white'}`}><Calendar className="w-4 h-4"/> Activity Ledger</button>
        <button onClick={() => setActiveTab('punches')} className={`relative z-10 flex items-center gap-3 px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${activeTab === 'punches' ? 'bg-secondary text-white shadow-2xl border border-base' : 'text-tertiary hover:text-white'}`}><ListOrdered className="w-4 h-4"/> Raw Machine Logs</button>
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="bg-secondary border border-base rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
              <div className="md:col-span-4 flex flex-col gap-2.5">
                <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">Workforce Filter</label>
                <Select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black uppercase tracking-tighter text-white" options={[{ value: '', label: 'ALL REGISTERED STAFF' }, ...(membersResponse?.results || []).map(m => ({ value: m.id, label: m.full_name }))]} />
              </div>
              <div className="md:col-span-4 flex flex-col gap-2.5">
                <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">Operation Period</label>
                <div className="grid grid-cols-2 gap-3">
                   <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white" />
                   <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white" />
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-2.5">
                <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">Status</label>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white" options={[{ value: '', label: 'ALL LOGS' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'leave', label: 'Leave' }, { value: 'half_day', label: 'Half Day' }]} />
              </div>
              <div className="md:col-span-2 flex flex-col gap-2.5">
                <label className="text-[11px] font-black text-tertiary uppercase tracking-widest ml-1">Log Origin</label>
                <Select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white" options={[{ value: '', label: 'ANY SOURCE' }, { value: 'manual', label: 'Operator' }, { value: 'biometric', label: 'Machine' }]} />
              </div>
            </div>
          </div>

          <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[450px]">
            {isLoadingAtt ? (
              <div className="flex flex-col items-center justify-center p-40 gap-4">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
                <p className="text-tertiary font-black uppercase tracking-[0.2em] text-xs text-center">Parsing Attendance Cluster...</p>
              </div>
            ) : (
               <Table columns={attColumns} data={attendanceData || []} className="text-sm border-none" />
            )}
          </Card>
        </>
      )}

      {activeTab === 'punches' && (
        <>
          <div className="bg-secondary border border-base rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
               <div className="flex flex-col gap-2.5">
                 <label className="text-[11px] font-black text-tertiary uppercase tracking-widest">Punch Date</label>
                 <Input type="date" value={punchDate} onChange={(e) => setPunchDate(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white" />
               </div>
               <div className="flex flex-col gap-2.5">
                 <label className="text-[11px] font-black text-tertiary uppercase tracking-widest">Biometric Machine ID</label>
                 <Input placeholder="e.g. 101" value={punchBioCodeFilter} onChange={(e) => setPunchBioCodeFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black text-white text-center" />
               </div>
               <div className="flex flex-col gap-2.5">
                 <label className="text-[11px] font-black text-tertiary uppercase tracking-widest">Recognized Staff</label>
                 <Select value={punchStaffFilter} onChange={(e) => setPunchStaffFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black uppercase text-white" options={[{ value: '', label: 'ALL STAFF' }, ...(membersResponse?.results || []).map(m => ({ value: m.id, label: m.full_name }))]} />
               </div>
               <div className="flex flex-col gap-2.5">
                 <label className="text-[11px] font-black text-tertiary uppercase tracking-widest">Protocol State</label>
                 <Select value={punchProcessedFilter} onChange={(e) => setPunchProcessedFilter(e.target.value)} className="bg-bg-main border-base h-14 font-black uppercase text-white" options={[{ value: '', label: 'ALL HARDWARE LOGS' }, { value: 'true', label: 'PROCESSED' }, { value: 'false', label: 'UNPROCESSED' }]} />
               </div>
            </div>
          </div>
          <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[450px]">
             {isLoadingPunches ? (
                <div className="flex flex-col items-center justify-center p-40 gap-4">
                  <Loader2 className="animate-spin text-primary w-12 h-12" />
                  <p className="text-tertiary font-black uppercase tracking-[0.2em] text-xs text-center">Decompressing Machine Tapes...</p>
                </div>
             ) : (
                <Table columns={punchColumns} data={punchesData || []} className="text-sm border-none" />
             )}
          </Card>
        </>
      )}

      {/* Sync Action Modal */}
      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Biometric Processing Engine" size="lg">
        <div className="space-y-8 py-4">
          <div className="bg-bg-main p-7 rounded-[2rem] border border-base shadow-inner space-y-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl"><Network className="w-6 h-6 text-primary"/></div>
              <div className="flex flex-col">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Step 1: Terminal Pull</h3>
                <p className="text-[11px] text-tertiary font-bold uppercase tracking-tight">Acquire encrypted sensor records from the physical hardware</p>
              </div>
            </div>
            <div className="space-y-4 pt-2">
              <Select label="TARGET HARDWARE NODE" value={selectedSyncDevice} onChange={(e) => setSelectedSyncDevice(e.target.value)} options={[{ value: '', label: '--- SELECT MACHINE ---' }, ...(devicesData || []).map(d => ({ value: d.id, label: d.name }))]} className="bg-secondary border-base h-14 font-black uppercase text-white tracking-widest" />
              <Button variant="secondary" className="w-full uppercase font-black text-[11px] tracking-[0.2em] h-14 border-base hover:bg-white/5 shadow-xl" isLoading={isSyncing} onClick={handleSyncDevice}>Initiate Physical Record Handshake</Button>
            </div>
          </div>
          
          <div className="bg-bg-main p-7 rounded-[2rem] border border-base shadow-inner space-y-5 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-accent/10 transition-colors" />
             <div className="flex items-center gap-4">
               <div className="p-3 bg-accent/10 rounded-2xl"><ShieldCheck className="w-6 h-6 text-accent"/></div>
               <div className="flex flex-col">
                 <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Step 2: Metric Consolidation</h3>
                 <p className="text-[11px] text-tertiary font-bold uppercase tracking-tight">Convert raw punch clusters into staff check-in/out logic</p>
               </div>
             </div>
             <div className="space-y-4 pt-2">
               <Input type="date" label="CALCULATION CALENDAR SCOPE" value={processDate} onChange={(e) => setProcessDate(e.target.value)} className="bg-secondary border-base h-14 text-white font-black uppercase text-center" />
               <Button variant="primary" className="w-full uppercase font-black tracking-tighter h-14 shadow-glow-primary" isLoading={isProcessing} onClick={handleProcessAttendance}>Run Core Consolidation Algorithm</Button>
             </div>
          </div>
        </div>
      </Modal>

      {/* Manual Attendance Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title={editingAttendanceId ? "Modify Work Log" : "New Attendance Entry"}
        size="lg"
        footer={
          <div className="flex gap-3 mt-2 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsManualModalOpen(false)} className="flex-1 sm:flex-none uppercase tracking-widest font-black text-[10px]">Close</Button>
            <Button variant="primary" onClick={handleSaveAttendance} isLoading={isCreatingAtt || isUpdatingAtt} className="flex-1 sm:flex-none px-12 shadow-glow-primary font-black uppercase text-[10px] tracking-widest">Commit to Activity Log</Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <Select 
            label="STAFF RECIPIENT *" 
            value={attForm.staff as string}
            onChange={(e) => setAttForm({...attForm, staff: e.target.value})}
            options={[{ value: '', label: '--- SELECT STAFF MEMBER ---' }, ...(membersResponse?.results || []).map(m => ({ value: m.id, label: m.full_name }))]}
            disabled={!!editingAttendanceId}
            className="bg-bg-main border-base text-white h-14 font-black uppercase tracking-tighter"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="DATE *" type="date" value={attForm.date} onChange={(e) => setAttForm({...attForm, date: e.target.value})} className="bg-bg-main border-base text-white h-14 font-black" />
            <Select 
              label="ATTENDANCE STATUS *" 
              value={attForm.status}
              onChange={(e) => setAttForm({...attForm, status: e.target.value as any})}
              options={[{ value: 'present', label: 'PRESENT' }, { value: 'absent', label: 'ABSENT' }, { value: 'leave', label: 'LEAVE / VACATION' }, { value: 'half_day', label: 'HALF DAY' }]}
              className="bg-bg-main border-base text-white font-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="MACHINE CHECK-IN (ISO)" type="datetime-local" value={attForm.check_in as string} onChange={(e) => setAttForm({...attForm, check_in: e.target.value})} className="bg-bg-main border-base text-white text-xs h-14" />
            <Input label="MACHINE CHECK-OUT (ISO)" type="datetime-local" value={attForm.check_out as string} onChange={(e) => setAttForm({...attForm, check_out: e.target.value})} className="bg-bg-main border-base text-white text-xs h-14" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="LATE MINUTES" type="number" value={attForm.late_minutes?.toString()} onChange={(e) => setAttForm({...attForm, late_minutes: parseInt(e.target.value) || 0})} className="bg-bg-main border-base text-white h-14 text-center font-black" />
            <Input label="EARLY LEAVE MINUTES" type="number" value={attForm.early_leave_minutes?.toString()} onChange={(e) => setAttForm({...attForm, early_leave_minutes: parseInt(e.target.value) || 0})} className="bg-bg-main border-base text-white h-14 text-center font-black" />
          </div>

          <Input label="LOG ENTRY NOTE" placeholder="Reason for manual entry or status change..." value={attForm.note || ''} onChange={(e) => setAttForm({...attForm, note: e.target.value})} className="bg-bg-main border-base text-white h-14" />
        </div>
      </Modal>
    </div>
  );
}
