-- =====================================================
-- Academic Sequences Configuration Schema
-- Supports both fixed (1-6) and custom sequences per academic period
-- =====================================================

-- Academic Sequences Table
-- Stores sequence definitions for each academic year/term
CREATE TABLE IF NOT EXISTS public.academic_sequences (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	academic_year VARCHAR(20) NOT NULL,
	term VARCHAR(20) NOT NULL CHECK (term IN ('Term 1', 'Term 2', 'Term 3', 'first', 'second', 'third')),
	sequence_number INTEGER NOT NULL,
	sequence_name VARCHAR(100) NOT NULL,
	start_date DATE,
	end_date DATE,
	max_marks INTEGER DEFAULT 20,
	is_active BOOLEAN DEFAULT true,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(academic_year, term, sequence_number)
);

-- Sequence Configurations Table
-- Stores school-level sequence configuration settings
CREATE TABLE IF NOT EXISTS public.sequence_configurations (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	academic_year VARCHAR(20) NOT NULL,
	term VARCHAR(20) NOT NULL,
	use_fixed_sequences BOOLEAN DEFAULT true, -- If true, use 1-6 sequences; if false, use custom
	default_max_marks INTEGER DEFAULT 20,
	created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(academic_year, term)
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_academic_sequences_year_term ON public.academic_sequences(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_academic_sequences_active ON public.academic_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_sequence_configurations_year_term ON public.sequence_configurations(academic_year, term);

-- =====================================================
-- Function: Initialize Default Sequences
-- Creates default 1-6 sequences for an academic year/term if they don't exist
-- =====================================================
CREATE OR REPLACE FUNCTION public.initialize_default_sequences(
	p_academic_year VARCHAR(20),
	p_term VARCHAR(20)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
	seq_num INTEGER;
	seq_name VARCHAR(100);
BEGIN
	-- Check if sequences already exist
	IF EXISTS (
		SELECT 1 FROM public.academic_sequences 
		WHERE academic_year = p_academic_year AND term = p_term
	) THEN
		RETURN;
	END IF;

	-- Create default sequences 1-6
	FOR seq_num IN 1..6 LOOP
		seq_name := seq_num || CASE seq_num
			WHEN 1 THEN 'st'
			WHEN 2 THEN 'nd'
			WHEN 3 THEN 'rd'
			ELSE 'th'
		END || ' Sequence';

		INSERT INTO public.academic_sequences (
			academic_year,
			term,
			sequence_number,
			sequence_name,
			max_marks,
			is_active
		) VALUES (
			p_academic_year,
			p_term,
			seq_num,
			seq_name,
			20,
			true
		);
	END LOOP;
END;
$$;

-- =====================================================
-- Function: Get Sequences for Academic Period
-- Returns all active sequences for a given academic year/term
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_academic_sequences(
	p_academic_year VARCHAR(20),
	p_term VARCHAR(20)
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
	PERFORM public.initialize_default_sequences(p_academic_year, p_term);

	-- Return all active sequences
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
END;
$$;

-- =====================================================
-- Trigger: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
	NEW.updated_at = NOW();
	RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_academic_sequences_set_updated_at ON public.academic_sequences;
CREATE TRIGGER trg_academic_sequences_set_updated_at
	BEFORE UPDATE ON public.academic_sequences
	FOR EACH ROW
	EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sequence_configurations_set_updated_at ON public.sequence_configurations;
CREATE TRIGGER trg_sequence_configurations_set_updated_at
	BEFORE UPDATE ON public.sequence_configurations
	FOR EACH ROW
	EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- RLS Policies (Row Level Security)
-- =====================================================
ALTER TABLE public.academic_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_configurations ENABLE ROW LEVEL SECURITY;

-- Policy: Teachers can read sequences for their academic periods
CREATE POLICY "Teachers can view sequences"
	ON public.academic_sequences
	FOR SELECT
	USING (true); -- All authenticated users can view sequences

-- Policy: Only admins can modify sequences
CREATE POLICY "Admins can manage sequences"
	ON public.academic_sequences
	FOR ALL
	USING (
		EXISTS (
			SELECT 1 FROM public.users
			WHERE id = auth.uid()
			AND role = 'admin'
		)
	);

-- Policy: Teachers can read sequence configurations
CREATE POLICY "Teachers can view sequence configurations"
	ON public.sequence_configurations
	FOR SELECT
	USING (true);

-- Policy: Only admins can modify sequence configurations
CREATE POLICY "Admins can manage sequence configurations"
	ON public.sequence_configurations
	FOR ALL
	USING (
		EXISTS (
			SELECT 1 FROM public.users
			WHERE id = auth.uid()
			AND role = 'admin'
		)
	);

-- =====================================================
-- Migration: Initialize sequences for current academic year
-- =====================================================
-- This will create default sequences for common academic years/terms
-- Adjust the academic_year and term values as needed
DO $$
DECLARE
	current_year VARCHAR(20) := '2024-2025';
BEGIN
	-- Initialize for Term 1
	PERFORM public.initialize_default_sequences(current_year, 'Term 1');
	
	-- Initialize for Term 2
	PERFORM public.initialize_default_sequences(current_year, 'Term 2');
	
	-- Initialize for Term 3
	PERFORM public.initialize_default_sequences(current_year, 'Term 3');
END;
$$;
