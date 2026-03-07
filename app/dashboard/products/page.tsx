"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select, TextArea } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { Product, Category } from '@/src/types';
import toast from 'react-hot-toast';

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    tax_percentage: '0.00',
    category: '',
    is_active: true,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll(),
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (error) {
      console.error('Failed to load products or categories', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.cost || !productForm.category) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingProductId) {
        await productService.update(editingProductId, productForm as any);
        toast.success('Product updated');
      } else {
        await productService.create(productForm as any);
        toast.success('Product created');
      }
      setIsModalOpen(false);
      setEditingProductId(null);
      setProductForm({ name: '', sku: '', description: '', price: '', cost: '', tax_percentage: '0.00', category: '', is_active: true });
      fetchData();
    } catch (e: any) {
      console.error('Failed to save product', e);
      toast.error(e.response?.data?.detail || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete product ${name}?`)) return;
    try {
      await productService.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch (e) {
      console.error('Delete error', e);
      toast.error('Failed to delete product');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Product',
      render: (value: string, row: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-white">{value}</p>
            <p className="text-xs text-tertiary">SKU: {row.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (value: string, row: Product) => (
        <span className="text-tertiary">{row.category_name || row.category || '-'}</span>
      ),
    },
    {
      key: 'price',
      header: 'Price / Cost',
      render: (value: string, row: Product) => (
        <div>
          <p className="font-bold text-success">Rs. {Number(value).toFixed(2)}</p>
          <p className="text-xs text-tertiary">Cost: Rs. {Number(row.cost).toFixed(2)}</p>
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
      render: (_: any, row: Product) => (
        <div className="flex justify-end gap-2">
          <button className="p-2 hover:bg-white/5 rounded-xl" onClick={() => {
            setEditingProductId(row.id);
            setProductForm({
              name: row.name || '',
              sku: row.sku || '',
              description: row.description || '',
              price: row.price || '',
              cost: row.cost || '',
              tax_percentage: row.tax_percentage || '0.00',
              category: row.category || '',
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
        <h1 className="text-2xl font-bold text-dukes-gold">Menu & Products</h1>
        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          Add Product
        </Button>
      </div>
      <Card className="bg-secondary border-base p-4">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={products} />
        )}
      </Card>
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingProductId(null); }} title={editingProductId ? 'Edit Product' : 'Create Product'} footer={
        <>
          <Button variant="outline" onClick={() => { setIsModalOpen(false); setEditingProductId(null); }} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} isLoading={isSubmitting}>{editingProductId ? 'Update' : 'Create'}</Button>
        </>
      } size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Name *" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
          <Input label="SKU *" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} />
          <Select label="Category *" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} options={[{ value: '', label: 'Select Category' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
          <Input label="Price *" type="number" step="0.01" value={productForm.price as any} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
          <Input label="Cost *" type="number" step="0.01" value={productForm.cost as any} onChange={e => setProductForm({ ...productForm, cost: e.target.value })} />
          <Input label="Tax Percentage" type="number" step="0.01" value={productForm.tax_percentage as any} onChange={e => setProductForm({ ...productForm, tax_percentage: e.target.value })} />
          <div className="md:col-span-2">
            <TextArea label="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
          </div>
          <div className="flex items-center md:col-span-2">
            <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm({ ...productForm, is_active: e.target.checked })} className="mr-2" />
            <span className="text-sm font-bold">Active Product</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
