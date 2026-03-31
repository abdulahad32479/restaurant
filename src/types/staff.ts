export type AuthHeader = { Authorization: string };

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// Staff Enums
export type EmploymentStatus = 'active' | 'inactive' | 'terminated';
export type SalaryType = 'monthly' | 'daily';

export interface StaffRole {
  id: string; // UUID
  name: string;
  description: string;
  is_active: boolean;
}

export interface StaffMember {
  id: string; // UUID
  user: string | null;
  employee_code: string;
  full_name: string;
  phone: string;
  address: string;
  role: string | StaffRole; // UUID or expanded object
  joining_date: string; // YYYY-MM-DD
  employment_status: EmploymentStatus;
  salary_type: SalaryType;
  base_salary: string | number;
  default_late_penalty: string | number | null;
  default_meal_deduction: string | number | null;
  biometric_code: string;
  is_delivery_staff: boolean;
  is_kitchen_staff: boolean;
  is_cashier: boolean;
  is_manager: boolean;
  is_active: boolean;
}

// Attendance Enums
export type DeviceType = 'biometric' | 'manual';
export type PunchType = 'in' | 'out' | 'unknown';
export type PunchSource = 'device' | 'import' | 'manual';
export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day';
export type AttendanceSource = 'manual' | 'biometric';

export interface AttendanceDevice {
  id: string; // UUID
  name: string;
  device_type: DeviceType;
  ip_address: string | null;
  port: number | null;
  machine_identifier: string | null;
  api_url: string | null;
  is_active: boolean;
}

export interface BiometricPunch {
  id: string; // UUID
  biometric_code: string;
  punch_time: string; // ISO datetime
  staff: string; // UUID
  staff_name?: string;
  device: string; // UUID
  device_name?: string;
  punch_type: PunchType;
  source: PunchSource;
  is_processed: boolean;
  raw_payload?: any;
}

export interface StaffAttendance {
  id: string; // UUID
  staff: string; // UUID
  date: string; // YYYY-MM-DD
  check_in: string | null; // ISO datetime
  check_out: string | null; // ISO datetime
  late_minutes: number;
  early_leave_minutes: number;
  status: AttendanceStatus;
  source: AttendanceSource;
  note: string;
}

// Ledger Enums
export type LedgerEntryType = 'advance' | 'late_penalty' | 'meal_deduction' | 'deduction' | 'bonus' | 'reimbursement' | 'adjustment' | 'salary_payment';
export type LedgerDirection = 'debit' | 'credit';

export interface StaffLedgerEntry {
  id: string; // UUID
  staff: string; // UUID
  entry_date: string; // YYYY-MM-DD
  entry_type: LedgerEntryType;
  direction: LedgerDirection;
  amount: string | number;
  note: string;
  payroll_period_year: number | null;
  payroll_period_month: number | null;
  is_active: boolean;
}

// Payroll Enums
export type PayrollStatus = 'draft' | 'finalized' | 'paid';

export interface PayrollRun {
  id: string; // UUID
  year: number;
  month: number;
  status: PayrollStatus;
  total_base_salary?: string | number;
  total_additions?: string | number;
  total_deductions?: string | number;
  net_payable?: string | number;
  lines?: PayrollLine[];
  created_at?: string;
  updated_at?: string;
}

export interface PayrollLine {
  id: string; // UUID
  payroll_run: string; // UUID
  staff: string; // UUID
  staff_name?: string;
  base_salary: string | number;
  additions: string | number;
  deductions: string | number;
  net_salary: string | number;
  is_paid: boolean;
  paid_amount?: string | number;
  paid_at?: string | null;
  note?: string;
}

// Sync API Result Model
export interface SyncDeviceResult {
  device_id: string;
  device_name: string;
  created_count: number;
  existing_count: number;
  unmatched_count: number;
  last_synced_at: string;
}
