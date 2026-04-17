"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { 
  Search, Edit, Trash2, UserPlus, Phone, Briefcase, 
  Calendar, Hash, DollarSign, Users, Plus, Loader2, 
  ChevronRight, Filter, ShieldCheck, UserCheck, UserMinus, Monitor
} from 'lucide-react';
import { Card } from '@/src/components/Card';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useStaff, useRoles, useStaffLedgerSummary } from '@/src/hooks/useStaff';
import { StaffMember, StaffRole } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';

export default function StaffManagement() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
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
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMember(payload, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };



  const columns = [
    { 
      key: 'name', 
      header: 'NAME / CODE', 
      render: (_: any, r: StaffMember) => (
        <div className="flex flex-col">
          <span className="font-extrabold text-[#0f172a] text-sm leading-tight uppercase tracking-tight">{r.full_name}</span>
          <span className="text-[10px] text-[#94a3b8] font-black uppercase tracking-widest">{r.employee_code}</span>
        </div>
      )
    },
    { key: 'role_name', header: 'ROLE', render: (v: string) => <span className="text-[#64748b] text-[11px] font-extrabold uppercase tracking-widest">{v || '---'}</span> },
    { key: 'phone', header: 'PHONE', render: (v: string) => <span className="text-[#0f172a] text-[11px] font-black tracking-tight">{v || '—'}</span> },
    { key: 'base_salary', header: 'SALARY', align: 'right' as const, render: (v: string) => <span className="text-[#0f172a] font-black text-xs">Rs. {parseFloat(v).toLocaleString()}</span> },
    { 
      key: 'employment_status', 
      header: 'STATUS', 
      render: (v: string) => (
        <span className={`
          inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest
          ${v === 'active' ? 'bg-[#d1fae5] text-[#065f46]' : ''}
          ${v === 'inactive' ? 'bg-[#fef3c7] text-[#92400e]' : ''}
          ${v === 'terminated' ? 'bg-[#fee2e2] text-[#991b1b]' : ''}
        `}>
          {v}
        </span>
      )
    },
    { key: 'joining_date', header: 'JOINED', render: (v: string) => <span className="text-[#94a3b8] text-[10px] font-bold uppercase tracking-widest leading-none">{v}</span> },
    { 
      key: 'actions', 
      header: '', 
      align: 'right' as const, 
      render: (_: any, r: StaffMember) => (
        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all pr-4">
          <button 
            onClick={() => handleOpenModal(r)} 
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-[#f8fafc] text-[#64748b] rounded-lg transition-all shadow-sm active:scale-95"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => { if(window.confirm(`Expunge ${r.full_name}?`)) deleteMember(r.id) }} 
            className="p-2 border border-[#e2e8f0] bg-white hover:bg-red-50 text-[#94a3b8] hover:text-red-600 rounded-lg transition-all shadow-sm active:scale-95"
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
              <Users className="text-white w-5 h-5" />
           </div>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">Personnel Hub</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Global Force Management</p>
           </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#2563eb]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Total Units</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {Array.isArray(membersResponse) ? membersResponse.length : (membersResponse as any)?.count || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Enlisted personnel</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#059669]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Active Force</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              {(Array.isArray(membersResponse) ? membersResponse : (membersResponse as any)?.results || [])?.filter((m: any) => m.is_active).length || 0}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Operational now</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#7c3aed]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Cycle Payroll</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">
              Rs. {(Array.isArray(membersResponse) ? membersResponse : (membersResponse as any)?.results || [])?.reduce((acc: number, m: any) => acc + parseFloat(m.base_salary || 0), 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Monthly allocation</p>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-[10px] p-5 shadow-sm border-l-[3px] border-l-[#d97706]">
            <p className="text-[10px] font-extrabold text-[#94a3b8] uppercase tracking-[0.08em] mb-2">Avg. Yield</p>
            <p className="text-2xl font-extrabold text-[#0f172a] tracking-tighter">Rs. 42,500</p>
            <p className="text-[11px] text-[#94a3b8] mt-1">Per personnel yield</p>
          </div>
        </div>

        {/* Data Grid Panel */}
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden min-h-[500px]">
          <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
             <div className="flex flex-wrap items-center gap-3">
                <Input 
                  placeholder="ID / Name Search..." 
                  icon={<Search />} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-64 text-xs font-medium"
                  fullWidth={false}
                />
                <Select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-40 text-xs font-medium"
                  options={[
                    { value: '', label: 'All Roles' },
                    ...(roles?.map(r => ({ value: r.id, label: r.name })) || [])
                  ]}
                  fullWidth={false}
                />
                <Select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-[#e2e8f0] rounded-lg h-9 w-40 text-xs font-medium"
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'terminated', label: 'Terminated' }
                  ]}
                  fullWidth={false}
                />
             </div>
             <p className="text-[11px] text-[#94a3b8] font-bold uppercase tracking-widest">
               Captured Units: {Array.isArray(membersResponse) ? membersResponse.length : (membersResponse as any)?.count || 0}
             </p>
          </div>

          <div>
            {isLoadingMembers ? (
              <div className="flex flex-col items-center justify-center p-40 gap-3 text-[#94a3b8]">
                <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Intercepting Telemetry...</span>
              </div>
            ) : (Array.isArray(membersResponse) ? membersResponse : (membersResponse as any)?.results || [])?.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-40 gap-4 text-[#94a3b8]">
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No personnel found</p>
               </div>
            ) : (
              <Table columns={columns} data={(Array.isArray(membersResponse) ? membersResponse : (membersResponse as any)?.results || [])} className="border-none" />
            )}
          </div>
        </div>
      </div>
      
      <Modal theme="light"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaffId ? "Edit Settings" : "Recruit Personnel"}
        size="lg"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button variant="primary" onClick={handleSaveStaff} isLoading={isCreatingMember || isUpdatingMember} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold">Enlist</Button>
          </div>
        }
      >
        <div className="space-y-6">
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
              onChange={(e) => setFormData({...formData, employment_status: e.target.value as any})}
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
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Delivery Staff</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_kitchen_staff} onChange={(e) => setFormData({...formData, is_kitchen_staff: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Kitchen Staff</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_cashier} onChange={(e) => setFormData({...formData, is_cashier: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Cashier</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_manager} onChange={(e) => setFormData({...formData, is_manager: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest group-hover:text-primary transition-colors">Manager</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500" />
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest transition-colors">System Access (Active)</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Role Management Modal */}
      <Modal theme="light"
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={editingRoleId ? "Edit Role" : "Add Role"}
        size="sm"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)} disabled={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none h-11 border-slate-200 text-slate-700 font-semibold px-8">Cancel</Button>
            <Button variant="primary" onClick={handleSaveRole} isLoading={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold h-11">Save</Button>
          </div>
        }
      >
        <div className="space-y-6 pt-4">
          <Input 
            label="ROLE NAME *" 
            placeholder="e.g. Chef, Waiter" 
            value={roleForm.name}
            onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
            className="bg-white border-slate-200"
          />
          <Input 
            label="DESCRIPTION" 
            placeholder="Optional description" 
            value={roleForm.description}
            onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
            className="bg-white border-slate-200"
          />
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={roleForm.is_active} onChange={(e) => setRoleForm({...roleForm, is_active: e.target.checked})} className="w-5 h-5 rounded bg-white border-slate-300 text-violet-600 focus:ring-violet-600" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-900 transition-colors">Active Status</span>
                <span className="text-xs text-slate-500">Can staff be assigned to this role?</span>
              </div>
            </label>
          </div>
        </div>
      </Modal>

      {/* Ledger Summary Modal */}
      <Modal theme="light"
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
               className="w-full text-sm font-semibold h-10 border-slate-200 text-slate-700 bg-white hover:bg-slate-50 border rounded-lg"
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

function LedgerSummary({ id, name }: { id: string, name: string }) {
  const { data: summary, isLoading } = useStaffLedgerSummary(id);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <Loader2 className="animate-spin w-6 h-6 text-[#7c3aed]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Loading Summary...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Credits</p>
          <p className="text-lg font-black text-emerald-600">Rs. {parseFloat(summary?.totals?.total_credits as any || 0).toLocaleString()}</p>
        </div>
        <div className="bg-[#f8fafc] border border-slate-100 p-4 rounded-xl">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Debits</p>
          <p className="text-lg font-black text-red-600">Rs. {parseFloat(summary?.totals?.total_debits as any || 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] px-1">Recent Activity</h4>
        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
          {summary?.entries?.slice(0, 5).map(entry => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-900 uppercase">{entry.entry_type_display || entry.entry_type}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">{entry.entry_date}</span>
              </div>
              <span className={`text-xs font-black ${entry.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                {entry.direction === 'credit' ? '+' : '-'}Rs. {parseFloat(entry.amount as any).toLocaleString()}
              </span>
            </div>
          ))}
          {(!summary?.entries || summary.entries.length === 0) && (
            <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-8">No transaction history detected</p>
          )}
        </div>
      </div>
    </div>
  );
}
