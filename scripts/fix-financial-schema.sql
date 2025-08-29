-- Fix Financial Schema Script
-- This script fixes the financial database schema to match the current requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create payment_methods table if it doesn't exist
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to fee_structures table
DO $$
BEGIN
    -- Add class_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_structures' AND column_name = 'class_id') THEN
        ALTER TABLE fee_structures ADD COLUMN class_id UUID REFERENCES classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Remove level column if it exists (since we're using class_id now)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_structures' AND column_name = 'level') THEN
        ALTER TABLE fee_structures DROP COLUMN level;
    END IF;
END $$;

-- Add missing columns to payments table
DO $$
BEGIN
    -- Add payment_method_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method_id') THEN
        ALTER TABLE payments ADD COLUMN payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL;
    END IF;
    
    -- Add academic_year column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'academic_year') THEN
        ALTER TABLE payments ADD COLUMN academic_year VARCHAR(20);
    END IF;
    
    -- Add term column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'term') THEN
        ALTER TABLE payments ADD COLUMN term VARCHAR(20);
    END IF;
    
    -- Remove old payment_method column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_method') THEN
        ALTER TABLE payments DROP COLUMN payment_method;
    END IF;
END $$;

-- Add missing columns to fee_categories table
DO $$
BEGIN
    -- Add code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fee_categories' AND column_name = 'code') THEN
        ALTER TABLE fee_categories ADD COLUMN code VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- Create fee_structure_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS fee_structure_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
    fee_category_id UUID REFERENCES fee_categories(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    is_optional BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_code ON payment_methods(code);
CREATE INDEX IF NOT EXISTS idx_payment_methods_is_active ON payment_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_structures_class_id ON fee_structures(class_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_fee_categories_code ON fee_categories(code);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_fee_structure_id ON fee_structure_items(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_fee_structure_items_fee_category_id ON fee_structure_items(fee_category_id);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
    -- Create triggers only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_methods_updated_at') THEN
        CREATE TRIGGER update_payment_methods_updated_at 
            BEFORE UPDATE ON payment_methods 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_structures_updated_at') THEN
        CREATE TRIGGER update_fee_structures_updated_at 
            BEFORE UPDATE ON fee_structures 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payments_updated_at') THEN
        CREATE TRIGGER update_payments_updated_at 
            BEFORE UPDATE ON payments 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_categories_updated_at') THEN
        CREATE TRIGGER update_fee_categories_updated_at 
            BEFORE UPDATE ON fee_categories 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_fee_structure_items_updated_at') THEN
        CREATE TRIGGER update_fee_structure_items_updated_at 
            BEFORE UPDATE ON fee_structure_items 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert sample payment methods if they don't exist
INSERT INTO payment_methods (name, code, description) VALUES
('Cash', 'CASH', 'Cash payment'),
('Bank Transfer', 'BANK_TRANSFER', 'Bank transfer payment'),
('Mobile Money', 'MOBILE_MONEY', 'Mobile money payment (MTN, Orange, etc.)'),
('Cheque', 'CHEQUE', 'Cheque payment'),
('Credit Card', 'CREDIT_CARD', 'Credit card payment'),
('Debit Card', 'DEBIT_CARD', 'Debit card payment')
ON CONFLICT (code) DO NOTHING;

-- Insert sample fee categories if they don't exist
INSERT INTO fee_categories (name, code, description) VALUES
('Tuition Fees', 'TUITION', 'Regular academic tuition fees'),
('Registration Fees', 'REGISTRATION', 'Student registration and admission fees'),
('Examination Fees', 'EXAMINATION', 'Fees for internal and external examinations'),
('Library Fees', 'LIBRARY', 'Library membership and resource fees'),
('Laboratory Fees', 'LABORATORY', 'Science laboratory usage fees'),
('Sports Fees', 'SPORTS', 'Sports and physical education fees'),
('Transportation Fees', 'TRANSPORTATION', 'School transportation services'),
('Uniform Fees', 'UNIFORM', 'School uniform and dress code fees'),
('Technology Fees', 'TECHNOLOGY', 'Computer lab and technology fees'),
('Miscellaneous Fees', 'MISCELLANEOUS', 'Other administrative fees')
ON CONFLICT (code) DO NOTHING;

-- Update existing fee_categories to have codes if they don't have them
UPDATE fee_categories 
SET code = 'TUITION' 
WHERE name ILIKE '%tuition%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'REGISTRATION' 
WHERE name ILIKE '%registration%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'EXAMINATION' 
WHERE name ILIKE '%examination%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'LIBRARY' 
WHERE name ILIKE '%library%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'LABORATORY' 
WHERE name ILIKE '%laboratory%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'SPORTS' 
WHERE name ILIKE '%sports%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'TRANSPORTATION' 
WHERE name ILIKE '%transportation%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'UNIFORM' 
WHERE name ILIKE '%uniform%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'TECHNOLOGY' 
WHERE name ILIKE '%technology%' AND (code IS NULL OR code = '');

UPDATE fee_categories 
SET code = 'MISCELLANEOUS' 
WHERE name ILIKE '%miscellaneous%' AND (code IS NULL OR code = '');

-- Set default codes for any remaining categories without codes
UPDATE fee_categories 
SET code = 'OTHER_' || id::text 
WHERE code IS NULL OR code = '';

-- Verify the fix
SELECT 'Financial schema fix completed' as status;
SELECT COUNT(*) as payment_methods_count FROM payment_methods;
SELECT COUNT(*) as fee_categories_count FROM fee_categories;
SELECT COUNT(*) as fee_structures_count FROM fee_structures;
