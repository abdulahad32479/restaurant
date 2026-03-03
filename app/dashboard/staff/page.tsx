"use client"

import React, { useState, useEffect } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Plus, Search, Edit, Trash2, UserPlus, Phone, Mail, Shield, Store, Lock } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { userService } from '@/src/services/user.service';
import { branchService } from '@/src/services/branch.service';
import { User, Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function StaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'staff' as any,
    branch: '',
    is_active: true
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [uData, bData] = await Promise.all([
        userService.getAll(),
        branchService.getAll()
      ]);
      setUsers(uData);
      setBranches(bData);
    } catch (error) {
      console.error('Failed to fetch staff data', error);
      toast.error('Failed to load staff or branches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  
  const filteredStaff = users.filter(staff => {
    const matchesSearch = staff.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });
  
  const handleAddStaff = async () => {
    if (!newUser.username || !newUser.email || !newUser.password || !newUser.branch) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await userService.create(newUser);
      toast.success('Staff member created successfully!');
      setIsAddModalOpen(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'staff' as any,
        branch: '',
        is_active: true
      });
      fetchData();
    } catch (error: any) {
      console.error('Failed to create staff', error);
      toast.error(error.response?.data?.detail || 'Failed to create staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { 
      key: 'username', 
      header: 'User',
      render: (value: string, row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-black text-sm shadow-md">
            {value.substring(0, 2).toUpperCase()}
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
    { 
      key: 'branch_name', 
      header: 'Branch',
      render: (value: string, row: User) => (
        <span className="text-tertiary">{value || row.branch || '-'}</span>
      )
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'success' : 'error'} size="sm">
          {value ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (value: any, row: User) => (
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Staff Management</h1>
          <p className="text-sm md:text-base text-tertiary">Manage employee roles and branch assignments</p>
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
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by username or email..."
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
              { value: 'admin', label: 'Admin' },
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
          Showing <span className="text-white font-bold">{filteredStaff.length}</span> staff members
        </p>
      </div>
      
      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAddStaff} isLoading={isSubmitting}>
              Create Account
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Username" 
              placeholder="e.g., johndoe" 
              value={newUser.username}
              onChange={(e) => setNewUser({...newUser, username: e.target.value})}
            />
            <Input 
              label="Email Address" 
              placeholder="john@example.com" 
              icon={<Mail className="w-4 h-4" />} 
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Password" 
              type="password" 
              placeholder="********" 
              icon={<Lock className="w-4 h-4" />}
              value={newUser.password}
              onChange={(e) => setNewUser({...newUser, password: e.target.value})}
            />
            <Select 
              label="Branch" 
              value={newUser.branch}
              onChange={(e) => setNewUser({...newUser, branch: e.target.value})}
              options={[
                { value: '', label: 'Select Branch' },
                ...branches.map(b => ({ value: b.id, label: b.name }))
              ]} 
              icon={<Store className="w-4 h-4" />}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Select 
              label="Role" 
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
              options={[
                { value: 'staff', label: 'General Staff' },
                { value: 'manager', label: 'Manager' },
                { value: 'chef', label: 'Chef' },
                { value: 'waiter', label: 'Waiter' },
                { value: 'cashier', label: 'Cashier' },
                { value: 'admin', label: 'Admin' },
              ]} 
              icon={<Shield className="w-4 h-4" />}
            />
            <div className="flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={newUser.is_active}
                  onChange={(e) => setNewUser({...newUser, is_active: e.target.checked})}
                  className="w-5 h-5 rounded bg-white/5 border-base text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-white">Active Account</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
