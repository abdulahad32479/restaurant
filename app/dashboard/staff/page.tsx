"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Search, Edit, Trash2, UserPlus, Phone, Briefcase, Calendar, Hash, DollarSign } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useStaff, useRoles } from '@/src/hooks/useStaff';
import { StaffMember } from '@/src/types/staff';
import { formatCurrency } from '@/src/utils/formatCurrency';
import toast from 'react-hot-toast';

export default function StaffManagement() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  
  // The API uses pagination, so pass state
  const { membersResponse, isLoadingMembers, createMember, isCreatingMember, updateMember, isUpdatingMember } = useStaff({
    page,
    page_size: 20,
    search: searchQuery || undefined,
    employment_status: statusFilter || undefined,
    is_active: isActiveFilter === 'true' ? true : isActiveFilter === 'false' ? false : undefined,
    role: roleFilter || undefined,
  });

  const { roles } = useRoles();

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

  const handleSaveStaff = () => {
    if (!formData.employee_code || !formData.full_name || !formData.role || !formData.base_salary) {
      toast.error('Please fill in required fields: Code, Name, Role, Base Salary');
      return;
    }

    const payload: Partial<StaffMember> = { ...formData };
    if (payload.default_late_penalty === '') payload.default_late_penalty = null;
    if (payload.default_meal_deduction === '') payload.default_meal_deduction = null;

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
      header: 'Staff Member',
      render: (_: any, row: StaffMember) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black text-sm shadow-md">
            {row.full_name?.substring(0, 2).toUpperCase() || 'EMP'}
          </div>
          <div>
            <p className="font-bold text-white group-hover:text-accent transition-colors">{row.full_name}</p>
            <p className="text-[10px] uppercase tracking-widest text-tertiary">CODE: {row.employee_code}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'Role',
      render: (_: any, row: StaffMember) => {
        const roleName = typeof row.role === 'object' ? row.role?.name : roles?.find(r => r.id === row.role)?.name || row.role;
        return (
          <Badge variant="secondary" className="bg-black/40 text-accent border border-accent/20 font-black uppercase tracking-[0.2em] text-[10px]">
            {roleName || 'Unknown'}
          </Badge>
        );
      }
    },
    { 
      key: 'salary', 
      header: 'Salary',
      render: (_: any, row: StaffMember) => (
        <div>
          <p className="text-white font-bold">{formatCurrency(row.base_salary)}</p>
          <p className="text-[10px] uppercase text-tertiary">{row.salary_type}</p>
        </div>
      )
    },
    { 
      key: 'employment_status', 
      header: 'Status',
      render: (value: string) => {
        const color = value === 'active' ? 'success' : value === 'terminated' ? 'error' : 'secondary';
        return (
          <Badge variant={color} size="sm" className="font-black uppercase tracking-widest text-[9px]">
            {value}
          </Badge>
        );
      }
    },
    {
      key: 'is_active',
      header: 'System Access',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'error'} size="sm" className="font-black uppercase tracking-widest text-[9px]">
          {value ? 'ENABLED' : 'DISABLED'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: StaffMember) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:text-accent"
            onClick={() => handleOpenModal(row)}
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

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
          icon={<UserPlus className="w-5 h-5" />}
          onClick={() => handleOpenModal()}
          className="font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
        >
          Enlist Staff
        </Button>
      </div>
      
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Roles' },
              ...(roles?.map(r => ({ value: r.id, label: r.name })) || [])
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'terminated', label: 'Terminated' },
            ]}
          />
          <Select
            value={isActiveFilter}
            onChange={(e) => { setIsActiveFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: 'System Access: All' },
              { value: 'true', label: 'Access Enabled' },
              { value: 'false', label: 'Access Disabled' },
            ]}
          />
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoadingMembers ? (
          <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : membersResponse?.results?.length === 0 ? (
          <div className="p-10 text-center text-tertiary">No staff members found matching your criteria.</div>
        ) : (
          <Table columns={columns} data={membersResponse?.results || []} />
        )}
      </Card>
      
      {!isLoadingMembers && membersResponse && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-tertiary">
            Showing <span className="text-white font-bold">{membersResponse.results?.length}</span> of <span className="text-white font-bold">{membersResponse.count}</span> staff members
          </p>
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!membersResponse.previous}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              disabled={!membersResponse.next}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingStaffId ? "Edit Staff Member" : "Add New Staff Member"}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isCreatingMember || isUpdatingMember}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveStaff} isLoading={isCreatingMember || isUpdatingMember}>
              {editingStaffId ? "Update Member" : "Create Member"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Employee Code" 
              placeholder="e.g., EMP-001" 
              icon={<Hash className="w-4 h-4" />}
              value={formData.employee_code}
              onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
            />
            <Input 
              label="Full Name" 
              placeholder="John Doe" 
              value={formData.full_name}
              onChange={(e) => setFormData({...formData, full_name: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Phone" 
              placeholder="0300..." 
              icon={<Phone className="w-4 h-4" />} 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <Input 
              label="Address" 
              placeholder="Full Address" 
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Role" 
              value={formData.role as string}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              options={[
                { value: '', label: 'Select Role' },
                ...(roles?.map(r => ({ value: r.id, label: r.name })) || [])
              ]} 
              icon={<Briefcase className="w-4 h-4" />}
            />
            <Select 
              label="Employment Status" 
              value={formData.employment_status}
              onChange={(e) => setFormData({...formData, employment_status: e.target.value as any})}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'terminated', label: 'Terminated' },
              ]} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Joining Date" 
              type="date"
              icon={<Calendar className="w-4 h-4" />}
              value={formData.joining_date}
              onChange={(e) => setFormData({...formData, joining_date: e.target.value})}
            />
            <Input 
               label="Biometric Code" 
               placeholder="Exact Employee ID from K70"
               value={formData.biometric_code}
               onChange={(e) => setFormData({...formData, biometric_code: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Base Salary" 
              type="number" 
              placeholder="e.g. 50000"
              icon={<DollarSign className="w-4 h-4" />}
              value={formData.base_salary as string}
              onChange={(e) => setFormData({...formData, base_salary: e.target.value})}
            />
            <Select 
              label="Salary Type" 
              value={formData.salary_type}
              onChange={(e) => setFormData({...formData, salary_type: e.target.value as any})}
              options={[
                { value: 'monthly', label: 'Monthly' },
                { value: 'daily', label: 'Daily' },
              ]} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Default Late Penalty" 
              type="number" 
              placeholder="e.g. 200"
              value={formData.default_late_penalty as string}
              onChange={(e) => setFormData({...formData, default_late_penalty: e.target.value})}
            />
            <Input 
              label="Default Meal Deduction" 
              type="number" 
              placeholder="e.g. 150"
              value={formData.default_meal_deduction as string}
              onChange={(e) => setFormData({...formData, default_meal_deduction: e.target.value})}
            />
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <h3 className="text-white text-sm font-bold mb-3">Roles & Permissions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded bg-white/5 border-base text-primary focus:ring-primary" />
                <span className="text-xs font-bold text-white">System Access</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_manager} onChange={(e) => setFormData({...formData, is_manager: e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-xs font-bold text-white">Manager flag</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_cashier} onChange={(e) => setFormData({...formData, is_cashier: e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-xs font-bold text-white">Cashier flag</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_kitchen_staff} onChange={(e) => setFormData({...formData, is_kitchen_staff: e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-xs font-bold text-white">Kitchen Staff flag</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_delivery_staff} onChange={(e) => setFormData({...formData, is_delivery_staff: e.target.checked})} className="w-4 h-4 rounded" />
                <span className="text-xs font-bold text-white">Delivery Staff flag</span>
              </label>
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
