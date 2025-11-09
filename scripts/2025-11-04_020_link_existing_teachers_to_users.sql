-- Link existing teachers to user accounts
-- This script links teacher records to user accounts by matching:
-- 1. Email addresses (teachers.email = users.email)
-- 2. Teacher IDs (teachers.teacher_id = user_profiles.role_specific_id)
--
-- This script is idempotent and safe to run multiple times

DO $$
DECLARE
  linked_count INTEGER := 0;
  email_linked_count INTEGER := 0;
  teacher_id_linked_count INTEGER := 0;
  rec RECORD;
BEGIN
  RAISE NOTICE 'Starting teacher-user linkage process...';

  -- Method 1: Link by email address
  -- Update teachers where email matches users.email and user role is 'teacher'
  UPDATE teachers t
  SET user_id = u.id
  FROM users u
  WHERE t.email = u.email
    AND u.role = 'teacher'
    AND t.user_id IS NULL
    AND EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = u.id
        AND up.role_specific_id LIKE 'TCH%'
    );

  GET DIAGNOSTICS email_linked_count = ROW_COUNT;
  RAISE NOTICE 'Linked % teachers by email address', email_linked_count;

  -- Method 2: Link by teacher_id (match teachers.teacher_id with user_profiles.role_specific_id)
  -- This handles cases where emails might not match exactly
  UPDATE teachers t
  SET user_id = up.user_id
  FROM user_profiles up
  JOIN users u ON u.id = up.user_id
  WHERE t.teacher_id = up.role_specific_id
    AND up.role_specific_id LIKE 'TCH%'
    AND u.role = 'teacher'
    AND t.user_id IS NULL;

  GET DIAGNOSTICS teacher_id_linked_count = ROW_COUNT;
  RAISE NOTICE 'Linked % teachers by teacher_id', teacher_id_linked_count;

  linked_count := email_linked_count + teacher_id_linked_count;
  RAISE NOTICE 'Total teachers linked: %', linked_count;

  -- Report unlinked teachers (for manual review)
  IF EXISTS (
    SELECT 1 FROM teachers t
    WHERE t.user_id IS NULL
      AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.email = t.email
          AND u.role = 'teacher'
      )
  ) THEN
    RAISE WARNING 'Some teachers could not be automatically linked. Please review manually.';
    
    -- Show unlinked teachers that have matching user accounts
    RAISE NOTICE 'Unlinked teachers with matching user accounts:';
    FOR rec IN
      SELECT 
        t.id,
        t.teacher_id,
        t.email,
        t.first_name || ' ' || t.last_name AS teacher_name,
        u.id AS user_id,
        u.email AS user_email
      FROM teachers t
      JOIN users u ON u.email = t.email
      WHERE t.user_id IS NULL
        AND u.role = 'teacher'
    LOOP
      RAISE NOTICE '  Teacher: % (%) - User: % (%)', 
        rec.teacher_name, rec.teacher_id, rec.user_email, rec.user_id;
    END LOOP;
  END IF;

  RAISE NOTICE 'Teacher-user linkage process completed.';
END $$;

-- Verification queries
-- Count linked teachers
SELECT 
  'Linked Teachers' AS status,
  COUNT(*) AS count
FROM teachers
WHERE user_id IS NOT NULL;

-- Count unlinked teachers
SELECT 
  'Unlinked Teachers' AS status,
  COUNT(*) AS count
FROM teachers
WHERE user_id IS NULL;

-- Show summary of linkage status
SELECT 
  CASE 
    WHEN t.user_id IS NOT NULL THEN 'Linked'
    WHEN EXISTS (
      SELECT 1 FROM users u 
      WHERE u.email = t.email 
        AND u.role = 'teacher'
    ) THEN 'Can be linked (email match)'
    WHEN EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN users u ON u.id = up.user_id
      WHERE up.role_specific_id = t.teacher_id
        AND u.role = 'teacher'
    ) THEN 'Can be linked (teacher_id match)'
    ELSE 'No matching user account'
  END AS linkage_status,
  COUNT(*) AS teacher_count
FROM teachers t
GROUP BY linkage_status
ORDER BY linkage_status;

