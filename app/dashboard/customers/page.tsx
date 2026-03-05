"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, UserCircle, Phone, MapPin } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { customerService } from '@/src/services/customer.service';
import { branchService } from '@/src/services/branch.service';
import { Customer, Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);

  const [customerForm, setCustomerForm] = useState({
    name: '',
    branch: '',
    phone: '',
    address: '',
    email: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cData, bData] = await Promise.all([
        customerService.getAll(),
        branchService.getAll(),
      ]);
      setCustomers(cData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to load customers or branches', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!customerForm.name || !customerForm.branch) {
      toast.error('Name and Branch are required');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCustomerId) {
        await customerService.update(editingCustomerId, customerForm as any);
        toast.success('Customer updated');
      } else {
        await customerService.create(customerForm as any);
        toast.success('Customer created');
      }
      setIsModalOpen(false);
      setEditingCustomerId(null);
      setCustomerForm({ name: '', branch: '', phone: '', address: '', email: '' });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save customer', e);
      toast.error(e.response?.data?.detail || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete customer ${name}?`)) return;
    try {
      await customerService.delete(id);
      toast.success('Customer deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete customer');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (value: string, row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <UserCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">{value}</p>
            <p className="text-xs text-tertiary flex items-center gap-1">
              <Phone className="w-3 h-3" /> {row.phone || row.phone_number || 'N/A'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (value: string, row: Customer) => (
        <span className="text-tertiary">{row.branch_name || row.branch || '-'}</span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (value: string) => (
        <span className="text-tertiary flex items-center gap-1">
          {value ? <MapPin className="w-3 h-3" /> : null} {value || '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: Customer) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingCustomerId(row.id);
            setCustomerForm({
              name: row.name || '',
              branch: row.branch || '',
              phone: row.phone || row.phone_number || '',
              address: row.address || '',
              email: row.email || '',
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
        <h1 className="text-2xl font-bold">Customer Directory</h1>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Customer
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={customers} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCustomerId(null); }} title={editingCustomerId ? 'Edit Customer' : 'Create Customer'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingCustomerId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingCustomerId ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="grid gap-4">
          <Input label="Name *" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} />
          <Select label="Branch *" value={customerForm.branch} onChange={e => setCustomerForm({ ...customerForm, branch: e.target.value })} options={[{ value: '', label: 'Select Branch' }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
          <Input label="Phone" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
          <Input label="Email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} />
          <Input label="Address" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
