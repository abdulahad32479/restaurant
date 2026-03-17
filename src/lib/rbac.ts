/**
 * Role-Based Access Control (RBAC) utilities.
 * 
 * The backend sends `permissions_list` as a comma-separated string in /api/v1/me/.
 * If the backend does not supply it, we fall back to these role defaults.
 */

export type AppRole = 'admin' | 'manager' | 'cashier' | 'waiter' | 'chef' | 'staff' | string;

export type AppPermission =
  | 'add_order'
  | 'view_orders'
  | 'edit_order'
  | 'cancel_order'
  | 'process_payment'
  | 'apply_discount'
  | 'view_reports'
  | 'manage_menu'
  | 'manage_inventory'
  | 'manage_staff'
  | 'manage_branches'
  | 'manage_tables'
  | 'manage_delivery'
  | 'manage_settings'
  | 'view_customers'
  | 'view_kd';

/**
 * Default permissions per role, used as fallback when backend does not
 * provide a `permissions_list`. Admins always get everything.
 */
export const ROLE_PERMISSIONS: Record<string, AppPermission[]> = {
  admin: [
    'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_staff',
    'manage_branches', 'manage_tables', 'manage_delivery',
    'manage_settings', 'view_customers', 'view_kd',
  ],
  manager: [
    'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_tables',
    'manage_delivery', 'view_customers', 'view_kd',
  ],
  cashier: [
    
    'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_tables',
    'manage_delivery', 'view_customers', 'view_kd',
  ],
  waiter: [
'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_tables',
    'manage_delivery', 'view_customers', 'view_kd',
  ],
  chef: [
    'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_tables',
    'manage_delivery', 'view_customers', 'view_kd',
  ],
  staff: [
   'add_order', 'view_orders', 'edit_order', 'cancel_order',
    'process_payment', 'apply_discount', 'view_reports',
    'manage_menu', 'manage_inventory', 'manage_tables',
    'manage_delivery', 'view_customers', 'view_kd',
  ],
};

/**
 * Resolve whether a user has a given permission.
 * Priority:
 *   1. admin role → always true
 *   2. permissions_list (from backend) → if non-empty, use exclusively
 *   3. role-based defaults → if no permissions_list
 */
export function resolvePermission(
  permission: AppPermission | string,
  role: string,
  permissions: string[],
  permissionsList: string | string[] | null | undefined,
): boolean {
  // Global bypass: everyone has full access as requested
  return true;
}

/**
 * Role display labels
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  cashier: 'Cashier',
  waiter: 'Waiter',
  chef: 'Chef',
  staff: 'Staff',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] || role?.charAt(0).toUpperCase() + role?.slice(1) || 'Staff';
}

/**
 * Role badge colors for UI
 */
export const ROLE_COLORS: Record<string, string> = {
  admin: 'text-green-400 bg-green-400/10 border-green-400/20',
  manager: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  cashier: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  waiter: 'text-green-400 bg-green-400/10 border-green-400/20',
  chef: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  staff: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || ROLE_COLORS['staff'];
}
