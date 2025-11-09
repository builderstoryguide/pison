-- Create Financial Management Schema
-- This script creates all financial tables in the correct dependency order
-- Run this script to set up the complete financial management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PAYMENT METHODS TABLE (No dependencies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO public.payment_methods (name, code, description) VALUES
    ('Cash', 'CASH', 'Cash payment'),
    ('Bank Transfer', 'BANK_TRANSFER', 'Bank transfer payment'),
    ('Mobile Money', 'MOBILE_MONEY', 'Mobile money payment'),
    ('Cheque', 'CHEQUE', 'Cheque payment')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- 2. FEE STRUCTURES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    level VARCHAR(50) NOT NULL,
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('first', 'second', 'third')),
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fee_structures
CREATE INDEX IF NOT EXISTS idx_fee_structures_subsystem ON public.fee_structures(subsystem);
CREATE INDEX IF NOT EXISTS idx_fee_structures_level ON public.fee_structures(level);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year ON public.fee_structures(academic_year);
CREATE INDEX IF NOT EXISTS idx_fee_structures_term ON public.fee_structures(term);
CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON public.fee_structures(is_active);

-- ============================================
-- 3. STUDENT FEE ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for student_fee_assignments
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON public.student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON public.student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_status ON public.student_fee_assignments(status);

-- ============================================
-- 4. PAYMENTS TABLE (Depends on fee_structures, payment_methods, students, users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES public.fee_structures(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    receipt_number VARCHAR(100) UNIQUE,
    paid_by VARCHAR(255),
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'partial', 'completed', 'overdue')),
    notes TEXT,
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_structure_id ON public.payments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_academic_year ON public.payments(academic_year);
CREATE INDEX IF NOT EXISTS idx_payments_term ON public.payments(term);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON public.payments(payment_method_id);

-- ============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fee_structures_updated_at ON public.fee_structures;
CREATE TRIGGER update_fee_structures_updated_at
    BEFORE UPDATE ON public.fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_fee_assignments_updated_at ON public.student_fee_assignments;
CREATE TRIGGER update_student_fee_assignments_updated_at
    BEFORE UPDATE ON public.student_fee_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. VERIFICATION
-- ============================================
DO $$
DECLARE
    tables_created INTEGER := 0;
BEGIN
    -- Check payment_methods
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ payment_methods table created';
    END IF;
    
    -- Check fee_structures
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structures') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ fee_structures table created';
    END IF;
    
    -- Check student_fee_assignments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_fee_assignments') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ student_fee_assignments table created';
    END IF;
    
    -- Check payments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ payments table created';
    END IF;
    
    RAISE NOTICE 'Successfully created % financial tables', tables_created;
END $$;

