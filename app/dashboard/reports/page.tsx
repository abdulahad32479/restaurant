"use client"

import React, { useEffect, useState } from 'react';
import { KPICard, Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Calendar, Download, TrendingUp, DollarSign, Users, ShoppingBag, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportService } from '@/src/services/report.service';
import { branchService } from '@/src/services/branch.service';
import { SalesByBranchReport, SalesByProductReport, SalesSummary, PaymentSummaryReport, LowStockReport, ZReport, Branch } from '@/src/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';

const PIE_COLORS = ['#8B0000', '#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Reports() {
  const { hasPermission } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [byBranch, setByBranch] = useState<SalesByBranchReport[]>([]);
  const [byProduct, setByProduct] = useState<SalesByProductReport[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryReport[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReport[]>([]);
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
        const [s, bb, bp, ps, ls, bData] = await Promise.all([
          reportService.getSalesSummary(filters),
          reportService.getSalesByBranch(filters),
          reportService.getSalesByProduct(filters),
          reportService.getPaymentSummary(filters),
          reportService.getLowStock(),
          branchService.getAll()
        ]);
        setSummary(s);
        setByBranch(bb);
        setByProduct(bp);
        setPaymentSummary(ps);
        setLowStock(ls);
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
  }, [startDate, endDate]);

  if (!hasPermission('view_reports')) return null;

  const handleGenerateZReport = async () => {
    if (!zForm.counted_cash) {
      toast.error('Please enter the counted cash amount');
      return;
    }
    setIsGeneratingZ(true);
    try {
      // Strictly follow Swagger schema: counted_cash, custom_start, custom_end
      const report = await reportService.generateZReport({
        counted_cash: zForm.counted_cash,
        custom_start: zForm.custom_start || undefined,
        custom_end: zForm.custom_end || undefined
      });
      setZReport(report);
      toast.success('Z-Report generated successfully!');
    } catch (e: any) {
      console.error('Failed to generate Z-Report', e);
      toast.error(e.response?.data?.detail || 'Failed to generate Z-Report');
    } finally {
      setIsGeneratingZ(false);
    }
  };

  const categoryData = byProduct.map((p, i) => ({ name: p.product__name, value: p.quantity_sold, color: PIE_COLORS[i % PIE_COLORS.length] }));
  const salesData = byBranch.map(b => ({ name: b.branch__name, sales: parseFloat(b.total_sales || '0') }));

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
        <KPICard title="Gross Revenue" value={`Rs. ${parseFloat(summary?.total_sales || '0').toLocaleString()}`} change="+14.2% vs last week" changeType="positive" icon={<DollarSign />} iconBg="bg-primary/10 text-primary border border-primary/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Total Orders" value={`${summary?.total_orders || 0}`} change="+8.5% vs last week" changeType="positive" icon={<ShoppingBag />} iconBg="bg-accent/10 text-accent border border-accent/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Volume Sold" value={`${summary?.total_items_sold || 0}`} change="Stable" changeType="neutral" icon={<TrendingUp />} iconBg="bg-blue-500/10 text-blue-400 border border-blue-500/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
        <KPICard title="Revenue Streams" value={`${paymentSummary.length || 0}`} change="Diversified" changeType="positive" icon={<Users />} iconBg="bg-success/10 text-success border border-success/20" className="bg-[#0A0A0A] border-base shadow-2xl" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="mb-8 relative z-10">
            <h3 className="text-xl font-black text-white  uppercase tracking-tighter">Branch Performance</h3>
            <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Regional revenue breakdown</p>
          </div>
          <div className="h-[300px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#666" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0A0A', border: '1px solid #222', borderRadius: '16px', padding: '12px' }} />
                <Bar dataKey="sales" fill="#8B0000" radius={[8, 8, 0, 0]} barSize={40} />
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

      {/* Low Stock & Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white  uppercase tracking-tighter mb-8">Supply Chain Alerts</h3>
          <div className="space-y-4">
            {lowStock.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-[#EF444405] border border-[#EF444415] rounded-2xl group hover:border-[#EF444430] transition-all">
                <div>
                  <p className="font-black text-white uppercase text-xs tracking-tight">Depleted: {l.product__name}</p>
                  <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mt-1">Remaining: <span className="text-error">{l.quantity}</span> / Threshold: {l.min_quantity}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-[#EF444410] flex items-center justify-center font-black text-rose-500  border border-rose-500/20 shadow-lg shadow-rose-500/10">
                  {l.quantity}
                </div>
              </div>
            ))}
            {!lowStock.length && <p className="text-tertiary text-[10px] font-black uppercase tracking-widest py-10 text-center">All systems nominal.</p>}
          </div>
        </div>

        <div className="bg-[#111111] border border-base rounded-[2rem] p-8 shadow-2xl">
          <h3 className="text-xl font-black text-white  uppercase tracking-tighter mb-8">Revenue Channels</h3>
          <div className="space-y-4">
            {paymentSummary.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-black/40 border border-base rounded-2xl group hover:border-accent/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-lg shadow-accent/10">
                    <DollarSign className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-tighter text-white">{p.method} Transactions</span>
                    <p className="text-[10px] text-tertiary font-black uppercase tracking-widest mt-1">Verified Digital Ledger</p>
                  </div>
                </div>
                <span className="font-black text-accent text-lg  tracking-tighter">Rs. {parseFloat(p.total || '0').toLocaleString()}</span>
              </div>
            ))}
            {!paymentSummary.length && <p className="text-tertiary text-[10px] font-black uppercase tracking-widest py-10 text-center">Awaiting financial sync...</p>}
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
                    <td className="px-8 py-5 text-sm text-center text-tertiary font-black ">{p.quantity_sold} Units</td>
                    <td className="px-8 py-5 text-sm text-right font-black text-white  tracking-tighter">Rs. {parseFloat(p.revenue || '0').toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
