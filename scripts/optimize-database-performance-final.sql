-- Database Performance Optimization Script (Final Fixed Version)
-- Run this script in your Supabase SQL Editor to improve query performance

-- 1. Add indexes to user_activity_logs table for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_action ON user_activity_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at_action ON user_activity_logs(created_at DESC, action);

-- 2. Add indexes to users table
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);

-- 3. Add indexes to user_profiles table (only if the table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_role_specific_id ON user_profiles(role_specific_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_subsystem ON user_profiles(subsystem);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);
    END IF;
END $$;

-- 4. Optimize the user_details view with better indexing (only if user_profiles exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Drop and recreate the view with optimized structure
        DROP VIEW IF EXISTS user_details;

        CREATE OR REPLACE VIEW user_details AS
        SELECT
            u.id,
            u.email,
            u.name,
            u.role,
            u.status,
            u.avatar_url,
            u.phone,
            u.address,
            u.date_of_birth,
            u.gender,
            u.permissions,
            u.has_default_password,
            u.password_last_changed,
            u.password_expiry_date,
            u.last_login,
            u.created_at,
            u.updated_at,
            u.created_by,
            up.role_specific_id,
            up.subsystem,
            up.branch,
            up.class_name,
            up.occupation,
            up.relationship,
            up.emergency_contact_name,
            up.emergency_contact_phone,
            up.emergency_contact_relationship,
            up.blood_group,
            up.allergies,
            up.medical_conditions
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id;
    END IF;
END $$;

-- 5. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_users_role_status_created ON users(role, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON user_activity_logs(user_id, created_at DESC);

-- 6. Add partial indexes for active users (most common query)
CREATE INDEX IF NOT EXISTS idx_users_active ON users(role, status, created_at DESC) 
WHERE status = 'active';

-- 7. Add text search indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users USING gin(to_tsvector('english', email));

-- 8. Optimize activity logs for recent queries
-- Note: Cannot use NOW() in index predicate as it's not immutable
-- Instead, we create a regular index and rely on query optimization
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent ON user_activity_logs(created_at DESC);

-- 9. Add statistics hints for better query planning
ANALYZE users;
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        ANALYZE user_profiles;
    END IF;
END $$;
ANALYZE user_activity_logs;

-- 10. Create a simple materialized view for user statistics
DROP MATERIALIZED VIEW IF EXISTS user_statistics;
CREATE MATERIALIZED VIEW user_statistics AS
SELECT 
    role,
    status,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as recent_count,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_count,
    MAX(created_at) as latest_created_at
FROM users 
GROUP BY role, status;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_statistics_role_status ON user_statistics(role, status);

-- 11. Create a simple function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    -- Simply refresh the materialized view
    REFRESH MATERIALIZED VIEW user_statistics;
END;
$$ LANGUAGE plpgsql;

-- 12. Create optimized functions for common operations
CREATE OR REPLACE FUNCTION get_recent_activity_logs(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    action VARCHAR,
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
        al.action,
        al.details,
        al.created_at,
        COALESCE(u.name, 'Unknown User') as user_name,
        al.ip_address,
        al.user_agent
    FROM user_activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 13. Create function for user search with better performance
CREATE OR REPLACE FUNCTION search_users(
    p_search TEXT,
    p_role TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    role TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.created_at
    FROM users u
    WHERE 
        (p_search IS NULL OR 
         u.name ILIKE '%' || p_search || '%' OR 
         u.email ILIKE '%' || p_search || '%')
        AND (p_role IS NULL OR u.role = p_role)
        AND (p_status IS NULL OR u.status = p_status)
    ORDER BY u.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function to get activity log statistics
CREATE OR REPLACE FUNCTION get_activity_log_stats()
RETURNS TABLE (
    total_logs BIGINT,
    today_logs BIGINT,
    week_logs BIGINT,
    month_logs BIGINT,
    most_common_action TEXT,
    action_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as week,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as month
        FROM user_activity_logs
    ),
    top_action AS (
        SELECT action, COUNT(*) as count
        FROM user_activity_logs
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY action
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.total,
        s.today,
        s.week,
        s.month,
        COALESCE(ta.action, 'N/A'),
        COALESCE(ta.count, 0)
    FROM stats s
    LEFT JOIN top_action ta ON true;
END;
$$ LANGUAGE plpgsql;

-- 15. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_recent_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION search_users TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_user_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_activity_log_stats TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;

-- 16. Add comments for documentation
COMMENT ON INDEX idx_user_activity_logs_created_at IS 'Optimizes queries for recent activity logs';
COMMENT ON INDEX idx_users_role_status_created IS 'Optimizes user listing by role and status';
COMMENT ON MATERIALIZED VIEW user_statistics IS 'Cached user statistics for faster dashboard loading';
COMMENT ON FUNCTION get_recent_activity_logs IS 'Optimized function to fetch recent activity logs with user names';
COMMENT ON FUNCTION refresh_user_statistics IS 'Refreshes user statistics materialized view';
COMMENT ON FUNCTION get_activity_log_stats IS 'Gets comprehensive activity log statistics';

-- 17. Initial refresh of statistics
SELECT refresh_user_statistics();

-- 18. Verify optimizations
DO $$
DECLARE
    index_count INTEGER;
    function_count INTEGER;
BEGIN
    -- Count created indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_%' 
    AND schemaname = 'public';
    
    -- Count created functions
    SELECT COUNT(*) INTO function_count
    FROM pg_proc 
    WHERE proname IN ('get_recent_activity_logs', 'search_users', 'refresh_user_statistics', 'get_activity_log_stats');
    
    RAISE NOTICE 'Database optimization completed successfully!';
    RAISE NOTICE 'Created % indexes for performance optimization', index_count;
    RAISE NOTICE 'Created % optimized functions', function_count;
    RAISE NOTICE 'Materialized view "user_statistics" created and populated';
    RAISE NOTICE '';
    RAISE NOTICE 'Available functions:';
    RAISE NOTICE '- get_recent_activity_logs(limit, offset)';
    RAISE NOTICE '- search_users(search, role, status, limit, offset)';
    RAISE NOTICE '- get_activity_log_stats()';
    RAISE NOTICE '- refresh_user_statistics()';
    RAISE NOTICE '';
    RAISE NOTICE 'Usage examples:';
    RAISE NOTICE '  SELECT * FROM get_recent_activity_logs(10, 0);';
    RAISE NOTICE '  SELECT * FROM search_users(''john'', ''student'', ''active'', 20, 0);';
    RAISE NOTICE '  SELECT * FROM get_activity_log_stats();';
    RAISE NOTICE '  SELECT refresh_user_statistics();';
END $$;
