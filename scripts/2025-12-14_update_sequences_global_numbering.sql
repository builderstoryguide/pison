-- =====================================================
-- Migration: Update Sequences to Global Numbering
-- Changes sequences from per-term numbering to global numbering per academic year
-- =====================================================

-- Step 1: Drop existing unique constraint
ALTER TABLE IF EXISTS public.academic_sequences 
DROP CONSTRAINT IF EXISTS academic_sequences_academic_year_term_sequence_number_key;

-- Step 2: Clean up duplicate sequences before adding new constraint
-- For each academic_year and sequence_number combination, keep only one sequence
-- DELETE duplicates to allow the unique constraint to be created
DELETE FROM public.academic_sequences
WHERE id NOT IN (
    -- Keep one ID per (academic_year, sequence_number) combination
    SELECT DISTINCT ON (academic_year, sequence_number) id
    FROM public.academic_sequences
    ORDER BY 
        academic_year,
        sequence_number,
        is_active DESC,  -- Prefer active ones
        CASE term 
            WHEN 'Term 1' THEN 1
            WHEN 'Term 2' THEN 2
            WHEN 'Term 3' THEN 3
            ELSE 4
        END,  -- Prefer Term 1, then Term 2, then Term 3
        created_at ASC  -- Keep the oldest one
);

-- Step 3: Add new unique constraint for global numbering
ALTER TABLE IF EXISTS public.academic_sequences 
ADD CONSTRAINT academic_sequences_academic_year_sequence_number_key 
UNIQUE (academic_year, sequence_number);

-- Step 3: Update sequence_configurations table
-- Make term nullable since config is now per academic year
ALTER TABLE IF EXISTS public.sequence_configurations 
ALTER COLUMN term DROP NOT NULL;

-- Step 4: Drop existing unique constraint on sequence_configurations
ALTER TABLE IF EXISTS public.sequence_configurations 
DROP CONSTRAINT IF EXISTS sequence_configurations_academic_year_term_key;

-- Step 5: Add new unique constraint (academic_year only)
ALTER TABLE IF EXISTS public.sequence_configurations 
ADD CONSTRAINT sequence_configurations_academic_year_key 
UNIQUE (academic_year);

-- Step 6: Update index on sequence_configurations
DROP INDEX IF EXISTS idx_sequence_configurations_year_term;
CREATE INDEX IF NOT EXISTS idx_sequence_configurations_year ON public.sequence_configurations(academic_year);

-- =====================================================
-- Function: Initialize Default Sequences (Updated)
-- Creates sequences with global numbering and distributes across terms
-- =====================================================
CREATE OR REPLACE FUNCTION public.initialize_default_sequences(
	p_academic_year VARCHAR(20),
	p_number_of_sequences INTEGER DEFAULT 6
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
	seq_num INTEGER;
	seq_name VARCHAR(100);
	assigned_term VARCHAR(20);
BEGIN
	-- Check if sequences already exist for this academic year
	IF EXISTS (
		SELECT 1 FROM public.academic_sequences 
		WHERE academic_year = p_academic_year AND is_active = true
	) THEN
		RETURN;
	END IF;

	-- Create sequences with global numbering and auto-distribute across terms
	FOR seq_num IN 1..p_number_of_sequences LOOP
		seq_name := seq_num || CASE seq_num
			WHEN 1 THEN 'st'
			WHEN 2 THEN 'nd'
			WHEN 3 THEN 'rd'
			ELSE 'th'
		END || ' Sequence';

		-- Auto-assign to terms: 1-2 → Term 1, 3-4 → Term 2, 5-6 → Term 3
		IF seq_num <= 2 THEN
			assigned_term := 'Term 1';
		ELSIF seq_num <= 4 THEN
			assigned_term := 'Term 2';
		ELSE
			assigned_term := 'Term 3';
		END IF;

INSERT INTO public.academic_sequences (
	academic_year,
	term,
	sequence_number,
	sequence_name,
	start_date,
	end_date,
	max_marks,
	is_active
) VALUES (
	p_academic_year,
	assigned_term,
	seq_num,
	seq_name,
	CURRENT_DATE,
	CURRENT_DATE + INTERVAL '30 days',
	20,
	true
) ON CONFLICT (academic_year, sequence_number) DO NOTHING;	END LOOP;
END;
$$;

-- =====================================================
-- Function: Get Sequences for Academic Period (Updated)
-- Returns sequences for an academic year, optionally filtered by term
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_academic_sequences(
	p_academic_year VARCHAR(20),
	p_term VARCHAR(20) DEFAULT NULL
)
RETURNS TABLE (
	id UUID,
	academic_year VARCHAR(20),
	term VARCHAR(20),
	sequence_number INTEGER,
	sequence_name VARCHAR(100),
	start_date DATE,
	end_date DATE,
	max_marks INTEGER,
	is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
	-- Initialize default sequences if they don't exist
	PERFORM public.initialize_default_sequences(p_academic_year, 6);

	-- Return sequences, optionally filtered by term
	IF p_term IS NOT NULL THEN
		RETURN QUERY
		SELECT 
			s.id,
			s.academic_year,
			s.term,
			s.sequence_number,
			s.sequence_name,
			s.start_date,
			s.end_date,
			s.max_marks,
			s.is_active
		FROM public.academic_sequences s
		WHERE s.academic_year = p_academic_year
			AND s.term = p_term
			AND s.is_active = true
		ORDER BY s.sequence_number;
	ELSE
		RETURN QUERY
		SELECT 
			s.id,
			s.academic_year,
			s.term,
			s.sequence_number,
			s.sequence_name,
			s.start_date,
			s.end_date,
			s.max_marks,
			s.is_active
		FROM public.academic_sequences s
		WHERE s.academic_year = p_academic_year
			AND s.is_active = true
		ORDER BY s.sequence_number;
	END IF;
END;
$$;
