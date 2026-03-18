"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/src/components/Button';
import { Input, Select, TextArea } from '@/src/components/Input';
import { Badge } from '@/src/components/Badge';
import { 
  Search, Plus, Minus, CreditCard, Banknote, 
  ChevronRight, ShoppingCart, Store, LayoutGrid, X, Trash2, Bike, Printer, CheckCircle2, User as UserIcon, Phone, AlertTriangle, ListOrdered, Clock, ChefHat, Percent, Ban, MoreVertical, Edit2
} from 'lucide-react';
import { productService } from '@/src/services/product.service';
import { categoryService } from '@/src/services/category.service';
import { branchService } from '@/src/services/branch.service';
import { tableService } from '@/src/services/table.service';
import { orderService } from '@/src/services/order.service';
import { customerService } from '@/src/services/customer.service';
import { userService } from '@/src/services/user.service';
import { Product, Category, Branch, Table, OrderType, Order, Customer, DeliveryPerson, User, Discount } from '@/src/types';
import { Modal } from '@/src/components/Modal';
import { useSearchParams, useRouter } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Receipt } from '@/src/components/Receipt';
import { KitchenReceipt } from '@/src/components/KitchenReceipt';
import { useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/src/context/AuthContext';
import { getImageUrl, cn } from '@/src/lib/utils';
import apiClient, { printerClient } from '@/src/lib/axios';
import { localSettingsService } from '@/src/services/local-settings.service';
import { ConfirmModal } from '@/src/components/ConfirmModal';
import { formatOrderToReceiptText, formatOrderToKitchenText } from '@/src/lib/print-utils';

export default function POS() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const editOrderId = searchParams.get('edit');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Active Orders State
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isActiveOrdersModalOpen, setIsActiveOrdersModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [isFinalizingFromModal, setIsFinalizingFromModal] = useState(false);

  // Cancel & Discount State
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [orderToDiscount, setOrderToDiscount] = useState<Order | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>('fixed');
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  const [discountReason, setDiscountReason] = useState('');
  const [editingDiscountId, setEditingDiscountId] = useState<number | null>(null);
  const [openCardMenu, setOpenCardMenu] = useState<string | null>(null);
  
  // Printer state
  const [isPrintOptionsModalOpen, setIsPrintOptionsModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);
  const [printKitchen, setPrintKitchen] = useState(true);
  const [printMain, setPrintMain] = useState(true);

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [allProductsList, setAllProductsList] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [allProductsMap, setAllProductsMap] = useState<Record<string, string>>({});
  const [orderToChangeTable, setOrderToChangeTable] = useState<Order | null>(null);
  
  // Selection state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [orderType, setOrderType] = useState<OrderType | 'delivery' | ''>('');
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [pendingOccupiedTable, setPendingOccupiedTable] = useState<Table | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingAction, setPendingAction] = useState<'checkout' | 'draft' | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  
  // Delivery Person state
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [activeOrdersTypeFilter, setActiveOrdersTypeFilter] = useState<'all' | OrderType>('all');
  const [activeOrdersSearch, setActiveOrdersSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'menu' | 'order_details'>('menu');
  
  // Delivery Info state
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [deliveryDict, setDeliveryDict] = useState<Record<string, {phone: string, address: string, id?: string}>>({});
  const [deliveryPhoneSearch, setDeliveryPhoneSearch] = useState('');
  const [deliveryNameSearch, setDeliveryNameSearch] = useState('');
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [orderToAssign, setOrderToAssign] = useState<Order | null>(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');

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

  // Kitchen Print State
  const kitchenReceiptRef = useRef<HTMLDivElement>(null);
  const [kitchenPrintOrder, setKitchenPrintOrder] = useState<Order | null>(null);
  const handleKitchenPrint = useReactToPrint({
    contentRef: kitchenReceiptRef,
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `
  } as any);

  // Edit Order State
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);


  const getID = (val: any): string => {
    if (!val) return '';
    if (typeof val === 'string') return val.trim();
    if (typeof val === 'object' && val !== null) {
      return (val.id || val.product || '').toString().trim();
    }
    return String(val).trim();
  };

  const refreshOrder = async (orderId: string) => {
    try {
      const updatedOrder = await orderService.getById(orderId);
      
      // Update expandedOrder if this is the one being viewed
      if (expandedOrder && String(expandedOrder.id) === String(orderId)) {
        setExpandedOrder(updatedOrder);
      }
      
      // Update activeOrders list
      setActiveOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updatedOrder : o));
      
      // Update orderToDiscount if modal is open for this order
      if (orderToDiscount && String(orderToDiscount.id) === String(orderId)) {
        setOrderToDiscount(updatedOrder);
      }
    } catch (error) {
      console.error('Failed to refresh order', error);
      // Fallback to full refresh if single refresh fails
      refreshAllData(true);
    }
  };

  const refreshAllData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const results = await Promise.all([
        productService.getAll(1000),
        categoryService.getAll(),
        branchService.getAll(),
        tableService.getAll(),
        orderService.getAll(undefined, 1000),
        customerService.getAll().catch(() => []),
        userService.getAll().catch(() => []),
        apiClient.get('v1/delivery-persons/').then(res => res.data).catch(() => [])
      ]);
      
      const pData = results[0];
      const cData = results[1];
      const bData = results[2];
      const tData = results[3];
      const oData = results[4];
      const custData = results[5];
      const userData = results[6];
      const deliveryPersonsData = results[7] || [];
      
      const activeProducts = pData.filter((p: Product) => p.is_active);
      setProducts(activeProducts);
      setAllProductsList(pData);
      setCategories(cData);
      setBranches(bData);
      setDeliveryPersons(deliveryPersonsData);
      // Sort tables by name/number ascending
      setTables(tData.filter((t: Table) => t.is_active).sort((a: Table, b: Table) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        const numA = parseInt(nameA.replace(/\D/g, ''));
        const numB = parseInt(nameB.replace(/\D/g, ''));
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return nameA.localeCompare(nameB);
      }));
      setActiveOrders(oData.filter((o: Order) => !['completed', 'cancelled', 'refunded'].includes(o.status)));
      setCustomers(custData);
      
      
      const uMap: Record<string, string> = {};
      userData.forEach((u: any) => { uMap[u.id] = u.name || u.username; });
      setUsers(uMap);

      const pMap: Record<string, string> = {};
      pData.forEach((p: Product) => { 
        pMap[String(p.id).trim()] = p.name;
        if (p.sku) pMap[String(p.sku).trim()] = p.name;
      });
      setAllProductsMap(pMap);

      const userRes = await userService.getCurrentUser().catch(() => null);
      setCurrentUser(userRes);

      if (!selectedBranch && bData.length > 0) setSelectedBranch(bData[0].id);

      // Build Delivery Dictionary
      const dict: Record<string, {phone: string, address: string, id?: string}> = {};
      custData.forEach((c: Customer) => {
        if (c.name) {
          const nameKey = c.name.trim().toLowerCase();
          if (!dict[nameKey]) {
            dict[nameKey] = { id: c.id, phone: c.phone || c.phone_number || '', address: c.address || '' };
          }
        }
      });
      oData.forEach((order: Order) => {
        if (order.order_type === 'delivery' && order.delivery_info?.name) {
          const nameKey = order.delivery_info.name.trim().toLowerCase();
          if (!dict[nameKey]) {
            dict[nameKey] = { phone: order.delivery_info.phone || '', address: order.delivery_info.address || '' };
          }
        }
      });
      setDeliveryDict(dict);

      // Re-sync editing order if active
      if (editOrderId) {
        const orderEdit = oData.find((o: Order) => String(o.id) === String(editOrderId));
        if (orderEdit && !['completed', 'cancelled', 'refunded'].includes(orderEdit.status)) {
          // Metadata sync (only if not already deep in editing to avoid overwriting typed notes/customer)
          // For now we just refresh the active order list and rely on initial load for full object
        }
      }
      
      // Sync expanded order if open
      if (expandedOrder) {
        const freshExp = oData.find((o: Order) => String(o.id) === String(expandedOrder.id));
        if (freshExp) setExpandedOrder(freshExp);
      }
    } catch (error) {
      console.error('Failed to fetch POS data', error);
      if (!silent) toast.error('Failed to load POS data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [editOrderId, selectedBranch]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);


  const loadOrderForEditing = (orderEdit: Order, shouldCloseModal = true) => {
    if (['completed', 'cancelled', 'refunded'].includes(orderEdit.status)) {
       toast.error(`Order in ${orderEdit.status} status cannot be edited`);
       return;
    }
    setEditingOrder(orderEdit);
    setSelectedBranch(getID(orderEdit.branch || (orderEdit as any).branch_id));
    setOrderType(orderEdit.order_type as any);
    if (orderEdit.order_type === 'dine_in') {
      setSelectedTable(getID(orderEdit.table || orderEdit.table_id));
    }
    if (orderEdit.order_type === 'delivery' && orderEdit.delivery_info) {
      setDeliveryInfo(orderEdit.delivery_info);
    }
    if (orderEdit.notes) setOrderNotes(orderEdit.notes);
    if (orderEdit.customer) setSelectedCustomer(getID(orderEdit.customer));
    if (orderEdit.items && orderEdit.items.length > 0) {
      const grouped: Record<string, any> = {};
      orderEdit.items.forEach((item: any) => {
        const pId = getID(item.product);
        if (!pId) return;

        if (!grouped[pId]) {
          const product = allProductsList.find((p: Product) => String(p.id) === pId) || {
            id: pId,
            name: item.product_name || 'Item',
            price: item.unit_price || '0',
            is_active: false
          };
          grouped[pId] = { product, quantity: 0 };
        }
        const qty = parseFloat(item.quantity || '0');
        const action = item.action || 'original';
        if (action === 'void') {
          grouped[pId].quantity -= qty;
        } else {
          grouped[pId].quantity += qty;
        }
      });

      const mappedOrderCart = Object.values(grouped).filter((g: any) => g.quantity > 0);
      setCart(mappedOrderCart);
    }
    
    if (shouldCloseModal) setIsActiveOrdersModalOpen(false);
    toast.success(`Loaded Order ${orderEdit.id.substring(0,8)}`);
  };

  const executeStatusUpdate = async (order: Order, action: string) => {
    // Intercept complete action if order is not paid
    if (action === 'complete' && !order.is_paid) {
      setIsFinalizingFromModal(true);
      loadOrderForEditing(order, false);
      setAmountTendered('');
      setPaymentMethod('cash');
      setIsPaymentModalOpen(true);
      return;
    }

    setIsUpdatingStatus(order.id);
    try {
      const payload = { ...order };
      if (action === 'confirm') {
        await orderService.confirm(order.id, payload);
        // Auto-print to kitchen on confirmation
        await triggerDirectPrint(order, 'kitchen');
        // Auto-print to counter ONLY for delivery orders
        if (order.order_type === 'delivery') {
          await triggerDirectPrint(order, 'main');
        }
      }
      else if (action === 'prepare') await orderService.markPreparing(order.id, payload);
      else if (action === 'ready') await orderService.markReady(order.id, payload);
      else if (action === 'serve') await orderService.markServed(order.id, payload);
      else if (action === 'complete') await orderService.complete(order.id, payload);
      else if (action === 'cancel') await orderService.cancel(order.id, { ...payload, notes: 'Cancelled from POS' });
      
      toast.success(`Order ${action}ed successfully`);
      await refreshOrder(order.id);
    } catch (e: any) {
      console.error('Update status failed', e);
      const errorData = e.response?.data;
      let errorMessage = 'Failed to update order status';
      
      if (typeof errorData === 'object' && errorData !== null) {
        if (errorData.detail) errorMessage = errorData.detail;
        else errorMessage = Object.entries(errorData)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
          .join(' | ');
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleCancelOrderFromModal = async (order: Order) => {
    setOrderToCancel(null);
    await executeStatusUpdate(order, 'cancel');
  };

  const handleApplyDiscount = async () => {
    if (!orderToDiscount) return;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    
    setIsApplyingDiscount(true);
    try {
      await orderService.applyDiscount(orderToDiscount.id, {
        type: discountType,
        value: discountValue,
        reason: discountReason.trim() || 'Discount',
        is_active: true
      });
      toast.success('Discount applied successfully!');
      setOrderToDiscount(null);
      setDiscountValue('');
      setDiscountReason('');
      setEditingDiscountId(null);
      await refreshOrder(orderToDiscount.id);
    } catch (e: any) {
      handleError(e);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleRemoveDiscount = async (orderId: string, discount: Discount) => {
    setIsApplyingDiscount(true);
    try {
      await orderService.updateDiscount(orderId, {
        discount_id: discount.id,
        type: discount.type,
        value: discount.value,
        reason: discount.reason,
        is_active: false
      });
      toast.success('Discount removed successfully!');
      await refreshOrder(orderId);
    } catch (e: any) {
      handleError(e);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleUpdateDiscount = async (discountId: number) => {
    if (!orderToDiscount) return;
    const val = parseFloat(discountValue);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid discount value');
      return;
    }
    
    setIsApplyingDiscount(true);
    try {
      await orderService.updateDiscount(orderToDiscount.id, {
        discount_id: discountId,
        type: discountType,
        value: discountValue,
        reason: discountReason.trim() || 'Discount',
        is_active: true
      });
      toast.success('Discount updated successfully!');
      setOrderToDiscount(null);
      setDiscountValue('');
      setDiscountReason('');
      setEditingDiscountId(null);
      await refreshOrder(orderToDiscount.id);
    } catch (e: any) {
      handleError(e);
    } finally {
      setIsApplyingDiscount(false);
    }
  };

  const handleAssignDeliveryPerson = async (orderId: string, deliveryPersonId: string) => {
    setIsUpdatingStatus(orderId);
    try {
      await orderService.assignDeliveryPerson(orderId, deliveryPersonId);
      toast.success('Delivery person assigned successfully');
      await refreshOrder(orderId);
    } catch (e: any) {
      console.error('Assign delivery person failed', e);
      handleError(e);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  const handleChangeTable = async (orderId: string, tableId: string) => {
    setIsUpdatingStatus(orderId);
    try {
      await orderService.changeTable(orderId, tableId);
      toast.success('Table changed successfully');
      setOrderToChangeTable(null);
      await refreshAllData(true);
    } catch (e: any) {
      console.error('Change table failed', e);
      toast.error('Failed to change table');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

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

  const validateOrder = useCallback(() => {
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
}, [cart.length, selectedBranch, orderType, selectedTable, deliveryInfo]);

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
    const status = error.response?.status;
    let errorMessage = `Failed to complete operation (${status || 'Network Error'})`;
    
    if (typeof errorData === 'string' && !errorData.includes('<!doctype html>')) {
      errorMessage = errorData;
    } else if (typeof errorData === 'object' && errorData !== null) {
      if (errorData.detail) errorMessage = errorData.detail;
      else errorMessage = Object.entries(errorData)
        .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : JSON.stringify(v)}`)
        .join(' | ');
    }
    
    toast.error(errorMessage);
  };

  const handleFinalizeOrder = async (order: Order) => {
    setIsProcessing(true);
    try {
      await orderService.complete(order.id, order);
      toast.success('Order finalized successfully!');
      // Back to menu or clear view
      if (expandedOrder?.id === order.id) {
        setExpandedOrder(null);
        setViewMode('menu');
      }
      if (editingOrder?.id === order.id) {
        setEditingOrder(null);
        setCart([]);
      }
      await refreshAllData(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (!orderToAssign || !selectedDeliveryPerson) return;
    setIsProcessing(true);
    try {
      const updatedOrder = await orderService.assignDeliveryPerson(orderToAssign.id, selectedDeliveryPerson);
      toast.success('Delivery person assigned successfully!');
      setIsAssignModalOpen(false);
      
      // Update expandedOrder immediately if it matches
      if (expandedOrder && expandedOrder.id === orderToAssign.id) {
        setExpandedOrder(updatedOrder);
      }
      
      // Update activeOrders list immediately
      setActiveOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
      
      setOrderToAssign(null);
      setSelectedDeliveryPerson('');
      await refreshAllData(true);
    } catch (error) {
      handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDirectPrint = useCallback(async (targetOrder: Order, printerType: 'main' | 'kitchen' | 'both' = 'both') => {
    // 1. Identify Branch ID robustly
    const rawBranch = targetOrder.branch || (targetOrder as any).branch_id;
    let branchId = '';
    
    if (typeof rawBranch === 'object' && rawBranch !== null) {
      branchId = (rawBranch as any).id || '';
    } else if (typeof rawBranch === 'string') {
      branchId = rawBranch;
    }
    
    // Fallback to selectedBranch if order doesn't have it (new orders)
    if (!branchId) branchId = selectedBranch;

    const activeBranch = branches.find(b => b.id === branchId);
    const localSettings = localSettingsService.getForBranch(branchId);
    
    if (!localSettings.direct_printing) {
      console.log('Direct printing is disabled in settings');
      return false;
    }

    try {
      toast.loading('Sending to printers...', { id: 'print-job' });
      
      const printJobs = [];
      
      // ALWAYS JSON payload, no PDF
      if (printerType === 'main' || printerType === 'both') {
        printJobs.push(
          printerClient.post('print/counter', {
            order: targetOrder,
            businessName: activeBranch?.name,
            businessAddress: activeBranch?.address,
            businessPhone: activeBranch?.phone_number
          })
        );
      }
      
      if (printerType === 'kitchen' || printerType === 'both') {
        printJobs.push(
          printerClient.post('print/kitchen', {
            order: targetOrder,
            businessName: activeBranch?.name
          })
        );
      }

      await Promise.all(printJobs);
      
      toast.success('Sent successfully!', { id: 'print-job' });
      return true;
    } catch (printErr: any) {
       console.error('Silent print failed:', printErr);
       const errorMsg = printErr.response?.data?.error || printErr.message || 'Failed to print';
       toast.error(`Silent print failed: ${errorMsg}. Falling back to manual print.`, { id: 'print-job' });
       return false;
    }
  }, [branches, selectedBranch]);

  const clearCart = () => {
    setCart([]);
    setOrderType('');
    setSelectedTable('');
    setDeliveryInfo({ name: '', phone: '', address: '' });
    setOrderNotes('');
    setSelectedCustomer('');
    setEditingOrder(null);
    setIsClearCartModalOpen(false);
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
    let orderId = editingOrder?.id;
    if (editingOrder) {
      // Granular updates for Items
      await orderService.syncOrderItems(orderId!, cart, editingOrder.items);
      
      // Granular updates for Table 
      if (orderType === 'dine_in' && selectedTable && selectedTable !== editingOrder.table && selectedTable !== (editingOrder as any).table_id) {
        try { await orderService.changeTable(orderId!, selectedTable); } catch (e) { console.warn('Table change failed', e); }
      }
      
      const finalOrder = await orderService.getById(orderId!);

      // Kitchen always trigger on update
      await triggerDirectPrint(finalOrder, 'kitchen').then(printed => {
        if (!printed) {
          setKitchenPrintOrder(finalOrder);
          setTimeout(() => handleKitchenPrint(), 200);
        }
      });
      // Counter ONLY for delivery
      if (finalOrder.order_type === 'delivery') {
        await triggerDirectPrint(finalOrder, 'main');
      }
    } else {
      const orderData = getOrderData();
      const newOrder = await orderService.create(orderData);
      orderId = newOrder.id;
    }
    
    toast.success(editingOrder ? 'Order updated successfully!' : 'Order saved as draft!');
    await refreshAllData(true);

    setEditingOrder(null);
    setCart([]);
    setOrderType('');
    setSelectedTable('');
    setDeliveryInfo({ name: '', phone: '', address: '' });
    setOrderNotes('');
    setSelectedCustomer('');
  } catch (error: any) {
    handleError(error);
  } finally {
    setIsProcessing(false);
  }
};

const handleConfirmOrder = async () => {
  if (cart.length > 0 && !orderType) {
    setPendingAction('draft'); 
    setIsTypeModalOpen(true);
    return;
  }
  
  if (!validateOrder()) return;

  setIsProcessing(true);
  try {
    let orderId = editingOrder?.id;

    if (editingOrder) {
      // Sync items via granular item endpoints
      await orderService.syncOrderItems(editingOrder.id, cart, editingOrder.items);
      
      // Update table if dine in and table changed
      if (orderType === 'dine_in' && selectedTable && selectedTable !== editingOrder.table && selectedTable !== (editingOrder as any).table_id) {
        try { await orderService.changeTable(editingOrder.id, selectedTable); } catch (e) { console.warn('Table change failed', e); }
      }
    } else {
      const orderData = getOrderData();
      const newOrder = await orderService.create(orderData);
      orderId = newOrder.id;
    }
    
    try {
      const orderUpdatePayload = getOrderData();
      await orderService.confirm(orderId!, { ...orderUpdatePayload, id: orderId });
    } catch (confirmError) {
      console.error('Order confirmation failed', confirmError);
      toast.error('Failed to confirm order.');
      throw confirmError;
    }
    
    toast.success('Order confirmed successfully!');
    
    // Auto-print on confirmation
    try {
      const confirmedOrder = await orderService.getById(orderId!);
      // Kitchen always on confirmation/update
      await triggerDirectPrint(confirmedOrder, 'kitchen').then(printed => {
        if (!printed) {
          setKitchenPrintOrder(confirmedOrder);
          setTimeout(() => handleKitchenPrint(), 200);
        }
      });
      // Counter ONLY for delivery
      if (confirmedOrder.order_type === 'delivery') {
        await triggerDirectPrint(confirmedOrder, 'main');
      }
    } catch (printErr) {
      console.error('Auto print failed', printErr);
    }

    await refreshAllData(true);

    setEditingOrder(null);
    setCart([]);
    setOrderType('');
    setSelectedTable('');
    setDeliveryInfo({ name: '', phone: '', address: '' });
    setOrderNotes('');
    setSelectedCustomer('');
  } catch (error: any) {
    handleError(error);
  } finally {
    setIsProcessing(false);
  }
};

  const handleCheckoutClick = useCallback(() => {
    if (cart.length > 0 && !orderType) {
      setPendingAction('checkout');
      setIsTypeModalOpen(true);
      return;
    }
    if (validateOrder()) {
      if (editingOrder?.is_paid || (editingOrder && Number(editingOrder.paid_amount) >= total)) {
        handleFinalizeOrder(editingOrder);
      } else {
        setIsPaymentModalOpen(true);
      }
    }
  }, [cart.length, orderType, editingOrder, total, validateOrder, handleFinalizeOrder]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Search (S or /)
      if (e.key && (e.key.toLowerCase() === 's' || e.key === '/') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      }
      // F2 Checkout
      if (e.key === 'F2') {
        e.preventDefault();
        handleCheckoutClick();
      }
      // F4 Kitchen Print
      if (e.key === 'F4' && (completedOrder || editingOrder)) {
        e.preventDefault();
        const target = completedOrder || editingOrder;
        if (target) {
          triggerDirectPrint(target, 'kitchen').then(printed => {
            if (!printed) {
              setKitchenPrintOrder(target);
              setTimeout(() => handleKitchenPrint(), 200);
            }
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [completedOrder, cart.length, orderType, editingOrder, handleCheckoutClick, handleKitchenPrint, triggerDirectPrint]);

const handleProcessPayment = async () => {
  if (!validateOrder()) return;

    setIsProcessing(true);
    try {
      let orderId = editingOrder?.id;

      if (editingOrder) {
         // Sync items via granular item endpoints entirely avoiding patch
         await orderService.syncOrderItems(editingOrder.id, cart, editingOrder.items);
         
         // Update table if it changed
         if (orderType === 'dine_in' && selectedTable && selectedTable !== editingOrder.table && selectedTable !== (editingOrder as any).table_id) {
           try { await orderService.changeTable(editingOrder.id, selectedTable); } catch (e) { console.warn('Table change failed', e); }
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
      let remainingToPay = 0;
      let finalPayAmount = 0;
      let isCompleted = false;

      try {
        // Use server-side total for existing orders (it includes discounts).
        // Using the cart's 'total' would ignore applied discounts and cause
        // "Payment exceeds remaining balance" from the backend.
        const orderTotal = editingOrder 
          ? Number(editingOrder.total || 0) 
          : total;
        remainingToPay = orderTotal - parseFloat(editingOrder?.paid_amount || '0');
        finalPayAmount = parseFloat(amountTendered || '0');
        
        // For card payments or if user didn't enter amount for cash, pay the full remaining balance
        if (paymentMethod === 'card' || finalPayAmount === 0 || finalPayAmount > remainingToPay) {
          finalPayAmount = remainingToPay;
        }

        if (finalPayAmount > 0) {
          await orderService.addPayment(orderId!, {
            method: paymentMethod,
            amount: finalPayAmount.toFixed(2),
          });
        }
      } catch (paymentError: any) {
        const errMsg = paymentError?.response?.data 
          ? JSON.stringify(paymentError.response.data) 
          : paymentError?.message || 'Unknown error';
        console.error('Payment recording failed', errMsg);
        toast.error(`Payment failed: ${errMsg}`);
        return; // stop here so success toast does not fire
      }

      toast.success(editingOrder ? 'Payment recorded successfully!' : 'Order paid and confirmed successfully!');
      
      // Note: Kitchen receipt is NOT sent on payment.
      // It is only sent automatically on order confirmation or order update.
      // Counter (main) receipt is NOT auto-printed here either — print manually from the receipt modal.

      await refreshAllData(true);
      // We don't reset isFinalizingFromModal here, we do it in the final cleanup code below
      // so we can conditionalize the behavior.

      // Determine final order to show on receipt
      let finalOrderForReceipt: Order | null = null;
      try {
        finalOrderForReceipt = await orderService.getById(orderId!);
      } catch (e) {
        console.error('Failed to get final order for receipt');
      }
      
      if (finalOrderForReceipt) {
        setCompletedOrder(finalOrderForReceipt);
        // Update expandedOrder so the Checkout→Finalize button updates instantly
        if (expandedOrder?.id === orderId) {
          setExpandedOrder(finalOrderForReceipt);
        }
      }
      
      setEditingOrder(null);
      setCart([]);
      setOrderType('');
      setSelectedTable('');
      setDeliveryInfo({ name: '', phone: '', address: '' });
      setOrderNotes('');
      setSelectedCustomer('');
      setIsPaymentModalOpen(false);
      setAmountTendered('');
      
      // If we finished from the Active Orders modal, keep it open; otherwise, reset isFinalizingFromModal
      if (!isFinalizingFromModal) {
         // This was a regular checkout from the POS home, so we are already "home"
      }
      setIsFinalizingFromModal(false);
      
      // Note: We no longer auto-print the counter receipt here. 
      // It must be printed manually from the summary modal.

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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)] gap-4 animate-fade-in text-white pb-4 relative overflow-hidden">
      {/* Pane 1: Active Orders Sidebar (Desktop Only) */}
      <div className="hidden lg:flex w-[300px] flex-col gap-4 bg-white/[0.01] rounded-3xl p-4 border border-white/[0.03] shrink-0 overflow-hidden">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-[#808080]">Active Orders ({activeOrders.length})</h2>
          <button 
            onClick={() => refreshAllData(true)}
            className={`p-1.5 hover:bg-white/5 rounded-lg transition-all ${isRefreshing ? 'animate-spin' : ''}`}
          >
            <Clock className="w-3.5 h-3.5 text-[#505050]" />
          </button>
        </div>

        {/* Sidebar Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#444]" />
          <input
            type="text"
            placeholder="Search orders..."
            value={activeOrdersSearch}
            onChange={e => setActiveOrdersSearch(e.target.value)}
            className="w-full bg-black/20 border border-white/5 rounded-xl pl-8 pr-3 py-2 text-[10px] font-bold text-white placeholder:text-[#333] focus:outline-none focus:border-primary/30 uppercase tracking-wider transition-all"
          />
        </div>

        {/* Sidebar Filters */}
        <div className="flex gap-1 p-0.5 bg-black/20 rounded-xl border border-white/5">
          {(['all', 'dine_in', 'takeaway', 'delivery'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveOrdersTypeFilter(type)}
              className={`flex-1 py-1.5 text-[8px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                activeOrdersTypeFilter === type 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-[#505050] hover:text-[#808080]'
              }`}
            >
              {type === 'dine_in' ? 'DINE' : type === 'takeaway' ? 'AWAY' : type === 'delivery' ? 'DLV' : 'ALL'}
            </button>
          ))}
        </div>

        {/* Sidebar Feed */}
        <div className="overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-3" style={{ maxHeight: '500px' }}>
          {activeOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-20">
              <ListOrdered className="w-8 h-8 mb-2" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-center">No active orders</p>
            </div>
          ) : (
            activeOrders
              .filter(o => {
                const matchesType = activeOrdersTypeFilter === 'all' || o.order_type === activeOrdersTypeFilter;
                if (!activeOrdersSearch.trim()) return matchesType;
                const q = activeOrdersSearch.toLowerCase().trim();
                return matchesType && (
                  (o.order_number?.toString() || '').includes(q) ||
                  (o.table_no?.toString() || o.table?.toString() || '').toLowerCase().includes(q) ||
                  (o.delivery_info?.name || '').toLowerCase().includes(q)
                );
              })
              .map(order => (
                <div 
                  key={order.id} 
                  onClick={() => {
                    setExpandedOrder(order);
                    setViewMode('order_details');
                  }}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 ${
                    expandedOrder?.id === order.id
                      ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(212,175,55,0.2)]'
                      : order.status === 'ready' ? 'bg-accent/5 border-accent/20 hover:bg-accent/10' : 
                        order.status === 'preparing' ? 'bg-warning/5 border-warning/20 hover:bg-warning/10' : 
                        'bg-white/[0.02] border-white/10 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-black text-white">
                      #{order.order_number || order.id.substring(0,4)}
                    </span>
                    <Badge variant={order.is_paid ? 'success' : 'warning'} className="text-[7px] px-1.5 py-0 uppercase h-3.5">
                      {order.is_paid ? 'PAID' : 'DUE'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-tertiary">
                    {order.order_type === 'dine_in' ? (
                      <span className="text-primary flex items-center gap-1 text-[20px]"><Store className="w-4 h-4" /> T-{order.table_no || order.table || '?'}</span>
                    ) : order.order_type === 'delivery' ? (
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-orange-400 flex items-center gap-1 text-[10px]">
                          <Bike className="w-3 h-3" /> {order.delivery_info?.name || 'DLV'}
                          {(order.delivery_person || order.delivery_person_name) && (
                            <span className="text-blue-400 ml-1 border-l border-white/10 pl-1 text-[9px] lowercase font-black">
                              @{(() => {
                                const dp = order.delivery_person;
                                return (typeof dp === 'object' && dp !== null ? (dp as any).name : null) 
                                       || order.delivery_person_name 
                                       || deliveryPersons.find(p => String(p.id).trim() === String(typeof dp === 'object' && dp !== null ? (dp as any).id : dp).trim())?.name 
                                       || 'Rider';
                              })()}
                            </span>
                          )}
                        </span>
                        {order.delivery_info?.address && (
                          <span className="text-[14px] text-[#808080] leading-tight line-clamp-1 lowercase font-bold">{order.delivery_info.address}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-blue-400 flex items-center gap-1 text-[10px]"><LayoutGrid className="w-3 h-3" /> AWAY</span>
                    )}
                    <span className="ml-auto text-[#666] font-mono text-[10px]">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                      order.status === 'ready' ? 'bg-accent/20 border-accent/30 text-accent' : 
                      order.status === 'preparing' ? 'bg-warning/20 border-warning/30 text-warning' : 
                      'bg-white/5 border-white/10 text-tertiary'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[10px] font-bold text-white/50 tracking-widest">
                      Rs. {Number(order.total).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Pane 2: Content Section (Middle) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white/[0.01] rounded-3xl p-4 md:p-6 border border-white/[0.03] overflow-hidden">
        {viewMode === 'order_details' && expandedOrder ? (
          /* Order Details View */
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Details Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setViewMode('menu')}
                  className="p-2 hover:bg-white/5 rounded-xl border border-white/10 transition-all active:scale-95"
                >
                  <X className="w-5 h-5 text-tertiary" />
                </button>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                    Order Details <span className="text-primary">#{expandedOrder.order_number || expandedOrder.id.substring(0,6)}</span>
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge variant={expandedOrder.status === 'ready' ? 'accent' as any : 'warning'} className="text-[9px] px-3 py-1 uppercase tracking-widest">
                      {expandedOrder.status.replace('_', ' ')}
                    </Badge>
                    <span className="text-[10px] text-[#666] font-bold uppercase tracking-[0.2em]">{new Date(expandedOrder.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setViewMode('menu'); loadOrderForEditing(expandedOrder); }}
                  className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest bg-white/5 border-white/10 hover:bg-white/10 hover:text-white"
                >
                  Edit Order
                </Button>
                {/* Status Quick Actions */}
                <div className="flex gap-2">
                  {expandedOrder.status === 'draft' && (
                    <Button variant="primary" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20" onClick={() => executeStatusUpdate(expandedOrder, 'confirm')} disabled={isUpdatingStatus===expandedOrder.id}>Confirm</Button>
                  )}
                  {expandedOrder.status === 'confirmed' && (
                    <Button variant="primary" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-warning/20 bg-warning border-warning" onClick={() => executeStatusUpdate(expandedOrder, 'prepare')} disabled={isUpdatingStatus===expandedOrder.id}>Prepare</Button>
                  )}
                  {expandedOrder.status === 'preparing' && (
                    <Button variant="primary" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-accent/20 bg-accent border-accent" onClick={() => executeStatusUpdate(expandedOrder, 'ready')} disabled={isUpdatingStatus===expandedOrder.id}>Ready</Button>
                  )}
                  {expandedOrder.status === 'ready' && (
                    <Button variant="primary" className="h-10 px-6 text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 bg-emerald-500 border-emerald-500" onClick={() => executeStatusUpdate(expandedOrder, 'serve')} disabled={isUpdatingStatus===expandedOrder.id}>Serve</Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left Col: Items & Financials */}
                <div className="space-y-6">
                  {/* Items Card */}
                  <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-4 border-b border-white/5 bg-white/[0.02]">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-tertiary">Order Items</h3>
                    </div>
                    <div className="p-4 space-y-3">
                      {(() => {
                        const items = expandedOrder.items || [];
                        const grouped: Record<string, any> = {};
                        items.forEach((item: any) => {
                          const pId = String(typeof item.product === 'object' ? item.product?.id : item.product || '').trim();
                          if (!grouped[pId]) {
                            grouped[pId] = { id: pId, product_name: item.product_name, quantity: 0, total_price: 0 };
                          }
                          const qty = parseFloat(item.quantity || '0');
                          const price = parseFloat(item.total_price || '0');
                          if (item.action === 'void') {
                            grouped[pId].quantity -= qty;
                            grouped[pId].total_price -= price;
                          } else {
                            grouped[pId].quantity += qty;
                            grouped[pId].total_price += price;
                          }
                        });
                        
                        return Object.values(grouped).filter(g => g.quantity > 0).map((item: any, i: number) => {
                          const name = allProductsMap[item.id] || item.product_name || 'Product';
                          return (
                            <div key={i} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                              <div className="flex items-center gap-4">
                                <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20">x{item.quantity}</span>
                                <span className="text-xs font-bold text-white uppercase tracking-wider">{name}</span>
                              </div>
                              <span className="text-sm font-bold text-tertiary font-mono">Rs. {Number(item.total_price).toFixed(2)}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Totals Summary */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Original price card — shown when discounts are applied */}
                    {expandedOrder.discounts && expandedOrder.discounts.filter(d => d.is_active !== false).length > 0 && (
                      <div className="bg-yellow-500/5 border border-yellow-500/20 p-5 rounded-2xl">
                        <p className="text-[9px] font-bold text-yellow-500/60 uppercase tracking-[0.2em] mb-1">Original Price</p>
                        <p className="text-xl font-black text-yellow-400 font-mono tracking-tighter">Rs. {Number(expandedOrder.subtotal).toFixed(2)}</p>
                      </div>
                    )}
                    <div className="bg-[#0F0F0F] p-5 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold text-[#505050] uppercase tracking-[0.2em] mb-1">Total Billing</p>
                      <p className="text-xl font-black text-primary font-mono tracking-tighter">Rs. {Number(expandedOrder.total).toFixed(2)}</p>
                    </div>
                    <div className="bg-[#0F0F0F] p-5 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-bold text-success/60 uppercase tracking-[0.2em] mb-1">Verified Paid</p>
                      <p className="text-xl font-black text-success font-mono tracking-tighter">Rs. {Number(expandedOrder.paid_amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="bg-[#0F0F0F] p-5 rounded-2xl border border-white/5 flex justify-between items-center group">
                      <div>
                        <p className="text-[9px] font-bold text-error/60 uppercase tracking-[0.2em] mb-1">Outstanding</p>
                        <p className="text-xl font-black text-error font-mono tracking-tighter animate-pulse">Rs. {Math.max(0, Number(expandedOrder.total) - Number(expandedOrder.paid_amount || 0)).toFixed(2)}</p>
                      </div>
                      {Math.max(0, Number(expandedOrder.total) - Number(expandedOrder.paid_amount || 0)) > 0 && (
                        <button 
                          onClick={() => {
                            loadOrderForEditing(expandedOrder, true);
                            setTimeout(() => setIsPaymentModalOpen(true), 100);
                          }}
                          className="px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-error/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Discounts Detail */}
                  {expandedOrder.discounts && expandedOrder.discounts.length > 0 && (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 space-y-3">
                      <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Applied Discounts</p>
                      <div className="space-y-2">
                        {expandedOrder.discounts.filter(d => d.is_active !== false).map(d => (
                          <div key={d.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex-1">
                              <span className="text-[10px] font-black text-white uppercase tracking-widest">{d.reason || 'Discount'}</span>
                              <p className="text-yellow-400 font-mono text-xs mt-0.5">
                                -{d.type === 'percentage' ? `${d.value}%` : `Rs. ${Number(d.value).toFixed(2)}`}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              <button 
                                onClick={() => {
                                  setOrderToDiscount(expandedOrder);
                                  setEditingDiscountId(d.id);
                                  setDiscountValue(d.value);
                                  setDiscountType(d.type as any);
                                  setDiscountReason(d.reason);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/20 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                                title="Edit Discount"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Update
                              </button>
                              <button 
                                onClick={() => handleRemoveDiscount(expandedOrder.id, d)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                                title="Remove Discount"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Col: Metadata & Actions */}
                <div className="space-y-6">
                  {/* Metadata Grid */}
                  <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-bold text-[#505050] uppercase tracking-[0.2em] mb-2">Order Type</p>
                      <div className="flex items-center gap-3 text-sm font-bold text-white">
                        {expandedOrder.order_type === 'dine_in' ? <Store className="w-4 h-4 text-primary" /> : expandedOrder.order_type === 'delivery' ? <Bike className="w-4 h-4 text-orange-400" /> : <LayoutGrid className="w-4 h-4 text-blue-400" />}
                        <span className="uppercase tracking-widest">{expandedOrder.order_type.replace('_', ' ')}</span>
                      </div>
                    </div>
                    {expandedOrder.order_type === 'delivery' && (
                      <div className="col-span-full p-5 bg-orange-500/[0.03] rounded-2xl border border-orange-500/10 space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="text-[9px] font-bold text-orange-400 uppercase tracking-[0.4em] mb-3">Customer Information</p>
                            <h4 className="text-base font-black text-white uppercase tracking-tight mb-1">{expandedOrder.delivery_info?.name || 'Walk-in Customer'}</h4>
                            <div className="flex flex-col gap-1.5">
                              <p className="text-xs font-bold text-orange-400/90 flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5" /> {expandedOrder.delivery_info?.phone || 'No Phone'}
                              </p>
                              <p className="text-[11px] text-tertiary leading-relaxed font-medium">{expandedOrder.delivery_info?.address || 'No Address Provided'}</p>
                            </div>
                          </div>

                          {(expandedOrder.delivery_person || expandedOrder.delivery_person_name) && (
                            <div className="shrink-0 text-right animate-in fade-in zoom-in duration-300">
                              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-[0.4em] mb-3">Assigned Rider</p>
                              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Bike className="w-3.5 h-3.5 text-blue-400" />
                                  <span className="text-xs font-black text-white uppercase tracking-widest leading-none">
                                    {(() => {
                                      const dp = expandedOrder.delivery_person;
                                      return (typeof dp === 'object' && dp !== null ? (dp as any).name : null) 
                                             || expandedOrder.delivery_person_name 
                                             || deliveryPersons.find(p => String(p.id).trim() === String(typeof dp === 'object' && dp !== null ? (dp as any).id : dp).trim())?.name 
                                             || 'Rider Assigned';
                                    })()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {expandedOrder.order_type === 'takeaway' && (
                      <div>
                        <p className="text-[9px] font-bold text-[#505050] uppercase tracking-[0.2em] mb-2">Customer Name</p>
                        <p className="text-sm font-bold text-white uppercase tracking-widest">{expandedOrder.delivery_info?.name || 'Walk-in'}</p>
                      </div>
                    )}
                    {expandedOrder.notes && (
                      <div className="col-span-full pt-4 border-t border-white/5">
                        <p className="text-[9px] font-bold text-orange-400 uppercase tracking-[0.2em] mb-2">Special Instructions</p>
                        <div className="bg-orange-400/5 p-4 rounded-xl border border-orange-400/10 italic text-white/80 text-sm">
                          "{expandedOrder.notes}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => triggerDirectPrint(expandedOrder, 'kitchen')}
                      className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 hover:bg-orange-500/10 hover:text-orange-500"
                      icon={<ChefHat className="w-5 h-5" />}
                    >
                      Kitchen
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => triggerDirectPrint(expandedOrder, 'main')}
                      className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 hover:bg-primary/10 hover:text-primary"
                      icon={<Printer className="w-5 h-5" />}
                    >
                      Receipt
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => { setOrderToDiscount(expandedOrder); setDiscountValue(expandedOrder.discount_amount || ''); setDiscountType('fixed'); setEditingDiscountId(null); setDiscountReason(''); }}
                      className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 hover:bg-yellow-500/10 hover:text-yellow-500"
                      icon={<Percent className="w-5 h-5" />}
                    >
                      Discount
                    </Button>
                    
                    {expandedOrder.order_type === 'dine_in' && !['completed', 'cancelled'].includes(expandedOrder.status) && (
                      <Button 
                        variant="outline" 
                        onClick={() => setOrderToChangeTable(expandedOrder)}
                        className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 hover:bg-accent/10 hover:text-accent"
                        icon={<Store className="w-5 h-5" />}
                      >
                        Change Table
                      </Button>
                    )}

                    {expandedOrder.status !== 'completed' && expandedOrder.status !== 'cancelled' && expandedOrder.order_type === 'delivery' && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setOrderToAssign(expandedOrder);
                          setIsAssignModalOpen(true);
                        }}
                        className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 hover:bg-blue-500/10 hover:text-blue-400"
                        icon={<Bike className="w-5 h-5" />}
                      >
                        Assign Delivery
                      </Button>
                    )}

                    {expandedOrder.status !== 'completed' && expandedOrder.status !== 'cancelled' && Number(expandedOrder.total) - Number(expandedOrder.paid_amount || 0) > 0 && (
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          loadOrderForEditing(expandedOrder, true);
                          setTimeout(() => setIsPaymentModalOpen(true), 100);
                        }}
                        className="h-14 font-black uppercase tracking-widest text-[9px] border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500"
                        icon={<Banknote className="w-5 h-5" />}
                      >
                        Add Payment
                      </Button>
                    )}

                    {expandedOrder.status !== 'completed' && expandedOrder.status !== 'cancelled' && (
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          const hasPaid = Number(expandedOrder.paid_amount || 0) > 0;
                          if (hasPaid) {
                            handleFinalizeOrder(expandedOrder);
                          } else {
                            setIsFinalizingFromModal(true);
                            loadOrderForEditing(expandedOrder, false);
                            setTimeout(() => setIsPaymentModalOpen(true), 100);
                          }
                        }}
                        className="h-14 font-black uppercase tracking-widest text-[9px] bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/10 border-0 col-span-2 sm:col-span-1"
                        icon={Number(expandedOrder.paid_amount || 0) > 0 ? <CheckCircle2 className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      >
                        {Number(expandedOrder.paid_amount || 0) > 0 ? 'Finalize' : 'Checkout'}
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setOrderToCancel(expandedOrder)}
                      className="h-14 font-black uppercase tracking-widest text-[9px] border-white/10 text-red-500/60 hover:text-red-500 hover:bg-red-500/10"
                      icon={<Ban className="w-5 h-5" />}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Main Menu View */
          <div className="flex flex-col h-full animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-0">
              <div>
                <h1 className="text-lg font-bold uppercase tracking-tight text-white flex items-center gap-3">
                  POS <span className="text-primary text-[0.8em]">Terminal</span>
                  {editingOrder && (
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 bg-primary/20 border border-primary/30 rounded-full text-primary animate-pulse">
                      Editing Mode
                    </span>
                  )}
                </h1>
              </div>
              <div className="lg:hidden flex items-center gap-2">
                <button 
                  onClick={() => setIsActiveOrdersModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg hidden"
                >
                  <ListOrdered className="w-4 h-4 text-primary" />
                  <Badge variant="default" size="sm" className="bg-primary text-white text-[9px] px-1.5 py-0 min-w-[1.25rem]">{activeOrders.length}</Badge>
                </button>
              </div>
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
              onClick={() => {
                setOrderType('dine_in');
                if (!selectedTable) setIsTableModalOpen(true);
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all ${orderType === 'dine_in' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
            >
              <Store className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
              <span className="truncate">DINE IN</span>
            </button>
            <button 
              onClick={() => {
                setOrderType('takeaway');
                setSelectedTable('');
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all ${orderType === 'takeaway' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
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
              className={`flex items-center justify-center gap-1.5 py-1.5 px-0.5 text-[8px] md:text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all ${orderType === 'delivery' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-[#666] hover:text-[#888]'}`}
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
              <span className="text-[11px] font-bold uppercase tracking-wider flex-1 truncate">
                {selectedTable 
                  ? `Table ${tables.find(t => t.id === selectedTable)?.name || '?'} · Cap. ${tables.find(t => t.id === selectedTable)?.capacity || '?'}` 
                  : 'Choose Table'}
              </span>
              {selectedTable && (
                <span
                  onClick={e => { e.stopPropagation(); setSelectedTable(''); }}
                  className="text-[#606060] hover:text-white text-[9px] font-bold uppercase tracking-widest shrink-0 cursor-pointer"
                >
                  ✕
                </span>
              )}
            </button>
          )}

          {orderType === 'delivery' && deliveryInfo.name && (
            <div className="col-span-full flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-[10px] font-bold text-primary uppercase tracking-widest animate-fade-in cursor-pointer hover:bg-primary/10 transition-colors" onClick={() => setIsDeliveryModalOpen(true)}>
              <Bike className="w-4 h-4" />
              <span>Deliver to: {deliveryInfo.name} • {deliveryInfo.phone} • {deliveryInfo.address.slice(0, 30)}...</span>
              <span className="ml-auto text-[8px] opacity-60">Click to edit</span>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative group">
          <Input 
            id="pos-search-input"
            placeholder="Search products... (Press '/' to focus)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-5 h-5 text-[#808080] group-focus-within:text-primary transition-colors" />}
            className="bg-[#1A1A1A] border-[#2A2A2A] focus:border-primary/50"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-[#444] border border-[#2A2A2A] px-1.5 py-0.5 rounded uppercase tracking-tighter pointer-events-none group-focus-within:opacity-0 transition-opacity">
            / Show
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar bg-black/20 p-2 rounded-xl border border-white/5">
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
                <h3 className="font-bold text-sm md:text-base mb-1 text-white uppercase tracking-tight leading-tight min-h-[2.5rem] md:min-h-[3rem] whitespace-normal">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between gap-2 mt-auto pt-1">
                  <p className="text-[#666] text-[9px] md:text-[11px] font-mono truncate">SKU: {product.sku}</p>
                  <p className="text-primary font-bold text-base md:text-lg shrink-0 font-mono">Rs. {parseFloat(product.price).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
        )}
      </div>
      
      {/* Pane 3: Cart Section (Right Sidebar) */}
      <div className={`
        fixed inset-0 lg:static z-50 lg:z-auto bg-black/40 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none
        transition-all duration-500 ease-in-out
        ${isCartOpen ? 'translate-y-0 opacity-100' : 'translate-y-full lg:translate-y-0 opacity-0 lg:opacity-100 pointer-events-none lg:pointer-events-auto'}
      `}>
        <div className={`
          absolute bottom-0 lg:static w-full lg:w-[320px] xl:w-[380px] bg-[#0A0A0A] border border-white/5 lg:rounded-3xl 
          flex flex-col shadow-2xl h-[90vh] lg:h-full
          transition-transform duration-500 overflow-hidden
          ${isCartOpen ? 'translate-y-0' : 'translate-y-[20%] lg:translate-y-0'}
        `}>
          {/* Animated Gradient Border Overlay */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[inherit]"></div>
          
          {/* Header */}
          <div className="p-4 border-b border-base bg-white/[0.02] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold uppercase tracking-tight text-white mb-0.5">Live Bill</h2>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  {orderType ? orderType.replace('_', ' ') : 'No Type'}
                </p>
                {orderType === 'dine_in' && selectedTable && (
                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">
                    • Table {tables.find(t => t.id === selectedTable)?.name || selectedTable}
                  </span>
                )}
                {selectedCustomer && customers.length > 0 && (
                  <span className="text-[8px] font-bold text-accent/70 uppercase tracking-widest truncate max-w-[120px]">
                    • {customers.find(c => c.id === selectedCustomer)?.name || 'Customer'}
                  </span>
                )}
                {editingOrder && (
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-primary">
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
                  <UserIcon className="w-3.5 h-3.5 text-[#505050] shrink-0" />
                  <select
                    value={selectedCustomer}
                    onChange={e => setSelectedCustomer(e.target.value)}
                    className="flex-1 bg-transparent border-0 text-white text-[11px] font-bold focus:outline-none cursor-pointer appearance-none"
                  >
                    <option value="" className="bg-[#1A1A1A]">Walk-in (no customer)</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#1A1A1A]">
                        {c.name}{c.phone ? ` · ${c.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Notes inline */}
              <div className="flex items-start gap-2">
                <span className="text-[#505050] mt-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">Notes:</span>
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
                  <p className="font-bold uppercase tracking-[0.4em] text-[10px]">Empty Basket</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={item.product.id} className="flex items-center gap-2.5 p-2.5 bg-white/[0.03] rounded-2xl border border-white/[0.05] hover:bg-white/[0.06] group/item transition-all">
                    {/* Index */}
                    <span className="text-[10px] font-bold text-[#404040] w-4 text-center shrink-0">{idx + 1}</span>
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
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-bold text-sm uppercase tracking-tight text-white leading-tight mb-0.5 whitespace-normal">{item.product.name}</h4>
                      <p className="text-primary text-xs font-bold font-mono">Rs. {(parseFloat(item.product.price) * item.quantity).toFixed(2)}</p>
                    </div>
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-95 border border-white/5"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-5 text-center text-[11px] font-bold tabular-nums">{item.quantity}</span>
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
              <div className="flex justify-between items-center text-[#606060] text-[10px] font-bold uppercase tracking-[0.15em]">
                <span>Subtotal</span>
                <span className="text-white font-mono">Rs. {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[#606060] text-[10px] font-bold uppercase tracking-[0.15em]">
                <span className="flex items-center gap-1.5">Tax <span className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] border border-white/5">16%</span></span>
                <span className="text-white font-mono">Rs. {totalTax.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-[#2A2A2A]">
                <span className="text-xl font-bold text-white tracking-tight uppercase">TOTAL</span>
                <span className="text-2xl font-bold text-primary tabular-nums">Rs. {total.toFixed(2)}</span>
              </div>

              {editingOrder && (
                <div className="flex gap-4 pt-1">
                  <div className="flex-1 text-center bg-success/5 rounded-xl py-1.5 border border-success/10">
                    <p className="text-[8px] font-bold text-success/60 uppercase tracking-widest">Paid</p>
                    <p className="text-sm font-bold text-success">Rs. {parseFloat(editingOrder.paid_amount || '0').toFixed(2)}</p>
                  </div>
                  <div className="flex-1 text-center bg-error/5 rounded-xl py-1.5 border border-error/10">
                    <p className="text-[8px] font-bold text-error/60 uppercase tracking-widest">Dues</p>
                    <p className="text-sm font-bold text-error animate-pulse">Rs. {Math.max(0, total - parseFloat(editingOrder.paid_amount || '0')).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 grid grid-cols-3 gap-2">
              <Button 
                variant={editingOrder && editingOrder.status !== 'draft' ? "primary" : "outline"}
                className={`${editingOrder && editingOrder.status !== 'draft' ? 'text-white' : 'text-[#808080] border-[#2A2A2A]'} hover:bg-[#2A2A2A] hover:text-white font-bold h-12 uppercase tracking-[0.2em] text-[8px] sm:text-[9px] rounded-xl px-2 flex-1`}
                disabled={cart.length === 0 || !!isProcessing}
                onClick={handleSaveDraft}
                isLoading={!!isProcessing}
              >
                {editingOrder ? (editingOrder.status === 'draft' ? 'Save Draft' : 'Update Order') : 'Draft'}
              </Button>
              <Button 
                variant="outline" 
                className="text-primary border-primary/20 hover:bg-primary/10 font-bold h-12 uppercase tracking-[0.2em] text-[8px] sm:text-[9px] rounded-xl px-2 flex-1"
                disabled={cart.length === 0 || !!isProcessing || !!(editingOrder && editingOrder.status !== 'draft')}
                onClick={handleConfirmOrder}
                isLoading={!!isProcessing}
              >
                {editingOrder && editingOrder.status !== 'draft' ? 'Confirmed' : 'Confirm'}
              </Button>
              <Button 
                variant="primary" 
                className="text-white font-bold h-12 uppercase tracking-[0.2em] text-[8px] sm:text-[9px] shadow-xl shadow-primary/20 rounded-xl px-2"
                disabled={cart.length === 0 || !!isProcessing}
                onClick={() => {
                  if (editingOrder && Number(editingOrder.paid_amount || 0) > 0) {
                    handleFinalizeOrder(editingOrder);
                  } else {
                    handleCheckoutClick();
                  }
                }}
              >
                { (editingOrder && Number(editingOrder.paid_amount || 0) > 0) ? 'Finalize' : 'Checkout' }
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
            <p className="text-[#808080] text-sm uppercase tracking-widest font-bold mb-2">
              {editingOrder && Number(editingOrder.paid_amount || 0) > total ? 'Return Amount' : 'Total Amount Due'}
            </p>
            <p className={`text-4xl font-bold ${editingOrder && Number(editingOrder.paid_amount || 0) > total ? 'text-emerald-400' : 'text-primary'}`}>
              Rs. {editingOrder && Number(editingOrder.paid_amount || 0) > total 
                ? (Number(editingOrder.paid_amount || 0) - total).toFixed(2) 
                : (total - Number(editingOrder?.paid_amount || 0)).toFixed(2)}
            </p>
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
                  <span className="text-2xl font-bold text-white">
                    Rs. {(parseFloat(amountTendered || '0') - total).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-[#2A2A2A] flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            {(() => {
              const alreadyPaid = Number(editingOrder?.paid_amount || 0);
              const remaining = total - alreadyPaid;
              const isOverpaid = alreadyPaid > total;
              
              return (
                <Button 
                  variant="primary" 
                  onClick={handleProcessPayment}
                  isLoading={isProcessing}
                  disabled={paymentMethod === 'cash' && remaining > 0 && parseFloat(amountTendered || '0') < remaining && amountTendered !== ''}
                >
                  {isOverpaid ? 'Confirm & Return Change' : `Confirm & Pay Rs. ${Math.max(0, remaining).toFixed(2)}`}
                </Button>
              );
            })()}
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
            <h3 className="text-xl md:text-2xl font-bold text-white  uppercase tracking-tighter mb-2 drop-shadow-2xl">Transaction Verified</h3>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-[0_0_10px_#10B981]"></span>
              </span>
              <p className="text-[10px] font-bold text-tertiary uppercase tracking-[0.3em] leading-none">
                Order Registry #{completedOrder?.order_number || completedOrder?.id?.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 shadow-inner group">
              <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Total Settlement</p>
              <p className="text-2xl font-bold text-primary font-mono tracking-tighter">Rs. {Number(completedOrder?.total || 0).toFixed(2)}</p>
            </div>
            <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 shadow-inner group">
              <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest mb-1 group-hover:text-white transition-colors">Asset Count</p>
              <p className="text-2xl font-bold text-white font-mono tracking-tighter">{completedOrder?.items?.length || 0}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
            <Button 
              variant="outline" 
              className="flex-1 py-7 h-auto font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl border-white/10 hover:bg-white/5"
              onClick={() => { setIsReceiptModalOpen(false); setCompletedOrder(null); }}
            >
              New Transaction
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 py-7 h-auto font-bold uppercase tracking-[0.2em] text-[10px] rounded-2xl border-white/10 hover:bg-orange-500/10 hover:text-orange-500"
              icon={<ChefHat className="w-4 h-4" />}
              onClick={() => {
                if (completedOrder) triggerDirectPrint(completedOrder, 'kitchen');
              }}
            >
              Kitchen
            </Button>
            <Button 
              variant="primary" 
              className="flex-1 py-7 h-auto font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/30 rounded-2xl"
              icon={<Printer className="w-4 h-4" />}
              onClick={() => {
                setOrderToPrint(completedOrder);
                setIsPrintOptionsModalOpen(true);
              }}
            >
              Print Options
            </Button>
          </div>
        </div>
      </Modal>

      {/* Printer Selection Modal */}
      <Modal
        isOpen={isPrintOptionsModalOpen}
        onClose={() => setIsPrintOptionsModalOpen(false)}
        title="Print Options"
        size="sm"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div 
              onClick={() => setPrintKitchen(!printKitchen)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                printKitchen ? "bg-primary/10 border-primary shadow-glow-primary" : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#404040]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-lg", printKitchen ? "bg-primary text-white" : "bg-white/5 text-[#808080]")}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn("font-bold text-sm uppercase tracking-wider", printKitchen ? "text-primary" : "text-white")}>Kitchen Thermal 1</p>
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">LAN Connection • Online</p>
                </div>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", printKitchen ? "border-primary bg-primary" : "border-[#404040]")}>
                {printKitchen && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>

            <div 
              onClick={() => setPrintMain(!printMain)}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group",
                printMain ? "bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#404040]"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-2.5 rounded-lg", printMain ? "bg-emerald-500 text-white" : "bg-white/5 text-[#808080]")}>
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <p className={cn("font-bold text-sm uppercase tracking-wider", printMain ? "text-emerald-500" : "text-white")}>Receipt Printer (Main)</p>
                  <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold">USB Connection • Online</p>
                </div>
              </div>
              <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all", printMain ? "border-emerald-500 bg-emerald-500" : "border-[#404040]")}>
                {printMain && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-[#2A2A2A]">
            <Button variant="outline" fullWidth onClick={() => setIsPrintOptionsModalOpen(false)} className="h-12 uppercase tracking-widest text-[10px] font-bold rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              fullWidth
              disabled={!printKitchen && !printMain}
              onClick={async () => {
                if (orderToPrint) {
                  await triggerDirectPrint(orderToPrint, printKitchen && printMain ? 'both' : printKitchen ? 'kitchen' : 'main');
                }
                setIsPrintOptionsModalOpen(false);
              }}
              className="h-12 uppercase tracking-widest text-[10px] font-bold rounded-xl shadow-xl shadow-primary/20"
            >
              Start Print Job
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delivery Details Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setDeliveryPhoneSearch('');
          setDeliveryNameSearch('');
          setMatchedCustomer(null);
        }}
        title="Delivery Details"
      >
        <div className="space-y-5">
          {/* Search Section */}
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#666]">Search Customer</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone Search */}
              <Input
                placeholder="Search by Phone Number..."
                value={deliveryPhoneSearch}
                icon={<Phone className="w-4 h-4 text-[#444]" />}
                onChange={(e) => {
                  const val = e.target.value;
                  setDeliveryPhoneSearch(val);
                  setDeliveryNameSearch('');
                  if (val.length >= 3) {
                    const match = customers.find(c =>
                      (c.phone || c.phone_number || '').includes(val)
                    );
                    if (match) {
                      setMatchedCustomer(match);
                      setDeliveryInfo({ name: match.name, phone: match.phone || match.phone_number || '', address: match.address || '' });
                      setSelectedCustomer(match.id);
                    } else {
                      setMatchedCustomer(null);
                    }
                  } else {
                    setMatchedCustomer(null);
                  }
                }}
                className="bg-black/20 border-white/5"
              />
              {/* Name Search */}
              <Input
                placeholder="Search by Name..."
                value={deliveryNameSearch}
                icon={<UserIcon className="w-4 h-4 text-[#444]" />}
                onChange={(e) => {
                  const val = e.target.value;
                  setDeliveryNameSearch(val);
                  setDeliveryPhoneSearch('');
                  if (val.length >= 2) {
                    const match = customers.find(c =>
                      c.name.toLowerCase().includes(val.toLowerCase())
                    );
                    if (match) {
                      setMatchedCustomer(match);
                      setDeliveryInfo({ name: match.name, phone: match.phone || match.phone_number || '', address: match.address || '' });
                      setSelectedCustomer(match.id);
                    } else {
                      setMatchedCustomer(null);
                    }
                  } else {
                    setMatchedCustomer(null);
                  }
                }}
                className="bg-black/20 border-white/5"
              />
            </div>

            {/* Match found card */}
            {matchedCustomer && (
              <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-300 uppercase tracking-wide truncate">{matchedCustomer.name}</p>
                  <p className="text-[10px] text-emerald-400/70 font-mono">{matchedCustomer.phone || matchedCustomer.phone_number}</p>
                  {matchedCustomer.address && (
                    <p className="text-[10px] text-emerald-400/60 truncate">{matchedCustomer.address}</p>
                  )}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">Auto-filled</span>
              </div>
            )}

            {/* No match hint when searching */}
            {(deliveryPhoneSearch.length >= 3 || deliveryNameSearch.length >= 2) && !matchedCustomer && (
              <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest text-center py-1">
                No existing customer found · Enter details manually below
              </p>
            )}
          </div>

          {/* Manual Entry / Auto-filled Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              placeholder="Enter name..."
              value={deliveryInfo.name}
              autoComplete="off"
              onChange={(e) => {
                setDeliveryInfo({ ...deliveryInfo, name: e.target.value });
                if (matchedCustomer) setMatchedCustomer(null);
                setSelectedCustomer('');
              }}
              className="bg-[#0A0A0A] border-[#2A2A2A]"
              icon={<UserIcon className="w-4 h-4" />}
            />
            <Input
              label="Phone Number"
              placeholder="e.g. 03001234567"
              value={deliveryInfo.phone}
              onChange={(e) => {
                const newPhone = e.target.value;
                setDeliveryInfo({ ...deliveryInfo, phone: newPhone });
                // Also auto-fill if typed directly in this field
                if (newPhone.length >= 7) {
                  const match = customers.find(c => (c.phone || c.phone_number) === newPhone);
                  if (match) {
                    setMatchedCustomer(match);
                    setDeliveryInfo({ name: match.name, phone: newPhone, address: match.address || '' });
                    setSelectedCustomer(match.id);
                  }
                }
              }}
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
            <Button variant="outline" onClick={() => {
              setIsDeliveryModalOpen(false);
              setDeliveryPhoneSearch('');
              setDeliveryNameSearch('');
              setMatchedCustomer(null);
            }}>Discard</Button>
            <Button 
              variant="primary" 
              onClick={() => {
                if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
                  toast.error('Name, phone, and address are required');
                  return;
                }
                setIsDeliveryModalOpen(false);
                setDeliveryPhoneSearch('');
                setDeliveryNameSearch('');
                setMatchedCustomer(null);
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
                setIsTableModalOpen(true);
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
            <Button variant="outline" onClick={() => setIsTypeModalOpen(false)} className="w-full max-w-xs h-12 uppercase tracking-widest text-[10px] font-bold rounded-xl">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Table Selection Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title="Select Table"
        size="lg"
      >
        <div className="space-y-5">
          {/* Branch context info */}
          <div className="flex items-center justify-between bg-[#0A0A0A] px-4 py-3 rounded-xl border border-[#2A2A2A]">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-tertiary">
                {branches.find(b => b.id === selectedBranch)?.name || 'All Branches'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                AVAILABLE
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                OCCUPIED
              </span>
            </div>
          </div>

          {/* Table Grid */}
          {(() => {
            const branchTables = tables
              .filter(t => !selectedBranch || t.branch === selectedBranch)
              .sort((a, b) => {
                const numA = parseInt(a.name.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.name.replace(/\D/g, '')) || 0;
                if (numA && numB) return numA - numB;
                return a.name.localeCompare(b.name);
              });

            if (branchTables.length === 0) {
              return (
                <div className="text-center py-12">
                  <LayoutGrid className="w-10 h-10 text-[#2A2A2A] mx-auto mb-3" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#505050]">
                    No tables found for this branch
                  </p>
                  <p className="text-[9px] text-[#404040] mt-1">Create tables from the Tables page first</p>
                </div>
              );
            }
            return (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                {branchTables.map(table => {
                  const isSelected = selectedTable === table.id;
                  const isOccupied = table.is_occupied;
                  return (
                    <button
                      key={table.id}
                      onClick={() => {
                        if (isOccupied) {
                          setPendingOccupiedTable(table);
                          return;
                        }
                        setSelectedTable(table.id);
                        setIsTableModalOpen(false);
                      }}
                      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 group
                        ${isSelected
                          ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(212,175,55,0.2)] scale-[1.02]'
                          : isOccupied
                            ? 'bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                            : 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        }
                      `}
                    >
                      {/* Status dot */}
                      <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${isOccupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'} ${!isOccupied && !isSelected ? 'animate-pulse' : ''}`} />

                      {/* Table icon/number */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all
                        ${isSelected 
                          ? 'bg-primary/30 text-primary' 
                          : isOccupied 
                            ? 'bg-white/20 text-white' 
                            : 'bg-emerald-500/20 text-emerald-500'
                        }
                      `}>
                        <Store className="w-6 h-6" />
                      </div>

                      {/* Table name */}
                      <span className={`text-[11px] font-bold uppercase tracking-wider truncate w-full text-center
                        ${isSelected ? 'text-primary' : isOccupied ? 'text-white' : 'text-emerald-400'}
                      `}>
                        {table.name}
                      </span>

                      {/* Occupied badge or Capacity */}
                      {isOccupied ? (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full border border-white/30">
                          ● OCCUPIED
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/30">
                          ● AVAILABLE
                        </span>
                      )}

                      {/* Selected check */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                          <UserIcon className="w-3.5 h-3.5 text-white/40" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* Footer */}
          <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
            {selectedTable && (
              <button
                onClick={() => { setSelectedTable(''); }}
                className="text-[10px] font-bold uppercase tracking-widest text-error/60 hover:text-error transition-colors"
              >
                Clear Selection
              </button>
            )}
            <div className="ml-auto">
              <Button variant="outline" onClick={() => setIsTableModalOpen(false)} className="h-10 uppercase tracking-widest text-[10px] font-bold rounded-xl">
                {selectedTable ? 'Done' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Occupied Table Confirmation Modal */}
      <Modal
        isOpen={!!pendingOccupiedTable}
        onClose={() => setPendingOccupiedTable(null)}
        title="Table Occupied"
      >
        {pendingOccupiedTable && (
          <div className="space-y-6">
            {/* Warning Icon */}
            <div className="flex flex-col items-center text-center py-2">
              <div className="w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-5 border border-error/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <AlertTriangle className="w-10 h-10 text-error" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-2">
                This Table is Occupied
              </h3>
              <p className="text-sm text-[#808080] max-w-xs">
                <span className="text-error font-bold">{pendingOccupiedTable.name}</span> currently has an active order. Assigning it to this order may cause conflicts.
              </p>
            </div>

            {/* Table Info Card */}
            <div className="bg-error/5 border border-error/20 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-14 h-14 bg-error/10 rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-7 h-7 text-error" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm uppercase tracking-wider">{pendingOccupiedTable.name}</p>
                <p className="text-[10px] text-[#808080] font-bold uppercase tracking-widest mt-0.5">
                  {pendingOccupiedTable.capacity} Seats · <span className="text-error">Currently Occupied</span>
                </p>
              </div>
              <span className="w-3 h-3 rounded-full bg-error animate-pulse shrink-0" />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
              <Button 
                variant="outline" 
                fullWidth
                onClick={() => setPendingOccupiedTable(null)}
                className="font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl"
              >
                Go Back
              </Button>
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => {
                  setSelectedTable(pendingOccupiedTable.id);
                  setPendingOccupiedTable(null);
                  setIsTableModalOpen(false);
                }}
                className="font-bold text-[10px] uppercase tracking-widest h-12 rounded-xl bg-error hover:bg-error/90 shadow-xl shadow-error/20"
              >
                Assign Anyway
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Clear Cart Confirmation */}
      <ConfirmModal
        isOpen={isClearCartModalOpen}
        onClose={() => setIsClearCartModalOpen(false)}
        onConfirm={() => setCart([])}
        title="Clear Cart"
        message="Are you sure you want to clear the entire cart?"
        description="All items will be removed and this action cannot be undone."
        confirmText="Clear All"
        cancelText="Keep Items"
        variant="danger"
        icon={Trash2}
      />

      {/* Change Table Modal */}
      <Modal
        isOpen={!!orderToChangeTable}
        onClose={() => setOrderToChangeTable(null)}
        title="Change Table"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-tertiary uppercase tracking-widest">Select new table for Order <span className="text-white font-bold">{orderToChangeTable?.order_number || orderToChangeTable?.id.substring(0,6)}</span></p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
            {tables
              .filter(t => !t.is_occupied || t.id === orderToChangeTable?.table)
              .map(table => (
              <button
                key={table.id}
                onClick={() => handleChangeTable(orderToChangeTable!.id, table.id)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  orderToChangeTable?.table === table.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/5 bg-white/5 text-tertiary hover:border-white/20'
                }`}
              >
                <Store className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{table.name}</span>
              </button>
            ))}
          </div>
          <div className="pt-4 border-t border-[#2A2A2A] flex justify-end">
            <Button variant="outline" onClick={() => setOrderToChangeTable(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Order Confirm Modal */}
      <ConfirmModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => orderToCancel && handleCancelOrderFromModal(orderToCancel)}
        title="Cancel Order"
        message={`Cancel Order #${orderToCancel?.order_number || orderToCancel?.id?.substring(0,6)}?`}
        description="This action cannot be undone. The order will be marked as cancelled."
        confirmText="Yes, Cancel Order"
        cancelText="Keep Order"
        variant="danger"
        icon={Ban}
      />

      {/* Discount Modal */}
      <Modal
        isOpen={!!orderToDiscount}
        onClose={() => { setOrderToDiscount(null); setDiscountValue(''); setDiscountReason(''); setEditingDiscountId(null); }}
        title="Order Discounts"
        size="sm"
      >
        {orderToDiscount && (
          <div className="space-y-5">
            {/* Order Info */}
            <div className="bg-[#0A0A0A] rounded-2xl p-4 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest">Order</p>
                <p className="text-sm font-bold text-white mt-0.5">#{orderToDiscount.order_number || orderToDiscount.id.substring(0,6)}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest">Order Total</p>
                <p className="text-lg font-bold text-primary font-mono">Rs. {Number(orderToDiscount.total).toFixed(2)}</p>
              </div>
            </div>

            {/* Existing Discounts */}
            {orderToDiscount.discounts && orderToDiscount.discounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest px-1">Applied Discounts</p>
                {orderToDiscount.discounts.filter(d => d.is_active !== false).map(d => (
                  <div key={d.id} className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
                          {d.type === 'percentage' ? `${d.value}%` : `Rs. ${d.value}`}
                        </span>
                        <span className="text-xs font-bold text-white uppercase tracking-tight">{d.reason || 'Discount'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          setEditingDiscountId(d.id);
                          setDiscountValue(d.value);
                          setDiscountType(d.type as any);
                          setDiscountReason(d.reason);
                        }}
                        disabled={isApplyingDiscount}
                        className="p-2 hover:bg-yellow-500/10 text-yellow-500/60 hover:text-yellow-500 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRemoveDiscount(orderToDiscount.id, d)}
                        disabled={isApplyingDiscount}
                        className="p-2 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-white/5 space-y-5">
              <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-bold text-tertiary uppercase tracking-widest">
                  {editingDiscountId ? 'Update Discount' : 'Apply New Discount'}
                </p>
                {editingDiscountId && (
                  <button 
                    onClick={() => {
                      setEditingDiscountId(null);
                      setDiscountValue('');
                      setDiscountReason('');
                    }}
                    className="text-[9px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300"
                  >
                    Cancel Editing
                  </button>
                )}
              </div>
              
              {/* Type Toggle */}
              <div className="grid grid-cols-2 bg-[#0A0A0A] rounded-xl p-1 border border-[#2A2A2A] gap-1">
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${discountType === 'fixed' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-[#666] hover:text-[#888]'}`}
                >
                  <span className="text-xs">Rs.</span> Fixed Amount
                </button>
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${discountType === 'percentage' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'text-[#666] hover:text-[#888]'}`}
                >
                  <Percent className="w-3.5 h-3.5" /> Percentage
                </button>
              </div>

              {/* Input */}
              <div className="space-y-4">
                <Input
                  type="number"
                  placeholder={discountType === 'fixed' ? 'Enter amount (Rs.)...' : 'Enter percentage (0-100)...'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  className="bg-[#0A0A0A] h-12 text-lg font-bold border-[#2A2A2A]"
                  icon={discountType === 'fixed' ? <span className="text-[#808080] font-bold pl-2 text-sm">Rs.</span> : <Percent className="w-4 h-4 text-[#808080]" />}
                />
                
                <TextArea
                  placeholder="Reason for discount (optional)..."
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="bg-[#0A0A0A] border-[#2A2A2A] text-sm"
                  rows={2}
                />

                {/* Live Calculation Display */}
                {(() => {
                  if (!discountValue || isNaN(parseFloat(discountValue)) || !orderToDiscount) return null;
                  const val = parseFloat(discountValue);
                  if (val <= 0) return null;
                  
                  const orderTotal = Number(orderToDiscount.total || 0);
                  const amount = discountType === 'percentage' 
                    ? (orderTotal * val / 100) 
                    : val;
                  const newTotal = Math.max(0, orderTotal - amount);

                  return (
                    <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-tertiary">
                        <span>Original Total</span>
                        <span className="text-white">Rs. {orderTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-yellow-500/80 uppercase tracking-tight">Discount Amount</span>
                        <span className="text-lg font-black text-yellow-500">
                          - Rs. {amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-yellow-500/10 flex justify-between items-center">
                        <span className="text-xs font-black text-white uppercase tracking-widest">New Total</span>
                        <span className="text-xl font-black text-white">
                          Rs. {newTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-[#2A2A2A]">
                <Button variant="outline" fullWidth onClick={() => { setOrderToDiscount(null); setDiscountValue(''); setDiscountReason(''); setEditingDiscountId(null); }} className="h-11 uppercase tracking-widest text-[10px] font-bold rounded-xl">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => editingDiscountId ? handleUpdateDiscount(editingDiscountId) : handleApplyDiscount()}
                  isLoading={isApplyingDiscount}
                  disabled={!discountValue || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0}
                  className="h-11 uppercase tracking-widest text-[10px] font-bold rounded-xl shadow-xl shadow-yellow-500/10 bg-yellow-500 hover:bg-yellow-400 border-yellow-500 text-black"
                >
                  {editingDiscountId ? 'Update Discount' : 'Apply Discount'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Delivery Person Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setOrderToAssign(null); setSelectedDeliveryPerson(''); }}
        title="Assign Delivery Person"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-tertiary uppercase tracking-widest">Select driver for Order <span className="text-white font-bold">{orderToAssign?.order_number || orderToAssign?.id.substring(0,6)}</span></p>
          
          <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
            {deliveryPersons.map(person => (
              <button
                key={person.id}
                onClick={() => setSelectedDeliveryPerson(person.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedDeliveryPerson === person.id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-white/5 bg-white/5 text-tertiary hover:border-white/10'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-sm uppercase tracking-tight">{person.name}</p>
                  <p className="text-[10px] opacity-60 font-bold uppercase tracking-widest">{person.phone_number}</p>
                </div>
                {selectedDeliveryPerson === person.id && <CheckCircle2 className="w-4 h-4" />}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#2A2A2A] flex gap-3">
            <Button variant="outline" fullWidth onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button 
              variant="primary" 
              fullWidth 
              disabled={!selectedDeliveryPerson || isProcessing}
              onClick={handleAssignDelivery}
              isLoading={isProcessing}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      <div className="lg:hidden fixed bottom-6 left-6 right-6 z-40 animate-slide-up">
        {cart.length > 0 && (
          <button 
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-white h-16 rounded-2xl shadow-[0_10px_30px_rgba(212,175,55,0.4)] flex items-center justify-between px-6 font-bold uppercase tracking-widest border border-white/20 active:scale-95 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center text-xs">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </div>
              <span>View Order</span>
            </div>
            <div className="text-lg">Rs. {total.toFixed(2)}</div>
          </button>
        )}
      </div>

      {/* Hidden Receipt for Printing */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none">
        {completedOrder && (
          <Receipt 
            ref={receiptRef} 
            order={completedOrder} 
            products={allProductsMap}
            tables={Object.fromEntries(tables.map(t => [t.id, t.name]))}
            customers={Object.fromEntries(customers.map(c => [c.id, c.name]))}
            users={users}
            logoUrl={(() => {
              const bId = completedOrder.branch || selectedBranch;
              const b = branches.find(b => b.id === bId) || branches[0];
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.receipt_logo || b?.receipt_logo;
            })()}
            logoUrlBottom={(() => {
              const bId = completedOrder.branch || selectedBranch;
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.receipt_logo_bottom;
            })()}
            paymentAccount={(() => {
              const bId = completedOrder.branch || selectedBranch;
              const b = branches.find(b => b.id === bId) || branches[0];
              const local = bId ? localSettingsService.getForBranch(bId) : {};
              return local.payment_account || b?.payment_account;
            })()}
            deliveryPersons={Object.fromEntries(deliveryPersons.map(p => [String(p.id).trim(), { id: String(p.id).trim(), name: p.name, phone_number: p.phone_number }]))}
          />
        )}

        {kitchenPrintOrder && (
          <KitchenReceipt 
            ref={kitchenReceiptRef} 
            order={kitchenPrintOrder} 
            products={allProductsMap}
            tables={Object.fromEntries(tables.map(t => [t.id, t.name]))}
            customers={Object.fromEntries(customers.map(c => [c.id, c.name]))}
            users={users}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes subtle-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        .pos-card-animate {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pos-card-animate:hover {
          transform: translateY(-4px) scale(1.02);
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(212, 175, 55, 0.3);
        }
        .pos-card-animate:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
