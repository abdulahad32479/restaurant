"use client"

import React, { useState, useEffect } from 'react';
import { cn } from '@/src/lib/utils';
import { Card } from '@/src/components/Card';
import { Button } from '@/src/components/Button';
import { Input, Select, TextArea } from '@/src/components/Input';
import { Toggle } from '@/src/components/FormControls';
import { Modal } from '@/src/components/Modal';
import { Settings, User, Bell, Shield, Database, Printer, CreditCard, Plus, Download, Store, UserCircle, Edit, Trash2, Search, MapPin, Mail, Phone, Grid } from 'lucide-react';
import { Badge } from '@/src/components/Badge';
import { branchService } from '@/src/services/branch.service';
import { customerService } from '@/src/services/customer.service';
import { tableService } from '@/src/services/table.service';
import { Branch, Customer, Table } from '@/src/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';

const settingsTabs = [
  { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
  { id: 'branches', label: 'Branches', icon: <Store className="w-5 h-5" /> },
  { id: 'tables', label: 'Tables', icon: <Grid className="w-5 h-5" /> },
  { id: 'customers', label: 'Customers', icon: <UserCircle className="w-5 h-5" /> },
  { id: 'account', label: 'Account', icon: <User className="w-5 h-5" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-5 h-5" /> },
  { id: 'security', label: 'Security', icon: <Shield className="w-5 h-5" /> },
  { id: 'data', label: 'Data & Backup', icon: <Database className="w-5 h-5" /> },
  { id: 'printers', label: 'Printers', icon: <Printer className="w-5 h-5" /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" /> },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);

  const [branchForm, setBranchForm] = useState({ name: '', address: '', city: '', phone_number: '', email: '', is_active: true });
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', address: '', branch: '' });
  const [tableForm, setTableForm] = useState({ name: '', capacity: 4, branch: '', is_occupied: false, is_active: true });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
    sessionTimeout: '30'
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'general' && user?.branch) {
        const b = await branchService.getById(user.branch);
        setActiveBranch(b);
      }
      
      if (activeTab === 'branches' || activeTab === 'customers' || activeTab === 'tables' || activeTab === 'general') {
        const [bData] = await Promise.all([
          branchService.getAll()
        ]);
        setBranches(bData);
        
        if (activeTab === 'customers') {
          const cData = await customerService.getAll();
          setCustomers(cData);
        } else if (activeTab === 'tables') {
          const tData = await tableService.getAll();
          setTables(tData);
        }
      }
    } catch (error) {
      toast.error(`Failed to load data for ${activeTab}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleCreateBranch = async () => {
    try {
      setIsLoading(true);
      await branchService.create(branchForm);
      const data = await branchService.getAll();
      setBranches(data);
      setIsBranchModalOpen(false);
      setBranchForm({ name: '', address: '', city: '', phone_number: '', email: '', is_active: true });
      toast.success('Branch created');
    } catch (e) {
      console.error('Failed to create branch', e);
      toast.error('Failed to create branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBranch = async () => {
    if (!editingBranchId) return;
    try {
      setIsLoading(true);
      await branchService.update(editingBranchId, branchForm);
      const data = await branchService.getAll();
      setBranches(data);
      setIsBranchModalOpen(false);
      setEditingBranchId(null);
      setBranchForm({ name: '', address: '', city: '', phone_number: '', email: '', is_active: true });
      toast.success('Branch updated');
    } catch (e) {
      console.error('Failed to update branch', e);
      toast.error('Failed to update branch');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.name || !customerForm.branch) {
      toast.error('Name and Branch are required');
      return;
    }
    try {
      setIsLoading(true);
      await customerService.create(customerForm as any);
      const data = await customerService.getAll();
      setCustomers(data);
      setIsCustomerModalOpen(false);
      setCustomerForm({ name: '', phone: '', address: '', branch: '' });
      toast.success('Customer created');
    } catch (e) {
      console.error('Failed to create customer', e);
      toast.error('Failed to create customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomerId) return;
    try {
      setIsLoading(true);
      await customerService.update(editingCustomerId, customerForm as any);
      const data = await customerService.getAll();
      setCustomers(data);
      setIsCustomerModalOpen(false);
      setEditingCustomerId(null);
      setCustomerForm({ name: '', phone: '', address: '', branch: '' });
      toast.success('Customer updated');
    } catch (e) {
      console.error('Failed to update customer', e);
      toast.error('Failed to update customer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTable = async () => {
    try {
      setIsLoading(true);
      await tableService.create(tableForm);
      const data = await tableService.getAll();
      setTables(data);
      setIsTableModalOpen(false);
      setTableForm({ name: '', capacity: 4, branch: '', is_occupied: false, is_active: true });
      toast.success('Table created');
    } catch (e) {
      console.error('Failed to create table', e);
      toast.error('Failed to create table');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTableId) return;
    try {
      setIsLoading(true);
      await tableService.update(editingTableId, tableForm);
      const data = await tableService.getAll();
      setTables(data);
      setIsTableModalOpen(false);
      setEditingTableId(null);
      setTableForm({ name: '', capacity: 4, branch: '', is_occupied: false, is_active: true });
      toast.success('Table updated');
    } catch (e) {
      console.error('Failed to update table', e);
      toast.error('Failed to update table');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-white pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">Settings</h1>
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
          <Card className="p-5 md:p-8 bg-secondary border-base shadow-xl rounded-2xl min-h-[500px]">
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div>
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-accent" />
                    Restaurant Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Input label="Restaurant Name" defaultValue={activeBranch?.name || "Duke's Diner"} key={activeBranch?.id + 'name'} />
                    <Input label="Branch ID" defaultValue={activeBranch?.id || "BR-001"} disabled key={activeBranch?.id + 'id'} />
                    <Input label="Phone Number" defaultValue={activeBranch?.phone_number || "+1 (555) 123-4567"} key={activeBranch?.id + 'phone'} />
                    <Input label="Email" defaultValue={activeBranch?.email || "contact@dukesdiner.com"} key={activeBranch?.id + 'email'} />
                    <div className="md:col-span-2">
                      <Input label="Business Address" defaultValue={activeBranch?.address || "123 Main St, New York, NY 10001"} key={activeBranch?.id + 'address'} />
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-base">
                  <h3 className="text-xl font-bold text-white mb-6">Regional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Select 
                      label="Base Currency"
                      options={[
                        { value: 'pkr', label: 'PKR (Rs.)' },
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
            
            {activeTab === 'branches' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-accent" />
                    Branch Management
                  </h3>
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsBranchModalOpen(true)}>Add Branch</Button>
                </div>
                
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                  ) : (
                    branches.map(branch => (
                      <div key={branch.id} className="p-4 rounded-2xl bg-white/5 border border-base group hover:border-accent/30 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{branch.name}</p>
                            <p className="text-xs text-tertiary">{branch.city}, {branch.address}</p>
                          </div>
                        </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-tertiary hover:text-white"
                            onClick={() => {
                              setEditingBranchId(branch.id);
                              setBranchForm({ name: branch.name || '', address: branch.address || '', city: branch.city || '', phone_number: branch.phone_number || '', email: branch.email || '', is_active: !!branch.is_active });
                              setIsBranchModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-tertiary hover:text-error"
                            onClick={async () => {
                              if (!confirm('Delete this branch? This action cannot be undone.')) return;
                              try {
                                setIsLoading(true);
                                await branchService.delete(branch.id);
                                const data = await branchService.getAll();
                                setBranches(data);
                                toast.success('Branch deleted');
                              } catch (e) {
                                console.error('Failed to delete branch', e);
                                toast.error('Failed to delete branch');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {!isLoading && branches.length === 0 && <p className="text-center text-tertiary py-10 ">No branches found.</p>}
                </div>
              </div>
            )}

            {activeTab === 'tables' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Grid className="w-5 h-5 text-accent" />
                    Table Management
                  </h3>
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsTableModalOpen(true)}>Add Table</Button>
                </div>
                
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                  ) : (
                    tables.map(table => {
                      const branchName = branches.find(b => b.id === table.branch)?.name || table.branch_name || 'Unknown Branch';
                      return (
                        <div key={table.id} className="p-4 rounded-2xl bg-white/5 border border-base group hover:border-accent/30 transition-all flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent font-bold">
                              {table.name}
                            </div>
                            <div>
                              <p className="font-bold text-white">Table {table.name}</p>
                              <p className="text-xs text-tertiary">Capacity: {table.capacity} • {branchName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant={table.is_active ? 'success' : 'error'} size="sm">
                              {table.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            <Badge variant={table.is_occupied ? 'warning' : 'secondary'} size="sm">
                              {table.is_occupied ? 'Occupied' : 'Free'}
                            </Badge>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                              <button
                                className="p-2 text-tertiary hover:text-white"
                                onClick={() => {
                                  setEditingTableId(table.id);
                                  setTableForm({ 
                                    name: table.name || '', 
                                    capacity: table.capacity || 4, 
                                    branch: table.branch || '', 
                                    is_occupied: !!table.is_occupied, 
                                    is_active: !!table.is_active 
                                  });
                                  setIsTableModalOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 text-tertiary hover:text-error"
                                onClick={async () => {
                                  if (!confirm('Delete this table?')) return;
                                  try {
                                    setIsLoading(true);
                                    await tableService.delete(table.id);
                                    const data = await tableService.getAll();
                                    setTables(data);
                                    toast.success('Table deleted');
                                  } catch (e) {
                                    console.error('Failed to delete table', e);
                                    toast.error('Failed to delete table');
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {!isLoading && tables.length === 0 && <p className="text-center text-tertiary py-10 ">No tables found.</p>}
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-accent" />
                    Customer Directory
                  </h3>
                  <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setIsCustomerModalOpen(true)}>Add Customer</Button>
                </div>
                
                <div className="space-y-3">
                  {isLoading ? (
                    <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div></div>
                  ) : (
                    customers.map(customer => (
                      <div key={customer.id} className="p-4 rounded-2xl bg-white/5 border border-base group hover:border-accent/30 transition-all flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <User className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white">{customer.name}</p>
                            <p className="text-xs text-tertiary flex items-center gap-2">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                          </div>
                        </div>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="p-2 text-tertiary hover:text-white"
                            onClick={() => {
                              setEditingCustomerId(customer.id);
                              setCustomerForm({ name: customer.name || '', phone: customer.phone || '', address: customer.address || '', branch: customer.branch || '' });
                              setIsCustomerModalOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-tertiary hover:text-error"
                            onClick={async () => {
                              if (!confirm('Delete this customer?')) return;
                              try {
                                setIsLoading(true);
                                await customerService.delete(customer.id);
                                const data = await customerService.getAll();
                                setCustomers(data);
                                toast.success('Customer deleted');
                              } catch (e) {
                                console.error('Failed to delete customer', e);
                                toast.error('Failed to delete customer');
                              } finally {
                                setIsLoading(false);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {!isLoading && customers.length === 0 && <p className="text-center text-tertiary py-10 ">No customers found.</p>}
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
                      <Input label="Full Name / Username" defaultValue={user?.username || "Admin User"} key={user?.id + 'un'} />
                      <Input label="Employee / User ID" defaultValue={user?.id || "EMP-2026-0045"} disabled key={user?.id + 'id'} />
                    </div>
                    <Input label="Professional Email" defaultValue={user?.email || "admin@dukespos.com"} key={user?.id + 'em'} />
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
                      <h4 className="text-2xl font-black text-white">Rs. 299<span className="text-sm font-normal text-tertiary">/month</span></h4>
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
                    { id: 'INV-001', date: 'Feb 12, 2026', amount: 'Rs. 299.00', status: 'Paid' },
                    { id: 'INV-002', date: 'Jan 12, 2026', amount: 'Rs. 299.00', status: 'Paid' },
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
      {/* Modals for creating branch/customer */}
      <Modal
        isOpen={isBranchModalOpen}
        onClose={() => {
          setIsBranchModalOpen(false);
          setEditingBranchId(null);
        }}
        title={editingBranchId ? 'Edit Branch' : 'Create Branch'}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setIsBranchModalOpen(false); setEditingBranchId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingBranchId ? handleUpdateBranch : handleCreateBranch} isLoading={isLoading}>{editingBranchId ? 'Update' : 'Create'}</Button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3">
          <Input label="Name" value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
          <Input label="City" value={branchForm.city} onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })} />
          <Input label="Address" value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
          <Input label="Phone" value={branchForm.phone_number} onChange={(e) => setBranchForm({ ...branchForm, phone_number: e.target.value })} />
          <Input label="Email" value={branchForm.email} onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => { setIsCustomerModalOpen(false); setEditingCustomerId(null); }}
        title={editingCustomerId ? 'Edit Customer' : 'Create Customer'}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setIsCustomerModalOpen(false); setEditingCustomerId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingCustomerId ? handleUpdateCustomer : handleCreateCustomer} isLoading={isLoading}>{editingCustomerId ? 'Update' : 'Create'}</Button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-3">
          <Input label="Name" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} />
          <Select 
            label="Branch *"
            value={customerForm.branch}
            onChange={(e) => setCustomerForm({ ...customerForm, branch: e.target.value })}
            options={[
              { value: '', label: 'Select Branch' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <Input label="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
          <Input label="Address" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={isTableModalOpen}
        onClose={() => { setIsTableModalOpen(false); setEditingTableId(null); }}
        title={editingTableId ? 'Edit Table' : 'Create Table'}
        footer={(
          <>
            <Button variant="outline" onClick={() => { setIsTableModalOpen(false); setEditingTableId(null); }}>Cancel</Button>
            <Button variant="primary" onClick={editingTableId ? handleUpdateTable : handleCreateTable} isLoading={isLoading}>{editingTableId ? 'Update' : 'Create'}</Button>
          </>
        )}
      >
        <div className="grid grid-cols-1 gap-4">
          <Input label="Table Name / Number" value={tableForm.name} onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })} />
          <Input label="Capacity" type="number" value={tableForm.capacity as any} onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 0 })} />
          
          <Select 
            label="Branch"
            value={tableForm.branch}
            onChange={(e) => setTableForm({ ...tableForm, branch: e.target.value })}
            options={[
              { value: '', label: 'Select a branch' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />

          <div className="flex flex-col gap-3 mt-2">
            <Toggle 
              label="Active (Visible in POS)" 
              checked={tableForm.is_active} 
              onChange={(c) => setTableForm({ ...tableForm, is_active: c })} 
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
