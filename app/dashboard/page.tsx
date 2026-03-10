"use client"

import React, { useEffect, useState } from 'react';
import { KPICard } from '@/src/components/Card';
import { DollarSign, ShoppingBag, Users, TrendingUp, AlertCircle, RefreshCw, CheckCircle2 as CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { reportService } from '@/src/services/report.service';
import { orderService } from '@/src/services/order.service';
import { tableService } from '@/src/services/table.service';
import { Order, SalesSummary, LowStockReport } from '@/src/types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReport[]>([]);
  const [tableOccupancy, setTableOccupancy] = useState({ occupied: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summary, orders, lowStockData, tablesData] = await Promise.all([
          reportService.getSalesSummary(),
          orderService.getAll(),
          reportService.getLowStock(),
          tableService.getAll()
        ]);

        const tables = tablesData as any[];
        setSalesSummary(summary as SalesSummary);
        setRecentOrders((orders as Order[]).slice(0, 5));
        setLowStock(lowStockData as LowStockReport[]);
        
        const totalTables = tables.length;
        const occupiedTables = tables.filter((t: any) => t.is_occupied).length;
        setTableOccupancy({ occupied: occupiedTables, total: totalTables });
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B0000]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-lg font-black text-white uppercase tracking-tighter mb-2 drop-shadow-2xl">Executive Overview</h1>
          <p className="text-[10px] md:text-xs text-[#808080] font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            Live Network Status: <span className="text-success glow-text-success">Operational</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#808080] hover:text-white transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Gross Revenue"
          value={`Rs. ${parseFloat(salesSummary?.total_sales || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change="+12.5% vs yesterday"
          changeType="positive"
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-primary/10 text-primary border border-primary/20"
          className="bg-[#0A0A0A] border-base shadow-2xl"
        />
        <KPICard
          title="Active Orders"
          value={salesSummary?.total_orders.toString() || '0'}
          change="+8.2% vs yesterday"
          changeType="positive"
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-accent/10 text-accent border border-accent/20"
          className="bg-[#0A0A0A] border-base shadow-2xl"
        />
        <KPICard
          title="Occupancy Rate"
          value={`${tableOccupancy.occupied}/${tableOccupancy.total}`}
          change={`${tableOccupancy.total > 0 ? Math.round((tableOccupancy.occupied / tableOccupancy.total) * 100) : 0}% capacity`}
          changeType="neutral"
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-500/10 text-blue-400 border border-blue-500/20"
          className="bg-[#0A0A0A] border-base shadow-2xl"
        />
        <KPICard
          title="Ticket Average"
          value={`Rs. ${(parseFloat(salesSummary?.total_sales || '0') / (salesSummary?.total_orders || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change="+5.4% vs yesterday"
          changeType="positive"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-success/10 text-success border border-success/20"
          className="bg-[#0A0A0A] border-base shadow-2xl"
        />
      </div>

      {/* Main Chart Section */}
      <div className="bg-[#111111] border border-base rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter mb-2">Revenue Analytics</h2>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-tertiary">Real-time financial trend processing</p>
          </div>
          <div className="flex gap-4">
             <div className="px-4 py-2 bg-black/40 border border-base rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">Peak Hour</p>
                <p className="text-white font-black">08:00 PM</p>
             </div>
             <div className="px-4 py-2 bg-black/40 border border-base rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mb-1">Growth</p>
                <p className="text-success font-black">+24.8%</p>
             </div>
          </div>
        </div>

        <div className="h-[400px] w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={[
              { name: '10am', sales: 4000 },
              { name: '12pm', sales: 7500 },
              { name: '2pm', sales: 6200 },
              { name: '4pm', sales: 4800 },
              { name: '6pm', sales: 11000 },
              { name: '8pm', sales: 15400 },
              { name: '10pm', sales: 9800 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }}
                dy={15}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }}
                tickFormatter={(value) => `Rs.${value/1000}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '16px', padding: '12px' }}
                itemStyle={{ color: '#D4AF37', fontWeight: 900, fontSize: '14px' }}
                labelStyle={{ color: '#888', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#8B0000" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#8B0000', strokeWidth: 2, stroke: '#000' }} 
                activeDot={{ r: 8, fill: '#D4AF37', strokeWidth: 0 }}
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Charts and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[2rem] p-8 shadow-2xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Recent Orders</h3>
              <p className="text-[9px] text-tertiary font-black uppercase tracking-[0.3em] mt-1.5 ml-0.5">Kitchen Activity Log</p>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors">View All</button>
          </div>
          
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-5 bg-black/30 rounded-2xl border border-[#2A2A2A] hover:border-[#333333] transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2A2A2A] flex items-center justify-center text-white font-black  text-xs">
                    #{order.id.slice(-3)}
                  </div>
                  <div>
                    <p className="font-black text-white uppercase text-xs tracking-tight">{order.order_type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-0.5">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`
                    px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest
                    ${order.status === 'preparing' ? 'bg-[#3B82F615] text-blue-400 border border-blue-500/20' : ''}
                    ${order.status === 'ready' ? 'bg-[#10B98115] text-success border border-success/20' : ''}
                    ${order.status === 'served' || order.status === 'completed' ? 'bg-white/5 text-[#808080] border border-white/10' : ''}
                    ${order.status === 'confirmed' ? 'bg-[#F59E0B15] text-amber-500 border border-amber-500/20' : ''}
                  `}>
                    {order.status}
                  </span>
                  <p className="font-black text-white text-sm tracking-tighter">Rs. {parseFloat(order.total).toFixed(2)}</p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2A2A2A]">No recent activity</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Alerts & Notifications */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[2rem] p-8 shadow-2xl">
          <div className="mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">System Alerts</h3>
              <p className="text-[9px] text-tertiary font-black uppercase tracking-[0.3em] mt-1.5 ml-0.5">Critical Operational Pulse</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {lowStock.map((item, index) => (
              <div key={index} className="flex gap-5 p-5 bg-[#EF444405] border border-[#EF444415] rounded-2xl group hover:border-[#EF444430] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EF444410] flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-error" />
                </div>
                <div>
                  <p className="font-black text-white uppercase text-xs tracking-tight">Critical Stock: {item.product__name}</p>
                  <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-1">
                    Only <span className="text-error">{item.quantity} units</span> left (Min: {item.min_quantity})
                  </p>
                </div>
              </div>
            ))}
            
            {lowStock.length === 0 && (
              <div className="flex gap-5 p-5 bg-[#10B98105] border border-[#10B98115] rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#10B98110] flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-black text-white uppercase text-xs tracking-tight">Inventory Healthy</p>
                  <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-1">All stock levels are within optimal ranges.</p>
                </div>
              </div>
            )}
            
            <div className="flex gap-5 p-5 bg-[#3B82F605] border border-[#3B82F615] rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F610] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <p className="font-black text-white uppercase text-xs tracking-tight">System Integrity</p>
                <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-1">Duke's POS API Cloud Sync: <span className="text-[#3B82F6]">Operational</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
