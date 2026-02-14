"use client"

import React from 'react';
import { KPICard } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Calendar, Download, TrendingUp, DollarSign, Users, ShoppingBag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const salesData = [
  { name: 'Mon', sales: 4200 },
  { name: 'Tue', sales: 3800 },
  { name: 'Wed', sales: 5100 },
  { name: 'Thu', sales: 4500 },
  { name: 'Fri', sales: 6200 },
  { name: 'Sat', sales: 7800 },
  { name: 'Sun', sales: 6500 },
];

const categoryData = [
  { name: 'Burgers', value: 45, color: '#8B0000' },
  { name: 'Drinks', value: 25, color: '#3B82F6' },
  { name: 'Sides', value: 20, color: '#F59E0B' },
  { name: 'Desserts', value: 10, color: '#10B981' },
];

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-[#B3B3B3]">Sales performance and visual insights</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" icon={<Calendar className="w-4 h-4" />}>
            Last 7 Days
          </Button>
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard
          title="Total Revenue"
          value="$45,231"
          change="+12.5% from last period"
          changeType="positive"
          icon={<DollarSign className="w-6 h-6" />}
          iconBg="bg-primary/20"
        />
        <KPICard
          title="Total Orders"
          value="2,345"
          change="+8.2% from last period"
          changeType="positive"
          icon={<ShoppingBag className="w-6 h-6" />}
          iconBg="bg-accent/20"
        />
        <KPICard
          title="Avg Order Value"
          value="$24.50"
          change="-2.1% from last period"
          changeType="negative"
          icon={<TrendingUp className="w-6 h-6" />}
          iconBg="bg-success/20"
        />
        <KPICard
          title="New Customers"
          value="156"
          change="+5.4% from last period"
          changeType="positive"
          icon={<Users className="w-6 h-6" />}
          iconBg="bg-blue-500/20"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Revenue Overview</h3>
            <p className="text-sm text-tertiary">Daily revenue trends</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="sales" fill="#8B0000" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Sales by Category</h3>
            <p className="text-sm text-tertiary">Performance across menu sections</p>
          </div>
          <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Pie */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">100%</span>
              <span className="text-[10px] uppercase tracking-widest text-tertiary">Total Sales</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-6 max-w-sm mx-auto">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-2 border-b border-base/50 pb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs font-medium text-white">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-accent">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
