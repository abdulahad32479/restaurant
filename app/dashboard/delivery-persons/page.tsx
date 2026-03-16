
"use client"

import React, { useState, useEffect } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Plus, User as UserIcon, Bike, Phone, Edit, Trash2, X, Check } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { deliveryPersonService } from '@/src/services/delivery-person.service';
import { DeliveryPerson } from '@/src/types';
import toast from 'react-hot-toast';
import { Modal } from '@/src/components/Modal';

export default function DeliveryPersons() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Partial<DeliveryPerson> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await deliveryPersonService.getAll();
      setDeliveryPersons(data);
    } catch (e) {
      toast.error('Failed to load delivery persons');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!editingPerson?.name || !editingPerson?.phone) {
      toast.error('Name and phone number are required');
      return;
    }

    setIsSaving(true);
    try {
      if (editingPerson.id) {
        await deliveryPersonService.update(editingPerson.id, editingPerson);
        toast.success('Updated successfully');
      } else {
        await deliveryPersonService.create(editingPerson as Omit<DeliveryPerson, 'id'>);
        toast.success('Created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this delivery person?')) {
      try {
        await deliveryPersonService.delete(id);
        toast.success('Deleted successfully');
        fetchData();
      } catch (e) {
        toast.error('Failed to delete');
      }
    }
  };

  const filteredData = deliveryPersons.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone?.includes(searchQuery)
  );

  const columns = [
    { 
      key: 'name', 
      header: 'Name',
      render: (val: string) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-white">{val}</span>
        </div>
      )
    },
    { 
      key: 'phone', 
      header: 'Phone',
      render: (val: string) => (
        <div className="flex items-center gap-2 text-tertiary">
          <Phone className="w-3.5 h-3.5" />
          {val}
        </div>
      )
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (val: boolean) => (
        <Badge variant={val ? 'success' : 'secondary'}>
          {val ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right' as const,
      render: (_: any, row: DeliveryPerson) => (
        <div className="flex justify-end gap-2">
          <button 
            className="p-2 hover:bg-white/5 rounded-lg text-tertiary hover:text-white transition-colors"
            onClick={() => {
              setEditingPerson(row);
              setIsModalOpen(true);
            }}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            className="p-2 hover:bg-error/10 rounded-lg text-error/60 hover:text-error transition-colors"
            onClick={() => handleDelete(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter">Delivery Personnel</h1>
          <p className="text-xs text-tertiary uppercase tracking-widest mt-1">Manage your delivery fleet</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus className="w-5 h-5" />}
          onClick={() => {
            setEditingPerson({ is_active: true });
            setIsModalOpen(true);
          }}
        >
          Add Person
        </Button>
      </div>

      <Card className="bg-secondary border-base p-6">
        <div className="mb-6">
          <Input 
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5" />}
          />
        </div>

        <Table columns={columns} data={filteredData} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson?.id ? 'Edit Delivery Person' : 'Add Delivery Person'}
      >
        <div className="space-y-4">
          <Input 
            label="Full Name"
            value={editingPerson?.name || ''}
            onChange={(e) => setEditingPerson({...editingPerson, name: e.target.value})}
            placeholder="Enter name"
          />
          <Input 
            label="Phone Number"
            value={editingPerson?.phone || ''}
            onChange={(e) => setEditingPerson({...editingPerson, phone: e.target.value})}
            placeholder="e.g. 03001234567"
          />
          <div className="flex items-center gap-3 pt-2">
            <button
               onClick={() => setEditingPerson({...editingPerson, is_active: !editingPerson?.is_active})}
               className={`w-10 h-6 rounded-full transition-colors relative ${editingPerson?.is_active ? 'bg-primary' : 'bg-[#2A2A2A]'}`}
            >
               <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${editingPerson?.is_active ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm text-white font-bold uppercase tracking-widest">Active Status</span>
          </div>

          <div className="flex gap-3 pt-6 border-t border-base">
            <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={handleCreateOrUpdate} isLoading={isSaving}>
              {editingPerson?.id ? 'Save Changes' : 'Create Person'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
