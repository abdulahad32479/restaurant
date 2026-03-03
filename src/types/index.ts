export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // Only for creation/update
  role: 'admin' | 'manager' | 'chef' | 'waiter' | 'cashier';
  branch: string; // Branch ID
  branch_name?: string;
  is_active?: boolean;
  created_at?: string;
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
  phone_number: string;
  email?: string;
  loyalty_points?: number;
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
  quantity: number;
  unit_price?: string;
  tax_amount?: string;
  discount_amount?: string;
  total_price?: string;
  created_at?: string;
  updated_at?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  branch: string;
  branch_name?: string;
  items: OrderItem[];
  order_type: OrderType;
  table?: string;
  table_id?: string; // used for creation
  table_no?: string;
  customer?: string;
  delivery_info?: {
    id?: string;
    name: string;
    address: string;
    phone: string;
  };
  notes?: string;
  status: OrderStatus;
  subtotal: string;
  tax_amount?: string;
  discount_amount?: string;
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
}

export interface Payment {
  id?: string;
  order: string;
  method: 'cash' | 'card' | 'other';
  amount: string;
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
  last_updated: string;
}

export interface StockMovement {
  id: string;
  product: string;
  branch: string;
  quantity: number;
  movement_type: 'addition' | 'reduction' | 'sale' | 'waste';
  reason?: string;
  created_at: string;
  created_by: string;
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
  total_sales: string;
  total_cash: string;
  total_card: string;
  total_other: string;
  counted_cash: string;
  cash_difference: string;
  is_locked: boolean;
  branch: string;
  closed_by: string;
  created_at: string;
}

export interface LowStockReport {
  product_id: string;
  product_name: string;
  current_stock: number;
  branch_name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
