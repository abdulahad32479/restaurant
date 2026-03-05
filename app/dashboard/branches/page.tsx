"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, Store } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { branchService } from '@/src/services/branch.service';
import { Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);

  const [branchForm, setBranchForm] = useState({
    name: '',
    address: '',
    city: '',
    phone_number: '',
    email: '',
    is_active: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await branchService.getAll();
      setBranches(data);
    } catch (error) {
      console.error('Failed to load branches', error);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!branchForm.name || !branchForm.address || !branchForm.city) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingBranchId) {
        await branchService.update(editingBranchId, branchForm);
        toast.success('Branch updated');
      } else {
        await branchService.create(branchForm);
        toast.success('Branch created');
      }
      setIsModalOpen(false);
      setEditingBranchId(null);
      setBranchForm({ name: '', address: '', city: '', phone_number: '', email: '', is_active: true });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save branch', e);
      toast.error(e.response?.data?.detail || 'Failed to save branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete branch ${name}?`)) return;
    try {
      await branchService.delete(id);
      toast.success('Branch deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete branch');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Branch Name',
      render: (value: string, row: Branch) => (
        <div className="flex items-center gap-3">
          <Store className="w-5 h-5 text-primary" />
          <div>
            <p className="font-bold text-white">{value}</p>
            <p className="text-xs text-tertiary">{row.city}, {row.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone_number',
      header: 'Phone',
      render: (value: string) => <span className="text-tertiary">{value}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      render: (value: string) => <span className="text-tertiary">{value}</span>,
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
      render: (_: any, row: Branch) => (
        <div className="flex gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingBranchId(row.id);
            setBranchForm({
              name: row.name || '',
              address: row.address || '',
              city: row.city || '',
              phone_number: row.phone_number || '',
              email: row.email || '',
              is_active: !!row.is_active,
            });
            setIsModalOpen(true);
          }}>
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2 text-error hover:text-error/80" onClick={() => handleDelete(row.id, row.name)}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Branch Management</h1>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Branch
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={branches} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingBranchId(null); }} title={editingBranchId ? 'Edit Branch' : 'Create Branch'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingBranchId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingBranchId ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="grid gap-4">
          <Input label="Name" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
          <Input label="City" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} />
          <Input label="Address" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
          <Input label="Phone" value={branchForm.phone_number} onChange={e => setBranchForm({ ...branchForm, phone_number: e.target.value })} />
          <Input label="Email" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} />
          <div className="flex items-center">
            <input type="checkbox" checked={branchForm.is_active} onChange={e => setBranchForm({ ...branchForm, is_active: e.target.checked })} className="mr-2" />
            <span className="text-sm font-bold">Active Branch</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
