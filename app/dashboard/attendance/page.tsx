"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Calendar, Fingerprint, Plus, Server, Network, ShieldCheck, Loader2, ListOrdered, Smartphone, Edit, Trash2 } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useAttendance, useDevices, useBiometricActions, usePunches } from '@/src/hooks/useAttendance';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffAttendance, AttendanceDevice, BiometricPunch } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'punches'>('attendance');

  // Unified pagination
  const [page, setPage] = useState(1);
  
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
  const { devicesData } = useDevices({ page: 1, page_size: 100 }); // Getting all devices for select lists
  const { attendanceData, isLoading: isLoadingAtt, createAttendance, isCreating: isCreatingAtt, updateAttendance, isUpdating: isUpdatingAtt, deleteAttendance } = useAttendance({
    page,
    page_size: 20,
    start_date: startDate,
    end_date: endDate,
    status: statusFilter || undefined,
    staff: staffFilter || undefined,
    source: sourceFilter || undefined,
  });
  const { punchesData, isLoading: isLoadingPunches } = usePunches({
    page,
    page_size: 20,
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

  // Handlers
  const handleSaveAttendance = () => {
    if (!attForm.staff || !attForm.date || !attForm.status) return toast.error('Fill required fields (Staff, Date, Status)');
    
    // Clean up empty datetime strings to null
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
      render: (_: any, r: StaffAttendance) => {
        const staff = membersResponse?.results.find(m => m.id === r.staff);
        return (
          <div className="flex flex-col group transition-all">
            <span className="font-bold text-slate-900 text-sm group-hover:text-primary">{staff?.full_name || r.staff_name || 'Staff Member'}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{staff?.employee_code || '---'}</span>
          </div>
        );
      }
    },
    { key: 'date', header: 'DATE', render: (v: string) => <span className="font-bold text-slate-600 text-xs">{v}</span> },
    { key: 'time', header: 'TIMELINE', render: (_: any, r: StaffAttendance) => (
      <div className="flex gap-4 items-center">
        <div className="flex flex-col">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">In</span>
           <span className="font-black text-slate-800 text-sm">{r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
        </div>
        <div className="flex flex-col border-l border-slate-100 pl-4">
           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Out</span>
           <span className="font-black text-slate-800 text-sm">{r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
        </div>
      </div>
    )},
    { key: 'status', header: 'STATUS', render: (v: string) => (
        <Badge variant={v === 'present' ? 'success' : v === 'absent' ? 'error' : 'warning'} size="sm" className="font-bold uppercase tracking-widest text-[9px] border-none">
          {v.replace('_', ' ')}
        </Badge>
    )},
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: StaffAttendance) => (
      <div className="flex items-center justify-end gap-2">
        <button 
          onClick={() => handleOpenAttendanceModal(r)}
          className="p-2 border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
        >
          <Edit className="w-4 h-4" />
        </button>
      </div>
    )
  }
  ];

  const punchColumns = [
    { 
      key: 'staff', 
      header: 'STAFF MEMBER', 
      render: (_: any, r: BiometricPunch) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm">{r.staff_name || 'Unmatched'}</span>
          <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">CODE: {r.biometric_code}</span>
        </div>
      )
    },
    { key: 'time', header: 'PUNCH TIME', render: (_: any, r: BiometricPunch) => <span className="text-slate-600 font-bold text-xs">{new Date(r.punch_time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span> },
    { key: 'device', header: 'DEVICE', render: (v: string) => <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{v}</span> },
    { key: 'processed', header: 'STATUS', render: (v: boolean) => (v ? <Badge variant="success" size="sm" className="text-[9px] font-bold">Processed</Badge> : <Badge variant="warning" size="sm" className="text-[9px] font-bold">Pending</Badge>) }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Bio & Attendance Control</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage physical access, sync raw logs, and verify daily metrics</p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-slate-100 w-full md:w-max rounded-2xl border border-slate-200 shadow-sm">
        <button onClick={() => { setActiveTab('attendance'); setPage(1); }} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'attendance' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}><Calendar className="w-4 h-4"/> Activity Logs</button>
        <button onClick={() => { setActiveTab('punches'); setPage(1); }} className={`flex items-center gap-3 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'punches' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'}`}><ListOrdered className="w-4 h-4"/> Hardware Punches</button>
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <div className="flex gap-3">
                <Button variant="secondary" size="md" onClick={() => setIsSyncModalOpen(true)} className="bg-white border-slate-100 text-slate-600 font-bold uppercase tracking-widest text-[9px] px-6">
                  <Fingerprint className="w-4 h-4 mr-2 text-primary"/> 
                  Process Records
                </Button>
                <Button variant="primary" size="md" onClick={() => handleOpenAttendanceModal()} className="font-black uppercase shadow-glow-primary px-8">
                  <Plus className="w-4 h-4 mr-2"/> 
                  Manual Record
                </Button>
             </div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
            <Select label="STAFF MEMBER" value={staffFilter} onChange={(e) => { setStaffFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" options={[{ value: '', label: 'ALL STAFF' }, ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])]} />
            <div className="grid grid-cols-2 gap-3">
               <Input type="date" label="FROM" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" />
               <Input type="date" label="TO" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" />
            </div>
            <Select label="STATUS" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" options={[{ value: '', label: 'ALL STATUSES' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'leave', label: 'Leave' }, { value: 'half_day', label: 'Half Day' }]} />
            <Select label="SOURCE" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" options={[{ value: '', label: 'ALL SOURCES' }, { value: 'manual', label: 'Manual' }, { value: 'biometric', label: 'Biometric' }]} />
          </div>

          <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
            {isLoadingAtt ? <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : (
               <Table columns={attColumns} data={attendanceData?.results || []} className="text-sm border-none" />
            )}
          </Card>
          {!isLoadingAtt && attendanceData && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-tertiary">
              <p>Showing <span className="text-white">{attendanceData.results.length}</span> of <span className="text-white">{attendanceData.count}</span> records</p>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" disabled={!attendanceData.previous} onClick={() => setPage(p => p - 1)} className="border-base hover:border-primary/50">Prev</Button>
                <Button variant="secondary" size="sm" disabled={!attendanceData.next} onClick={() => setPage(p => p + 1)} className="border-base hover:border-primary/50">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'punches' && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Button variant="primary" size="md" onClick={() => setIsSyncModalOpen(true)} className="font-black uppercase shadow-glow-primary px-8">
                <Network className="w-4 h-4 mr-2"/> 
                Sync Hardware
              </Button>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
             <Input type="date" label="PUNCH DATE" value={punchDate} onChange={(e) => { setPunchDate(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" />
             <Input label="BIOMETRIC ID" placeholder="e.g. 101" value={punchBioCodeFilter} onChange={(e) => { setPunchBioCodeFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" />
             <Select label="STAFF MEMBER" value={punchStaffFilter} onChange={(e) => { setPunchStaffFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" options={[{ value: '', label: 'ALL STAFF' }, ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])]} />
             <Select label="SYNC STATUS" value={punchProcessedFilter} onChange={(e) => { setPunchProcessedFilter(e.target.value); setPage(1); }} className="bg-white border-slate-200 text-slate-900" options={[{ value: '', label: 'ALL LOGS' }, { value: 'true', label: 'PROCESSED' }, { value: 'false', label: 'UNPROCESSED' }]} />
          </div>
          <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
             {isLoadingPunches ? <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : (
                <Table columns={punchColumns} data={punchesData?.results || []} className="text-sm border-none" />
             )}
          </Card>
           {!isLoadingPunches && punchesData && (
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-tertiary">
              <p>Showing <span className="text-white">{punchesData.results.length}</span> of <span className="text-white">{punchesData.count}</span> raw punches</p>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" disabled={!punchesData.previous} onClick={() => setPage(p => p - 1)} className="border-base hover:border-primary/50">Prev</Button>
                <Button variant="secondary" size="sm" disabled={!punchesData.next} onClick={() => setPage(p => p + 1)} className="border-base hover:border-primary/50">Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Sync Action Modal */}
      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Attendance Processing Workbench" size="lg">
        <div className="space-y-6 py-2">
          <div className="bg-secondary p-5 rounded-2xl border border-base shadow-xl space-y-4">
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-3"><Network className="w-5 h-5 text-primary"/> Stage 1: Synchronize Hardware Logs</h3>
            <p className="text-[11px] text-tertiary uppercase font-bold tracking-tight leading-relaxed">Select a terminal from your network to pull physical biometric fingerprints. <span className="text-primary/80 underline decoration-dotted">The backend must be physically adjacent to the LAN.</span></p>
            <Select label="TARGET HARDWARE NODE" value={selectedSyncDevice} onChange={(e) => setSelectedSyncDevice(e.target.value)} options={[{ value: '', label: '--- select terminal ---' }, ...(devicesData?.results.map(d => ({ value: d.id, label: d.name })) || [])]} className="bg-bg-main border-base" />
            <Button variant="secondary" className="w-full uppercase font-black text-[10px] tracking-widest h-12 border-base hover:bg-white/5" isLoading={isSyncing} onClick={handleSyncDevice}>Initiate Physical Pull</Button>
          </div>
          
          <div className="bg-secondary p-5 rounded-2xl border border-base shadow-xl space-y-4">
            <h3 className="text-[11px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-3"><ShieldCheck className="w-5 h-5"/> Stage 2: Consolidate Attendance Metrics</h3>
            <p className="text-[11px] text-tertiary uppercase font-bold tracking-tight leading-relaxed">Map raw log files across staff profiles to automatically calculate <span className="text-accent underline decoration-dotted">first-in and last-out parameters</span>, generating formal attendance records.</p>
            <Input type="date" label="CALCULATION CALENDAR DATE" value={processDate} onChange={(e) => setProcessDate(e.target.value)} className="bg-bg-main border-base" />
            <Button variant="primary" className="w-full uppercase font-black tracking-tighter h-12 shadow-glow-primary" isLoading={isProcessing} onClick={handleProcessAttendance}>Execute Calculation Cycle</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
