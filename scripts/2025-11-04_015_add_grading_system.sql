-- Add grading_system column to examinations table
-- This column stores custom grade definitions as JSONB

-- Add grading_system column (nullable to allow existing records)
ALTER TABLE public.examinations 
ADD COLUMN IF NOT EXISTS grading_system JSONB;

-- Add comment to document the structure
COMMENT ON COLUMN public.examinations.grading_system IS 
'JSONB array of grade definitions. Each grade has: { label: string, minPercentage: number, maxPercentage: number }';

