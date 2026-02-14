"use client"

import React, { useState } from 'react';
import { Button } from '@/src/components/Button';
import { Input, TextArea, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Badge } from '@/src/components/Badge';
import { Plus, Edit, Trash2, Search, Image } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { cn } from '@/src/lib/utils';

const categories = [
  { id: 1, name: 'Burgers', items: 12, color: '#8B0000' },
  { id: 2, name: 'Sides', items: 8, color: '#D4AF37' },
  { id: 3, name: 'Drinks', items: 10, color: '#3B82F6' },
  { id: 4, name: 'Desserts', items: 6, color: '#10B981' },
];

const menuItems = [
  { id: 1, name: 'Classic Burger', category: 'Burgers', price: 12.99, cost: 5.20, stock: 45, status: 'active' },
  { id: 2, name: 'Cheese Burger', category: 'Burgers', price: 13.99, cost: 5.80, stock: 38, status: 'active' },
  { id: 3, name: 'BBQ Burger', category: 'Burgers', price: 14.99, cost: 6.40, stock: 12, status: 'active' },
  { id: 4, name: 'Chicken Burger', category: 'Burgers', price: 11.99, cost: 4.90, stock: 0, status: 'out_of_stock' },
  { id: 5, name: 'French Fries', category: 'Sides', price: 4.99, cost: 1.20, stock: 120, status: 'active' },
  { id: 6, name: 'Cheese Fries', category: 'Sides', price: 5.99, cost: 1.80, stock: 85, status: 'active' },
];

export default function MenuManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Menu Management</h1>
          <p className="text-sm md:text-base text-tertiary">Manage your restaurant menu items and categories</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          icon={<Plus className="w-5 h-5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Item
        </Button>
      </div>
      
      {/* Category Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map(category => (
          <Card 
            key={category.id}
            hover
            className="bg-secondary border-base p-6 shadow-xl relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent -mr-8 -mt-8 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${category.color}20`, border: `1px solid ${category.color}30` }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color, boxShadow: `0 0 15px ${category.color}` }}
                />
              </div>
              <button className="text-tertiary hover:text-white transition-colors">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-xl font-black text-white mb-1">{category.name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-tertiary">{category.items} items listed</p>
          </Card>
        ))}
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
              { value: 'burgers', label: 'Burgers' },
              { value: 'sides', label: 'Sides' },
              { value: 'drinks', label: 'Drinks' },
              { value: 'desserts', label: 'Desserts' },
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
                <th className="px-6 py-5 text-left font-black text-tertiary">Cost</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Margin</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Stock</th>
                <th className="px-6 py-5 text-left font-black text-tertiary">Status</th>
                <th className="px-6 py-5 text-right font-black text-tertiary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base/30">
              {filteredItems.map(item => {
                const margin = ((item.price - item.cost) / item.price * 100).toFixed(0);
                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <p className="font-bold text-white group-hover:text-accent transition-colors">{item.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-white/5 text-tertiary border-0">{item.category}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-accent">${item.price.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white text-sm font-medium">${item.cost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-success text-sm font-bold">{margin}%</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        item.stock < 15 ? 'text-warning' : 'text-white'
                      )}>
                        {item.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.status === 'active' ? (
                        <Badge variant="success" size="sm" className="uppercase tracking-widest text-[10px]">Active</Badge>
                      ) : (
                        <Badge variant="error" size="sm" className="uppercase tracking-widest text-[10px] animate-pulse">Out of Stock</Badge>
                      )}
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
            </tbody>
          </table>
        </div>
      </Card>
      
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
                { value: 'burgers', label: 'Burgers' },
                { value: 'sides', label: 'Sides' },
                { value: 'drinks', label: 'Drinks' },
                { value: 'desserts', label: 'Desserts' },
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
            <div className="border-2 border-dashed border-[#2A2A2A] rounded-xl p-8 text-center hover:border-[#333333] transition-colors cursor-pointer">
              <Image className="w-12 h-12 text-[#B3B3B3] mx-auto mb-3" aria-label="Upload image icon" />
              <p className="text-sm text-[#B3B3B3] mb-1">Click to upload image</p>
              <p className="text-xs text-[#808080]">PNG, JPG up to 5MB</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
