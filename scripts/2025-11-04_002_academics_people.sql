-- Students, Parents, Teachers and related tables

-- Students
CREATE TABLE IF NOT EXISTS public.students (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	student_id VARCHAR(32) UNIQUE NOT NULL,
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	middle_name VARCHAR(100),
	email VARCHAR(255),
	phone VARCHAR(20),
	date_of_birth DATE,
	gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
	place_of_birth VARCHAR(100),
	nationality VARCHAR(100) DEFAULT 'Cameroonian',
	religion VARCHAR(100),
	address TEXT,
	city VARCHAR(100),
	region VARCHAR(100),
	subsystem VARCHAR(20) CHECK (subsystem IN ('english','french')),
	branch VARCHAR(20) CHECK (branch IN ('grammar','technical','commercial')),
	class VARCHAR(100),
	previous_school VARCHAR(255),
	previous_class VARCHAR(100),
	is_new_student BOOLEAN DEFAULT true,
	total_fees NUMERIC(12,2) DEFAULT 0,
	paid_fees NUMERIC(12,2) DEFAULT 0,
	fees_status VARCHAR(20) DEFAULT 'pending',
	enrollment_status VARCHAR(20) DEFAULT 'pending',
	academic_year VARCHAR(20),
	status VARCHAR(20) DEFAULT 'active',
	enrollment_date DATE DEFAULT CURRENT_DATE,
	class_id VARCHAR(64),
	class_name VARCHAR(100),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Parents
CREATE TABLE IF NOT EXISTS public.parents (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	parent_code VARCHAR(32) UNIQUE NOT NULL,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255),
	phone VARCHAR(20),
	address TEXT,
	occupation VARCHAR(100),
	relationship VARCHAR(20) CHECK (relationship IN ('father','mother','guardian','other')),
	student_id VARCHAR(32) NOT NULL, -- links to students.student_id
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Emergency contacts (linked to student row id)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	name VARCHAR(255) NOT NULL,
	phone VARCHAR(20) NOT NULL,
	relationship VARCHAR(50),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Medical info
CREATE TABLE IF NOT EXISTS public.medical_info (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
	blood_group VARCHAR(10),
	allergies TEXT,
	medical_conditions TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teachers
CREATE TABLE IF NOT EXISTS public.teachers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	teacher_id VARCHAR(32) UNIQUE NOT NULL,
	title VARCHAR(50),
	first_name VARCHAR(100) NOT NULL,
	last_name VARCHAR(100) NOT NULL,
	email VARCHAR(255) NOT NULL,
	phone VARCHAR(20),
	date_of_birth DATE,
	gender VARCHAR(10) CHECK (gender IN ('male','female','other')),
	nationality VARCHAR(100),
	id_number VARCHAR(100),
	address TEXT,
	city VARCHAR(100),
	region VARCHAR(100),
	subsystem VARCHAR(20) CHECK (subsystem IN ('english','french')),
	subjects TEXT[] DEFAULT '{}',
	classes TEXT[] DEFAULT '{}',
	qualifications TEXT[] DEFAULT '{}',
	experience TEXT,
	employment_type VARCHAR(20) CHECK (employment_type IN ('full-time','part-time','contract')),
	salary NUMERIC(12,2) DEFAULT 0,
	start_date DATE,
	emergency_contact_name VARCHAR(255),
	emergency_contact_relationship VARCHAR(50),
	emergency_contact_phone VARCHAR(20),
	status VARCHAR(20) DEFAULT 'active',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated_at triggers
DROP TRIGGER IF EXISTS trg_students_set_updated_at ON public.students;
CREATE TRIGGER trg_students_set_updated_at
	BEFORE UPDATE ON public.students
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_parents_set_updated_at ON public.parents;
CREATE TRIGGER trg_parents_set_updated_at
	BEFORE UPDATE ON public.parents
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_teachers_set_updated_at ON public.teachers;
CREATE TRIGGER trg_teachers_set_updated_at
	BEFORE UPDATE ON public.teachers
	FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_students_student_id ON public.students(student_id);
CREATE INDEX IF NOT EXISTS idx_parents_student_code ON public.parents(student_id);
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON public.teachers(teacher_id);

