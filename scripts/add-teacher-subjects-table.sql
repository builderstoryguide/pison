-- =====================================================
-- Teacher Subjects Table Setup
-- =====================================================

-- Create teacher_subjects table
CREATE TABLE IF NOT EXISTS teacher_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(255) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher_id ON teacher_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject_name ON teacher_subjects(subject_name);
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_active ON teacher_subjects(is_active);

-- Enable Row Level Security
ALTER TABLE teacher_subjects ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Teachers can view their own subjects" ON teacher_subjects
    FOR SELECT USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Admins can manage all teacher subjects" ON teacher_subjects
    FOR ALL USING (auth.role() = 'admin');

-- Insert some sample data for testing
INSERT INTO teacher_subjects (teacher_id, subject_name) VALUES
    ('current-teacher-id', 'Mathematics'),
    ('current-teacher-id', 'Physics'),
    ('current-teacher-id', 'Chemistry'),
    ('current-teacher-id', 'Biology')
ON CONFLICT (teacher_id, subject_name) DO NOTHING;

-- Add comments
COMMENT ON TABLE teacher_subjects IS 'Maps teachers to subjects they are assigned to teach';
COMMENT ON COLUMN teacher_subjects.teacher_id IS 'The teacher user ID';
COMMENT ON COLUMN teacher_subjects.subject_name IS 'The name of the subject the teacher is assigned to';
COMMENT ON COLUMN teacher_subjects.is_active IS 'Whether this teacher-subject assignment is currently active';
