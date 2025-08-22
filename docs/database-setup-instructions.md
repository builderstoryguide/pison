# Database Setup Instructions for Teacher Grades CRUD Operations

## Overview

This document provides step-by-step instructions for setting up the database schema and functions required for the teacher grades CRUD operations.

## Prerequisites

- PostgreSQL database (version 12 or higher)
- Supabase project (if using Supabase)
- Database access with CREATE, INSERT, UPDATE, DELETE permissions

## Database Schema

The teacher grades system uses two main tables:

### 1. Assessments Table
Stores assessment information created by teachers.

**Key Fields:**
- `id`: UUID primary key
- `assessment_id`: Unique identifier (format: ASSYYYYNNNN)
- `title`: Assessment title
- `type`: Assessment type (quiz, test, exam, assignment, project, midterm, final)
- `subject`: Subject name
- `class_id`: Target class identifier
- `teacher_id`: Teacher identifier
- `total_marks`: Maximum marks possible
- `assessment_date`: Date of assessment
- `status`: Assessment status (draft, published, completed, archived)

### 2. Grades Table
Stores individual student grades for assessments.

**Key Fields:**
- `id`: UUID primary key
- `grade_id`: Unique identifier (format: GRDYYYYNNNN)
- `assessment_id`: Reference to assessment
- `student_id`: Student identifier
- `teacher_id`: Teacher identifier
- `marks_obtained`: Actual marks scored
- `percentage`: Calculated percentage
- `grade_letter`: Letter grade (A, B, C, D, E, F)
- `grade_point`: Grade point value

## Setup Instructions

### Step 1: Run the Database Script

1. **Download the script**: `scripts/teacher-grades-crud-setup.sql`

2. **Execute the script** in your database:
   ```bash
   # Using psql
   psql -h your-host -U your-username -d your-database -f scripts/teacher-grades-crud-setup.sql
   
   # Using Supabase CLI
   supabase db reset
   # Then run the script in the Supabase dashboard SQL editor
   ```

3. **Verify the setup** by running the verification queries at the end of the script.

### Step 2: Verify Installation

Run these queries to verify everything was created correctly:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assessments', 'grades');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%assessment%' OR routine_name LIKE '%grade%';

-- Check views
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE '%assessment%' OR table_name LIKE '%grade%';

-- Check sample data
SELECT COUNT(*) as assessment_count FROM assessments;
SELECT COUNT(*) as grade_count FROM grades;
```

## CRUD Operations

### Assessment Operations

#### Create Assessment
```sql
SELECT create_assessment(
    'Mathematics Quiz 1',           -- title
    'Basic algebra operations',     -- description
    'quiz',                        -- type
    'Mathematics',                 -- subject
    'class-1',                     -- class_id
    'teacher-1',                   -- teacher_id
    20.00,                         -- total_marks
    50.00,                         -- passing_marks
    100.00,                        -- weight_percentage
    '2024-01-15',                  -- assessment_date
    '2024-01-20',                  -- due_date
    'draft'                        -- status
);
```

#### Read Assessment
```sql
-- Get assessment by ID
SELECT * FROM get_assessment_by_id('assessment-uuid-here');

-- Get assessments by teacher
SELECT * FROM get_assessments_by_teacher('teacher-1');
```

#### Update Assessment
```sql
SELECT update_assessment(
    'assessment-uuid-here',        -- assessment_id
    'Updated Title',               -- title (optional)
    'Updated description',         -- description (optional)
    'test',                        -- type (optional)
    'Physics',                     -- subject (optional)
    25.00,                         -- total_marks (optional)
    60.00,                         -- passing_marks (optional)
    100.00,                        -- weight_percentage (optional)
    '2024-01-16',                  -- assessment_date (optional)
    '2024-01-25',                  -- due_date (optional)
    'published'                    -- status (optional)
);
```

#### Delete Assessment
```sql
SELECT delete_assessment('assessment-uuid-here');
```

### Grade Operations

#### Create Grade
```sql
SELECT create_grade(
    'assessment-uuid-here',        -- assessment_id
    'student-1',                   -- student_id
    'teacher-1',                   -- teacher_id
    18.00,                         -- marks_obtained
    'Excellent work!',             -- remarks (optional)
    'Detailed feedback',           -- feedback (optional)
    false,                         -- is_late (optional)
    false,                         -- is_absent (optional)
    false                          -- is_excused (optional)
);
```

#### Read Grades
```sql
-- Get grades by assessment
SELECT * FROM get_grades_by_assessment('assessment-uuid-here');

-- Get grades by student (using view)
SELECT * FROM student_grades_view WHERE student_id = 'student-1';
```

#### Update Grade
```sql
SELECT update_grade(
    'grade-uuid-here',             -- grade_id
    19.00,                         -- marks_obtained (optional)
    'Updated remarks',             -- remarks (optional)
    'Updated feedback',            -- feedback (optional)
    false,                         -- is_late (optional)
    false,                         -- is_absent (optional)
    false                          -- is_excused (optional)
);
```

#### Delete Grade
```sql
SELECT delete_grade('grade-uuid-here');
```

## Views for Analytics

### Assessment Details View
Provides assessment information with statistics:
```sql
SELECT * FROM assessment_details_view;
```

### Student Grades View
Shows student grades with assessment details:
```sql
SELECT * FROM student_grades_view WHERE student_id = 'student-1';
```

### Teacher Assessments View
Shows teacher's assessments with grade statistics:
```sql
SELECT * FROM teacher_assessments_view WHERE teacher_id = 'teacher-1';
```

## Integration with Application

### Frontend Integration

The application uses these database functions through the Supabase client:

```typescript
// Create assessment
const { data, error } = await supabase.rpc('create_assessment', {
  p_title: 'Assessment Title',
  p_type: 'quiz',
  p_subject: 'Mathematics',
  p_class_id: 'class-1',
  p_teacher_id: 'teacher-1',
  p_total_marks: 20.00,
  p_assessment_date: '2024-01-15'
});

// Create grade
const { data, error } = await supabase.rpc('create_grade', {
  p_assessment_id: 'assessment-uuid',
  p_student_id: 'student-1',
  p_teacher_id: 'teacher-1',
  p_marks_obtained: 18.00,
  p_remarks: 'Good work!'
});
```

### Error Handling

The database functions include comprehensive error handling:

- **Validation errors**: Missing required fields, invalid data types
- **Constraint violations**: Duplicate entries, foreign key violations
- **Business logic errors**: Marks exceeding total marks, invalid dates

### Performance Considerations

- **Indexes**: All frequently queried fields are indexed
- **Views**: Pre-computed statistics for better performance
- **Functions**: Optimized queries with proper joins
- **Triggers**: Automatic timestamp updates

## Security Features

### Data Validation
- Input sanitization in database functions
- Constraint checks for data integrity
- Business rule enforcement

### Access Control
- Row-level security (RLS) can be implemented
- Function-level permissions
- Audit trail through triggers

## Troubleshooting

### Common Issues

1. **Function not found**: Ensure the script ran completely
2. **Permission denied**: Check database user permissions
3. **Constraint violation**: Verify data meets requirements
4. **UUID format error**: Ensure proper UUID format

### Debug Queries

```sql
-- Check function existence
SELECT routine_name, routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'create_assessment';

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'assessments';

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'assessments';
```

## Maintenance

### Regular Tasks

1. **Monitor performance**: Check query execution times
2. **Update statistics**: Run ANALYZE on tables periodically
3. **Backup data**: Regular database backups
4. **Review logs**: Monitor error logs for issues

### Backup and Restore

```bash
# Backup
pg_dump -h host -U user -d database > backup.sql

# Restore
psql -h host -U user -d database < backup.sql
```

## Support

For issues or questions:
1. Check the error logs
2. Verify database permissions
3. Test with sample data
4. Review the function definitions

The database setup provides a robust foundation for teacher grades management with comprehensive CRUD operations, validation, and analytics capabilities.
