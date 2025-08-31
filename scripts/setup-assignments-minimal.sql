-- =====================================================
-- Assignments Management Database Setup
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Assignments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL CHECK (total_marks > 0),
    passing_marks DECIMAL(5,2) DEFAULT 50.0,
    weight_percentage DECIMAL(5,2) DEFAULT 100.0,
    assignment_file_url TEXT,
    assignment_file_name VARCHAR(255),
    assignment_file_size INTEGER,
    assignment_file_type VARCHAR(100),
    assigned_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    instructions TEXT,
    submission_type VARCHAR(20) DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'both')),
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Assignment Submissions Table
-- =====================================================

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(50) UNIQUE NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    submitted_text TEXT,
    submission_file_url TEXT,
    submission_file_name VARCHAR(255),
    submission_file_size INTEGER,
    submission_file_type VARCHAR(100),
    marks_obtained DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(2),
    grade_point DECIMAL(3,2),
    remarks TEXT,
    feedback TEXT,
    is_late BOOLEAN DEFAULT false,
    is_absent BOOLEAN DEFAULT false,
    is_excused BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_date ON assignments(assigned_date);

-- Assignment submissions indexes
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_teacher_id ON assignment_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON assignment_submissions(submitted_at);

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on assignments table
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on assignment_submissions table
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;

-- Assignments policies
CREATE POLICY "Teachers can view their own assignments" ON assignments
    FOR SELECT USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Teachers can create assignments" ON assignments
    FOR INSERT WITH CHECK (teacher_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Teachers can update their own assignments" ON assignments
    FOR UPDATE USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Teachers can delete their own assignments" ON assignments
    FOR DELETE USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

-- Assignment submissions policies
CREATE POLICY "Teachers can view submissions for their assignments" ON assignment_submissions
    FOR SELECT USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Students can view their own submissions" ON assignment_submissions
    FOR SELECT USING (student_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Students can create submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (student_id = auth.uid()::text OR auth.role() = 'admin');

CREATE POLICY "Teachers can update submissions for their assignments" ON assignment_submissions
    FOR UPDATE USING (teacher_id = auth.uid()::text OR auth.role() = 'admin');

-- =====================================================
-- Storage Bucket Setup (for file uploads)
-- =====================================================

-- Create storage bucket for assignments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignments',
    'assignments',
    true,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignments bucket
CREATE POLICY "Authenticated users can upload assignment files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'assignments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view assignment files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'assignments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Teachers can update assignment files" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'assignments' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Teachers can delete assignment files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'assignments' 
        AND auth.role() = 'authenticated'
    );

-- =====================================================
-- Sample Data (Optional)
-- =====================================================

-- Insert sample assignments (uncomment if needed)
/*
INSERT INTO assignments (
    assignment_id,
    title,
    description,
    subject,
    class_id,
    teacher_id,
    total_marks,
    passing_marks,
    assigned_date,
    due_date,
    status,
    submission_type
) VALUES (
    'ASS001',
    'Mathematics Assignment 1',
    'Complete exercises 1-10 from Chapter 3',
    'Mathematics',
    'Form 5A',
    'teacher-1',
    25.0,
    12.5,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'published',
    'file'
);
*/

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assignment_submissions TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- Setup Complete
-- =====================================================

-- Verify tables were created
SELECT 'Assignments table created successfully' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'assignments'
);

SELECT 'Assignment submissions table created successfully' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'assignment_submissions'
);

SELECT 'Storage bucket created successfully' as status WHERE EXISTS (
    SELECT 1 FROM storage.buckets 
    WHERE id = 'assignments'
);
