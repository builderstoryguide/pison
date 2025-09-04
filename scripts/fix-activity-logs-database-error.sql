-- Fix for Database View Error in Activity Logs
-- This script fixes the column type mismatch issue in get_recent_activity_logs function

-- First, check the current structure of the user_activity_logs table
DO $$
DECLARE
    col_exists BOOLEAN;
    col_name VARCHAR(64);
BEGIN
    -- Check if 'created_at' column exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_activity_logs' 
        AND column_name = 'created_at'
    ) INTO col_exists;
    
    IF col_exists THEN
        col_name := 'created_at';
        RAISE NOTICE 'Table uses created_at column';
    ELSE
        -- Check if 'timestamp' column exists
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'user_activity_logs' 
            AND column_name = 'timestamp'
        ) INTO col_exists;
        
        IF col_exists THEN
            col_name := 'timestamp';
            RAISE NOTICE 'Table uses timestamp column';
            
            -- Rename timestamp to created_at for consistency
            ALTER TABLE user_activity_logs RENAME COLUMN timestamp TO created_at;
            RAISE NOTICE 'Renamed timestamp column to created_at';
        ELSE
            RAISE EXCEPTION 'Neither created_at nor timestamp column found in user_activity_logs table';
        END IF;
    END IF;
END $$;

-- Update any indexes that might reference the old column name
DROP INDEX IF EXISTS idx_user_activity_logs_timestamp;
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);

-- Check the data type of the action column and ensure it matches the function
DO $$
DECLARE
    action_type VARCHAR(100);
BEGIN
    SELECT data_type INTO action_type
    FROM information_schema.columns
    WHERE table_name = 'user_activity_logs' 
    AND column_name = 'action';
    
    RAISE NOTICE 'Action column data type: %', action_type;
END $$;

-- Drop and recreate the get_recent_activity_logs function with proper type handling
DROP FUNCTION IF EXISTS get_recent_activity_logs(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_recent_activity_logs(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    action TEXT,  -- Changed from VARCHAR to TEXT to handle both VARCHAR and TEXT
    details TEXT,
    created_at TIMESTAMPTZ,
    user_name TEXT,
    ip_address INET,
    user_agent TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.user_id,
        al.action::TEXT,  -- Explicit cast to TEXT to handle VARCHAR/TEXT mismatch
        al.details,
        al.created_at,
        COALESCE(u.name, 'Unknown User')::TEXT as user_name,
        al.ip_address,
        al.user_agent
    FROM user_activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_recent_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity_logs TO anon;

-- Test the function to ensure it works
DO $$
DECLARE
    test_result RECORD;
BEGIN
    SELECT * INTO test_result FROM get_recent_activity_logs(1, 0) LIMIT 1;
    RAISE NOTICE 'Function test completed successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Function test failed: %', SQLERRM;
END $$;

-- Verify the fix by showing table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_activity_logs'
ORDER BY ordinal_position;

-- Final completion message
DO $$
BEGIN
    RAISE NOTICE 'Database fix completed. The get_recent_activity_logs function should now work correctly.';
END $$;
