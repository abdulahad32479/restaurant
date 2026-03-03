"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { AlertCircle, Package, Plus, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { inventoryService } from '@/src/services/inventory.service';
import { productService } from '@/src/services/product.service';
import { InventoryItem, StockMovement, Product } from '@/src/types';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inventoryData, movementsData, productsData] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getMovements(),
        productService.getAll()
      ]);
      setItems(inventoryData || []);
      setMovements(movementsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Failed to fetch inventory data', error);
      toast.error('Failed to load inventory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : productId;
  };

  const filteredItems = items.filter(item => {
    const productName = getProductName(item.product).toLowerCase();
    const matchesSearch = productName.includes(searchQuery.toLowerCase()) || 
                         item.product.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'all' || item.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(i => i.quantity > 0 && i.quantity < 10).length,
    outOfStock: items.filter(i => i.quantity <= 0).length,
    totalQuantity: items.reduce((acc, i) => acc + i.quantity, 0)
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Inventory Management</h1>
          <p className="text-sm md:text-base text-tertiary">Track and manage restaurant inventory</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Stock
          </Button>
        </div>
      </div>
      
      {/* Stock Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Items', value: stats.totalItems, color: '#8B0000' },
          { label: 'Low Stock', value: stats.lowStock, color: '#F59E0B' },
          { label: 'Out of Stock', value: stats.outOfStock, color: '#EF4444' },
          { label: 'Total Units', value: stats.totalQuantity, color: '#10B981' },
        ].map((item, index) => (
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
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Branches' },
              // In a real app, you'd fetch branches and populate this
            ]}
          />
        </div>
      </div>
      
      {/* Inventory Table */}
      <div className="bg-secondary border border-base rounded-2xl overflow-x-auto shadow-2xl scrollbar-thin">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-white/5 border-b border-base text-[10px] uppercase tracking-widest">
              <th className="px-6 py-5 text-left font-black text-tertiary">Product</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Branch</th>
              <th className="px-6 py-5 text-left font-black text-tertiary text-center">Current</th>
              <th className="px-6 py-5 text-left font-black text-tertiary text-center">Min</th>
              <th className="px-6 py-5 text-left font-black text-tertiary text-center">Max</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Last Updated</th>
              <th className="px-6 py-5 text-left font-black text-tertiary">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base/30">
            {filteredItems.map(item => (
              <tr 
                key={item.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4">
                  <p className="font-bold text-white group-hover:text-accent transition-colors">{getProductName(item.product)}</p>
                  <p className="text-[10px] text-tertiary font-mono">{item.product}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-tertiary">{item.branch}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`font-black ${
                    item.quantity <= (item.min_quantity || 0) ? 'text-error' :
                    item.quantity < (item.min_quantity || 0) * 1.5 ? 'text-warning' :
                    'text-white'
                  }`}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-tertiary">{item.min_quantity ?? '0'}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-tertiary">{item.max_quantity ?? '-'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-tertiary text-sm">{new Date(item.last_updated).toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  {item.quantity >= (item.min_quantity || 10) && <Badge variant="success">In Stock</Badge>}
                  {(item.quantity > 0 && item.quantity < (item.min_quantity || 10)) && <Badge variant="warning">Low Stock</Badge>}
                  {item.quantity <= 0 && <Badge variant="error" className="animate-pulse">Out of Stock</Badge>}
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-tertiary">
                  No inventory data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
