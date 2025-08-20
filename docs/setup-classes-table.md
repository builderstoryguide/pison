# Setup Guide: Classes Table for Class Creation Feature

## Overview

This guide will help you set up the required `classes` table in your Supabase database to enable the class creation functionality.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Database Access**: Access to your Supabase SQL Editor
3. **Environment Variables**: Your Supabase URL and anon key configured

## Step-by-Step Setup

### Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Create the Classes Table

1. In the SQL Editor, create a new query
2. Copy and paste the entire content from `scripts/create-classes-table.sql`
3. Click **Run** to execute the script

**Expected Output:**
```
✅ Classes table created successfully!
Sample records count: 4
```

### Step 3: Verify the Setup

1. Create another new query in the SQL Editor
2. Copy and paste the content from `scripts/verify-classes-table.sql`
3. Click **Run** to verify the setup

**Expected Output:**
```
✅ Classes table exists
```

### Step 4: Test the Connection

1. Go to your application
2. Navigate to `/test-class-creation`
3. Click **Test Connection**
4. You should see "Database connection successful!"

## Table Structure

The `classes` table includes the following fields:

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | UUID | Unique identifier | Auto-generated |
| `class_name` | VARCHAR(100) | Class name (e.g., "Form 1A") | Yes |
| `class_level` | VARCHAR(50) | Class level (e.g., "Form 1") | Yes |
| `stream` | VARCHAR(50) | Stream/branch (grammar/technical/commercial) | Yes |
| `subsystem` | VARCHAR(20) | Subsystem (english/french) | Yes |
| `academic_year` | VARCHAR(20) | Academic year (e.g., "2024/2025") | Yes |
| `capacity` | INTEGER | Maximum students allowed | Yes (default: 40) |
| `current_enrollment` | INTEGER | Current students enrolled | No (default: 0) |
| `class_teacher_id` | UUID | Teacher assigned to class | No |
| `status` | VARCHAR(20) | Class status (active/inactive) | No (default: active) |
| `created_at` | TIMESTAMP | Creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMP | Last update timestamp | Auto-updated |

## Features Included

### ✅ Database Constraints
- **Primary Key**: UUID auto-generated
- **Check Constraints**: Valid values for stream, subsystem, status
- **Capacity Limits**: 1-100 students
- **Enrollment Limits**: Non-negative values

### ✅ Performance Optimizations
- **Indexes**: On frequently queried columns
- **Automatic Timestamps**: Updated_at automatically managed
- **Efficient Queries**: Optimized for common operations

### ✅ Sample Data
- **4 Sample Classes**: Pre-populated for testing
- **Mixed Subsystems**: Both English and French examples
- **Various Streams**: Grammar, Technical examples

### ✅ Database Views
- **classes_overview**: Enhanced view with utilization percentage
- **Easy Querying**: Simplified data access

## Troubleshooting

### Issue: "Table already exists"
**Solution**: The script uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### Issue: "Permission denied"
**Solution**: 
1. Check your Supabase project permissions
2. Ensure you're using the correct database role
3. Contact your Supabase admin if needed

### Issue: "Connection failed"
**Solution**:
1. Verify your environment variables are correct
2. Check if your Supabase project is active
3. Test the connection in the Supabase dashboard

### Issue: "Invalid data type"
**Solution**:
1. Ensure you're using the latest script version
2. Check that all constraints are properly defined
3. Verify the data types match your application expectations

## Testing the Setup

### 1. Database Connection Test
```sql
-- Test basic connection
SELECT COUNT(*) FROM classes;
```

### 2. Insert Test Data
```sql
-- Insert a test class
INSERT INTO classes (class_name, class_level, stream, subsystem, academic_year, capacity)
VALUES ('Test Class', 'Form 1', 'grammar', 'english', '2024/2025', 30);
```

### 3. Query Test Data
```sql
-- Query the test class
SELECT * FROM classes WHERE class_name = 'Test Class';
```

## Next Steps

After setting up the classes table:

1. **Test Class Creation**: Use the `/test-class-creation` page
2. **Create Real Classes**: Use the admin dashboard
3. **Monitor Performance**: Check query performance in Supabase
4. **Backup Data**: Set up regular backups for your data

## Support

If you encounter any issues:

1. **Check the logs**: Look at the Supabase logs for errors
2. **Verify setup**: Run the verification script
3. **Test connection**: Use the test page in your application
4. **Review documentation**: Check the main project documentation

---

**Note**: This setup is required for the class creation feature to work properly. Without this table, you'll see the "Could not find the table 'public.classes'" error.
