"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/Button';
import { Input, TextArea, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Badge } from '@/src/components/Badge';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Tags, Layers, AlertCircle } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { cn } from '@/src/lib/utils';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { Product, Category } from '@/src/types';
import toast from 'react-hot-toast';

export default function MenuManagement() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setItems(pData);
      setCategories(cData);
    } catch (error) {
      console.error('Failed to fetch menu data', error);
      toast.error('Failed to load menu or categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const handleAddCategory = async () => {
    if (!newCategory.name) {
      toast.error('Category name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      await categoryService.create(newCategory);
      toast.success('Category added successfully!');
      setNewCategory({ name: '', description: '' });
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Menu Management</h1>
          <p className="text-sm md:text-base text-tertiary">Manage your restaurant menu items and categories</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Tags className="w-5 h-5" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Categories
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Item
          </Button>
        </div>
      </div>
      
      {/* Category Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.slice(0, 4).map((category, index) => {
          const colors = ['#8B0000', '#D4AF37', '#3B82F6', '#10B981'];
          const color = colors[index % colors.length];
          const itemCount = items.filter(i => i.category === category.id).length;
          
          return (
            <Card 
              key={category.id}
              hover
              className="bg-secondary border-base p-6 shadow-xl relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-8 -mt-8 rounded-full blur-2xl" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}
                  />
                </div>
                <button className="text-tertiary hover:text-white transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-black text-white mb-1">{category.name}</h3>
              <p className="text-[10px] uppercase tracking-widest text-tertiary">{itemCount} items listed</p>
            </Card>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-full py-10 text-center bg-white/5 rounded-2xl border border-dashed border-base">
            <Layers className="w-10 h-10 text-tertiary mx-auto mb-3 opacity-20" />
            <p className="text-tertiary">No categories found. Add one to get started.</p>
          </div>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search dishes, drinks, or desserts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
      </div>
      
      {/* Menu Items Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1000px]">
            <thead>
              <tr className="bg-white/5 border-b border-base text-[10px] uppercase tracking-widest">
                <th className="px-6 py-5 text-left font-black text-tertiary">Item Name</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Category</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Price</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Status</th>
                <th className="px-6 py-5 text-right font-black text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base/30">
              {filteredItems.map(item => {
                const categoryName = categories.find(c => c.id === item.category)?.name || 'Uncategorized';
                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-base" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-tertiary">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <p className="font-bold text-white group-hover:text-accent transition-colors">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-white/5 text-tertiary border-0">{categoryName}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-accent">${Number(item.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={item.is_active ? "success" : "error"} size="sm" className="uppercase tracking-widest text-[10px]">
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:text-accent">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2.5 hover:bg-error/10 rounded-xl transition-all text-error/60 hover:text-error">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-tertiary">
                    No items found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* Category Management Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Manage Categories"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-bg-main border border-base space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Add New Category</h4>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Category Name" 
                placeholder="e.g., Seafood" 
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              />
              <TextArea 
                label="Description" 
                placeholder="Category description..." 
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              />
              <Button 
                variant="primary" 
                className="w-full"
                onClick={handleAddCategory}
                isLoading={isSubmitting}
              >
                Create Category
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Existing Categories</h4>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-base group hover:border-accent/30 transition-all">
                  <div>
                    <p className="font-bold text-white">{category.name}</p>
                    <p className="text-[10px] text-tertiary">{category.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-tertiary hover:text-white"><Edit className="w-3.5 h-3.5" /></button>
                    <button className="p-2 text-tertiary hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Menu Item"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Add Item
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Item Name" placeholder="e.g., Premium Burger" />
            <Select
              label="Category"
              options={[
                { value: '', label: 'Select category' },
                ...categories.map(c => ({ value: c.id, label: c.name }))
              ]}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Input label="Selling Price" placeholder="0.00" type="number" />
            <Input label="Cost Price" placeholder="0.00" type="number" />
            <Input label="Stock Quantity" placeholder="0" type="number" />
          </div>
          
          <TextArea label="Description" placeholder="Item description..." rows={3} />
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Item Image
            </label>
            <div className="border-2 border-dashed border-base rounded-xl p-8 text-center hover:border-accent/30 transition-colors cursor-pointer group">
              <ImageIcon className="w-12 h-12 text-tertiary mx-auto mb-3 group-hover:text-accent transition-colors" />
              <p className="text-sm text-tertiary mb-1">Click to upload image</p>
              <p className="text-xs text-tertiary/50">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
