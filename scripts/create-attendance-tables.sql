-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create attendance sessions table
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID REFERENCES students(id) ON DELETE CASCADE, -- Reference to class/student for class identification
    class_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    period VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    teacher_name VARCHAR(255) NOT NULL,
    total_students INTEGER NOT NULL DEFAULT 0,
    present_count INTEGER NOT NULL DEFAULT 0,
    absent_count INTEGER NOT NULL DEFAULT 0,
    late_count INTEGER NOT NULL DEFAULT 0,
    excused_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'locked')),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    class_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    period VARCHAR(50),
    subject VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id) -- Prevent duplicate records for same student in same session
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_id ON attendance_sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_period ON attendance_sessions(period);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_subject ON attendance_sessions(subject);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_id ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);
CREATE INDEX IF NOT EXISTS idx_attendance_records_marked_by ON attendance_records(marked_by);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_date ON attendance_records(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_student ON attendance_records(session_id, student_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_attendance_sessions_updated_at 
    BEFORE UPDATE ON attendance_sessions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at 
    BEFORE UPDATE ON attendance_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update session counts when records are modified
CREATE OR REPLACE FUNCTION update_session_counts()
RETURNS TRIGGER AS $$
BEGIN
    -- Update counts in attendance_sessions table
    UPDATE attendance_sessions 
    SET 
        present_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'present'
        ),
        absent_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'absent'
        ),
        late_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'late'
        ),
        excused_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id) 
            AND status = 'excused'
        ),
        total_students = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = COALESCE(NEW.session_id, OLD.session_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to automatically update session counts
CREATE TRIGGER update_session_counts_on_insert
    AFTER INSERT ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_counts();

CREATE TRIGGER update_session_counts_on_update
    AFTER UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_counts();

CREATE TRIGGER update_session_counts_on_delete
    AFTER DELETE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_counts();

-- Create view for attendance statistics
CREATE OR REPLACE VIEW attendance_stats_view AS
SELECT 
    class_id,
    class_name,
    DATE_TRUNC('month', date) as month,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count,
    ROUND(
        (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
    ) as attendance_rate
FROM attendance_records
GROUP BY class_id, class_name, DATE_TRUNC('month', date);

-- Create view for student attendance summary
CREATE OR REPLACE VIEW student_attendance_summary_view AS
SELECT 
    student_id,
    student_name,
    class_id,
    class_name,
    COUNT(DISTINCT session_id) as total_sessions,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN status = 'excused' THEN 1 END) as excused_count,
    ROUND(
        (COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2
    ) as attendance_rate,
    MAX(CASE WHEN status = 'absent' THEN date END) as last_absent,
    CASE 
        WHEN ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) >= 95 THEN 'excellent'
        WHEN ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) >= 85 THEN 'good'
        WHEN ROUND((COUNT(CASE WHEN status = 'present' THEN 1 END)::DECIMAL / COUNT(*)::DECIMAL) * 100, 2) >= 75 THEN 'concerning'
        ELSE 'critical'
    END as status
FROM attendance_records
GROUP BY student_id, student_name, class_id, class_name;

-- Insert sample data for testing (optional)
-- Uncomment the following section if you want to insert sample data

/*
-- Sample attendance sessions
INSERT INTO attendance_sessions (class_id, class_name, date, period, subject, teacher_name, total_students, present_count, absent_count, late_count, excused_count, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Form 1A', '2024-01-15', 'Morning', 'Mathematics', 'John Smith', 25, 22, 2, 1, 0, 'completed'),
('550e8400-e29b-41d4-a716-446655440002', 'Form 2B', '2024-01-15', 'Afternoon', 'English', 'Jane Doe', 30, 28, 1, 1, 0, 'completed'),
('550e8400-e29b-41d4-a716-446655440003', 'Form 3A', '2024-01-16', 'Morning', 'Physics', 'Mike Johnson', 28, 25, 2, 1, 0, 'completed');

-- Sample attendance records
INSERT INTO attendance_records (session_id, student_id, student_name, class_id, class_name, date, status, marked_by, period, subject) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Alice Johnson', '550e8400-e29b-41d4-a716-446655440001', 'Form 1A', '2024-01-15', 'present', '550e8400-e29b-41d4-a716-446655440001', 'Morning', 'Mathematics'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Bob Smith', '550e8400-e29b-41d4-a716-446655440001', 'Form 1A', '2024-01-15', 'absent', '550e8400-e29b-41d4-a716-446655440001', 'Morning', 'Mathematics'),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'Charlie Brown', '550e8400-e29b-41d4-a716-446655440001', 'Form 1A', '2024-01-15', 'late', '550e8400-e29b-41d4-a716-446655440001', 'Morning', 'Mathematics');
*/

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_sessions TO your_app_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO your_app_user;
-- GRANT SELECT ON attendance_stats_view TO your_app_user;
-- GRANT SELECT ON student_attendance_summary_view TO your_app_user;
