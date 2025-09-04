-- Setup Class Management System
-- This script ensures all necessary tables and relationships exist for proper class management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create classes table if it doesn't exist
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) NOT NULL,
    stream VARCHAR(50) CHECK (stream IN ('grammar', 'technical', 'commercial')),
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 40 CHECK (capacity > 0 AND capacity <= 100),
    current_enrollment INTEGER DEFAULT 0 CHECK (current_enrollment >= 0),
    class_teacher_id UUID,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create class_subjects table if it doesn't exist
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_name, academic_year)
);

-- 3. Create subjects table if it doesn't exist (for reference)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_name VARCHAR(100) NOT NULL,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    class_levels TEXT[] DEFAULT '{}',
    description TEXT,
    is_core BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create teachers table if it doesn't exist (for teacher assignments)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(10) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    date_of_birth DATE,
    address TEXT,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    specialization VARCHAR(100),
    hire_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resigned', 'retired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_class_name ON classes(class_name);
CREATE INDEX IF NOT EXISTS idx_classes_class_level ON classes(class_level);
CREATE INDEX IF NOT EXISTS idx_classes_subsystem ON classes(subsystem);
CREATE INDEX IF NOT EXISTS idx_classes_stream ON classes(stream);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_name ON class_subjects(subject_name);
CREATE INDEX IF NOT EXISTS idx_class_subjects_academic_year ON class_subjects(academic_year);

CREATE INDEX IF NOT EXISTS idx_subjects_subject_name ON subjects(subject_name);
CREATE INDEX IF NOT EXISTS idx_subjects_subsystem ON subjects(subsystem);

CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_subsystem ON teachers(subsystem);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);

-- 6. Create functions to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_class_subjects_updated_at ON class_subjects;
CREATE TRIGGER update_class_subjects_updated_at 
    BEFORE UPDATE ON class_subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at 
    BEFORE UPDATE ON teachers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insert sample data for testing (if tables are empty)
INSERT INTO subjects (subject_name, subject_code, subsystem, is_core) VALUES
('Mathematics', 'MATH', 'english', true),
('English Language', 'ENG', 'english', true),
('Biology', 'BIO', 'english', false),
('Chemistry', 'CHEM', 'english', false),
('Physics', 'PHY', 'english', false),
('History', 'HIST', 'english', false),
('Geography', 'GEO', 'english', false),
('Literature', 'LIT', 'english', false),
('Economics', 'ECON', 'english', false),
('Government', 'GOVT', 'english', false),
('Religious Studies', 'REL', 'english', false),
('French', 'FRENCH', 'english', false),
('Computer Science', 'CS', 'english', false),
('Technical Drawing', 'TD', 'english', false),
('Workshop Practice', 'WP', 'english', false),
('Building Construction', 'BC', 'english', false),
('Electrical Installation', 'EI', 'english', false),
('Metal Work', 'MW', 'english', false),
('Wood Work', 'WW', 'english', false),
('Commerce', 'COMM', 'english', false),
('Accounting', 'ACC', 'english', false),
('Business Studies', 'BS', 'english', false),
('Marketing', 'MKT', 'english', false),
('Office Practice', 'OP', 'english', false),
('Computer Studies', 'CST', 'english', false),
('Statistics', 'STAT', 'english', false)
ON CONFLICT (subject_code) DO NOTHING;

-- 9. Verify the setup
SELECT 
    '✅ Setup Complete!' as status,
    (SELECT COUNT(*) FROM classes) as classes_count,
    (SELECT COUNT(*) FROM class_subjects) as class_subjects_count,
    (SELECT COUNT(*) FROM subjects) as subjects_count,
    (SELECT COUNT(*) FROM teachers) as teachers_count;

-- 10. Show table structures
SELECT 
    'Classes table structure:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 
    'Class subjects table structure:' as table_info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'class_subjects' 
AND table_schema = 'public'
ORDER BY ordinal_position;
