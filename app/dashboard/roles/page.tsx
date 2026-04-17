"use client"

import React, { useState } from 'react';
import { LightTable as Table } from '@/src/components/LightTable';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { 
  Plus, Loader2, Briefcase, ShieldCheck, 
  Users, Layers, Edit, Trash2, Search, Zap
} from 'lucide-react';
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
      header: 'ROLE IDENTITY',
      render: (v: string) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center">
             <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="font-black text-slate-900 text-sm tracking-tighter uppercase italic">{v}</span>
        </div>
      )
    },
    { 
      key: 'description', 
      header: 'COMPASS',
      render: (v: string) => <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{v || 'No Protocol Defined'}</span>
    },
    { 
      key: 'is_active', 
      header: 'STATE',
      render: (v: boolean) => (
        <Badge 
          variant={v ? 'success' : 'secondary'} 
          size="sm" 
          className="font-black uppercase tracking-[0.2em] text-[8px] border-none px-4 py-1 rounded-full shadow-sm"
        >
          {v ? 'Active' : 'Halted'}
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
          className="group flex items-center gap-2 bg-slate-50 hover:bg-slate-900 py-1.5 pl-4 pr-1.5 rounded-full border border-slate-200 transition-all active:scale-95"
        >
           <span className="text-[10px] font-black text-slate-600 group-hover:text-white uppercase tracking-widest">Configure</span>
           <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
              <Edit className="w-3 h-3 text-slate-900" />
           </div>
        </button>
      )
    }
  ];

  return (
    <div className="animate-fade-in -m-6 min-h-screen bg-[#f0f4f8] font-sans text-[#0f172a] pb-20">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-[#7c3aed] rounded-xl flex items-center justify-center shadow-lg shadow-[#7c3aed]/20">
              <ShieldCheck className="text-white w-5 h-5" />
           </div>
           <div>
              <h1 className="text-[15px] font-extrabold text-[#0f172a] tracking-tight">Staff Roles</h1>
              <p className="text-[10px] text-[#64748b] font-bold uppercase tracking-widest">Organizational Protocols</p>
           </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold h-10 px-6 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      <div className="max-w-[1200px] mx-auto p-8">
        <div className="bg-white border border-[#e2e8f0] rounded-[10px] shadow-sm overflow-hidden">
          {isLoadingRoles ? (
             <div className="flex flex-col items-center justify-center p-32 gap-3 text-[#94a3b8]">
                <Loader2 className="animate-spin w-8 h-8 text-[#7c3aed]" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Indexing Protocols...</span>
             </div>
          ) : roles?.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-32 gap-4 text-[#94a3b8]">
                <Briefcase className="w-12 h-12 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">No roles defined yet</p>
             </div>
          ) : (
             <Table columns={columns} data={roles || []} className="border-none" />
          )}
        </div>
      </div>

      <Modal theme="light"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoleId ? "Edit Role" : "Add Role"}
        size="md"
        footer={
          <div className="flex gap-3 w-full sm:w-auto mt-2">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 font-bold shadow-sm">Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isCreatingRole || isUpdatingRole} className="flex-1 sm:flex-none px-10 bg-violet-600 hover:bg-violet-700 text-white border-none shadow-none font-bold">Save</Button>
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
