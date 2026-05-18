-- Sequence configuration: total per year (5 or 6) + per-term distribution

ALTER TABLE IF EXISTS public.sequence_configurations
  ADD COLUMN IF NOT EXISTS total_sequences INTEGER NOT NULL DEFAULT 6;

ALTER TABLE IF EXISTS public.sequence_configurations
  ADD COLUMN IF NOT EXISTS term_sequence_counts JSONB;

ALTER TABLE IF EXISTS public.sequence_configurations
  DROP CONSTRAINT IF EXISTS sequence_configurations_total_sequences_check;

ALTER TABLE IF EXISTS public.sequence_configurations
  ADD CONSTRAINT sequence_configurations_total_sequences_check
  CHECK (total_sequences >= 5 AND total_sequences <= 6);

-- Backfill total_sequences and term_sequence_counts from active academic_sequences
UPDATE public.sequence_configurations sc
SET
  total_sequences = COALESCE(sub.cnt, 6),
  term_sequence_counts = COALESCE(sub.by_term, '{"Term 1":2,"Term 2":2,"Term 3":2}'::jsonb)
FROM (
  SELECT
    academic_year,
    COUNT(*) FILTER (WHERE is_active) AS cnt,
    jsonb_build_object(
      'Term 1', COUNT(*) FILTER (WHERE is_active AND term = 'Term 1'),
      'Term 2', COUNT(*) FILTER (WHERE is_active AND term = 'Term 2'),
      'Term 3', COUNT(*) FILTER (WHERE is_active AND term = 'Term 3')
    ) AS by_term
  FROM public.academic_sequences
  GROUP BY academic_year
) sub
WHERE sc.academic_year = sub.academic_year;

UPDATE public.sequence_configurations
SET
  total_sequences = 6,
  term_sequence_counts = '{"Term 1":2,"Term 2":2,"Term 3":2}'::jsonb
WHERE term_sequence_counts IS NULL;
