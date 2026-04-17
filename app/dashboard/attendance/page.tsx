"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { 
  Plus, Network, ShieldCheck, Loader2, Edit, Trash2, 
  Clock, Calendar, RefreshCw, Cpu, Users, UserCheck, 
  Search, Filter, Zap, Layout, CalendarCheck
} from 'lucide-react';
import { useAttendance, useDevices, useBiometricActions, usePunches } from '@/src/hooks/useAttendance';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffAttendance, BiometricPunch } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'punches'>('attendance');

  // Attendance Filters — exact Swagger: date, month, staff (UUID), status, year
  const [staffFilter, setStaffFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  
  // Punches Filters — exact Swagger: biometric_code, date, is_processed, punch_type
  const [punchDate, setPunchDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [punchBioCodeFilter, setPunchBioCodeFilter] = useState('');
  const [punchTypeFilter, setPunchTypeFilter] = useState('');

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  // Hooks
  const { membersResponse } = useStaff({ is_active: true });
  const { devicesData } = useDevices(); 
  
  const { attendanceData, isLoading: isLoadingAtt, createAttendance, isCreating: isCreatingAtt, updateAttendance, isUpdating: isUpdatingAtt } = useAttendance({
    date: dateFilter || undefined,
    staff: staffFilter || undefined,
    status: (statusFilter as any) || undefined,
    month: monthFilter ? parseInt(monthFilter) : undefined,
    year: yearFilter ? parseInt(yearFilter) : undefined,
  });
  
  const { punchesData, isLoading: isLoadingPunches, createPunch, isCreatingPunch } = usePunches({
    date: punchDate || undefined,
    biometric_code: punchBioCodeFilter || undefined,
    punch_type: (punchTypeFilter as any) || undefined,
  });
  
  const { syncDevice, isSyncing } = useBiometricActions();

  // Forms
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [punchForm, setPunchForm] = useState<Partial<BiometricPunch>>({
    device: '', biometric_code: '', punch_time: new Date().toISOString().slice(0, 16), punch_type: 'unknown', source: 'manual', is_processed: false, raw_payload: 'Manual UI injection'
  });
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
    if (!attForm.staff || !attForm.date || !attForm.status) return toast.error('Required fields missing');
    
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
      toast.success('Synchronization complete');
      setIsSyncModalOpen(false);
    }});
  };

  const handleSavePunch = () => {
    if (!punchForm.biometric_code || !punchForm.device || !punchForm.punch_time) return toast.error('Required fields missing');
    
    const payload = { ...punchForm };
    if (payload.punch_time) payload.punch_time = new Date(payload.punch_time).toISOString();
    
    createPunch(payload, { onSuccess: () => setIsPunchModalOpen(false) });
  };

  const attColumns = [
    { 
      key: 'date', 
      header: 'RECORD DATE', 
      render: (v: string) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v}</span>
    },
    { 
      key: 'staff_name', 
      header: 'PERSONNEL', 
      render: (v: string) => <span className="font-extrabold text-[#0f172a] text-sm uppercase tracking-tight">{v || '---'}</span>
    },
    { 
      key: 'status', 
      header: 'STATE', 
      render: (v: string) => (
        <span className={`
          inline-flex items-center px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
          ${v === 'present' ? 'bg-[#d1fae5] text-[#065f46]' : ''}
          ${v === 'absent' ? 'bg-[#fee2e2] text-[#991b1b]' : ''}
          ${v === 'leave' ? 'bg-[#fef3c7] text-[#92400e]' : ''}
          ${v === 'half_day' ? 'bg-[#cffafe] text-[#164e63]' : ''}
        `}>
          {v}
        </span>
      )
    },
    { 
      key: 'check_in', 
      header: 'INBOUND', 
      render: (v: string) => <span className="text-[#0f172a] font-black text-xs">{v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span> 
    },
    { 
      key: 'check_out', 
      header: 'OUTBOUND', 
      render: (v: string) => <span className="text-[#0f172a] font-black text-xs">{v ? new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</span> 
    },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const, 
      render: (_: any, r: StaffAttendance) => (
        <div className="flex items-center justify-end pr-4">
          <button 
            onClick={() => handleOpenAttendanceModal(r)}
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const puncColumns = [
    { 
      key: 'staff_name', 
      header: 'PERSONNEL', 
      render: (_: any, r: BiometricPunch) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 text-sm leading-tight">{r.staff_name || 'Unmatched'}</span>
          <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">CODE: {r.biometric_code}</span>
        </div>
      )
    },
    { 
      key: 'punch_time', 
      header: 'TIMESTAMP', 
      render: (v: string) => (
        <div className="flex flex-col">
          <span className="text-slate-900 font-bold text-xs">{new Date(v).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span className="text-violet-600 font-bold text-xs">{new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
      )
    },
    { key: 'device_name', header: 'HARDWARE NODE', render: (v: string) => <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{v || 'Unknown'}</span> },
    { key: 'is_processed', header: 'STATE', render: (v: boolean) => (
      v ? 
      <Badge variant="success" size="sm" className="text-[9px] font-black uppercase tracking-widest border-none px-3 py-0.5 rounded-full">Processed</Badge> : 
      <Badge variant="warning" size="sm" className="text-[9px] font-black uppercase tracking-widest border-none px-3 py-0.5 rounded-full">Raw Sync</Badge>
    ) }
  ];

  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <CalendarCheck className="text-white w-5 h-5" />
           </div>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">Attendance Hub</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Personnel Activity Registry</p>
           </div>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsSyncModalOpen(true)}
             className="bg-white border border-[#e2e8f0] text-[#0f172a] font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-sm hover:bg-[#f8fafc] transition-all active:scale-95"
           >
             <Network className="w-4 h-4 text-[#7c3aed]" />
             Sync Terminal
           </button>
           <button 
             onClick={() => activeTab === 'punches' ? setIsPunchModalOpen(true) : handleOpenAttendanceModal()}
             className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
           >
             <Plus className="w-4 h-4" />
             {activeTab === 'punches' ? 'Inject Punch' : 'Manual Entry'}
           </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Total Presence</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {Array.isArray(attendanceData) ? attendanceData.length : (attendanceData as any)?.results?.length || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Personnel on-site</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Sync Status</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Healthy</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Terminal nodes active</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Participation</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">94%</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Force availability</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#d97706]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Lag Time</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">~12m</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Avg. entry variance</p>
          </div>
        </div>

        {/* Dual Registry Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-2 flex items-center justify-between">
             <div className="flex bg-[#f1f5f9] p-1 rounded-lg">
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'attendance' ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
                >
                  Ledger Registry
                </button>
                <button 
                  onClick={() => setActiveTab('punches')}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${activeTab === 'punches' ? 'bg-white text-[#7c3aed] shadow-sm' : 'text-[#64748b] hover:text-[#0f172a]'}`}
                >
                  Hardware Logs
                </button>
             </div>
             
             <div className="flex items-center gap-3">
                {activeTab === 'attendance' ? (
                   <div className="flex items-center gap-2 flex-wrap">
                      <Input 
                        type="date" 
                        value={dateFilter} 
                        onChange={(e) => { setDateFilter(e.target.value); setMonthFilter(''); setYearFilter(''); }} 
                        className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-40 text-xs font-medium" 
                        placeholder="Exact Date"
                        fullWidth={false}
                      />
                      <Select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-32 text-xs font-medium"
                        options={[
                          { value: '', label: 'All Status' }, 
                          { value: 'present', label: 'Present' }, 
                          { value: 'absent', label: 'Absent' }, 
                          { value: 'leave', label: 'Leave' },
                          { value: 'half_day', label: 'Half Day' }
                        ]}
                        fullWidth={false}
                      />
                      <Select 
                        value={monthFilter} 
                        onChange={(e) => { setMonthFilter(e.target.value); setDateFilter(''); }}
                        className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-28 text-xs font-medium"
                        options={[
                          { value: '', label: 'Month' }, 
                          { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
                          { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
                          { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
                          { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' }
                        ]}
                        fullWidth={false}
                      />
                      <Input 
                        type="number" 
                        value={yearFilter} 
                        onChange={(e) => { setYearFilter(e.target.value); setDateFilter(''); }}
                        placeholder="Year"
                        className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-24 text-xs font-medium" 
                        fullWidth={false}
                      />
                   </div>
                ) : (
                  <div className="flex items-center gap-2">
                     <Input 
                       type="date" 
                       value={punchDate} 
                       onChange={(e) => setPunchDate(e.target.value)} 
                       className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-40 text-xs font-medium" 
                       fullWidth={false}
                     />
                     <Input 
                       placeholder="Bio Code..." 
                       value={punchBioCodeFilter} 
                       onChange={(e) => setPunchBioCodeFilter(e.target.value)} 
                       className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-32 text-xs font-medium" 
                       fullWidth={false}
                     />
                     <Select 
                       value={punchTypeFilter} 
                       onChange={(e) => setPunchTypeFilter(e.target.value)}
                       className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-28 text-xs font-medium"
                       options={[
                         { value: '', label: 'All Types' },
                         { value: 'in', label: 'Clock In' },
                         { value: 'out', label: 'Clock Out' },
                         { value: 'unknown', label: 'Unknown' }
                       ]}
                       fullWidth={false}
                     />
                  </div>
                )}
             </div>
          </div>

          <div className="min-h-[500px]">
             {activeTab === 'attendance' ? (
                isLoadingAtt ? (
                  <div className="flex flex-col items-center justify-center p-32 gap-3 text-[#94a3b8]">
                    <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Intercepting Presence...</span>
                  </div>
                ) : (
                  <Table columns={attColumns} data={Array.isArray(attendanceData) ? attendanceData : (attendanceData as any)?.results || []} className="border-none" />
                )
             ) : (
                isLoadingPunches ? (
                  <div className="flex flex-col items-center justify-center p-32 gap-3 text-[#94a3b8]">
                    <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Polling Hardware...</span>
                  </div>
                ) : (
                  <Table columns={puncColumns} data={Array.isArray(punchesData) ? punchesData : (punchesData as any)?.results || []} className="border-none" />
                )
             )}
          </div>
        </div>
      </div>

      {/* Sync workbench modal */}
      <Modal theme="light" isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Terminal Sync Workbench" size="md">
        <div className="space-y-6">
          <div className="p-5 bg-violet-600/5 border border-violet-600/10 rounded-2xl space-y-4">
            <h4 className="text-[10px] font-black text-[#7c3aed] uppercase tracking-[0.2em] flex items-center gap-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Active Hardware Nodes
            </h4>
            <div className="space-y-2">
              {(Array.isArray(devicesData) ? devicesData : (devicesData as any)?.results || [])?.filter((d: any) => d.is_active).map((device: any) => (
                <div key={device.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl group hover:border-[#7c3aed]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-[#7c3aed]/5 transition-colors">
                      <Cpu className="w-4 h-4 text-slate-400 group-hover:text-[#7c3aed]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{device.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">{device.ip_address || 'Cloud Node'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleSyncDevice(device.id)}
                    disabled={isSyncing}
                    className="p-2 border border-slate-100 bg-white hover:bg-[#7c3aed] text-slate-700 hover:text-white rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {(!devicesData || (Array.isArray(devicesData) ? devicesData : (devicesData as any)?.results || []).filter((d: any) => d.is_active).length === 0) && (
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
        title={editingAttendanceId ? "Modify Attendance" : "Record Attendance"}
        size="md"
        footer={
          <div className="flex gap-3 mt-4 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsManualModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveAttendance} isLoading={isCreatingAtt || isUpdatingAtt} className="flex-1 sm:flex-none px-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-none shadow-none font-bold">Confirm</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4 max-h-[70vh] overflow-y-auto px-1 custom-scrollbar">
          <div className="grid grid-cols-2 gap-5">
            <Select 
              label="STAFF MEMBER *" 
              value={attForm.staff as string}
              onChange={(e) => setAttForm({...attForm, staff: e.target.value})}
              options={[{ value: '', label: '--- select ---' }, ...((Array.isArray(membersResponse) ? membersResponse : (membersResponse as any)?.results || [])?.map((m: any) => ({ value: m.id, label: m.full_name })) || [])]}
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
               options={[
                  { value: 'present', label: 'Present' }, 
                  { value: 'absent', label: 'Absent' }, 
                  { value: 'leave', label: 'Leave' }, 
                  { value: 'half_day', label: 'Half Day' }
               ]}
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

          <Input 
            label="NOTE"
            value={attForm.note || ''}
            onChange={(e) => setAttForm({...attForm, note: e.target.value})}
            placeholder="Intervention Protocol Context..."
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </Modal>

      {/* Manual Punch Modal */}
      <Modal theme="light"
        isOpen={isPunchModalOpen}
        onClose={() => setIsPunchModalOpen(false)}
        title="Inject Raw Punch"
        size="md"
        footer={
          <div className="flex gap-3 mt-4 w-full sm:w-auto">
            <Button variant="ghost" onClick={() => setIsPunchModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button variant="primary" onClick={handleSavePunch} isLoading={isCreatingPunch} className="flex-1 sm:flex-none px-10 bg-[#7c3aed] hover:bg-[#6d28d9] text-white border-none shadow-none font-bold">Inject</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4 px-1">
           <div className="grid grid-cols-2 gap-5">
             <Select 
               label="HARDWARE DEVICE *" 
               value={punchForm.device as string}
               onChange={(e) => setPunchForm({...punchForm, device: e.target.value})}
               options={[{ value: '', label: '--- select ---' }, ...((Array.isArray(devicesData) ? devicesData : (devicesData as any)?.results || [])?.map((d: any) => ({ value: d.id, label: d.name })) || [])]}
               className="bg-white border-slate-200 h-11 font-medium"
             />
             <Input label="BIOMETRIC CODE *" value={punchForm.biometric_code} onChange={(e) => setPunchForm({...punchForm, biometric_code: e.target.value})} className="bg-white border-slate-200 h-11 font-medium" placeholder="101" />
           </div>
           
           <div className="grid grid-cols-2 gap-5">
             <Input label="PUNCH TIME *" type="datetime-local" value={punchForm.punch_time as string} onChange={(e) => setPunchForm({...punchForm, punch_time: e.target.value})} className="bg-white border-slate-200 h-11 text-xs" />
             <Select 
               label="DIRECTION *" 
               value={punchForm.punch_type}
               onChange={(e) => setPunchForm({...punchForm, punch_type: e.target.value as any})}
               options={[{ value: 'unknown', label: 'Unknown' }, { value: 'in', label: 'Check In' }, { value: 'out', label: 'Check Out' }]}
               className="bg-white border-slate-200 h-11 font-medium"
             />
           </div>
        </div>
      </Modal>
    </div>
  );
}
