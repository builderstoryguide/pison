-- Create expenditures table
-- This script creates the expenditures table to support the Expenditure Management feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create expenditures table
CREATE TABLE IF NOT EXISTS public.expenditures (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'XOF',
    payment_method VARCHAR(50),
    payment_date DATE NOT NULL,
    vendor TEXT NOT NULL,
    vendor_contact TEXT,
    receipt_number TEXT,
    invoice_number TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    academic_year VARCHAR(20),
    term VARCHAR(20),
    department TEXT,
    budget_category VARCHAR(50),
    notes TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenditures_category ON public.expenditures(category);
CREATE INDEX IF NOT EXISTS idx_expenditures_status ON public.expenditures(status);
CREATE INDEX IF NOT EXISTS idx_expenditures_payment_date ON public.expenditures(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenditures_vendor ON public.expenditures(vendor);
CREATE INDEX IF NOT EXISTS idx_expenditures_academic_year ON public.expenditures(academic_year);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_expenditures_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_expenditures_updated_at ON public.expenditures;
CREATE TRIGGER update_expenditures_updated_at
    BEFORE UPDATE ON public.expenditures
    FOR EACH ROW
    EXECUTE FUNCTION update_expenditures_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.expenditures ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy to allow all authenticated users to view expenditures
DROP POLICY IF EXISTS "Allow authenticated users to view expenditures" ON public.expenditures;
CREATE POLICY "Allow authenticated users to view expenditures"
ON public.expenditures
FOR SELECT
TO authenticated
USING (true);

-- Policy to allow authenticated users to insert expenditures
DROP POLICY IF EXISTS "Allow authenticated users to insert expenditures" ON public.expenditures;
CREATE POLICY "Allow authenticated users to insert expenditures"
ON public.expenditures
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy to allow authenticated users to update expenditures
DROP POLICY IF EXISTS "Allow authenticated users to update expenditures" ON public.expenditures;
CREATE POLICY "Allow authenticated users to update expenditures"
ON public.expenditures
FOR UPDATE
TO authenticated
USING (true);

-- Policy to allow authenticated users to delete expenditures
DROP POLICY IF EXISTS "Allow authenticated users to delete expenditures" ON public.expenditures;
CREATE POLICY "Allow authenticated users to delete expenditures"
ON public.expenditures
FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT ALL ON public.expenditures TO authenticated;
GRANT ALL ON public.expenditures TO service_role;

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'expenditures'
    ) THEN
        RAISE NOTICE 'Expenditures table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create expenditures table';
    END IF;
END $$;
