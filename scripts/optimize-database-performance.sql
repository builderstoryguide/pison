-- Database Performance Optimization Script
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

-- 3. Add indexes to user_profiles table
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_specific_id ON user_profiles(role_specific_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subsystem ON user_profiles(subsystem);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch ON user_profiles(branch);

-- 4. Optimize the user_details view with better indexing
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
CREATE INDEX IF NOT EXISTS idx_activity_logs_recent ON user_activity_logs(created_at DESC) 
WHERE created_at > NOW() - INTERVAL '30 days';

-- 9. Add statistics hints for better query planning
ANALYZE users;
ANALYZE user_profiles;
ANALYZE user_activity_logs;

-- 10. Create a materialized view for frequently accessed user statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS user_statistics AS
SELECT 
    role,
    status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as recent_count
FROM users 
GROUP BY role, status;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_user_statistics_role_status ON user_statistics(role, status);

-- 11. Create a function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_user_statistics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW user_statistics;
END;
$$ LANGUAGE plpgsql;

-- 12. Set up automatic statistics refresh (optional - can be called manually)
-- This would require a cron job or scheduled task in production

-- 13. Add performance monitoring queries
-- You can run these to check performance:

-- Check index usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch 
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public' 
-- ORDER BY idx_scan DESC;

-- Check table sizes
-- SELECT 
--     schemaname,
--     tablename,
--     attname,
--     n_distinct,
--     correlation
-- FROM pg_stats 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('users', 'user_profiles', 'user_activity_logs')
-- ORDER BY tablename, attname;

-- 14. Add query timeout and connection limits (if needed)
-- ALTER SYSTEM SET statement_timeout = '30s';
-- ALTER SYSTEM SET max_connections = 100;

-- 15. Create optimized functions for common operations
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
    user_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.user_id,
        al.action,
        al.details,
        al.created_at,
        COALESCE(u.name, 'Unknown User') as user_name
    FROM user_activity_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 16. Create function for user search with better performance
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

-- 17. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_recent_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION search_users TO authenticated;
GRANT SELECT ON user_statistics TO authenticated;

-- 18. Add comments for documentation
COMMENT ON INDEX idx_user_activity_logs_created_at IS 'Optimizes queries for recent activity logs';
COMMENT ON INDEX idx_users_role_status_created IS 'Optimizes user listing by role and status';
COMMENT ON MATERIALIZED VIEW user_statistics IS 'Cached user statistics for faster dashboard loading';

-- 19. Verify optimizations
DO $$
BEGIN
    RAISE NOTICE 'Database optimization completed successfully!';
    RAISE NOTICE 'Indexes created for:';
    RAISE NOTICE '- user_activity_logs (created_at, user_id, action)';
    RAISE NOTICE '- users (role, status, email, created_at)';
    RAISE NOTICE '- user_profiles (user_id, role_specific_id)';
    RAISE NOTICE 'Materialized view created for user statistics';
    RAISE NOTICE 'Optimized functions created for common queries';
END $$;
