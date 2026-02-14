"use client"

import React, { useState } from 'react';
import { Tabs } from '@/src/components/DukesTabs';
import { Clock, User, CheckCircle2 as CheckCircle } from 'lucide-react';

const orders = [
  {
    id: '#1248',
    table: 'Table 5',
    items: ['2x Classic Burger', '1x Cheese Fries', '2x Cola'],
    time: '2:34',
    status: 'pending',
    priority: 'normal'
  },
  {
    id: '#1247',
    table: 'Table 12',
    items: ['1x BBQ Burger', '1x Onion Rings', '1x Milkshake'],
    time: '5:12',
    status: 'preparing',
    priority: 'normal'
  },
  {
    id: '#1246',
    table: 'Table 3',
    items: ['3x Chicken Burger', '3x French Fries', '3x Iced Tea'],
    time: '8:45',
    status: 'preparing',
    priority: 'high'
  },
  {
    id: '#1245',
    table: 'Table 8',
    items: ['1x Deluxe Burger', '1x Chicken Wings', '1x Lemonade'],
    time: '1:23',
    status: 'ready',
    priority: 'normal'
  },
];

const statusTabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'pending', label: 'Pending' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
];

export default function KitchenDisplay() {
  const [activeStatus, setActiveStatus] = useState('all');
  
  const filteredOrders = activeStatus === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeStatus);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-warning';
      case 'preparing': return 'border-info';
      case 'ready': return 'border-success';
      default: return 'border-base';
    }
  };
  
  const getPriorityBadge = (priority: string) => {
    if (priority === 'high') {
      return (
        <span className="px-2 py-1 bg-error-bg text-error text-[10px] font-black uppercase tracking-wider rounded-lg border border-error/20">
          High priority
        </span>
      );
    }
    return null;
  };
  
  return (
    <div className="flex flex-col min-h-full animate-fade-in pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">Kitchen Display</h1>
        <Tabs 
          tabs={statusTabs} 
          activeTab={activeStatus} 
          onChange={setActiveStatus}
        />
      </div>
      
      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredOrders.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
              <div 
                key={order.id}
                className={`
                  bg-secondary border-2 ${getStatusColor(order.status)}
                  rounded-2xl p-6 shadow-xl flex flex-col
                  animate-scale-in relative group
                `}
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{order.id}</h3>
                    <p className="text-sm text-tertiary flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {order.table}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-accent mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-xl font-black">{order.time}</span>
                    </div>
                    {getPriorityBadge(order.priority)}
                  </div>
                </div>
                
                {/* Order Items */}
                <div className="flex-1 mb-6">
                  <div className="space-y-3">
                    {order.items.map((item, index) => (
                      <div 
                        key={index}
                        className="px-4 py-3 bg-bg-main/50 rounded-xl border border-base/50 flex items-center gap-3"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <p className="text-sm text-white font-bold">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="space-y-3 pt-4 border-t border-base">
                  {order.status === 'pending' && (
                    <button className="w-full px-4 py-3 bg-info text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-info-bg transition-all active:scale-95">
                      Start Preparing
                    </button>
                  ) || order.status === 'preparing' && (
                    <button className="w-full px-4 py-3 bg-success text-white font-black text-sm uppercase tracking-widest rounded-xl hover:bg-success-bg transition-all active:scale-95">
                      Mark as Ready
                    </button>
                  ) || order.status === 'ready' && (
                    <button className="w-full px-4 py-3 bg-base text-tertiary font-black text-sm uppercase tracking-widest rounded-xl hover:text-white flex items-center justify-center gap-2 transition-all active:scale-95">
                      <CheckCircle className="w-5 h-5" />
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center bg-secondary/30 rounded-3xl border-2 border-dashed border-base">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">👨‍🍳</div>
            <h3 className="text-xl font-bold text-white mb-2">No {activeStatus} orders found</h3>
            <p className="text-tertiary">All caught up! Orders will appear here in real-time.</p>
          </div>
        )}
      </div>
    </div>
  );
}
