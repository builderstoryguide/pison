-- Add database constraints to ensure teacher-user linkage integrity
-- This script adds constraints and indexes to prevent and detect unlinked teachers

-- 1) Create a partial unique index to ensure one-to-one relationship
-- This prevents a teacher from being linked to multiple users
-- and ensures user_id is unique when set
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_user_id_unique 
ON public.teachers(user_id) 
WHERE user_id IS NOT NULL;

-- 2) Add a comment explaining the constraint
COMMENT ON INDEX idx_teachers_user_id_unique IS 
'Ensures that each teacher can only be linked to one user account. NULL values are allowed for unlinked teachers.';

-- 3) Create a function to check for unlinked teachers with matching user accounts
CREATE OR REPLACE FUNCTION check_unlinked_teachers()
RETURNS TABLE (
  teacher_id UUID,
  teacher_email TEXT,
  teacher_name TEXT,
  user_id UUID,
  user_email TEXT,
  match_method TEXT
) AS $$
BEGIN
  -- Find teachers that can be linked by email
  RETURN QUERY
  SELECT 
    t.id AS teacher_id,
    t.email AS teacher_email,
    (t.first_name || ' ' || t.last_name) AS teacher_name,
    u.id AS user_id,
    u.email AS user_email,
    'email' AS match_method
  FROM teachers t
  JOIN users u ON u.email = t.email
  WHERE t.user_id IS NULL
    AND u.role = 'teacher'
  
  UNION
  
  -- Find teachers that can be linked by teacher_id
  SELECT 
    t.id AS teacher_id,
    t.email AS teacher_email,
    (t.first_name || ' ' || t.last_name) AS teacher_name,
    u.id AS user_id,
    u.email AS user_email,
    'teacher_id' AS match_method
  FROM teachers t
  JOIN user_profiles up ON up.role_specific_id = t.teacher_id
  JOIN users u ON u.id = up.user_id
  WHERE t.user_id IS NULL
    AND u.role = 'teacher'
    AND up.role_specific_id LIKE 'TCH%'
    AND NOT EXISTS (
      -- Exclude if already matched by email
      SELECT 1 FROM users u2
      WHERE u2.email = t.email
        AND u2.role = 'teacher'
    );
END;
$$ LANGUAGE plpgsql;

-- 4) Add comment to function
COMMENT ON FUNCTION check_unlinked_teachers() IS 
'Returns a list of teachers that can be linked to user accounts but are not currently linked.';

-- 5) Create a view for easy monitoring
CREATE OR REPLACE VIEW teacher_linkage_status AS
SELECT 
  t.id AS teacher_id,
  t.teacher_id AS teacher_code,
  t.email AS teacher_email,
  (t.first_name || ' ' || t.last_name) AS teacher_name,
  t.user_id,
  u.email AS user_email,
  u.role AS user_role,
  CASE 
    WHEN t.user_id IS NOT NULL THEN 'Linked'
    WHEN EXISTS (
      SELECT 1 FROM users u2
      WHERE u2.email = t.email
        AND u2.role = 'teacher'
    ) THEN 'Can be linked (email)'
    WHEN EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN users u3 ON u3.id = up.user_id
      WHERE up.role_specific_id = t.teacher_id
        AND u3.role = 'teacher'
    ) THEN 'Can be linked (teacher_id)'
    ELSE 'No matching user'
  END AS linkage_status
FROM teachers t
LEFT JOIN users u ON u.id = t.user_id;

-- 6) Add comment to view
COMMENT ON VIEW teacher_linkage_status IS 
'Provides a comprehensive view of teacher-user linkage status for monitoring and reporting.';

-- 7) Grant access to the view (adjust based on your role requirements)
-- GRANT SELECT ON teacher_linkage_status TO authenticated;
-- GRANT SELECT ON teacher_linkage_status TO service_role;

-- Summary
SELECT 'Database constraints and monitoring tools created successfully' AS status;

-- Show current linkage status
SELECT 
  linkage_status,
  COUNT(*) AS count
FROM teacher_linkage_status
GROUP BY linkage_status
ORDER BY linkage_status;

