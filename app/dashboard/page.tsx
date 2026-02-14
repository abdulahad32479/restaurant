"use client"

import React from 'react';
import { KPICard } from '@/src/components/Card';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const salesData = [
  { name: 'Mon', sales: 4200 },
  { name: 'Tue', sales: 3800 },
  { name: 'Wed', sales: 5100 },
  { name: 'Thu', sales: 4500 },
  { name: 'Fri', sales: 6200 },
  { name: 'Sat', sales: 7800 },
  { name: 'Sun', sales: 6500 },
];

const topItems = [
  { name: 'Classic Burger', orders: 145, revenue: '$1,885' },
  { name: 'Cheese Fries', orders: 132, revenue: '$660' },
  { name: 'Chicken Wings', orders: 98, revenue: '$1,176' },
  { name: 'Milkshake', orders: 87, revenue: '$435' },
  { name: 'BBQ Burger', orders: 76, revenue: '$988' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-[#B3B3B3]">Welcome back! Here's what's happening today.</p>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Today's Revenue"
          value="$8,456"
          change="+12.5% from yesterday"
          changeType="positive"
          icon={<DollarSign className="w-6 h-6" />}
          iconBg="bg-[#8B0000]"
        />
        <KPICard
          title="Total Orders"
          value="156"
          change="+8.2% from yesterday"
          changeType="positive"
          icon={<ShoppingBag className="w-6 h-6" />}
          iconBg="bg-[#D4AF37]"
        />
        <KPICard
          title="Active Tables"
          value="12/24"
          change="50% occupancy"
          changeType="neutral"
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-[#3B82F6]"
        />
        <KPICard
          title="Avg Order Value"
          value="$54.21"
          change="+5.4% from yesterday"
          changeType="positive"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBg="bg-[#10B981]"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Weekly Sales</h3>
            <p className="text-sm text-[#B3B3B3]">Revenue trend for the past 7 days</p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
              <XAxis dataKey="name" stroke="#B3B3B3" />
              <YAxis stroke="#B3B3B3" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F1F1F', 
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  color: '#FFFFFF'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8B0000" 
                strokeWidth={3}
                dot={{ fill: '#8B0000', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Top Items */}
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Top Selling Items</h3>
            <p className="text-sm text-[#B3B3B3]">Best performing menu items today</p>
          </div>
          <div className="space-y-4">
            {topItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#8B0000] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-[#B3B3B3]">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#D4AF37]">{item.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Additional Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Recent Orders</h3>
            <p className="text-sm text-[#B3B3B3]">Latest order activity</p>
          </div>
          <div className="space-y-3">
            {[
              { id: '#1245', table: 'Table 5', amount: '$42.50', status: 'preparing', time: '2 mins ago' },
              { id: '#1244', table: 'Table 12', amount: '$67.80', status: 'ready', time: '5 mins ago' },
              { id: '#1243', table: 'Table 3', amount: '$38.20', status: 'completed', time: '12 mins ago' },
              { id: '#1242', table: 'Table 8', amount: '$55.40', status: 'completed', time: '18 mins ago' },
            ].map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] hover:border-[#333333] transition-colors">
                <div>
                  <p className="font-medium text-white">{order.id}</p>
                  <p className="text-sm text-[#B3B3B3]">{order.table}</p>
                </div>
                <div className="text-center">
                  <span className={`
                    px-3 py-1 rounded-lg text-sm font-medium
                    ${order.status === 'preparing' ? 'bg-[#3B82F615] text-[#3B82F6] border border-[#3B82F630]' : ''}
                    ${order.status === 'ready' ? 'bg-[#10B98115] text-[#10B981] border border-[#10B98130]' : ''}
                    ${order.status === 'completed' ? 'bg-[#6B728015] text-[#9CA3AF] border border-[#6B728030]' : ''}
                  `}>
                    {order.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#D4AF37]">{order.amount}</p>
                  <p className="text-xs text-[#B3B3B3]">{order.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Alerts */}
        <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-1">Alerts & Notifications</h3>
            <p className="text-sm text-[#B3B3B3]">Important updates requiring attention</p>
          </div>
          <div className="space-y-3">
            <div className="flex gap-4 p-4 bg-[#F59E0B15] border border-[#F59E0B30] rounded-xl">
              <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Low Stock Alert</p>
                <p className="text-sm text-[#B3B3B3] mt-1">Burger buns running low (15 units remaining)</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-[#3B82F615] border border-[#3B82F630] rounded-xl">
              <AlertCircle className="w-5 h-5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Peak Hour Alert</p>
                <p className="text-sm text-[#B3B3B3] mt-1">Lunch rush starting - 8 orders pending</p>
              </div>
            </div>
            <div className="flex gap-4 p-4 bg-[#10B98115] border border-[#10B98130] rounded-xl">
              <AlertCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">System Status</p>
                <p className="text-sm text-[#B3B3B3] mt-1">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
