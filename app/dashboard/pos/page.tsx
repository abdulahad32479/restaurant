"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select, TextArea } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  ChevronRight, ShoppingCart, Store, LayoutGrid, X, Trash2, Bike, Printer, CheckCircle2, User, Phone
} from 'lucide-react';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { orderService } from '@/src/services/order.service';
import { customerService } from '@/src/services/customer.service';
import { Product, Category, Branch, Table, OrderType, Order, Customer } from '@/src/types';
import { Modal } from '@/src/components/Modal';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/src/lib/utils';

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
  const [orderType, setOrderType] = useState<OrderType | 'delivery' | ''>('');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'checkout' | 'draft' | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  
  // Delivery Info state
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Notes & Customer state  
  const [orderNotes, setOrderNotes] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');

  // Cart & Mobile Drawer State
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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

        // Load customers for association
        try {
          const custData = await customerService.getAll();
          setCustomers(custData);
        } catch (e) { /* non-critical */ }

        // Load Edit Order if present
        if (editOrderId) {
          try {
            const orderEdit = await orderService.getById(editOrderId);
            if (['completed', 'cancelled', 'refunded'].includes(orderEdit.status)) {
               toast.error(`Order in ${orderEdit.status} status cannot be edited`);
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
               if (orderEdit.notes) setOrderNotes(orderEdit.notes);
               if (orderEdit.customer) setSelectedCustomer(orderEdit.customer);
               
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
    const taxRate = parseFloat(item.product.tax_percentage || '16') / 100;
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
  if (cart.length === 0) {
    toast.error('Your cart is empty');
    return false;
  }
  if (!selectedBranch) {
    toast.error('Please select a branch');
    return false;
  }
  if (!orderType) {
    setIsTypeModalOpen(true);
    return false;
  }
  if (orderType === 'dine_in' && !selectedTable) {
    toast.error('Please select a table');
    return false;
  }
   if (orderType === 'delivery' && (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address)) {
    setIsDeliveryModalOpen(true);
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

    if (orderNotes.trim()) orderData.notes = orderNotes.trim();
    if (selectedCustomer) orderData.customer = selectedCustomer;
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

  const clearCart = () => {
    if (window.confirm('Are you sure you want to clear the entire cart?')) {
      setCart([]);
    }
  };

  const handleSaveDraft = async () => {
  if (cart.length > 0 && !orderType) {
    setPendingAction('draft');
    setIsTypeModalOpen(true);
    return;
  }
  
  if (!validateOrder()) return;

  setIsProcessing(true);
  try {
    if (editingOrder) {
      // Sync item changes via action endpoints, then update metadata via PATCH
      await syncEditedOrderCart(editingOrder.id);
      const updateData = getOrderData();
      try { await orderService.update(editingOrder.id, updateData); } catch (e) {
        console.warn('Metadata update failed (order may be locked), items still synced', e);
      }
    } else {
      const orderData = getOrderData();
      await orderService.create(orderData);
    }
    
    toast.success(editingOrder ? 'Order updated successfully!' : 'Order saved as draft!');
    
    if (editingOrder) {
      router.push('/dashboard/orders');
    } else {
      setCart([]);
      setOrderType('');
      setSelectedTable('');
      setDeliveryInfo({ name: '', phone: '', address: '' });
      setOrderNotes('');
      setSelectedCustomer('');
    }
  } catch (error: any) {
    handleError(error);
  } finally {
    setIsProcessing(false);
  }
};

  const handleCheckoutClick = () => {
  if (cart.length > 0 && !orderType) {
    setPendingAction('checkout');
    setIsTypeModalOpen(true);
    return;
  }
  if (validateOrder()) {
    setIsPaymentModalOpen(true);
  }
};

const handleProcessPayment = async () => {
  if (!validateOrder()) return;

    setIsProcessing(true);
    try {
      let orderId = editingOrder?.id;

      if (editingOrder) {
         // Sync items via action endpoints + update metadata via PATCH
         await syncEditedOrderCart(editingOrder.id);
         const updateData = getOrderData();
         try { await orderService.update(editingOrder.id, updateData); } catch (e) {
           console.warn('Metadata update failed, continuing with payment', e);
         }
      } else {
         const orderData = getOrderData();
         const newOrder = await orderService.create(orderData);
         orderId = newOrder.id;
      }
      
      // 2. Confirm the order
      try {
        const orderUpdatePayload = getOrderData();
        await orderService.confirm(orderId!, { ...orderUpdatePayload, id: orderId });
      } catch (confirmError) {
        console.error('Order confirmation failed', confirmError);
        // We continue to payment even if auto-confirm fails, as it might just be DRF signals issue
      }
      
      // 3. Process payment
      try {
        const remainingToPay = total - parseFloat(editingOrder?.paid_amount || '0');
        let finalPayAmount = parseFloat(amountTendered || '0');
        
        // For card payments or if user didn't enter amount for cash, pay the full remaining balance
        if (paymentMethod === 'card' || finalPayAmount === 0 || finalPayAmount > remainingToPay) {
          finalPayAmount = remainingToPay;
        }

        await orderService.addPayment(orderId!, {
          method: paymentMethod,
          amount: finalPayAmount.toFixed(2),
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
         setOrderType('');
         setSelectedTable('');
         setDeliveryInfo({ name: '', phone: '', address: '' });
         setOrderNotes('');
         setSelectedCustomer('');
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
    <div className="flex flex-col lg:flex-row min-h-full gap-6 animate-fade-in text-white pb-8 relative">
      {/* Mobile Cart Trigger - Floating Bottom Bar */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40 animate-slide-up">
           <button 
             onClick={() => setIsCartOpen(true)}
             className="w-full bg-primary text-white h-16 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center justify-between px-6 font-black uppercase tracking-widest border border-white/20 active:scale-95 transition-all"
           >
             <div className="flex items-center gap-3">
               <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center text-xs">
                 {cart.reduce((s, i) => s + i.quantity, 0)}
               </div>
               <span>View Order</span>
             </div>
             <div className="text-lg">Rs. {total.toFixed(2)}</div>
           </button>
        </div>
      )}

      {/* Product Section (Left) */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="mb-0">
          <h1 className="text-lg font-black uppercase tracking-tighter text-white drop-shadow-xl">
            POS <span className="text-primary text-[0.8em] opacity-80 underline decoration-primary/20 decoration-2 underline-offset-4">Terminal</span>
          </h1>
          <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[#666] flex items-center gap-1.5">
            <span className="w-3 h-[1px] bg-primary/20"></span>
            Executive Sales Registry
          </p>
        </div>
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

          <div className="grid grid-cols-3 bg-[#1A1A1A] rounded-xl p-1 border border-[#2A2A2A] gap-1">
            <button 
              onClick={() => setOrderType('dine_in')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${orderType === 'dine_in' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
            >
              <Store className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">DINE IN</span>
            </button>
            <button 
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable('');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${orderType === 'takeaway' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
            >
              <LayoutGrid className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">TAKEAWAY</span>
            </button>
             <button 
              onClick={() => {
                setOrderType('delivery');
                setSelectedTable('');
                setIsDeliveryModalOpen(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all ${orderType === 'delivery' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
            >
              <Bike className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">DELIVERY</span>
            </button>
          </div>

          {orderType === 'dine_in' && (
            <button
              onClick={() => setIsTableModalOpen(true)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left w-full ${
                selectedTable 
                  ? 'bg-primary/10 border-primary/40 text-white' 
                  : 'bg-[#1A1A1A] border-[#2A2A2A] text-[#808080] hover:border-[#404040]'
              }`}
            >
              <LayoutGrid className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-black uppercase tracking-wider flex-1 truncate">
                {selectedTable 
                  ? `Table ${tables.find(t => t.id === selectedTable)?.name || '?'} · Cap. ${tables.find(t => t.id === selectedTable)?.capacity || '?'}` 
                  : 'Choose Table'}
              </span>
              {selectedTable && (
                <span
                  onClick={e => { e.stopPropagation(); setSelectedTable(''); }}
                  className="text-[#606060] hover:text-white text-[9px] font-black uppercase tracking-widest shrink-0 cursor-pointer"
                >
                  ✕
                </span>
              )}
            </button>
          )}

          {orderType === 'delivery' && deliveryInfo.name && (
            <div className="col-span-full flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-[10px] font-black text-primary uppercase tracking-widest animate-fade-in cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setIsDeliveryModalOpen(true)}>
              <Bike className="w-4 h-4" />
              <span>Deliver to: {deliveryInfo.name} • {deliveryInfo.phone} • {deliveryInfo.address.slice(0, 30)}...</span>
              <span className="ml-auto text-[8px] opacity-60">Click to edit</span>
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
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-bold transition-all border ${
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
              className={`px-4 py-1.5 rounded-lg whitespace-nowrap text-[10px] font-bold transition-all border ${
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
                className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-3 cursor-pointer hover:border-primary/50 transition-all active:scale-95 group shadow-lg"
              >
                <div className="aspect-square bg-[#0A0A0A] rounded-xl mb-2.5 overflow-hidden border border-[#2A2A2A]">
                  {product.image ? (
                    <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <ShoppingCart className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-[11px] md:text-xs mb-1.5 truncate text-white uppercase tracking-tight">{product.name}</h3>
                <div className="flex items-center justify-between gap-2 mt-auto">
                  <p className="text-[#666] text-[9px] font-mono truncate">SKU: {product.sku}</p>
                  <p className="text-primary font-black text-xs md:text-sm shrink-0 font-mono">Rs. {parseFloat(product.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Cart Section (Right / Mobile Drawer) */}
      <div className={`
        fixed inset-0 lg:static z-50 lg:z-auto bg-black/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none
        transition-all duration-500 ease-in-out
        ${isCartOpen ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}
      `}>
        <div className={`
          absolute bottom-0 lg:static w-full lg:w-[410px] bg-[#1A1A1A] border border-[#2A2A2A] rounded-t-[3rem] lg:rounded-3xl 
          flex flex-col shadow-2xl h-[90vh] lg:h-[calc(100vh-140px)] sticky top-24
          transition-transform duration-500
          ${isCartOpen ? 'translate-y-0' : 'translate-y-[20%] lg:translate-y-0'}
        `}>
          {/* Header */}
          <div className="p-5 border-b border-[#2A2A2A] bg-[#0A0A0A]/40 flex items-center justify-between shrink-0">
            <div className="min-w-0">
              <h2 className="text-lg font-black uppercase tracking-tighter text-white leading-none mb-1">Live Bill</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[8px] text-primary font-black uppercase tracking-[0.3em] flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                  </span>
                  {orderType ? orderType.replace('_', ' ') : 'No Type'}
                </p>
                {orderType === 'dine_in' && selectedTable && (
                  <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                    • Table {tables.find(t => t.id === selectedTable)?.name || selectedTable}
                  </span>
                )}
                {selectedCustomer && customers.length > 0 && (
                  <span className="text-[8px] font-black text-accent/70 uppercase tracking-widest truncate max-w-[120px]">
                    • {customers.find(c => c.id === selectedCustomer)?.name || 'Customer'}
                  </span>
                )}
                {editingOrder && (
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary">
                    EDITING
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={clearCart}
                className="p-2.5 bg-white/5 rounded-xl border border-white/5 hover:bg-error/10 hover:border-error/20 transition-all text-[#808080] hover:text-error lg:flex hidden"
                title="Clear Cart"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2.5 bg-white/5 rounded-xl border border-white/5 lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Scrollable: Order Details + Cart Items */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Customer + Notes -- compact inline section */}
            <div className="px-4 pt-4 pb-3 space-y-2.5 border-b border-[#2A2A2A]/70">
              {/* Customer Selector */}
              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-[#505050] shrink-0" />
                  <select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white text-[11px] font-bold focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[#1A1A1A]">Walk-in (no customer)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#1A1A1A]">
                        {c.name}{c.phone || c.phone_number ? ` · ${c.phone || c.phone_number}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Notes inline */}
              <div className="flex items-start gap-2">
                <span className="text-[#505050] mt-1.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Notes:</span>
                <textarea
                  value={orderNotes}
                  onChange={e => setOrderNotes(e.target.value)}
                  placeholder="Special instructions..."
                  rows={1}
                  className="flex-1 bg-transparent border-0 text-white text-[11px] placeholder:text-[#404040] resize-none focus:outline-none custom-scrollbar leading-relaxed"
                  onInput={e => {
                    const t = e.target as HTMLTextAreaElement;
                    t.style.height = 'auto';
                    t.style.height = t.scrollHeight + 'px';
                  }}
                />
              </div>
            </div>

            {/* Cart Items */}
            <div className="p-4 space-y-2.5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-[#2A2A2A]">
                  <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-4 animate-pulse">
                    <ShoppingCart className="w-9 h-9" />
                  </div>
                  <p className="font-black uppercase tracking-[0.4em] text-[10px]">Empty Basket</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.product.id} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.06] group/item transition-all">
                    {/* Index */}
                    <span className="text-[10px] font-black text-[#404040] w-4 text-center shrink-0">{idx + 1}</span>
                    {/* Image */}
                    <div className="w-9 h-9 bg-black rounded-lg shrink-0 border border-white/10 overflow-hidden">
                      {item.product.image ? (
                        <img src={getImageUrl(item.product.image)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    {/* Name + Price */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[10px] truncate uppercase tracking-tight text-white leading-none mb-0.5">{item.product.name}</h4>
                      <p className="text-primary text-[9px] font-black font-mono">Rs. {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 border border-white/5"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-5 text-center text-[11px] font-black tabular-nums">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded-lg bg-primary text-white flex items-center justify-center transition-all active:scale-95 shadow-sm shadow-primary/20"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Fixed Footer: Totals + Actions */}
          <div className="shrink-0 border-t border-[#2A2A2A] bg-[#0F0F0F] rounded-b-3xl">
            <div className="px-5 pt-4 pb-2 space-y-2">
              <div className="flex justify-between items-center text-[#606060] text-[10px] font-black uppercase tracking-[0.15em]">
                <span>Subtotal</span>
                <span className="text-white font-mono">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#606060] text-[10px] font-black uppercase tracking-[0.15em]">
                <span className="flex items-center gap-1.5">Tax <span className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] border border-white/5">16%</span></span>
                <span className="text-white font-mono">Rs. {totalTax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-[#2A2A2A]">
                <span className="text-xl font-black text-white tracking-tight uppercase">TOTAL</span>
                <span className="text-2xl font-black text-primary tabular-nums">Rs. {total.toFixed(2)}</span>
              </div>

              {editingOrder && (
                <div className="flex gap-4 pt-1">
                  <div className="flex-1 text-center bg-success/5 rounded-xl py-1.5 border border-success/10">
                    <p className="text-[8px] font-black text-success/60 uppercase tracking-widest">Paid</p>
                    <p className="text-sm font-black text-success">Rs. {parseFloat(editingOrder.paid_amount || '0').toFixed(2)}</p>
                  </div>
                  <div className="flex-1 text-center bg-primary/5 rounded-xl py-1.5 border border-primary/10">
                    <p className="text-[8px] font-black text-primary/60 uppercase tracking-widest">Balance</p>
                    <p className="text-sm font-black text-primary animate-pulse">Rs. {(total - parseFloat(editingOrder.paid_amount || '0')).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="text-[#808080] border-[#2A2A2A] hover:bg-[#2A2A2A] hover:text-white font-black h-12 uppercase tracking-widest text-[10px] rounded-xl"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleSaveDraft}
                isLoading={isProcessing}
              >
                {editingOrder ? 'Save Changes' : 'Save Draft'}
              </Button>
              <Button 
                variant="primary" 
                className="text-white font-black h-12 uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 rounded-xl"
                disabled={cart.length === 0 || isProcessing}
                onClick={handleCheckoutClick}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>

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
        <div className="space-y-6 text-center py-4">
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 bg-success/20 rounded-full animate-ping opacity-25" />
            <div className="relative w-full h-full bg-success/10 text-success rounded-full flex items-center justify-center border border-success/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
          
          <div>
            <h3 className="text-xl md:text-2xl font-black text-white  uppercase tracking-tighter mb-2 drop-shadow-2xl">Transaction Verified</h3>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-[0_0_10px_#10B981]"></span>
              </span>
              <p className="text-[10px] font-black text-tertiary uppercase tracking-[0.3em] leading-none">
                Order Registry #{completedOrder?.order_number || completedOrder?.id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 shadow-inner group">
              <p className="text-[9px] font-black text-[#666] uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Total Settlement</p>
              <p className="text-2xl font-black text-primary font-mono tracking-tighter">Rs. {Number(completedOrder?.total || 0).toFixed(2)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 shadow-inner group">
              <p className="text-[9px] font-black text-[#666] uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Asset Count</p>
              <p className="text-2xl font-black text-white font-mono tracking-tighter">{completedOrder?.items?.length || 0}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button 
              variant="outline" 
              className="px-10 py-7 h-auto min-w-[180px] font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border-white/10 hover:bg-white/5"
              onClick={() => { setIsReceiptModalOpen(false); setCompletedOrder(null); }}
            >
              New Transaction
            </Button>
            <Button 
              variant="primary" 
              className="px-10 py-7 h-auto min-w-[180px] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 rounded-2xl"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => handlePrint()}
            >
              Print Document
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delivery Details Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Delivery Details"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              placeholder="e.g. John Doe"
              value={deliveryInfo.name}
              onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
              className="bg-[#0A0A0A] border-[#2A2A2A]"
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. 03001234567"
              value={deliveryInfo.phone}
              onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
              className="bg-[#0A0A0A] border-[#2A2A2A]"
              icon={<Phone className="w-4 h-4" />}
            />
          </div>
          <TextArea
            label="Delivery Address"
            placeholder="Enter full delivery address..."
            value={deliveryInfo.address}
            onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
            className="bg-[#0A0A0A] border-[#2A2A2A]"
          />
          
          <div className="pt-4 border-t border-[#2A2A2A] flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeliveryModalOpen(false)}>Discard</Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
                  toast.error('All fields are required');
                  return;
                }
                setIsDeliveryModalOpen(false);
              }}
            >
              Save Details
            </Button>
          </div>
        </div>
      </Modal>

      {/* Order Type Selection Modal */}
      <Modal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Select Order Fulfillment"
      >
        <div className="space-y-6">
          <p className="text-[#808080] text-sm uppercase tracking-widest font-bold text-center px-4">
            Please pick a method for this transaction
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => {
                setOrderType('dine_in');
                setIsTypeModalOpen(false);
                if (pendingAction === 'checkout') setIsPaymentModalOpen(true);
                else if (pendingAction === 'draft') handleSaveDraft();
                setPendingAction(null);
              }}
              className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                <Store className="w-7 h-7" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest text-white">Dine In</span>
            </button>

            <button 
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable('');
                setIsTypeModalOpen(false);
                if (pendingAction === 'checkout') setIsPaymentModalOpen(true);
                else if (pendingAction === 'draft') handleSaveDraft();
                setPendingAction(null);
              }}
              className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                <LayoutGrid className="w-7 h-7" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest text-white">Takeaway</span>
            </button>

            <button 
              onClick={() => {
                setOrderType('delivery');
                setSelectedTable('');
                setIsTypeModalOpen(false);
                setIsDeliveryModalOpen(true);
                // The validateOrder in checkout/draft will handle the rest
                setPendingAction(null);
              }}
              className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl bg-[#1A1A1A] border border-[#2A2A2A] hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
                <Bike className="w-7 h-7" />
              </div>
              <span className="font-bold text-xs uppercase tracking-widest text-white">Delivery</span>
            </button>
          </div>

          <div className="pt-4 border-t border-[#2A2A2A] flex justify-center">
            <Button variant="outline" onClick={() => setIsTypeModalOpen(false)} className="w-full max-w-xs h-12 uppercase tracking-widest text-[10px] font-black rounded-xl">
              Cancel
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
