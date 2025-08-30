-- Fix Fee Structures Table Structure
-- This script checks and adds missing columns to the fee_structures table

-- Check current table structure
SELECT 'Current fee_structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add level column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'level'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN level VARCHAR(100);
        RAISE NOTICE 'Added level column to fee_structures table';
    ELSE
        RAISE NOTICE 'level column already exists in fee_structures table';
    END IF;

    -- Add branch column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'branch'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN branch VARCHAR(100);
        RAISE NOTICE 'Added branch column to fee_structures table';
    ELSE
        RAISE NOTICE 'branch column already exists in fee_structures table';
    END IF;

    -- Add subsystem column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'subsystem'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN subsystem VARCHAR(50);
        RAISE NOTICE 'Added subsystem column to fee_structures table';
    ELSE
        RAISE NOTICE 'subsystem column already exists in fee_structures table';
    END IF;

    -- Add term column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'term'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN term VARCHAR(50);
        RAISE NOTICE 'Added term column to fee_structures table';
    ELSE
        RAISE NOTICE 'term column already exists in fee_structures table';
    END IF;

    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'academic_year'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN academic_year VARCHAR(20);
        RAISE NOTICE 'Added academic_year column to fee_structures table';
    ELSE
        RAISE NOTICE 'academic_year column already exists in fee_structures table';
    END IF;

    -- Add description column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'description'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to fee_structures table';
    ELSE
        RAISE NOTICE 'description column already exists in fee_structures table';
    END IF;

    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to fee_structures table';
    ELSE
        RAISE NOTICE 'is_active column already exists in fee_structures table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to fee_structures table';
    ELSE
        RAISE NOTICE 'created_at column already exists in fee_structures table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_structures' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE fee_structures ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to fee_structures table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in fee_structures table';
    END IF;

END $$;

-- Show updated table structure
SELECT 'Updated fee_structures table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fee_structures' 
ORDER BY ordinal_position;

-- Check if the table has any data
SELECT 'Fee structures table data count:' as info;
SELECT COUNT(*) as total_records FROM fee_structures;
