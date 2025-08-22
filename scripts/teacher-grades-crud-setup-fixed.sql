-- =====================================================
-- Teacher Grades CRUD Operations Database Setup (FIXED)
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Drop existing objects (if they exist)
-- =====================================================

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
DROP TRIGGER IF EXISTS update_grades_updated_at ON grades;
DROP FUNCTION IF EXISTS update_assessments_updated_at();
DROP FUNCTION IF EXISTS update_grades_updated_at();
DROP FUNCTION IF EXISTS generate_assessment_id();
DROP FUNCTION IF EXISTS generate_grade_id();
DROP FUNCTION IF EXISTS calculate_grade_letter(DECIMAL);
DROP FUNCTION IF EXISTS calculate_grade_point(VARCHAR(2));
DROP FUNCTION IF EXISTS validate_assessment_data();
DROP FUNCTION IF EXISTS validate_grade_data();
DROP VIEW IF EXISTS assessment_details_view;
DROP VIEW IF EXISTS student_grades_view;
DROP VIEW IF EXISTS teacher_assessments_view;

-- =====================================================
-- Assessments Table (if not exists)
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
    class_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to match existing schema
    teacher_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to match existing schema
    
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
-- Grades Table (if not exists)
-- =====================================================

CREATE TABLE IF NOT EXISTS grades (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to match existing schema
    teacher_id VARCHAR(255) NOT NULL, -- Changed to VARCHAR to match existing schema
    
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
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);

-- Grades indexes
CREATE INDEX IF NOT EXISTS idx_grades_assessment_id ON grades(assessment_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_grade_letter ON grades(grade_letter);
CREATE INDEX IF NOT EXISTS idx_grades_submitted_at ON grades(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_grades_created_at ON grades(created_at DESC);

-- =====================================================
-- Utility Functions for CRUD Operations
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
        RETURN 'A';
    ELSIF percentage >= 80 THEN
        RETURN 'B';
    ELSIF percentage >= 70 THEN
        RETURN 'C';
    ELSIF percentage >= 60 THEN
        RETURN 'D';
    ELSIF percentage >= 50 THEN
        RETURN 'E';
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
        WHEN 'A' THEN RETURN 4.00;
        WHEN 'B' THEN RETURN 3.00;
        WHEN 'C' THEN RETURN 2.00;
        WHEN 'D' THEN RETURN 1.00;
        WHEN 'E' THEN RETURN 0.50;
        WHEN 'F' THEN RETURN 0.00;
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate assessment data
CREATE OR REPLACE FUNCTION validate_assessment_data(
    p_title VARCHAR(255),
    p_type VARCHAR(20),
    p_subject VARCHAR(100),
    p_class_id VARCHAR(255),
    p_teacher_id VARCHAR(255),
    p_total_marks DECIMAL(5,2),
    p_assessment_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check required fields
    IF p_title IS NULL OR p_title = '' THEN
        RAISE EXCEPTION 'Assessment title is required';
    END IF;
    
    IF p_type IS NULL OR p_type NOT IN ('quiz', 'test', 'exam', 'assignment', 'project', 'midterm', 'final') THEN
        RAISE EXCEPTION 'Invalid assessment type';
    END IF;
    
    IF p_subject IS NULL OR p_subject = '' THEN
        RAISE EXCEPTION 'Subject is required';
    END IF;
    
    IF p_class_id IS NULL OR p_class_id = '' THEN
        RAISE EXCEPTION 'Class ID is required';
    END IF;
    
    IF p_teacher_id IS NULL OR p_teacher_id = '' THEN
        RAISE EXCEPTION 'Teacher ID is required';
    END IF;
    
    IF p_total_marks IS NULL OR p_total_marks <= 0 THEN
        RAISE EXCEPTION 'Total marks must be greater than 0';
    END IF;
    
    IF p_assessment_date IS NULL THEN
        RAISE EXCEPTION 'Assessment date is required';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to validate grade data
CREATE OR REPLACE FUNCTION validate_grade_data(
    p_assessment_id UUID,
    p_student_id VARCHAR(255),
    p_teacher_id VARCHAR(255),
    p_marks_obtained DECIMAL(5,2),
    p_total_marks DECIMAL(5,2)
)
RETURNS BOOLEAN AS $$
DECLARE
    assessment_exists BOOLEAN;
BEGIN
    -- Check if assessment exists
    SELECT EXISTS(SELECT 1 FROM assessments WHERE id = p_assessment_id) INTO assessment_exists;
    IF NOT assessment_exists THEN
        RAISE EXCEPTION 'Assessment does not exist';
    END IF;
    
    -- Check required fields
    IF p_student_id IS NULL OR p_student_id = '' THEN
        RAISE EXCEPTION 'Student ID is required';
    END IF;
    
    IF p_teacher_id IS NULL OR p_teacher_id = '' THEN
        RAISE EXCEPTION 'Teacher ID is required';
    END IF;
    
    IF p_marks_obtained IS NULL OR p_marks_obtained < 0 THEN
        RAISE EXCEPTION 'Marks obtained cannot be negative';
    END IF;
    
    IF p_marks_obtained > p_total_marks THEN
        RAISE EXCEPTION 'Marks obtained cannot exceed total marks';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CRUD Operations Functions (FIXED)
-- =====================================================

-- CREATE Assessment (FIXED - reordered parameters)
CREATE OR REPLACE FUNCTION create_assessment(
    p_title VARCHAR(255),
    p_type VARCHAR(20),
    p_subject VARCHAR(100),
    p_class_id VARCHAR(255),
    p_teacher_id VARCHAR(255),
    p_total_marks DECIMAL(5,2),
    p_assessment_date DATE,
    p_description TEXT DEFAULT NULL,
    p_passing_marks DECIMAL(5,2) DEFAULT 50.0,
    p_weight_percentage DECIMAL(5,2) DEFAULT 100.0,
    p_due_date DATE DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT 'draft'
)
RETURNS UUID AS $$
DECLARE
    new_assessment_id VARCHAR(50);
    new_id UUID;
BEGIN
    -- Validate input data
    PERFORM validate_assessment_data(p_title, p_type, p_subject, p_class_id, p_teacher_id, p_total_marks, p_assessment_date);
    
    -- Generate assessment ID
    SELECT generate_assessment_id() INTO new_assessment_id;
    
    -- Insert assessment
    INSERT INTO assessments (
        assessment_id,
        title,
        description,
        type,
        subject,
        class_id,
        teacher_id,
        total_marks,
        passing_marks,
        weight_percentage,
        assessment_date,
        due_date,
        status
    ) VALUES (
        new_assessment_id,
        p_title,
        p_description,
        p_type,
        p_subject,
        p_class_id,
        p_teacher_id,
        p_total_marks,
        p_passing_marks,
        p_weight_percentage,
        p_assessment_date,
        p_due_date,
        p_status
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- READ Assessment by ID
CREATE OR REPLACE FUNCTION get_assessment_by_id(p_id UUID)
RETURNS TABLE (
    id UUID,
    assessment_id VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(20),
    subject VARCHAR(100),
    class_id VARCHAR(255),
    teacher_id VARCHAR(255),
    total_marks DECIMAL(5,2),
    passing_marks DECIMAL(5,2),
    weight_percentage DECIMAL(5,2),
    assessment_date DATE,
    due_date DATE,
    status VARCHAR(20),
    is_graded BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
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
        a.updated_at
    FROM assessments a
    WHERE a.id = p_id;
END;
$$ LANGUAGE plpgsql;

-- READ Assessments by Teacher
CREATE OR REPLACE FUNCTION get_assessments_by_teacher(p_teacher_id VARCHAR(255))
RETURNS TABLE (
    id UUID,
    assessment_id VARCHAR(50),
    title VARCHAR(255),
    description TEXT,
    type VARCHAR(20),
    subject VARCHAR(100),
    class_id VARCHAR(255),
    teacher_id VARCHAR(255),
    total_marks DECIMAL(5,2),
    passing_marks DECIMAL(5,2),
    weight_percentage DECIMAL(5,2),
    assessment_date DATE,
    due_date DATE,
    status VARCHAR(20),
    is_graded BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
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
        a.updated_at
    FROM assessments a
    WHERE a.teacher_id = p_teacher_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- UPDATE Assessment
CREATE OR REPLACE FUNCTION update_assessment(
    p_id UUID,
    p_title VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_type VARCHAR(20) DEFAULT NULL,
    p_subject VARCHAR(100) DEFAULT NULL,
    p_total_marks DECIMAL(5,2) DEFAULT NULL,
    p_passing_marks DECIMAL(5,2) DEFAULT NULL,
    p_weight_percentage DECIMAL(5,2) DEFAULT NULL,
    p_assessment_date DATE DEFAULT NULL,
    p_due_date DATE DEFAULT NULL,
    p_status VARCHAR(20) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    assessment_exists BOOLEAN;
BEGIN
    -- Check if assessment exists
    SELECT EXISTS(SELECT 1 FROM assessments WHERE id = p_id) INTO assessment_exists;
    IF NOT assessment_exists THEN
        RAISE EXCEPTION 'Assessment not found';
    END IF;
    
    -- Update assessment
    UPDATE assessments SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        type = COALESCE(p_type, type),
        subject = COALESCE(p_subject, subject),
        total_marks = COALESCE(p_total_marks, total_marks),
        passing_marks = COALESCE(p_passing_marks, passing_marks),
        weight_percentage = COALESCE(p_weight_percentage, weight_percentage),
        assessment_date = COALESCE(p_assessment_date, assessment_date),
        due_date = COALESCE(p_due_date, due_date),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- DELETE Assessment
CREATE OR REPLACE FUNCTION delete_assessment(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    assessment_exists BOOLEAN;
BEGIN
    -- Check if assessment exists
    SELECT EXISTS(SELECT 1 FROM assessments WHERE id = p_id) INTO assessment_exists;
    IF NOT assessment_exists THEN
        RAISE EXCEPTION 'Assessment not found';
    END IF;
    
    -- Delete assessment (grades will be deleted automatically due to CASCADE)
    DELETE FROM assessments WHERE id = p_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- CREATE Grade (FIXED - reordered parameters)
CREATE OR REPLACE FUNCTION create_grade(
    p_assessment_id UUID,
    p_student_id VARCHAR(255),
    p_teacher_id VARCHAR(255),
    p_marks_obtained DECIMAL(5,2),
    p_remarks TEXT DEFAULT NULL,
    p_feedback TEXT DEFAULT NULL,
    p_is_late BOOLEAN DEFAULT false,
    p_is_absent BOOLEAN DEFAULT false,
    p_is_excused BOOLEAN DEFAULT false
)
RETURNS UUID AS $$
DECLARE
    new_grade_id VARCHAR(50);
    new_id UUID;
    total_marks DECIMAL(5,2);
    percentage DECIMAL(5,2);
    grade_letter VARCHAR(2);
    grade_point DECIMAL(3,2);
BEGIN
    -- Get total marks from assessment
    SELECT a.total_marks INTO total_marks FROM assessments a WHERE a.id = p_assessment_id;
    
    -- Validate grade data
    PERFORM validate_grade_data(p_assessment_id, p_student_id, p_teacher_id, p_marks_obtained, total_marks);
    
    -- Calculate percentage and grade
    percentage := (p_marks_obtained / total_marks) * 100;
    grade_letter := calculate_grade_letter(percentage);
    grade_point := calculate_grade_point(grade_letter);
    
    -- Generate grade ID
    SELECT generate_grade_id() INTO new_grade_id;
    
    -- Insert grade
    INSERT INTO grades (
        grade_id,
        assessment_id,
        student_id,
        teacher_id,
        marks_obtained,
        percentage,
        grade_letter,
        grade_point,
        remarks,
        feedback,
        is_late,
        is_absent,
        is_excused
    ) VALUES (
        new_grade_id,
        p_assessment_id,
        p_student_id,
        p_teacher_id,
        p_marks_obtained,
        percentage,
        grade_letter,
        grade_point,
        p_remarks,
        p_feedback,
        p_is_late,
        p_is_absent,
        p_is_excused
    ) RETURNING id INTO new_id;
    
    -- Update assessment is_graded status
    UPDATE assessments SET is_graded = true WHERE id = p_assessment_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- READ Grades by Assessment
CREATE OR REPLACE FUNCTION get_grades_by_assessment(p_assessment_id UUID)
RETURNS TABLE (
    id UUID,
    grade_id VARCHAR(50),
    assessment_id UUID,
    student_id VARCHAR(255),
    teacher_id VARCHAR(255),
    marks_obtained DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(2),
    grade_point DECIMAL(3,2),
    remarks TEXT,
    feedback TEXT,
    is_late BOOLEAN,
    is_absent BOOLEAN,
    is_excused BOOLEAN,
    submitted_at TIMESTAMP WITH TIME ZONE,
    graded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.grade_id,
        g.assessment_id,
        g.student_id,
        g.teacher_id,
        g.marks_obtained,
        g.percentage,
        g.grade_letter,
        g.grade_point,
        g.remarks,
        g.feedback,
        g.is_late,
        g.is_absent,
        g.is_excused,
        g.submitted_at,
        g.graded_at,
        g.created_at,
        g.updated_at
    FROM grades g
    WHERE g.assessment_id = p_assessment_id
    ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- UPDATE Grade
CREATE OR REPLACE FUNCTION update_grade(
    p_id UUID,
    p_marks_obtained DECIMAL(5,2) DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL,
    p_feedback TEXT DEFAULT NULL,
    p_is_late BOOLEAN DEFAULT NULL,
    p_is_absent BOOLEAN DEFAULT NULL,
    p_is_excused BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    grade_exists BOOLEAN;
    current_marks DECIMAL(5,2);
    total_marks DECIMAL(5,2);
    new_percentage DECIMAL(5,2);
    new_grade_letter VARCHAR(2);
    new_grade_point DECIMAL(3,2);
    assessment_id UUID;
BEGIN
    -- Check if grade exists and get current data
    SELECT EXISTS(SELECT 1 FROM grades WHERE id = p_id) INTO grade_exists;
    IF NOT grade_exists THEN
        RAISE EXCEPTION 'Grade not found';
    END IF;
    
    -- Get current marks and assessment info
    SELECT g.marks_obtained, g.assessment_id, a.total_marks 
    INTO current_marks, assessment_id, total_marks
    FROM grades g
    JOIN assessments a ON g.assessment_id = a.id
    WHERE g.id = p_id;
    
    -- If marks are being updated, recalculate percentage and grade
    IF p_marks_obtained IS NOT NULL AND p_marks_obtained != current_marks THEN
        new_percentage := (p_marks_obtained / total_marks) * 100;
        new_grade_letter := calculate_grade_letter(new_percentage);
        new_grade_point := calculate_grade_point(new_grade_letter);
        
        -- Update grade with new calculations
        UPDATE grades SET
            marks_obtained = p_marks_obtained,
            percentage = new_percentage,
            grade_letter = new_grade_letter,
            grade_point = new_grade_point,
            remarks = COALESCE(p_remarks, remarks),
            feedback = COALESCE(p_feedback, feedback),
            is_late = COALESCE(p_is_late, is_late),
            is_absent = COALESCE(p_is_absent, is_absent),
            is_excused = COALESCE(p_is_excused, is_excused),
            updated_at = NOW()
        WHERE id = p_id;
    ELSE
        -- Update other fields only
        UPDATE grades SET
            remarks = COALESCE(p_remarks, remarks),
            feedback = COALESCE(p_feedback, feedback),
            is_late = COALESCE(p_is_late, is_late),
            is_absent = COALESCE(p_is_absent, is_absent),
            is_excused = COALESCE(p_is_excused, is_excused),
            updated_at = NOW()
        WHERE id = p_id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- DELETE Grade
CREATE OR REPLACE FUNCTION delete_grade(p_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    grade_exists BOOLEAN;
    assessment_id UUID;
BEGIN
    -- Check if grade exists
    SELECT EXISTS(SELECT 1 FROM grades WHERE id = p_id) INTO grade_exists;
    IF NOT grade_exists THEN
        RAISE EXCEPTION 'Grade not found';
    END IF;
    
    -- Get assessment ID before deleting
    SELECT g.assessment_id INTO assessment_id FROM grades g WHERE g.id = p_id;
    
    -- Delete grade
    DELETE FROM grades WHERE id = p_id;
    
    -- Check if assessment has any remaining grades
    IF NOT EXISTS(SELECT 1 FROM grades WHERE assessment_id = assessment_id) THEN
        UPDATE assessments SET is_graded = false WHERE id = assessment_id;
    END IF;
    
    RETURN TRUE;
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
    MIN(g.percentage) as lowest_percentage,
    COUNT(CASE WHEN g.percentage >= a.passing_marks THEN 1 END) as pass_count,
    COUNT(CASE WHEN g.percentage < a.passing_marks THEN 1 END) as fail_count
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

-- View for teacher assessments with grade statistics
CREATE OR REPLACE VIEW teacher_assessments_view AS
SELECT 
    a.id,
    a.assessment_id,
    a.title,
    a.type,
    a.subject,
    a.class_id,
    a.teacher_id,
    a.total_marks,
    a.assessment_date,
    a.status,
    a.is_graded,
    a.created_at,
    COUNT(g.id) as graded_count,
    AVG(g.percentage) as average_percentage,
    MAX(g.percentage) as highest_percentage,
    MIN(g.percentage) as lowest_percentage
FROM assessments a
LEFT JOIN grades g ON a.id = g.assessment_id
GROUP BY a.id, a.assessment_id, a.title, a.type, a.subject, a.class_id, 
         a.teacher_id, a.total_marks, a.assessment_date, a.status, a.is_graded, a.created_at
ORDER BY a.created_at DESC;

-- =====================================================
-- Triggers for Automatic Updates
-- =====================================================

-- Function to update assessments updated_at timestamp
CREATE OR REPLACE FUNCTION update_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update grades updated_at timestamp
CREATE OR REPLACE FUNCTION update_grades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_assessments_updated_at();

CREATE TRIGGER update_grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_grades_updated_at();

-- =====================================================
-- Sample Data for Testing
-- =====================================================

-- Insert sample assessments
INSERT INTO assessments (
    assessment_id,
    title,
    description,
    type,
    subject,
    class_id,
    teacher_id,
    total_marks,
    assessment_date,
    status
) VALUES 
(
    'ASS20240001',
    'Mathematics Quiz 1',
    'Basic algebra and arithmetic operations',
    'quiz',
    'Mathematics',
    'class-1',
    'teacher-1',
    20.00,
    CURRENT_DATE - INTERVAL '5 days',
    'completed'
),
(
    'ASS20240002',
    'Physics Midterm',
    'Mechanics and thermodynamics',
    'midterm',
    'Physics',
    'class-2',
    'teacher-1',
    50.00,
    CURRENT_DATE - INTERVAL '10 days',
    'completed'
),
(
    'ASS20240003',
    'English Essay',
    'Creative writing assignment',
    'assignment',
    'English',
    'class-1',
    'teacher-2',
    25.00,
    CURRENT_DATE + INTERVAL '5 days',
    'draft'
);

-- Insert sample grades
INSERT INTO grades (
    grade_id,
    assessment_id,
    student_id,
    teacher_id,
    marks_obtained,
    percentage,
    grade_letter,
    grade_point,
    remarks
) VALUES 
(
    'GRD20240001',
    (SELECT id FROM assessments WHERE assessment_id = 'ASS20240001'),
    'student-1',
    'teacher-1',
    18.00,
    90.00,
    'A',
    4.00,
    'Excellent work!'
),
(
    'GRD20240002',
    (SELECT id FROM assessments WHERE assessment_id = 'ASS20240001'),
    'student-2',
    'teacher-1',
    15.00,
    75.00,
    'B',
    3.00,
    'Good effort'
),
(
    'GRD20240003',
    (SELECT id FROM assessments WHERE assessment_id = 'ASS20240002'),
    'student-1',
    'teacher-1',
    42.00,
    84.00,
    'A',
    4.00,
    'Very good understanding'
);

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify tables were created
SELECT 'assessments' as table_name, COUNT(*) as record_count FROM assessments
UNION ALL
SELECT 'grades' as table_name, COUNT(*) as record_count FROM grades;

-- Verify functions were created
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%assessment%' OR routine_name LIKE '%grade%'
ORDER BY routine_name;

-- Verify views were created
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%assessment%' OR table_name LIKE '%grade%'
ORDER BY table_name;

-- Test CRUD operations
SELECT 'Testing CREATE Assessment' as test;
SELECT create_assessment(
    'Test Assessment'::VARCHAR(255),
    'quiz'::VARCHAR(20),
    'Test Subject'::VARCHAR(100),
    'test-class'::VARCHAR(255),
    'test-teacher'::VARCHAR(255),
    25.00::DECIMAL(5,2),
    CURRENT_DATE::DATE,
    'Test Description'::TEXT,
    50.00::DECIMAL(5,2),
    100.00::DECIMAL(5,2),
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    'draft'::VARCHAR(20)
) as new_assessment_id;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE assessments IS 'Stores assessment information created by teachers';
COMMENT ON TABLE grades IS 'Stores individual student grades for assessments';
COMMENT ON COLUMN assessments.assessment_id IS 'Unique identifier for assessments (format: ASSYYYYNNNN)';
COMMENT ON COLUMN grades.grade_id IS 'Unique identifier for grades (format: GRDYYYYNNNN)';
COMMENT ON FUNCTION create_assessment IS 'Creates a new assessment with validation';
COMMENT ON FUNCTION create_grade IS 'Creates a new grade with automatic calculations';
COMMENT ON FUNCTION update_assessment IS 'Updates assessment details';
COMMENT ON FUNCTION update_grade IS 'Updates grade details with recalculation';
COMMENT ON FUNCTION delete_assessment IS 'Deletes assessment and all associated grades';
COMMENT ON FUNCTION delete_grade IS 'Deletes individual grade';
