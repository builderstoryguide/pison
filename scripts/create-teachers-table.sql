-- =====================================================
-- Teachers Table Schema and Setup Script
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Teachers Table
-- =====================================================

CREATE TABLE IF NOT EXISTS teachers (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    
    -- Personal information
    title VARCHAR(20) CHECK (title IN ('Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    nationality VARCHAR(100),
    id_number VARCHAR(50),
    
    -- Address information
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Cameroon',
    
    -- Professional information
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    subjects TEXT[] DEFAULT '{}',
    classes TEXT[] DEFAULT '{}',
    qualifications TEXT[] DEFAULT '{}',
    experience TEXT,
    specialization VARCHAR(255),
    department VARCHAR(100),
    
    -- Employment details
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'temporary')),
    salary DECIMAL(10,2),
    start_date DATE,
    end_date DATE,
    contract_renewal_date DATE,
    
    -- Emergency contact
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_email VARCHAR(255),
    emergency_contact_address TEXT,
    
    -- Status and metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated', 'retired')),
    is_verified BOOLEAN DEFAULT false,
    profile_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (start_date <= end_date OR end_date IS NULL),
    CONSTRAINT valid_salary CHECK (salary >= 0 OR salary IS NULL),
    CONSTRAINT valid_phone CHECK (phone ~ '^[+]?[0-9\s\-\(\)]+$' OR phone IS NULL),
    CONSTRAINT valid_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_teachers_subsystem ON teachers(subsystem);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_employment_type ON teachers(employment_type);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_teachers_subsystem_status ON teachers(subsystem, status);
CREATE INDEX IF NOT EXISTS idx_teachers_employment_status ON teachers(employment_type, status);
CREATE INDEX IF NOT EXISTS idx_teachers_created_at ON teachers(created_at DESC);

-- Full-text search index for subjects and qualifications
CREATE INDEX IF NOT EXISTS idx_teachers_subjects_gin ON teachers USING GIN(subjects);
CREATE INDEX IF NOT EXISTS idx_teachers_qualifications_gin ON teachers USING GIN(qualifications);
CREATE INDEX IF NOT EXISTS idx_teachers_classes_gin ON teachers USING GIN(classes);

-- =====================================================
-- Triggers for Automatic Updates
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_teachers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_teachers_updated_at ON teachers;
CREATE TRIGGER trigger_update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_teachers_updated_at();

-- =====================================================
-- Functions for Teacher Management
-- =====================================================

-- Function to generate unique teacher ID
CREATE OR REPLACE FUNCTION generate_teacher_id()
RETURNS VARCHAR(50) AS $$
DECLARE
    current_year INTEGER;
    counter INTEGER := 1;
    new_teacher_id VARCHAR(50);
    exists_already BOOLEAN;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    LOOP
        new_teacher_id := 'TCH' || current_year || LPAD(counter::TEXT, 3, '0');
        
        SELECT EXISTS(SELECT 1 FROM teachers WHERE teacher_id = new_teacher_id) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN new_teacher_id;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get teacher statistics
CREATE OR REPLACE FUNCTION get_teacher_statistics()
RETURNS TABLE(
    total_teachers BIGINT,
    active_teachers BIGINT,
    english_subsystem BIGINT,
    french_subsystem BIGINT,
    full_time BIGINT,
    part_time BIGINT,
    contract_teachers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_teachers,
        COUNT(*) FILTER (WHERE status = 'active') as active_teachers,
        COUNT(*) FILTER (WHERE subsystem = 'english') as english_subsystem,
        COUNT(*) FILTER (WHERE subsystem = 'french') as french_subsystem,
        COUNT(*) FILTER (WHERE employment_type = 'full-time') as full_time,
        COUNT(*) FILTER (WHERE employment_type = 'part-time') as part_time,
        COUNT(*) FILTER (WHERE employment_type = 'contract') as contract_teachers
    FROM teachers;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Views for Common Queries
-- =====================================================

-- View for active teachers with basic info
CREATE OR REPLACE VIEW active_teachers_view AS
SELECT 
    id,
    teacher_id,
    title,
    first_name,
    last_name,
    email,
    phone,
    subsystem,
    subjects,
    classes,
    employment_type,
    status,
    created_at
FROM teachers 
WHERE status = 'active'
ORDER BY last_name, first_name;

-- View for teacher contact information
CREATE OR REPLACE VIEW teacher_contacts_view AS
SELECT 
    id,
    teacher_id,
    title || ' ' || first_name || ' ' || last_name as full_name,
    email,
    phone,
    emergency_contact_name,
    emergency_contact_phone,
    emergency_contact_email
FROM teachers
WHERE status IN ('active', 'inactive')
ORDER BY last_name, first_name;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================

-- Insert sample teachers (uncomment if needed for testing)
/*
INSERT INTO teachers (
    teacher_id, title, first_name, last_name, email, phone, 
    date_of_birth, gender, nationality, subsystem, 
    subjects, qualifications, experience, employment_type, 
    salary, start_date, status
) VALUES 
(
    'TCH2024001', 'Mr.', 'John', 'Doe', 'john.doe@school.com', '+237612345678',
    '1985-03-15', 'male', 'Cameroonian', 'english',
    ARRAY['Mathematics', 'Physics'], ARRAY['BSc Mathematics', 'PGCE'], '5 years',
    'full-time', 150000.00, '2024-01-15', 'active'
),
(
    'TCH2024002', 'Mrs.', 'Jane', 'Smith', 'jane.smith@school.com', '+237612345679',
    '1990-07-22', 'female', 'Cameroonian', 'english',
    ARRAY['English Literature', 'History'], ARRAY['BA English', 'MA Education'], '3 years',
    'full-time', 140000.00, '2024-02-01', 'active'
),
(
    'TCH2024003', 'Mr.', 'Pierre', 'Dubois', 'pierre.dubois@school.com', '+237612345680',
    '1988-11-10', 'male', 'Cameroonian', 'french',
    ARRAY['Français', 'Philosophie'], ARRAY['Licence Français', 'CAPES'], '4 years',
    'full-time', 145000.00, '2024-01-20', 'active'
);
*/

-- =====================================================
-- Permissions and Security
-- =====================================================

-- Grant permissions (adjust based on your security requirements)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON teachers TO your_app_role;
-- GRANT USAGE ON SEQUENCE teachers_id_seq TO your_app_role;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON TABLE teachers IS 'Stores comprehensive information about teachers in the school system';
COMMENT ON COLUMN teachers.teacher_id IS 'Unique identifier for teachers (format: TCHYYYYNNN)';
COMMENT ON COLUMN teachers.subsystem IS 'Educational subsystem: english or french';
COMMENT ON COLUMN teachers.subjects IS 'Array of subjects the teacher can teach';
COMMENT ON COLUMN teachers.classes IS 'Array of classes the teacher is assigned to';
COMMENT ON COLUMN teachers.qualifications IS 'Array of teacher qualifications and certifications';
COMMENT ON COLUMN teachers.status IS 'Current status: active, inactive, suspended, terminated, retired';

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify table creation
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'teachers' 
ORDER BY ordinal_position;

-- Verify indexes
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'teachers';

-- Test statistics function
-- SELECT * FROM get_teacher_statistics();
