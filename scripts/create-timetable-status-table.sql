-- =====================================================
-- TIMETABLE STATUS TRACKING TABLE
-- =====================================================
-- This script creates a dedicated table for tracking
-- timetable status and generation metadata
-- =====================================================

-- Create timetable_status table
CREATE TABLE IF NOT EXISTS timetable_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL UNIQUE REFERENCES classes(id) ON DELETE CASCADE,
    timetable_class_id UUID REFERENCES timetable_classes(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('not_generated', 'generating', 'generated', 'modified', 'error')),
    last_modified TIMESTAMPTZ,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    total_periods INTEGER DEFAULT 0,
    last_generation_time TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_timetable_status_class_id ON timetable_status(class_id);
CREATE INDEX IF NOT EXISTS idx_timetable_status_status ON timetable_status(status);
CREATE INDEX IF NOT EXISTS idx_timetable_status_updated_at ON timetable_status(updated_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timetable_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_timetable_status_updated_at
    BEFORE UPDATE ON timetable_status
    FOR EACH ROW
    EXECUTE FUNCTION update_timetable_status_updated_at();

-- Create function to get timetable status with metadata
CREATE OR REPLACE FUNCTION get_timetable_status(p_class_id UUID)
RETURNS TABLE (
    class_id UUID,
    status VARCHAR(20),
    last_modified TIMESTAMPTZ,
    generated_by UUID,
    total_periods INTEGER,
    last_generation_time TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.class_id,
        ts.status,
        ts.last_modified,
        ts.generated_by,
        ts.total_periods,
        ts.last_generation_time,
        ts.error_message,
        ts.metadata,
        ts.updated_at
    FROM timetable_status ts
    WHERE ts.class_id = p_class_id;
    
    -- If no status found, return default
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p_class_id,
            'not_generated'::VARCHAR(20),
            NULL::TIMESTAMPTZ,
            NULL::UUID,
            0::INTEGER,
            NULL::TIMESTAMPTZ,
            NULL::TEXT,
            '{}'::JSONB,
            NOW()::TIMESTAMPTZ;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timetable status
CREATE OR REPLACE FUNCTION update_timetable_status(
    p_class_id UUID,
    p_status VARCHAR(20),
    p_generated_by UUID DEFAULT NULL,
    p_total_periods INTEGER DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_status_id UUID;
    v_current_periods INTEGER;
BEGIN
    -- Get current period count if not provided
    IF p_total_periods IS NULL THEN
        SELECT COUNT(*)::INTEGER INTO v_current_periods
        FROM timetable_periods tp
        JOIN timetable_classes tc ON tp.class_id = tc.id
        WHERE tc.class_id = p_class_id;
        
        p_total_periods := COALESCE(v_current_periods, 0);
    END IF;

    -- Insert or update status
    INSERT INTO timetable_status (
        class_id,
        status,
        last_modified,
        generated_by,
        total_periods,
        last_generation_time,
        error_message,
        metadata
    ) VALUES (
        p_class_id,
        p_status,
        CASE WHEN p_status IN ('generated', 'modified') THEN NOW() ELSE NULL END,
        p_generated_by,
        p_total_periods,
        CASE WHEN p_status = 'generated' THEN NOW() ELSE NULL END,
        p_error_message,
        COALESCE(p_metadata, '{}')
    )
    ON CONFLICT (class_id) DO UPDATE SET
        status = EXCLUDED.status,
        last_modified = CASE 
            WHEN EXCLUDED.status IN ('generated', 'modified') THEN NOW() 
            ELSE timetable_status.last_modified 
        END,
        generated_by = COALESCE(EXCLUDED.generated_by, timetable_status.generated_by),
        total_periods = EXCLUDED.total_periods,
        last_generation_time = CASE 
            WHEN EXCLUDED.status = 'generated' THEN NOW() 
            ELSE timetable_status.last_generation_time 
        END,
        error_message = EXCLUDED.error_message,
        metadata = COALESCE(EXCLUDED.metadata, timetable_status.metadata),
        updated_at = NOW()
    RETURNING id INTO v_status_id;

    RETURN v_status_id;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced view that includes status information
CREATE OR REPLACE VIEW v_enhanced_class_timetables AS
SELECT
    c.id as class_id,
    c.class_name,
    c.class_level,
    c.subsystem,
    c.stream as branch,
    c.academic_year,
    COALESCE(ts.status, 'not_generated') as status,
    ts.last_modified,
    ts.generated_by,
    COALESCE(ts.total_periods, 0) as total_periods,
    ts.last_generation_time,
    ts.error_message,
    ts.metadata,
    ts.updated_at as status_updated_at,
    -- Period details
    tp.id as period_id,
    tp.day_of_week,
    tp.start_time,
    tp.end_time,
    tp.period_number,
    tp.period_type,
    tp.is_break,
    tp.notes,
    -- Related entities
    subj.name as subject_name,
    teach.name as teacher_name,
    room.name as room_name,
    room.room_type
FROM classes c
LEFT JOIN timetable_status ts ON c.id = ts.class_id
LEFT JOIN timetable_classes tc ON c.id = tc.class_id
LEFT JOIN timetable_periods tp ON tc.id = tp.class_id
LEFT JOIN timetable_subjects subj ON tp.subject_id = subj.id
LEFT JOIN timetable_teachers teach ON tp.teacher_id = teach.id
LEFT JOIN timetable_rooms room ON tp.room_id = room.id
WHERE c.status = 'active'
ORDER BY c.class_name, tp.day_of_week, tp.start_time;

-- Grant permissions
GRANT SELECT ON timetable_status TO authenticated;
GRANT INSERT, UPDATE ON timetable_status TO authenticated;
GRANT USAGE ON SEQUENCE timetable_status_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_timetable_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_timetable_status(UUID, VARCHAR, UUID, INTEGER, TEXT, JSONB) TO authenticated;
GRANT SELECT ON v_enhanced_class_timetables TO authenticated;

-- Insert initial status for existing classes without timetables
INSERT INTO timetable_status (class_id, status, total_periods)
SELECT 
    c.id,
    CASE 
        WHEN COUNT(tp.id) > 0 THEN 'generated'
        ELSE 'not_generated'
    END,
    COUNT(tp.id)::INTEGER
FROM classes c
LEFT JOIN timetable_classes tc ON c.id = tc.class_id
LEFT JOIN timetable_periods tp ON tc.id = tp.class_id
WHERE c.status = 'active'
  AND NOT EXISTS (SELECT 1 FROM timetable_status ts WHERE ts.class_id = c.id)
GROUP BY c.id
ON CONFLICT (class_id) DO NOTHING;

COMMENT ON TABLE timetable_status IS 'Tracks the status and metadata of timetable generation for each class';
COMMENT ON FUNCTION get_timetable_status(UUID) IS 'Retrieves timetable status for a given class ID';
COMMENT ON FUNCTION update_timetable_status(UUID, VARCHAR, UUID, INTEGER, TEXT, JSONB) IS 'Updates timetable status with metadata';
COMMENT ON VIEW v_enhanced_class_timetables IS 'Enhanced view of class timetables with status information';
