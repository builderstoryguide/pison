-- Examinations and Exam Results Schema
-- Requires PostgreSQL (Supabase). Run after core users and students tables are created.

-- Examinations table
CREATE TABLE IF NOT EXISTS public.examinations (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title VARCHAR(255) NOT NULL,
	type VARCHAR(50) NOT NULL CHECK (type IN ('internal','external','mock','continuous_assessment')),
	exam_board VARCHAR(255) NOT NULL,
	subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english','french')),
	branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar','technical','commercial')),
	level VARCHAR(50) NOT NULL,
	subjects TEXT[] NOT NULL,
	start_date DATE NOT NULL,
	end_date DATE NOT NULL,
	duration INTEGER NOT NULL,
	total_marks INTEGER NOT NULL,
	passing_marks INTEGER NOT NULL,
	venue VARCHAR(255) NOT NULL,
	instructions TEXT,
	status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','ongoing','completed','cancelled')),
	enrolled_students INTEGER DEFAULT 0,
	completed_students INTEGER DEFAULT 0,
	created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exam results table
CREATE TABLE IF NOT EXISTS public.exam_results (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	examination_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
	student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
	student_name VARCHAR(255) NOT NULL,
	subject VARCHAR(100) NOT NULL,
	marks_obtained NUMERIC(6,2) NOT NULL,
	total_marks INTEGER NOT NULL,
	percentage NUMERIC(6,2) NOT NULL,
	grade VARCHAR(5),
	remarks TEXT,
	date_recorded TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	UNIQUE(examination_id, student_id, subject)
);

-- Triggers
DROP TRIGGER IF EXISTS trg_examinations_set_updated_at ON public.examinations;
CREATE TRIGGER trg_examinations_set_updated_at
	BEFORE UPDATE ON public.examinations
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_exam_results_set_updated_at ON public.exam_results;
CREATE TRIGGER trg_exam_results_set_updated_at
	BEFORE UPDATE ON public.exam_results
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_examinations_status ON public.examinations(status);
CREATE INDEX IF NOT EXISTS idx_examinations_type ON public.examinations(type);
CREATE INDEX IF NOT EXISTS idx_examinations_level ON public.examinations(level);
CREATE INDEX IF NOT EXISTS idx_exam_results_examination_id ON public.exam_results(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON public.exam_results(student_id);

-- Enable RLS (Row Level Security) - already done in script 009, but ensure it's enabled
DO $$ BEGIN
	EXECUTE 'ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY examinations_select_all ON public.examinations FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY examinations_insert_all ON public.examinations FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY examinations_update_all ON public.examinations FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY examinations_delete_all ON public.examinations FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	EXECUTE 'ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY exam_results_select_all ON public.exam_results FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY exam_results_insert_all ON public.exam_results FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY exam_results_update_all ON public.exam_results FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
	CREATE POLICY exam_results_delete_all ON public.exam_results FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

