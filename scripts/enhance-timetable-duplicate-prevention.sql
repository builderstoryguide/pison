-- =====================================================
-- ENHANCE TIMETABLE DUPLICATE PREVENTION
-- =====================================================
-- This script enhances the timetable system to prevent various types
-- of duplicate scheduling conflicts when generating class timetables.
-- 
-- Types of duplicates prevented:
-- 1. Same class scheduled twice at the same time
-- 2. Same teacher teaching multiple classes simultaneously
-- 3. Same room being used by multiple classes simultaneously
-- 4. Overlapping periods for the same resource
-- 5. Schedule conflicts within the same academic term
-- =====================================================

-- First, let's add additional constraints to prevent overlapping periods
-- We need to handle time ranges, not just exact start times

-- Drop existing constraints that are too simple
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS timetable_periods_class_id_day_of_week_start_time_key;
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS timetable_periods_teacher_id_day_of_week_start_time_key;
ALTER TABLE timetable_periods DROP CONSTRAINT IF EXISTS timetable_periods_room_id_day_of_week_start_time_key;

-- Add enhanced constraints that prevent overlapping periods
-- These use exclusion constraints to prevent time range overlaps

-- Install btree_gist extension for time range exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraints to prevent overlapping periods
-- Class constraint: prevent same class from having overlapping periods
ALTER TABLE timetable_periods 
ADD CONSTRAINT no_overlapping_class_periods 
EXCLUDE USING gist (
    class_id WITH =,
    day_of_week WITH =,
    tsrange(
        (CURRENT_DATE + start_time)::timestamp,
        (CURRENT_DATE + end_time)::timestamp,
        '[)'
    ) WITH &&
) WHERE (is_break = false OR period_type != 'break');

-- Teacher constraint: prevent same teacher from having overlapping periods
ALTER TABLE timetable_periods 
ADD CONSTRAINT no_overlapping_teacher_periods 
EXCLUDE USING gist (
    teacher_id WITH =,
    day_of_week WITH =,
    tsrange(
        (CURRENT_DATE + start_time)::timestamp,
        (CURRENT_DATE + end_time)::timestamp,
        '[)'
    ) WITH &&
) WHERE (teacher_id IS NOT NULL AND (is_break = false OR period_type != 'break'));

-- Room constraint: prevent same room from having overlapping periods
ALTER TABLE timetable_periods 
ADD CONSTRAINT no_overlapping_room_periods 
EXCLUDE USING gist (
    room_id WITH =,
    day_of_week WITH =,
    tsrange(
        (CURRENT_DATE + start_time)::timestamp,
        (CURRENT_DATE + end_time)::timestamp,
        '[)'
    ) WITH &&
) WHERE (room_id IS NOT NULL AND (is_break = false OR period_type != 'break'));

-- Add a function to check for scheduling conflicts before insertion
CREATE OR REPLACE FUNCTION check_timetable_conflicts(
    p_class_id UUID,
    p_teacher_id UUID,
    p_room_id UUID,
    p_day_of_week VARCHAR,
    p_start_time TIME,
    p_end_time TIME,
    p_schedule_id UUID DEFAULT NULL,
    p_exclude_period_id UUID DEFAULT NULL
)
RETURNS TABLE(
    conflict_type VARCHAR,
    conflict_description TEXT,
    conflicting_period_id UUID
) AS $$
BEGIN
    -- Check for class conflicts
    RETURN QUERY
    SELECT 
        'CLASS_CONFLICT'::VARCHAR as conflict_type,
        'Class ' || tc.name || ' already has a period scheduled from ' || 
        tp.start_time || ' to ' || tp.end_time || ' on ' || p_day_of_week as conflict_description,
        tp.id as conflicting_period_id
    FROM timetable_periods tp
    JOIN timetable_classes tc ON tp.class_id = tc.id
    WHERE tp.class_id = p_class_id
        AND tp.day_of_week = p_day_of_week
        AND tp.is_break = false
        AND (p_exclude_period_id IS NULL OR tp.id != p_exclude_period_id)
        AND (p_schedule_id IS NULL OR tp.schedule_id = p_schedule_id)
        AND (
            (tp.start_time < p_end_time AND tp.end_time > p_start_time)
        );
    
    -- Check for teacher conflicts (if teacher is assigned)
    IF p_teacher_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'TEACHER_CONFLICT'::VARCHAR as conflict_type,
            'Teacher ' || tt.name || ' is already scheduled to teach ' ||
            tc.name || ' from ' || tp.start_time || ' to ' || tp.end_time || ' on ' || p_day_of_week as conflict_description,
            tp.id as conflicting_period_id
        FROM timetable_periods tp
        JOIN timetable_teachers tt ON tp.teacher_id = tt.id
        JOIN timetable_classes tc ON tp.class_id = tc.id
        WHERE tp.teacher_id = p_teacher_id
            AND tp.day_of_week = p_day_of_week
            AND tp.is_break = false
            AND (p_exclude_period_id IS NULL OR tp.id != p_exclude_period_id)
            AND (p_schedule_id IS NULL OR tp.schedule_id = p_schedule_id)
            AND (
                (tp.start_time < p_end_time AND tp.end_time > p_start_time)
            );
    END IF;
    
    -- Check for room conflicts (if room is assigned)
    IF p_room_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            'ROOM_CONFLICT'::VARCHAR as conflict_type,
            'Room ' || tr.name || ' is already occupied by ' ||
            tc.name || ' from ' || tp.start_time || ' to ' || tp.end_time || ' on ' || p_day_of_week as conflict_description,
            tp.id as conflicting_period_id
        FROM timetable_periods tp
        JOIN timetable_rooms tr ON tp.room_id = tr.id
        JOIN timetable_classes tc ON tp.class_id = tc.id
        WHERE tp.room_id = p_room_id
            AND tp.day_of_week = p_day_of_week
            AND tp.is_break = false
            AND (p_exclude_period_id IS NULL OR tp.id != p_exclude_period_id)
            AND (p_schedule_id IS NULL OR tp.schedule_id = p_schedule_id)
            AND (
                (tp.start_time < p_end_time AND tp.end_time > p_start_time)
            );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced timetable generation function with conflict checking
CREATE OR REPLACE FUNCTION generate_class_timetable_with_conflict_check(
    p_class_id UUID,
    p_academic_year VARCHAR,
    p_term VARCHAR,
    p_generated_by UUID,
    p_school_start_time TIME DEFAULT '08:00:00',
    p_school_end_time TIME DEFAULT '15:00:00',
    p_period_duration INTEGER DEFAULT 45,
    p_break_duration INTEGER DEFAULT 15,
    p_include_lunch_break BOOLEAN DEFAULT true,
    p_lunch_break_start_time TIME DEFAULT '12:00:00',
    p_lunch_break_duration INTEGER DEFAULT 60,
    p_days_per_week INTEGER DEFAULT 5,
    p_periods_per_day INTEGER DEFAULT 8,
    p_custom_periods_per_day BOOLEAN DEFAULT false,
    p_monday_periods INTEGER DEFAULT 8,
    p_tuesday_periods INTEGER DEFAULT 8,
    p_wednesday_periods INTEGER DEFAULT 8,
    p_thursday_periods INTEGER DEFAULT 8,
    p_friday_periods INTEGER DEFAULT 8,
    p_saturday_periods INTEGER DEFAULT 0,
    p_check_conflicts BOOLEAN DEFAULT true
)
RETURNS UUID AS $$
DECLARE
    v_schedule_id UUID;
    v_generation_log_id UUID;
    v_period_count INTEGER := 0;
    v_conflicts_resolved INTEGER := 0;
    v_start_time TIMESTAMP;
    v_class_name VARCHAR;
    v_current_time TIME;
    v_end_time TIME;
    v_day_name VARCHAR;
    v_day_periods INTEGER;
    v_period_num INTEGER;
    v_days_array VARCHAR[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    v_periods_array INTEGER[] := ARRAY[p_monday_periods, p_tuesday_periods, p_wednesday_periods, p_thursday_periods, p_friday_periods, p_saturday_periods];
    v_conflict_record RECORD;
    v_has_conflicts BOOLEAN := false;
    i INTEGER;
    j INTEGER;
BEGIN
    v_start_time := NOW();
    
    -- Get class name for logging
    SELECT name INTO v_class_name FROM timetable_classes WHERE id = p_class_id;
    
    IF v_class_name IS NULL THEN
        RAISE EXCEPTION 'Class with ID % not found', p_class_id;
    END IF;
    
    -- Create generation log entry
    INSERT INTO timetable_generation_logs (generation_type, class_id, generated_by, status)
    VALUES ('automatic', p_class_id, p_generated_by, 'started')
    RETURNING id INTO v_generation_log_id;
    
    -- Check if schedule already exists for this academic year and term
    SELECT id INTO v_schedule_id
    FROM timetable_schedules
    WHERE academic_year = p_academic_year AND term = p_term;
    
    -- If schedule doesn't exist, create new one
    IF v_schedule_id IS NULL THEN
        INSERT INTO timetable_schedules (name, academic_year, term, start_date, end_date, created_by, is_active)
        VALUES (
            'Schedule for ' || p_academic_year || ' - ' || INITCAP(p_term) || ' Term',
            p_academic_year,
            p_term,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '6 months',
            p_generated_by,
            true
        )
        RETURNING id INTO v_schedule_id;
    END IF;
    
    -- Clear any existing periods for this class and schedule
    DELETE FROM timetable_periods 
    WHERE class_id = p_class_id AND schedule_id = v_schedule_id;
    
    -- Generate time slots and periods for each day
    FOR i IN 1..LEAST(p_days_per_week, 6) LOOP
        v_day_name := v_days_array[i];
        
        -- Determine periods for this day
        IF p_custom_periods_per_day THEN
            v_day_periods := v_periods_array[i];
        ELSE
            v_day_periods := p_periods_per_day;
        END IF;
        
        -- Skip if no periods for this day
        CONTINUE WHEN v_day_periods <= 0;
        
        v_current_time := p_school_start_time;
        v_period_num := 1;
        
        -- Generate periods for the day
        FOR j IN 1..v_day_periods LOOP
            -- Calculate end time for this period
            IF p_include_lunch_break AND v_current_time >= p_lunch_break_start_time 
               AND v_current_time < (p_lunch_break_start_time + (p_lunch_break_duration || ' minutes')::INTERVAL) THEN
                v_end_time := v_current_time + (p_lunch_break_duration || ' minutes')::INTERVAL;
            ELSIF v_period_num > 1 AND (v_period_num - 1) % 3 = 0 AND v_period_num <= v_day_periods THEN
                v_end_time := v_current_time + (p_break_duration || ' minutes')::INTERVAL;
            ELSE
                v_end_time := v_current_time + (p_period_duration || ' minutes')::INTERVAL;
            END IF;
            
            -- Check for conflicts if enabled
            IF p_check_conflicts THEN
                FOR v_conflict_record IN 
                    SELECT * FROM check_timetable_conflicts(
                        p_class_id, NULL, NULL, v_day_name, v_current_time, v_end_time, v_schedule_id
                    )
                LOOP
                    v_has_conflicts := true;
                    v_conflicts_resolved := v_conflicts_resolved + 1;
                    
                    -- Log the conflict
                    RAISE NOTICE 'Conflict detected: % - %', v_conflict_record.conflict_type, v_conflict_record.conflict_description;
                    
                    -- Skip this time slot and try the next available slot
                    v_current_time := v_end_time;
                    v_end_time := v_current_time + (p_period_duration || ' minutes')::INTERVAL;
                END LOOP;
            END IF;
            
            -- Insert the period based on type
            IF p_include_lunch_break AND v_current_time >= p_lunch_break_start_time 
               AND v_current_time < (p_lunch_break_start_time + (p_lunch_break_duration || ' minutes')::INTERVAL) THEN
                
                -- Insert lunch break period
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time, v_end_time,
                    v_period_num, 'lunch', true, 'Lunch Break'
                );
                
            ELSIF v_period_num > 1 AND (v_period_num - 1) % 3 = 0 AND v_period_num <= v_day_periods THEN
                
                -- Insert break period
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time, v_end_time,
                    v_period_num, 'break', true, 'Break'
                );
                
            ELSE
                -- Insert regular period
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time, v_end_time,
                    v_period_num, 'regular', false, 'Regular Period - Awaiting Subject Assignment'
                );
            END IF;
            
            v_current_time := v_end_time;
            v_period_num := v_period_num + 1;
            v_period_count := v_period_count + 1;
            
            -- Stop if we exceed school end time
            EXIT WHEN v_current_time >= p_school_end_time;
        END LOOP;
    END LOOP;
    
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
        
        -- Re-raise the exception
        RAISE EXCEPTION 'Timetable generation failed for class %: %', v_class_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Update the original function to use the new conflict-checking version
CREATE OR REPLACE FUNCTION generate_class_timetable(
    p_class_id UUID,
    p_academic_year VARCHAR,
    p_term VARCHAR,
    p_generated_by UUID,
    p_school_start_time TIME DEFAULT '08:00:00',
    p_school_end_time TIME DEFAULT '15:00:00',
    p_period_duration INTEGER DEFAULT 45,
    p_break_duration INTEGER DEFAULT 15,
    p_include_lunch_break BOOLEAN DEFAULT true,
    p_lunch_break_start_time TIME DEFAULT '12:00:00',
    p_lunch_break_duration INTEGER DEFAULT 60,
    p_days_per_week INTEGER DEFAULT 5,
    p_periods_per_day INTEGER DEFAULT 8,
    p_custom_periods_per_day BOOLEAN DEFAULT false,
    p_monday_periods INTEGER DEFAULT 8,
    p_tuesday_periods INTEGER DEFAULT 8,
    p_wednesday_periods INTEGER DEFAULT 8,
    p_thursday_periods INTEGER DEFAULT 8,
    p_friday_periods INTEGER DEFAULT 8,
    p_saturday_periods INTEGER DEFAULT 0
)
RETURNS UUID AS $$
BEGIN
    -- Call the enhanced function with conflict checking enabled
    RETURN generate_class_timetable_with_conflict_check(
        p_class_id, p_academic_year, p_term, p_generated_by,
        p_school_start_time, p_school_end_time, p_period_duration, p_break_duration,
        p_include_lunch_break, p_lunch_break_start_time, p_lunch_break_duration,
        p_days_per_week, p_periods_per_day, p_custom_periods_per_day,
        p_monday_periods, p_tuesday_periods, p_wednesday_periods,
        p_thursday_periods, p_friday_periods, p_saturday_periods,
        true -- Enable conflict checking
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION check_timetable_conflicts IS 'Checks for scheduling conflicts before inserting timetable periods';
COMMENT ON FUNCTION generate_class_timetable_with_conflict_check IS 'Enhanced timetable generation with comprehensive conflict detection and resolution';
COMMENT ON FUNCTION generate_class_timetable IS 'Main timetable generation function that prevents duplicate class scheduling';

-- Create a view to easily identify potential conflicts
CREATE OR REPLACE VIEW v_timetable_conflicts AS
SELECT DISTINCT
    tp1.id as period1_id,
    tp2.id as period2_id,
    'CLASS_OVERLAP' as conflict_type,
    tc1.name as class1_name,
    tc2.name as class2_name,
    tp1.day_of_week,
    tp1.start_time as period1_start,
    tp1.end_time as period1_end,
    tp2.start_time as period2_start,
    tp2.end_time as period2_end,
    'Classes ' || tc1.name || ' and ' || tc2.name || ' have overlapping periods on ' || tp1.day_of_week as description
FROM timetable_periods tp1
JOIN timetable_periods tp2 ON tp1.id < tp2.id
JOIN timetable_classes tc1 ON tp1.class_id = tc1.id
JOIN timetable_classes tc2 ON tp2.class_id = tc2.id
WHERE tp1.day_of_week = tp2.day_of_week
    AND tp1.is_break = false
    AND tp2.is_break = false
    AND tp1.class_id = tp2.class_id
    AND (tp1.start_time < tp2.end_time AND tp1.end_time > tp2.start_time)

UNION ALL

SELECT DISTINCT
    tp1.id as period1_id,
    tp2.id as period2_id,
    'TEACHER_OVERLAP' as conflict_type,
    tc1.name as class1_name,
    tc2.name as class2_name,
    tp1.day_of_week,
    tp1.start_time as period1_start,
    tp1.end_time as period1_end,
    tp2.start_time as period2_start,
    tp2.end_time as period2_end,
    'Teacher has overlapping periods with classes ' || tc1.name || ' and ' || tc2.name || ' on ' || tp1.day_of_week as description
FROM timetable_periods tp1
JOIN timetable_periods tp2 ON tp1.id < tp2.id
JOIN timetable_classes tc1 ON tp1.class_id = tc1.id
JOIN timetable_classes tc2 ON tp2.class_id = tc2.id
WHERE tp1.day_of_week = tp2.day_of_week
    AND tp1.is_break = false
    AND tp2.is_break = false
    AND tp1.teacher_id = tp2.teacher_id
    AND tp1.teacher_id IS NOT NULL
    AND (tp1.start_time < tp2.end_time AND tp1.end_time > tp2.start_time)

UNION ALL

SELECT DISTINCT
    tp1.id as period1_id,
    tp2.id as period2_id,
    'ROOM_OVERLAP' as conflict_type,
    tc1.name as class1_name,
    tc2.name as class2_name,
    tp1.day_of_week,
    tp1.start_time as period1_start,
    tp1.end_time as period1_end,
    tp2.start_time as period2_start,
    tp2.end_time as period2_end,
    'Room is double-booked for classes ' || tc1.name || ' and ' || tc2.name || ' on ' || tp1.day_of_week as description
FROM timetable_periods tp1
JOIN timetable_periods tp2 ON tp1.id < tp2.id
JOIN timetable_classes tc1 ON tp1.class_id = tc1.id
JOIN timetable_classes tc2 ON tp2.class_id = tc2.id
WHERE tp1.day_of_week = tp2.day_of_week
    AND tp1.is_break = false
    AND tp2.is_break = false
    AND tp1.room_id = tp2.room_id
    AND tp1.room_id IS NOT NULL
    AND (tp1.start_time < tp2.end_time AND tp1.end_time > tp2.start_time);

COMMENT ON VIEW v_timetable_conflicts IS 'View that identifies all types of scheduling conflicts in the timetable system';
