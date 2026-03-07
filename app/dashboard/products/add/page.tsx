"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { branchService } from '@/src/services/branch.service';
import { inventoryService } from '@/src/services/inventory.service';
import { Category, Branch } from '@/src/types';
import toast from 'react-hot-toast';
import { AlertCircle, Package, Plus, Search, RefreshCw, ArrowLeft, CloudUpload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AddProduct() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    cost: '',
    tax_percentage: '0',
    category: '', 
    branch: '',
    stock: 0,
    is_active: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, branchesData] = await Promise.all([
          categoryService.getAll(),
          branchService.getAll()
        ]);
        setCategories(categoriesData);
        setBranches(branchesData);
      } catch (error) {
        console.error('Failed to load form requirements', error);
        toast.error('Failed to load categories or branches');
      }
    };
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let val: any = value;
    
    if (type === 'checkbox') {
      val = (e.target as HTMLInputElement).checked;
    } else if (name === 'stock') {
      val = parseInt(value) || 0;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: val
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Prepare FormData for multipart upload
      const data = new FormData();
      data.append('name', formData.name);
      data.append('sku', formData.sku);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('cost', formData.cost);
      data.append('tax_percentage', formData.tax_percentage);
      data.append('category', formData.category);
      data.append('is_active', String(formData.is_active));
      
      if (imageFile) {
        data.append('image', imageFile);
      }

      // 2. Create the Product
      const newProduct = await productService.create(data);
      
      // 3. If branch and stock are provided, initialize inventory
      if (formData.branch && formData.stock > 0) {
        try {
          await inventoryService.addStock({
            product: newProduct.id,
            branch: formData.branch,
            quantity: formData.stock,
            note: 'Initial stock on product creation'
          });
          toast.success('Product and initial stock added!');
        } catch (invError) {
          console.error('Product created but inventory failed', invError);
          toast.success('Product created, but failed to set initial stock.');
        }
      } else {
        toast.success('Product added successfully!');
      }
      
      router.push('/dashboard/products');
    } catch (error: any) {
      console.error('Failed to add product', error);
      const errorData = error.response?.data;
      let errorMessage = 'Failed to add product. Please check all fields.';
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // Flatten nested errors from backend
          const errors = Object.entries(errorData)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
          errorMessage = errors || errorMessage;
        }
      }
      
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
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
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="Classic Burger"
                required
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="BUR-001"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="Delicious beef burger with cheese..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Price (Rs.) *</label>
              <input
                type="text"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="9.99"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Cost (Rs.) *</label>
              <input
                type="text"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="4.50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Tax (%)</label>
              <input
                type="text"
                name="tax_percentage"
                value={formData.tax_percentage}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Initial Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors appearance-none"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Branch (for Stock)</label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#8B0000] transition-colors appearance-none"
              >
                <option value="">Select Branch</option>
                {branches.map(br => (
                  <option key={br.id} value={br.id}>{br.name}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#B3B3B3] mb-2">Product Image</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="product-image"
                />
                <label 
                  htmlFor="product-image"
                  className="flex-1 cursor-pointer bg-[#1A1A1A] border-2 border-dashed border-[#2A2A2A] hover:border-[#8B0000] rounded-xl px-4 py-6 text-center transition-colors"
                >
                  <div className="flex flex-col items-center gap-2">
                    <CloudUpload className="w-8 h-8 text-[#B3B3B3]" />
                    <span className="text-sm text-[#B3B3B3]">
                      {imageFile ? imageFile.name : 'Click to upload or drag and drop'}
                    </span>
                    <span className="text-[10px] text-[#555]">PNG, JPG up to 5MB</span>
                  </div>
                </label>
                {imageFile && (
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#2A2A2A]">
                    <Image 
                      src={URL.createObjectURL(imageFile)} 
                      alt="Preview" 
                      fill
                      className="object-cover" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setImageFile(null)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-5 h-5 rounded border-[#2A2A2A] text-[#8B0000] focus:ring-[#8B0000] bg-[#1A1A1A]"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-white">Visible on POS</label>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-[#2A2A2A]">
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
              Create Product
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
