"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { categoryService } from '@/src/services/category.service';
import { Category } from '@/src/types';
import toast from 'react-hot-toast';

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories', error);
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!categoryForm.name) {
      toast.error('Please enter a category name');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingCategoryId) {
        await categoryService.update(editingCategoryId, categoryForm);
        toast.success('Category updated');
      } else {
        await categoryService.create(categoryForm);
        toast.success('Category created');
      }
      setIsModalOpen(false);
      setEditingCategoryId(null);
      setCategoryForm({ name: '', description: '' });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save category', e);
      toast.error(e.response?.data?.detail || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category ${name}?`)) return;
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete category');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <Tag className="w-5 h-5 text-primary" />
          <span className="font-bold text-white">{value}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (value: string) => <span className="text-tertiary">{value || '-'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: Category) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingCategoryId(row.id);
            setCategoryForm({
              name: row.name || '',
              description: row.description || '',
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
        <h1 className="text-2xl font-bold">Category Management</h1>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Category
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={categories} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingCategoryId(null); }} title={editingCategoryId ? 'Edit Category' : 'Create Category'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingCategoryId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingCategoryId ? 'Update' : 'Create'}</Button>
        </>
      }>
        <div className="grid gap-4">
          <Input label="Name" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
          <Input label="Description" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
