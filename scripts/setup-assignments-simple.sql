-- =====================================================
-- Simple Assignments Setup Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id VARCHAR(100) UNIQUE NOT NULL,
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
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'archived')),
    is_graded BOOLEAN DEFAULT false,
    instructions TEXT,
    submission_type VARCHAR(20) DEFAULT 'file' CHECK (submission_type IN ('file', 'text', 'both')),
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0.0,
    CONSTRAINT valid_dates CHECK (assigned_date <= due_date),
    CONSTRAINT valid_weight CHECK (weight_percentage > 0 AND weight_percentage <= 100),
    CONSTRAINT valid_late_penalty CHECK (late_penalty_percentage >= 0 AND late_penalty_percentage <= 100)
);

-- Create assignment submissions table
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(100) UNIQUE NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    submitted_text TEXT,
    submission_file_url TEXT,
    submission_file_name VARCHAR(255),
    submission_file_size INTEGER,
    submission_file_type VARCHAR(100),
    marks_obtained DECIMAL(5,2) CHECK (marks_obtained >= 0),
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    grade_letter VARCHAR(2),
    grade_point DECIMAL(3,2),
    remarks TEXT,
    feedback TEXT,
    is_late BOOLEAN DEFAULT false,
    is_absent BOOLEAN DEFAULT false,
    is_excused BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'late', 'absent', 'excused')),
    CONSTRAINT unique_student_assignment UNIQUE(student_id, assignment_id),
    CONSTRAINT valid_percentage CHECK (percentage >= 0 AND percentage <= 100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject ON assignments(subject);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_teacher_id ON assignment_submissions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);

-- Insert sample assignments
INSERT INTO assignments (
    assignment_id,
    title,
    description,
    subject,
    class_id,
    teacher_id,
    total_marks,
    passing_marks,
    weight_percentage,
    assignment_file_name,
    assignment_file_type,
    assigned_date,
    due_date,
    status,
    instructions
) VALUES 
(
    'ASS001',
    'Essay on Shakespeare''s Macbeth',
    'Write a comprehensive essay analyzing the themes of ambition and power in Shakespeare''s Macbeth. Your essay should be 1500-2000 words and include proper citations.',
    'English Literature',
    'Form 5A',
    'teacher-001',
    25.0,
    12.5,
    25.0,
    'macbeth_essay_assignment.pdf',
    'application/pdf',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '14 days',
    'published',
    'Please submit your essay as a PDF or Word document. Include a bibliography and ensure proper formatting.'
),
(
    'ASS002',
    'Mathematics Problem Set - Calculus',
    'Complete the calculus problems covering derivatives and integrals. Show all your work and explain your reasoning.',
    'Mathematics',
    'Form 5A',
    'teacher-002',
    30.0,
    15.0,
    30.0,
    'calculus_problem_set.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days',
    'published',
    'Submit your solutions as a scanned PDF or typed document. Show all steps clearly.'
),
(
    'ASS003',
    'Physics Lab Report - Mechanics',
    'Write a lab report on the experiment conducted in class about Newton''s laws of motion. Include data analysis and conclusions.',
    'Physics',
    'Form 5A',
    'teacher-003',
    20.0,
    10.0,
    20.0,
    'physics_lab_report_template.pdf',
    'application/pdf',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '10 days',
    'published',
    'Follow the provided template format. Include graphs, calculations, and error analysis.'
);

-- Insert sample submissions
INSERT INTO assignment_submissions (
    submission_id,
    assignment_id,
    student_id,
    teacher_id,
    submitted_text,
    submission_file_name,
    submission_file_type,
    marks_obtained,
    percentage,
    grade_letter,
    status,
    submitted_at
) VALUES 
(
    'SUB001',
    (SELECT id FROM assignments WHERE assignment_id = 'ASS001'),
    'student-001',
    'teacher-001',
    'This is a sample essay submission text...',
    'macbeth_essay_john_doe.pdf',
    'application/pdf',
    22.0,
    88.0,
    'A',
    'graded',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'SUB002',
    (SELECT id FROM assignments WHERE assignment_id = 'ASS002'),
    'student-002',
    'teacher-002',
    NULL,
    'calculus_solutions_jane_smith.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    28.0,
    93.3,
    'A',
    'graded',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
);

-- Create storage bucket for assignments (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');

-- Success message
SELECT 'Assignments system setup completed successfully!' as status;
