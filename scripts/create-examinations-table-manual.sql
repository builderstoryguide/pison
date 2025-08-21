-- Manual SQL script to create examinations table
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create comprehensive examinations table
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'external', 'mock', 'continuous_assessment')),
    exam_board VARCHAR(255) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    level VARCHAR(50) NOT NULL,
    subjects TEXT[] NOT NULL, -- Array of subject names
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    venue VARCHAR(255) NOT NULL,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
    enrolled_students INTEGER DEFAULT 0,
    completed_students INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exam results table
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    remarks TEXT,
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(examination_id, student_id, subject)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_examinations_subsystem ON examinations(subsystem);
CREATE INDEX IF NOT EXISTS idx_examinations_branch ON examinations(branch);
CREATE INDEX IF NOT EXISTS idx_examinations_type ON examinations(type);
CREATE INDEX IF NOT EXISTS idx_examinations_status ON examinations(status);
CREATE INDEX IF NOT EXISTS idx_examinations_start_date ON examinations(start_date);
CREATE INDEX IF NOT EXISTS idx_examinations_end_date ON examinations(end_date);

CREATE INDEX IF NOT EXISTS idx_exam_results_examination_id ON exam_results(examination_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_subject ON exam_results(subject);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_examinations_updated_at 
    BEFORE UPDATE ON examinations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_results_updated_at 
    BEFORE UPDATE ON exam_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;

-- Insert a test record to verify the table works
INSERT INTO examinations (
    title,
    type,
    exam_board,
    subsystem,
    branch,
    level,
    subjects,
    start_date,
    end_date,
    duration,
    total_marks,
    passing_marks,
    venue,
    instructions,
    status
) VALUES (
    'Test Examination',
    'internal',
    'Test Board',
    'english',
    'grammar',
    'Form 5',
    ARRAY['Mathematics', 'English'],
    '2024-01-01',
    '2024-01-02',
    120,
    100,
    50,
    'Test Venue',
    'Test instructions',
    'draft'
) ON CONFLICT DO NOTHING;

-- Verify the table was created
SELECT 'Examinations table created successfully' as status;
SELECT COUNT(*) as examination_count FROM examinations;
