-- Fix activity logs schema: rename description to details and create missing functions
-- This migration is idempotent and safe to run multiple times

-- Step 1: Rename description column to details (if it exists and details doesn't)
DO $$
BEGIN
    -- Check if description column exists and details doesn't
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs' 
        AND column_name = 'description'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs' 
        AND column_name = 'details'
    ) THEN
        ALTER TABLE public.user_activity_logs 
        RENAME COLUMN description TO details;
        
        RAISE NOTICE 'Renamed description column to details';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_activity_logs' 
        AND column_name = 'details'
    ) THEN
        RAISE NOTICE 'Details column already exists, skipping rename';
    ELSE
        RAISE NOTICE 'user_activity_logs table or description column not found';
    END IF;
END $$;

-- Step 2: Drop and recreate get_recent_activity_logs function with correct return type
-- We need to drop first because PostgreSQL doesn't allow changing return types
DROP FUNCTION IF EXISTS public.get_recent_activity_logs(INTEGER, INTEGER);

-- Create get_recent_activity_logs function with correct return type
CREATE OR REPLACE FUNCTION public.get_recent_activity_logs(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    action VARCHAR(100),
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ,
    user_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ual.id,
        ual.user_id,
        ual.action,
        ual.details,
        ual.ip_address,
        ual.user_agent,
        ual.created_at,
        u.name AS user_name
    FROM public.user_activity_logs ual
    LEFT JOIN public.users u ON ual.user_id = u.id
    ORDER BY ual.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Step 3: Create log_user_activity function
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_details TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        action,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        p_user_id,
        p_action,
        p_details,
        p_ip_address,
        p_user_agent,
        NOW()
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add helpful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at 
ON public.user_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id 
ON public.user_activity_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action 
ON public.user_activity_logs(action);

-- Grant execute permissions (adjust as needed for your RLS setup)
GRANT EXECUTE ON FUNCTION public.get_recent_activity_logs(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recent_activity_logs(INTEGER, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.log_user_activity(UUID, VARCHAR, TEXT, INET, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity(UUID, VARCHAR, TEXT, INET, TEXT) TO anon;

