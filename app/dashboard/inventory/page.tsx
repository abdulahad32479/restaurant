
"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { Modal } from '@/src/components/Modal';
import { Package, Plus, Search, RefreshCw } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { inventoryService } from '@/src/services/inventory.service';
import { productService } from '@/src/services/product.service';
import { branchService } from '@/src/services/branch.service';
import { InventoryItem, StockMovement, Product, Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockActionType, setStockActionType] = useState<'add' | 'reduce'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockForm, setStockForm] = useState({
    product: '',
    branch: '',
    quantity: 0,
    note: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [inventoryData, movementsData, productsData, branchesData] = await Promise.all([
        inventoryService.getAll(),
        inventoryService.getMovements(),
        productService.getAll(),
        branchService.getAll()
      ]) as [InventoryItem[], StockMovement[], Product[], Branch[]];
      setItems(inventoryData || []);
      setMovements(movementsData || []);
      setProducts(productsData || []);
      setBranches(branchesData || []);
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

  const handleStockSubmit = async () => {
    if (!stockForm.product || !stockForm.branch || stockForm.quantity <= 0) {
      toast.error('Please select a product, branch and enter a valid quantity');
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (stockActionType === 'add') {
        await inventoryService.addStock({ ...stockForm, note: stockForm.note || undefined });
        toast.success('Stock added successfully');
      } else {
        await inventoryService.reduceStock({ ...stockForm, note: stockForm.note || undefined });
        toast.success('Stock reduced successfully');
      }
      setIsStockModalOpen(false);
      setStockForm({ product: '', branch: '', quantity: 0, note: '' });
      fetchData();
    } catch (error: any) {
      console.error(`Failed to ${stockActionType} stock`, error);
      toast.error(error.response?.data?.detail || `Failed to ${stockActionType} stock`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => {
    const productName = (item.product_name || item.product).toLowerCase();
    const matchesSearch = productName.includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'all' || item.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  const toNum = (v: any) => parseFloat(String(v) || '0');

  const stats = {
    totalItems: items.length,
    lowStock: items.filter(i => toNum(i.quantity) > 0 && toNum(i.quantity) < toNum(i.min_quantity || 10)).length,
    outOfStock: items.filter(i => toNum(i.quantity) <= 0).length,
    totalQuantity: items.reduce((acc, i) => acc + toNum(i.quantity), 0)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl leading-none">Inventory Vault</h1>
          <p className="text-[10px] md:text-xs text-[#808080] font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent shadow-[0_0_10px_#D4AF37]"></span>
            </span>
            Real-time supply chain monitoring
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => {
              setStockActionType('add');
              setStockForm({ product: '', branch: '', quantity: 0, note: '' });
              setIsStockModalOpen(true);
            }}
            className="font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5 mr-2" />
            Stock Deployment
          </Button>
        </div>
      </div>
      
      {/* Stock Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Total Assets', value: stats.totalItems, color: '#8B0000' },
          { label: 'Low Reserves', value: stats.lowStock, color: '#F59E0B' },
          { label: 'Depleted', value: stats.outOfStock, color: '#EF4444' },
          { label: 'Net Volume', value: stats.totalQuantity.toFixed(0), color: '#10B981' },
        ].map((item, index) => (
          <Card key={index} hover className="animate-slide-up bg-[#0A0A0A] border-base p-6 shadow-2xl relative group overflow-hidden border-l-4" style={{ borderLeftColor: item.color }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent -mr-12 -mt-12 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">{item.label}</p>
                <h3 className="text-xl md:text-2xl font-black text-white  tracking-tighter">{item.value}</h3>
              </div>
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `${item.color}15`, border: `1px solid ${item.color}30` }}
              >
                <Package className="w-6 h-6 shadow-[0_0_10px_rgba(0,0,0,0.5)]" style={{ color: item.color }} />
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
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
        </div>
      </div>
      
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.25em]">
                <th className="px-6 py-6 text-left text-tertiary">Product Analysis</th>
                <th className="px-6 py-6 text-left text-tertiary">Logistics Center</th>
                <th className="px-6 py-6 text-center text-tertiary">Inventory</th>
                <th className="px-6 py-6 text-center text-tertiary">Threshold</th>
                <th className="px-6 py-6 text-center text-tertiary">Capacity</th>
                <th className="px-6 py-6 text-left text-tertiary">Risk Status</th>
                <th className="px-6 py-6 text-right text-tertiary">Operations</th>
              </tr>
            </thead>
          <tbody className="divide-y divide-base/30">
            {filteredItems.map(item => {
              const qty = toNum(item.quantity);
              const minQty = toNum(item.min_quantity);
              return (
                <tr 
                  key={item.id}
                  className="hover:bg-white/5 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-white group-hover:text-accent transition-colors">{item.product_name || item.product}</p>
                    <p className="text-[10px] text-tertiary font-mono">{item.product}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-tertiary">{item.branch_name || item.branch}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-black ${
                      qty <= minQty ? 'text-error' :
                      qty < minQty * 1.5 ? 'text-warning' :
                      'text-white'
                    }`}>
                      {qty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-tertiary">{item.min_quantity ?? '0'}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-tertiary">{item.max_quantity ?? '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {qty >= minQty && minQty > 0 && <Badge variant="success">In Stock</Badge>}
                    {qty > 0 && qty < minQty && <Badge variant="warning">Low Stock</Badge>}
                    {qty <= 0 && <Badge variant="error" className="animate-pulse">Out of Stock</Badge>}
                    {minQty <= 0 && qty > 0 && <Badge variant="success">In Stock</Badge>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-2 py-1 h-8 bg-success/10 text-success hover:bg-success/20 hover:text-success border-success/20"
                        onClick={() => {
                          setStockActionType('add');
                          setStockForm({ product: item.product, branch: item.branch, quantity: 0, note: '' });
                          setIsStockModalOpen(true);
                        }}
                      >
                        + Add
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="px-2 py-1 h-8 bg-error/10 text-error hover:bg-error/20 hover:text-error border-error/20"
                        onClick={() => {
                          setStockActionType('reduce');
                          setStockForm({ product: item.product, branch: item.branch, quantity: 0, note: '' });
                          setIsStockModalOpen(true);
                        }}
                      >
                        - Reduce
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
      </Card>

      {/* Stock Movements */}
      {movements.length > 0 && (
        <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
          <div className="px-6 py-5 border-b border-base bg-white/[0.02]">
            <h3 className="text-lg font-black text-white  uppercase tracking-tighter">Movement Ledger</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mt-1">Audit trail for stock adjustments</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="bg-white/[0.01] border-b border-base text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-6 py-4 text-left text-tertiary">Product</th>
                  <th className="px-6 py-4 text-left text-tertiary">Branch</th>
                  <th className="px-6 py-4 text-left text-tertiary">Type</th>
                  <th className="px-6 py-4 text-center text-tertiary">Qty</th>
                  <th className="px-6 py-4 text-left text-tertiary">Note</th>
                  <th className="px-6 py-4 text-left text-tertiary">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base/30">
                {movements.slice(0, 20).map(m => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm text-white font-bold group-hover:text-accent transition-all">{m.product_name}</td>
                    <td className="px-6 py-4 text-sm text-tertiary uppercase tracking-wider text-[10px] font-bold">{m.branch_name}</td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={m.movement_types === 'incoming' ? 'success' : 'error'} 
                        size="sm"
                        className="font-black uppercase tracking-widest text-[9px]"
                      >
                        {m.movement_types}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center font-black text-white ">
                      {m.movement_types === 'incoming' ? '+' : '-'}{m.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-tertiary font-medium">{m.notes || '-'}</td>
                    <td className="px-6 py-4 text-[10px] text-tertiary font-black uppercase tracking-widest">
                      {new Date(m.created_at).toLocaleDateString()}
                      <span className="block opacity-50">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Stock Action Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          setStockForm({ product: '', branch: '', quantity: 0, note: '' });
        }}
        title={stockActionType === 'add' ? 'Add Stock' : 'Reduce Stock'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsStockModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              variant="primary" 
              className={stockActionType === 'add' ? 'bg-success hover:bg-success/90 text-black' : 'bg-error hover:bg-error/90'}
              onClick={handleStockSubmit} 
              isLoading={isSubmitting}
            >
              {stockActionType === 'add' ? 'Confirm Addition' : 'Confirm Reduction'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-4 mb-6">
            <button 
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${stockActionType === 'add' ? 'bg-success/20 text-success border border-success/30' : 'bg-white/5 text-tertiary hover:bg-white/10'}`}
              onClick={() => setStockActionType('add')}
            >
              Add Stock
            </button>
            <button 
              className={`flex-1 py-2 rounded-lg font-bold transition-colors ${stockActionType === 'reduce' ? 'bg-error/20 text-error border border-error/30' : 'bg-white/5 text-tertiary hover:bg-white/10'}`}
              onClick={() => setStockActionType('reduce')}
            >
              Reduce Stock
            </button>
          </div>

          <Select
            label="Product"
            value={stockForm.product}
            onChange={(e) => setStockForm({...stockForm, product: e.target.value})}
            options={[
              { value: '', label: 'Select Product' },
              ...products.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          <Select
            label="Branch"
            value={stockForm.branch}
            onChange={(e) => setStockForm({...stockForm, branch: e.target.value})}
            options={[
              { value: '', label: 'Select Branch' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <Input 
            label="Quantity" 
            type="number" 
            placeholder="0"
            value={stockForm.quantity as any}
            onChange={(e) => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})}
          />
          <Input 
            label="Note (Optional)" 
            placeholder={stockActionType === 'add' ? "e.g., Delivery, Restock" : "e.g., Waste, Damaged"}
            value={stockForm.note}
            onChange={(e) => setStockForm({...stockForm, note: e.target.value})}
          />
        </div>
      </Modal>
    </div>
  );
}
