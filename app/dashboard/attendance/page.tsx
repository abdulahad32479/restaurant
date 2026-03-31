"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Calendar, Fingerprint, Plus, Server, Network, ShieldCheck, Loader2, ListOrdered, Smartphone } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useAttendance, useDevices, useBiometricActions, usePunches } from '@/src/hooks/useAttendance';
import { useStaff } from '@/src/hooks/useStaff';
import { StaffAttendance, AttendanceDevice, BiometricPunch } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'punches' | 'devices'>('attendance');

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
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingAttendanceId, setEditingAttendanceId] = useState<string | null>(null);

  // Hooks
  const { membersResponse } = useStaff({ is_active: true });
  const { devicesData, createDevice, isCreatingDevice, updateDevice, isUpdatingDevice } = useDevices({ page: 1, page_size: 100 }); // Getting all devices for select lists
  const { attendanceData, isLoading: isLoadingAtt, createAttendance, isCreating: isCreatingAtt, updateAttendance, isUpdating: isUpdatingAtt } = useAttendance({
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
  const [deviceForm, setDeviceForm] = useState<Partial<AttendanceDevice>>({
    name: '', device_type: 'biometric', ip_address: '192.168.1.201', port: 4370, machine_identifier: '', api_url: '', is_active: true
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
  const handleSyncDevice = () => {
    if (!selectedSyncDevice) return toast.error('Select a device');
    syncDevice(selectedSyncDevice);
  };
  const handleProcessAttendance = () => {
    if (!processDate) return toast.error('Select a process date');
    processAttendance(processDate);
  };

  const attColumns = [
    { key: 'staff', header: 'Staff Member', render: (_: any, r: StaffAttendance) => <span className="font-bold text-white">{membersResponse?.results.find(m => m.id === r.staff)?.full_name || r.staff}</span> },
    { key: 'date', header: 'Date', render: (v: string) => <span className="text-tertiary">{v}</span> },
    { key: 'time', header: 'Check In/Out', render: (_: any, r: StaffAttendance) => (
      <div className="text-xs">
        <p className="text-white"><span className="text-tertiary">IN:</span> {r.check_in ? new Date(r.check_in).toLocaleTimeString() : '--:--'}</p>
        <p className="text-white"><span className="text-tertiary">OUT:</span> {r.check_out ? new Date(r.check_out).toLocaleTimeString() : '--:--'}</p>
      </div>
    )},
    { key: 'status', header: 'Status', render: (v: string) => {
      const colors: Record<string, string> = { present: 'success', absent: 'error', leave: 'warning', half_day: 'secondary' };
      return <Badge variant={colors[v] as any || 'secondary'} size="sm" className="uppercase text-[9px]">{v.replace('_', ' ')}</Badge>;
    }},
    { key: 'source', header: 'Source', render: (v: string) => <Badge variant="secondary" className="bg-white/5 uppercase text-[9px] border-base text-tertiary">{v}</Badge> },
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: StaffAttendance) => <Button variant="secondary" size="sm" onClick={() => handleOpenAttendanceModal(r)} className="text-[10px] uppercase tracking-widest">Edit</Button>}
  ];

  const punchColumns = [
    { key: 'staff', header: 'Staff Member', render: (_: any, r: BiometricPunch) => <span className="font-bold text-white uppercase">{r.staff_name || r.staff || 'Unmatched'}</span> },
    { key: 'code', header: 'Bio Code', render: (_: any, r: BiometricPunch) => <Badge variant="secondary"><Fingerprint className="w-3 h-3 mr-1"/>{r.biometric_code}</Badge> },
    { key: 'time', header: 'Punch Time', render: (_: any, r: BiometricPunch) => <span className="text-white">{new Date(r.punch_time).toLocaleString()}</span> },
    { key: 'device', header: 'Hardware', render: (_: any, r: BiometricPunch) => <span className="text-xs text-tertiary">{r.device_name || r.device}</span> },
    { key: 'processed', header: 'Processed', render: (_: any, r: BiometricPunch) => (r.is_processed ? <Badge variant="success" size="sm" className="text-[10px] uppercase tracking-widest">Yes</Badge> : <Badge variant="warning" size="sm" className="text-[10px] uppercase tracking-widest text-[#B5A162]">No</Badge>) }
  ];

  const deviceColumns = [
    { key: 'name', header: 'Device Name', render: (v: string) => <span className="font-bold text-white uppercase">{v}</span> },
    { key: 'type', header: 'Type', render: (v: string) => <Badge variant="secondary" className="uppercase text-[10px]">{v}</Badge> },
    { key: 'network', header: 'Connection', render: (_: any, r: AttendanceDevice) => <span className="text-tertiary font-mono bg-white/5 px-2 py-1 rounded-lg text-xs tracking-widest flex items-center gap-2 w-max"><Network className="w-3 h-3"/>{r.ip_address}:{r.port}</span> },
    { key: 'active', header: 'Status', render: (_: any, r: AttendanceDevice) => (r.is_active ? <Badge variant="success" size="sm" className="uppercase">Active</Badge> : <Badge variant="error" size="sm" className="uppercase">Offline</Badge>) },
    { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: AttendanceDevice) => <Button variant="secondary" size="sm" onClick={() => handleOpenDeviceModal(r)} className="text-[10px] uppercase tracking-widest">Edit IP</Button>}
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Bio & Attendance Control</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage physical access, sync raw logs, and verify daily metrics</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-secondary w-full md:w-max rounded-xl border border-base">
        <button onClick={() => { setActiveTab('attendance'); setPage(1); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-primary text-white shadow-lg' : 'text-tertiary hover:text-white'}`}><Calendar className="w-4 h-4"/> Daily Logs</button>
        <button onClick={() => { setActiveTab('punches'); setPage(1); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'punches' ? 'bg-primary text-white shadow-lg' : 'text-tertiary hover:text-white'}`}><ListOrdered className="w-4 h-4"/> Raw Punches Audit</button>
        <button onClick={() => { setActiveTab('devices'); setPage(1); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'devices' ? 'bg-primary text-white shadow-lg' : 'text-tertiary hover:text-white'}`}><Server className="w-4 h-4"/> Hardware</button>
      </div>

      {activeTab === 'attendance' && (
        <>
          <div className="flex justify-between items-center bg-base/30 p-4 border border-white/5 rounded-2xl">
             <div className="flex items-center gap-4">
                <Button variant="secondary" size="sm" onClick={() => setIsSyncModalOpen(true)} className="uppercase tracking-widest border border-white/5 text-xs"><Fingerprint className="w-4 h-4 mr-2 text-accent"/> Process Punches</Button>
             </div>
             <Button variant="primary" size="sm" onClick={() => handleOpenAttendanceModal()} className="uppercase tracking-widest"><Plus className="w-4 h-4 mr-2"/> Add Manual Entry</Button>
          </div>
          
          <div className="bg-secondary border border-base rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select label="Staff" value={staffFilter} onChange={(e) => { setStaffFilter(e.target.value); setPage(1); }} options={[{ value: '', label: 'All Staff' }, ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])]} />
            <Input type="date" label="Start Date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <Input type="date" label="End Date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={[{ value: '', label: 'All Statuses' }, { value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'leave', label: 'Leave' }, { value: 'half_day', label: 'Half Day' }]} />
            <Select
            label="Source"
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            options={[{ value: '', label: 'All Sources' }, { value: 'manual', label: 'Manual' }, { value: 'biometric', label: 'Biometric' }]} />
          </div>

          <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
            {isLoadingAtt ? <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : (
               <Table columns={attColumns} data={attendanceData?.results || []} />
            )}
          </Card>
          {!isLoadingAtt && attendanceData && (
            <div className="flex justify-between items-center text-sm text-tertiary">
              <p>Showing <span className="text-white font-bold">{attendanceData.results.length}</span> of <span className="text-white font-bold">{attendanceData.count}</span> records</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!attendanceData.previous} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={!attendanceData.next} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'punches' && (
        <>
          <div className="flex justify-between items-center bg-base/30 p-4 border border-white/5 rounded-2xl">
              <div>
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest">Network K70 Synchronization</h2>
                 <p className="text-xs text-tertiary">Pull raw logs directly from the hardware into the database</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsSyncModalOpen(true)} className="uppercase tracking-widest"><Network className="w-4 h-4 flex-shrink-0 mr-2"/> Sync with Device</Button>
          </div>
          <div className="bg-secondary border border-base rounded-2xl p-5 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
             <Input type="date" label="Punch Date" value={punchDate} onChange={(e) => { setPunchDate(e.target.value); setPage(1); }} />
             <Input label="Biometric ID" placeholder="e.g. 12" value={punchBioCodeFilter} onChange={(e) => { setPunchBioCodeFilter(e.target.value); setPage(1); }} />
             <Select label="Filter Staff" value={punchStaffFilter} onChange={(e) => { setPunchStaffFilter(e.target.value); setPage(1); }} options={[{ value: '', label: 'All Staff' }, ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])]} />
             <Select label="Status" value={punchProcessedFilter} onChange={(e) => { setPunchProcessedFilter(e.target.value); setPage(1); }} options={[{ value: '', label: 'All Statuses' }, { value: 'true', label: 'Processed' }, { value: 'false', label: 'Unprocessed' }]} />
          </div>
          <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
             {isLoadingPunches ? <div className="flex items-center justify-center p-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div> : (
                <Table columns={punchColumns} data={punchesData?.results || []} />
             )}
          </Card>
           {!isLoadingPunches && punchesData && (
            <div className="flex justify-between items-center text-sm text-tertiary">
              <p>Showing <span className="text-white font-bold">{punchesData.results.length}</span> of <span className="text-white font-bold">{punchesData.count}</span> logs</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={!punchesData.previous} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="secondary" size="sm" disabled={!punchesData.next} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'devices' && (
        <>
          <div className="flex justify-between items-center bg-base/30 p-4 border border-white/5 rounded-2xl">
              <div>
                 <h2 className="text-sm font-bold text-white uppercase tracking-widest">LAN Terminals & Machines</h2>
                 <p className="text-xs text-tertiary">Define ZKTeco IP rules and ports for internal syncing</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => handleOpenDeviceModal()} className="uppercase tracking-widest"><Smartphone className="w-4 h-4 flex-shrink-0 mr-2"/> Add Hardware</Button>
          </div>
          <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
             <Table columns={deviceColumns} data={devicesData?.results || []} />
          </Card>
        </>
      )}

      {/* Manual Attendance Modal */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title={editingAttendanceId ? "Edit Attendance Record" : "Record Manual Attendance"} size="md" footer={<><Button variant="secondary" onClick={() => setIsManualModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleSaveAttendance} isLoading={isCreatingAtt || isUpdatingAtt}>{editingAttendanceId ? "Save Changes" : "Save Entry"}</Button></>}>
        <div className="space-y-4">
          <Select label="Staff Member" value={attForm.staff as string} onChange={(e) => setAttForm({...attForm, staff: e.target.value})} options={[{ value: '', label: 'Select Staff' }, ...(membersResponse?.results.map(m => ({ value: m.id, label: m.full_name })) || [])]} disabled={!!editingAttendanceId} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={attForm.date} onChange={(e) => setAttForm({...attForm, date: e.target.value})} />
            <Select label="Status" value={attForm.status} onChange={(e) => setAttForm({...attForm, status: e.target.value as any})} options={[{ value: 'present', label: 'Present' }, { value: 'absent', label: 'Absent' }, { value: 'leave', label: 'Leave' }, { value: 'half_day', label: 'Half Day' }]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Check In (Optional)" type="datetime-local" value={attForm.check_in || ''} onChange={(e) => setAttForm({...attForm, check_in: e.target.value})} />
            <Input label="Check Out (Optional)" type="datetime-local" value={attForm.check_out || ''} onChange={(e) => setAttForm({...attForm, check_out: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <Input label="Late Min (Optional)" type="number" value={attForm.late_minutes?.toString() || ''} onChange={(e) => setAttForm({...attForm, late_minutes: parseInt(e.target.value) || 0})} />
             <Input label="Early Leave Min (Optional)" type="number" value={attForm.early_leave_minutes?.toString() || ''} onChange={(e) => setAttForm({...attForm, early_leave_minutes: parseInt(e.target.value) || 0})} />
          </div>
          <Input label="Notes" value={attForm.note || ''} onChange={(e) => setAttForm({...attForm, note: e.target.value})} placeholder="Reason for manual entry..." />
        </div>
      </Modal>

      {/* Device Config Modal */}
      <Modal isOpen={isDeviceModalOpen} onClose={() => setIsDeviceModalOpen(false)} title={editingDeviceId ? "Edit Network Hardware" : "Register Hardware Terminal"} size="sm" footer={<><Button variant="secondary" onClick={() => setIsDeviceModalOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateDevice} isLoading={isCreatingDevice || isUpdatingDevice}>{editingDeviceId ? "Save Changes" : "Confirm Hardware"}</Button></>}>
        <div className="space-y-4">
          <Input label="Hardware Name" placeholder="e.g. Front Door ZKTeco" value={deviceForm.name} onChange={(e) => setDeviceForm({...deviceForm, name: e.target.value})} />
          <Select label="Protocol / Type" value={deviceForm.device_type} onChange={(e) => setDeviceForm({...deviceForm, device_type: e.target.value as any})} options={[{ value: 'biometric', label: 'Biometric Network (ZKTeco)' }, { value: 'manual', label: 'Manual/Cloud App' }]} />
          <div className="grid grid-cols-2 gap-4">
             <Input label="IP Address" placeholder="192.168.1.1" value={deviceForm.ip_address || ''} onChange={(e) => setDeviceForm({...deviceForm, ip_address: e.target.value})} />
             <Input label="Port" type="number" placeholder="4370" value={deviceForm.port?.toString() || ''} onChange={(e) => setDeviceForm({...deviceForm, port: parseInt(e.target.value)})} />
          </div>
          <Input label="Hardware Identifier (Optional)" placeholder="K70_MAIN" value={deviceForm.machine_identifier || ''} onChange={(e) => setDeviceForm({...deviceForm, machine_identifier: e.target.value})} />
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" checked={deviceForm.is_active} onChange={(e) => setDeviceForm({...deviceForm, is_active: e.target.checked})} className="w-5 h-5 rounded bg-white/5 border-base text-primary focus:ring-primary" />
            <span className="text-sm font-bold text-white">Active Node</span>
          </label>
        </div>
      </Modal>

      {/* Sync Action Modal */}
      <Modal isOpen={isSyncModalOpen} onClose={() => setIsSyncModalOpen(false)} title="Data Processing Workbench" size="md">
        <div className="space-y-6">
          <div className="bg-base/30 p-4 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Network className="w-4 h-4 text-primary"/> 1. Sync Hardware Logs</h3>
            <p className="text-xs text-tertiary">Select a device from your network to pull physical check-ins. Backend must be physically adjacent to the LAN.</p>
            <Select label="Biometric Target" value={selectedSyncDevice} onChange={(e) => setSelectedSyncDevice(e.target.value)} options={[{ value: '', label: 'Select Machine' }, ...(devicesData?.results.map(d => ({ value: d.id, label: d.name })) || [])]} />
            <Button variant="secondary" className="w-full uppercase font-bold text-[10px] tracking-widest" isLoading={isSyncing} onClick={handleSyncDevice}>Launch Sync Request</Button>
          </div>
          <div className="bg-base/30 p-4 rounded-xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-accent uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> 2. Consolidate Attendance Metrics</h3>
            <p className="text-xs text-tertiary">Take raw log files mapped across staff profiles and automatically calculate first-in, last-out parameters creating formal attendance.</p>
            <Input type="date" label="Calculation Date" value={processDate} onChange={(e) => setProcessDate(e.target.value)} />
            <Button variant="primary" className="w-full uppercase font-black tracking-tighter" isLoading={isProcessing} onClick={handleProcessAttendance}>Verify & Publish Records</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
