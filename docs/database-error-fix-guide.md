# Database Error Fix Guide

## Error: `42P13: input parameters after one with a default value must also have defaults`

### Problem
PostgreSQL requires that when you have a function parameter with a default value, all subsequent parameters must also have default values.

### Original Problematic Function
```sql
CREATE OR REPLACE FUNCTION create_assessment(
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,  -- This has a default
    p_type VARCHAR(20),               -- This doesn't have a default (ERROR!)
    p_subject VARCHAR(100),           -- This doesn't have a default (ERROR!)
    -- ... more parameters without defaults
)
```

### Solution
I've created a **fixed version** of the database script: `scripts/teacher-grades-crud-setup-fixed.sql`

### Key Changes Made

1. **Reordered Parameters**: Put all required parameters first, then optional ones with defaults
2. **Fixed Function Signature**:
   ```sql
   CREATE OR REPLACE FUNCTION create_assessment(
       p_title VARCHAR(255),           -- Required
       p_type VARCHAR(20),             -- Required
       p_subject VARCHAR(100),         -- Required
       p_class_id VARCHAR(255),        -- Required
       p_teacher_id VARCHAR(255),      -- Required
       p_total_marks DECIMAL(5,2),     -- Required
       p_assessment_date DATE,         -- Required
       p_description TEXT DEFAULT NULL, -- Optional with default
       p_passing_marks DECIMAL(5,2) DEFAULT 50.0, -- Optional with default
       p_weight_percentage DECIMAL(5,2) DEFAULT 100.0, -- Optional with default
       p_due_date DATE DEFAULT NULL,   -- Optional with default
       p_status VARCHAR(20) DEFAULT 'draft' -- Optional with default
   )
   ```

### How to Fix

1. **Use the Fixed Script**:
   ```bash
   # Run the fixed script instead
   psql -h your-host -U your-username -d your-database -f scripts/teacher-grades-crud-setup-fixed.sql
   ```

2. **Or Fix Manually**:
   ```sql
   -- Drop the problematic function first
   DROP FUNCTION IF EXISTS create_assessment(VARCHAR(255), TEXT, VARCHAR(20), VARCHAR(100), VARCHAR(255), VARCHAR(255), DECIMAL(5,2), DECIMAL(5,2), DECIMAL(5,2), DATE, DATE, VARCHAR(20));
   
   -- Then create the fixed version
   CREATE OR REPLACE FUNCTION create_assessment(
       p_title VARCHAR(255),
       p_type VARCHAR(20),
       p_subject VARCHAR(100),
       p_class_id VARCHAR(255),
       p_teacher_id VARCHAR(255),
       p_total_marks DECIMAL(5,2),
       p_assessment_date DATE,
       p_description TEXT DEFAULT NULL,
       p_passing_marks DECIMAL(5,2) DEFAULT 50.0,
       p_weight_percentage DECIMAL(5,2) DEFAULT 100.0,
       p_due_date DATE DEFAULT NULL,
       p_status VARCHAR(20) DEFAULT 'draft'
   )
   -- ... rest of function body
   ```

### Updated Frontend Code

The frontend context has been updated to match the new parameter order:

```typescript
const { data: createdId, error } = await supabase.rpc('create_assessment', {
  p_title: assessmentData.title,
  p_type: assessmentData.type,
  p_subject: assessmentData.subject,
  p_class_id: assessmentData.classId,
  p_teacher_id: "current-teacher-id",
  p_total_marks: assessmentData.totalMarks,
  p_assessment_date: assessmentData.date,
  p_description: null,
  p_passing_marks: 50.0,
  p_weight_percentage: 100.0,
  p_due_date: null,
  p_status: "draft"
});
```

### Testing the Fix

After running the fixed script, test with:

```sql
-- Test the function with explicit type casting
SELECT create_assessment(
    'Test Assessment'::VARCHAR(255),
    'quiz'::VARCHAR(20),
    'Mathematics'::VARCHAR(100),
    'class-1'::VARCHAR(255),
    'teacher-1'::VARCHAR(255),
    20.00::DECIMAL(5,2),
    CURRENT_DATE::DATE
) as new_assessment_id;
```

**Or use the separate test script**:
```bash
psql -h your-host -U your-username -d your-database -f scripts/test-function.sql
```

### Common PostgreSQL Function Parameter Rules

1. **Required parameters first**: All parameters without defaults must come first
2. **Optional parameters last**: All parameters with defaults must come after required ones
3. **No mixing**: You cannot have a required parameter after an optional one

### Example of Correct Parameter Order

```sql
-- ✅ CORRECT
CREATE FUNCTION example(
    required1 VARCHAR(255),
    required2 INTEGER,
    optional1 TEXT DEFAULT NULL,
    optional2 BOOLEAN DEFAULT false
)

-- ❌ WRONG
CREATE FUNCTION example(
    required1 VARCHAR(255),
    optional1 TEXT DEFAULT NULL,  -- Has default
    required2 INTEGER,            -- No default after one with default (ERROR!)
    optional2 BOOLEAN DEFAULT false
)
```

### Verification

After running the fixed script, verify everything works:

```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'create_assessment';

-- Test the function with explicit type casting
SELECT create_assessment(
    'Test Assessment'::VARCHAR(255),
    'quiz'::VARCHAR(20),
    'Mathematics'::VARCHAR(100),
    'class-1'::VARCHAR(255),
    'teacher-1'::VARCHAR(255),
    20.00::DECIMAL(5,2),
    CURRENT_DATE::DATE
);
```

**For comprehensive testing**, run the separate test script:
```bash
psql -h your-host -U your-username -d your-database -f scripts/test-function.sql
```

The fixed script should now run without errors! 🎉
