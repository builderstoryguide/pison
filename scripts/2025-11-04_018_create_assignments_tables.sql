-- Create assignments and assignment_submissions tables with RLS policies
-- This script creates the tables needed for the assignment management system

-- =====================================================
-- Assignments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assignments (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	assignment_id VARCHAR(100) UNIQUE NOT NULL,
	title VARCHAR(255) NOT NULL,
	description TEXT,
	subject VARCHAR(100) NOT NULL,
	class_id VARCHAR(255) NOT NULL,
	teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	total_marks DECIMAL(5,2) NOT NULL,
	passing_marks DECIMAL(5,2) DEFAULT 50.0,
	weight_percentage DECIMAL(5,2) DEFAULT 100.0,
	assignment_file_url TEXT,
	assignment_file_name VARCHAR(255),
	assignment_file_size INTEGER,
	assignment_file_type VARCHAR(100),
	assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
	due_date DATE NOT NULL,
	status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
	instructions TEXT,
	submission_type VARCHAR(20) DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'both')),
	allow_late_submission BOOLEAN DEFAULT false,
	late_penalty_percentage DECIMAL(5,2) DEFAULT 0.0,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	
	-- Constraints
	CONSTRAINT valid_dates CHECK (due_date >= assigned_date),
	CONSTRAINT valid_marks CHECK (total_marks > 0 AND passing_marks >= 0 AND passing_marks <= total_marks),
	CONSTRAINT valid_late_penalty CHECK (late_penalty_percentage >= 0 AND late_penalty_percentage <= 100)
);

-- =====================================================
-- Assignment Submissions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	submission_id VARCHAR(100) UNIQUE NOT NULL,
	assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
	student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	submitted_text TEXT,
	submission_file_url TEXT,
	submission_file_name VARCHAR(255),
	submission_file_size INTEGER,
	submission_file_type VARCHAR(100),
	marks_obtained DECIMAL(5,2),
	percentage DECIMAL(5,2),
	grade_letter VARCHAR(2),
	grade_point DECIMAL(3,2),
	remarks TEXT,
	feedback TEXT,
	is_late BOOLEAN DEFAULT false,
	is_absent BOOLEAN DEFAULT false,
	is_excused BOOLEAN DEFAULT false,
	submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	graded_at TIMESTAMPTZ,
	status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'excused')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	
	-- Constraints
	CONSTRAINT valid_marks_obtained CHECK (marks_obtained IS NULL OR (marks_obtained >= 0)),
	CONSTRAINT valid_percentage CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))
);

-- =====================================================
-- Indexes for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_created_at ON public.assignments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_teacher_id ON public.assignment_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON public.assignment_submissions(submitted_at DESC);

-- =====================================================
-- Updated_at Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trg_assignments_set_updated_at ON public.assignments;
CREATE TRIGGER trg_assignments_set_updated_at
	BEFORE UPDATE ON public.assignments
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_assignment_submissions_set_updated_at ON public.assignment_submissions;
CREATE TRIGGER trg_assignment_submissions_set_updated_at
	BEFORE UPDATE ON public.assignment_submissions
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on assignments table
DO $$ BEGIN
	ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- Enable RLS on assignment_submissions table
DO $$ BEGIN
	ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignments: Teachers can view their own assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignments_select_own ON public.assignments;
	CREATE POLICY assignments_select_own ON public.assignments
		FOR SELECT USING (auth.uid() = teacher_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignments: Teachers can insert their own assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignments_insert_own ON public.assignments;
	CREATE POLICY assignments_insert_own ON public.assignments
		FOR INSERT WITH CHECK (auth.uid() = teacher_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignments: Teachers can update their own assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignments_update_own ON public.assignments;
	CREATE POLICY assignments_update_own ON public.assignments
		FOR UPDATE USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignments: Teachers can delete their own assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignments_delete_own ON public.assignments;
	CREATE POLICY assignments_delete_own ON public.assignments
		FOR DELETE USING (auth.uid() = teacher_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Teachers can view submissions for their assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_select_teacher ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_select_teacher ON public.assignment_submissions
		FOR SELECT USING (
			EXISTS (
				SELECT 1 FROM public.assignments 
				WHERE assignments.id = assignment_submissions.assignment_id 
				AND assignments.teacher_id = auth.uid()
			)
		);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Students can view their own submissions
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_select_student ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_select_student ON public.assignment_submissions
		FOR SELECT USING (auth.uid() = student_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Students can insert their own submissions
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_insert_student ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_insert_student ON public.assignment_submissions
		FOR INSERT WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Teachers can update submissions for their assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_update_teacher ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_update_teacher ON public.assignment_submissions
		FOR UPDATE USING (
			EXISTS (
				SELECT 1 FROM public.assignments 
				WHERE assignments.id = assignment_submissions.assignment_id 
				AND assignments.teacher_id = auth.uid()
			)
		) WITH CHECK (
			EXISTS (
				SELECT 1 FROM public.assignments 
				WHERE assignments.id = assignment_submissions.assignment_id 
				AND assignments.teacher_id = auth.uid()
			)
		);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Students can update their own ungraded submissions
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_update_student ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_update_student ON public.assignment_submissions
		FOR UPDATE USING (auth.uid() = student_id AND status != 'graded')
		WITH CHECK (auth.uid() = student_id);
EXCEPTION WHEN others THEN NULL; END $$;

-- Assignment Submissions: Teachers can delete submissions for their assignments
DO $$ BEGIN
	DROP POLICY IF EXISTS assignment_submissions_delete_teacher ON public.assignment_submissions;
	CREATE POLICY assignment_submissions_delete_teacher ON public.assignment_submissions
		FOR DELETE USING (
			EXISTS (
				SELECT 1 FROM public.assignments 
				WHERE assignments.id = assignment_submissions.assignment_id 
				AND assignments.teacher_id = auth.uid()
			)
		);
EXCEPTION WHEN others THEN NULL; END $$;

-- Add comment for documentation
COMMENT ON TABLE public.assignments IS 'Stores assignment information created by teachers';
COMMENT ON TABLE public.assignment_submissions IS 'Stores student submissions for assignments';

