-- =====================================================
-- CREATE MISSING TIMETABLE VIEW
-- =====================================================
-- This script creates the v_class_timetables view that
-- is required by the timetable API but is missing from
-- the database, causing the 500 error.
-- =====================================================

-- Create the v_class_timetables view
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
    COALESCE(ts.name, 'TBD') as subject_name,
    COALESCE(tch.name, 'TBD') as teacher_name,
    COALESCE(tr.name, 'TBD') as room_name,
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

-- Also create the other useful views while we're at it

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
    COALESCE(ts.name, 'TBD') as subject_name,
    tc.name as class_name,
    COALESCE(tr.name, 'TBD') as room_name,
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
    COALESCE(ts.name, 'TBD') as subject_name,
    COALESCE(tch.name, 'TBD') as teacher_name,
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

-- Add comments for documentation
COMMENT ON VIEW v_class_timetables IS 'Comprehensive view of class timetables with all related information';
COMMENT ON VIEW v_teacher_timetables IS 'Comprehensive view of teacher timetables with all related information';
COMMENT ON VIEW v_room_timetables IS 'Comprehensive view of room timetables with all related information';
