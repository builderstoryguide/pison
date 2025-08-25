-- Fix fee_structures table only
-- This script only addresses the fee_structures column issue

-- Add missing columns to fee_structures table
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS term VARCHAR(20);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20);
ALTER TABLE fee_structures ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Insert sample data using only the basic columns
INSERT INTO fee_structures (name, subsystem, level, branch, description) 
SELECT 'Form 1 English Grammar', 'english', 'form1', 'grammar', 'Form 1 English Grammar Fee Structure'
WHERE NOT EXISTS (SELECT 1 FROM fee_structures LIMIT 1);

-- Show the result
SELECT 'Fee structures fixed successfully' as status;
SELECT COUNT(*) as fee_structures_count FROM fee_structures;
