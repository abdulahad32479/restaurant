"use client"

import React, { useEffect, useState } from 'react';
import { KPICard, Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input } from '@/src/components/Input';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingBag, 
  FileText, 
  Truck, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowUpRight,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area,
  Cell
} from 'recharts';
import { reportServiceV2, DashboardKPIs, DailySalesTrend, HourlyTrend, StaffPerformance, ProductPerformance, ZReportV2Response } from '@/src/services/report-v2.service';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function ReportsV2() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [dailyTrends, setDailyTrends] = useState<DailySalesTrend[]>([]);
  const [hourlyTrends, setHourlyTrends] = useState<HourlyTrend[]>([]);
  const [staffPerf, setStaffPerf] = useState<StaffPerformance[]>([]);
  const [productPerf, setProductPerf] = useState<ProductPerformance[]>([]);
  
  // Z-Report
  const [zResult, setZResult] = useState<ZReportV2Response | null>(null);
  const [isGeneratingZ, setIsGeneratingZ] = useState(false);
  const [zForm, setZForm] = useState({
    counted_cash: '',
    notes: '',
    custom_start: '',
    custom_end: ''
  });

  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!hasPermission('view_reports')) {
      toast.error('Access Denied');
      router.push('/dashboard');
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = { start_date: startDate, end_date: endDate };
        const [kpiData, dailyData, hourlyData, staffData, prodData] = await Promise.all([
          reportServiceV2.getDashboardKPIs(params),
          reportServiceV2.getDailySalesTrend(params),
          reportServiceV2.getHourlySalesTrend(params),
          reportServiceV2.getStaffPerformance(params),
          reportServiceV2.getProductPerformance(params)
        ]);

        setKpis(kpiData);
        setDailyTrends(dailyData);
        setHourlyTrends(hourlyData);
        setStaffPerf(staffData);
        setProductPerf(prodData);
      } catch (err) {
        console.error('v2 reports failed', err);
        toast.error('Failed to load advanced reports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate, hasPermission, router]);

  const handleGenerateZ = async () => {
    if (!zForm.counted_cash) return toast.error('Enter counted cash');
    setIsGeneratingZ(true);
    try {
      const res = await reportServiceV2.generateZReportV2({
        counted_cash: zForm.counted_cash,
        notes: zForm.notes || undefined,
        custom_start: zForm.custom_start || undefined,
        custom_end: zForm.custom_end || undefined
      });
      setZResult(res);
      toast.success('Z-Report generated');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Z-Report failed');
    } finally {
      setIsGeneratingZ(false);
    }
  };

  if (isLoading && !kpis) {
     return (
       <div className="flex items-center justify-center h-screen bg-black">
         <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-3">
             <BarChart3 className="text-primary w-8 h-8" />
             Reports v2.0
          </h1>
          <p className="text-[#606060] font-bold uppercase tracking-[0.3em] text-xs mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live Enterprise Intelligence
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-[#0A0A0A] border border-base p-4 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-tertiary" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
            />
            <span className="text-tertiary">/</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent border-none text-xs font-black uppercase tracking-widest focus:ring-0 cursor-pointer"
            />
          </div>
          <div className="h-6 w-px bg-base" />
          <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Export v2</Button>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Net Sales" 
          value={`Rs. ${parseFloat(kpis?.net_sales || '0').toLocaleString()}`} 
          change={`${kpis?.completed_orders} Orders`} 
          changeType="positive" 
          icon={<DollarSign />} 
          className="bg-primary/5 border-primary/20 shadow-[0_0_40px_-15px_#8B0000]"
        />
        <KPICard 
          title="Average Ticket" 
          value={`Rs. ${parseFloat(kpis?.avg_order_value || '0').toLocaleString()}`} 
          change="Per Customer" 
          changeType="neutral" 
          icon={<TrendingUp />} 
          className="bg-accent/5 border-accent/20"
        />
        <KPICard 
          title="Total Volume" 
          value={`${kpis?.items_sold || 0}`} 
          change={`${kpis?.voided_qty} Voided`} 
          changeType="negative" 
          icon={<ShoppingBag />} 
          className="bg-blue-500/5 border-blue-500/20"
        />
        <KPICard 
          title="Completion" 
          value={`${((kpis?.completed_orders || 0) / (kpis?.total_orders || 1) * 100).toFixed(1)}%`} 
          change={`${kpis?.cancelled_orders} Cancelled`} 
          changeType="neutral" 
          icon={<CheckCircle />} 
          className="bg-success/5 border-success/20"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Sales Trend */}
        <div className="lg:col-span-2 bg-[#0A0A0A] border border-base rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-transparent opacity-50" />
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Growth Trajectory</h3>
              <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1 italic">Daily Revenue & Volume Trends</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary italic">V2.0</span>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B0000" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8B0000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#404040" 
                  fontSize={10} 
                  fontWeight={900} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis stroke="#404040" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#8B0000" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Line type="monotone" dataKey="orders_count" stroke="#D4AF37" strokeWidth={2} dot={{ r: 4, fill: '#D4AF37' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Peak Intensity */}
        <div className="bg-[#0A0A0A] border border-base rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between">
          <div>
             <h3 className="text-xl font-black uppercase tracking-tighter">Hourly Density</h3>
             <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1 mb-8 italic">Rush Hour Analytics</p>
             <div className="space-y-6">
                {hourlyTrends.slice().sort((a,b) => parseFloat(b.sales) - parseFloat(a.sales)).slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-lg font-black italic text-primary">{h.hour}:00</div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-white">Peak Window</p>
                        <p className="text-[9px] text-tertiary font-bold uppercase">{h.orders_count} Trx</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black">Rs. {parseFloat(h.sales).toLocaleString()}</p>
                      <div className="w-20 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-accent" 
                          style={{ width: `${Math.min(100, (parseFloat(h.sales)/50000)*100)}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
          <Button variant="secondary" className="w-full h-12 uppercase tracking-[0.2em] font-black text-[10px] mt-8">View Heatmap</Button>
        </div>
      </div>

      {/* Grid of Tables/Summary v2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Performance Table */}
        <div className="bg-[#0A0A0A] border border-base rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-base bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Product ROI</h3>
            <ShoppingBag className="w-5 h-5 text-tertiary" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-tertiary">
                  <th className="px-8 py-5">Asset</th>
                  <th className="px-8 py-5 text-center">Qty</th>
                  <th className="px-8 py-5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {productPerf.slice(0, 8).map((p, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 font-black uppercase text-xs italic">{p.product__name}</td>
                    <td className="px-8 py-4 text-center font-bold text-tertiary text-xs">{parseFloat(p.quantity_sold).toFixed(0)}</td>
                    <td className="px-8 py-4 text-right font-black text-white text-xs">Rs. {parseFloat(p.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Staff Performance Table */}
        <div className="bg-[#0A0A0A] border border-base rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-base bg-white/[0.01] flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Staff Efficiency</h3>
            <Users className="w-5 h-5 text-tertiary" />
          </div>
          <div className="overflow-x-auto">
             <table className="w-full text-left">
              <thead>
                <tr className="bg-white/[0.02] text-[9px] font-black uppercase tracking-[0.2em] text-tertiary">
                  <th className="px-8 py-5">Personnel</th>
                  <th className="px-8 py-5 text-center">Orders</th>
                  <th className="px-8 py-5 text-right">Sales Contrib</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {staffPerf.slice(0, 8).map((s, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-black text-[10px] italic text-primary">
                        {s.created_by__username[0].toUpperCase()}
                      </div>
                      <span className="font-black uppercase text-xs italic text-white">{s.created_by__username}</span>
                    </td>
                    <td className="px-8 py-4 text-center font-bold text-tertiary text-xs">{s.total_orders}</td>
                    <td className="px-8 py-4 text-right font-black text-white text-xs">Rs. {parseFloat(s.total_sales).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Advanced Z-Report v2 */}
      <div className="bg-[#0A0A0A] border-2 border-primary/20 rounded-[3rem] p-10 shadow-[0_0_80px_-20px_#8B0000] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none" />
        
        <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-[0_10px_30px_rgba(139,0,0,0.4)]">
                    <BarChart3 className="text-white w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">Enterprise Reconciliation</h2>
                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-accent" />
                        Finalized Financial Audit v2.0
                    </p>
                </div>
            </div>
            {zResult && (
                <div className="px-6 py-2 bg-success/20 border border-success/30 rounded-full flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-success">Report Verified & Locked</span>
                </div>
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#505050]">Physical Count</label>
                <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                    <input 
                       type="number" 
                       value={zForm.counted_cash}
                       onChange={(e) => setZForm({...zForm, counted_cash: e.target.value})}
                       placeholder="Enter Counted Cash"
                       className="w-full bg-[#111] border-base rounded-2xl h-14 pl-12 font-black uppercase tracking-widest text-sm focus:border-primary transition-all outline-none"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#505050]">System Notes</label>
                <input 
                    type="text" 
                    value={zForm.notes}
                    onChange={(e) => setZForm({...zForm, notes: e.target.value})}
                    placeholder="Reference notes..."
                    className="w-full bg-[#111] border-base rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-xs focus:border-primary transition-all outline-none"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#505050]">Window Start</label>
                <input 
                    type="datetime-local" 
                    value={zForm.custom_start}
                    onChange={(e) => setZForm({...zForm, custom_start: e.target.value})}
                    className="w-full bg-[#111] border-base rounded-2xl h-14 px-6 font-black uppercase tracking-widest text-xs focus:border-primary transition-all outline-none"
                />
            </div>
            <div className="flex items-end">
                <Button 
                    variant="primary" 
                    className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] italic shadow-[0_10px_40px_rgba(139,0,0,0.3)]"
                    onClick={handleGenerateZ}
                    isLoading={isGeneratingZ}
                >
                    Finalize Audit
                </Button>
            </div>
        </div>

        {zResult && (
           <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 pt-10 border-t border-white/5 animate-slide-up">
              {[
                { label: 'Revenue', value: zResult.z_report.total_sales, color: 'text-white' },
                { label: 'Exp. Cash', value: zResult.z_report.total_cash, color: 'text-tertiary' },
                { label: 'Variance', value: zResult.z_report.cash_difference, color: parseFloat(zResult.z_report.cash_difference) < 0 ? 'text-error' : 'text-success' },
                { label: 'Inventory', value: parseFloat(zResult.z_report.total_items).toFixed(0), color: 'text-white' },
                { label: 'Cancelled', value: zResult.z_report.cancelled_orders, color: 'text-error' },
                { label: 'Anomalies', value: zResult.z_report.anomaly_flags || 'NONE', color: 'text-accent' }
              ].map((m, i) => (
                <div key={i} className="space-y-1">
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#404040]">{m.label}</p>
                   <p className={`text-lg font-black italic tracking-tighter ${m.color}`}>
                     {typeof m.value === 'string' && !isNaN(parseFloat(m.value)) ? `Rs. ${parseFloat(m.value).toLocaleString()}` : m.value}
                   </p>
                </div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
}
