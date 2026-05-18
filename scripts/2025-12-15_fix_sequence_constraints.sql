-- =====================================================
-- Fix Sequence Constraints
-- Ensures the correct unique constraints exist for both tables:
-- - academic_sequences: (academic_year, sequence_number)
-- - sequence_configurations: (academic_year)
-- =====================================================

-- Part 1: Fix academic_sequences table
ALTER TABLE IF EXISTS public.academic_sequences
DROP CONSTRAINT IF EXISTS academic_sequences_academic_year_term_sequence_number_key;

DELETE FROM public.academic_sequences
WHERE id NOT IN (
    SELECT DISTINCT ON (academic_year, sequence_number) id
    FROM public.academic_sequences
    ORDER BY
        academic_year,
        sequence_number,
        is_active DESC,
        updated_at DESC,
        created_at ASC
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'academic_sequences_academic_year_sequence_number_key'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER TABLE public.academic_sequences
        ADD CONSTRAINT academic_sequences_academic_year_sequence_number_key
        UNIQUE (academic_year, sequence_number);
    END IF;
END $$;

-- Part 2: Fix sequence_configurations table
ALTER TABLE IF EXISTS public.sequence_configurations
ALTER COLUMN term DROP NOT NULL;

ALTER TABLE IF EXISTS public.sequence_configurations
DROP CONSTRAINT IF EXISTS sequence_configurations_academic_year_term_key;

DELETE FROM public.sequence_configurations
WHERE id NOT IN (
    SELECT DISTINCT ON (academic_year) id
    FROM public.sequence_configurations
    ORDER BY
        academic_year,
        updated_at DESC,
        created_at ASC
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'sequence_configurations_academic_year_key'
        AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        ALTER TABLE public.sequence_configurations
        ADD CONSTRAINT sequence_configurations_academic_year_key
        UNIQUE (academic_year);
    END IF;
END $$;

DROP INDEX IF EXISTS idx_sequence_configurations_year_term;
CREATE INDEX IF NOT EXISTS idx_sequence_configurations_year
ON public.sequence_configurations(academic_year);
