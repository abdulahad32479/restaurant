"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { UserPlus, Edit, Trash2, Shield } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { userService } from '@/src/services/user.service';
import { branchService } from '@/src/services/branch.service';
import { Branch, User } from '@/src/types';
import toast from 'react-hot-toast';

export default function AdminUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin' as any,
    branch: '',
    is_active: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uData, bData] = await Promise.all([
        userService.getAll(),
        // Assuming branchService exists for branch list
        import('@/src/services/branch.service').then(m => m.branchService.getAll()),
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
      setNewUser({ username: '', email: '', password: '', role: 'admin' as any, branch: '', is_active: true });
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
      header: 'Username',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            {value.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white">{value}</p>
            <p className="text-xs text-tertiary">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (value: string) => (
        <Badge variant="secondary" className="bg-white/5 text-tertiary border-0 font-bold uppercase tracking-widest text-[10px]">
          {value}
        </Badge>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (value: string, row: any) => (
        <span className="text-tertiary">{value || row.branch || '-'}
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
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingUserId(row.id);
            setNewUser({ username: row.username, email: row.email, password: '', role: row.role, branch: row.branch || '', is_active: row.is_active });
            setIsModalOpen(true);
          }}>
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 text-error hover:text-error/80" onClick={() => handleDelete(row.id, row.username)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin User Management</h1>
        <Button variant="primary" size="sm" icon={<UserPlus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Admin
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={users} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUserId(null); }} title={editingUserId ? 'Edit Admin User' : 'Create Admin User'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingUserId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingUserId ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="grid gap-4">
          <Input label="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
          <Input label="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          <Input label="Password" type="password" placeholder={editingUserId ? 'Leave blank to keep current' : ''} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          <Select label="Branch" value={newUser.branch} onChange={e => setNewUser({ ...newUser, branch: e.target.value })} options={[{ value: '', label: 'Select Branch' }, ...branches.map((b: Branch) => ({ value: b.id, label: b.name }))]} />
          <Select label="Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as any })} options={[{ value: 'admin', label: 'Admin' }, { value: 'manager', label: 'Manager' }, { value: 'staff', label: 'Staff' }]} />
          <div className="flex items-center">
            <input type="checkbox" checked={newUser.is_active} onChange={e => setNewUser({ ...newUser, is_active: e.target.checked })} className="mr-2" />
            <span className="text-sm font-bold">Active Account</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
