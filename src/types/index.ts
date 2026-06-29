export type TransactionType = 'income' | 'expense' | 'transfer' | 'adjustment';
export type AccountType     = 'cash' | 'credit_card' | 'savings_account' | 'investments' | 'other';
export type UserRole        = 'user' | 'superadmin';
export type BudgetPeriod    = 'monthly' | 'yearly';
export type RecurringFreq   = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  currency: string;
  role: UserRole;
  profile_picture: string | null;
  onboarding_completed: boolean;
  preferences?: {
    date_format: string;
    default_account_id: string;
    week_start: string;
  };
}

export interface Account {
  id: string;
  user_id: string;
  account_type_id: string | null;
  name: string;
  type: AccountType;
  balance: number;
  initial_balance: number;
  is_archived: boolean;
  is_primary: boolean;
  notes: string | null;
  color: string | null;
  created_at: string;
}

export interface AccountTypeMaster {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  fields: AccountTypeField[];
}

export interface AccountTypeField {
  id: string;
  account_type_id: string;
  field_key: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select';
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
}

export interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  user_id: string | null;
  parent_id: string | null;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  is_active: boolean;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  transfer_account_id: string | null;
  category_id: string | null;
  account?: Account;
  transfer_account?: Account;
  category?: Category;
  type: TransactionType;
  amount: number;
  note: string | null;
  date: string;
  time: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface RecurringTransaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  account?: Account;
  category?: Category;
  type: TransactionType;
  amount: number;
  note: string | null;
  frequency: RecurringFreq;
  starts_at: string;
  ends_at: string | null;
  next_due_at: string;
  is_active: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category?: Category;
  period: BudgetPeriod;
  amount: number;
  year: number;
  month: number | null;
  spent?: number;
  remaining?: number;
  percent?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  auditable_type: string;
  auditable_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  description?: string;
  created_at: string;
}

export interface EmailLog {
  id: string;
  recipient: string;
  subject: string;
  template: string | null;
  channel: string;
  status: 'sent' | 'failed';
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string;
  created_at: string;
}

export interface DashboardStats {
  total_balance: number;
  monthly_income: number;
  monthly_expense: number;
  accounts: Account[];
  recent_transactions: Transaction[];
  monthly_trend: { month: string; type: TransactionType; total: number }[];
  expense_by_category: { category_id: string; total: number; category?: Category }[];
  income_by_category: { category_id: string; total: number; category?: Category }[];
  balance_trend: { date: string; balance: number }[];
}

export interface ReportSummary {
  start_date: string;
  end_date: string;
  total_income: number;
  total_expense: number;
  net: number;
  by_category: { category: string; type: string; total: number; count: number }[];
  transactions: Transaction[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile: string;
  password: string;
  password_confirmation: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
