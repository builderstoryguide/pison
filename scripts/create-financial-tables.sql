-- Financial Management Tables for School Management System
-- This script creates all necessary tables for comprehensive financial CRUD operations

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fee Structures table
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    level VARCHAR(50) NOT NULL,
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    term VARCHAR(20) NOT NULL CHECK (term IN ('first', 'second', 'third')),
    academic_year VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Fee Assignments table
CREATE TABLE IF NOT EXISTS student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    due_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, fee_structure_id, academic_year, term)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_fee_assignment_id UUID REFERENCES student_fee_assignments(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'cheque')),
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    reference_number VARCHAR(255),
    paid_by VARCHAR(255) NOT NULL,
    received_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Plans table
CREATE TABLE IF NOT EXISTS payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment Plan Installments table
CREATE TABLE IF NOT EXISTS payment_plan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_plan_id UUID REFERENCES payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Reports table
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('collection', 'outstanding', 'summary', 'analysis')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_data JSONB NOT NULL,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Categories table (for organizing different types of fees)
CREATE TABLE IF NOT EXISTS fee_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fee Structure Categories (many-to-many relationship)
CREATE TABLE IF NOT EXISTS fee_structure_categories (
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    category_id UUID REFERENCES fee_categories(id) ON DELETE CASCADE,
    PRIMARY KEY (fee_structure_id, category_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fee_structures_subsystem ON fee_structures(subsystem);
CREATE INDEX IF NOT EXISTS idx_fee_structures_level ON fee_structures(level);
CREATE INDEX IF NOT EXISTS idx_fee_structures_branch ON fee_structures(branch);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year ON fee_structures(academic_year);
CREATE INDEX IF NOT EXISTS idx_fee_structures_is_active ON fee_structures(is_active);

CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_student_id ON student_fee_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_fee_structure_id ON student_fee_assignments(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_status ON student_fee_assignments(status);
CREATE INDEX IF NOT EXISTS idx_student_fee_assignments_academic_year ON student_fee_assignments(academic_year);

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_receipt_number ON payments(receipt_number);

CREATE INDEX IF NOT EXISTS idx_payment_plans_student_id ON payment_plans(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON payment_plans(status);

CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_payment_plan_id ON payment_plan_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_status ON payment_plan_installments(status);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_due_date ON payment_plan_installments(due_date);

CREATE INDEX IF NOT EXISTS idx_financial_reports_report_type ON financial_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period_start ON financial_reports(period_start);
CREATE INDEX IF NOT EXISTS idx_financial_reports_period_end ON financial_reports(period_end);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_fee_structures_updated_at 
    BEFORE UPDATE ON fee_structures 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_fee_assignments_updated_at 
    BEFORE UPDATE ON student_fee_assignments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_plans_updated_at 
    BEFORE UPDATE ON payment_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_plan_installments_updated_at 
    BEFORE UPDATE ON payment_plan_installments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_categories_updated_at 
    BEFORE UPDATE ON fee_categories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample fee categories
INSERT INTO fee_categories (name, description) VALUES
('Tuition Fees', 'Regular academic tuition fees'),
('Registration Fees', 'Student registration and admission fees'),
('Examination Fees', 'Fees for internal and external examinations'),
('Library Fees', 'Library membership and resource fees'),
('Laboratory Fees', 'Science laboratory usage fees'),
('Sports Fees', 'Sports and physical education fees'),
('Transportation Fees', 'School transportation services'),
('Uniform Fees', 'School uniform and dress code fees'),
('Technology Fees', 'Computer lab and technology fees'),
('Miscellaneous Fees', 'Other administrative fees')
ON CONFLICT DO NOTHING;

-- Insert sample fee structures
INSERT INTO fee_structures (
    name, 
    subsystem, 
    level, 
    branch, 
    amount, 
    due_date, 
    term, 
    academic_year, 
    description, 
    is_active
) VALUES
(
    'First Term Tuition - Form 5 Science',
    'english',
    'Form 5',
    'grammar',
    75000.00,
    '2024-10-15',
    'first',
    '2024-2025',
    'First term tuition fees for Form 5 Science students',
    true
),
(
    'Second Term Tuition - Form 4 Arts',
    'english',
    'Form 4',
    'grammar',
    70000.00,
    '2025-01-15',
    'second',
    '2024-2025',
    'Second term tuition fees for Form 4 Arts students',
    true
),
(
    'Premier Trimestre - Terminale C',
    'french',
    'Terminale',
    'grammar',
    80000.00,
    '2024-10-20',
    'first',
    '2024-2025',
    'Frais de scolarité du premier trimestre pour les élèves de Terminale C',
    true
)
ON CONFLICT DO NOTHING;

-- Verify the tables were created
SELECT 'Financial tables created successfully' as status;
SELECT COUNT(*) as fee_structures_count FROM fee_structures;
SELECT COUNT(*) as fee_categories_count FROM fee_categories;
