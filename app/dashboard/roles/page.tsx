"use client"

import React, { useState } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Loader2, Briefcase } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { useRoles } from '@/src/hooks/useStaff';
import { StaffRole } from '@/src/types/staff';
import toast from 'react-hot-toast';

export default function RolesManagement() {
  const { roles, isLoadingRoles, createRole, isCreatingRole, updateRole, isUpdatingRole } = useRoles();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<StaffRole>>({
    name: '',
    description: '',
    is_active: true,
  });

  const handleOpenModal = (role?: StaffRole) => {
    if (role) {
      setEditingRoleId(role.id);
      setFormData({
        name: role.name,
        description: role.description || '',
        is_active: role.is_active,
      });
    } else {
      setEditingRoleId(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Role name is required');
      return;
    }
    if (editingRoleId) {
      updateRole({ id: editingRoleId, data: formData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createRole(formData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const columns = [
    { 
      key: 'name', 
      header: 'Role Name',
      render: (value: string) => <span className="font-bold text-white tracking-widest uppercase">{value}</span>
    },
    { 
      key: 'description', 
      header: 'Description',
      render: (value: string) => <span className="text-tertiary">{value || 'No description provided'}</span>
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'secondary'} size="sm" className="uppercase text-[9px]">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffRole) => (
        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(row)} className="text-[10px] uppercase tracking-widest">
          Edit Role
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-tighter">Staff Roles</h1>
          <p className="text-sm md:text-base text-tertiary font-bold uppercase tracking-widest">Manage job titles and permissions</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => handleOpenModal()}
          className="font-black uppercase tracking-tighter"
        >
          Add Role
        </Button>
      </div>
      
      {/* Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0 min-h-[400px]">
        {isLoadingRoles ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : !roles || roles.length === 0 ? (
          <div className="p-10 text-center text-tertiary space-y-3 flex flex-col items-center">
            <Briefcase className="w-10 h-10 text-tertiary/50" />
            <p>No roles match your criteria.</p>
          </div>
        ) : (
          <Table columns={columns} data={roles} />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoleId ? "Edit Role" : "Create New Role"}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isCreatingRole || isUpdatingRole}>Save Role</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input 
            label="Role Name" 
            placeholder="e.g. Cashier"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="Description" 
            placeholder="Summary of responsibilities..."
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <div className="flex flex-col justify-end pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                className="w-5 h-5 rounded bg-white/5 border-base text-primary focus:ring-primary"
              />
              <span className="text-sm font-bold text-white">Role Active</span>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
