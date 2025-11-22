-- ========================================
-- Performance Indexes for Teacher Assignments API
-- ========================================
-- Run this in Supabase SQL Editor to dramatically improve query performance
-- IMPORTANT: Run during off-peak hours as index creation may lock tables briefly

-- ========================================
-- 1. Teacher Branch Assignments Indexes
-- ========================================

-- Primary lookup by teacher_id and status (CRITICAL - used in every teacher query)
CREATE INDEX IF NOT EXISTS idx_tba_teacher_status 
ON teacher_branch_assignments (teacher_id, status)
WHERE status = 'active';

-- Composite index for teacher assignments with class_id
CREATE INDEX IF NOT EXISTS idx_tba_teacher_class 
ON teacher_branch_assignments (teacher_id, class_id, status)
WHERE status = 'active';

-- Index for class_id lookups (for reverse queries)
CREATE INDEX IF NOT EXISTS idx_tba_class_id 
ON teacher_branch_assignments (class_id)
WHERE status = 'active';

-- Index for status column (if querying by status alone)
CREATE INDEX IF NOT EXISTS idx_tba_status 
ON teacher_branch_assignments (status);

-- ========================================
-- 2. Classes Table Indexes
-- ========================================

-- Primary key index should already exist on 'id'
-- Add composite index for status queries
CREATE INDEX IF NOT EXISTS idx_classes_status 
ON classes (status)
WHERE status = 'active';

-- Index for class_teacher_id lookups
CREATE INDEX IF NOT EXISTS idx_classes_teacher 
ON classes (class_teacher_id)
WHERE status = 'active';

-- Composite index for multiple filters
CREATE INDEX IF NOT EXISTS idx_classes_status_year 
ON classes (status, academic_year);

-- Index for class_name searches
CREATE INDEX IF NOT EXISTS idx_classes_name 
ON classes (class_name);

-- ========================================
-- 3. Teachers Table Indexes
-- ========================================

-- Index for user_id lookup (CRITICAL - used to find teacher record)
CREATE INDEX IF NOT EXISTS idx_teachers_user_id 
ON teachers (user_id);

-- Index for teacher_id
CREATE INDEX IF NOT EXISTS idx_teachers_teacher_id 
ON teachers (teacher_id);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_teachers_status 
ON teachers (status);

-- ========================================
-- 4. Teacher Subjects Table Indexes
-- ========================================

-- Primary lookup by teacher_id
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_teacher 
ON teacher_subjects (teacher_id, is_active)
WHERE is_active = true;

-- Index for subject_id lookups
CREATE INDEX IF NOT EXISTS idx_teacher_subjects_subject 
ON teacher_subjects (subject_id);

-- ========================================
-- 5. Students Table Indexes (for loading student data)
-- ========================================

-- Index for class lookups
CREATE INDEX IF NOT EXISTS idx_students_class 
ON students (class);

-- Index for class_id lookups
CREATE INDEX IF NOT EXISTS idx_students_class_id 
ON students (class_id);

-- Index for student_id
CREATE INDEX IF NOT EXISTS idx_students_student_id 
ON students (student_id);

-- Index for status
CREATE INDEX IF NOT EXISTS idx_students_status 
ON students (status)
WHERE status = 'active';

-- ========================================
-- 6. Parents Table Indexes (for parent data fetching)
-- ========================================

-- Index for student_id lookups
CREATE INDEX IF NOT EXISTS idx_parents_student_id 
ON parents (student_id);

-- ========================================
-- 7. Users Table Indexes
-- ========================================

-- Index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users (role);

-- Composite index for role and id
CREATE INDEX IF NOT EXISTS idx_users_role_id 
ON users (id, role);

-- ========================================
-- Verify Index Creation
-- ========================================
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('teacher_branch_assignments', 'classes', 'teachers', 'teacher_subjects', 'students', 'parents', 'users')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- ========================================
-- Performance Check Query
-- ========================================
-- After creating indexes, run this to verify performance improvement:
EXPLAIN ANALYZE
SELECT tba.class_id
FROM teacher_branch_assignments tba
WHERE tba.teacher_id = (SELECT id FROM teachers LIMIT 1)
  AND tba.status = 'active'
LIMIT 100;

-- Expected result: Should use index scan, execution time < 10ms

