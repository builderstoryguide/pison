-- Fix Financial Schema Issues
-- This script addresses the missing tables and schema mismatches causing Bursar login errors

-- ============================================================================
-- 1. CREATE MISSING TABLES
-- ============================================================================

-- Payment Methods table (referenced in enhanced reports but missing from base schema)
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, code, description) VALUES
    ('Cash', 'CASH', 'Cash payment'),
    ('Bank Transfer', 'BANK_TRANSFER', 'Bank transfer payment'),
    ('Mobile Money', 'MOBILE_MONEY', 'Mobile money payment'),
    ('Cheque', 'CHEQUE', 'Cheque payment')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE EXISTING TABLES
-- ============================================================================

-- Add payment_method_id column to payments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'payment_method_id') THEN
        ALTER TABLE payments ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id);
    END IF;
END $$;

-- Add received_by column to payments table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'received_by') THEN
        ALTER TABLE payments ADD COLUMN received_by UUID REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add academic_year and term columns to payments table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'academic_year') THEN
        ALTER TABLE payments ADD COLUMN academic_year VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'payments' AND column_name = 'term') THEN
        ALTER TABLE payments ADD COLUMN term VARCHAR(20);
    END IF;
END $$;

-- ============================================================================
-- 3. UPDATE EXISTING DATA
-- ============================================================================

-- Update existing payments to have a default payment method
UPDATE payments 
SET payment_method_id = (SELECT id FROM payment_methods WHERE code = 'CASH' LIMIT 1)
WHERE payment_method_id IS NULL;

-- Update existing payments to have academic year and term from fee structures
UPDATE payments p
SET 
    academic_year = fs.academic_year,
    term = fs.term
FROM fee_structures fs
WHERE p.fee_structure_id = fs.id 
AND (p.academic_year IS NULL OR p.term IS NULL);

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for payment_methods table
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON payment_methods(is_active);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_received_by ON payments(received_by);
CREATE INDEX IF NOT EXISTS idx_payments_academic_year ON payments(academic_year);
CREATE INDEX IF NOT EXISTS idx_payments_term ON payments(term);

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Verify that all required tables exist
SELECT 'Payment Methods Table' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'Payments Table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'Fee Structures Table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fee_structures') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'Student Fee Assignments Table' as table_name,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_fee_assignments') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Show payment methods
SELECT 'Payment Methods:' as info;
SELECT name, code, is_active FROM payment_methods ORDER BY name;

-- Show table structure for payments
SELECT 'Payments Table Structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;
