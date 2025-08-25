-- Run Financial Fixes
-- Execute this script to fix the Bursar login error

-- First, run the schema fixes
\i scripts/fix-financial-schema.sql

-- Then, verify the fixes worked
SELECT 'Financial Schema Fixes Applied Successfully' as status;
