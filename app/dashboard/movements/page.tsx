"use client"

import React, { useState, useEffect } from 'react';
import { Table } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { inventoryService } from '@/src/services/inventory.service';
import { branchService } from '@/src/services/branch.service';
import { StockMovement, Branch } from '@/src/types';
import toast from 'react-hot-toast';

export default function StockMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [mData, bData] = await Promise.all([
        inventoryService.getMovements(),
        branchService.getAll()
      ]);
      setMovements(mData || []);
      setBranches(bData || []);
    } catch (error) {
      console.error('Failed to load stock movements', error);
      toast.error('Failed to load stock movements');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredMovements = movements.filter(m => {
    const matchesSearch = (m.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = branchFilter === 'all' || m.branch_name === branches.find(b => b.id === branchFilter)?.name;
    const matchesType = typeFilter === 'all' || m.movement_types === typeFilter;
    return matchesSearch && matchesBranch && matchesType;
  });

  const columns = [
    {
      key: 'created_at',
      header: 'Date & Time',
      render: (value: string) => (
        <div>
          <p className="font-bold text-white">{new Date(value).toLocaleDateString()}</p>
          <p className="text-xs text-tertiary">{new Date(value).toLocaleTimeString()}</p>
        </div>
      ),
    },
    {
      key: 'product_name',
      header: 'Product',
      render: (value: string) => <span className="font-bold text-white max-w-[200px] truncate block">{value}</span>,
    },
    {
      key: 'branch_name',
      header: 'Branch',
      render: (value: string) => <span className="text-tertiary">{value}</span>,
    },
    {
      key: 'movement_types',
      header: 'Type',
      render: (value: string) => {
        let variant: any = 'secondary';
        if (value === 'incoming' || value === 'return') variant = 'success';
        if (value === 'outgoing' || value === 'order' || value === 'adjustment') variant = 'warning';
        return (
          <Badge variant={variant} size="sm" className="uppercase tracking-widest text-[10px] font-bold">
            {value}
          </Badge>
        );
      },
    },
    {
      key: 'quantity',
      header: 'Qty Change',
      render: (value: string, row: StockMovement) => {
        const isPositive = row.movement_types === 'incoming' || row.movement_types === 'return';
        return (
          <span className={`font-black ${isPositive ? 'text-success' : 'text-warning'}`}>
            {isPositive ? '+' : '-'}{Math.abs(Number(value))}
          </span>
        );
      },
    },
    {
      key: 'quantity_after',
      header: 'Stock After',
      render: (value: string) => <span className="font-bold text-white">{value}</span>,
    },
    {
      key: 'notes',
      header: 'Notes / Reference',
      render: (value: string, row: StockMovement) => (
        <div className="max-w-[250px]">
          <p className="text-sm text-white truncate">{value || '-'}</p>
          <p className="text-[10px] text-tertiary uppercase tracking-widest">{row.reference_type} {row.reference_id}</p>
        </div>
      ),
    },
    {
      key: 'by',
      header: 'User',
      render: (value: string) => <span className="text-xs text-tertiary">{value || 'System'}</span>,
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-900 min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-accent" />
            Stock Movements History
          </h1>
          <p className="text-sm text-tertiary">Audit log for all inventory changes</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      <div className="bg-secondary border border-base rounded-xl p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search products or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-tertiary" />}
          />
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Branches' },
              ...branches.map(b => ({ value: b.id, label: b.name }))
            ]}
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Movement Types' },
              { value: 'incoming', label: 'Incoming (Add)' },
              { value: 'outgoing', label: 'Outgoing' },
              { value: 'order', label: 'Sales Order' },
              { value: 'adjustment', label: 'Adjustment (Reduce)' },
              { value: 'return', label: 'Return' },
            ]}
          />
        </div>
      </div>

      <Card className="bg-secondary border-base p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>
        ) : (
          <Table columns={columns} data={filteredMovements} />
        )}
      </Card>
      
      <div className="flex justify-between items-center text-sm text-tertiary">
        <p>Showing {filteredMovements.length} records</p>
      </div>
    </div>
  );
}
