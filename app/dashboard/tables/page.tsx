"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, Grid } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { tableService } from '@/src/services/table.service';
import { branchService } from '@/src/services/branch.service';
import { Table as TableType, Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function TableManagement() {
  const [tables, setTables] = useState<TableType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  const [tableForm, setTableForm] = useState({
    name: '',
    capacity: 4,
    branch: '',
    is_occupied: false,
    is_active: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tData, bData] = await Promise.all([
        tableService.getAll(),
        branchService.getAll(),
      ]);
      setTables(tData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to load tables or branches', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!tableForm.name || !tableForm.capacity || !tableForm.branch) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTableId) {
        await tableService.update(editingTableId, tableForm);
        toast.success('Table updated');
      } else {
        await tableService.create(tableForm);
        toast.success('Table created');
      }
      setIsModalOpen(false);
      setEditingTableId(null);
      setTableForm({ name: '', capacity: 4, branch: '', is_occupied: false, is_active: true });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save table', e);
      toast.error(e.response?.data?.detail || 'Failed to save table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete table ${name}?`)) return;
    try {
      await tableService.delete(id);
      toast.success('Table deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete table');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Table Name / Number',
      render: (value: string, row: TableType) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
            {value}
          </div>
          <div>
            <p className="font-bold text-white">Table {value}</p>
            <p className="text-xs text-tertiary">Capacity: {row.capacity} persons</p>
          </div>
        </div>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      render: (value: string, row: TableType) => (
        <span className="text-tertiary">{row.branch_name || row.branch || '-'}</span>
      ),
    },
    {
      key: 'is_occupied',
      header: 'Occupancy',
      render: (value: boolean) => (
        <Badge variant={value ? 'warning' : 'success'} size="sm">
          {value ? 'OCCUPIED' : 'FREE'}
        </Badge>
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
      render: (_: any, row: TableType) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingTableId(row.id);
            setTableForm({
              name: row.name || '',
              capacity: row.capacity || 4,
              branch: row.branch || '',
              is_occupied: !!row.is_occupied,
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
        <h1 className="text-2xl font-bold">Table Management</h1>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Table
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={tables} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTableId(null); }} title={editingTableId ? 'Edit Table' : 'Create Table'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingTableId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingTableId ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="grid gap-4">
          <Input label="Table Name / Number *" value={tableForm.name} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} />
          <Input label="Capacity *" type="number" min="1" value={tableForm.capacity as any} onChange={e => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 0 })} />
          <Select label="Branch *" value={tableForm.branch} onChange={e => setTableForm({ ...tableForm, branch: e.target.value })} options={[{ value: '', label: 'Select Branch' }, ...branches.map(b => ({ value: b.id, label: b.name }))]} />
          
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex items-center">
              <input type="checkbox" checked={tableForm.is_active} onChange={e => setTableForm({ ...tableForm, is_active: e.target.checked })} className="mr-2" />
              <span className="text-sm font-bold">Active (Visible in POS)</span>
            </div>
            {editingTableId && (
              <div className="flex items-center">
                <input type="checkbox" checked={tableForm.is_occupied} onChange={e => setTableForm({ ...tableForm, is_occupied: e.target.checked })} className="mr-2" />
                <span className="text-sm font-bold text-warning">Mark as Occupied</span>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
