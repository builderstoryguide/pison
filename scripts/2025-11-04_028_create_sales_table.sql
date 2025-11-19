-- Create Sales Management Table
-- This script creates the sales table for managing school item sales (uniforms, sportswear, etc.)
-- Run this script to set up the sales management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales (
    id VARCHAR(50) PRIMARY KEY,  -- Increased from 20 to 50 to accommodate UUID-based IDs
    student_id VARCHAR(50) NOT NULL,  -- Increased from 20 to 50 for consistency
    student_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('pullover', 'sport_wear', 'uniform', 't_shirt')),
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
    notes TEXT,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_student_id ON public.sales(student_id);
CREATE INDEX IF NOT EXISTS idx_sales_item_type ON public.sales(item_type);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to sales table
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on sales table
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all sales
CREATE POLICY "Allow authenticated users to read sales"
    ON public.sales
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert sales
CREATE POLICY "Allow authenticated users to insert sales"
    ON public.sales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update sales
CREATE POLICY "Allow authenticated users to update sales"
    ON public.sales
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete sales
CREATE POLICY "Allow authenticated users to delete sales"
    ON public.sales
    FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    table_created BOOLEAN := false;
BEGIN
    -- Check if sales table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sales'
    ) THEN
        table_created := true;
        RAISE NOTICE '✓ sales table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create sales table';
    END IF;
    
    -- Check if indexes were created
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'sales'
    ) THEN
        RAISE NOTICE '✓ Indexes created successfully';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'sales'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✓ Row Level Security enabled';
    END IF;
    
    RAISE NOTICE 'Sales table setup completed successfully!';
END $$;

