-- Create Class Subjects Table for School Management System
-- This script creates the class_subjects table to store the relationship between classes and subjects

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the class_subjects table
CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_id, subject_name, academic_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_name ON class_subjects(subject_name);
CREATE INDEX IF NOT EXISTS idx_class_subjects_academic_year ON class_subjects(academic_year);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_class_subjects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_class_subjects_updated_at 
    BEFORE UPDATE ON class_subjects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_class_subjects_updated_at_column();

-- Add comments to the table and columns for documentation
COMMENT ON TABLE class_subjects IS 'Stores the relationship between classes and subjects';
COMMENT ON COLUMN class_subjects.id IS 'Unique identifier for the class-subject relationship';
COMMENT ON COLUMN class_subjects.class_id IS 'ID of the class';
COMMENT ON COLUMN class_subjects.subject_name IS 'Name of the subject';
COMMENT ON COLUMN class_subjects.academic_year IS 'Academic year for this subject assignment';
COMMENT ON COLUMN class_subjects.created_at IS 'Timestamp when the relationship was created';
COMMENT ON COLUMN class_subjects.updated_at IS 'Timestamp when the relationship was last updated';

-- Display table information
SELECT 'Class subjects table created successfully!' as message;
