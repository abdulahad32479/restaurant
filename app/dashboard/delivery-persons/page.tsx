"use client"

import React, { useState, useEffect } from 'react';
import { Table, Pagination } from '@/src/components/Table';
import { Badge } from '@/src/components/Badge';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Search, Plus, User as UserIcon, Bike, Phone, Edit, Trash2, X, Check, MessageSquare } from 'lucide-react';
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
    if (!editingPerson?.name || !editingPerson?.phone_number) {
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
    p.phone_number?.includes(searchQuery) ||
    p.whatsapp_number?.includes(searchQuery)
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
          <span className="font-bold text-white uppercase">{val}</span>
        </div>
      )
    },
    { 
      key: 'phone_number', 
      header: 'Contact',
      render: (_: any, row: DeliveryPerson) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-tertiary text-xs">
            <Phone className="w-3 h-3" />
            {row.phone_number}
          </div>
          {row.whatsapp_number && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
              <MessageSquare className="w-3 h-3" />
              {row.whatsapp_number}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Availability',
      render: (val: string) => (
        <Badge variant={val === 'available' ? 'success' : val === 'busy' ? 'warning' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest px-3 py-1">
          {val || 'OFF DUTY'}
        </Badge>
      )
    },
    { 
      key: 'is_active', 
      header: 'System Access',
      render: (val: boolean) => (
        <Badge variant={val ? 'success' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest px-3 py-1 opacity-60">
          {val ? 'Enabled' : 'Disabled'}
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
    <div className="space-y-8 animate-in fade-in duration-700 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0A0A0A] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-glow-primary">
                <Bike className="w-7 h-7 text-primary" />
             </div>
             Delivery Personnel
          </h1>
          <p className="text-tertiary text-[10px] mt-1 uppercase tracking-[0.3em] font-black italic">Fleet unit orchestration & availability</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus className="w-5 h-5" />}
          onClick={() => {
            setEditingPerson({ is_active: true, status: 'available' });
            setIsModalOpen(true);
          }}
          className="h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 rounded-2xl"
        >
          Add Personnel
        </Button>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-primary/10 transition-all duration-700"></div>
      </div>

      <Card className="bg-[#0F0F0F] border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
            <Input 
                placeholder="Search unit by name, phone or whatsapp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-black/40 border-white/10 pl-12 h-14 uppercase text-[10px] font-black tracking-widest placeholder-[#222]"
            />
          </div>
          <div className="flex items-center gap-8 px-8 py-3 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
             <div className="text-center">
               <p className="text-xl font-black text-emerald-500 uppercase leading-none">{deliveryPersons.filter(p => p.status === 'available').length}</p>
               <p className="text-[8px] font-black text-tertiary uppercase mt-1 tracking-widest opacity-40">READY</p>
             </div>
             <div className="w-px h-8 bg-white/10"></div>
             <div className="text-center">
               <p className="text-xl font-black text-warning uppercase leading-none">{deliveryPersons.filter(p => p.status === 'busy').length}</p>
               <p className="text-[8px] font-black text-tertiary uppercase mt-1 tracking-widest opacity-40">EN ROUTE</p>
             </div>
          </div>
        </div>

        <Table columns={columns} data={filteredData} />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPerson?.id ? 'RE-CONFIGURE PERSONNEL' : 'INITIALIZE PERSONNEL UNIT'}
        size="md"
      >
        <div className="space-y-8 p-2">
          <div className="bg-primary/5 p-8 rounded-[2.5rem] border border-primary/20 flex items-center gap-8 group">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-glow-primary group-hover:scale-105 transition-transform duration-500">
                    <UserIcon className="w-10 h-10" />
                </div>
                <div>
                    <p className="text-[11px] font-black text-primary uppercase tracking-[0.4em] mb-1">Personnel Unit</p>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Fleet Registration Protocol</h3>
                </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Fleet Member Name *"
              value={editingPerson?.name || ''}
              onChange={(e) => setEditingPerson({...editingPerson, name: e.target.value.toUpperCase()})}
              placeholder="ENTER UNIT NAME"
              className="bg-black/60 border-white/10 font-black uppercase tracking-widest"
            />
            <div className="space-y-1.5">
                <p className="text-[10px] font-black text-tertiary uppercase tracking-widest px-1">Unit Availability</p>
                <Select
                  value={editingPerson?.status || 'available'}
                  onChange={(e) => setEditingPerson({...editingPerson, status: e.target.value as any})}
                  options={[
                    { value: 'available', label: 'AVAILABLE / READY' },
                    { value: 'busy', label: 'BUSY / EN ROUTE' },
                    { value: 'off_duty', label: 'OFF DUTY / AWAY' }
                  ]}
                  className="h-12 bg-black/60 border-white/10 text-[10px] font-black uppercase tracking-widest"
                />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Primary Signal (Phone) *"
              value={editingPerson?.phone_number || ''}
              onChange={(e) => setEditingPerson({...editingPerson, phone_number: e.target.value})}
              placeholder="e.g. 03001234567"
              className="bg-black/60 border-white/10"
              icon={<Phone className="w-4 h-4" />}
            />
            <Input 
              label="WhatsApp Signal"
              value={editingPerson?.whatsapp_number || ''}
              onChange={(e) => setEditingPerson({...editingPerson, whatsapp_number: e.target.value})}
              placeholder="e.g. 03001234567"
              className="bg-black/60 border-white/10"
              icon={<MessageSquare className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                    <Check className="w-6 h-6 text-emerald-500 shadow-glow-emerald/20" />
                 </div>
                 <div>
                     <p className="text-[10px] font-black text-white uppercase tracking-widest">System Access Status</p>
                     <p className="text-[8px] font-black text-tertiary uppercase mt-1 opacity-50">Authorized for fleet dispatch app</p>
                 </div>
              </div>
              <div 
                onClick={() => setEditingPerson({...editingPerson, is_active: !editingPerson?.is_active})}
                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all duration-500 ${editingPerson?.is_active ? 'bg-emerald-500' : 'bg-[#222]'}`}
              >
                <div className={`w-6 h-6 rounded-full bg-white transition-all duration-500 shadow-md ${editingPerson?.is_active ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/5">
            <Button variant="outline" fullWidth onClick={() => setIsModalOpen(false)} className="h-16 font-black uppercase tracking-widest text-[11px] rounded-2xl border-white/10 hover:bg-white/5">ABORT</Button>
            <Button 
                variant="primary" 
                fullWidth 
                onClick={handleCreateOrUpdate} 
                isLoading={isSaving}
                className="h-16 font-black uppercase tracking-widest text-[11px] bg-primary border-primary text-black shadow-2xl shadow-primary/30 rounded-2xl"
            >
              COMMIT RECORD
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
