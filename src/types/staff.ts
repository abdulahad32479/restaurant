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
  branch?: string;
  branch_name?: string;
  user: string | null;
  employee_code: string;
  full_name: string;
  phone: string;
  address: string;
  role: string | StaffRole; // UUID or expanded object
  role_name?: string;
  joining_date: string; // YYYY-MM-DD
  employment_status: EmploymentStatus;
  employment_status_display?: string;
  salary_type: SalaryType;
  salary_type_display?: string;
  base_salary: string | number;
  default_late_penalty: string | number | null;
  default_meal_deduction: string | number | null;
  biometric_code: string;
  is_delivery_staff: boolean;
  is_kitchen_staff: boolean;
  is_cashier: boolean;
  is_manager: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Attendance Enums
export type DeviceType = 'biometric' | 'manual';
export type PunchType = 'in' | 'out' | 'unknown';
export type PunchSource = 'device' | 'import' | 'manual';
export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day';
export type AttendanceSource = 'manual' | 'biometric';

export interface AttendanceDevice {
  id: string; // UUID
  branch?: string;
  branch_name?: string;
  name: string;
  device_type: DeviceType;
  device_type_display?: string;
  ip_address: string | null;
  port: number | null;
  machine_identifier: string | null;
  api_url: string | null;
  is_active: boolean;
  last_synced_at?: string;
  created_at?: string;
}

export interface BiometricPunch {
  id: string; // UUID
  branch?: string;
  biometric_code: string;
  punch_time: string; // ISO datetime
  staff: string; // UUID
  staff_name?: string;
  device: string; // UUID
  device_name?: string;
  punch_type: PunchType;
  punch_type_display?: string;
  source: PunchSource;
  source_display?: string;
  is_processed: boolean;
  raw_payload?: any;
  created_at?: string;
}

export interface StaffAttendance {
  id: string; // UUID
  staff: string; // UUID
  staff_name?: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // ISO datetime
  check_out: string | null; // ISO datetime
  late_minutes: number;
  early_leave_minutes: number;
  status: AttendanceStatus;
  status_display?: string;
  source: AttendanceSource;
  source_display?: string;
  note: string;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Ledger Enums
export interface LedgerSummaryResponse {
  totals: {
    total_debits: string | number;
    total_credits: string | number;
  };
  staff: StaffMember;
}
export type LedgerEntryType = 'advance' | 'late_penalty' | 'meal_deduction' | 'deduction' | 'bonus' | 'reimbursement' | 'adjustment' | 'salary_payment';
export type LedgerDirection = 'debit' | 'credit';

export interface StaffLedgerEntry {
  id: string; // UUID
  staff: string; // UUID
  staff_name?: string;
  branch?: string;
  branch_name?: string;
  entry_date: string; // YYYY-MM-DD
  entry_type: LedgerEntryType;
  entry_type_display?: string;
  direction: LedgerDirection;
  direction_display?: string;
  amount: string | number;
  note: string;
  payroll_period_year: number | null;
  payroll_period_month: number | null;
  is_active: boolean;
  created_by?: string;
  created_by_name?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Payroll Enums
export type PayrollStatus = 'draft' | 'finalized' | 'paid';

export interface PayrollRun {
  id: string; // UUID
  branch?: string;
  branch_name?: string;
  year: number;
  month: number;
  period_start?: string;
  period_end?: string;
  status: PayrollStatus;
  status_display?: string;
  notes?: string;
  generated_by?: string;
  generated_by_name?: string;
  generated_at?: string;
  finalized_at?: string;
  paid_at?: string;
  lines?: PayrollLine[];
}

export interface PayrollLine {
  id: string; // UUID
  payroll_run: string; // UUID
  staff: string; // UUID
  staff_name?: string;
  employee_code?: string;
  base_salary: string | number;
  
  total_advances: string | number;
  total_late_penalties: string | number;
  total_meal_deductions: string | number;
  total_other_deductions: string | number;
  total_bonuses: string | number;
  total_reimbursements: string | number;
  total_debits: string | number;
  total_credits: string | number;
  net_salary: string | number;

  attendance_days?: number;
  absent_days?: number;
  leave_days?: number;
  half_days?: number;
  late_days?: number;

  is_paid: boolean;
  paid_amount?: string | number;
  paid_at?: string | null;
  payment_note?: string;
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
