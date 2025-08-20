-- Fix Students Table Structure
-- This script will check and add all missing columns to the students table

-- First, let's check what columns currently exist
SELECT 'CURRENT STUDENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Now add all the required columns if they don't exist
-- Basic student information
ALTER TABLE students ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT uuid_generate_v4();
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) UNIQUE NOT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NOT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NOT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE students ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Cameroonian';
ALTER TABLE students ADD COLUMN IF NOT EXISTS religion VARCHAR(100);

-- Address information
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE students ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Academic information
ALTER TABLE students ADD COLUMN IF NOT EXISTS subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS class VARCHAR(50) NOT NULL;
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255);
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_class VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS is_new_student BOOLEAN DEFAULT true;

-- Financial information
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_fees DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS paid_fees DECIMAL(10,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS fees_status VARCHAR(20) DEFAULT 'pending' CHECK (fees_status IN ('pending', 'partial', 'paid', 'overdue'));

-- Status information
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrollment_status IN ('pending', 'enrolled', 'transferred', 'graduated'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2024-2025';
ALTER TABLE students ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE;

-- Timestamps
ALTER TABLE students ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE students ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Check the final structure
SELECT 'FINAL STUDENTS TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_status ON students(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_students_fees_status ON students(fees_status);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_students_subsystem ON students(subsystem);
CREATE INDEX IF NOT EXISTS idx_students_branch ON students(branch);

-- Create trigger for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'STUDENTS TABLE FIXED SUCCESSFULLY!' as result;
