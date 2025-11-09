-- Classes, subjects, and teacher assignments

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(100) NOT NULL,
	level VARCHAR(50),
	section VARCHAR(50),
	subsystem VARCHAR(20) CHECK (subsystem IN ('english','french')),
	subject VARCHAR(100),
	student_count INTEGER DEFAULT 0,
	schedule TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subjects (optional canonical list)
CREATE TABLE IF NOT EXISTS public.subjects (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name VARCHAR(100) UNIQUE NOT NULL,
	code VARCHAR(50),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teacher subjects assignments (used by teacher grades)
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
	subject_name VARCHAR(100) NOT NULL,
	is_active BOOLEAN NOT NULL DEFAULT true,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Junction tables (future-proofing)
CREATE TABLE IF NOT EXISTS public.class_students (
	class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	PRIMARY KEY (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.class_teachers (
	class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
	teacher_row_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
	PRIMARY KEY (class_id, teacher_row_id)
);

-- Triggers
DROP TRIGGER IF EXISTS trg_classes_set_updated_at ON public.classes;
CREATE TRIGGER trg_classes_set_updated_at
	BEFORE UPDATE ON public.classes
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_classes_name ON public.classes(name);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON public.teacher_subjects(teacher_id);

