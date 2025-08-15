-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and basic user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(10),
    nationality VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    class_level VARCHAR(50) NOT NULL,
    stream VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'transferred')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
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

-- Student emergency contacts
CREATE TABLE IF NOT EXISTS student_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student fees
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee payments
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_fee_id UUID REFERENCES student_fees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_reference VARCHAR(255),
    payment_date DATE NOT NULL,
    received_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    class_level VARCHAR(50) NOT NULL,
    stream VARCHAR(50),
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    academic_year VARCHAR(20) NOT NULL,
    capacity INTEGER DEFAULT 40,
    current_enrollment INTEGER DEFAULT 0,
    class_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects table
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

-- Teacher subject assignments
CREATE TABLE IF NOT EXISTS teacher_subject_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(teacher_id, subject_id, class_id, academic_year, term)
);

-- Student class enrollments
CREATE TABLE IF NOT EXISTS student_class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'graduated', 'dropped')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, academic_year)
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    notes TEXT,
    marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, class_id, subject_id, attendance_date)
);

-- Examinations table
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_name VARCHAR(255) NOT NULL,
    exam_type VARCHAR(100) NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    exam_date DATE NOT NULL,
    duration_minutes INTEGER,
    total_marks INTEGER NOT NULL,
    pass_mark INTEGER,
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exam results
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    remarks TEXT,
    marked_by UUID REFERENCES teachers(id) ON DELETE SET NULL,
    marked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(examination_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_class_level ON students(class_level);
CREATE INDEX IF NOT EXISTS idx_students_subsystem ON students(subsystem);

CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teachers_status ON teachers(status);
CREATE INDEX IF NOT EXISTS idx_teachers_subsystem ON teachers(subsystem);
CREATE INDEX IF NOT EXISTS idx_teachers_email ON teachers(email);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);

CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(payment_status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON student_fees(due_date);

CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance_records(class_id);

CREATE INDEX IF NOT EXISTS idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_examination_id ON exam_results(examination_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_fees_updated_at BEFORE UPDATE ON student_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_student_class_enrollments_updated_at BEFORE UPDATE ON student_class_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examinations_updated_at BEFORE UPDATE ON examinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_results_updated_at BEFORE UPDATE ON exam_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, name, role) 
VALUES ('admin@school.edu', '$2b$10$rQZ9QmjQZ9QmjQZ9QmjQZOQmjQZ9QmjQZ9QmjQZ9QmjQZ9QmjQZ9Q', 'System Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample subjects for English subsystem
INSERT INTO subjects (subject_name, subject_code, subsystem, class_levels, is_core) VALUES
('Mathematics', 'MATH', 'english', '{"Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6", "Form 7"}', true),
('English Language', 'ENG', 'english', '{"Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6", "Form 7"}', true),
('Physics', 'PHY', 'english', '{"Form 4", "Form 5", "Form 6", "Form 7"}', false),
('Chemistry', 'CHEM', 'english', '{"Form 4", "Form 5", "Form 6", "Form 7"}', false),
('Biology', 'BIO', 'english', '{"Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6", "Form 7"}', false),
('History', 'HIST', 'english', '{"Form 1", "Form 2", "Form 3", "Form 4", "Form 5"}', false),
('Geography', 'GEO', 'english', '{"Form 1", "Form 2", "Form 3", "Form 4", "Form 5"}', false),
('Economics', 'ECON', 'english', '{"Form 4", "Form 5", "Form 6", "Form 7"}', false),
('Computer Science', 'CS', 'english', '{"Form 4", "Form 5", "Form 6", "Form 7"}', false)
ON CONFLICT (subject_code) DO NOTHING;

-- Insert sample subjects for French subsystem
INSERT INTO subjects (subject_name, subject_code, subsystem, class_levels, is_core) VALUES
('Mathématiques', 'MATH_FR', 'french', '{"6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"}', true),
('Français', 'FR', 'french', '{"6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"}', true),
('Physique', 'PHY_FR', 'french', '{"3ème", "2nde", "1ère", "Terminale"}', false),
('Chimie', 'CHEM_FR', 'french', '{"3ème", "2nde", "1ère", "Terminale"}', false),
('Sciences de la Vie et de la Terre', 'SVT', 'french', '{"6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"}', false),
('Histoire-Géographie', 'HIST_GEO', 'french', '{"6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"}', false),
('Anglais', 'ANG', 'french', '{"6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"}', true)
ON CONFLICT (subject_code) DO NOTHING;
