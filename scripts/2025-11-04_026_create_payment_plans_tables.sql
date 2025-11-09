-- Create Payment Plans and Payment Plan Installments Tables
-- This script creates the payment_plans and payment_plan_installments tables
-- required for fee structure creation with installments
-- Run this script to set up the payment plans functionality

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PAYMENT PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_plans
CREATE INDEX IF NOT EXISTS idx_payment_plans_fee_structure_id ON public.payment_plans(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_payment_plans_status ON public.payment_plans(status);
CREATE INDEX IF NOT EXISTS idx_payment_plans_created_by ON public.payment_plans(created_by);

-- ============================================
-- 2. PAYMENT PLAN INSTALLMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_plan_installments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment_plan_installments
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_payment_plan_id ON public.payment_plan_installments(payment_plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_status ON public.payment_plan_installments(status);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_due_date ON public.payment_plan_installments(due_date);
CREATE INDEX IF NOT EXISTS idx_payment_plan_installments_payment_id ON public.payment_plan_installments(payment_id);

-- ============================================
-- 3. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create or replace the update_updated_at_column function (if not already exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to payment_plans table
DROP TRIGGER IF EXISTS update_payment_plans_updated_at ON public.payment_plans;
CREATE TRIGGER update_payment_plans_updated_at
    BEFORE UPDATE ON public.payment_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply triggers to payment_plan_installments table
DROP TRIGGER IF EXISTS update_payment_plan_installments_updated_at ON public.payment_plan_installments;
CREATE TRIGGER update_payment_plan_installments_updated_at
    BEFORE UPDATE ON public.payment_plan_installments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. VERIFICATION
-- ============================================
DO $$
DECLARE
    tables_created INTEGER := 0;
BEGIN
    -- Check payment_plans
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_plans') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ payment_plans table created';
    ELSE
        RAISE EXCEPTION 'Failed to create payment_plans table';
    END IF;
    
    -- Check payment_plan_installments
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_plan_installments') THEN
        tables_created := tables_created + 1;
        RAISE NOTICE '✓ payment_plan_installments table created';
    ELSE
        RAISE EXCEPTION 'Failed to create payment_plan_installments table';
    END IF;
    
    -- Verify columns in payment_plans
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_plans'
        AND column_name = 'fee_structure_id'
    ) THEN
        RAISE NOTICE '✓ payment_plans.fee_structure_id column exists';
    END IF;
    
    -- Verify columns in payment_plan_installments
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payment_plan_installments'
        AND column_name = 'payment_plan_id'
    ) THEN
        RAISE NOTICE '✓ payment_plan_installments.payment_plan_id column exists';
    END IF;
    
    RAISE NOTICE 'Successfully created % payment plan tables', tables_created;
END $$;

