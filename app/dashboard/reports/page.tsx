"use client"

import React, { useEffect, useState } from 'react';
import { KPICard, Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Calendar, Download, TrendingUp, DollarSign, Users, ShoppingBag, FileText, Bike } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportService, DashboardKPIs, OperationsSummary, DeliverySummary, StaffPerformance, ProductPerformance, PaymentReconciliation, DailySalesTrend, HourlyTrend, DeliveryPersonPerformance } from '@/src/services/report.service';
import { branchService } from '@/src/services/branch.service';
import { ZReport, Branch } from '@/src/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

const PIE_COLORS = ['#8B0000', '#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Reports() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardKPIs | null>(null);
  const [operations, setOperations] = useState<OperationsSummary | null>(null);
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummary | null>(null);
  const [staffPerf, setStaffPerf] = useState<StaffPerformance[]>([]);
  const [byProduct, setByProduct] = useState<ProductPerformance[]>([]);
  const [paymentRecon, setPaymentRecon] = useState<PaymentReconciliation | null>(null);
  const [dailyTrend, setDailyTrend] = useState<DailySalesTrend[]>([]);
  const [hourlyTrend, setHourlyTrend] = useState<HourlyTrend[]>([]);
  const [deliveryPerf, setDeliveryPerf] = useState<DeliveryPersonPerformance[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Z-Report state
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [isGeneratingZ, setIsGeneratingZ] = useState(false);
  const [zForm, setZForm] = useState({
    date: new Date().toISOString().split('T')[0],
    counted_cash: '', // Sent as string for backend Decimal field
    branch: '',
    custom_start: '',
    custom_end: ''
  });

  useEffect(() => {
    if (!hasPermission('view_reports')) {
      toast.error('Access Denied: You do not have permission to view reports');
      router.push('/dashboard');
    }
  }, [hasPermission, router]);

  useEffect(() => {
    if (!hasPermission('view_reports')) return;

    const fetch = async () => {
      setIsLoading(true);
      try {
        const filters = { start_date: startDate, end_date: endDate };
        const [dashKpis, ops, deliv, staff, prod, recon, daily, hourly, delPerf, bData] = await Promise.all([
          reportService.getDashboardKPIs(filters),
          reportService.getOperationsSummary(filters),
          reportService.getDeliverySummary(filters),
          reportService.getStaffPerformance(filters),
          reportService.getProductPerformance(filters),
          reportService.getPaymentReconciliation(filters),
          reportService.getDailySalesTrend(filters),
          reportService.getHourlySalesTrend(filters),
          reportService.getDeliveryPerformance(filters),
          branchService.getAll()
        ]);
        
        setSummary(dashKpis);
        setOperations(ops);
        setDeliverySummary(deliv);
        setStaffPerf(staff);
        setByProduct(prod);
        setPaymentRecon(recon);
        setDailyTrend(daily);
        setHourlyTrend(hourly);
        setDeliveryPerf(delPerf);
        setBranches(bData);
        if (bData.length > 0 && !zForm.branch) setZForm(f => ({ ...f, branch: bData[0].id }));
      } catch (e) {
        console.error('Failed to load reports', e);
        toast.error('Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [startDate, endDate, hasPermission, zForm.branch]);

  if (!hasPermission('view_reports')) return null;

  const handleGenerateZReport = async () => {
    if (!zForm.counted_cash) {
      toast.error('Please enter the counted cash amount');
      return;
    }
    setIsGeneratingZ(true);
    try {
      // Strictly follow Swagger schema: counted_cash, custom_start, custom_end
      const response = await reportService.generateZReportV2({
        counted_cash: zForm.counted_cash,
        custom_start: zForm.custom_start || undefined,
        custom_end: zForm.custom_end || undefined
      });
      
      // Map ZReportV2Response back to the legacy ZReport type for UI
      const r = response.z_report;
      const legacyReport: ZReport = {
        id: r.id,
        date: r.date,
        total_orders: r.total_orders,
        total_items: parseInt(r.total_items),
        total_sales: r.total_sales,
        total_cash: r.total_cash,
        total_card: r.total_card,
        total_tax: r.total_tax,
        total_discount: r.total_discount,
        total_other: r.total_other,
        counted_cash: r.counted_cash,
        cash_difference: r.cash_difference,
        start_time: r.start_time,
        end_time: r.end_time,
        is_locked: false, // Defaulting as not present in v2 initially
        branch: zForm.branch,
        closed_by: '',
        created_at: new Date().toISOString()
      };
      
      setZReport(legacyReport);
      toast.success('Z-Report generated successfully!');
    } catch (e: any) {
      console.error('Failed to generate Z-Report', e);
      toast.error(e.response?.data?.detail || 'Failed to generate Z-Report');
    } finally {
      setIsGeneratingZ(false);
    }
  };

  const categoryData = byProduct.slice(0, 10).map((p, i) => ({ 
    name: p.product__name, 
    value: parseFloat(p.quantity_sold), 
    color: PIE_COLORS[i % PIE_COLORS.length] 
  }));
  const salesTrendData = dailyTrend.map(d => ({ 
    name: d.day, 
    sales: parseFloat(d.sales || '0') 
  }));

  return (
    <div className="space-y-6 animate-fade-in text-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white  uppercase tracking-tighter mb-2">Operational Intelligence</h1>
          <p className="text-sm md:text-base text-[#808080] font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_#D4AF37]" />
            Deep Analytics & Financial Insights
          </p>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
             <label className="text-[8px] font-black uppercase tracking-widest text-tertiary">From</label>
             <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 bg-[#1A1A1A] border-base text-xs" />
          </div>
          <div className="space-y-1">
             <label className="text-[8px] font-black uppercase tracking-widest text-tertiary">To</label>
             <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 bg-[#1A1A1A] border-base text-xs" />
          </div>
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />} className="h-10 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Net Revenue" value={`Rs. ${parseFloat(summary?.net_sales || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}`} change="+14.2% vs last period" changeType="positive" icon={<DollarSign />} iconBg="bg-primary/10 text-primary border border-primary/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Total Orders" value={`${summary?.total_orders || 0}`} change="+8.5% vs last period" changeType="positive" icon={<ShoppingBag />} iconBg="bg-accent/10 text-accent border border-accent/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Items Dispatched" value={`${parseFloat(summary?.items_sold || '0')}`} change="Stable" changeType="neutral" icon={<TrendingUp />} iconBg="bg-blue-500/10 text-blue-400 border border-blue-500/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Avg Ticket" value={`Rs. ${parseFloat(summary?.avg_order_value || '0').toLocaleString()}`} change="Efficiency" changeType="positive" icon={<Users />} iconBg="bg-success/10 text-success border border-success/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-white  uppercase tracking-tighter">Hourly Peak Sales</h3>
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Intra-day revenue velocity</p>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyTrend.map(h => ({ hour: `${h.hour.toString().padStart(2, '0')}h`, sales: parseFloat(h.sales) }))} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="hour" stroke="#666" fontSize={8} fontWeight={900} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#666" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '16px', padding: '12px' }} />
                <Bar dataKey="sales" fill="#D4AF37" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-white  uppercase tracking-tighter">Daily Growth Trend</h3>
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Growth analysis over time</p>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={8} fontWeight={900} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#666" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '16px', padding: '12px' }} />
                <Bar dataKey="sales" fill="#8B0000" radius={[8, 8, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-white  uppercase tracking-tighter">Inventory Velocity</h3>
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Top asset distribution</p>
          </div>
          {categoryData.length > 0 ? (
            <div className="relative z-10">
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={10} dataKey="value" stroke="none">
                      {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '16px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-6">
                {categoryData.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 border-b border-base/30 pb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#B3B3B3] truncate max-w-[120px]">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-white ">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-tertiary text-[10px] font-black uppercase tracking-widest py-20 text-center">Data processing in progress...</p>
          )}
        </div>
      </div>

      {/* Performance Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white  uppercase tracking-tighter mb-8 leading-none">High-Performance Staff</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffPerf.slice(0, 4).map((staff, idx) => (
                  <div key={idx} className="p-5 bg-black/40 border border-base rounded-2xl hover:border-accent/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[10px] font-black ">
                        {staff.created_by__username.charAt(0).toUpperCase()}
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-white ">{staff.created_by__username}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase text-tertiary">Revenue</span>
                      <span className="text-xs font-black text-accent tracking-tighter">Rs. {parseFloat(staff.total_sales).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
          </div>

          <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl">
              <h3 className="text-xl font-black text-white  uppercase tracking-tighter mb-8 leading-none">Delivery Logistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {deliveryPerf.slice(0, 4).map((dp, idx) => (
                  <div key={idx} className="p-5 bg-black/40 border border-base rounded-2xl hover:border-blue-500/30 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-[10px] font-black ">
                         <Bike className="w-4 h-4" />
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-white ">{dp.delivery_person__name}</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-black uppercase text-tertiary">{dp.total_orders} Drops</span>
                      <span className="text-xs font-black text-white  tracking-tighter">Rs. {parseFloat(dp.total_sales).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
          </div>
      </div>

      {/* Sales by Product Table */}
      {byProduct.length > 0 && (
        <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
          <div className="px-8 py-6 border-b border-base bg-white/[0.02]">
             <h3 className="text-xl font-black text-white  uppercase tracking-tighter">Asset Liquidity Report</h3>
             <p className="text-[10px] font-black uppercase tracking-widest text-tertiary mt-1">Product-level revenue distribution</p>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full">
              <thead>
                <tr className="bg-white/[0.01] border-b border-base text-[10px] font-black uppercase tracking-[0.2em]">
                  <th className="px-8 py-6 text-left text-tertiary">Product Name</th>
                  <th className="px-8 py-6 text-center text-tertiary">Units Dispatched</th>
                  <th className="px-8 py-6 text-right text-tertiary">Net Revenue Generated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base/30">
                {byProduct.map((p, i) => (
                  <tr key={i} className="hover:bg-white/5 group transition-colors">
                    <td className="px-8 py-5 text-sm font-black text-white uppercase group-hover:text-accent transition-colors">{p.product__name}</td>
                    <td className="px-8 py-5 text-sm text-center text-tertiary font-black ">{parseFloat(p.quantity_sold)} Units</td>
                    <td className="px-8 py-5 text-sm text-right font-black text-white  tracking-tighter">Rs. {parseFloat(p.revenue || '0').toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payment Reconciliation */}
      <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white  uppercase tracking-tighter mb-8 leading-none">Financial Reconciliation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
             <div className="p-5 bg-black/40 border border-base rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-tertiary mb-2">Expected Revenue</p>
                <p className="text-xl font-black text-white ">Rs. {parseFloat(paymentRecon?.expected_total || '0').toLocaleString()}</p>
             </div>
             <div className="p-5 bg-black/40 border border-base rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-tertiary mb-2">Collected Total</p>
                <p className="text-xl font-black text-success">Rs. {parseFloat(paymentRecon?.collected_total || '0').toLocaleString()}</p>
             </div>
             <div className="p-5 bg-black/40 border border-base rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-tertiary mb-2">Variance / Diff</p>
                <p className={`text-xl font-black ${parseFloat(paymentRecon?.difference || '0') < 0 ? 'text-error' : 'text-success'}`}>
                  Rs. {parseFloat(paymentRecon?.difference || '0').toLocaleString()}
                </p>
             </div>
             <div className="p-5 bg-black/40 border border-base rounded-2xl">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-tertiary mb-2">Unpaid Completed</p>
                <p className="text-xl font-black text-amber-500">{paymentRecon?.unpaid_completed_orders}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {paymentRecon?.method_split.map((m, idx) => (
                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">{m.method}</span>
                   <span className="text-xs font-black text-white ">Rs. {parseFloat(m.total).toLocaleString()}</span>
                </div>
             ))}
          </div>
      </div>

      {/* Z-Report Section */}
      <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-accent" />
          <h3 className="text-lg font-bold">Generate Z-Report (End of Day)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            label="Date"
            type="date"
            value={zForm.date}
            onChange={(e) => setZForm({ ...zForm, date: e.target.value })}
          />
          <Input
            label="Counted Cash (Rs.)"
            type="number"
            placeholder="0.00"
            value={zForm.counted_cash}
            onChange={(e) => setZForm({ ...zForm, counted_cash: e.target.value })}
          />
          <Select
            label="Branch"
            value={zForm.branch}
            onChange={(e) => setZForm({ ...zForm, branch: e.target.value })}
            options={[
              { value: '', label: 'Select Branch' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
           <Input
            label="Custom Start Time (Optional)"
            type="datetime-local"
            value={zForm.custom_start}
            onChange={(e) => setZForm({ ...zForm, custom_start: e.target.value })}
          />
          <Input
            label="Custom End Time (Optional)"
            type="datetime-local"
            value={zForm.custom_end}
            onChange={(e) => setZForm({ ...zForm, custom_end: e.target.value })}
          />
        </div>
        <Button variant="primary" onClick={handleGenerateZReport} isLoading={isGeneratingZ}>
          Generate Z-Report
        </Button>

        {/* Z-Report Result */}
        {zReport && (
          <div className="mt-6 p-5 bg-bg-main border border-accent/30 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white">Z-Report — {zReport.date}</h4>
              {zReport.is_locked && <span className="text-xs bg-error/20 text-error px-2 py-1 rounded font-bold">LOCKED</span>}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Orders', value: zReport.total_orders },
                { label: 'Total Items', value: zReport.total_items },
                { label: 'Total Sales', value: `Rs. ${parseFloat(zReport.total_sales || '0').toFixed(2)}` },
                { label: 'Total Tax', value: `Rs. ${parseFloat(zReport.total_tax || '0').toFixed(2)}` },
                { label: 'Total Discount', value: `Rs. ${parseFloat(zReport.total_discount || '0').toFixed(2)}` },
                { label: 'Cash Transactions', value: `Rs. ${parseFloat(zReport.total_cash || '0').toFixed(2)}` },
                { label: 'Card Transactions', value: `Rs. ${parseFloat(zReport.total_card || '0').toFixed(2)}` },
                { label: 'Counted Cash', value: `Rs. ${parseFloat(zReport.counted_cash || '0').toFixed(2)}` },
                { label: 'Cash Difference', value: `Rs. ${parseFloat(zReport.cash_difference || '0').toFixed(2)}` },
                { label: 'Other Payments', value: `Rs. ${parseFloat(zReport.total_other || '0').toFixed(2)}` },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3">
                  <p className="text-[10px] uppercase tracking-widest text-tertiary mb-1">{item.label}</p>
                  <p className="font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
