# Timetable Management Troubleshooting Guide

## Overview

This guide helps you resolve common issues with the Timetable Management System. If you encounter errors or problems, follow the steps below to diagnose and fix them.

## Common Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

### What This Error Means
This error occurs when the API endpoint returns an HTML page instead of JSON data. This typically happens when:
1. Database tables don't exist
2. Environment variables are not configured
3. Supabase connection issues

### Quick Fix Steps

#### Step 1: Check Environment Variables
Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Step 2: Run Database Setup Script
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire content of `scripts/timetable-database-setup.sql`
4. Click "Run" to execute the script

#### Step 3: Insert Sample Data
1. In Supabase SQL Editor, run the sample data script:
   ```sql
   -- Copy and paste the content of scripts/insert-sample-timetable-classes.sql
   ```
2. This will create sample classes, teachers, rooms, and subjects

#### Step 4: Test Database Connection
Visit `/api/timetable/test` in your browser to test the database connection. You should see:

```json
{
  "success": true,
  "message": "Timetable database connection successful",
  "classCount": 0
}
```

#### Step 5: Verify Tables Exist
In Supabase SQL Editor, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'timetable_%';
```

You should see these tables:
- `timetable_classes`
- `timetable_teachers`
- `timetable_rooms`
- `timetable_subjects`
- `timetable_periods`
- `timetable_schedules`
- `timetable_constraints`
- `timetable_time_slots`
- `timetable_teacher_subjects`

## Database Schema Issues

### Error: "column does not exist"
If you get errors about missing columns, ensure you've run the complete database setup script.

**Solution:**
1. Drop existing tables (if any):
   ```sql
   DROP TABLE IF EXISTS timetable_periods CASCADE;
   DROP TABLE IF EXISTS timetable_schedules CASCADE;
   DROP TABLE IF EXISTS timetable_constraints CASCADE;
   DROP TABLE IF EXISTS timetable_time_slots CASCADE;
   DROP TABLE IF EXISTS timetable_teacher_subjects CASCADE;
   DROP TABLE IF EXISTS timetable_rooms CASCADE;
   DROP TABLE IF EXISTS timetable_subjects CASCADE;
   DROP TABLE IF EXISTS timetable_teachers CASCADE;
   DROP TABLE IF EXISTS timetable_classes CASCADE;
   ```

2. Run the complete setup script again:
   ```sql
   -- Copy and paste scripts/timetable-database-setup.sql
   ```

### Error: "relation does not exist"
This means the database tables haven't been created.

**Solution:**
1. Run the database setup script
2. Verify tables exist using the query above
3. Check for any SQL errors in the Supabase logs

## API Endpoint Issues

### Test API Endpoints
Test each endpoint individually:

1. **Classes API**: Visit `/api/timetable/classes`
   - Should return JSON with classes array
   - If empty, run the sample data script

2. **Timetable API**: Visit `/api/timetable`
   - Should return JSON with timetables array

3. **Test API**: Visit `/api/timetable/test`
   - Should return connection status

### Common API Errors

#### "Database not set up" Error
**Cause**: Tables don't exist or environment variables are missing
**Solution**: 
1. Run the database setup script
2. Check environment variables
3. Restart your development server

#### "Missing environment variables" Error
**Cause**: Supabase credentials not configured
**Solution**:
1. Check `.env.local` file
2. Ensure variables are correctly named
3. Restart development server

#### "Permission denied" Error
**Cause**: Using wrong API key
**Solution**:
1. Use the service role key, not the anon key
2. Check Supabase project settings

## Frontend Issues

### Filters Not Working
**Symptoms**: 
- Filters don't update the class list
- Classes don't change when selecting different options

**Solutions**:
1. Check browser console for errors
2. Verify API endpoints are working
3. Ensure classes exist in the database
4. Check network tab for failed requests

### Empty Class List
**Symptoms**: 
- No classes shown in dropdown
- "No classes found" message

**Solutions**:
1. Run the sample data script
2. Check if classes are active in database
3. Verify API response format
4. Check for database connection issues

### Timetable Generation Fails
**Symptoms**:
- "Failed to generate timetable" error
- No periods created

**Solutions**:
1. Ensure teachers exist and are assigned to subjects
2. Check if rooms are available
3. Verify subjects are configured
4. Check database function exists

## Sample Data Setup

### Insert Sample Classes
If you need to add classes manually:

```sql
INSERT INTO timetable_classes (name, level, subsystem, branch, academic_year, is_active) VALUES
('Form 1A', 'Form 1', 'english', 'grammar', '2024-2025', true),
('Form 2B', 'Form 2', 'english', 'technical', '2024-2025', true);
```

### Insert Sample Teachers
```sql
INSERT INTO timetable_teachers (name, email, phone, max_periods_per_day, max_periods_per_week, is_active) VALUES
('Paul Biya Mbeki', 'p.mbeki@school.com', '+237 123456789', 6, 30, true);
```

### Insert Sample Rooms
```sql
INSERT INTO timetable_rooms (name, room_number, capacity, room_type, building, floor, is_active) VALUES
('Room 101', '101', 30, 'classroom', 'Main Building', 1, true);
```

### Insert Sample Subjects
```sql
INSERT INTO timetable_subjects (name, code, description, hours_per_week, is_active) VALUES
('Mathematics', 'MATH', 'Advanced Mathematics', 6, true);
```

## Debugging Steps

### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check for failed network requests

### Step 2: Check Network Tab
1. Go to Network tab in developer tools
2. Refresh the page
3. Look for failed API requests
4. Check response status codes

### Step 3: Check Supabase Logs
1. Go to Supabase Dashboard
2. Navigate to Logs
3. Look for error messages
4. Check for failed queries

### Step 4: Test Database Directly
1. Go to Supabase SQL Editor
2. Run test queries:
   ```sql
   SELECT COUNT(*) FROM timetable_classes;
   SELECT COUNT(*) FROM timetable_teachers;
   SELECT COUNT(*) FROM timetable_rooms;
   SELECT COUNT(*) FROM timetable_subjects;
   ```

## Environment Setup Checklist

- [ ] Supabase project created
- [ ] Environment variables configured in `.env.local`
- [ ] Database setup script executed
- [ ] Sample data inserted
- [ ] API endpoints tested
- [ ] Frontend components working
- [ ] Filters functioning properly
- [ ] Timetable generation working

## Common Solutions

### If Nothing Works
1. **Complete Reset**:
   - Drop all timetable tables
   - Run setup script again
   - Insert sample data
   - Test endpoints

2. **Check Supabase Project**:
   - Verify project is active
   - Check billing status
   - Ensure service role key is correct

3. **Development Server**:
   - Stop the server (Ctrl+C)
   - Clear cache: `npm run dev -- --clear`
   - Restart server

### Still Having Issues?
1. Check the browser console for specific error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are correctly set
4. Test the API endpoints directly in the browser
5. Check the Supabase logs for database errors

## Support

If you're still experiencing issues:
1. Check this troubleshooting guide
2. Review the database setup scripts
3. Test with the provided sample data
4. Check the API endpoints directly
5. Verify your Supabase project configuration
