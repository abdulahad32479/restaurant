"use client"

import React, { useState } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { AlertCircle, TrendingDown, Package, Plus, Search } from 'lucide-react';
import { Card } from '@/src/components/Card';

const stockOverview = [
  { label: 'Total Items', value: '156', color: '#8B0000' },
  { label: 'Low Stock', value: '12', color: '#F59E0B' },
  { label: 'Out of Stock', value: '3', color: '#EF4444' },
  { label: 'Stock Value', value: '$8,456', color: '#10B981' },
];

const inventoryItems = [
  { id: 1, name: 'Burger Buns', category: 'Ingredients', quantity: 15, unit: 'pcs', minStock: 50, value: '$45.00', supplier: 'Baker Bros', status: 'low' },
  { id: 2, name: 'Beef Patties', category: 'Ingredients', quantity: 85, unit: 'pcs', minStock: 50, value: '$255.00', supplier: 'Prime Meats', status: 'ok' },
  { id: 3, name: 'Cheese Slices', category: 'Ingredients', quantity: 0, unit: 'pcs', minStock: 100, value: '$0.00', supplier: 'Dairy Fresh', status: 'out' },
  { id: 4, name: 'French Fries', category: 'Ingredients', quantity: 245, unit: 'kg', minStock: 50, value: '$490.00', supplier: 'Food Supply Co', status: 'ok' },
  { id: 5, name: 'Chicken Wings', category: 'Ingredients', quantity: 32, unit: 'kg', minStock: 30, value: '$320.00', supplier: 'Prime Meats', status: 'ok' },
  { id: 6, name: 'Cola Syrup', category: 'Beverages', quantity: 8, unit: 'L', minStock: 20, value: '$120.00', supplier: 'Beverage Plus', status: 'low' },
];

export default function Inventory() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Inventory Management</h1>
          <p className="text-sm md:text-base text-tertiary">Track and manage restaurant inventory</p>
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
      
      {/* Stock Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stockOverview.map((item, index) => (
          <Card key={index} hover className="animate-slide-up bg-secondary border-base">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-tertiary mb-1">{item.label}</p>
                <h3 className="text-2xl font-black text-white">{item.value}</h3>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}30` }}
              >
                <Package className="w-6 h-6" style={{ color: item.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Low Stock Alerts */}
      <Card className="bg-secondary border-base overflow-hidden">
        <div className="p-5 border-b border-base/50 bg-white/5 flex items-center gap-3">
          <div className="p-2 bg-warning/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Low Stock Alerts</h3>
            <p className="text-xs text-tertiary">Items that need restocking soon</p>
          </div>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {inventoryItems.filter(item => item.status === 'low' || item.status === 'out').map(item => (
              <div 
                key={item.id}
                className="p-4 bg-bg-main border border-base rounded-xl group hover:border-warning/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">{item.name}</h4>
                  {item.status === 'out' ? (
                    <Badge variant="error" size="sm">Out</Badge>
                  ) : (
                    <Badge variant="warning" size="sm">Low</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <TrendingDown className="w-4 h-4 text-warning" />
                  <span className="text-tertiary">
                    {item.quantity} {item.unit} (Min: {item.minStock})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'ingredients', label: 'Ingredients' },
              { value: 'beverages', label: 'Beverages' },
              { value: 'supplies', label: 'Supplies' },
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'ok', label: 'In Stock' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ]}
          />
        </div>
      </div>
      
      {/* Inventory Table */}
      <div className="bg-secondary border border-base rounded-2xl overflow-x-auto shadow-2xl scrollbar-thin">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="bg-white/5 border-b border-base text-[10px] uppercase tracking-widest">
              <th className="px-6 py-5 text-left font-black text-tertiary">Item Name</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Category</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Quantity</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Min Stock</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Value</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Supplier</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Status</th>
              <th className="px-6 py-5 text-right font-black text-tertiary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base/30">
            {filteredItems.map(item => (
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
                  <span className={`font-black ${
                    item.status === 'out' ? 'text-error' :
                    item.status === 'low' ? 'text-warning' :
                    'text-white'
                  }`}>
                    {item.quantity} {item.unit}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-tertiary text-sm">{item.minStock} {item.unit}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="font-black text-accent">${item.value.replace('$', '')}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white text-sm font-medium">{item.supplier}</span>
                </td>
                <td className="px-6 py-4">
                  {item.status === 'ok' && <Badge variant="success">In Stock</Badge>}
                  {item.status === 'low' && <Badge variant="warning">Low Stock</Badge>}
                  {item.status === 'out' && <Badge variant="error" className="animate-pulse">Out of Stock</Badge>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="secondary" size="sm" className="bg-white/5 border-base hover:bg-white/10">
                      Restock
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Inventory Item"
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
            <Input label="Item Name" placeholder="e.g., Burger Buns" />
            <Select
              label="Category"
              options={[
                { value: '', label: 'Select category' },
                { value: 'ingredients', label: 'Ingredients' },
                { value: 'beverages', label: 'Beverages' },
                { value: 'supplies', label: 'Supplies' },
              ]}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <Input label="Quantity" placeholder="0" type="number" />
            <Input label="Unit" placeholder="e.g., kg, pcs, L" />
            <Input label="Min Stock Level" placeholder="0" type="number" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unit Price" placeholder="0.00" type="number" />
            <Input label="Supplier" placeholder="e.g., Food Supply Co" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
