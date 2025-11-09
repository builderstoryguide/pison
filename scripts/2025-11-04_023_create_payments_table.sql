-- Create payments table if it doesn't exist
-- This script ensures the payments table exists with all required columns
-- NOTE: This script requires fee_structures, payment_methods, students, and users tables to exist first
-- For a complete setup, use scripts/2025-11-04_022_create_financial_schema.sql instead

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if required tables exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structures') THEN
        RAISE EXCEPTION 'fee_structures table does not exist. Please run scripts/2025-11-04_022_create_financial_schema.sql first to create all required tables.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
        RAISE EXCEPTION 'payment_methods table does not exist. Please run scripts/2025-11-04_022_create_financial_schema.sql first to create all required tables.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        RAISE WARNING 'students table does not exist. Foreign key constraint for student_id will fail.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE WARNING 'users table does not exist. Foreign key constraint for received_by will fail.';
    END IF;
END $$;

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    fee_structure_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    payment_method_id UUID,
    receipt_number VARCHAR(100) UNIQUE,
    paid_by VARCHAR(255),
    received_by UUID,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    status VARCHAR(20) DEFAULT 'completed',
    notes TEXT,
    description TEXT,
    reference_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints only if the referenced tables exist
DO $$
BEGIN
    -- Add student_id foreign key if students table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'students') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'payments_student_id_fkey' 
            AND table_name = 'payments'
        ) THEN
            ALTER TABLE public.payments 
            ADD CONSTRAINT payments_student_id_fkey 
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint: payments_student_id_fkey';
        END IF;
    END IF;
    
    -- Add fee_structure_id foreign key if fee_structures table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fee_structures') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'payments_fee_structure_id_fkey' 
            AND table_name = 'payments'
        ) THEN
            ALTER TABLE public.payments 
            ADD CONSTRAINT payments_fee_structure_id_fkey 
            FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint: payments_fee_structure_id_fkey';
        END IF;
    END IF;
    
    -- Add payment_method_id foreign key if payment_methods table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_methods') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'payments_payment_method_id_fkey' 
            AND table_name = 'payments'
        ) THEN
            ALTER TABLE public.payments 
            ADD CONSTRAINT payments_payment_method_id_fkey 
            FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint: payments_payment_method_id_fkey';
        END IF;
    END IF;
    
    -- Add received_by foreign key if users table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'payments_received_by_fkey' 
            AND table_name = 'payments'
        ) THEN
            ALTER TABLE public.payments 
            ADD CONSTRAINT payments_received_by_fkey 
            FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint: payments_received_by_fkey';
        END IF;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_structure_id ON public.payments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_academic_year ON public.payments(academic_year);
CREATE INDEX IF NOT EXISTS idx_payments_term ON public.payments(term);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions (adjust as needed for your RLS policies)
-- ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'payments'
    ) THEN
        RAISE NOTICE 'Payments table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create payments table';
    END IF;
END $$;

