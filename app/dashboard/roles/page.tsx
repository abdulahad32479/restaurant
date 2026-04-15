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
      header: 'NAME',
      render: (v: string) => <span className="font-bold text-slate-900 text-sm">{v}</span>
    },
    { 
      key: 'description', 
      header: 'DESCRIPTION',
      render: (v: string) => <span className="text-slate-400 text-xs font-medium">{v || '—'}</span>
    },
    { 
      key: 'is_active', 
      header: 'STATUS',
      render: (v: boolean) => (
        <Badge variant={v ? 'success' : 'secondary'} size="sm" className="font-bold bg-success/10 text-success border-success/20">
          {v ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right' as const,
      render: (_: any, row: StaffRole) => (
        <button 
          onClick={() => handleOpenModal(row)}
          className="px-4 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all"
        >
          Edit
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex items-center justify-between">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Staff Roles</h2>
        <Button 
          variant="primary" 
          size="sm"
          onClick={() => handleOpenModal()}
          className="font-black uppercase tracking-tighter shadow-glow-primary px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Role
        </Button>
      </div>
      
      {/* Table Section */}
      <Card className="bg-white border-slate-100 overflow-hidden shadow-sm p-0 min-h-[400px]">
        {isLoadingRoles ? (
          <div className="flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
          </div>
        ) : !roles || roles.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">No organizational roles found.</div>
        ) : (
          <Table columns={columns} data={roles} className="text-sm border-none" />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoleId ? "Edit Role" : "Add Role"}
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none">Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none px-10 shadow-glow-primary">Save</Button>
          </div>
        }
      >
        <div className="space-y-6 py-2">
          <Input 
            label="ROLE NAME *" 
            placeholder="e.g. Chef, Waiter"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="bg-white border-slate-200 text-slate-900"
          />
          <Input 
            label="DESCRIPTION" 
            placeholder="Optional description"
            value={formData.description || ''}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="bg-white border-slate-200 text-slate-900"
          />
        </div>
      </Modal>
    </div>
  );
}
