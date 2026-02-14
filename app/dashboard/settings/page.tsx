"use client"

import React, { useState } from 'react';
import { cn } from '@/src/lib/utils';
import { VerticalTabs } from '@/src/components/DukesTabs';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Toggle } from '@/src/components/FormControls';
import { Settings, User, Bell, Shield, Database, Printer, CreditCard, Plus, Download } from 'lucide-react';
import { Badge } from '@/src/components/Badge';

const settingsTabs = [
  { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
  { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  { id: 'data', label: 'Data & Backup', icon: <Database className="w-5 h-5" /> },
  { id: 'printers', label: 'Printers', icon: <Printer className="w-5 h-5" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30'
  });

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Settings</h1>
          <p className="text-sm md:text-base text-tertiary">Manage system configuration and preferences</p>
        </div>
        <Button variant="primary" size="sm">Save All Changes</Button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        {/* Sidebar - Scrollable on mobile */}
        <div className="w-full lg:w-72 flex-shrink-0 overflow-x-auto lg:overflow-visible scrollbar-hide">
          <div className="flex lg:flex-col gap-2 min-w-max lg:min-w-0">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 whitespace-nowrap lg:whitespace-normal flex-1 lg:flex-none",
                  activeTab === tab.id 
                    ? "bg-primary text-white shadow-glow-primary border border-primary/20" 
                    : "text-tertiary hover:bg-white/5 hover:text-white border border-transparent"
                )}
              >
                {tab.icon}
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <Card className="p-5 md:p-8 bg-secondary border-base shadow-xl rounded-2xl">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent" />
                    Restaurant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Restaurant Name" defaultValue="Duke's Diner" />
                    <Input label="Branch ID" defaultValue="BR-001" disabled />
                    <Input label="Phone Number" defaultValue="+1 (555) 123-4567" />
                    <Input label="Email" defaultValue="contact@dukesdiner.com" />
                    <div className="md:col-span-2">
                      <Input label="Business Address" defaultValue="123 Main St, New York, NY 10001" />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-base">
                  <h3 className="text-xl font-bold text-white mb-6">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select 
                      label="Base Currency"
                      options={[
                        { value: 'usd', label: 'USD ($)' },
                        { value: 'eur', label: 'EUR (€)' },
                        { value: 'gbp', label: 'GBP (£)' },
                      ]}
                    />
                    <Select 
                      label="System Timezone"
                      options={[
                        { value: 'est', label: 'Eastern Time (ET)' },
                        { value: 'pst', label: 'Pacific Time (PT)' },
                        { value: 'utc', label: 'UTC' },
                      ]}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'account' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6">Account Profile</h3>
                <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-active flex items-center justify-center text-bg-main text-3xl font-black shadow-glow-accent">
                      A
                    </div>
                    <button className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-lg border-2 border-secondary shadow-lg hover:scale-110 transition-transform">
                      <User className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Full Name" defaultValue="Admin User" />
                      <Input label="Employee ID" defaultValue="EMP-2026-0045" disabled />
                    </div>
                    <Input label="Professional Email" defaultValue="admin@dukespos.com" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6">Security & Privacy</h3>
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">Two-Factor Authentication</p>
                      <p className="text-xs text-tertiary mt-1">Add an extra layer of security to your account.</p>
                    </div>
                    <Toggle 
                      checked={security.twoFactor} 
                      onChange={(c) => setSecurity({...security, twoFactor: c})} 
                    />
                  </div>
                  
                  <div className="space-y-4 pt-4">
                    <h4 className="text-sm font-bold text-accent uppercase tracking-wider">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="Current Password" type="password" placeholder="••••••••" />
                      <Input label="New Password" type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-base">
                    <Select 
                      label="Session Timeout (Minutes)"
                      options={[
                        { value: '15', label: '15 Minutes' },
                        { value: '30', label: '30 Minutes' },
                        { value: '60', label: '1 Hour' },
                        { value: '0', label: 'Never' },
                      ]}
                      defaultValue={security.sessionTimeout}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  <Toggle 
                    label="Order Assignment Alerts" 
                    checked={notifications.email} 
                    onChange={(c) => setNotifications({...notifications, email: c})} 
                  />
                  <Toggle 
                    label="Inventory Restock Notifications" 
                    checked={notifications.push} 
                    onChange={(c) => setNotifications({...notifications, push: c})} 
                  />
                  <Toggle 
                    label="System Status & Maintenance" 
                    checked={notifications.sms} 
                    onChange={(c) => setNotifications({...notifications, sms: c})} 
                  />
                </div>
              </div>
            )}

            {activeTab === 'printers' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center justify-between">
                  Connected Printers
                  <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>Add Printer</Button>
                </h3>
                <div className="space-y-4 text-white">
                  {[
                    { name: 'Kitchen Thermal 1', type: 'LAN', status: 'Online' },
                    { name: 'Receipt Printer (Main)', type: 'USB', status: 'Online' },
                    { name: 'Label Printer', type: 'WIFI', status: 'Offline' },
                  ].map((printer, i) => (
                    <div key={i} className="p-4 rounded-xl bg-secondary border border-base flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${printer.status === 'Online' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                          <Printer className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">{printer.name}</p>
                          <p className="text-xs text-tertiary">{printer.type} Connection</p>
                        </div>
                      </div>
                      <Badge variant={printer.status === 'Online' ? 'success' : 'error'}>{printer.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Database className="w-5 h-5 text-accent" />
                  Data & Backup
                </h3>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-bg-main border border-base">
                      <p className="font-bold text-white mb-1">Export System Data</p>
                      <p className="text-xs text-tertiary mb-4">Download a full backup of your restaurant configuration and history.</p>
                      <Button variant="secondary" size="sm" icon={<Download className="w-4 h-4" />}>Export JSON</Button>
                    </div>
                    <div className="p-4 rounded-xl bg-bg-main border border-base">
                      <p className="font-bold text-white mb-1">Import Data</p>
                      <p className="text-xs text-tertiary mb-4">Restore configuration from a previously exported backup file.</p>
                      <Button variant="secondary" size="sm" icon={<Plus className="w-4 h-4" />}>Select File</Button>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-base">
                    <h4 className="text-sm font-bold text-accent uppercase tracking-wider mb-4">Auto-Backup Frequency</h4>
                    <Select 
                      options={[
                        { value: 'daily', label: 'Daily (Every 24h)' },
                        { value: 'weekly', label: 'Weekly' },
                        { value: 'manual', label: 'Manual Only' },
                      ]}
                      defaultValue="daily"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Billing & Subscription
                </h3>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 border border-accent/20">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <Badge variant="accent" className="mb-2">Enterprise Plan</Badge>
                      <h4 className="text-2xl font-black text-white">$299<span className="text-sm font-normal text-tertiary">/month</span></h4>
                    </div>
                    <Button variant="accent" className="text-black font-bold">Manage Subscription</Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tertiary mb-1">Status</p>
                      <p className="text-sm font-bold text-success">Active</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-tertiary mb-1">Renewal</p>
                      <p className="text-sm font-bold text-white">Mar 12, 2026</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] uppercase tracking-widest text-tertiary mb-1">Payment Method</p>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Visa ending in •••• 4242
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-white mb-4">Recent Invoices</h4>
                  {[
                    { id: 'INV-001', date: 'Feb 12, 2026', amount: '$299.00', status: 'Paid' },
                    { id: 'INV-002', date: 'Jan 12, 2026', amount: '$299.00', status: 'Paid' },
                  ].map((inv, i) => (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-bg-main border border-base">
                      <div>
                        <p className="text-sm font-bold text-white">{inv.id}</p>
                        <p className="text-xs text-tertiary">{inv.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold text-white">{inv.amount}</span>
                        <Badge variant="success" size="sm">{inv.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
