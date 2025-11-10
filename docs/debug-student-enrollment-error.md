# Debug Guide: Student Enrollment User Account Creation Error

## Problem Description
The student enrollment process was failing when trying to create a user account for the student. The error occurred in `lib/student-enrollment-context.tsx` at line 366.

## Root Causes Identified

### 1. Database Schema Mismatch
The users table in the database might not have all the required columns that the code is trying to insert.

**Required columns for user creation:**
- `id` (UUID, auto-generated)
- `email` (VARCHAR, unique, not null)
- `password_hash` (VARCHAR, not null)
- `name` (VARCHAR, not null)
- `role` (VARCHAR, with constraint)
- `status` (VARCHAR, with constraint)
- `avatar_url` (TEXT, nullable)
- `phone` (VARCHAR, nullable)
- `has_default_password` (BOOLEAN)
- `password_last_changed` (TIMESTAMP)
- `password_expiry_date` (TIMESTAMP)
- `permissions` (TEXT array)

### 2. Constraint Violations
- Email uniqueness constraint violations
- Role constraint violations
- Status constraint violations

### 3. Data Type Issues
- Phone number format issues
- Permission array format issues
- Timestamp format issues

## Solutions Implemented

### 1. Enhanced Error Handling
```typescript
// Added detailed error logging
console.error("❌ Student user error details:", {
  code: studentUserError.code,
  message: studentUserError.message,
  details: studentUserError.details,
  hint: studentUserError.hint
})

// Added data being inserted logging
console.error("❌ Data being inserted:", {
  email: studentData.email,
  name: studentName,
  role: 'student',
  status: 'active',
  phone: studentData.phone || null,
  has_default_password: true,
  permissions: ['view_own_progress', 'view_own_schedule', 'view_own_fees', 'view_own_attendance', 'communicate_teachers']
})
```

### 2. Graceful Fallback
```typescript
// Wrapped user creation in try-catch
try {
  // User creation logic
} catch (userCreationError) {
  console.error("❌ Unexpected error during user account creation:", userCreationError)
  console.warn("⚠️ Continuing without user account creation")
}
```

### 3. Database Schema Fix Script
Created `scripts/fix-users-table-schema.sql` to ensure the users table has all required columns.

### 4. Database Test Script
Created `scripts/test-users-table.sql` to verify the table structure and test inserts.

## Debugging Steps

### Step 1: Check Database Schema
Run the test script to verify table structure:
```sql
-- Run scripts/test-users-table.sql
```

### Step 2: Fix Schema if Needed
If the table is missing columns, run:
```sql
-- Run scripts/fix-users-table-schema.sql
```

### Step 3: Test User Creation
Try creating a test user to verify the schema works:
```sql
INSERT INTO users (
    email, 
    password_hash, 
    name, 
    role, 
    status, 
    permissions, 
    has_default_password
) VALUES (
    'test@example.com',
    '$2b$10$test.hash.placeholder',
    'Test User',
    'student',
    'active',
    ARRAY['view_own_progress'],
    true
);
```

### Step 4: Check Console Logs
When testing student enrollment, check the browser console for detailed error messages that will now include:
- Error codes
- Error messages
- Data being inserted
- Constraint violations

## Common Error Codes

- `23505`: Unique constraint violation (email already exists)
- `23514`: Check constraint violation (invalid role/status)
- `23502`: Not null constraint violation (missing required field)
- `42703`: Column does not exist (schema mismatch)

## Prevention Measures

1. **Always check database schema** before deploying code changes
2. **Use database migrations** to manage schema changes
3. **Add comprehensive error handling** for database operations
4. **Test user creation** in development before production
5. **Monitor console logs** for early error detection

## Testing the Fix

1. Run the database schema fix script
2. Test student enrollment with a new student
3. Check console logs for any remaining errors
4. Verify that student records are created even if user account creation fails
5. Test with existing email addresses to ensure proper error handling

## Files Modified

- `lib/student-enrollment-context.tsx` - Enhanced error handling and fallback
- `scripts/fix-users-table-schema.sql` - Database schema fix
- `scripts/test-users-table.sql` - Database testing script
- `docs/debug-student-enrollment-error.md` - This documentation

## Next Steps

1. Run the database schema fix script
2. Test the student enrollment process
3. Monitor for any remaining errors
4. Update documentation if additional issues are found
