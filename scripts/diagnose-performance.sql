-- ========================================
-- Performance Diagnostics for Teacher Assignments API
-- ========================================
-- Run this in Supabase SQL Editor to identify performance bottlenecks

-- 0. Check if required tables exist (CRITICAL FIRST STEP)
SELECT 
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('teacher_branch_assignments'),
        ('classes'),
        ('teachers'),
        ('teacher_subjects'),
        ('subject_branches'),
        ('students'),
        ('parents')
) AS t(table_name)
ORDER BY 
    CASE 
        WHEN table_name = 'teacher_branch_assignments' THEN 1
        WHEN table_name = 'subject_branches' THEN 2
        ELSE 3
    END;

-- If any tables are missing, STOP HERE and run setup-teacher-assignments-complete.sql first!

-- 1. Check row counts (only if tables exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'teacher_branch_assignments') THEN
        RAISE NOTICE '✅ teacher_branch_assignments table exists';
    ELSE
        RAISE EXCEPTION '❌ CRITICAL: teacher_branch_assignments table does not exist! Run setup-teacher-assignments-complete.sql first';
    END IF;
END $$;

SELECT 
  'teacher_branch_assignments' as table_name,
  COUNT(*) as row_count
FROM teacher_branch_assignments
UNION ALL
SELECT 
  'classes' as table_name,
  COUNT(*) as row_count
FROM classes
UNION ALL
SELECT 
  'teachers' as table_name,
  COUNT(*) as row_count
FROM teachers
UNION ALL
SELECT 
  'teacher_subjects' as table_name,
  COUNT(*) as row_count
FROM teacher_subjects;

-- 2. Check existing indexes on critical tables
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('teacher_branch_assignments', 'classes', 'teachers', 'teacher_subjects')
ORDER BY tablename, indexname;

-- 3. Check for missing indexes (slow queries)
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE tablename IN ('teacher_branch_assignments', 'classes', 'teachers', 'teacher_subjects')
  AND idx_scan = 0  -- Unused indexes
ORDER BY tablename;

-- 4. Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE tablename IN ('teacher_branch_assignments', 'classes', 'teachers', 'teacher_subjects', 'students', 'parents')
ORDER BY size_bytes DESC;

-- 5. Check for slow queries (requires pg_stat_statements extension)
-- Uncomment if extension is enabled:
-- SELECT 
--   query,
--   calls,
--   mean_exec_time,
--   max_exec_time,
--   total_exec_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%teacher_branch_assignments%'
--    OR query LIKE '%classes%'
-- ORDER BY mean_exec_time DESC
-- LIMIT 10;

-- 6. Sample query to test performance
EXPLAIN ANALYZE
SELECT tba.class_id
FROM teacher_branch_assignments tba
WHERE tba.teacher_id = (SELECT id FROM teachers LIMIT 1)
  AND tba.status = 'active'
LIMIT 100;

-- 7. Check for foreign key constraints
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('teacher_branch_assignments', 'classes', 'teachers', 'teacher_subjects');

-- ========================================
-- RECOMMENDATIONS:
-- ========================================
-- If the queries above take more than 1-2 seconds to run,
-- you likely need to add indexes. See create-performance-indexes.sql

