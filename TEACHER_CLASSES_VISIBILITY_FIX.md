# Fix: Teacher Classes Not Showing in "My Classes" Section

## Problem
- Dashboard shows 2 classes assigned (from mock data)
- "My Classes" section shows no classes (fetching from real API)

## Root Cause
The dashboard was using `useTeacherAttendance()` which had **mock data** showing 2 classes, while the "My Classes" section uses `useTeacherClasses()` which fetches from the real API. The API might not be finding classes because:

1. **Teacher's `user_id` not set**: The `teachers.user_id` column might not be populated for existing teachers
2. **Classes not in junction table**: Classes assigned during teacher creation might not be in the `class_teachers` junction table
3. **API not finding teacher record**: The API looks for `teachers.user_id = users.id`, but if this isn't set, it can't find the teacher

## Fixes Applied

### 1. Updated Teacher Attendance Context
- **File**: `lib/teacher-attendance-context.tsx`
- **Change**: Now fetches real data from API instead of using mock data
- **Impact**: Dashboard will now show real classes, not mock data

### 2. Enhanced API Debugging
- **File**: `app/api/teachers/[id]/assignments/route.ts`
- **Changes**:
  - Added detailed logging to see what's happening
  - Added fallback to find teacher by email if `user_id` is not set
  - Added logging for each source of classes (class_teacher, timetable, junction table)
  - Added summary logging at the end

### 3. Enhanced Error Logging in Context
- **File**: `lib/teacher-classes-context.tsx`
- **Changes**:
  - Added console logging to see API response
  - Better error messages
  - Warns when no classes are returned

## Next Steps to Fix

### Step 1: Run the Migration Script
Run the migration script to add `user_id` column to teachers table:
```sql
-- Run scripts/2025-11-04_017_add_teachers_user_id.sql
```

### Step 2: Link Existing Teachers to Users
If you have existing teachers, you need to link them to their user accounts:

```sql
-- Link teachers to users by email
UPDATE teachers t
SET user_id = u.id
FROM users u
WHERE t.email = u.email
  AND u.role = 'teacher'
  AND t.user_id IS NULL;
```

### Step 3: Check Console Logs
1. Open browser console (F12)
2. Navigate to "My Classes" section
3. Look for these log messages:
   - "Teacher classes API response:" - Shows what the API returned
   - "Found teacher record:" - Confirms teacher was found
   - "Found X classes from class_teachers junction table" - Shows classes found
   - "Teacher assignments summary:" - Summary of all data

### Step 4: Verify Classes in Database
Check if classes are in the `class_teachers` junction table:

```sql
-- Check if classes are assigned to teachers
SELECT 
  ct.teacher_row_id,
  t.teacher_id,
  t.first_name || ' ' || t.last_name as teacher_name,
  t.user_id,
  c.class_name,
  c.class_level
FROM class_teachers ct
JOIN teachers t ON t.id = ct.teacher_row_id
JOIN classes c ON c.id = ct.class_id
WHERE t.user_id = 'YOUR_USER_ID_HERE';  -- Replace with your user ID
```

### Step 5: If Classes Are Missing
If classes aren't in the `class_teachers` junction table, you need to add them. The classes were stored in `teachers.classes` as a text array, but they need to be in the junction table.

You can create a script to migrate them:

```sql
-- Migrate classes from teachers.classes array to class_teachers junction table
-- This is a one-time migration for existing teachers
DO $$
DECLARE
  teacher_record RECORD;
  class_name_text TEXT;
  class_record RECORD;
BEGIN
  FOR teacher_record IN 
    SELECT id, classes, user_id 
    FROM teachers 
    WHERE classes IS NOT NULL 
      AND array_length(classes, 1) > 0
  LOOP
    FOREACH class_name_text IN ARRAY teacher_record.classes
    LOOP
      -- Find class by name
      SELECT id INTO class_record
      FROM classes
      WHERE (class_name = class_name_text OR name = class_name_text)
        AND status = 'active'
      LIMIT 1;
      
      IF class_record.id IS NOT NULL THEN
        -- Insert into junction table if not exists
        INSERT INTO class_teachers (class_id, teacher_row_id)
        VALUES (class_record.id, teacher_record.id)
        ON CONFLICT (class_id, teacher_row_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END $$;
```

## Testing

After applying the fixes:

1. **Check Dashboard**: Should show real number of classes (not mock 2)
2. **Check "My Classes"**: Should show all assigned classes
3. **Check Console**: Should see detailed logging showing what's happening
4. **Check API Response**: Should see classes in the response

## Expected Console Output

When working correctly, you should see:
```
Found teacher record: { id: '...', user_id: '...', teacher_id: '...' }
Found 2 classes from class_teachers junction table
Teacher assignments summary: {
  teacherId: '...',
  subjectsCount: X,
  classesCount: 2,
  junctionClasses: 2,
  ...
}
```

If there's an issue, you'll see:
```
Error finding teacher record: ...
Found teacher by email, but user_id is not set: ...
```

This will tell you exactly what needs to be fixed.

