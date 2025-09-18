-- Migration script to remove student and parent enrollment from User Management
-- This script updates the users table to only allow admin, teacher, and bursar roles
-- Students and parents will be managed through Student Management system

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup of current users table
CREATE TABLE IF NOT EXISTS users_backup_before_role_removal AS 
SELECT * FROM users;

SELECT 'Backup created: users_backup_before_role_removal table' as status;

-- =====================================================
-- STEP 2: REMOVE STUDENT AND PARENT USERS
-- =====================================================

-- Delete all users with student and parent roles
-- Note: This will also delete their associated user_profiles due to CASCADE
DELETE FROM users WHERE role IN ('student', 'parent');

SELECT 'Removed all student and parent users from users table' as status;

-- =====================================================
-- STEP 3: UPDATE USERS TABLE CONSTRAINT
-- =====================================================

-- Drop the existing role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new constraint that only allows admin, teacher, and bursar roles
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'teacher', 'bursar'));

SELECT 'Updated users table role constraint to exclude student and parent roles' as status;

-- =====================================================
-- STEP 4: UPDATE ROLE-SPECIFIC ID GENERATION FUNCTION
-- =====================================================

-- Update the function to only handle admin, teacher, and bursar roles
CREATE OR REPLACE FUNCTION generate_role_specific_id(role_type VARCHAR, user_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    year_part VARCHAR;
    random_part VARCHAR;
    prefix VARCHAR;
    new_id VARCHAR;
    counter INTEGER := 1;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::VARCHAR;
    random_part := LPAD(FLOOR(RANDOM() * 1000)::VARCHAR, 3, '0');
    
    CASE role_type
        WHEN 'teacher' THEN prefix := 'TCH';
        WHEN 'bursar' THEN prefix := 'BUR';
        WHEN 'admin' THEN prefix := 'ADM';
        ELSE prefix := 'USR';
    END CASE;
    
    new_id := prefix || year_part || random_part;
    
    -- Check if ID already exists and generate a new one if needed
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE role_specific_id = new_id) LOOP
        random_part := LPAD(FLOOR(RANDOM() * 1000)::VARCHAR, 3, '0');
        new_id := prefix || year_part || random_part;
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > 100 THEN
            RAISE EXCEPTION 'Unable to generate unique ID after 100 attempts';
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

SELECT 'Updated generate_role_specific_id function to exclude student and parent roles' as status;

-- =====================================================
-- STEP 5: UPDATE USER_PROFILES TABLE
-- =====================================================

-- Update the relationship constraint in user_profiles to remove parent-specific relationships
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_relationship_check;

-- Add new constraint that only allows guardian relationship (for bursar/admin emergency contacts)
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_relationship_check 
CHECK (relationship IN ('guardian', 'other'));

SELECT 'Updated user_profiles relationship constraint' as status;

-- =====================================================
-- STEP 6: CLEAN UP ORPHANED DATA
-- =====================================================

-- Remove any orphaned user_profiles that might exist
DELETE FROM user_profiles 
WHERE user_id NOT IN (SELECT id FROM users);

SELECT 'Cleaned up orphaned user_profiles' as status;

-- =====================================================
-- STEP 7: UPDATE INDEXES
-- =====================================================

-- The existing indexes should still work fine, but let's ensure they're optimized
CREATE INDEX IF NOT EXISTS idx_users_role_admin_teacher_bursar ON users(role) 
WHERE role IN ('admin', 'teacher', 'bursar');

SELECT 'Updated indexes for new role structure' as status;

-- =====================================================
-- STEP 8: VERIFICATION
-- =====================================================

-- Verify the changes
SELECT 
    'Verification Results:' as status,
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE role = 'teacher') as teacher_count,
    (SELECT COUNT(*) FROM users WHERE role = 'bursar') as bursar_count,
    (SELECT COUNT(*) FROM users WHERE role = 'student') as student_count,
    (SELECT COUNT(*) FROM users WHERE role = 'parent') as parent_count;

-- Show current role distribution
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role 
ORDER BY role;

SELECT 'Migration completed successfully!' as final_status;
