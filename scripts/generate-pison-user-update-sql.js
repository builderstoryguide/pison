const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

/**
 * Generates a secure default password for new users
 * Format: Role@Year + 4 random alphanumeric characters
 * Example: Teacher@2024Xy9z
 */
function generateDefaultPassword(role, year = 2024) {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);
  return `${capitalizedRole}@${year}${randomChars}`;
}

async function generateUserUpdateSQL() {
  console.log('🔐 Generating Pison Academy User Update SQL Script...\n');

  try {
    // Generate passwords for each role
    const adminPassword = 'Admin@2024'; // Keep admin password simple
    const teacherPassword = generateDefaultPassword('teacher');
    const studentPassword = generateDefaultPassword('student');
    const parentPassword = generateDefaultPassword('parent');
    const bursarPassword = generateDefaultPassword('bursar');

    // Hash all passwords
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const teacherHash = await bcrypt.hash(teacherPassword, 12);
    const studentHash = await bcrypt.hash(studentPassword, 12);
    const parentHash = await bcrypt.hash(parentPassword, 12);
    const bursarHash = await bcrypt.hash(bursarPassword, 12);

    console.log('📋 Generated Passwords:');
    console.log(`Admin: ${adminPassword}`);
    console.log(`Teacher: ${teacherPassword}`);
    console.log(`Student: ${studentPassword}`);
    console.log(`Parent: ${parentPassword}`);
    console.log(`Bursar: ${bursarPassword}\n`);

    // Generate the SQL script
    const sqlScript = `-- =====================================================
-- UPDATE ALL USERS TO PISON ACADEMY
-- =====================================================
-- This script updates all existing users to use Pison Academy
-- email addresses and resets their passwords to new secure ones
-- 
-- IMPORTANT: Run this script in your Supabase SQL Editor
-- Generated on: ${new Date().toISOString()}
-- =====================================================

-- First, let's see what users currently exist
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password
FROM users 
ORDER BY role, email;

-- =====================================================
-- UPDATE ADMIN USERS
-- =====================================================

-- Update admin user email and reset password
UPDATE users 
SET 
    email = 'admin@pisonacademy.cm',
    password_hash = '${adminHash}',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE email LIKE '%admin%' OR role = 'admin';

-- =====================================================
-- UPDATE TEACHER USERS
-- =====================================================

-- Update teacher users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%teacher%' THEN 'teacher@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '${teacherHash}',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'teacher';

-- =====================================================
-- UPDATE STUDENT USERS
-- =====================================================

-- Update student users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%student%' THEN 'student@pisonacademy.cm'
        WHEN email LIKE '%@student.gbhs%' THEN REPLACE(email, '@student.gbhs.cm', '@student.pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@student.pisonacademy.cm')
    END,
    password_hash = '${studentHash}',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'student';

-- =====================================================
-- UPDATE PARENT USERS
-- =====================================================

-- Update parent users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%parent%' THEN 'parent@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '${parentHash}',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'parent';

-- =====================================================
-- UPDATE BURSAR USERS
-- =====================================================

-- Update bursar users
UPDATE users 
SET 
    email = CASE 
        WHEN email LIKE '%bursar%' THEN 'bursar@pisonacademy.cm'
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs-yaounde.cm', '@pisonacademy.cm')
        WHEN email LIKE '%@gbhs%' THEN REPLACE(email, '@gbhs.cm', '@pisonacademy.cm')
        ELSE CONCAT(SPLIT_PART(email, '@', 1), '@pisonacademy.cm')
    END,
    password_hash = '${bursarHash}',
    has_default_password = true,
    password_last_changed = NOW(),
    updated_at = NOW()
WHERE role = 'bursar';

-- =====================================================
-- CREATE DEFAULT USERS IF THEY DON'T EXIST
-- =====================================================

-- Insert admin user if not exists
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'admin@pisonacademy.cm',
    '${adminHash}',
    'System Administrator',
    'admin',
    'active',
    ARRAY['all'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert teacher user if not exists
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'teacher@pisonacademy.cm',
    '${teacherHash}',
    'Paul Biya Mbeki',
    'teacher',
    'active',
    ARRAY['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert student user if not exists
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'student@pisonacademy.cm',
    '${studentHash}',
    'Amina Fru',
    'student',
    'active',
    ARRAY['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert parent user if not exists
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'parent@pisonacademy.cm',
    '${parentHash}',
    'John Fru',
    'parent',
    'active',
    ARRAY['view_child_progress', 'communicate_teachers', 'view_financial_records'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- Insert bursar user if not exists
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password,
    created_at,
    updated_at
) VALUES (
    'bursar@pisonacademy.cm',
    '${bursarHash}',
    'Grace Tabi',
    'bursar',
    'active',
    ARRAY['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices'],
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    has_default_password = EXCLUDED.has_default_password,
    password_last_changed = NOW(),
    updated_at = NOW();

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================

-- Verify all users were updated successfully
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password,
    password_last_changed,
    updated_at
FROM users 
ORDER BY role, email;

-- =====================================================
-- SUMMARY
-- =====================================================

-- Count users by role
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN has_default_password = true THEN 1 END) as default_password_count
FROM users 
GROUP BY role
ORDER BY role;

-- =====================================================
-- LOGIN CREDENTIALS SUMMARY
-- =====================================================
-- 
-- ADMIN:
-- Email: admin@pisonacademy.cm
-- Password: ${adminPassword}
-- 
-- TEACHER:
-- Email: teacher@pisonacademy.cm
-- Password: ${teacherPassword}
-- 
-- STUDENT:
-- Email: student@pisonacademy.cm
-- Password: ${studentPassword}
-- 
-- PARENT:
-- Email: parent@pisonacademy.cm
-- Password: ${parentPassword}
-- 
-- BURSAR:
-- Email: bursar@pisonacademy.cm
-- Password: ${bursarPassword}
-- 
-- =====================================================
-- IMPORTANT NOTES
-- =====================================================
-- 
-- 1. This script updates all existing users to use Pison Academy emails
-- 2. All passwords are reset to default values with has_default_password = true
-- 3. Users should change their passwords on first login
-- 4. Run this script in your Supabase SQL Editor
-- 5. After running, users can log in with their new Pison Academy emails
-- 
-- =====================================================`;

    // Write the SQL script to a file
    const outputPath = path.join(__dirname, 'update-all-users-to-pison-with-hashes.sql');
    fs.writeFileSync(outputPath, sqlScript);

    console.log('✅ SQL script generated successfully!');
    console.log(`📁 File saved to: ${outputPath}\n`);

    console.log('🎉 PISON ACADEMY USER UPDATE COMPLETE!\n');
    console.log('═'.repeat(80));
    console.log('📋 NEW LOGIN CREDENTIALS:');
    console.log('═'.repeat(80));
    console.log(`🔹 ADMIN:`);
    console.log(`   📧 Email: admin@pisonacademy.cm`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log('');
    console.log(`🔹 TEACHER:`);
    console.log(`   📧 Email: teacher@pisonacademy.cm`);
    console.log(`   🔑 Password: ${teacherPassword}`);
    console.log('');
    console.log(`🔹 STUDENT:`);
    console.log(`   📧 Email: student@pisonacademy.cm`);
    console.log(`   🔑 Password: ${studentPassword}`);
    console.log('');
    console.log(`🔹 PARENT:`);
    console.log(`   📧 Email: parent@pisonacademy.cm`);
    console.log(`   🔑 Password: ${parentPassword}`);
    console.log('');
    console.log(`🔹 BURSAR:`);
    console.log(`   📧 Email: bursar@pisonacademy.cm`);
    console.log(`   🔑 Password: ${bursarPassword}`);
    console.log('');
    console.log('═'.repeat(80));
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• All passwords expire in 30 days');
    console.log('• Users should change passwords on first login');
    console.log('• Store these credentials securely');
    console.log('• Consider using a password manager');
    console.log('');
    console.log('🛠️  HOW TO APPLY:');
    console.log('1. Copy the generated SQL script from the file');
    console.log('2. Open your Supabase SQL Editor');
    console.log('3. Paste and run the script');
    console.log('4. Verify the results using the verification queries');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('❌ Error generating SQL script:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateUserUpdateSQL();
}

module.exports = {
  generateUserUpdateSQL,
  generateDefaultPassword
};
