# Debugging Class-Teacher Relationship Issue

## Problem
The error "Could not find a relationship between 'classes' and 'teachers' in the schema cache" occurs when trying to load classes from the database.

## Root Cause
The issue is likely caused by one of the following:

1. **Missing Foreign Key Constraint**: The foreign key relationship between `classes.class_teacher_id` and `teachers.id` might not be properly established.
2. **Incorrect Constraint Name**: The code was trying to reference a specific constraint name that doesn't exist.
3. **Empty Tables**: If either the `classes` or `teachers` table is empty, Supabase might not recognize the relationship.

## Solution Steps

### 1. Run the Test Script
First, run the test script to diagnose the issue:

```bash
psql -d your_database_name -f scripts/test-class-relationship.sql
```

This will show:
- If tables exist
- What foreign key constraints exist
- How many records are in each table
- The actual constraint names

### 2. Run the Fix Script
If the foreign key constraint is missing, run the fix script:

```bash
psql -d your_database_name -f scripts/fix-class-teacher-relationship.sql
```

### 3. Verify the Fix
After running the fix script, test the relationship:

```sql
-- Test the join query
SELECT 
    c.id as class_id,
    c.class_name,
    c.class_teacher_id,
    t.first_name,
    t.last_name
FROM classes c
LEFT JOIN teachers t ON c.class_teacher_id = t.id
LIMIT 5;
```

### 4. Check Application
The application code has been updated to:
- Remove the explicit constraint name reference
- Add better error handling
- Handle cases where teacher data might be null

## Code Changes Made

### In `lib/class-management-context.tsx`:
1. **Removed explicit constraint name**: Changed from `teachers!classes_class_teacher_id_fkey` to just `teachers`
2. **Added null checks**: Better handling of cases where teacher data is null
3. **Enhanced error logging**: More detailed error information for debugging

### Files Created:
1. `scripts/test-class-relationship.sql` - Diagnostic script
2. `scripts/fix-class-teacher-relationship.sql` - Fix script
3. `docs/debug-class-teacher-relationship.md` - This documentation

## Prevention
To prevent this issue in the future:
1. Always use simple relationship names in Supabase queries (e.g., `teachers` instead of `teachers!constraint_name`)
2. Ensure foreign key constraints are properly created when setting up the database
3. Add proper error handling for database relationship issues
4. Test database relationships after schema changes

## Common Issues and Solutions

### Issue: "Table does not exist"
**Solution**: Run the table creation scripts:
```bash
psql -d your_database_name -f scripts/create-tables.sql
```

### Issue: "Foreign key constraint does not exist"
**Solution**: Run the fix script:
```bash
psql -d your_database_name -f scripts/fix-class-teacher-relationship.sql
```

### Issue: "No data in tables"
**Solution**: Add some test data:
```sql
-- Add a test teacher
INSERT INTO teachers (teacher_id, first_name, last_name, email, subsystem, employment_type)
VALUES ('T001', 'John', 'Doe', 'john.doe@school.com', 'english', 'full-time');

-- Add a test class
INSERT INTO classes (class_name, class_level, subsystem, academic_year, class_teacher_id)
VALUES ('Form 1A', 'Form 1', 'english', '2024/2025', 
        (SELECT id FROM teachers WHERE teacher_id = 'T001'));
```
