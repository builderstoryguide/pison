# Database Setup Guide

## Prerequisites

1. A Supabase account and project
2. Supabase CLI (optional but recommended)

## Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Run the SQL script in `scripts/create-tables.sql` in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `scripts/create-tables.sql`
4. Execute the script

### 4. Verify Tables

After running the script, you should have these tables:

- `users` - User authentication and management
- `students` - Student records with enrollment data
- `parents` - Parent/guardian information
- `emergency_contacts` - Emergency contact details
- `medical_info` - Medical information
- `teachers` - Teacher records
- `student_fees` - Fee management
- `fee_payments` - Payment records
- `activity_logs` - System activity tracking
- `classes` - Class management
- `subjects` - Subject management
- `attendance_records` - Attendance tracking
- `examinations` - Exam management
- `exam_results` - Exam results

### 5. Test Connection

The application will automatically test the database connection when you:

1. Open the Student Management page
2. Try to enroll a new student

If the connection fails, the app will fall back to localStorage.

## Troubleshooting

### Connection Issues

1. Check your environment variables are correct
2. Ensure your Supabase project is active
3. Verify the database schema was applied correctly

### Enrollment Errors

1. Check the browser console for detailed error messages
2. Verify all required tables exist in your database
3. Ensure the student ID and parent code generation is working

### Local Development

For local development without a database:

1. The app will automatically use localStorage
2. All data will be stored locally in the browser
3. No external database connection required

## Database Schema Updates

If you need to update the database schema:

1. Make changes to `scripts/create-tables.sql`
2. Run the updated script in Supabase SQL Editor
3. The `CREATE TABLE IF NOT EXISTS` statements will handle existing tables safely

## Security Notes

- The anon key is safe to use in client-side code
- Row Level Security (RLS) policies should be configured for production
- Consider implementing proper authentication for admin functions
