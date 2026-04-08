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
  permissions_list?: string;
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
  product_category?: string;
  order?: string;
  sent_to_kitchen?: boolean;
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
export type OrderStatus = 'draft' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'out_for_delivery' | 'completed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  order_number?: string;
  branch: string;
  branch_name?: string;
  items: OrderItem[];
  order_type: OrderType;
  table?: string;
  table_id?: string;
  table_no?: string;
  customer?: string;
  created_by?: string;
  created_by_name?: string;
  delivery_person?: string;
  delivery_person_name?: string;
  delivery_info?: {
    id?: string;
    branch?: string;
    branch_name?: string;
    name: string;
    address: string;
    phone: string;
    delivery_route?: string;
    delivery_route_name?: string;
    delivery_zone?: string;
    delivery_zone_name?: string;
    zone_id: string; // Required for creation
    created_at?: string;
    updated_at?: string;
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
  delivery_status?: 'unassigned' | 'assigned' | 'out_for_delivery' | 'delivered';
  estimated_prep_minutes?: number;
  promised_delivery_minutes?: number;
  expected_ready_at?: string;
  expected_delivery_at?: string;
  assigned_at?: string;
  out_for_delivery_at?: string;
  delivered_at?: string;
  priority_score?: number;
  dispatch_bucket?: string;
  delivery_route?: string;
  delivery_route_name?: string;
  delivery_zone?: string;
  delivery_zone_name?: string;
  delivery_trip?: string;
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

export interface DeliveryPerson {
  id: string;
  name: string;
  phone_number: string;
  whatsapp_number?: string;
  status: 'available' | 'busy' | 'offline';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DeliveryRoute {
  id: string;
  name: string;
  sort_order: number;
  default_travel_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  route: string;
  route_name?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type TripStatus = 'draft' | 'assigned' | 'out' | 'completed' | 'cancelled';

export interface TripOrder {
  id: string;
  order: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_zone_name: string;
  address: string;
  created_at: string;
}

export interface DeliveryTrip {
  id: string;
  trip_number?: string;
  branch?: string;
  route: string;
  route_name?: string;
  delivery_person?: string;
  delivery_person_name?: string;
  status: TripStatus;
  is_custom?: boolean;
  notes?: string;
  assigned_at?: string;
  out_for_delivery_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  total_orders?: string | number;
  trip_orders?: TripOrder[];
  orders?: Order[];
}

export interface DispatchBoardItem {
  id: string;
  route: string;
  zone: string;
  priority_score: number;
  dispatch_bucket: string;
  orders: Order[];
}

export interface TripSuggestion {
  id: string;
  order_ids: string[];
  route: string;
  total_orders: number;
  reason?: string;
  suggested_rider?: string;
}

export interface WhatsAppLog {
  id: string;
  target_type: 'order' | 'trip';
  target_id: string;
  delivery_person: string;
  delivery_person_name: string;
  phone_number: string;
  message_text?: string;
  provider: string;
  provider_message_id?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered' | 'read';
  error_message?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  product: string;
  product_name: string;
  product_sku: string;
  branch: string;
  branch_name: string;
  quantity: number | string;
  min_quantity: number | string;
  max_quantity?: number | string;
  last_received_date?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product: string;
  product_name: string;
  branch: string;
  branch_name: string;
  movement_types: 'incoming' | 'outgoing' | 'adjustment' | 'return' | 'order';
  quantity: number | string;
  quantity_after?: number | string;
  notes?: string;
  reference_type?: string;
  reference_id?: string;
  by?: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
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
  start_time?: string;
  end_time?: string;
  is_locked: boolean;
  branch: string;
  closed_by: string;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
