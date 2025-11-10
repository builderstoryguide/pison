// Registration Types for School Management System

export interface RegistrationFee {
  id: string;
  student_id: string;
  student_name: string;
  academic_year: string;
  term: string;
  class: string;
  registration_fee: number;
  pta_fee: number;
  tuition_fee: number;
  total_amount: number;
  paid_amount: number;
  balance: number;
  payment_status: 'pending' | 'partial' | 'paid' | 'overdue';
  due_date: string;
  payment_date?: string;
  payment_method?: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  receipt_number?: string;
  notes?: string;
  installments?: string;
  installment_amount?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeeStructure {
  id: string;
  class: string;
  academic_year: string;
  term: string;
  registration_fee: number;
  pta_fee: number;
  tuition_fee: number;
  installments?: string;
  installmentAmount?: number;
  total_fee: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface RegistrationPayment {
  id: string;
  registration_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  payment_date: string;
  receipt_number: string;
  notes?: string;
  created_by: string;
  created_at: string;
}

export interface RegistrationStats {
  total_registrations: number;
  total_revenue: number;
  pending_payments: number;
  overdue_payments: number;
  paid_registrations: number;
  partial_payments: number;
  monthly_revenue: number;
  class_breakdown: Array<{
    class: string;
    count: number;
    revenue: number;
  }>;
}

export interface CreateRegistrationRequest {
  student_id: string;
  student_name: string;
  academic_year: string;
  term: string;
  class: string;
  registration_fee: number;
  pta_fee: number;
  tuition_fee: number;
  due_date: string;
  notes?: string;
}

export interface UpdateRegistrationRequest {
  id: string;
  registration_fee?: number;
  pta_fee?: number;
  tuition_fee?: number;
  due_date?: string;
  notes?: string;
}

export interface PaymentRequest {
  registration_id: string;
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  payment_date: string;
  receipt_number: string;
  notes?: string;
}

export interface RegistrationResponse {
  success: boolean;
  registration?: RegistrationFee;
  error?: string;
}

export interface RegistrationsResponse {
  success: boolean;
  registrations: RegistrationFee[];
  total: number;
  error?: string;
}

export interface FeeStructuresResponse {
  success: boolean;
  fee_structures: FeeStructure[];
  total: number;
  error?: string;
}

export interface RegistrationStatsResponse {
  success: boolean;
  stats: RegistrationStats;
  error?: string;
}

// Form interfaces
export interface RegistrationFormData {
  student_id: string;
  student_name: string;
  academic_year: string;
  term: string;
  class: string;
  registration_fee: number;
  pta_fee: number;
  tuition_fee: number;
  installments?: string;
  installmentAmount?: number;
  due_date: string;
  notes: string;
}

export interface FeeStructureFormData {
  class: string;
  academic_year: string;
  term: string;
  registration_fee: number;
  pta_fee: number;
  tuition_fee: number;
  installments?: string;
  installmentAmount?: number;
}

export interface PaymentFormData {
  amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'mobile_money' | 'check';
  payment_date: string;
  receipt_number: string;
  notes: string;
}

// Filter and search interfaces
export interface RegistrationFilters {
  academic_year?: string;
  term?: string;
  class?: string;
  payment_status?: string;
  search?: string;
}

export interface RegistrationSearchParams {
  page?: number;
  limit?: number;
  academic_year?: string;
  term?: string;
  class?: string;
  payment_status?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
