-- Database Table Check Script
-- Run this in your Supabase SQL Editor to see what tables exist

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('classes', 'teachers', 'students', 'users', 'subjects')
ORDER BY table_name;

-- Check if the teachers table exists and has data
SELECT 
    'teachers' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'teachers'

UNION ALL

SELECT 
    'classes' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'classes'

UNION ALL

SELECT 
    'students' as table_name,
    COUNT(*) as row_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'students';

-- Check foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('classes', 'teachers', 'students');

-- If teachers table doesn't exist, create it
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(100),
    id_number VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    subjects TEXT[] DEFAULT '{}',
    classes TEXT[] DEFAULT '{}',
    qualifications TEXT[] DEFAULT '{}',
    experience TEXT,
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
    salary DECIMAL(10,2),
    start_date DATE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_relationship VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some sample teachers if the table is empty
INSERT INTO teachers (teacher_id, first_name, last_name, email, subsystem, employment_type, status)
SELECT 
    'TCH001',
    'John',
    'Doe',
    'john.doe@school.com',
    'english',
    'full-time',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_id = 'TCH001');

INSERT INTO teachers (teacher_id, first_name, last_name, email, subsystem, employment_type, status)
SELECT 
    'TCH002',
    'Jane',
    'Smith',
    'jane.smith@school.com',
    'french',
    'full-time',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM teachers WHERE teacher_id = 'TCH002');

-- Enable RLS on teachers table if not already enabled
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for teachers table (drop first if they exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON teachers;
CREATE POLICY "Enable read access for all users" ON teachers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON teachers;
CREATE POLICY "Enable insert for authenticated users" ON teachers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON teachers;
CREATE POLICY "Enable update for authenticated users" ON teachers
    FOR UPDATE USING (true);

-- Check if classes table has the correct foreign key
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name = 'class_teacher_id';

-- If class_teacher_id column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'class_teacher_id'
    ) THEN
        ALTER TABLE classes ADD COLUMN class_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL;
    END IF;
END $$;
