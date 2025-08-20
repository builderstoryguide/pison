-- Create Classes Table for School Management System
-- This script creates the classes table with all necessary fields for class management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the classes table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_class_name ON classes(class_name);
CREATE INDEX IF NOT EXISTS idx_classes_class_level ON classes(class_level);
CREATE INDEX IF NOT EXISTS idx_classes_subsystem ON classes(subsystem);
CREATE INDEX IF NOT EXISTS idx_classes_stream ON classes(stream);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);
CREATE INDEX IF NOT EXISTS idx_classes_status ON classes(status);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to the table and columns for documentation
COMMENT ON TABLE classes IS 'Stores information about school classes';
COMMENT ON COLUMN classes.id IS 'Unique identifier for the class';
COMMENT ON COLUMN classes.class_name IS 'Name of the class (e.g., Form 1A, Terminale C)';
COMMENT ON COLUMN classes.class_level IS 'Level of the class (e.g., Form 1, Terminale)';
COMMENT ON COLUMN classes.stream IS 'Stream/branch of the class (grammar, technical, commercial)';
COMMENT ON COLUMN classes.subsystem IS 'Subsystem (english or french)';
COMMENT ON COLUMN classes.academic_year IS 'Academic year (e.g., 2024/2025)';
COMMENT ON COLUMN classes.capacity IS 'Maximum number of students allowed in the class';
COMMENT ON COLUMN classes.current_enrollment IS 'Current number of students enrolled';
COMMENT ON COLUMN classes.class_teacher_id IS 'ID of the teacher assigned to this class';
COMMENT ON COLUMN classes.status IS 'Status of the class (active or inactive)';
COMMENT ON COLUMN classes.created_at IS 'Timestamp when the class was created';
COMMENT ON COLUMN classes.updated_at IS 'Timestamp when the class was last updated';

-- Insert some sample data for testing (optional)
INSERT INTO classes (class_name, class_level, stream, subsystem, academic_year, capacity, current_enrollment, status) VALUES
('Form 1A', 'Form 1', 'grammar', 'english', '2024/2025', 40, 35, 'active'),
('Form 2B', 'Form 2', 'technical', 'english', '2024/2025', 35, 32, 'active'),
('Form 5 Science', 'Form 5', 'grammar', 'english', '2024/2025', 45, 42, 'active'),
('Terminale C', 'Terminale', 'grammar', 'french', '2024/2025', 40, 38, 'active')
ON CONFLICT DO NOTHING;

-- Create a view for easier querying of class information
CREATE OR REPLACE VIEW classes_overview AS
SELECT 
    id,
    class_name,
    class_level,
    stream,
    subsystem,
    academic_year,
    capacity,
    current_enrollment,
    CASE 
        WHEN capacity > 0 THEN ROUND((current_enrollment::DECIMAL / capacity) * 100, 2)
        ELSE 0 
    END as utilization_percentage,
    status,
    created_at,
    updated_at
FROM classes
ORDER BY created_at DESC;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON classes TO authenticated;
-- GRANT SELECT ON classes_overview TO authenticated;

-- Display table information
SELECT 
    'Classes table created successfully!' as message,
    COUNT(*) as sample_records_count
FROM classes;
