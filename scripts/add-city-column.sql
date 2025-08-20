-- Add the missing city column to students table
-- Run this script in your Supabase SQL Editor

-- Check if city column exists
SELECT 'Checking if city column exists...' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'city';

-- Add the city column if it doesn't exist
ALTER TABLE students ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Verify the city column was added
SELECT 'Verifying city column was added...' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'city';

-- Show all columns in students table
SELECT 'All columns in students table:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;
