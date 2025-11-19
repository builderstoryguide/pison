-- Fix Sales Table ID Length Issue
-- This migration increases the id and student_id column lengths to accommodate UUID-based IDs
-- Run this on your existing Supabase database to fix the "value too long" error

-- Increase id column from VARCHAR(20) to VARCHAR(50)
ALTER TABLE public.sales 
ALTER COLUMN id TYPE VARCHAR(50);

-- Increase student_id column from VARCHAR(20) to VARCHAR(50) for consistency
ALTER TABLE public.sales 
ALTER COLUMN student_id TYPE VARCHAR(50);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_name = 'sales' 
    AND column_name IN ('id', 'student_id');

