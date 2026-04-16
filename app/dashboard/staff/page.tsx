"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Search, Edit, Trash2, UserPlus, Phone, Briefcase, Calendar, Hash, DollarSign, Users, Plus, Loader2 } from 'lucide-react';
import { Card } from '@/src/components/Card';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useStaff, useRoles, useStaffLedgerSummary } from '@/src/hooks/useStaff';
import { StaffMember, StaffRole } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function StaffManagement() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'members' | 'roles'>('members');
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [selectedStaffForLedger, setSelectedStaffForLedger] = useState<StaffMember | null>(null);
  
  // The API uses pagination, so pass state
  const { membersResponse, isLoadingMembers, createMember, isCreatingMember, updateMember, isUpdatingMember, deleteMember } = useStaff({
    page,
    page_size: 20,
    search: searchQuery || undefined,
    employment_status: statusFilter || undefined,
    is_active: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
    role: roleFilter || undefined,
  });

  const { roles, isLoadingRoles, createRole, isCreatingRole, updateRole, isUpdatingRole, deleteRole, isDeletingRole } = useRoles();

  const [formData, setFormData] = useState<Partial<StaffMember>>({
    user: null,
    employee_code: '',
    full_name: '',
    phone: '',
    role: '',
    joining_date: new Date().toISOString().split('T')[0],
    employment_status: 'active',
    salary_type: 'monthly',
    base_salary: '',
    default_late_penalty: '0.00',
    default_meal_deduction: '0.00',
    address: '',
    biometric_code: '',
    is_active: true,
    is_delivery_staff: false,
    is_kitchen_staff: false,
    is_cashier: false,
    is_manager: false,
  });

  const handleOpenModal = (staff?: StaffMember) => {
    if (staff) {
      setEditingStaffId(staff.id);
      setFormData({
        user: staff.user || null,
        employee_code: staff.employee_code,
        full_name: staff.full_name,
        phone: staff.phone || '',
        role: typeof staff.role === 'object' ? staff.role?.id : staff.role,
        joining_date: staff.joining_date,
        employment_status: staff.employment_status,
        salary_type: staff.salary_type,
        base_salary: staff.base_salary,
        default_late_penalty: staff.default_late_penalty || '',
        default_meal_deduction: staff.default_meal_deduction || '',
        address: staff.address || '',
        biometric_code: staff.biometric_code || '',
        is_active: staff.is_active,
        is_delivery_staff: staff.is_delivery_staff || false,
        is_kitchen_staff: staff.is_kitchen_staff || false,
        is_cashier: staff.is_cashier || false,
        is_manager: staff.is_manager || false,
      });
    } else {
      setEditingStaffId(null);
      setFormData({
        user: null,
        employee_code: '',
        full_name: '',
        phone: '',
        role: roles && roles.length > 0 ? roles[0].id : '',
        joining_date: new Date().toISOString().split('T')[0],
        employment_status: 'active',
        salary_type: 'monthly',
        base_salary: '',
        default_late_penalty: '',
        default_meal_deduction: '',
        address: '',
        biometric_code: '',
        is_active: true,
        is_delivery_staff: false,
        is_kitchen_staff: false,
        is_cashier: false,
        is_manager: false,
      });
    }
    setIsAddModalOpen(true);
  };

  const [roleForm, setRoleForm] = useState<Partial<StaffRole>>({
    name: '',
    description: '',
    is_active: true
  });

  const handleOpenRoleModal = (role?: StaffRole) => {
    if (role) {
      setEditingRoleId(role.id);
      setRoleForm({
        name: role.name,
        description: role.description || '',
        is_active: role.is_active,
      });
    } else {
      setEditingRoleId(null);
      setRoleForm({
        name: '',
        description: '',
        is_active: true
      });
    }
    setIsRoleModalOpen(true);
  };

  const handleSaveRole = () => {
    if (!roleForm.name) {
      toast.error('Role name is required');
      return;
    }
    if (editingRoleId) {
      updateRole({ id: editingRoleId, data: roleForm }, { onSuccess: () => setIsRoleModalOpen(false) });
    } else {
      createRole(roleForm, { onSuccess: () => setIsRoleModalOpen(false) });
    }
  };

  const handleSaveStaff = () => {
    if (!formData.employee_code || !formData.full_name || !formData.role || !formData.base_salary) {
      toast.error('Please fill in required fields: Code, Name, Role, Base Salary');
      return;
    }

    const payload: any = { ...formData };
    
    // Clean up empty numeric fields to null as per DRF expectation
    if (payload.default_late_penalty === '') payload.default_late_penalty = null;
    if (payload.default_meal_deduction === '') payload.default_meal_deduction = null;

    // Remove read-only or auto-set fields that trigger backend permission issues
    delete payload.branch;
    delete payload.branch_name;
    delete payload.role_name;
    delete payload.employment_status_display;
    delete payload.salary_type_display;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.user;
    
    // Ensure role is sent as an ID string (UUID)
    if (payload.role && typeof payload.role === 'object') {
      payload.role = payload.role.id;
    }

    if (editingStaffId) {
      updateMember({ id: editingStaffId, data: payload }, {
        onSuccess: () => setIsAddModalOpen(false)
      });
    } else {
      createMember(payload, {
        onSuccess: () => setIsAddModalOpen(false)
      });
    }
  };

  const columns = [
    { 
      key: 'employee', 
      header: 'NAME / CODE',
      render: (_: any, row: StaffMember) => (
        <div className="flex flex-col">
          <p className="font-black text-white group-hover:text-primary transition-colors text-sm">{row.full_name}</p>
          <p className="text-[10px] uppercase font-bold text-tertiary tracking-widest">{row.employee_code}</p>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'ROLE',
      render: (_: any, row: StaffMember) => (
        <span className="text-xs font-bold text-tertiary uppercase tracking-widest">
          {row.role_name || (typeof row.role === 'object' ? row.role?.name : row.role)}
        </span>
      )
    },
    { 
      key: 'phone', 
      header: 'PHONE',
      render: (v: string) => <span className="text-xs font-bold text-tertiary">{v || '—'}</span>
    },
    { 
      key: 'salary', 
      header: 'BASE SALARY',
      render: (_: any, row: StaffMember) => (
        <span className="text-white font-black text-sm">
          {formatCurrency(row.base_salary)}
        </span>
      )
    },
    { 
      key: 'employment_status', 
      header: 'STATUS',
      render: (_: any, row: StaffMember) => (
        <Badge variant={row.employment_status === 'active' ? 'success' : row.employment_status === 'terminated' ? 'error' : 'secondary'} size="sm" className="font-black uppercase tracking-widest text-[9px] bg-success/10 text-success border-success/20">
          {row.employment_status_display || row.employment_status}
        </Badge>
      )
    },
    { 
      key: 'joined', 
      header: 'JOINED',
      render: (v: string) => <span className="text-xs font-bold text-tertiary">{v}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffMember) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="px-4 py-1.5 border border-base bg-white/5 hover:bg-white/10 rounded-lg transition-all text-[11px] font-bold text-tertiary hover:text-white"
            onClick={() => { setSelectedStaffForLedger(row); setIsLedgerModalOpen(true); }}
          >
            Ledger
          </button>
          <button 
            className="px-4 py-1.5 border border-base bg-white/5 hover:bg-white/10 rounded-lg transition-all text-[11px] font-bold text-tertiary hover:text-white"
            onClick={() => handleOpenModal(row)}
          >
            Edit
          </button>
          <button 
            className="p-2 hover:bg-red-500/10 rounded-lg transition-all text-tertiary hover:text-red-500"
            onClick={() => { if(window.confirm(`Delete ${row.full_name}?`)) deleteMember(row.id) }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Ledger Summary Internal Component
  const LedgerSummary = ({ id, name }: { id: string, name: string }) => {
    const { data: summary, isLoading } = useStaffLedgerSummary(id);

    if (isLoading) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const debits = summary?.totals?.total_debits || 0;
    const credits = summary?.totals?.total_credits || 0;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-success/10 border border-success/20 p-5 rounded-2xl shadow-inner group transition-all hover:bg-success/20">
             <p className="text-[10px] text-success font-black uppercase tracking-widest mb-1.5 opacity-70">Total Credits</p>
             <p className="text-2xl font-black text-white drop-shadow-sm">{formatCurrency(credits)}</p> 
          </div>
          <div className="bg-error/10 border border-error/20 p-5 rounded-2xl shadow-inner group transition-all hover:bg-error/20">
             <p className="text-[10px] text-error font-black uppercase tracking-widest mb-1.5 opacity-70">Total Debits</p>
             <p className="text-2xl font-black text-white drop-shadow-sm">{formatCurrency(debits)}</p>
          </div>
        </div>
        
        {summary?.entries && summary.entries.length > 0 && (
          <div className="mt-6 space-y-3">
             <p className="text-[10px] text-tertiary font-black uppercase tracking-widest px-1">Recent Transactions</p>
             <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {summary.entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white uppercase">{entry.entry_type_display || entry.entry_type}</span>
                      <span className="text-[9px] text-tertiary font-medium">{entry.entry_date}</span>
                    </div>
                    <span className={`text-xs font-black ${entry.direction === 'credit' ? 'text-success' : 'text-error'}`}>
                      {entry.direction === 'credit' ? '+' : '-'}{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        )}

        <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest text-center mt-6 py-3 border-t border-white/5">Full transaction history is available in the Ledger Management module.</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Staff Directory</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage staff members and roles</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => activeTab === 'members' ? handleOpenModal() : handleOpenRoleModal()}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'members' ? 'Add Member' : 'Add Role'}
        </Button>
      </div>

      <div className="flex gap-2 p-1.5 bg-secondary w-full md:w-max rounded-2xl border border-base shadow-xl">
        <button onClick={() => { setActiveTab('members'); setPage(1); }} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'members' ? 'bg-primary text-white shadow-glow-primary' : 'text-tertiary hover:text-white hover:bg-white/5'}`}><Users className="w-4 h-4"/> Staff Directory</button>
        <button onClick={() => { setActiveTab('roles'); setPage(1); }} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'roles' ? 'bg-primary text-white shadow-glow-primary' : 'text-tertiary hover:text-white hover:bg-white/5'}`}><Briefcase className="w-4 h-4"/> Role Configurations</button>
      </div>
      
      {activeTab === 'members' && (
      <>
      
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[250px] flex items-center gap-4">
             <span className="text-sm font-black text-white uppercase tracking-widest whitespace-nowrap">All Staff</span>
             <Input
                placeholder="Search name / code"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="bg-bg-main border-base"
             />
          </div>
          <div className="w-full md:w-auto flex gap-4">
            <Select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-bg-main border-base min-w-[150px]"
              options={[
                { value: '', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]}
            />
            <Select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-bg-main border-base min-w-[150px]"
              options={[
                { value: '', label: 'All Roles' },
                ...(roles?.map(r => ({ value: r.id, label: r.name })) || [])
              ]}
            />
          </div>
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoadingMembers ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : membersResponse?.results?.length === 0 ? (
          <div className="p-10 text-center text-tertiary font-bold uppercase tracking-widest text-sm">No staff members found matching your search.</div>
        ) : (
          <Table 
            columns={columns} 
            data={membersResponse?.results || []} 
            className="text-sm"
          />
        )}
      </Card>
      
      {!isLoadingMembers && membersResponse && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-tertiary uppercase font-bold tracking-widest">
            Showing <span className="text-white">{membersResponse.results?.length || 0}</span> of <span className="text-white">{membersResponse.count || 0}</span> records
          </p>
          <div className="flex gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!membersResponse.previous}
              onClick={() => setPage(p => p - 1)}
              className="border-base hover:border-primary/50"
            >
              Previous
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!membersResponse.next}
              onClick={() => setPage(p => p + 1)}
              className="border-base hover:border-primary/50"
            >
              Next
            </Button>
          </div>
        </div>
      )}
      </>
      )}

      {activeTab === 'roles' && (
        <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
          {isLoadingRoles ? (
            <div className="flex items-center justify-center p-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : roles?.length === 0 ? (
            <div className="p-10 text-center text-tertiary font-bold uppercase tracking-widest text-sm">No specific roles defined yet.</div>
          ) : (
            <Table 
              columns={[
                { key: 'name', header: 'Role Title', render: (v: string) => <span className="font-black text-white uppercase tracking-widest text-sm drop-shadow-sm">{v}</span> },
                { key: 'description', header: 'Description', render: (v: string) => <span className="text-xs text-tertiary tracking-wide font-medium">{v || '—'}</span> },
                { key: 'status', header: 'Status', render: (_: any, r: StaffRole) => (
                  <Badge variant={r.is_active ? 'success' : 'error'} size="sm" className="font-black uppercase tracking-widest text-[9px]">
                    {r.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                )},
                { key: 'actions', header: '', align: 'right' as const, render: (_: any, r: StaffRole) => (
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => handleOpenRoleModal(r)} className="p-2.5 bg-white/5 hover:bg-primary/10 text-tertiary hover:text-primary rounded-xl transition-all border border-white/5 hover:border-primary/20"><Edit className="w-4 h-4"/></button>
                    <button onClick={() => { if(window.confirm('Delete this role? This will fail if in use.')) deleteRole(r.id) }} className="p-2.5 bg-white/5 hover:bg-error/10 text-tertiary hover:text-error rounded-xl transition-all border border-white/5 hover:border-error/20"><Trash2 className="w-4 h-4"/></button>
                  </div>
                )}
              ]} 
              data={roles || []} 
              className="text-sm"
            />
          )}
        </Card>
      )}
      
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}
        size="lg"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button 
              variant="ghost" 
              onClick={() => setIsAddModalOpen(false)} 
              disabled={isCreatingMember || isUpdatingMember}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveStaff} 
              isLoading={isCreatingMember || isUpdatingMember}
              className="flex-1 sm:flex-none px-10 shadow-glow-primary"
            >
              {editingStaffId ? "Save Changes" : "Confirm Enlistment"}
            </Button>
          </div>
        }
      >
        <div className="space-y-6 py-2 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
          {/* Section: Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input 
              label="FULL NAME *" 
              placeholder="John Doe" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="EMPLOYEE CODE *" 
              placeholder="EMP001" 
              value={formData.employee_code}
              onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Select 
              label="ROLE *" 
              value={formData.role as string}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              options={[
                { value: '', label: '--- select ---' },
                ...(roles?.map(r => ({ value: r.id, label: r.name })) || [])
              ]} 
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="PHONE" 
              placeholder="+966 5x xxx xxxx" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input 
              label="JOINING DATE *" 
              type="date"
              value={formData.joining_date}
              onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
             <Select 
              label="EMPLOYMENT STATUS" 
              value={formData.employment_status}
              onChange={(e) => setFormData({...formData, employment_status: e.target.value as any, is_active: e.target.value === 'active'})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]} 
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
             <Select 
              label="SALARY TYPE" 
              value={formData.salary_type}
              onChange={(e) => setFormData({...formData, salary_type: e.target.value as any})}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'daily', label: 'Daily' },
              ]} 
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="BASE SALARY *" 
              placeholder="5000.00"
              value={formData.base_salary as string}
              onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input 
              label="DEFAULT LATE PENALTY" 
              placeholder="0"
              value={formData.default_late_penalty as string}
              onChange={(e) => setFormData({...formData, default_late_penalty: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="DEFAULT MEAL DEDUCTION" 
              placeholder="0"
              value={formData.default_meal_deduction as string}
              onChange={(e) => setFormData({...formData, default_meal_deduction: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input 
              label="BIOMETRIC CODE" 
              placeholder="101"
              value={formData.biometric_code}
              onChange={(e) => setFormData({...formData, biometric_code: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
            <Input 
              label="ADDRESS" 
              placeholder="Riyadh, Saudi Arabia" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="bg-white border-slate-200 text-slate-900"
            />
          </div>

          {/* Section: Flags */}
          <div className="pt-2">
            <div className="grid grid-cols-2 gap-y-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.is_delivery_staff} 
                  onChange={(e) => setFormData({...formData, is_delivery_staff: e.target.checked})} 
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" 
                />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Delivery Staff</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_kitchen_staff} onChange={(e) => setFormData({...formData, is_kitchen_staff: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Kitchen Staff</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_cashier} onChange={(e) => setFormData({...formData, is_cashier: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Cashier</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_manager} onChange={(e) => setFormData({...formData, is_manager: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Manager</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Role Management Modal */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRoleId ? "Edit Role configuration" : "Create New Role"}
        size="sm"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setIsRoleModalOpen(false)} disabled={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none">Cancel</Button>
            <Button variant="primary" onClick={handleSaveRole} isLoading={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none px-10 shadow-glow-primary">{editingRoleId ? "Save Changes" : "Confirm Creation"}</Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <Input 
            label="ROLE TITLE *" 
            placeholder="e.g. Master Chef" 
            value={roleForm.name}
            onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
            className="bg-bg-main border-base"
          />
          <Input 
            label="DESCRIPTION" 
            placeholder="Responsibilities and access level..." 
            value={roleForm.description}
            onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
            className="bg-bg-main border-base"
          />
          <div className="p-4 bg-bg-main rounded-2xl border border-base">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={roleForm.is_active} onChange={(e) => setRoleForm({...roleForm, is_active: e.target.checked})} className="w-5 h-5 rounded-lg bg-secondary border-base text-primary focus:ring-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-black text-white group-hover:text-primary transition-colors uppercase tracking-widest">Active Status</span>
                <span className="text-[10px] text-tertiary uppercase tracking-widest">Can staff be assigned to this role?</span>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Ledger Summary Modal */}
      <Modal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        title={`Financial Summary: ${selectedStaffForLedger?.full_name}`}
        size="md"
      >
        <div className="py-4">
          {selectedStaffForLedger && <LedgerSummary id={selectedStaffForLedger.id} name={selectedStaffForLedger.full_name} />}
          <div className="mt-8">
            <Button 
               variant="secondary" 
               className="w-full uppercase font-black tracking-widest text-xs h-12 border-base hover:bg-white/5"
               onClick={() => router.push(`/dashboard/ledger?staff=${selectedStaffForLedger?.id}`)}
            >
              Go to Full Ledger History
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
