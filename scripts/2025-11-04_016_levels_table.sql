-- Create levels table
-- This table stores academic levels that are attached to a branch and subsystem

CREATE TABLE IF NOT EXISTS public.levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name, subsystem, branch)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_levels_subsystem ON public.levels(subsystem);
CREATE INDEX IF NOT EXISTS idx_levels_branch ON public.levels(branch);
CREATE INDEX IF NOT EXISTS idx_levels_subsystem_branch ON public.levels(subsystem, branch);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_levels_set_updated_at
    BEFORE UPDATE ON public.levels
    FOR EACH ROW
    EXECUTE FUNCTION update_levels_updated_at();

-- Enable Row Level Security
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Allow all users to read levels
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'levels' 
        AND policyname = 'levels_select_all'
    ) THEN
        CREATE POLICY levels_select_all ON public.levels FOR SELECT USING (true);
    END IF;

    -- Allow authenticated users to insert levels
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'levels' 
        AND policyname = 'levels_insert_all'
    ) THEN
        CREATE POLICY levels_insert_all ON public.levels FOR INSERT WITH CHECK (true);
    END IF;

    -- Allow authenticated users to update levels
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'levels' 
        AND policyname = 'levels_update_all'
    ) THEN
        CREATE POLICY levels_update_all ON public.levels FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    -- Allow authenticated users to delete levels
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'levels' 
        AND policyname = 'levels_delete_all'
    ) THEN
        CREATE POLICY levels_delete_all ON public.levels FOR DELETE USING (true);
    END IF;
END $$;

