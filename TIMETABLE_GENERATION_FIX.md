# Timetable Generation Duplicate Key Error Fix

## Problem Description

When trying to generate a timetable, you're encountering this error:

```
Error generating timetable: {
  code: '23505',
  details: 'Key (academic_year, term)=(2024-2025, first) already exists.',
  hint: null,
  message: 'duplicate key value violates unique constraint "timetable_schedules_academic_year_term_key"'
}
```

## Root Cause

The issue is in the `generate_class_timetable` database function in `scripts/timetable-database-setup.sql`. The function always tries to create a new schedule without checking if one already exists for the given academic year and term combination.

The `timetable_schedules` table has a unique constraint on `(academic_year, term)`, which means only one schedule can exist per academic year and term. However, the function doesn't handle this properly.

## Solution

### 1. Updated Database Function

I've created an enhanced version of the `generate_class_timetable` function that:

- **Checks for existing schedules** before creating new ones
- **Supports custom timetable parameters** (school start/end times, period duration, breaks, etc.)
- **Provides better error handling** and logging
- **Clears existing periods** for the class when regenerating

### 2. Files Modified/Created

1. **`scripts/fix-timetable-generation-function.sql`** - Contains the enhanced database function
2. **`scripts/run-timetable-fix.js`** - Node.js script to apply the fix
3. **`scripts/timetable-database-setup.sql`** - Updated with initial fix

### 3. How to Apply the Fix

#### Option A: Run the automated fix script

```bash
node scripts/run-timetable-fix.js
```

#### Option B: Manual database update

1. Connect to your Supabase database
2. Run the SQL commands from `scripts/fix-timetable-generation-function.sql`

#### Option C: Using Supabase SQL Editor

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/fix-timetable-generation-function.sql`
4. Execute the script

## Key Changes in the Enhanced Function

### 1. Existing Schedule Check
```sql
-- Check if schedule already exists for this academic year and term
SELECT id INTO v_schedule_id
FROM timetable_schedules
WHERE academic_year = p_academic_year AND term = p_term;

-- If schedule doesn't exist, create new one
IF v_schedule_id IS NULL THEN
    INSERT INTO timetable_schedules (name, academic_year, term, start_date, end_date, created_by, is_active)
    VALUES (
        'Schedule for ' || p_academic_year || ' - ' || INITCAP(p_term) || ' Term',
        p_academic_year,
        p_term,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '6 months',
        p_generated_by,
        true
    )
    RETURNING id INTO v_schedule_id;
END IF;
```

### 2. Custom Parameters Support
The function now accepts additional parameters:
- `p_school_start_time` - When school starts (default: 08:00)
- `p_school_end_time` - When school ends (default: 15:00)
- `p_period_duration` - Length of each period in minutes (default: 45)
- `p_break_duration` - Length of breaks in minutes (default: 15)
- `p_include_lunch_break` - Whether to include lunch break (default: true)
- `p_lunch_break_start_time` - When lunch starts (default: 12:00)
- `p_lunch_break_duration` - Lunch duration in minutes (default: 60)
- Custom periods per day for each weekday

### 3. Period Generation Logic
```sql
-- Clear any existing periods for this class and schedule
DELETE FROM timetable_periods 
WHERE class_id = p_class_id AND schedule_id = v_schedule_id;

-- Generate time slots and periods for each day
-- (Includes logic for regular periods, breaks, and lunch)
```

### 4. Better Error Handling
```sql
EXCEPTION
    WHEN OTHERS THEN
        -- Update generation log with error
        UPDATE timetable_generation_logs 
        SET 
            status = 'failed',
            error_message = SQLERRM,
            completed_at = NOW()
        WHERE id = v_generation_log_id;
        
        -- Re-raise the exception with context
        RAISE EXCEPTION 'Timetable generation failed for class %: %', v_class_name, SQLERRM;
```

## Testing the Fix

After applying the fix, test it by:

1. **Try generating a timetable** - Should work without duplicate key errors
2. **Try generating again for the same academic year/term** - Should reuse existing schedule
3. **Check the generated periods** - Should see proper time slots with breaks
4. **Verify custom parameters** - Test with different school hours, period durations, etc.

## API Endpoints Affected

The fix affects these API endpoints:
- `POST /api/timetable/generate-from-admin`
- `POST /api/timetable` (the main timetable generation endpoint)

Both endpoints call the `generate_class_timetable` database function, so they will both benefit from this fix.

## Additional Benefits

1. **Prevents data loss** - Reuses existing schedules instead of failing
2. **Supports customization** - Schools can now customize their timetable parameters
3. **Better logging** - Enhanced error messages and generation logs
4. **Cleaner regeneration** - Properly clears old periods when regenerating
5. **Flexible scheduling** - Supports different periods per day, custom breaks, etc.

## Verification

After applying the fix, you should see:
- ✅ No more duplicate key errors when generating timetables
- ✅ Ability to regenerate timetables for the same academic year/term
- ✅ Support for custom school hours and period durations
- ✅ Proper break and lunch period insertion
- ✅ Better error messages and logging

The timetable generation should now work smoothly for your school management system!
