-- =====================================================
-- Grades and Assessments Database Schema
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Assessments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS assessments (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Assessment details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('quiz', 'test', 'exam', 'assignment', 'project', 'midterm', 'final')),
    subject VARCHAR(100) NOT NULL,
    class_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    
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
    is_graded BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (assessment_date <= due_date OR due_date IS NULL),
    CONSTRAINT valid_weight CHECK (weight_percentage > 0 AND weight_percentage <= 100)
);

-- =====================================================
-- Grades Table
-- =====================================================

CREATE TABLE IF NOT EXISTS grades (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    teacher_id UUID NOT NULL,
    
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
-- Functions for Grade Management
-- =====================================================

-- Function to generate unique assessment ID
CREATE OR REPLACE FUNCTION generate_assessment_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    counter INTEGER := 1;
    new_assessment_id VARCHAR(50);
    exists_already BOOLEAN;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    LOOP
        new_assessment_id := 'ASS' || current_year || LPAD(counter::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM assessments WHERE assessment_id = new_assessment_id) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN new_assessment_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique grade ID
CREATE OR REPLACE FUNCTION generate_grade_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    counter INTEGER := 1;
    new_grade_id VARCHAR(50);
    exists_already BOOLEAN;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    LOOP
        new_grade_id := 'GRD' || current_year || LPAD(counter::TEXT, 4, '0');
        
        SELECT EXISTS(SELECT 1 FROM grades WHERE grade_id = new_grade_id) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN new_grade_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate grade letter based on percentage
CREATE OR REPLACE FUNCTION calculate_grade_letter(percentage DECIMAL)
RETURNS VARCHAR(2) AS $$
BEGIN
    IF percentage >= 90 THEN
        RETURN 'A+';
    ELSIF percentage >= 85 THEN
        RETURN 'A';
    ELSIF percentage >= 80 THEN
        RETURN 'A-';
    ELSIF percentage >= 75 THEN
        RETURN 'B+';
    ELSIF percentage >= 70 THEN
        RETURN 'B';
    ELSIF percentage >= 65 THEN
        RETURN 'B-';
    ELSIF percentage >= 60 THEN
        RETURN 'C+';
    ELSIF percentage >= 55 THEN
        RETURN 'C';
    ELSIF percentage >= 50 THEN
        RETURN 'C-';
    ELSIF percentage >= 45 THEN
        RETURN 'D+';
    ELSIF percentage >= 40 THEN
        RETURN 'D';
    ELSIF percentage >= 35 THEN
        RETURN 'D-';
    ELSE
        RETURN 'F';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate grade point based on grade letter
CREATE OR REPLACE FUNCTION calculate_grade_point(grade_letter VARCHAR(2))
RETURNS DECIMAL(3,2) AS $$
BEGIN
    CASE grade_letter
        WHEN 'A+' THEN RETURN 4.00;
        WHEN 'A' THEN RETURN 3.75;
        WHEN 'A-' THEN RETURN 3.50;
        WHEN 'B+' THEN RETURN 3.25;
        WHEN 'B' THEN RETURN 3.00;
        WHEN 'B-' THEN RETURN 2.75;
        WHEN 'C+' THEN RETURN 2.50;
        WHEN 'C' THEN RETURN 2.25;
        WHEN 'C-' THEN RETURN 2.00;
        WHEN 'D+' THEN RETURN 1.75;
        WHEN 'D' THEN RETURN 1.50;
        WHEN 'D-' THEN RETURN 1.25;
        WHEN 'F' THEN RETURN 0.00;
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View for assessment details with statistics
CREATE OR REPLACE VIEW assessment_details_view AS
SELECT 
    a.id,
    a.assessment_id,
    a.title,
    a.description,
    a.type,
    a.subject,
    a.class_id,
    a.teacher_id,
    a.total_marks,
    a.passing_marks,
    a.weight_percentage,
    a.assessment_date,
    a.due_date,
    a.status,
    a.is_graded,
    a.created_at,
    COUNT(g.id) as total_grades,
    AVG(g.percentage) as average_percentage,
    MAX(g.percentage) as highest_percentage,
    MIN(g.percentage) as lowest_percentage
FROM assessments a
LEFT JOIN grades g ON a.id = g.assessment_id
GROUP BY a.id, a.assessment_id, a.title, a.description, a.type, a.subject, 
         a.class_id, a.teacher_id, a.total_marks, a.passing_marks, a.weight_percentage,
         a.assessment_date, a.due_date, a.status, a.is_graded, a.created_at
ORDER BY a.created_at DESC;

-- View for student grades with assessment details
CREATE OR REPLACE VIEW student_grades_view AS
SELECT 
    g.id,
    g.grade_id,
    g.student_id,
    g.assessment_id,
    a.title as assessment_title,
    a.type as assessment_type,
    a.subject,
    a.total_marks,
    g.marks_obtained,
    g.percentage,
    g.grade_letter,
    g.grade_point,
    g.remarks,
    g.feedback,
    g.is_late,
    g.is_absent,
    g.is_excused,
    a.assessment_date,
    g.submitted_at,
    g.graded_at
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
ORDER BY a.assessment_date DESC, g.submitted_at DESC;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE assessments IS 'Stores assessment information created by teachers';
COMMENT ON TABLE grades IS 'Stores individual student grades for assessments';
COMMENT ON COLUMN assessments.assessment_id IS 'Unique identifier for assessments (format: ASSYYYYNNNN)';
COMMENT ON COLUMN grades.grade_id IS 'Unique identifier for grades (format: GRDYYYYNNNN)';
