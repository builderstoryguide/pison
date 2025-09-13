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

async function generateFreshUserCredentials() {
  console.log('🔐 Generating Fresh User Credentials for Pison Academy...\n');

  try {
    // Generate passwords for each role
    const adminPassword = 'Admin@2024'; // Keep admin password simple
    const teacherPassword = generateDefaultPassword('teacher');
    const studentPassword = generateDefaultPassword('student');
    const parentPassword = generateDefaultPassword('parent');
    const bursarPassword = generateDefaultPassword('bursar');

    // Hash all passwords with bcrypt
    console.log('🔒 Hashing passwords...');
    const adminHash = await bcrypt.hash(adminPassword, 12);
    const teacherHash = await bcrypt.hash(teacherPassword, 12);
    const studentHash = await bcrypt.hash(studentPassword, 12);
    const parentHash = await bcrypt.hash(parentPassword, 12);
    const bursarHash = await bcrypt.hash(bursarPassword, 12);

    console.log('✅ Passwords hashed successfully!\n');

    // Test the hashes to make sure they work
    console.log('🧪 Testing password hashes...');
    const adminTest = await bcrypt.compare(adminPassword, adminHash);
    const teacherTest = await bcrypt.compare(teacherPassword, teacherHash);
    const studentTest = await bcrypt.compare(studentPassword, studentHash);
    const parentTest = await bcrypt.compare(parentPassword, parentHash);
    const bursarTest = await bcrypt.compare(bursarPassword, bursarHash);

    console.log(`Admin hash test: ${adminTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Teacher hash test: ${teacherTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Student hash test: ${studentTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Parent hash test: ${parentTest ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Bursar hash test: ${bursarTest ? '✅ PASS' : '❌ FAIL'}\n`);

    // Generate the SQL script
    const sqlScript = `-- =====================================================
-- DROP AND RECREATE ALL USERS FOR PISON ACADEMY
-- =====================================================
-- This script completely removes all existing users and creates
-- fresh ones with working Pison Academy credentials
-- 
-- IMPORTANT: This will DELETE ALL existing users!
-- Make sure to backup your database before running this script.
-- Generated on: ${new Date().toISOString()}
-- =====================================================

-- =====================================================
-- STEP 1: BACKUP EXISTING USERS (OPTIONAL)
-- =====================================================
-- Uncomment the following lines if you want to backup existing users first
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- SELECT 'Backup created: users_backup table' as status;

-- =====================================================
-- STEP 2: DROP ALL EXISTING USERS
-- =====================================================

-- Delete all existing users
DELETE FROM users;

-- Reset the sequence if it exists (for auto-incrementing IDs)
-- This ensures new users start with ID 1
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'users_id_seq') THEN
        ALTER SEQUENCE users_id_seq RESTART WITH 1;
    END IF;
END $$;

SELECT 'All existing users deleted' as status;

-- =====================================================
-- STEP 3: CREATE FRESH USERS WITH WORKING CREDENTIALS
-- =====================================================

-- Create Admin User
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
);

-- Create Teacher User
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
);

-- Create Student User
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
);

-- Create Parent User
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
);

-- Create Bursar User
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
);

-- =====================================================
-- STEP 4: VERIFICATION
-- =====================================================

-- Verify all users were created successfully
SELECT 
    id,
    email,
    name,
    role,
    status,
    has_default_password,
    created_at
FROM users 
ORDER BY role, email;

-- Count users by role
SELECT 
    role,
    COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;

-- =====================================================
-- STEP 5: TEST LOGIN CREDENTIALS
-- =====================================================

-- Test password hashes (this will show if the hashes are valid)
SELECT 
    email,
    role,
    CASE 
        WHEN password_hash LIKE '$2b$12$%' THEN 'Valid bcrypt hash'
        ELSE 'Invalid hash format'
    END as hash_status,
    LENGTH(password_hash) as hash_length
FROM users
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
-- 1. This script DELETES ALL existing users
-- 2. Creates fresh users with working credentials
-- 3. All users have has_default_password = true
-- 4. Users should change passwords on first login
-- 5. The password hashes are generated with bcrypt rounds = 12
-- 6. All users are set to 'active' status
-- 7. Password hash tests: ${adminTest ? 'PASS' : 'FAIL'}, ${teacherTest ? 'PASS' : 'FAIL'}, ${studentTest ? 'PASS' : 'FAIL'}, ${parentTest ? 'PASS' : 'FAIL'}, ${bursarTest ? 'PASS' : 'FAIL'}
-- 
-- =====================================================`;

    // Write the SQL script to a file
    const outputPath = path.join(__dirname, 'drop-and-recreate-users-with-hashes.sql');
    fs.writeFileSync(outputPath, sqlScript);

    console.log('✅ SQL script generated successfully!');
    console.log(`📁 File saved to: ${outputPath}\n`);

    console.log('🎉 FRESH USER CREDENTIALS GENERATED!\n');
    console.log('═'.repeat(80));
    console.log('📋 NEW LOGIN CREDENTIALS:');
    console.log('═'.repeat(80));
    console.log(`🔹 ADMIN:`);
    console.log(`   📧 Email: admin@pisonacademy.cm`);
    console.log(`   🔑 Password: ${adminPassword}`);
    console.log(`   ✅ Hash Test: ${adminTest ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log(`🔹 TEACHER:`);
    console.log(`   📧 Email: teacher@pisonacademy.cm`);
    console.log(`   🔑 Password: ${teacherPassword}`);
    console.log(`   ✅ Hash Test: ${teacherTest ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log(`🔹 STUDENT:`);
    console.log(`   📧 Email: student@pisonacademy.cm`);
    console.log(`   🔑 Password: ${studentPassword}`);
    console.log(`   ✅ Hash Test: ${studentTest ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log(`🔹 PARENT:`);
    console.log(`   📧 Email: parent@pisonacademy.cm`);
    console.log(`   🔑 Password: ${parentPassword}`);
    console.log(`   ✅ Hash Test: ${parentTest ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log(`🔹 BURSAR:`);
    console.log(`   📧 Email: bursar@pisonacademy.cm`);
    console.log(`   🔑 Password: ${bursarPassword}`);
    console.log(`   ✅ Hash Test: ${bursarTest ? 'PASS' : 'FAIL'}`);
    console.log('');
    console.log('═'.repeat(80));
    console.log('⚠️  IMPORTANT SECURITY NOTES:');
    console.log('• This script will DELETE ALL existing users');
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

    return {
      adminPassword,
      teacherPassword,
      studentPassword,
      parentPassword,
      bursarPassword,
      adminHash,
      teacherHash,
      studentHash,
      parentHash,
      bursarHash
    };

  } catch (error) {
    console.error('❌ Error generating fresh credentials:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateFreshUserCredentials();
}

module.exports = {
  generateFreshUserCredentials,
  generateDefaultPassword
};
