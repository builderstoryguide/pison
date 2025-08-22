-- =====================================================
-- Ensure Grades and Assessments Tables Exist
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Assessments Table
-- =====================================================

-- Drop existing table if it exists (to ensure clean schema)
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;

CREATE TABLE assessments (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Assessment details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'test', 'exam', 'assignment', 'project', 'midterm', 'final')),
    subject VARCHAR(100) NOT NULL,
    class_id VARCHAR(255) NOT NULL, -- Using VARCHAR for flexibility
    teacher_id VARCHAR(255) NOT NULL, -- Using VARCHAR for flexibility
    
    -- Assessment parameters
    total_marks DECIMAL(5,2) NOT NULL CHECK (total_marks > 0),
    passing_marks DECIMAL(5,2) DEFAULT 50.0,
    weight_percentage DECIMAL(5,2) DEFAULT 100.0,
    
    -- Dates
    assessment_date DATE NOT NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'in_progress', 'completed', 'archived')),
    is_graded BOOLEAN DEFAULT false
);

-- =====================================================
-- Grades Table
-- =====================================================

CREATE TABLE grades (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL, -- Using VARCHAR for flexibility
    teacher_id VARCHAR(255) NOT NULL, -- Using VARCHAR for flexibility
    
    -- Grade details
    marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
    percentage DECIMAL(5,2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
    grade_letter VARCHAR(2) NOT NULL,
    grade_point DECIMAL(3,2),
    
    -- Additional information
    remarks TEXT,
    feedback TEXT,
    is_late BOOLEAN DEFAULT false,
    is_absent BOOLEAN DEFAULT false,
    is_excused BOOLEAN DEFAULT false,
    
    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_student_assessment UNIQUE(student_id, assessment_id)
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Assessments indexes
CREATE INDEX IF NOT EXISTS idx_assessments_teacher_id ON assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assessments_class_id ON assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_assessments_subject ON assessments(subject);
CREATE INDEX IF NOT EXISTS idx_assessments_type ON assessments(type);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_date ON assessments(assessment_date);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_grade_letter ON grades(grade_letter);
CREATE INDEX IF NOT EXISTS idx_grades_submitted_at ON grades(submitted_at DESC);

-- =====================================================
-- Insert Sample Data for Testing
-- =====================================================

-- Insert a sample class for testing
INSERT INTO assessments (
    assessment_id,
    title,
    type,
    subject,
    class_id,
    teacher_id,
    total_marks,
    assessment_date,
    status
) VALUES (
    'ASS-TEST-001',
    'Sample Test Assessment',
    'quiz',
    'Mathematics',
    'test-class-id',
    'current-teacher-id',
    100.00,
    CURRENT_DATE,
    'draft'
) ON CONFLICT (assessment_id) DO NOTHING;

-- =====================================================
-- Verify Tables Exist
-- =====================================================

-- Check if tables exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('assessments', 'grades')
ORDER BY table_name, ordinal_position;

-- Count records in each table
SELECT 'assessments' as table_name, COUNT(*) as record_count FROM assessments
UNION ALL
SELECT 'grades' as table_name, COUNT(*) as record_count FROM grades;
