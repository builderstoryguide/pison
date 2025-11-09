-- Timetable-related tables (aligned with docs)

CREATE TABLE IF NOT EXISTS public.timetable_classes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	class_name VARCHAR(100) NOT NULL,
	level VARCHAR(50),
	section VARCHAR(50),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetable_teachers (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	teacher_name VARCHAR(255) NOT NULL,
	subject VARCHAR(100),
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetable_rooms (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	room_name VARCHAR(100) NOT NULL,
	capacity INTEGER,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetable_subjects (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	subject_name VARCHAR(100) NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.timetable_periods (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	class_id UUID REFERENCES public.timetable_classes(id) ON DELETE CASCADE,
	teacher_id UUID REFERENCES public.timetable_teachers(id) ON DELETE SET NULL,
	room_id UUID REFERENCES public.timetable_rooms(id) ON DELETE SET NULL,
	subject_id UUID REFERENCES public.timetable_subjects(id) ON DELETE SET NULL,
	weekday VARCHAR(10) CHECK (weekday IN ('Mon','Tue','Wed','Thu','Fri','Sat')),
	start_time TIME NOT NULL,
	end_time TIME NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timetable_periods_class_id ON public.timetable_periods(class_id);

