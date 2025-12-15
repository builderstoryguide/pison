-- =====================================================
-- Fix Sequence Constraints
-- Ensures the correct unique constraints exist for both tables:
-- - academic_sequences: (academic_year, sequence_number)
-- - sequence_configurations: (academic_year)
-- =====================================================

-- =====================================================
-- Part 1: Fix academic_sequences table
-- =====================================================

-- Step 1: Drop incorrect unique constraints if they exist
-- We want to remove the (academic_year, term, sequence_number) constraint if it exists
ALTER TABLE IF EXISTS public.academic_sequences 
DROP CONSTRAINT IF EXISTS academic_sequences_academic_year_term_sequence_number_key;

-- Step 2: Clean up duplicate sequences
-- Keep only one sequence per (academic_year, sequence_number)
DELETE FROM public.academic_sequences
WHERE id NOT IN (
    SELECT DISTINCT ON (academic_year, sequence_number) id
    FROM public.academic_sequences
    ORDER BY 
        academic_year,
        sequence_number,
        is_active DESC,       -- Prefer active ones
        updated_at DESC,      -- Prefer recently updated ones
        created_at ASC        -- Prefer older creation (stable ID)
);

-- Step 3: Ensure the correct unique constraint exists
-- We use a DO block to safely check and add the constraint
DO $$
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sequence_configurations_academic_year_key'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')        WHERE conname = 'academic_sequences_academic_year_sequence_number_key'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN    ) THEN
        ALTER TABLE public.academic_sequences 
        ADD CONSTRAINT academic_sequences_academic_year_sequence_number_key 
        UNIQUE (academic_year, sequence_number);
    END IF;
END $$;

-- =====================================================
-- Part 2: Fix sequence_configurations table
-- =====================================================

-- Step 4: Make term column nullable (config is now per academic year, not per term)
ALTER TABLE IF EXISTS public.sequence_configurations 
ALTER COLUMN term DROP NOT NULL;

-- Step 5: Drop old unique constraint on (academic_year, term)
ALTER TABLE IF EXISTS public.sequence_configurations 
DROP CONSTRAINT IF EXISTS sequence_configurations_academic_year_term_key;

-- Step 6: Clean up duplicate configurations
-- Keep only one configuration per academic_year
-- WARNING: This DELETE is permanent and unrecoverable. Ensure backups exist.
DELETE FROM public.sequence_configurations
WHERE id NOT IN (
    SELECT DISTINCT ON (academic_year) id
    FROM public.sequence_configurations
    ORDER BY 
        academic_year,
        updated_at DESC,      -- Prefer recently updated ones
        created_at ASC        -- Prefer older creation (stable ID)
);
-- Step 7: Ensure the correct unique constraint exists on academic_year only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'sequence_configurations_academic_year_key'
    ) THEN
        ALTER TABLE public.sequence_configurations 
        ADD CONSTRAINT sequence_configurations_academic_year_key 
        UNIQUE (academic_year);
    END IF;
END $$;

-- Step 8: Update index on sequence_configurations
DROP INDEX IF EXISTS idx_sequence_configurations_year_term;
CREATE INDEX IF NOT EXISTS idx_sequence_configurations_year 
ON public.sequence_configurations(academic_year);
