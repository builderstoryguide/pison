-- Fix fee_structures table column issue
-- This script adapts to the existing table structure

-- First, let's see what columns actually exist
\echo '=== CURRENT FEE_STRUCTURES COLUMNS ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'amount' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN amount DECIMAL(10,2);
        RAISE NOTICE 'Added amount column to fee_structures';
    END IF;
    
    -- Add due_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'due_date' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN due_date DATE;
        RAISE NOTICE 'Added due_date column to fee_structures';
    END IF;
    
    -- Add term column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'term' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN term VARCHAR(20);
        RAISE NOTICE 'Added term column to fee_structures';
    END IF;
    
    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'academic_year' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN academic_year VARCHAR(20);
        RAISE NOTICE 'Added academic_year column to fee_structures';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' 
            AND column_name = 'is_active' 
            AND table_schema = 'public'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to fee_structures';
    END IF;
END $$;

-- Now insert sample data using only existing columns
INSERT INTO fee_structures (name, subsystem, level, branch, description) 
SELECT 'Form 1 English Grammar', 'english', 'form1', 'grammar', 'Form 1 English Grammar Fee Structure'
WHERE NOT EXISTS (SELECT 1 FROM fee_structures LIMIT 1);

-- Show the updated structure
\echo '=== UPDATED FEE_STRUCTURES COLUMNS ==='
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

\echo '=== SAMPLE DATA ==='
SELECT * FROM fee_structures LIMIT 3;
