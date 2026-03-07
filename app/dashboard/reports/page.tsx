"use client"

import React, { useEffect, useState } from 'react';
import { KPICard } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Calendar, Download, TrendingUp, DollarSign, Users, ShoppingBag, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { reportService } from '@/src/services/report.service';
import { branchService } from '@/src/services/branch.service';
import { SalesByBranchReport, SalesByProductReport, SalesSummary, PaymentSummaryReport, LowStockReport, ZReport, Branch } from '@/src/types';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#8B0000', '#D4AF37', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];

export default function Reports() {
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [byBranch, setByBranch] = useState<SalesByBranchReport[]>([]);
  const [byProduct, setByProduct] = useState<SalesByProductReport[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryReport[]>([]);
  const [lowStock, setLowStock] = useState<LowStockReport[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Z-Report state
  const [zReport, setZReport] = useState<ZReport | null>(null);
  const [isGeneratingZ, setIsGeneratingZ] = useState(false);
  const [zForm, setZForm] = useState({
    date: new Date().toISOString().split('T')[0],
    counted_cash: '', // Sent as string for backend Decimal field
    branch: ''
  });

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const [s, bb, bp, ps, ls, bData] = await Promise.all([
          reportService.getSalesSummary(),
          reportService.getSalesByBranch(),
          reportService.getSalesByProduct(),
          reportService.getPaymentSummary(),
          reportService.getLowStock(),
          branchService.getAll()
        ]);
        setSummary(s);
        setByBranch(bb);
        setByProduct(bp);
        setPaymentSummary(ps);
        setLowStock(ls);
        setBranches(bData);
        if (bData.length > 0) setZForm(f => ({ ...f, branch: bData[0].id }));
      } catch (e) {
        console.error('Failed to load reports', e);
        toast.error('Failed to load reports');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, []);

  const handleGenerateZReport = async () => {
    if (!zForm.branch || !zForm.counted_cash || !zForm.date) {
      toast.error('Please fill in all Z-Report fields');
      return;
    }
    setIsGeneratingZ(true);
    try {
      const report = await reportService.generateZReport(zForm);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-[#B3B3B3]">Sales performance and visual insights</p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" icon={<Calendar className="w-4 h-4" />}>Last 7 Days</Button>
          <Button variant="primary" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Total Revenue" value={`Rs. ${parseFloat(summary?.total_sales || '0').toFixed(2)}`} change="+0%" changeType="positive" icon={<DollarSign />} />
        <KPICard title="Total Orders" value={`${summary?.total_orders || 0}`} change="+0%" changeType="positive" icon={<ShoppingBag />} />
        <KPICard title="Items Sold" value={`${summary?.total_items_sold || 0}`} change="0%" changeType="neutral" icon={<TrendingUp />} />
        <KPICard title="Payment Methods" value={`${paymentSummary.length || 0}`} change="+0%" changeType="positive" icon={<Users />} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Sales by Branch</h3>
            <p className="text-sm text-tertiary">Revenue per branch</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }} />
                <Bar dataKey="sales" fill="#8B0000" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white">Sales by Product</h3>
            <p className="text-sm text-tertiary">Top selling products</p>
          </div>
          {categoryData.length > 0 ? (
            <>
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                      {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 border-b border-base/50 pb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-white truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-accent">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-tertiary text-sm py-10 text-center">No product sales data yet.</p>
          )}
        </div>
      </div>

      {/* Low Stock & Payment Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Low Stock Alerts</h3>
          <div className="space-y-3">
            {lowStock.map((l, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                <div>
                  <p className="font-bold">{l.product__name}</p>
                  <p className="text-sm text-tertiary">Remaining: {l.quantity} (Min: {l.min_quantity})</p>
                </div>
                <div className="text-error font-black text-lg">{l.quantity}</div>
              </div>
            ))}
            {!lowStock.length && <p className="text-tertiary text-sm py-4 text-center">No low stock items.</p>}
          </div>
        </div>

        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Payment Summary</h3>
          <div className="space-y-3">
            {paymentSummary.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-bold capitalize">{p.method}</span>
                </div>
                <span className="font-black text-accent">Rs. {parseFloat(p.total || '0').toFixed(2)}</span>
              </div>
            ))}
            {!paymentSummary.length && <p className="text-tertiary text-sm py-4 text-center">No payment data available.</p>}
          </div>
        </div>
      </div>

      {/* Sales by Product Table */}
      {byProduct.length > 0 && (
        <div className="bg-secondary border border-base rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold mb-4">Top Products by Revenue</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-tertiary border-b border-base">
                  <th className="text-left pb-3">Product</th>
                  <th className="text-center pb-3">Units Sold</th>
                  <th className="text-right pb-3">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base/30">
                {byProduct.map((p, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="py-3 text-sm font-bold text-white">{p.product__name}</td>
                    <td className="py-3 text-sm text-center text-tertiary">{p.quantity_sold}</td>
                    <td className="py-3 text-sm text-right font-black text-accent">Rs. {parseFloat(p.revenue || '0').toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                { label: 'Total Sales', value: `Rs. ${parseFloat(zReport.total_sales || '0').toFixed(2)}` },
                { label: 'Cash Sales', value: `Rs. ${parseFloat(zReport.total_cash || '0').toFixed(2)}` },
                { label: 'Card Sales', value: `Rs. ${parseFloat(zReport.total_card || '0').toFixed(2)}` },
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
