export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Only for creation/update
  role: string | 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier';
  branch: string; // Branch ID
  branch_name?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: string[];
  permissions_list?: string; // String from backend e.g. "view_orders,add_order"
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  address: string;
  city?: string;
  email?: string;
  phone_number: string;
  is_active: boolean;
  receipt_logo?: string;
  receipt_logo_bottom?: string;
  payment_account?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  branch: string; // Branch ID
  branch_name?: string;
  address?: string;
  phone?: string;
  phone_number?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  is_occupied: boolean;
  is_active: boolean;
  branch: string; // Branch ID
  branch_name?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  price: string;
  cost: string;
  tax_percentage?: string;
  category: string; // Category ID
  category_name?: string;
  image?: string;
  is_active: boolean;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  product: string; // Product ID
  product_name?: string;
  order?: string;
  quantity: number;
  unit_price?: string;
  taxamount?: string;
  discount_amount?: string;
  total_price?: string;
  notes?: string;
  action?: 'original' | 'addition' | 'void';
  created_at?: string;
  updated_at?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  order_number?: string;
  branch: string;
  branch_name?: string;
  items: OrderItem[];
  order_type: OrderType;
  table?: string;
  table_id?: string; // used for creation
  table_no?: string;
  customer?: string;
  created_by?: string;
  delivery_person?: string;
  delivery_person_name?: string;
  delivery_info?: {
    id?: string;
    name: string;
    address: string;
    phone: string;
  };
  notes?: string;
  status: OrderStatus;
  subtotal: string;
  taxamount: string;
  discount_amount: string;
  total: string;
  paid_amount: string;
  is_paid: boolean;
  payments: Payment[];
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  preparing_at?: string;
  ready_at?: string;
  served_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  refunded_at?: string;
  paid_at?: string;
  discounts?: Discount[];
}

export interface OrderFilters {
  status?: string | string[];
  order_type?: string | string[];
  created_by?: string;
  customer_name?: string;
  customer_phone?: string;
  date?: string;
  delivery_person?: string;
  end_date?: string;
  end_time?: string;
  order_number?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
  start_date?: string;
  start_time?: string;
}

export interface Discount {
  id: number;
  type: 'percentage' | 'fixed';
  value: string;
  reason: string;
  is_active?: boolean;
}

export interface Payment {
  id?: string;
  order: string;
  method: 'cash' | 'card' | 'other';
  amount: string;
  created_by?: string;
  status: 'pending' | 'completed' | 'failed';
  transaction_reference?: string;
  idempotency_key?: string;
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  branch: string;
  branch_name?: string;
  product: string;
  product_name?: string;
  quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface StockMovement {
  id: string;
  branch_name: string;
  product_name: string;
  by: string;
  movement_types: 'incoming' | 'outgoing' | 'adjustment' | 'purchase' | 'sale' | 'return' | 'transfer';
  reference_type: 'order' | 'manual' | 'adjustment' | 'transfer';
  reference_id: string;
  quantity: string;
  quantity_before: string;
  quantity_after: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesSummary {
  total_orders: number;
  total_sales: string;
  total_items_sold?: number;
}

export interface ZReport {
  id: number;
  date: string;
  total_orders: number;
  total_items: number;
  total_sales: string;
  total_cash: string;
  total_card: string;
  total_tax: string;
  total_discount: string;
  total_other: string;
  counted_cash: string;
  cash_difference: string;
  start_time: string;
  end_time: string;
  is_locked: boolean;
  branch: string;
  closed_by: string;
  created_at: string;
}

export interface LowStockReport {
  product__id: number;
  product__name: string;
  quantity: number;
  min_quantity: number;
}

export interface SalesByBranchReport {
  branch__id: number;
  branch__name: string;
  total_orders: number;
  total_sales: string;
}

export interface SalesByProductReport {
  product__id: number;
  product__name: string;
  quantity_sold: number;
  revenue: string;
}

export interface PaymentSummaryReport {
  method: string;
  total: string;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone_number: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
