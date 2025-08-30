-- Comprehensive Fix for Fee Structures Table
-- This script will add ALL missing columns to the fee_structures table

-- First, let's see what we currently have
SELECT 'Current fee_structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Add ALL missing columns
DO $$
BEGIN
    -- Add name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'name'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN name VARCHAR(255);
        RAISE NOTICE 'Added name column to fee_structures table';
    END IF;

    -- Add subsystem column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'subsystem'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN subsystem VARCHAR(50) DEFAULT 'english';
        RAISE NOTICE 'Added subsystem column to fee_structures table';
    END IF;

    -- Add level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'level'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN level VARCHAR(100);
        RAISE NOTICE 'Added level column to fee_structures table';
    END IF;

    -- Add branch column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'branch'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN branch VARCHAR(50) DEFAULT 'grammar';
        RAISE NOTICE 'Added branch column to fee_structures table';
    END IF;

    -- Add amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'amount'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN amount DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added amount column to fee_structures table';
    END IF;

    -- Add due_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'due_date'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN due_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added due_date column to fee_structures table';
    END IF;

    -- Add term column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'term'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN term VARCHAR(20) DEFAULT 'first';
        RAISE NOTICE 'Added term column to fee_structures table';
    END IF;

    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'academic_year'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN academic_year VARCHAR(20) DEFAULT '2024-2025';
        RAISE NOTICE 'Added academic_year column to fee_structures table';
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'description'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to fee_structures table';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to fee_structures table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to fee_structures table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to fee_structures table';
    END IF;

    RAISE NOTICE 'All columns have been checked and added if missing';
END $$;

-- Show the updated table structure
SELECT 'Updated fee_structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Add check constraints if they don't exist
DO $$
BEGIN
    -- Add check constraint for subsystem
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_subsystem_check'
    ) THEN
        ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_subsystem_check 
        CHECK (subsystem IN ('english', 'french'));
        RAISE NOTICE 'Added subsystem check constraint';
    END IF;

    -- Add check constraint for branch
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_branch_check'
    ) THEN
        ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_branch_check 
        CHECK (branch IN ('grammar', 'technical', 'commercial'));
        RAISE NOTICE 'Added branch check constraint';
    END IF;

    -- Add check constraint for term
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_term_check'
    ) THEN
        ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_term_check 
        CHECK (term IN ('first', 'second', 'third'));
        RAISE NOTICE 'Added term check constraint';
    END IF;

    -- Add check constraint for amount
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'fee_structures_amount_check'
    ) THEN
        ALTER TABLE fee_structures ADD CONSTRAINT fee_structures_amount_check 
        CHECK (amount >= 0);
        RAISE NOTICE 'Added amount check constraint';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable read access for all users" ON fee_structures;
    DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON fee_structures;
    DROP POLICY IF EXISTS "Enable update access for authenticated users" ON fee_structures;
    DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON fee_structures;

    -- Create new policies
    CREATE POLICY "Enable read access for all users" ON fee_structures
        FOR SELECT USING (true);

    CREATE POLICY "Enable insert access for authenticated users" ON fee_structures
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

    CREATE POLICY "Enable update access for authenticated users" ON fee_structures
        FOR UPDATE USING (auth.role() = 'authenticated');

    CREATE POLICY "Enable delete access for authenticated users" ON fee_structures
        FOR DELETE USING (auth.role() = 'authenticated');

    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Show final table structure
SELECT 'Final fee_structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Show RLS policies
SELECT 'RLS policies on fee_structures table:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'fee_structures';
