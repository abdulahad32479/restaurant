"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  ChevronRight, ShoppingCart, Store, LayoutGrid, X, Trash2
} from 'lucide-react';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { orderService } from '@/src/services/order.service';
import { Product, Category, Branch, Table, OrderType } from '@/src/types';
import toast from 'react-hot-toast';

export default function POS() {
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  // Selection state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  
  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, cData, bData, tData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
          branchService.getAll(),
          tableService.getAll()
        ]);
        
        setProducts(pData.filter((p: Product) => p.is_active));
        setCategories(cData);
        setBranches(bData);
        setTables(tData.filter((t: Table) => t.is_active));
        
        if (bData.length > 0) setSelectedBranch(bData[0].id);
      } catch (error) {
        console.error('Failed to fetch POS data', error);
        toast.error('Failed to load products or categories');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  const totalTax = cart.reduce((sum, item) => {
    const taxRate = parseFloat(item.product.tax_percentage || '10') / 100;
    return sum + (parseFloat(item.product.price) * item.quantity * taxRate);
  }, 0);
  const total = subtotal + totalTax;
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async (paymentMethod: 'cash' | 'card' | 'other') => {
    if (cart.length === 0) return;
    if (!selectedBranch) {
      toast.error('Please select a branch');
      return;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a table');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create order — only send fields the backend accepts
      const orderData: any = {
        branch: selectedBranch,
        order_type: orderType,
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
        })),
      };

      if (orderType === 'dine_in' && selectedTable) {
        orderData.table_id = selectedTable;
      }

      console.log('Sending order data:', JSON.stringify(orderData, null, 2));
      const newOrder = await orderService.create(orderData);
      console.log('Order created:', newOrder);
      
      // 2. Confirm the order
      try {
        await orderService.confirm(newOrder.id, newOrder);
        console.log('Order confirmed');
      } catch (confirmError) {
        console.error('Order confirmation failed', confirmError);
      }
      
      // 3. Process payment
      try {
        await orderService.addPayment(newOrder.id, {
          method: paymentMethod,
          amount: total.toFixed(2),
          idempotency_key: `POS-${Date.now()}`,
        });
        console.log('Payment added');
      } catch (paymentError) {
        console.error('Payment recording failed', paymentError);
        toast.error('Order created but payment recording failed');
      }

      toast.success('Order placed successfully!');
      setCart([]);
      setSelectedTable('');
    } catch (error: any) {
      console.error('Checkout failed', error);
      const errorData = error.response?.data;
      
      let errorMessage = 'Failed to complete order';
      
      if (typeof errorData === 'string' && !errorData.includes('<!doctype html>')) {
        errorMessage = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        errorMessage = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(', ');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-full gap-6 animate-fade-in text-white pb-8">
      {/* Product Section (Left) */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Header Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select 
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedTable('');
            }}
            options={[
              { value: '', label: 'Select Branch' },
              ...branches.map(br => ({ value: br.id, label: br.name }))
            ]}
            icon={<Store className="w-4 h-4" />}
            className="bg-[#1A1A1A] border-[#2A2A2A]"
          />

          <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A]">
            <button 
              onClick={() => {
                setOrderType('dine_in');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'dine_in' ? 'bg-[#2A2A2A] text-white' : 'text-[#808080]'}`}
            >
              DINE IN
            </button>
            <button 
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${orderType === 'takeaway' ? 'bg-[#2A2A2A] text-white' : 'text-[#808080]'}`}
            >
              TAKEAWAY
            </button>
          </div>

          {orderType === 'dine_in' && (
            <Select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              options={[
                { value: '', label: 'Select Table' },
                ...tables
                  .filter(t => !selectedBranch || t.branch === selectedBranch)
                  .map(t => ({
                    value: t.id,
                    label: `Table ${t.name} (Cap: ${t.capacity})`
                  }))
              ]}
              icon={<LayoutGrid className="w-4 h-4" />}
              className="bg-[#1A1A1A] border-[#2A2A2A]"
            />
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Input 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5 text-[#808080]" />}
            className="bg-[#1A1A1A] border-[#2A2A2A]"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all border ${
              activeCategory === 'all' 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all border ${
                activeCategory === cat.id 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 cursor-pointer hover:border-[#D4AF37]/50 transition-all active:scale-95 group"
              >
                <div className="aspect-square bg-[#0A0A0A] rounded-xl mb-3 overflow-hidden border border-[#2A2A2A]">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingCart className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-[#808080] text-[10px] font-mono">{product.sku}</p>
                  <p className="text-primary font-black text-sm">${parseFloat(product.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cart Section (Right) */}
      <div className="w-full lg:w-[400px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl flex flex-col shadow-2xl h-[calc(100vh-140px)] sticky top-24">
        <div className="p-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/30">
          <h2 className="text-xl font-bold italic uppercase tracking-tight">Order Details</h2>
          <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-1">
            {orderType.replace('_', ' ')} {selectedTable && `• Table ${tables.find(t => t.id === selectedTable)?.name || selectedTable}`}
          </p>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#2A2A2A]">
              <ShoppingCart className="w-16 h-16 mb-2" />
              <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A]/40 rounded-xl border border-[#2A2A2A]">
                <div className="w-12 h-12 bg-black rounded-lg shrink-0 border border-[#2A2A2A] overflow-hidden">
                  {item.product.image ? (
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs truncate uppercase">{item.product.name}</h4>
                  <p className="text-primary text-[10px] font-black">${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => updateQuantity(item.product.id, -item.quantity)}
                  className="p-1.5 text-[#EF444450] hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Totals & Actions */}
        <div className="p-6 bg-[#0A0A0A]/40 border-t border-[#2A2A2A]">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[#808080] text-[10px] font-bold uppercase tracking-[0.2em]">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#808080] text-[10px] font-bold uppercase tracking-[0.2em]">
              <span>Tax (Dynamic)</span>
              <span className="text-white">${totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-black text-white pt-4 border-t border-[#2A2A2A]">
              <span className="italic uppercase">Total</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
              onClick={() => handleCheckout('cash')}
              disabled={isProcessing || cart.length === 0}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#2A2A2A] hover:bg-[#333] font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              <Banknote className="w-4 h-4" />
              Cash
            </button>
            <button 
              onClick={() => handleCheckout('card')}
              disabled={isProcessing || cart.length === 0}
              className="flex items-center justify-center gap-2 py-4 rounded-xl bg-[#2A2A2A] hover:bg-[#333] font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              <CreditCard className="w-4 h-4" />
              Card
            </button>
          </div>
          
          <Button 
            variant="primary" 
            fullWidth 
            size="lg"
            className="text-white font-black h-16 text-base italic uppercase tracking-tight shadow-xl shadow-primary/20"
            disabled={cart.length === 0 || isProcessing}
            isLoading={isProcessing}
            onClick={() => handleCheckout('cash')}
          >
            Create Order
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="mt-4 flex items-center justify-center gap-1.5 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Live Sync Enabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
