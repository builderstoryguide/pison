-- initialize_default_sequences: respect sequence_configurations term_sequence_counts + total_sequences

CREATE OR REPLACE FUNCTION public.initialize_default_sequences(
  p_academic_year VARCHAR(20),
  p_number_of_sequences INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  seq_num INTEGER;
  seq_name VARCHAR(100);
  assigned_term VARCHAR(20);
  total_seq INTEGER;
  term_counts JSONB;
  c1 INTEGER;
  c2 INTEGER;
  c3 INTEGER;
  cursor_pos INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.academic_sequences
    WHERE academic_year = p_academic_year AND is_active = true
  ) THEN
    RETURN;
  END IF;

  SELECT sc.total_sequences, sc.term_sequence_counts
  INTO total_seq, term_counts
  FROM public.sequence_configurations sc
  WHERE sc.academic_year = p_academic_year;

  IF total_seq IS NULL OR total_seq NOT BETWEEN 5 AND 6 THEN
    total_seq := COALESCE(NULLIF(p_number_of_sequences, 0), 6);
    IF total_seq NOT BETWEEN 5 AND 6 THEN
      total_seq := 6;
    END IF;
    IF total_seq = 5 THEN
      c1 := 2; c2 := 2; c3 := 1;
    ELSE
      c1 := 2; c2 := 2; c3 := 2;
    END IF;
  ELSE
    c1 := COALESCE((term_counts->>'Term 1')::INTEGER, 0);
    c2 := COALESCE((term_counts->>'Term 2')::INTEGER, 0);
    c3 := COALESCE((term_counts->>'Term 3')::INTEGER, 0);
    IF c1 + c2 + c3 <> total_seq THEN
      IF total_seq = 5 THEN
        c1 := 2; c2 := 2; c3 := 1;
      ELSE
        c1 := 2; c2 := 2; c3 := 2;
      END IF;
    END IF;
  END IF;

  cursor_pos := 0;
  FOR seq_num IN 1..total_seq LOOP
    cursor_pos := cursor_pos + 1;
    seq_name := seq_num || CASE seq_num
      WHEN 1 THEN 'st'
      WHEN 2 THEN 'nd'
      WHEN 3 THEN 'rd'
      ELSE 'th'
    END || ' Sequence';

    IF cursor_pos <= c1 THEN
      assigned_term := 'Term 1';
    ELSIF cursor_pos <= c1 + c2 THEN
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
    ) ON CONFLICT (academic_year, sequence_number) DO NOTHING;
  END LOOP;
END;
$$;

-- get_academic_sequences: initialize using config when present
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
DECLARE
  init_total INTEGER;
BEGIN
  SELECT COALESCE(sc.total_sequences, 6) INTO init_total
  FROM public.sequence_configurations sc
  WHERE sc.academic_year = p_academic_year;

  IF init_total IS NULL OR init_total NOT BETWEEN 5 AND 6 THEN
    init_total := 6;
  END IF;

  PERFORM public.initialize_default_sequences(p_academic_year, init_total);

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
