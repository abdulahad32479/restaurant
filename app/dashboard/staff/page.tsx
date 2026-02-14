"use client"

import React, { useState } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Search, Edit, Trash2, UserPlus, Phone, Mail, Shield } from 'lucide-react';
import { Card } from '@/src/components/Card';

const staffData = [
  { id: 1, name: 'John Doe', role: 'Manager', email: 'john@dukes.com', phone: '+1 555-0101', status: 'active', shift: 'Morning' },
  { id: 2, name: 'Sarah Smith', role: 'Chef', email: 'sarah@dukes.com', phone: '+1 555-0102', status: 'active', shift: 'Evening' },
  { id: 3, name: 'Mike Johnson', role: 'Waiter', email: 'mike@dukes.com', phone: '+1 555-0103', status: 'on_leave', shift: 'Morning' },
  { id: 4, name: 'Emily Davis', role: 'Cashier', email: 'emily@dukes.com', phone: '+1 555-0104', status: 'active', shift: 'Evening' },
  { id: 5, name: 'Robert Wilson', role: 'Kitchen Staff', email: 'robert@dukes.com', phone: '+1 555-0105', status: 'terminated', shift: 'Night' },
];

const roles = [
  { id: 'manager', label: 'Manager', permissions: ['all'] },
  { id: 'chef', label: 'Head Chef', permissions: ['kitchen', 'inventory'] },
  { id: 'waiter', label: 'Waiter', permissions: ['pos', 'orders'] },
  { id: 'cashier', label: 'Cashier', permissions: ['pos', 'payments'] },
];

export default function StaffManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const filteredStaff = staffData.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });
  
  const columns = [
    { 
      key: 'name', 
      header: 'Name',
      render: (value: string, row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black text-sm shadow-md">
            {value.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-bold text-white group-hover:text-accent transition-colors">{value}</p>
            <p className="text-[10px] uppercase tracking-widest text-tertiary">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      key: 'role', 
      header: 'Role',
      render: (value: string) => (
        <Badge variant="secondary" className="bg-white/5 text-tertiary border-0 font-bold uppercase tracking-widest text-[10px]">
          {value}
        </Badge>
      )
    },
    { key: 'phone', header: 'Phone' },
    { key: 'shift', header: 'Shift' },
    { 
      key: 'status', 
      header: 'Status',
      render: (value: string) => (
        <Badge variant={value === 'active' ? 'success' : value === 'on_leave' ? 'warning' : 'error'} size="sm">
          {value.replace('_', ' ').toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:text-accent">
            <Edit className="w-4 h-4" />
          </button>
          <button className="p-2.5 hover:bg-error/10 rounded-xl transition-all text-error/60 hover:text-error">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];
  
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Staff Management</h1>
          <p className="text-sm md:text-base text-tertiary">Manage employee roles, shifts, and permissions</p>
        </div>
        <Button 
          variant="primary" 
          size="sm"
          icon={<UserPlus className="w-5 h-5" />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Staff
        </Button>
      </div>
      
      {/* Role Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {roles.map(role => (
          <Card key={role.id} hover className="bg-secondary border-base p-4 shadow-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-tertiary group-hover:text-accent group-hover:bg-accent/10 transition-all">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">{role.label}</h3>
                <p className="text-[10px] uppercase tracking-widest text-tertiary">{role.permissions.length} permissions</p>
              </div>
            </div>
            <button className="text-accent text-[10px] font-black uppercase tracking-widest hover:underline">Edit</button>
          </Card>
        ))}
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Roles' },
              { value: 'manager', label: 'Manager' },
              { value: 'chef', label: 'Chef' },
              { value: 'waiter', label: 'Waiter' },
              { value: 'cashier', label: 'Cashier' },
            ]}
          />
        </div>
      </div>
      
      {/* Staff Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <Table columns={columns} data={filteredStaff} />
      </Card>
      
      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-tertiary">
          Showing <span className="text-white font-bold">{filteredStaff.length}</span> of <span className="text-white font-bold">{staffData.length}</span> staff members
        </p>
        <Pagination 
          currentPage={currentPage}
          totalPages={1}
          onPageChange={setCurrentPage}
        />
      </div>
      
      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Create Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" placeholder="e.g., John" />
            <Input label="Last Name" placeholder="e.g., Doe" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email Address" placeholder="john@example.com" icon={<Mail className="w-4 h-4" />} />
            <Input label="Phone Number" placeholder="+1 (555) 000-0000" icon={<Phone className="w-4 h-4" />} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Role" 
              options={[
                { value: 'manager', label: 'Manager' },
                { value: 'chef', label: 'Head Chef' },
                { value: 'sous_chef', label: 'Sous Chef' },
                { value: 'waiter', label: 'Waiter' },
                { value: 'cashier', label: 'Cashier' },
              ]} 
            />
            <Select 
              label="Shift" 
              options={[
                { value: 'morning', label: 'Morning (6AM - 2PM)' },
                { value: 'evening', label: 'Evening (2PM - 10PM)' },
                { value: 'night', label: 'Night (10PM - 6AM)' },
              ]} 
            />
          </div>
          
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#2A2A2A]">
            <h4 className="text-sm font-semibold text-white mb-2">Login Credentials</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Employee ID" value="EMP-2026-0045" disabled />
              <Input label="Initial PIN" value="1234" disabled />
            </div>
            <p className="text-xs text-[#B3B3B3] mt-2">
              Default PIN is 1234. Staff member will be prompted to change it on first login.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
