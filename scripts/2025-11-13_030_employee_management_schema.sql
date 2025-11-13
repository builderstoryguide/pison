-- ============================================
-- EMPLOYEE MANAGEMENT SYSTEM DATABASE SCHEMA
-- ============================================
-- This script extends the existing teachers table and creates new tables
-- for comprehensive employee management (HR operations)
-- 
-- Run this script to set up the employee management database schema
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PART 1: EXTEND TEACHERS TABLE FOR HR FEATURES
-- ============================================

-- Add additional HR-specific columns to teachers table
ALTER TABLE public.teachers
    -- Add temporary employment type option
    DROP CONSTRAINT IF EXISTS teachers_employment_type_check,
    ADD CONSTRAINT teachers_employment_type_check 
        CHECK (employment_type IN ('full-time','part-time','contract','temporary'));

-- Add new columns if they don't exist
DO $$ 
BEGIN
    -- End date for contract/temporary employees
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN end_date DATE;
    END IF;

    -- Contract renewal date for contract employees
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'contract_renewal_date'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN contract_renewal_date DATE;
    END IF;

    -- Department (e.g., Mathematics, Sciences, Languages)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'department'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN department VARCHAR(100);
    END IF;

    -- Specialization (specific area of expertise)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'specialization'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN specialization VARCHAR(255);
    END IF;

    -- Emergency contact email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'emergency_contact_email'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN emergency_contact_email VARCHAR(255);
    END IF;

    -- Emergency contact address
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'emergency_contact_address'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN emergency_contact_address TEXT;
    END IF;

    -- Postal code
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN postal_code VARCHAR(20);
    END IF;

    -- Country (default Cameroon)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'country'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN country VARCHAR(100) DEFAULT 'Cameroon';
    END IF;

    -- Is verified flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;

    -- Profile completed flag
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'profile_completed'
    ) THEN
        ALTER TABLE public.teachers ADD COLUMN profile_completed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update status constraint to include more HR statuses
ALTER TABLE public.teachers
    DROP CONSTRAINT IF EXISTS teachers_status_check,
    ADD CONSTRAINT teachers_status_check 
        CHECK (status IN ('active','inactive','suspended','terminated','retired'));

-- Add validation constraint for dates
ALTER TABLE public.teachers
    DROP CONSTRAINT IF EXISTS teachers_valid_dates,
    ADD CONSTRAINT teachers_valid_dates 
        CHECK (start_date <= end_date OR end_date IS NULL);

-- ============================================
-- PART 2: LEAVE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN (
        'annual', 'sick', 'maternity', 'paternity', 
        'unpaid', 'study', 'compassionate'
    )),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL CHECK (total_days > 0),
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'approved', 'rejected', 'cancelled'
    )),
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Validation: end_date must be >= start_date
    CONSTRAINT leave_valid_dates CHECK (end_date >= start_date)
);

-- Indexes for leave_requests
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_leave_type ON public.leave_requests(leave_type);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_end_date ON public.leave_requests(end_date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_approved_by ON public.leave_requests(approved_by);

-- Comment on table
COMMENT ON TABLE public.leave_requests IS 'Stores employee leave requests and approvals';

-- ============================================
-- PART 3: ATTENDANCE RECORDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'present' CHECK (status IN (
        'present', 'absent', 'late', 'on-leave', 'half-day'
    )),
    hours_worked NUMERIC(4,2),
    notes TEXT,
    marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one record per employee per day
    UNIQUE(employee_id, date)
);

-- Indexes for attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON public.attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in ON public.attendance_records(check_in);
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_by ON public.attendance_records(marked_by);

-- Comment on table
COMMENT ON TABLE public.attendance_records IS 'Daily attendance tracking for employees';

-- ============================================
-- PART 4: PERFORMANCE REVIEWS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    review_period VARCHAR(50) NOT NULL, -- e.g., "2024 Q1", "2024 Annual"
    review_date DATE NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    
    -- Rating criteria (1-5 scale)
    overall_rating NUMERIC(2,1) CHECK (overall_rating >= 1 AND overall_rating <= 5),
    teaching_effectiveness NUMERIC(2,1) CHECK (teaching_effectiveness >= 1 AND teaching_effectiveness <= 5),
    classroom_management NUMERIC(2,1) CHECK (classroom_management >= 1 AND classroom_management <= 5),
    student_engagement NUMERIC(2,1) CHECK (student_engagement >= 1 AND student_engagement <= 5),
    professionalism NUMERIC(2,1) CHECK (professionalism >= 1 AND professionalism <= 5),
    collaboration NUMERIC(2,1) CHECK (collaboration >= 1 AND collaboration <= 5),
    
    -- Qualitative feedback
    strengths TEXT,
    areas_for_improvement TEXT,
    goals TEXT,
    comments TEXT,
    
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'completed', 'acknowledged'
    )),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance_reviews
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee_id ON public.performance_reviews(employee_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_reviewer_id ON public.performance_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_review_date ON public.performance_reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_status ON public.performance_reviews(status);

-- Comment on table
COMMENT ON TABLE public.performance_reviews IS 'Employee performance reviews and evaluations';

-- ============================================
-- PART 5: PAYROLL RECORDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    
    -- Period information
    month VARCHAR(20) NOT NULL, -- e.g., "January", "February"
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Salary components
    basic_salary NUMERIC(12,2) NOT NULL CHECK (basic_salary >= 0),
    allowances NUMERIC(12,2) DEFAULT 0 CHECK (allowances >= 0),
    bonuses NUMERIC(12,2) DEFAULT 0 CHECK (bonuses >= 0),
    deductions NUMERIC(12,2) DEFAULT 0 CHECK (deductions >= 0),
    tax NUMERIC(12,2) DEFAULT 0 CHECK (tax >= 0),
    net_salary NUMERIC(12,2) NOT NULL CHECK (net_salary >= 0),
    
    -- Payment information
    payment_date DATE,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'bank-transfer' CHECK (payment_method IN (
        'bank-transfer', 'cash', 'cheque', 'mobile-money'
    )),
    payment_reference VARCHAR(100),
    
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processed', 'paid', 'cancelled'
    )),
    
    notes TEXT,
    processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one payroll record per employee per month per year
    UNIQUE(employee_id, month, year)
);

-- Indexes for payroll_records
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_year ON public.payroll_records(year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month ON public.payroll_records(month);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_payment_date ON public.payroll_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payroll_records_processed_by ON public.payroll_records(processed_by);

-- Comment on table
COMMENT ON TABLE public.payroll_records IS 'Monthly payroll records and salary processing';

-- ============================================
-- PART 6: LEAVE BALANCES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
    
    -- Leave balances by type (in days)
    annual_leave_total INTEGER DEFAULT 30 CHECK (annual_leave_total >= 0),
    annual_leave_used INTEGER DEFAULT 0 CHECK (annual_leave_used >= 0),
    annual_leave_remaining INTEGER DEFAULT 30 CHECK (annual_leave_remaining >= 0),
    
    sick_leave_total INTEGER DEFAULT 14 CHECK (sick_leave_total >= 0),
    sick_leave_used INTEGER DEFAULT 0 CHECK (sick_leave_used >= 0),
    sick_leave_remaining INTEGER DEFAULT 14 CHECK (sick_leave_remaining >= 0),
    
    study_leave_total INTEGER DEFAULT 0 CHECK (study_leave_total >= 0),
    study_leave_used INTEGER DEFAULT 0 CHECK (study_leave_used >= 0),
    study_leave_remaining INTEGER DEFAULT 0 CHECK (study_leave_remaining >= 0),
    
    compassionate_leave_total INTEGER DEFAULT 5 CHECK (compassionate_leave_total >= 0),
    compassionate_leave_used INTEGER DEFAULT 0 CHECK (compassionate_leave_used >= 0),
    compassionate_leave_remaining INTEGER DEFAULT 5 CHECK (compassionate_leave_remaining >= 0),
    
    carried_forward_days INTEGER DEFAULT 0 CHECK (carried_forward_days >= 0),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint: one balance record per employee per year
    UNIQUE(employee_id, year)
);

-- Indexes for leave_balances
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- Comment on table
COMMENT ON TABLE public.leave_balances IS 'Annual leave balance tracking for employees';

-- ============================================
-- PART 7: TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON public.leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_records_updated_at ON public.attendance_records;
CREATE TRIGGER update_attendance_records_updated_at
    BEFORE UPDATE ON public.attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_reviews_updated_at ON public.performance_reviews;
CREATE TRIGGER update_performance_reviews_updated_at
    BEFORE UPDATE ON public.performance_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_balances_updated_at ON public.leave_balances;
CREATE TRIGGER update_leave_balances_updated_at
    BEFORE UPDATE ON public.leave_balances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PART 8: ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Policies for leave_requests table
CREATE POLICY "Allow authenticated users to read leave_requests"
    ON public.leave_requests FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert leave_requests"
    ON public.leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leave_requests"
    ON public.leave_requests FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for attendance_records table
CREATE POLICY "Allow authenticated users to read attendance_records"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert attendance_records"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update attendance_records"
    ON public.attendance_records FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for performance_reviews table
CREATE POLICY "Allow authenticated users to read performance_reviews"
    ON public.performance_reviews FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert performance_reviews"
    ON public.performance_reviews FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update performance_reviews"
    ON public.performance_reviews FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for payroll_records table
CREATE POLICY "Allow authenticated users to read payroll_records"
    ON public.payroll_records FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert payroll_records"
    ON public.payroll_records FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payroll_records"
    ON public.payroll_records FOR UPDATE
    TO authenticated
    USING (true);

-- Policies for leave_balances table
CREATE POLICY "Allow authenticated users to read leave_balances"
    ON public.leave_balances FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to insert leave_balances"
    ON public.leave_balances FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update leave_balances"
    ON public.leave_balances FOR UPDATE
    TO authenticated
    USING (true);

-- ============================================
-- PART 9: VERIFICATION SCRIPT
-- ============================================

DO $$ 
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'EMPLOYEE MANAGEMENT SCHEMA VERIFICATION';
    RAISE NOTICE '========================================';
    
    -- Check teachers table extensions
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'department'
    ) THEN
        RAISE NOTICE '✓ Teachers table extended successfully';
    ELSE
        RAISE WARNING '⚠ Failed to extend teachers table';
    END IF;
    
    -- Check leave_requests table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leave_requests'
    ) THEN
        RAISE NOTICE '✓ leave_requests table created successfully';
    ELSE
        RAISE WARNING '⚠ Failed to create leave_requests table';
    END IF;
    
    -- Check attendance_records table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'attendance_records'
    ) THEN
        RAISE NOTICE '✓ attendance_records table created successfully';
    ELSE
        RAISE WARNING '⚠ Failed to create attendance_records table';
    END IF;
    
    -- Check performance_reviews table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'performance_reviews'
    ) THEN
        RAISE NOTICE '✓ performance_reviews table created successfully';
    ELSE
        RAISE WARNING '⚠ Failed to create performance_reviews table';
    END IF;
    
    -- Check payroll_records table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'payroll_records'
    ) THEN
        RAISE NOTICE '✓ payroll_records table created successfully';
    ELSE
        RAISE WARNING '⚠ Failed to create payroll_records table';
    END IF;
    
    -- Check leave_balances table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'leave_balances'
    ) THEN
        RAISE NOTICE '✓ leave_balances table created successfully';
    ELSE
        RAISE WARNING '⚠ Failed to create leave_balances table';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema setup complete!';
    RAISE NOTICE '========================================';
END $$;

