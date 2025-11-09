-- Add subject groupings to subjects table
-- This script adds a subject_groupings column to categorize subjects into:
-- Languages, Related Trade Subjects, Trade Subjects, and Others

-- Add subject_groupings column to subjects table
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS subject_groupings TEXT[] DEFAULT '{}' NOT NULL;

-- Add CHECK constraint to ensure only valid grouping values
-- Valid groupings: 'languages', 'related_trade_subjects', 'trade_subjects', 'others'
DO $$ 
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subjects_subject_groupings_check'
  ) THEN
    ALTER TABLE public.subjects 
    ADD CONSTRAINT subjects_subject_groupings_check 
    CHECK (
      -- Allow empty array or array with only valid values
      (array_length(subject_groupings, 1) IS NULL) OR
      (subject_groupings <@ ARRAY['languages', 'related_trade_subjects', 'trade_subjects', 'others']::TEXT[])
    );
  END IF;
END $$;

-- Set default value for existing subjects (empty array)
UPDATE public.subjects 
SET subject_groupings = '{}' 
WHERE subject_groupings IS NULL;

-- Add GIN index for efficient array operations and filtering
CREATE INDEX IF NOT EXISTS idx_subjects_subject_groupings ON public.subjects 
USING GIN (subject_groupings);

-- Add comment to document the column
COMMENT ON COLUMN public.subjects.subject_groupings IS 
'Array of subject groupings: languages, related_trade_subjects, trade_subjects, others';

