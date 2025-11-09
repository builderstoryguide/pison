-- Add unique constraint to prevent duplicate fee structures
-- A fee structure is unique by: class_id, academic_year, and term
-- This ensures that the same class cannot have multiple fee structures for the same term and academic year

-- First, ensure class_id is NOT NULL for the constraint to work properly
-- (Note: This assumes all existing fee structures have class_id set)
DO $$
BEGIN
    -- Check if there are any fee structures with NULL class_id
    IF EXISTS (SELECT 1 FROM public.fee_structures WHERE class_id IS NULL) THEN
        RAISE NOTICE 'Warning: Found fee structures with NULL class_id. These will not be protected by the unique constraint.';
        RAISE NOTICE 'Consider updating these records or removing them before applying the constraint.';
    END IF;
END $$;

-- Drop the unique constraint if it already exists (for idempotency)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'fee_structures_class_academic_term_unique'
        AND conrelid = 'public.fee_structures'::regclass
    ) THEN
        ALTER TABLE public.fee_structures 
        DROP CONSTRAINT fee_structures_class_academic_term_unique;
        
        RAISE NOTICE 'Dropped existing unique constraint fee_structures_class_academic_term_unique';
    END IF;
END $$;

-- Create unique constraint on (class_id, academic_year, term)
-- This prevents duplicate fee structures for the same class, academic year, and term
-- Note: NULL values are considered distinct, so multiple NULL class_ids are allowed
-- Since the API requires class_id, this should not be an issue
ALTER TABLE public.fee_structures
ADD CONSTRAINT fee_structures_class_academic_term_unique 
UNIQUE (class_id, academic_year, term);

-- Create a composite index to support the unique constraint and improve query performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_academic_term 
ON public.fee_structures(class_id, academic_year, term);

-- Verify the constraint was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'fee_structures_class_academic_term_unique'
        AND conrelid = 'public.fee_structures'::regclass
    ) THEN
        RAISE NOTICE '✓ Unique constraint fee_structures_class_academic_term_unique created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create unique constraint fee_structures_class_academic_term_unique';
    END IF;
END $$;

