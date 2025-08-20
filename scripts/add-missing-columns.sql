-- Add missing columns to students table
-- Run this script in your Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT 'Current columns in students table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Add all potentially missing columns
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS region VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(100),
ADD COLUMN IF NOT EXISTS religion VARCHAR(100),
ADD COLUMN IF NOT EXISTS branch VARCHAR(20),
ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255),
ADD COLUMN IF NOT EXISTS previous_class VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_new_student BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS total_fees DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_fees DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS fees_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2024-2025',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;

-- Add constraints if they don't exist (this will fail if constraints already exist, which is fine)
DO $$
BEGIN
    -- Add subsystem constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'students_subsystem_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_subsystem_check 
        CHECK (subsystem IN ('english', 'french'));
    END IF;
    
    -- Add branch constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'students_branch_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_branch_check 
        CHECK (branch IN ('grammar', 'technical', 'commercial'));
    END IF;
    
    -- Add fees_status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'students_fees_status_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_fees_status_check 
        CHECK (fees_status IN ('pending', 'partial', 'paid', 'overdue'));
    END IF;
    
    -- Add enrollment_status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'students_enrollment_status_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_enrollment_status_check 
        CHECK (enrollment_status IN ('pending', 'enrolled', 'transferred', 'graduated'));
    END IF;
    
    -- Add status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'students_status_check'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_status_check 
        CHECK (status IN ('active', 'inactive', 'graduated', 'transferred'));
    END IF;
END $$;

-- Show the updated table structure
SELECT 'Updated columns in students table:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Verify that all required columns exist
SELECT 'Verification - Required columns:' as info;
SELECT 
    column_name,
    CASE 
        WHEN column_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('city'),
        ('region'),
        ('address'),
        ('branch'),
        ('subsystem'),
        ('middle_name'),
        ('place_of_birth'),
        ('religion'),
        ('previous_school'),
        ('previous_class'),
        ('is_new_student'),
        ('total_fees'),
        ('paid_fees'),
        ('fees_status'),
        ('enrollment_status'),
        ('academic_year'),
        ('status'),
        ('enrollment_date')
) AS required_columns(column_name)
LEFT JOIN information_schema.columns 
    ON information_schema.columns.column_name = required_columns.column_name 
    AND information_schema.columns.table_name = 'students'
ORDER BY column_name;
