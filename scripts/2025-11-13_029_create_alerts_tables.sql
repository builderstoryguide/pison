-- Create Alerts Management Tables
-- This script creates the alerts system for communication between school and parents
-- Run this script to set up the alerts management system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('sms', 'email', 'both')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ALERT RECIPIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.alert_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id VARCHAR(32) NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    delivery_method VARCHAR(20) NOT NULL CHECK (delivery_method IN ('sms', 'email')),
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ALERT GROUPS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.alert_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    group_type VARCHAR(20) NOT NULL CHECK (group_type IN ('class', 'grade', 'custom', 'all')),
    criteria JSONB, -- Store group criteria (e.g., class names, grade levels, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ALERT GROUP MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.alert_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.alert_groups(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
    student_id VARCHAR(32) NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(group_id, parent_id, student_id)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_alerts_created_by ON public.alerts(created_by);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON public.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_scheduled_at ON public.alerts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON public.alerts(sent_at);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_alert_id ON public.alert_recipients(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_parent_id ON public.alert_recipients(parent_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_student_id ON public.alert_recipients(student_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_delivery_status ON public.alert_recipients(delivery_status);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_read_at ON public.alert_recipients(read_at);
CREATE INDEX IF NOT EXISTS idx_alert_group_members_group_id ON public.alert_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_alert_group_members_parent_id ON public.alert_group_members(parent_id);
CREATE INDEX IF NOT EXISTS idx_alert_group_members_student_id ON public.alert_group_members(student_id);

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

-- Apply trigger to alerts table
DROP TRIGGER IF EXISTS update_alerts_updated_at ON public.alerts;
CREATE TRIGGER update_alerts_updated_at
    BEFORE UPDATE ON public.alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to alert_groups table
DROP TRIGGER IF EXISTS update_alert_groups_updated_at ON public.alert_groups;
CREATE TRIGGER update_alert_groups_updated_at
    BEFORE UPDATE ON public.alert_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_group_members ENABLE ROW LEVEL SECURITY;

-- Policies for alerts table
-- Allow authenticated users to read all alerts
CREATE POLICY "Allow authenticated users to read alerts"
    ON public.alerts
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert alerts
CREATE POLICY "Allow authenticated users to insert alerts"
    ON public.alerts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update alerts
CREATE POLICY "Allow authenticated users to update alerts"
    ON public.alerts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete alerts
CREATE POLICY "Allow authenticated users to delete alerts"
    ON public.alerts
    FOR DELETE
    TO authenticated
    USING (true);

-- Policies for alert_recipients table
-- Allow authenticated users to read alert recipients
CREATE POLICY "Allow authenticated users to read alert recipients"
    ON public.alert_recipients
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert alert recipients
CREATE POLICY "Allow authenticated users to insert alert recipients"
    ON public.alert_recipients
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update alert recipients
CREATE POLICY "Allow authenticated users to update alert recipients"
    ON public.alert_recipients
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete alert recipients
CREATE POLICY "Allow authenticated users to delete alert recipients"
    ON public.alert_recipients
    FOR DELETE
    TO authenticated
    USING (true);

-- Policies for alert_groups table
-- Allow authenticated users to read alert groups
CREATE POLICY "Allow authenticated users to read alert groups"
    ON public.alert_groups
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert alert groups
CREATE POLICY "Allow authenticated users to insert alert groups"
    ON public.alert_groups
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update alert groups
CREATE POLICY "Allow authenticated users to update alert groups"
    ON public.alert_groups
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete alert groups
CREATE POLICY "Allow authenticated users to delete alert groups"
    ON public.alert_groups
    FOR DELETE
    TO authenticated
    USING (true);

-- Policies for alert_group_members table
-- Allow authenticated users to read alert group members
CREATE POLICY "Allow authenticated users to read alert group members"
    ON public.alert_group_members
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to insert alert group members
CREATE POLICY "Allow authenticated users to insert alert group members"
    ON public.alert_group_members
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Allow authenticated users to update alert group members
CREATE POLICY "Allow authenticated users to update alert group members"
    ON public.alert_group_members
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to delete alert group members
CREATE POLICY "Allow authenticated users to delete alert group members"
    ON public.alert_group_members
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
    -- Check if alerts table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alerts'
    ) THEN
        table_created := true;
        RAISE NOTICE '✓ alerts table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create alerts table';
    END IF;
    
    -- Check if alert_recipients table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_recipients'
    ) THEN
        RAISE NOTICE '✓ alert_recipients table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create alert_recipients table';
    END IF;
    
    -- Check if alert_groups table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_groups'
    ) THEN
        RAISE NOTICE '✓ alert_groups table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create alert_groups table';
    END IF;
    
    -- Check if alert_group_members table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_group_members'
    ) THEN
        RAISE NOTICE '✓ alert_group_members table created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create alert_group_members table';
    END IF;
    
    -- Check if indexes were created
    IF EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'alerts'
    ) THEN
        RAISE NOTICE '✓ Indexes created successfully';
    END IF;
    
    -- Check if RLS is enabled
    IF EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'alerts'
        AND rowsecurity = true
    ) THEN
        RAISE NOTICE '✓ Row Level Security enabled';
    END IF;
    
    RAISE NOTICE 'Alerts tables setup completed successfully!';
END $$;

