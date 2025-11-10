// Expenditure Types for School Management System

export interface Expenditure {
  id: string;
  title: string;
  description: string;
  category: ExpenditureCategory;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'credit_card';
  payment_date: string;
  vendor: string;
  vendor_contact?: string;
  receipt_number?: string;
  invoice_number?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  approved_by?: string;
  approved_at?: string;
  academic_year: string;
  term: string;
  department?: string;
  budget_category: BudgetCategory;
  attachments?: string[];
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenditureFormData {
  title: string;
  description: string;
  category: ExpenditureCategory;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'credit_card';
  payment_date: string;
  vendor: string;
  vendor_contact?: string;
  receipt_number?: string;
  invoice_number?: string;
  academic_year: string;
  term: string;
  department?: string;
  budget_category: BudgetCategory;
  notes?: string;
}

export interface ExpenditureFilters {
  category: string;
  status: string;
  academic_year: string;
  term: string;
  department: string;
  budget_category: string;
  date_range: string;
}

export interface ExpenditureStats {
  total_expenditures: number;
  total_amount: number;
  pending_expenditures: number;
  approved_expenditures: number;
  paid_expenditures: number;
  rejected_expenditures: number;
  monthly_expenditure: number;
  category_breakdown: CategoryBreakdown[];
  department_breakdown: DepartmentBreakdown[];
}

export interface CategoryBreakdown {
  category: ExpenditureCategory;
  count: number;
  amount: number;
  percentage: number;
}

export interface DepartmentBreakdown {
  department: string;
  count: number;
  amount: number;
  percentage: number;
}

export type ExpenditureCategory = 
  | 'academic'
  | 'administrative'
  | 'infrastructure'
  | 'utilities'
  | 'maintenance'
  | 'transportation'
  | 'food_catering'
  | 'equipment'
  | 'supplies'
  | 'professional_services'
  | 'marketing'
  | 'training'
  | 'other';

export type BudgetCategory = 
  | 'operational'
  | 'capital'
  | 'emergency'
  | 'special_projects'
  | 'maintenance'
  | 'development'
  | 'other';

export interface ExpenditureResponse {
  expenditures: Expenditure[];
  stats: ExpenditureStats;
  total: number;
  page: number;
  limit: number;
}

// Category configurations for UI
export const EXPENDITURE_CATEGORIES: { value: ExpenditureCategory; label: string; icon: string; color: string }[] = [
  { value: 'academic', label: 'Academic', icon: 'BookOpen', color: 'blue' },
  { value: 'administrative', label: 'Administrative', icon: 'FileText', color: 'gray' },
  { value: 'infrastructure', label: 'Infrastructure', icon: 'Building', color: 'orange' },
  { value: 'utilities', label: 'Utilities', icon: 'Zap', color: 'yellow' },
  { value: 'maintenance', label: 'Maintenance', icon: 'Wrench', color: 'red' },
  { value: 'transportation', label: 'Transportation', icon: 'Truck', color: 'green' },
  { value: 'food_catering', label: 'Food & Catering', icon: 'Utensils', color: 'purple' },
  { value: 'equipment', label: 'Equipment', icon: 'Monitor', color: 'indigo' },
  { value: 'supplies', label: 'Supplies', icon: 'Package', color: 'pink' },
  { value: 'professional_services', label: 'Professional Services', icon: 'Users', color: 'teal' },
  { value: 'marketing', label: 'Marketing', icon: 'Megaphone', color: 'cyan' },
  { value: 'training', label: 'Training', icon: 'GraduationCap', color: 'emerald' },
  { value: 'other', label: 'Other', icon: 'MoreHorizontal', color: 'slate' },
];

export const BUDGET_CATEGORIES: { value: BudgetCategory; label: string; description: string }[] = [
  { value: 'operational', label: 'Operational', description: 'Day-to-day operational expenses' },
  { value: 'capital', label: 'Capital', description: 'Long-term investments and assets' },
  { value: 'emergency', label: 'Emergency', description: 'Emergency and contingency funds' },
  { value: 'special_projects', label: 'Special Projects', description: 'Project-specific expenditures' },
  { value: 'maintenance', label: 'Maintenance', description: 'Maintenance and repair costs' },
  { value: 'development', label: 'Development', description: 'Development and improvement initiatives' },
  { value: 'other', label: 'Other', description: 'Other miscellaneous expenses' },
];

export const PAYMENT_METHODS: { value: Expenditure['payment_method']; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'check', label: 'Check' },
  { value: 'credit_card', label: 'Credit Card' },
];

export const CURRENCIES: { value: Expenditure['currency']; label: string; symbol: string }[] = [
  { value: 'XOF', label: 'CFA Franc', symbol: 'XOF' },
  { value: 'USD', label: 'US Dollar', symbol: '$' },
  { value: 'EUR', label: 'Euro', symbol: '€' },
];

export const EXPENDITURE_STATUSES: { value: Expenditure['status']; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'yellow' },
  { value: 'approved', label: 'Approved', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
];
