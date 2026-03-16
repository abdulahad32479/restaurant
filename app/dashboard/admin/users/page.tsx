"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { UserPlus, Edit, Trash2, Shield, RefreshCw } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { userService } from '@/src/services/user.service';
import { branchService } from '@/src/services/branch.service';
import { Branch, User } from '@/src/types';
import { getRoleLabel, getRoleColor } from '@/src/lib/rbac';
import toast from 'react-hot-toast';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const ROLES = [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'waiter', label: 'Waiter' },
    { value: 'chef', label: 'Chef' },
  ];

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'cashier' as string,
    branch: '',
    is_active: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uData, bData] = await Promise.all([
        userService.getAll(),
        branchService.getAll(),
      ]);
      setUsers(uData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to load users or branches', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!newUser.username || !newUser.email || (!editingUserId && !newUser.password) || !newUser.branch) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingUserId) {
        const dataToUpdate = { ...newUser } as any;
        if (!dataToUpdate.password) delete dataToUpdate.password;
        delete dataToUpdate.is_active;
        await userService.update(editingUserId, dataToUpdate);
        toast.success('User updated');
      } else {
        const dataToCreate = { ...newUser } as any;
        delete dataToCreate.is_active;
        await userService.create(dataToCreate);
        toast.success('User created');
      }
      setIsModalOpen(false);
      setEditingUserId(null);
      setNewUser({ username: '', email: '', password: '', role: 'cashier', branch: '', is_active: true });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save user', e);
      toast.error(e.response?.data?.detail || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, username: string) => {
    if (!confirm(`Delete ${username}?`)) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete');
    }
  };

  const columns = [
    {
      key: 'username',
      header: 'Staff Member',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold border border-primary/20 shadow-sm">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white uppercase tracking-tight">{value}</p>
            <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Access Level',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${getRoleColor(value)}`}>
          {getRoleLabel(value)}
        </span>
      ),
    },
    {
      key: 'branch_name',
      header: 'Assigned Branch',
      render: (value: string, row: any) => (
        <span className="text-tertiary font-medium">
          {value || row.branch || '-'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'error'} size="sm">
          {value ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: any) => (
        <div className="flex justify-end gap-2">
          <button 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all group" 
            onClick={() => {
              setEditingUserId(row.id);
              setNewUser({ username: row.username, email: row.email, password: '', role: row.role, branch: row.branch || '', is_active: row.is_active });
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4 text-tertiary group-hover:text-accent" />
          </button>
          <button 
            className="p-2.5 text-error/60 hover:text-error hover:bg-error/5 rounded-xl transition-all" 
            onClick={() => handleDelete(row.id, row.username)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white  uppercase tracking-tighter mb-1">Administrative Access</h1>
          <p className="text-sm text-tertiary">Manage system administrators and staff permissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<UserPlus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
            Add Administrator
          </Button>
        </div>
      </div>

      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingUserId(null); }} 
        title={editingUserId ? 'Modify Admin Attributes' : 'Grant Administrative Access'}
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingUserId(null); }} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingUserId ? 'Update Permissions' : 'Create Account'}</Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Username" placeholder="e.g. john_duke" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
            <Input label="Email Address" placeholder="staff@dukes.com" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <Input label="Secure Password" type="password" placeholder={editingUserId ? 'Leave blank to keep current' : 'Min. 8 characters'} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          
          <div className="grid grid-cols-2 gap-4">
            <Select label="Assigned Branch" value={newUser.branch} onChange={e => setNewUser({ ...newUser, branch: e.target.value })} options={[{ value: '', label: 'Select Location' }, ...branches.map((b: Branch) => ({ value: b.id, label: b.name }))]} />
            <Select label="System Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} options={ROLES} />
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-base flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Account Status</span>
              <span className="text-[10px] text-tertiary uppercase tracking-widest font-black">Enable or disable this user profile</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={newUser.is_active} 
                onChange={e => setNewUser({ ...newUser, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
