"use client"

import React, { useState } from 'react';
import { Button, IconButton } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ChevronRight, ShoppingCart } from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Items' },
  { id: 'burgers', name: 'Burgers' },
  { id: 'pizza', name: 'Pizza' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'sides', name: 'Sides' },
];

const products = [
  { id: 1, name: 'Royal Cheese Burger', price: 12.99, category: 'burgers', image: '/api/placeholder/150/150' },
  { id: 2, name: 'Spicy Chicken Wings', price: 8.99, category: 'sides', image: '/api/placeholder/150/150' },
  { id: 3, name: 'Margherita Pizza', price: 14.50, category: 'pizza', image: '/api/placeholder/150/150' },
  { id: 4, name: 'Chocolate Shake', price: 5.50, category: 'drinks', image: '/api/placeholder/150/150' },
  { id: 5, name: 'French Fries', price: 4.50, category: 'sides', image: '/api/placeholder/150/150' },
  { id: 6, name: 'Caesar Salad', price: 9.99, category: 'sides', image: '/api/placeholder/150/150' },
  { id: 7, name: 'Beef Tacos', price: 10.50, category: 'sides', image: '/api/placeholder/150/150' },
  { id: 8, name: 'Lemonade', price: 3.50, category: 'drinks', image: '/api/placeholder/150/150' },
];

export default function POS() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [cart, setCart] = useState<{ id: number; name: string; price: number; quantity: number }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  return (
    <div className="flex flex-col lg:flex-row min-h-full gap-6 animate-fade-in text-white pb-8">
      {/* Product Section (Left) */}
      <div className="flex-1 flex flex-col gap-4 md:gap-6 min-w-0">
        {/* Categories */}
        <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`
                px-4 md:px-6 py-2.5 md:py-3 rounded-xl whitespace-nowrap text-sm md:text-base font-medium transition-all
                ${activeCategory === cat.id 
                  ? 'bg-[#8B0000] text-white shadow-md' 
                  : 'bg-[#1F1F1F] text-[#B3B3B3] hover:bg-[#2A2A2A] hover:text-white'
                }
              `}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Input 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-3 md:p-4 cursor-pointer hover:border-[#D4AF37] hover:shadow-lg transition-all active:scale-95 group"
              >
                <div className="aspect-square bg-[#2A2A2A] rounded-lg mb-2 md:mb-3 overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-[#2A2A2A] to-[#333333] group-hover:scale-110 transition-transform duration-500" />
                </div>
                <h3 className="font-semibold text-white text-sm md:text-base mb-1 truncate">{product.name}</h3>
                <p className="text-[#D4AF37] font-bold text-sm md:text-base">${product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cart Section (Right) */}
      <div className="w-full lg:w-[380px] xl:w-[420px] bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl flex flex-col shadow-xl h-fit lg:sticky lg:top-24">
        <div className="p-5 md:p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-bold text-white">Current Order</h2>
            <Badge variant="warning" size="sm">Table 5</Badge>
          </div>
          <p className="text-sm text-[#B3B3B3]">Walk-in Customer</p>
        </div>
        
        {/* Cart Items */}
        <div className="max-h-[400px] lg:max-h-[none] overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#B3B3B3] opacity-50">
              <div className="w-16 h-16 bg-[#2A2A2A] rounded-full flex items-center justify-center mb-4 border border-base">
                <ShoppingCart className="w-8 h-8 text-tertiary" />
              </div>
              <p className="text-sm font-medium">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] group hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-[#2A2A2A] to-[#252525] rounded-lg flex-shrink-0 border border-base" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                  <p className="text-[#D4AF37] text-xs font-bold">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                    className="w-7 h-7 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                    className="w-7 h-7 rounded-lg bg-[#8B0000] hover:bg-[#A80000] flex items-center justify-center text-white transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Totals & Actions */}
        <div className="p-5 md:p-6 bg-[#1A1A1A] border-t border-[#2A2A2A] rounded-b-2xl">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[#B3B3B3] text-sm">
              <span>Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#B3B3B3] text-sm">
              <span>Tax (10%)</span>
              <span className="text-white">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-black text-white pt-3 border-t border-[#2A2A2A]">
              <span>Total</span>
              <span className="text-[#D4AF37]">${total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-all">
              <Banknote className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Cash</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#8B0000] text-white shadow-lg shadow-primary/20 ring-1 ring-primary-hover active:scale-95 transition-all">
              <CreditCard className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Card</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#2A2A2A] hover:bg-[#333333] text-[#B3B3B3] hover:text-white transition-all">
              <Smartphone className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider">App</span>
            </button>
          </div>
          
          <Button 
            variant="primary" 
            fullWidth 
            size="lg"
            className="text-white font-black h-14 bg-gradient-to-r from-primary to-primary-hover shadow-glow-primary hover:shadow-glow-primary/50 transition-all border-none"
            disabled={cart.length === 0}
          >
            Process Payment
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
