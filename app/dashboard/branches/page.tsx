"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, Store, RefreshCw } from 'lucide-react';
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
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-white uppercase tracking-tight">{value}</p>
            <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">{row.city}, {row.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone_number',
      header: 'Contact Info',
      render: (value: string, row: Branch) => (
        <div className="flex flex-col">
          <span className="text-white text-sm font-medium">{value}</span>
          <span className="text-[10px] text-tertiary">{row.email}</span>
        </div>
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
      render: (_: any, row: Branch) => (
        <div className="flex justify-end gap-2">
          <button 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all group" 
            onClick={() => {
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
            }}
          >
            <Edit className="w-4 h-4 text-tertiary group-hover:text-accent" />
          </button>
          <button 
            className="p-2.5 text-error/60 hover:text-error hover:bg-error/5 rounded-xl transition-all" 
            onClick={() => handleDelete(row.id, row.name)}
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
          <h1 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-1">Branch Network</h1>
          <p className="text-sm text-tertiary">Manage restaurant locations and contact profiles</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} icon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
            Add Branch
          </Button>
        </div>
      </div>

      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        {isLoading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          </div>
        ) : (
          <Table columns={columns} data={branches} />
        )}
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingBranchId(null); }} 
        title={editingBranchId ? 'Edit Branch Profile' : 'Register New Branch'}
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingBranchId(null); }} disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingBranchId ? 'Update Branch' : 'Save Branch'}</Button>
          </div>
        }
      >
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Branch Name" placeholder="e.g. Duke's Downtown" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} />
            <Input label="City" placeholder="e.g. New York" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} />
          </div>
          <Input label="Full Address" placeholder="123 Luxury Ave..." value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Phone Number" placeholder="+1..." value={branchForm.phone_number} onChange={e => setBranchForm({ ...branchForm, phone_number: e.target.value })} />
            <Input label="Email Address" placeholder="branch@dukes.com" value={branchForm.email} onChange={e => setBranchForm({ ...branchForm, email: e.target.value })} />
          </div>
          
          <div className="bg-white/5 p-4 rounded-xl border border-base flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">Operational Status</span>
              <span className="text-[10px] text-tertiary uppercase tracking-widest font-black">Is this branch currently active?</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={branchForm.is_active} 
                onChange={e => setBranchForm({ ...branchForm, is_active: e.target.checked })}
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
