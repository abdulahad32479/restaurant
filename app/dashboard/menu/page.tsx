"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { Input, TextArea, Select } from '@/src/components/Input';
import { Modal } from '@/src/components/Modal';
import { Badge } from '@/src/components/Badge';
import { Plus, Edit, Trash2, Search, Image as ImageIcon, Tags, Layers, X, CloudUpload } from 'lucide-react';
import { Card } from '@/src/components/Card';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { Product, Category } from '@/src/types';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/src/lib/utils';

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  price: string;
  cost: string;
  tax_percentage: string;
  category: string;
  is_active: boolean;
};

const EMPTY_FORM: ProductForm = {
  name: '', sku: '', description: '', price: '', cost: '',
  tax_percentage: '0', category: '', is_active: true
};

export default function MenuManagement() {
  const router = useRouter();
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Category modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Product edit modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      setItems(pData);
      setCategories(cData);
    } catch (error) {
      console.error('Failed to fetch menu data', error);
      toast.error('Failed to load menu or categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  // ─── Category handlers ───────────────────────────────────────────────────
  const handleSaveCategory = async () => {
    if (!newCategory.name) { toast.error('Category name is required'); return; }
    setIsSavingCat(true);
    try {
      if (editingCategoryId) {
        await categoryService.update(editingCategoryId, newCategory);
        toast.success('Category updated!');
      } else {
        await categoryService.create(newCategory);
        toast.success('Category created!');
      }
      setNewCategory({ name: '', description: '' });
      setEditingCategoryId(null);
      fetchData();
    } catch { toast.error('Failed to save category'); } 
    finally { setIsSavingCat(false); }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Items will become uncategorized.')) return;
    setIsDeletingId(id);
    try {
      await categoryService.delete(id);
      toast.success('Category deleted');
      fetchData();
    } catch { toast.error('Failed to delete category'); }
    finally { setIsDeletingId(null); }
  };

  // ─── Product handlers ────────────────────────────────────────────────────
  const openEditProduct = (item: Product) => {
    setEditingProductId(item.id);
    setProductForm({
      name: item.name,
      sku: item.sku,
      description: item.description || '',
      price: item.price,
      cost: item.cost,
      tax_percentage: item.tax_percentage || '0',
      category: item.category,
      is_active: item.is_active,
    });
    setImagePreview(item.image || '');
    setImageFile(null);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProductId(null);
    setProductForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.sku || !productForm.price || !productForm.cost || !productForm.category) {
      toast.error('Name, SKU, Price, Cost, and Category are required');
      return;
    }
    setIsSavingProduct(true);
    try {
      const fd = new FormData();
      (Object.keys(productForm) as Array<keyof ProductForm>).forEach(k => {
        fd.append(k, String(productForm[k]));
      });
      if (imageFile) fd.append('image', imageFile);

      if (editingProductId) {
        await productService.update(editingProductId, fd);
        toast.success('Product updated!');
      }
      closeProductModal();
      fetchData();
    } catch (error: any) {
      const errData = error.response?.data;
      if (typeof errData === 'object' && errData) {
        const msg = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
        toast.error(msg);
      } else {
        toast.error('Failed to save product');
      }
    } finally { setIsSavingProduct(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setIsDeletingId(id);
    try {
      await productService.delete(id);
      toast.success('Product deleted');
      fetchData();
    } catch { toast.error('Failed to delete product'); }
    finally { setIsDeletingId(null); }
  };

  const handleToggleActive = async (item: Product) => {
    try {
      const fd = new FormData();
      fd.append('is_active', String(!item.is_active));
      await productService.patch(item.id, fd);
      toast.success(`Product ${item.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch { toast.error('Failed to toggle status'); }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white  uppercase tracking-tighter mb-2 drop-shadow-2xl leading-none">Culinary Catalog</h1>
          <p className="text-[10px] md:text-xs text-[#808080] font-black uppercase tracking-[0.3em] flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent shadow-[0_0_10px_#D4AF37]"></span>
            </span>
            Menu items and asset management
          </p>
        </div>
          <Button 
            variant="primary" 
            size="sm"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => router.push('/dashboard/pos')}
            className="hidden md:flex font-black uppercase tracking-tighter"
          >
            New Order
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            icon={<Tags className="w-5 h-5" />}
            onClick={() => setIsCategoryModalOpen(true)}
            className="font-black uppercase tracking-tighter"
          >
            Categories
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            icon={<Plus className="w-5 h-5" />}
            onClick={() => router.push('/dashboard/products/add')}
            className="font-black uppercase tracking-tighter shadow-lg shadow-primary/20"
          >
            Add Item
          </Button>
      </div>
      
      {/* Category Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.slice(0, 4).map((category, index) => {
          const colors = ['#8B0000', '#D4AF37', '#3B82F6', '#10B981'];
          const color = colors[index % colors.length];
          const itemCount = items.filter(i => i.category === category.id).length;
          
          return (
            <Card 
              key={category.id}
              hover
              className="bg-[#0A0A0A] border-base p-6 shadow-2xl relative group overflow-hidden border-l-4"
              style={{ borderLeftColor: color }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent -mr-12 -mt-12 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: `${color}20`, border: `1px solid ${color}30` }}
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color, boxShadow: `0 0 15px ${color}` }}
                  />
                </div>
                <button 
                  className="text-tertiary hover:text-white transition-colors"
                  onClick={() => {
                    setEditingCategoryId(category.id);
                    setNewCategory({ name: category.name, description: category.description || '' });
                    setIsCategoryModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-xl font-black text-white mb-1 group-hover:text-accent transition-colors">{category.name}</h3>
              <p className="text-[10px] uppercase font-black tracking-[0.2em] text-tertiary">{itemCount} items listed</p>
            </Card>
          );
        })}
        {categories.length === 0 && (
          <div className="col-span-full py-10 text-center bg-white/5 rounded-2xl border border-dashed border-base">
            <Layers className="w-10 h-10 text-tertiary mx-auto mb-3 opacity-20" />
            <p className="text-tertiary">No categories found. Add one to get started.</p>
          </div>
        )}
      </div>
      
      {/* Filters */}
      <div className="bg-secondary border border-base rounded-2xl p-5 md:p-6 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: 'All Categories' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
        </div>
      </div>
      
      {/* Menu Items Table */}
      <Card className="bg-secondary border-base overflow-hidden shadow-2xl p-0">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-[10px] font-black uppercase tracking-[0.25em]">
                <th className="px-6 py-6 text-left text-tertiary">Cuisine Identity</th>
                <th className="px-6 py-6 text-left text-tertiary">Inventory SKU</th>
                <th className="px-6 py-6 text-left text-tertiary">Classification</th>
                <th className="px-6 py-6 text-left text-tertiary">Retail Price</th>
                <th className="px-6 py-6 text-left text-tertiary">Net Cost</th>
                <th className="px-6 py-6 text-left text-tertiary">Availability</th>
                <th className="px-6 py-6 text-right text-tertiary">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base/30">
              {filteredItems.map(item => {
                const categoryName = categories.find(c => c.id === item.category)?.name || 'Uncategorized';
                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-10 h-10 rounded-lg object-cover border border-base" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-tertiary">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <p className="font-bold text-white group-hover:text-accent transition-colors">{item.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-tertiary bg-white/5 px-2 py-1 rounded">{item.sku}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="bg-white/5 text-tertiary border-0">{categoryName}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-black text-accent">Rs. {Number(item.price).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-tertiary">Rs. {Number(item.cost).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleActive(item)} className="cursor-pointer">
                        <Badge variant={item.is_active ? 'success' : 'error'} size="sm" className="uppercase tracking-widest text-[10px]">
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-2.5 hover:bg-white/5 rounded-xl transition-all hover:text-accent"
                          onClick={() => openEditProduct(item)}
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          className={`p-2.5 hover:bg-error/10 rounded-xl transition-all text-error/60 hover:text-error ${isDeletingId === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => handleDeleteProduct(item.id)}
                          disabled={isDeletingId === item.id}
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-tertiary">
                    No items found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* ─── Edit Product Modal ──────────────────────────────────────── */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        title="Edit Product"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={closeProductModal} disabled={isSavingProduct}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProduct} isLoading={isSavingProduct}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-2">Product Image</p>
            <div className="flex items-center gap-4">
              <div
                className="w-20 h-20 rounded-xl border-2 border-dashed border-base bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer hover:border-accent/50 transition-colors shrink-0"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview.startsWith('blob:') ? imagePreview : getImageUrl(imagePreview)} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <CloudUpload className="w-6 h-6 text-tertiary" />
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <div className="flex-1">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </Button>
                {imagePreview && (
                  <button className="ml-2 text-xs text-error hover:text-error/80" onClick={() => { setImageFile(null); setImagePreview(''); }}>
                    Remove
                  </button>
                )}
                <p className="text-[10px] text-tertiary mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Name *" 
              value={productForm.name} 
              onChange={e => setProductForm({...productForm, name: e.target.value})} 
              placeholder="e.g., Classic Burger"
            />
            <Input 
              label="SKU *" 
              value={productForm.sku} 
              onChange={e => setProductForm({...productForm, sku: e.target.value})} 
              placeholder="e.g., BUR-001"
            />
          </div>
          <TextArea 
            label="Description" 
            value={productForm.description} 
            onChange={e => setProductForm({...productForm, description: e.target.value})} 
            placeholder="Describe the dish..."
            rows={2}
          />
          <div className="grid grid-cols-3 gap-4">
            <Input 
              label="Price ($) *" 
              type="number" 
              value={productForm.price} 
              onChange={e => setProductForm({...productForm, price: e.target.value})} 
              placeholder="9.99"
            />
            <Input 
              label="Cost ($) *" 
              type="number" 
              value={productForm.cost} 
              onChange={e => setProductForm({...productForm, cost: e.target.value})} 
              placeholder="4.50"
            />
            <Input 
              label="Tax (%)" 
              type="number" 
              value={productForm.tax_percentage} 
              onChange={e => setProductForm({...productForm, tax_percentage: e.target.value})} 
              placeholder="0"
            />
          </div>
          <Select 
            label="Category *"
            value={productForm.category} 
            onChange={e => setProductForm({...productForm, category: e.target.value})}
            options={[
              { value: '', label: 'Select Category' },
              ...categories.map(c => ({ value: c.id, label: c.name }))
            ]}
          />
          <div className="flex items-center gap-3 pt-2">
            <input 
              type="checkbox" 
              id="edit_is_active"
              checked={productForm.is_active}
              onChange={e => setProductForm({...productForm, is_active: e.target.checked})}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="edit_is_active" className="text-sm font-medium text-white cursor-pointer">Active (visible on POS)</label>
          </div>
        </div>
      </Modal>

      {/* ─── Category Management Modal ───────────────────────────────── */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategoryId(null);
          setNewCategory({ name: '', description: '' });
        }}
        title="Manage Categories"
        size="lg"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-bg-main border border-base space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              {editingCategoryId ? 'Edit Category' : 'Add New Category'}
              {editingCategoryId && (
                <button 
                  className="text-tertiary hover:text-white text-xs lowercase"
                  onClick={() => {
                    setEditingCategoryId(null);
                    setNewCategory({ name: '', description: '' });
                  }}
                >
                  cancel edit
                </button>
              )}
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <Input 
                label="Category Name" 
                placeholder="e.g., Seafood" 
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
              />
              <TextArea 
                label="Description" 
                placeholder="Category description..." 
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              />
              <Button 
                variant="primary" 
                className="w-full"
                onClick={handleSaveCategory}
                isLoading={isSavingCat}
              >
                {editingCategoryId ? 'Update Category' : 'Create Category'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Existing Categories</h4>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-base group hover:border-accent/30 transition-all">
                  <div>
                    <p className="font-bold text-white">{category.name}</p>
                    <p className="text-[10px] text-tertiary">{category.description || 'No description'}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-2 text-tertiary hover:text-white"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setNewCategory({ name: category.name, description: category.description || '' });
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      className="p-2 text-tertiary hover:text-error"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isDeletingId === category.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-tertiary text-sm text-center py-6">No categories yet. Add one above.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
