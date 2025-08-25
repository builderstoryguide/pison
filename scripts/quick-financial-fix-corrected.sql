-- Quick Financial Database Fix Script (Corrected)
-- Run this script to fix common financial database issues
-- This version adapts to existing table structures

-- 1. Ensure payment_methods table exists and has data
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
INSERT INTO payment_methods (name, code) VALUES 
('Cash', 'CASH'),
('Bank Transfer', 'BANK'),
('Mobile Money', 'MOMO'),
('Cheque', 'CHEQUE')
ON CONFLICT (code) DO NOTHING;

-- 2. Check and adapt fee_structures table structure
DO $$
DECLARE
    col_exists BOOLEAN;
BEGIN
    -- Check if fee_structures table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fee_structures' AND table_schema = 'public') THEN
        \echo 'Fee structures table exists, checking structure...';
        
        -- Check if amount column exists, if not, try to add it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fee_structures' 
                AND column_name = 'amount' 
                AND table_schema = 'public'
        ) INTO col_exists;
        
        IF NOT col_exists THEN
            \echo 'Adding amount column to fee_structures...';
            ALTER TABLE fee_structures ADD COLUMN amount DECIMAL(10,2);
        END IF;
        
        -- Check if due_date column exists, if not, try to add it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fee_structures' 
                AND column_name = 'due_date' 
                AND table_schema = 'public'
        ) INTO col_exists;
        
        IF NOT col_exists THEN
            \echo 'Adding due_date column to fee_structures...';
            ALTER TABLE fee_structures ADD COLUMN due_date DATE;
        END IF;
        
        -- Check if term column exists, if not, try to add it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fee_structures' 
                AND column_name = 'term' 
                AND table_schema = 'public'
        ) INTO col_exists;
        
        IF NOT col_exists THEN
            \echo 'Adding term column to fee_structures...';
            ALTER TABLE fee_structures ADD COLUMN term VARCHAR(20);
        END IF;
        
        -- Check if academic_year column exists, if not, try to add it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fee_structures' 
                AND column_name = 'academic_year' 
                AND table_schema = 'public'
        ) INTO col_exists;
        
        IF NOT col_exists THEN
            \echo 'Adding academic_year column to fee_structures...';
            ALTER TABLE fee_structures ADD COLUMN academic_year VARCHAR(20);
        END IF;
        
        -- Check if is_active column exists, if not, try to add it
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'fee_structures' 
                AND column_name = 'is_active' 
                AND table_schema = 'public'
        ) INTO col_exists;
        
        IF NOT col_exists THEN
            \echo 'Adding is_active column to fee_structures...';
            ALTER TABLE fee_structures ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
    ELSE
        \echo 'Creating fee_structures table...';
        CREATE TABLE fee_structures (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(200) NOT NULL,
            subsystem VARCHAR(50) NOT NULL,
            level VARCHAR(50) NOT NULL,
            branch VARCHAR(50) NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            due_date DATE,
            term VARCHAR(20) NOT NULL,
            academic_year VARCHAR(20) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- Insert sample fee structure if none exists (using dynamic column selection)
DO $$
DECLARE
    fee_count INTEGER;
    amount_col_exists BOOLEAN;
    term_col_exists BOOLEAN;
    academic_year_col_exists BOOLEAN;
BEGIN
    -- Check if any fee structures exist
    SELECT COUNT(*) INTO fee_count FROM fee_structures;
    
    -- Check which columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'amount' 
            AND table_schema = 'public'
    ) INTO amount_col_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'term' 
            AND table_schema = 'public'
    ) INTO term_col_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'academic_year' 
            AND table_schema = 'public'
    ) INTO academic_year_col_exists;
    
    -- Insert sample data based on available columns
    IF fee_count = 0 THEN
        IF amount_col_exists AND term_col_exists AND academic_year_col_exists THEN
            INSERT INTO fee_structures (name, subsystem, level, branch, amount, term, academic_year, description) 
            VALUES ('Form 1 English Grammar', 'english', 'form1', 'grammar', 50000, 'first', '2024-2025', 'Form 1 English Grammar Fee Structure');
        ELSIF amount_col_exists THEN
            INSERT INTO fee_structures (name, subsystem, level, branch, amount, description) 
            VALUES ('Form 1 English Grammar', 'english', 'form1', 'grammar', 50000, 'Form 1 English Grammar Fee Structure');
        ELSE
            INSERT INTO fee_structures (name, subsystem, level, branch, description) 
            VALUES ('Form 1 English Grammar', 'english', 'form1', 'grammar', 'Form 1 English Grammar Fee Structure');
        END IF;
    END IF;
END $$;

-- 3. Ensure payments table has correct structure
DO $$
BEGIN
    -- Add missing columns to payments table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method_id') THEN
        ALTER TABLE payments ADD COLUMN payment_method_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'received_by') THEN
        ALTER TABLE payments ADD COLUMN received_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'academic_year') THEN
        ALTER TABLE payments ADD COLUMN academic_year VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'term') THEN
        ALTER TABLE payments ADD COLUMN term VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'receipt_number') THEN
        ALTER TABLE payments ADD COLUMN receipt_number VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'status') THEN
        ALTER TABLE payments ADD COLUMN status VARCHAR(20) DEFAULT 'completed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'paid_by') THEN
        ALTER TABLE payments ADD COLUMN paid_by VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'notes') THEN
        ALTER TABLE payments ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 4. Ensure student_fee_assignments table has correct structure
DO $$
BEGIN
    -- Add missing columns to student_fee_assignments table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fee_assignments' AND column_name = 'balance_amount') THEN
        ALTER TABLE student_fee_assignments ADD COLUMN balance_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_fee_assignments' AND column_name = 'status') THEN
        ALTER TABLE student_fee_assignments ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- 5. Update balance_amount in student_fee_assignments if it's null
UPDATE student_fee_assignments 
SET balance_amount = total_amount - COALESCE(amount_paid, 0)
WHERE balance_amount IS NULL;

-- 6. Fix any orphaned records
DELETE FROM payments 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM students WHERE id IS NOT NULL);

DELETE FROM student_fee_assignments 
WHERE student_id IS NOT NULL 
AND student_id NOT IN (SELECT id FROM students WHERE id IS NOT NULL);

-- 7. Disable RLS temporarily for testing (re-enable after testing)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods DISABLE ROW LEVEL SECURITY;

-- 8. Grant necessary permissions
GRANT SELECT ON payments TO authenticated;
GRANT SELECT ON student_fee_assignments TO authenticated;
GRANT SELECT ON fee_structures TO authenticated;
GRANT SELECT ON payment_methods TO authenticated;
GRANT SELECT ON students TO authenticated;

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_fee_structure_id ON payments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);

CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_status ON student_fee_assignments(status);

-- 10. Verify the fix
SELECT '=== VERIFICATION ===' as status;

SELECT 'payment_methods' as table_name, COUNT(*) as record_count FROM payment_methods
UNION ALL
SELECT 'fee_structures' as table_name, COUNT(*) as record_count FROM fee_structures
UNION ALL
SELECT 'payments' as table_name, COUNT(*) as record_count FROM payments
UNION ALL
SELECT 'student_fee_assignments' as table_name, COUNT(*) as record_count FROM student_fee_assignments;

-- Test a basic query
SELECT '=== TEST QUERY ===' as status;
SELECT 
    p.id,
    p.amount,
    p.payment_date,
    s.first_name,
    s.last_name,
    pm.name as payment_method
FROM payments p
LEFT JOIN students s ON p.student_id = s.id
LEFT JOIN payment_methods pm ON p.payment_method_id = pm.id
LIMIT 3;

SELECT '=== CORRECTED QUICK FIX COMPLETE ===' as status;
