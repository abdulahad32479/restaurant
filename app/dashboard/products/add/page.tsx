"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { productService } from '@/src/services/product.service';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function AddProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: 0,
    category: '', // This should ideally be a dropdown
    branch: '', // Required by backend based on schema
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'stock' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Branch and Category IDs should ideally come from selectors
      // For this demo, we'll assume the user provides them or we use a placeholder if empty
      const payload = {
        ...formData,
        branch: formData.branch || '00000000-0000-0000-0000-000000000000', // Placeholder
        category: formData.category || '00000000-0000-0000-0000-000000000000', // Placeholder
      };

      await productService.create(payload as any);
      toast.success('Product added successfully!');
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Failed to add product', error);
      toast.error(error.response?.data?.detail || 'Failed to add product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <button className="p-2 bg-[#1F1F1F] border border-[#2A2A2A] rounded-lg text-[#B3B3B3] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Add New Product</h1>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-6 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Product Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="Classic Burger"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="Delicious beef burger with cheese..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Price ($)</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="9.99"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Stock Level</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Category ID (UUID)</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="UUID of category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Branch ID (UUID)</label>
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-dukes-red transition-colors"
                placeholder="UUID of branch"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Save Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
