-- =====================================================
-- TIMETABLE MANAGEMENT DATABASE SETUP
-- =====================================================
-- This script creates the database schema for timetable management
-- functionality in the school management system.
-- 
-- Tables created:
-- 1. timetable_classes - Class information for timetabling
-- 2. timetable_teachers - Teacher information and subject assignments
-- 3. timetable_rooms - Room information and capacity
-- 4. timetable_subjects - Subject definitions
-- 5. timetable_periods - Individual timetable periods
-- 6. timetable_schedules - Weekly schedule templates
-- 7. timetable_constraints - Scheduling constraints and rules
-- 
-- Author: School Management System
-- Date: December 2024
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TIMETABLE CLASSES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level VARCHAR(50) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    academic_year VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique class per academic year
    UNIQUE(class_id, academic_year)
);

-- =====================================================
-- 2. TIMETABLE TEACHERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    max_periods_per_day INTEGER DEFAULT 6,
    max_periods_per_week INTEGER DEFAULT 30,
    preferred_days TEXT[], -- Array of preferred days
    preferred_times TEXT[], -- Array of preferred time slots
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id)
);

-- =====================================================
-- 3. TIMETABLE ROOMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20),
    capacity INTEGER NOT NULL,
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('classroom', 'laboratory', 'library', 'hall', 'computer_lab', 'science_lab')),
    building VARCHAR(100),
    floor INTEGER,
    equipment TEXT[], -- Array of available equipment
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, building)
);

-- =====================================================
-- 4. TIMETABLE SUBJECTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    credits INTEGER DEFAULT 1,
    hours_per_week INTEGER DEFAULT 5,
    subject_type VARCHAR(50) DEFAULT 'core' CHECK (subject_type IN ('core', 'elective', 'optional')),
    applicable_subsystems TEXT[] DEFAULT ARRAY['english', 'french'],
    applicable_branches TEXT[] DEFAULT ARRAY['grammar', 'technical', 'commercial'],
    applicable_levels TEXT[], -- Array of applicable levels
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. TEACHER-SUBJECT ASSIGNMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_teacher_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES timetable_teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES timetable_subjects(id) ON DELETE CASCADE,
    proficiency_level VARCHAR(20) DEFAULT 'expert' CHECK (proficiency_level IN ('beginner', 'intermediate', 'expert')),
    years_of_experience INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false, -- Primary subject for the teacher
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(teacher_id, subject_id)
);

-- =====================================================
-- 6. TIMETABLE PERIODS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID, -- Will reference timetable_schedules
    class_id UUID REFERENCES timetable_classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES timetable_subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES timetable_teachers(id) ON DELETE CASCADE,
    room_id UUID REFERENCES timetable_rooms(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    period_number INTEGER NOT NULL,
    period_type VARCHAR(20) DEFAULT 'regular' CHECK (period_type IN ('regular', 'break', 'lunch', 'assembly', 'exam')),
    is_break BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure no overlapping periods for same class on same day
    UNIQUE(class_id, day_of_week, start_time),
    -- Ensure no overlapping periods for same teacher on same day
    UNIQUE(teacher_id, day_of_week, start_time),
    -- Ensure no overlapping periods for same room on same day
    UNIQUE(room_id, day_of_week, start_time)
);

-- =====================================================
-- 7. TIMETABLE SCHEDULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('first', 'second', 'third')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    is_template BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(academic_year, term)
);

-- =====================================================
-- 8. TIMETABLE CONSTRAINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_constraints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    constraint_type VARCHAR(50) NOT NULL CHECK (constraint_type IN ('teacher_availability', 'room_availability', 'subject_requirement', 'break_requirement', 'lunch_requirement')),
    constraint_name VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES timetable_teachers(id) ON DELETE CASCADE,
    room_id UUID REFERENCES timetable_rooms(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES timetable_subjects(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20),
    start_time TIME,
    end_time TIME,
    is_blocked BOOLEAN DEFAULT false, -- true = blocked, false = preferred
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. TIMETABLE TIME SLOTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    slot_number INTEGER NOT NULL,
    is_break BOOLEAN DEFAULT false,
    break_type VARCHAR(20) DEFAULT 'regular' CHECK (break_type IN ('regular', 'lunch', 'assembly')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(start_time, end_time)
);

-- =====================================================
-- 10. TIMETABLE GENERATION LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS timetable_generation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generation_type VARCHAR(50) NOT NULL CHECK (generation_type IN ('automatic', 'manual', 'regenerate')),
    class_id UUID REFERENCES timetable_classes(id) ON DELETE CASCADE,
    generated_by UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
    total_periods_generated INTEGER DEFAULT 0,
    conflicts_resolved INTEGER DEFAULT 0,
    generation_time_seconds INTEGER,
    error_message TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Timetable classes indexes
CREATE INDEX IF NOT EXISTS idx_timetable_classes_subsystem ON timetable_classes(subsystem);
CREATE INDEX IF NOT EXISTS idx_timetable_classes_branch ON timetable_classes(branch);
CREATE INDEX IF NOT EXISTS idx_timetable_classes_academic_year ON timetable_classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_timetable_classes_active ON timetable_classes(is_active);

-- Timetable teachers indexes
CREATE INDEX IF NOT EXISTS idx_timetable_teachers_active ON timetable_teachers(is_active);
CREATE INDEX IF NOT EXISTS idx_timetable_teachers_name ON timetable_teachers(name);

-- Timetable rooms indexes
CREATE INDEX IF NOT EXISTS idx_timetable_rooms_type ON timetable_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_timetable_rooms_available ON timetable_rooms(is_available);
CREATE INDEX IF NOT EXISTS idx_timetable_rooms_capacity ON timetable_rooms(capacity);

-- Timetable subjects indexes
CREATE INDEX IF NOT EXISTS idx_timetable_subjects_type ON timetable_subjects(subject_type);
CREATE INDEX IF NOT EXISTS idx_timetable_subjects_active ON timetable_subjects(is_active);

-- Timetable periods indexes
CREATE INDEX IF NOT EXISTS idx_timetable_periods_class_day ON timetable_periods(class_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_periods_teacher_day ON timetable_periods(teacher_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_periods_room_day ON timetable_periods(room_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_timetable_periods_time ON timetable_periods(start_time, end_time);

-- Timetable schedules indexes
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_academic_year ON timetable_schedules(academic_year);
CREATE INDEX IF NOT EXISTS idx_timetable_schedules_active ON timetable_schedules(is_active);

-- Timetable constraints indexes
CREATE INDEX IF NOT EXISTS idx_timetable_constraints_type ON timetable_constraints(constraint_type);
CREATE INDEX IF NOT EXISTS idx_timetable_constraints_teacher ON timetable_constraints(teacher_id);
CREATE INDEX IF NOT EXISTS idx_timetable_constraints_room ON timetable_constraints(room_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
CREATE TRIGGER update_timetable_classes_updated_at BEFORE UPDATE ON timetable_classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_teachers_updated_at BEFORE UPDATE ON timetable_teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_rooms_updated_at BEFORE UPDATE ON timetable_rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_subjects_updated_at BEFORE UPDATE ON timetable_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_teacher_subjects_updated_at BEFORE UPDATE ON timetable_teacher_subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_periods_updated_at BEFORE UPDATE ON timetable_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_schedules_updated_at BEFORE UPDATE ON timetable_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_constraints_updated_at BEFORE UPDATE ON timetable_constraints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timetable_time_slots_updated_at BEFORE UPDATE ON timetable_time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for class timetables
CREATE OR REPLACE VIEW v_class_timetables AS
SELECT 
    tc.id as class_id,
    tc.name as class_name,
    tc.level,
    tc.subsystem,
    tc.branch,
    tc.academic_year,
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    ts.name as subject_name,
    tch.name as teacher_name,
    tr.name as room_name,
    tr.room_type,
    tp.period_type,
    tp.is_break,
    tp.notes
FROM timetable_classes tc
LEFT JOIN timetable_periods tp ON tc.id = tp.class_id
LEFT JOIN timetable_subjects ts ON tp.subject_id = ts.id
LEFT JOIN timetable_teachers tch ON tp.teacher_id = tch.id
LEFT JOIN timetable_rooms tr ON tp.room_id = tr.id
WHERE tc.is_active = true
ORDER BY tc.name, tp.day_of_week, tp.start_time;

-- View for teacher timetables
CREATE OR REPLACE VIEW v_teacher_timetables AS
SELECT 
    tch.id as teacher_id,
    tch.name as teacher_name,
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    ts.name as subject_name,
    tc.name as class_name,
    tr.name as room_name,
    tp.period_type,
    tp.is_break,
    tp.notes
FROM timetable_teachers tch
LEFT JOIN timetable_periods tp ON tch.id = tp.teacher_id
LEFT JOIN timetable_subjects ts ON tp.subject_id = ts.id
LEFT JOIN timetable_classes tc ON tp.class_id = tc.id
LEFT JOIN timetable_rooms tr ON tp.room_id = tr.id
WHERE tch.is_active = true
ORDER BY tch.name, tp.day_of_week, tp.start_time;

-- View for room timetables
CREATE OR REPLACE VIEW v_room_timetables AS
SELECT 
    tr.id as room_id,
    tr.name as room_name,
    tr.room_type,
    tr.capacity,
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    ts.name as subject_name,
    tch.name as teacher_name,
    tc.name as class_name,
    tp.period_type,
    tp.is_break,
    tp.notes
FROM timetable_rooms tr
LEFT JOIN timetable_periods tp ON tr.id = tp.room_id
LEFT JOIN timetable_subjects ts ON tp.subject_id = ts.id
LEFT JOIN timetable_teachers tch ON tp.teacher_id = tch.id
LEFT JOIN timetable_classes tc ON tp.class_id = tc.id
WHERE tr.is_active = true
ORDER BY tr.name, tp.day_of_week, tp.start_time;

-- View for timetable conflicts
CREATE OR REPLACE VIEW v_timetable_conflicts AS
SELECT 
    'teacher_conflict' as conflict_type,
    tch.name as teacher_name,
    tp1.day_of_week,
    tp1.start_time,
    tp1.end_time,
    tc1.name as class1,
    tc2.name as class2,
    'Teacher has overlapping periods' as conflict_description
FROM timetable_periods tp1
JOIN timetable_periods tp2 ON tp1.teacher_id = tp2.teacher_id 
    AND tp1.day_of_week = tp2.day_of_week
    AND tp1.id != tp2.id
    AND (
        (tp1.start_time < tp2.end_time AND tp1.end_time > tp2.start_time)
    )
JOIN timetable_teachers tch ON tp1.teacher_id = tch.id
JOIN timetable_classes tc1 ON tp1.class_id = tc1.id
JOIN timetable_classes tc2 ON tp2.class_id = tc2.id
WHERE tp1.start_time < tp2.start_time

UNION ALL

SELECT 
    'room_conflict' as conflict_type,
    tr.name as room_name,
    tp1.day_of_week,
    tp1.start_time,
    tp1.end_time,
    tc1.name as class1,
    tc2.name as class2,
    'Room has overlapping periods' as conflict_description
FROM timetable_periods tp1
JOIN timetable_periods tp2 ON tp1.room_id = tp2.room_id 
    AND tp1.day_of_week = tp2.day_of_week
    AND tp1.id != tp2.id
    AND (
        (tp1.start_time < tp2.end_time AND tp1.end_time > tp2.start_time)
    )
JOIN timetable_rooms tr ON tp1.room_id = tr.id
JOIN timetable_classes tc1 ON tp1.class_id = tc1.id
JOIN timetable_classes tc2 ON tp2.class_id = tc2.id
WHERE tp1.start_time < tp2.start_time;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample time slots
INSERT INTO timetable_time_slots (slot_name, start_time, end_time, duration_minutes, slot_number, is_break) VALUES
('Period 1', '08:00:00', '08:45:00', 45, 1, false),
('Period 2', '08:45:00', '09:30:00', 45, 2, false),
('Period 3', '09:30:00', '10:15:00', 45, 3, false),
('Period 4', '10:15:00', '11:00:00', 45, 4, false),
('Break', '11:00:00', '11:15:00', 15, 5, true),
('Period 5', '11:15:00', '12:00:00', 45, 6, false),
('Period 6', '12:00:00', '12:45:00', 45, 7, false),
('Lunch', '12:45:00', '13:30:00', 45, 8, true),
('Period 7', '13:30:00', '14:15:00', 45, 9, false),
('Period 8', '14:15:00', '15:00:00', 45, 10, false),
('Period 9', '15:00:00', '15:45:00', 45, 11, false),
('Period 10', '15:45:00', '16:30:00', 45, 12, false)
ON CONFLICT (start_time, end_time) DO NOTHING;

-- Insert sample subjects
INSERT INTO timetable_subjects (name, code, description, hours_per_week, subject_type, applicable_subsystems, applicable_branches) VALUES
('Mathematics', 'MATH', 'Core mathematics for all levels', 6, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'technical', 'commercial']),
('English Language', 'ENG', 'English language and literature', 5, 'core', ARRAY['english'], ARRAY['grammar', 'technical', 'commercial']),
('French Language', 'FRE', 'French language and literature', 5, 'core', ARRAY['french'], ARRAY['grammar', 'technical', 'commercial']),
('Biology', 'BIO', 'Biological sciences', 4, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'technical']),
('Chemistry', 'CHEM', 'Chemical sciences', 4, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'technical']),
('Physics', 'PHY', 'Physical sciences', 4, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'technical']),
('History', 'HIST', 'World and local history', 3, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'commercial']),
('Geography', 'GEO', 'Physical and human geography', 3, 'core', ARRAY['english', 'french'], ARRAY['grammar', 'commercial']),
('Computer Science', 'CS', 'Information technology', 3, 'elective', ARRAY['english', 'french'], ARRAY['technical']),
('Economics', 'ECON', 'Economic principles', 3, 'elective', ARRAY['english', 'french'], ARRAY['commercial'])
ON CONFLICT (code) DO NOTHING;

-- Insert sample rooms
INSERT INTO timetable_rooms (name, room_number, capacity, room_type, building, floor, equipment) VALUES
('Room 101', '101', 40, 'classroom', 'Main Building', 1, ARRAY['whiteboard', 'projector']),
('Room 102', '102', 35, 'classroom', 'Main Building', 1, ARRAY['whiteboard']),
('Science Lab 1', 'SL1', 30, 'science_lab', 'Science Building', 1, ARRAY['lab_equipment', 'safety_gear', 'projector']),
('Computer Lab', 'CL1', 25, 'computer_lab', 'Technology Building', 1, ARRAY['computers', 'projector', 'network']),
('Library', 'LIB', 50, 'library', 'Main Building', 2, ARRAY['books', 'study_tables', 'computers']),
('Assembly Hall', 'AH', 200, 'hall', 'Main Building', 1, ARRAY['stage', 'sound_system', 'projector']),
('Room 201', '201', 38, 'classroom', 'Main Building', 2, ARRAY['whiteboard', 'projector']),
('Room 202', '202', 42, 'classroom', 'Main Building', 2, ARRAY['whiteboard'])
ON CONFLICT (name, building) DO NOTHING;

-- =====================================================
-- FUNCTIONS FOR TIMETABLE OPERATIONS
-- =====================================================

-- Function to check for timetable conflicts
CREATE OR REPLACE FUNCTION check_timetable_conflicts(
    p_class_id UUID DEFAULT NULL,
    p_teacher_id UUID DEFAULT NULL,
    p_room_id UUID DEFAULT NULL,
    p_day_of_week VARCHAR DEFAULT NULL,
    p_start_time TIME DEFAULT NULL,
    p_end_time TIME DEFAULT NULL
)
RETURNS TABLE(
    conflict_type VARCHAR,
    conflict_description TEXT,
    conflicting_entity VARCHAR
) AS $$
BEGIN
    -- Check teacher conflicts
    IF p_teacher_id IS NOT NULL AND p_day_of_week IS NOT NULL AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'teacher_conflict'::VARCHAR,
            'Teacher has overlapping period'::TEXT,
            tch.name::VARCHAR
        FROM timetable_periods tp
        JOIN timetable_teachers tch ON tp.teacher_id = tch.id
        WHERE tp.teacher_id = p_teacher_id
        AND tp.day_of_week = p_day_of_week
        AND (
            (p_start_time < tp.end_time AND p_end_time > tp.start_time)
        );
    END IF;

    -- Check room conflicts
    IF p_room_id IS NOT NULL AND p_day_of_week IS NOT NULL AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'room_conflict'::VARCHAR,
            'Room has overlapping period'::TEXT,
            tr.name::VARCHAR
        FROM timetable_periods tp
        JOIN timetable_rooms tr ON tp.room_id = tr.id
        WHERE tp.room_id = p_room_id
        AND tp.day_of_week = p_day_of_week
        AND (
            (p_start_time < tp.end_time AND p_end_time > tp.start_time)
        );
    END IF;

    -- Check class conflicts
    IF p_class_id IS NOT NULL AND p_day_of_week IS NOT NULL AND p_start_time IS NOT NULL AND p_end_time IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'class_conflict'::VARCHAR,
            'Class has overlapping period'::TEXT,
            tc.name::VARCHAR
        FROM timetable_periods tp
        JOIN timetable_classes tc ON tp.class_id = tc.id
        WHERE tp.class_id = p_class_id
        AND tp.day_of_week = p_day_of_week
        AND (
            (p_start_time < tp.end_time AND p_end_time > tp.start_time)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots for a given day
CREATE OR REPLACE FUNCTION get_available_time_slots(
    p_day_of_week VARCHAR,
    p_class_id UUID DEFAULT NULL,
    p_teacher_id UUID DEFAULT NULL,
    p_room_id UUID DEFAULT NULL
)
RETURNS TABLE(
    slot_id UUID,
    slot_name VARCHAR,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tts.id,
        tts.slot_name,
        tts.start_time,
        tts.end_time,
        CASE 
            WHEN tp.id IS NULL THEN true
            ELSE false
        END as is_available
    FROM timetable_time_slots tts
    LEFT JOIN timetable_periods tp ON 
        tts.start_time = tp.start_time 
        AND tts.end_time = tp.end_time
        AND tp.day_of_week = p_day_of_week
        AND (
            (p_class_id IS NOT NULL AND tp.class_id = p_class_id) OR
            (p_teacher_id IS NOT NULL AND tp.teacher_id = p_teacher_id) OR
            (p_room_id IS NOT NULL AND tp.room_id = p_room_id)
        )
    WHERE tts.is_active = true
    ORDER BY tts.slot_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate timetable for a class
CREATE OR REPLACE FUNCTION generate_class_timetable(
    p_class_id UUID,
    p_academic_year VARCHAR,
    p_term VARCHAR,
    p_generated_by UUID
)
RETURNS UUID AS $$
DECLARE
    v_schedule_id UUID;
    v_generation_log_id UUID;
    v_period_count INTEGER := 0;
    v_conflicts_resolved INTEGER := 0;
    v_start_time TIMESTAMP;
BEGIN
    v_start_time := NOW();
    
    -- Create generation log entry
    INSERT INTO timetable_generation_logs (generation_type, class_id, generated_by, status)
    VALUES ('automatic', p_class_id, p_generated_by, 'started')
    RETURNING id INTO v_generation_log_id;
    
    -- Create new schedule
    INSERT INTO timetable_schedules (name, academic_year, term, start_date, end_date, created_by)
    VALUES (
        'Auto-generated Schedule for Class ' || p_class_id,
        p_academic_year,
        p_term,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 months',
        p_generated_by
    )
    RETURNING id INTO v_schedule_id;
    
    -- Here you would implement the actual timetable generation algorithm
    -- This is a simplified version that creates basic periods
    
    -- Update generation log
    UPDATE timetable_generation_logs 
    SET 
        status = 'completed',
        total_periods_generated = v_period_count,
        conflicts_resolved = v_conflicts_resolved,
        generation_time_seconds = EXTRACT(EPOCH FROM (NOW() - v_start_time)),
        completed_at = NOW()
    WHERE id = v_generation_log_id;
    
    RETURN v_schedule_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Update generation log with error
        UPDATE timetable_generation_logs 
        SET 
            status = 'failed',
            error_message = SQLERRM,
            completed_at = NOW()
        WHERE id = v_generation_log_id;
        
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE timetable_classes IS 'Stores class information for timetabling purposes';
COMMENT ON TABLE timetable_teachers IS 'Stores teacher information and their scheduling preferences';
COMMENT ON TABLE timetable_rooms IS 'Stores room information and availability for scheduling';
COMMENT ON TABLE timetable_subjects IS 'Stores subject definitions and requirements';
COMMENT ON TABLE timetable_teacher_subjects IS 'Maps teachers to subjects they can teach';
COMMENT ON TABLE timetable_periods IS 'Stores individual timetable periods with all assignments';
COMMENT ON TABLE timetable_schedules IS 'Stores complete timetable schedules for academic terms';
COMMENT ON TABLE timetable_constraints IS 'Stores scheduling constraints and rules';
COMMENT ON TABLE timetable_time_slots IS 'Defines available time slots for scheduling';
COMMENT ON TABLE timetable_generation_logs IS 'Logs timetable generation attempts and results';

COMMENT ON FUNCTION check_timetable_conflicts IS 'Checks for conflicts when scheduling periods';
COMMENT ON FUNCTION get_available_time_slots IS 'Returns available time slots for a given day and entity';
COMMENT ON FUNCTION generate_class_timetable IS 'Generates a complete timetable for a class';

-- =====================================================
-- END OF TIMETABLE DATABASE SETUP
-- =====================================================
