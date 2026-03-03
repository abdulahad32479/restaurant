"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/src/components/Button';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { Product, Category } from '@/src/types';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Plus, Package, RefreshCw } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to fetch products or categories', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 md:mb-2 text-dukes-gold">Products</h1>
          <p className="text-sm md:text-base text-[#B3B3B3]">Manage your restaurant menu items and inventory.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/dashboard/products/add">
            <Button variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">Product</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">SKU</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">Price</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">Stock</th>
                <th className="px-6 py-4 text-sm font-semibold text-[#B3B3B3]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-right text-[#B3B3B3]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-32"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-20"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-[#2A2A2A] rounded w-12"></div></td>
                    <td className="px-6 py-4 text-right"><div className="h-4 bg-[#2A2A2A] rounded w-8 ml-auto"></div></td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[#B3B3B3]">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>No products found. Add your first product!</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-[#2A2A2A] rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-[#B3B3B3]" />
                          </div>
                        )}
                        <span className="font-medium text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#B3B3B3] font-mono text-xs">{product.sku}</td>
                    <td className="px-6 py-4 text-[#B3B3B3]">{getCategoryName(product.category)}</td>
                    <td className="px-6 py-4 font-semibold text-dukes-gold">${Number(product.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${Number(product.stock || 0) <= 5 ? 'text-error' : 'text-white'}`}>
                        {product.stock ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${product.is_active ? 'bg-[#10B98115] text-[#10B981]' : 'bg-[#EF444415] text-[#EF4444]'}`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#B3B3B3] hover:text-white transition-colors">Edit</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
