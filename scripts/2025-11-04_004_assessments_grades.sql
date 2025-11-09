-- =====================================================
-- Assessments and Grades Schema with Helper RPCs (Fixed)
-- Option 1: Compute percentage inside RPC, not as generated column
-- =====================================================

-- Assessments
CREATE TABLE IF NOT EXISTS public.assessments (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title VARCHAR(255) NOT NULL,
	type VARCHAR(32) NOT NULL CHECK (type IN ('quiz','test','exam','assignment','project')),
	subject VARCHAR(100) NOT NULL,
	class_id VARCHAR(64) NOT NULL,
	class_name VARCHAR(100),
	teacher_id UUID,
	total_marks INTEGER NOT NULL,
	assessment_date DATE NOT NULL,
	due_date DATE,
	status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','closed')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	student_name VARCHAR(255),
	marks_obtained NUMERIC(6,2) NOT NULL,
	percentage NUMERIC(6,2),
	grade_letter VARCHAR(2),
	remarks TEXT,
	submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- RPC: create_assessment
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_assessment(
	p_title TEXT,
	p_type TEXT,
	p_subject TEXT,
	p_class_id TEXT,
	p_teacher_id UUID,
	p_total_marks INTEGER,
	p_assessment_date DATE,
	p_description TEXT DEFAULT NULL,
	p_passing_marks NUMERIC DEFAULT 50.0,
	p_weight_percentage NUMERIC DEFAULT 100.0,
	p_due_date DATE DEFAULT NULL,
	p_status TEXT DEFAULT 'draft'
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
	new_id UUID;
BEGIN
	INSERT INTO public.assessments (
		title, type, subject, class_id, teacher_id, total_marks, assessment_date, due_date, status
	) VALUES (
		p_title,
		p_type,
		p_subject,
		p_class_id,
		p_teacher_id,
		p_total_marks,
		p_assessment_date,
		p_due_date,
		COALESCE(p_status, 'draft')
	)
	RETURNING id INTO new_id;

	RETURN new_id;
END;
$$;

-- =====================================================
-- RPC: create_grade
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_grade(
	p_assessment_id UUID,
	p_student_id UUID,
	p_teacher_id UUID,
	p_marks_obtained NUMERIC,
	p_remarks TEXT DEFAULT NULL,
	p_feedback TEXT DEFAULT NULL,
	p_is_late BOOLEAN DEFAULT FALSE,
	p_is_absent BOOLEAN DEFAULT FALSE,
	p_is_excused BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
	new_id UUID;
	total_marks NUMERIC;
	percentage NUMERIC;
BEGIN
	-- Get total marks from assessment
	SELECT total_marks INTO total_marks
	FROM public.assessments
	WHERE id = p_assessment_id;

	-- Compute percentage safely
	IF total_marks IS NOT NULL AND total_marks > 0 THEN
		percentage := (p_marks_obtained * 100.0) / total_marks;
	ELSE
		percentage := 0;
	END IF;

	-- Insert grade
	INSERT INTO public.grades (
		assessment_id,
		student_id,
		marks_obtained,
		percentage,
		remarks
	) VALUES (
		p_assessment_id,
		p_student_id,
		p_marks_obtained,
		percentage,
		p_remarks
	)
	RETURNING id INTO new_id;

	RETURN new_id;
END;
$$;

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON public.assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON public.grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON public.grades(student_id);
