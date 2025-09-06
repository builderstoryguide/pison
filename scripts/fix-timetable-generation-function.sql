-- =====================================================
-- FIX TIMETABLE GENERATION FUNCTION
-- =====================================================
-- This script fixes the generate_class_timetable function to:
-- 1. Handle existing schedules properly (avoid duplicate key errors)
-- 2. Support custom timetable generation parameters
-- 3. Improve error handling and logging
-- =====================================================

-- Drop and recreate the function with enhanced parameters
DROP FUNCTION IF EXISTS generate_class_timetable(UUID, VARCHAR, VARCHAR, UUID);

-- Enhanced function with custom parameters support
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
DECLARE
    v_schedule_id UUID;
    v_generation_log_id UUID;
    v_period_count INTEGER := 0;
    v_conflicts_resolved INTEGER := 0;
    v_start_time TIMESTAMP;
    v_class_name VARCHAR;
    v_current_time TIME;
    v_day_name VARCHAR;
    v_day_periods INTEGER;
    v_period_num INTEGER;
    v_days_array VARCHAR[] := ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    v_periods_array INTEGER[] := ARRAY[p_monday_periods, p_tuesday_periods, p_wednesday_periods, p_thursday_periods, p_friday_periods, p_saturday_periods];
    i INTEGER;
    j INTEGER;
BEGIN
    v_start_time := NOW();
    
    -- Get class name for logging
    SELECT name INTO v_class_name FROM timetable_classes WHERE id = p_class_id;
    
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
            -- Check if it's lunch break time
            IF p_include_lunch_break AND v_current_time >= p_lunch_break_start_time 
               AND v_current_time < (p_lunch_break_start_time + (p_lunch_break_duration || ' minutes')::INTERVAL) THEN
                
                -- Insert lunch break period
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time,
                    v_current_time + (p_lunch_break_duration || ' minutes')::INTERVAL,
                    v_period_num, 'lunch', true, 'Lunch Break'
                );
                
                v_current_time := v_current_time + (p_lunch_break_duration || ' minutes')::INTERVAL;
                v_period_num := v_period_num + 1;
                v_period_count := v_period_count + 1;
                
            -- Check if it's regular break time (every few periods)
            ELSIF v_period_num > 1 AND (v_period_num - 1) % 3 = 0 AND v_period_num <= v_day_periods THEN
                
                -- Insert break period
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time,
                    v_current_time + (p_break_duration || ' minutes')::INTERVAL,
                    v_period_num, 'break', true, 'Break'
                );
                
                v_current_time := v_current_time + (p_break_duration || ' minutes')::INTERVAL;
                v_period_num := v_period_num + 1;
                v_period_count := v_period_count + 1;
                
            ELSE
                -- Insert regular period (placeholder - will need subject/teacher assignment)
                INSERT INTO timetable_periods (
                    schedule_id, class_id, day_of_week, start_time, end_time,
                    period_number, period_type, is_break, notes
                ) VALUES (
                    v_schedule_id, p_class_id, v_day_name, v_current_time,
                    v_current_time + (p_period_duration || ' minutes')::INTERVAL,
                    v_period_num, 'regular', false, 'Regular Period - Awaiting Subject Assignment'
                );
                
                v_current_time := v_current_time + (p_period_duration || ' minutes')::INTERVAL;
                v_period_num := v_period_num + 1;
                v_period_count := v_period_count + 1;
            END IF;
            
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

-- Add comment for documentation
COMMENT ON FUNCTION generate_class_timetable IS 'Generates a timetable for a class with custom parameters, handling existing schedules properly';

-- =====================================================
-- DUPLICATE PREVENTION ENHANCEMENTS
-- =====================================================
-- Note: This function has been enhanced with the following duplicate prevention features:
-- 1. Prevents same class from being scheduled twice at the same time
-- 2. Handles existing schedules properly to avoid duplicate key errors
-- 3. Clears existing periods before regeneration to prevent conflicts
-- 4. Uses database constraints to enforce uniqueness
-- 
-- For advanced conflict checking (teacher/room conflicts), use the enhanced
-- version in enhance-timetable-duplicate-prevention.sql
-- =====================================================
