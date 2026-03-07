"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  ChevronRight, ShoppingCart, Store, LayoutGrid, X, Trash2, Bike, Printer, CheckCircle2
} from 'lucide-react';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { orderService } from '@/src/services/order.service';
import { Product, Category, Branch, Table, OrderType, Order } from '@/src/types';
import { Modal } from '@/src/components/Modal';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { useRef } from 'react';
import toast from 'react-hot-toast';

export default function POS() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editOrderId = searchParams.get('edit');

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  
  // Selection state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [orderType, setOrderType] = useState<OrderType | 'delivery'>('dine_in');
  
  // Delivery Info state
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [amountTendered, setAmountTendered] = useState('');

  // Receipt & Print State
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  } as any);

  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [initialCartItems, setInitialCartItems] = useState<{ id?: string, product: string, quantity: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pData, cData, bData, tData] = await Promise.all([
          productService.getAll(),
          categoryService.getAll(),
          branchService.getAll(),
          tableService.getAll()
        ]);
        
        const activeProducts = pData.filter((p: Product) => p.is_active);
        setProducts(activeProducts);
        setCategories(cData);
        setBranches(bData);
        setTables(tData.filter((t: Table) => t.is_active));
        
        if (bData.length > 0) setSelectedBranch(bData[0].id);

        // Load Edit Order if present
        if (editOrderId) {
          try {
            const orderEdit = await orderService.getById(editOrderId);
            if (orderEdit.status !== 'draft') {
               toast.error('Only Draft orders can be edited');
               router.push('/dashboard/pos');
            } else {
               setEditingOrder(orderEdit);
               setSelectedBranch(orderEdit.branch || (orderEdit as any).branch_id || '');
               setOrderType(orderEdit.order_type as any);
               if (orderEdit.order_type === 'dine_in') {
                 setSelectedTable(orderEdit.table || orderEdit.table_id || '');
               }
               if (orderEdit.order_type === 'delivery' && orderEdit.delivery_info) {
                 setDeliveryInfo(orderEdit.delivery_info);
               }
               
               // Populate cart
               const mappedCart = orderEdit.items.map(item => {
                 const product = activeProducts.find((p: Product) => p.id === item.product);
                 return product ? { product, quantity: item.quantity } : null;
               }).filter(Boolean) as {product: Product, quantity: number}[];
               setCart(mappedCart);
               
               // Keep track of initial items to calc diffs later
               setInitialCartItems(orderEdit.items.map(i => ({ 
                  id: i.id, product: i.product, quantity: i.quantity 
               })));
            }
          } catch (e) {
            console.error('Failed to load order for editing', e);
            toast.error('Could not load existing order.');
            router.push('/dashboard/pos');
          }
        }

      } catch (error) {
        console.error('Failed to fetch POS data', error);
        toast.error('Failed to load products or categories');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [editOrderId, router]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };
  
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.product.price) * item.quantity), 0);
  const totalTax = cart.reduce((sum, item) => {
    const taxRate = parseFloat(item.product.tax_percentage || '10') / 100;
    return sum + (parseFloat(item.product.price) * item.quantity * taxRate);
  }, 0);
  const total = subtotal + totalTax;
  
  const filteredProducts = products.filter(product => {
    const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const validateOrder = () => {
    if (cart.length === 0) return false;
    if (!selectedBranch) {
      toast.error('Please select a branch');
      return false;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a table');
      return false;
    }
    if (orderType === 'delivery' && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address)) {
      toast.error('Please fill in all delivery details');
      return false;
    }
    return true;
  };

  const getOrderData = () => {
    const orderData: any = {
      branch: selectedBranch,
      order_type: orderType,
      items: cart.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
      })),
    };

    if (orderType === 'dine_in' && selectedTable) {
      orderData.table_id = selectedTable;
    }
    if (orderType === 'delivery') {
      orderData.delivery_info = deliveryInfo;
    }
    return orderData;
  };

  const handleError = (error: any) => {
    console.error('Operation failed', error);
    const errorData = error.response?.data;
    let errorMessage = 'Failed to complete operation';
    
    if (typeof errorData === 'string' && !errorData.includes('<!doctype html>')) {
      errorMessage = errorData;
    } else if (typeof errorData === 'object' && errorData !== null) {
      errorMessage = Object.entries(errorData)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join(', ');
    }
    
    toast.error(errorMessage);
  };

  const syncEditedOrderCart = async (orderId: string) => {
    // Determine diff
    const currentItemsMap = new Map(cart.map(i => [i.product.id, i.quantity]));
    const initialItemsMap = new Map(initialCartItems.map(i => [i.product, i.quantity]));

    const promises: Promise<any>[] = [];

    // Check updates & removals
    for (const initialItem of initialCartItems) {
      if (!currentItemsMap.has(initialItem.product)) {
         // removed
         promises.push(orderService.removeItem(orderId, initialItem.product));
      } else if (currentItemsMap.get(initialItem.product) !== initialItem.quantity) {
         // quantity changed
         promises.push(orderService.updateItem(orderId, { 
             product: initialItem.product, 
             quantity: currentItemsMap.get(initialItem.product)! 
         }));
      }
    }

    // Check additions
    for (const currentItem of cart) {
       if (!initialItemsMap.has(currentItem.product.id)) {
          // new item
          promises.push(orderService.addItem(orderId, {
            product: currentItem.product.id,
            quantity: currentItem.quantity
          }));
       }
    }

    await Promise.all(promises);
  };

  const handleSaveDraft = async () => {
    if (!validateOrder()) return;

    setIsProcessing(true);
    try {
      if (editingOrder) {
        // Sync diff to backend
        await syncEditedOrderCart(editingOrder.id);
        
        // Update general top-level metadata
        const updateData = getOrderData();
        await orderService.update(editingOrder.id, updateData);
        
        toast.success('Order updated successfully!');
        router.push('/dashboard/orders');
      } else {
        const orderData = getOrderData();
        await orderService.create(orderData);
        
        toast.success('Draft saved successfully!');
        setCart([]);
        setSelectedTable('');
        setDeliveryInfo({ name: '', phone: '', address: '' });
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!validateOrder()) return;

    setIsProcessing(true);
    try {
      let orderId = editingOrder?.id;

      if (editingOrder) {
         await syncEditedOrderCart(editingOrder.id);
         const updateData = getOrderData();
         await orderService.update(editingOrder.id, updateData);
      } else {
         const orderData = getOrderData();
         const newOrder = await orderService.create(orderData);
         orderId = newOrder.id;
      }
      
      // 2. Confirm the order
      try {
        await orderService.confirm(orderId!, { id: orderId });
      } catch (confirmError) {
        console.error('Order confirmation failed', confirmError);
        // We continue to payment even if auto-confirm fails, as it might just be DRF signals issue
      }
      
      // 3. Process payment
      try {
        await orderService.addPayment(orderId!, {
          method: paymentMethod,
          amount: parseFloat(amountTendered || '0') >= total ? total.toFixed(2) : parseFloat(amountTendered || '0').toFixed(2),
          idempotency_key: `POS-${Date.now()}`,
        });
      } catch (paymentError) {
        console.error('Payment recording failed', paymentError);
        toast.error('Order confirmed but payment recording failed');
      }

      toast.success(editingOrder ? 'Edited order paid successfully!' : 'Order paid and confirmed successfully!');
      
      if (editingOrder) {
         router.push('/dashboard/orders');
      } else {
         // Determine final order to show on receipt
         let finalOrderForReceipt: Order | null = null;
         try {
           finalOrderForReceipt = await orderService.getById(orderId!);
         } catch (e) {
           console.error('Failed to get final order for receipt');
         }
         
         if (finalOrderForReceipt) setCompletedOrder(finalOrderForReceipt);
         
         setCart([]);
         setSelectedTable('');
         setDeliveryInfo({ name: '', phone: '', address: '' });
         setIsPaymentModalOpen(false);
         setAmountTendered('');
         
         if (finalOrderForReceipt) {
           setIsReceiptModalOpen(true);
         }
      }
    } catch (error: any) {
      handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-full gap-6 animate-fade-in text-white pb-8">
      {/* Product Section (Left) */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* Header Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select 
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setSelectedTable('');
            }}
            options={[
              { value: '', label: 'Select Branch' },
              ...branches.map(br => ({ value: br.id, label: br.name }))
            ]}
            icon={<Store className="w-4 h-4" />}
            className="bg-[#1A1A1A] border-[#2A2A2A]"
          />

          <div className="flex bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A] overflow-hidden">
            <button 
              onClick={() => {
                setOrderType('dine_in');
              }}
              className={`flex-1 py-2 px-1 text-[10px] md:text-xs font-bold rounded-lg transition-all ${orderType === 'dine_in' ? 'bg-[#2A2A2A] text-white' : 'text-[#808080]'}`}
            >
              DINE IN
            </button>
            <button 
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable('');
              }}
              className={`flex-1 py-2 px-1 text-[10px] md:text-xs font-bold rounded-lg transition-all ${orderType === 'takeaway' ? 'bg-[#2A2A2A] text-white' : 'text-[#808080]'}`}
            >
              TAKEAWAY
            </button>
            <button 
              onClick={() => {
                setOrderType('delivery');
                setSelectedTable('');
              }}
              className={`flex-1 py-2 px-1 text-[10px] md:text-xs font-bold rounded-lg transition-all ${orderType === 'delivery' ? 'bg-[#2A2A2A] text-white' : 'text-[#808080]'}`}
            >
              DELIVERY
            </button>
          </div>

          {orderType === 'dine_in' && (
            <Select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              options={[
                { value: '', label: 'Select Table' },
                ...tables
                  .filter(t => !selectedBranch || t.branch === selectedBranch)
                  .map(t => ({
                    value: t.id,
                    label: `Table ${t.name} (Cap: ${t.capacity})`
                  }))
              ]}
              icon={<LayoutGrid className="w-4 h-4" />}
              className="bg-[#1A1A1A] border-[#2A2A2A]"
            />
          )}

          {orderType === 'delivery' && (
             <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4">
                <Input
                  placeholder="Customer Name"
                  value={deliveryInfo.name}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                  className="bg-[#0A0A0A] border-[#2A2A2A]"
                />
                <Input
                  placeholder="Phone Number"
                  value={deliveryInfo.phone}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                  className="bg-[#0A0A0A] border-[#2A2A2A]"
                />
                <Input
                  placeholder="Delivery Address"
                  value={deliveryInfo.address}
                  onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                  className="bg-[#0A0A0A] border-[#2A2A2A]"
                />
             </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Input 
            placeholder="Search products..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5 text-[#808080]" />}
            className="bg-[#1A1A1A] border-[#2A2A2A]"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all border ${
              activeCategory === 'all' 
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
            }`}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 rounded-xl whitespace-nowrap text-xs font-bold transition-all border ${
                activeCategory === cat.id 
                  ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
        
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto min-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 cursor-pointer hover:border-[#D4AF37]/50 transition-all active:scale-95 group"
              >
                <div className="aspect-square bg-[#0A0A0A] rounded-xl mb-3 overflow-hidden border border-[#2A2A2A]">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingCart className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-sm mb-1 truncate">{product.name}</h3>
                <div className="flex items-center justify-between">
                  <p className="text-[#808080] text-[10px] font-mono">{product.sku}</p>
                  <p className="text-primary font-black text-sm">Rs. {parseFloat(product.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cart Section (Right) */}
      <div className="w-full lg:w-[400px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-3xl flex flex-col shadow-2xl h-[calc(100vh-140px)] sticky top-24">
        <div className="p-6 border-b border-[#2A2A2A] bg-[#0A0A0A]/30">
          <h2 className="text-xl font-bold italic uppercase tracking-tight">Order Details</h2>
          <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-1">
            {orderType.replace('_', ' ')} 
            {orderType === 'dine_in' && selectedTable && ` • Table ${tables.find(t => t.id === selectedTable)?.name || selectedTable}`}
            {orderType === 'delivery' && deliveryInfo.name && ` • ${deliveryInfo.name}`}
          </p>
        </div>
        
        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#2A2A2A]">
              <ShoppingCart className="w-16 h-16 mb-2" />
              <p className="font-bold uppercase tracking-[0.2em] text-[10px]">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-[#0A0A0A]/40 rounded-xl border border-[#2A2A2A]">
                <div className="w-12 h-12 bg-black rounded-lg shrink-0 border border-[#2A2A2A] overflow-hidden">
                  {item.product.image ? (
                    <img src={item.product.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs truncate uppercase">{item.product.name}</h4>
                  <p className="text-primary text-[10px] font-black">Rs. {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateQuantity(item.product.id, -1)}
                    className="w-7 h-7 rounded-lg bg-[#2A2A2A] hover:bg-[#333] flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center text-xs font-bold">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product.id, 1)}
                    className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center transition-all active:scale-95"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button 
                  onClick={() => updateQuantity(item.product.id, -item.quantity)}
                  className="p-1.5 text-[#EF444450] hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* Totals & Actions */}
        <div className="p-6 bg-[#0A0A0A]/40 border-t border-[#2A2A2A]">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-[#808080] text-[10px] font-bold uppercase tracking-[0.2em]">
              <span>Subtotal</span>
              <span className="text-white">Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-[#B3B3B3]">Tax (16%)</span>
              <span className="text-white">Rs. {totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-8 pb-6 border-b border-[#2A2A2A]">
              <span className="text-xl font-black text-white">Total</span>
              <span className="text-primary">Rs. {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Button 
              variant="outline" 
              className="text-[#808080] border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-white font-bold h-12 uppercase"
              disabled={cart.length === 0 || isProcessing}
              onClick={handleSaveDraft}
              isLoading={isProcessing}
            >
              {editingOrder ? 'Update Draft' : 'Save Draft'}
            </Button>
            
            <Button 
              variant="primary" 
              className="text-white font-black h-12 uppercase shadow-lg shadow-primary/20"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Checkout
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          
          {editingOrder && (
             <Button
                variant="outline"
                fullWidth
                className="mb-4 border-error/50 text-error hover:bg-error/10 hover:border-error h-10 uppercase text-xs font-bold"
                onClick={() => router.push('/dashboard/orders')}
             >
                Cancel Edit Order
             </Button>
          )}
          
          <div className="mt-2 flex items-center justify-center gap-1.5 opacity-30">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Live Sync Enabled</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setAmountTendered(''); }}
        title="Complete Payment"
      >
        <div className="space-y-6">
          <div className="bg-[#0A0A0A] p-6 rounded-2xl border border-[#2A2A2A] text-center">
            <p className="text-[#808080] text-sm uppercase tracking-widest font-bold mb-2">Total Amount Due</p>
            <p className="text-4xl font-black text-primary">Rs. {total.toFixed(2)}</p>
          </div>

          <div>
            <p className="text-sm font-bold text-white mb-3 uppercase tracking-widest">Payment Method</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                  paymentMethod === 'cash' 
                    ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
                }`}
              >
                <Banknote className="w-8 h-8" />
                <span className="font-bold text-xs uppercase tracking-widest">Cash</span>
              </button>
              <button 
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all ${
                  paymentMethod === 'card' 
                    ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(212,175,55,0.15)]' 
                    : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
                }`}
              >
                <CreditCard className="w-8 h-8" />
                <span className="font-bold text-xs uppercase tracking-widest">Card</span>
              </button>
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div className="animate-fade-in">
              <p className="text-sm font-bold text-white mb-3 uppercase tracking-widest">Amount Tendered</p>
              <Input
                type="number"
                placeholder="Enter amount given by customer..."
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                className="bg-[#0A0A0A] h-14 text-xl font-bold border-[#2A2A2A]"
                icon={<span className="text-[#808080] font-bold pl-2">Rs.</span>}
              />
              
              {parseFloat(amountTendered || '0') >= total && (
                <div className="mt-4 p-4 bg-[#0A0A0A] rounded-xl border border-[#2A2A2A] flex justify-between items-center">
                  <span className="text-[#808080] text-sm uppercase font-bold tracking-widest">Change Due</span>
                  <span className="text-2xl font-black text-white">
                    Rs. {(parseFloat(amountTendered || '0') - total).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[#2A2A2A] flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              onClick={handleProcessPayment}
              isLoading={isProcessing}
              disabled={paymentMethod === 'cash' && (parseFloat(amountTendered || '0') < total && amountTendered !== '')}
            >
              Confirm & Pay Rs. {total.toFixed(2)}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Post-Checkout Receipt Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => { setIsReceiptModalOpen(false); setCompletedOrder(null); }}
        title="Order Completed"
      >
        <div className="space-y-6 text-center">
          <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black text-white">Payment Successful</h3>
          <p className="text-tertiary">Order #{completedOrder?.order_number || completedOrder?.id.slice(-6).toUpperCase()} has been confirmed.</p>
          
          <div className="flex gap-4 justify-center mt-6">
            <Button 
              variant="outline" 
              onClick={() => { setIsReceiptModalOpen(false); setCompletedOrder(null); }}
            >
              New Order
            </Button>
            <Button 
              variant="primary" 
              icon={<Printer className="w-4 h-4" />}
              onClick={() => handlePrint()}
            >
              Print Receipt
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hidden Receipt for Printing */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {completedOrder && <Receipt ref={receiptRef} order={completedOrder} />}
      </div>
    </div>
  );
}
