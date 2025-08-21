# Attendance Management Database Schema

## Overview

This document describes the database schema for the Attendance Management system. The schema consists of two main tables: `attendance_sessions` and `attendance_records`, along with supporting views and triggers.

## Tables

### 1. attendance_sessions

Stores information about attendance sessions (classes/periods where attendance is taken).

**Columns:**
- `id` (UUID, Primary Key): Unique identifier for the session
- `class_id` (UUID, Foreign Key): Reference to the class (references students table for class identification)
- `class_name` (VARCHAR(100)): Name of the class (e.g., "Form 1A", "Form 2B")
- `date` (DATE): Date of the attendance session
- `period` (VARCHAR(50)): Time period (e.g., "Morning", "Afternoon", "Evening")
- `subject` (VARCHAR(100)): Subject being taught during the session
- `teacher_id` (UUID, Foreign Key): Reference to the teacher (references users table)
- `teacher_name` (VARCHAR(255)): Name of the teacher
- `total_students` (INTEGER): Total number of students in the session
- `present_count` (INTEGER): Number of students present
- `absent_count` (INTEGER): Number of students absent
- `late_count` (INTEGER): Number of students late
- `excused_count` (INTEGER): Number of students with excused absences
- `status` (VARCHAR(20)): Session status ('pending', 'completed', 'locked')
- `marked_at` (TIMESTAMP): When the session was marked
- `created_at` (TIMESTAMP): Record creation timestamp
- `updated_at` (TIMESTAMP): Record last update timestamp

**Constraints:**
- `status` must be one of: 'pending', 'completed', 'locked'

### 2. attendance_records

Stores individual student attendance records for each session.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier for the record
- `session_id` (UUID, Foreign Key): Reference to the attendance session
- `student_id` (UUID, Foreign Key): Reference to the student
- `student_name` (VARCHAR(255)): Name of the student
- `class_id` (UUID, Foreign Key): Reference to the class
- `class_name` (VARCHAR(100)): Name of the class
- `date` (DATE): Date of the attendance record
- `status` (VARCHAR(20)): Attendance status ('present', 'absent', 'late', 'excused')
- `marked_by` (UUID, Foreign Key): Reference to the user who marked the attendance
- `marked_at` (TIMESTAMP): When the attendance was marked
- `notes` (TEXT): Optional notes about the attendance
- `period` (VARCHAR(50)): Time period
- `subject` (VARCHAR(100)): Subject
- `created_at` (TIMESTAMP): Record creation timestamp
- `updated_at` (TIMESTAMP): Record last update timestamp

**Constraints:**
- `status` must be one of: 'present', 'absent', 'late', 'excused'
- Unique constraint on `(session_id, student_id)` to prevent duplicate records

## Indexes

### Performance Indexes

**attendance_sessions:**
- `idx_attendance_sessions_class_id`: For filtering by class
- `idx_attendance_sessions_date`: For date-based queries
- `idx_attendance_sessions_teacher_id`: For teacher-based queries
- `idx_attendance_sessions_status`: For status filtering
- `idx_attendance_sessions_period`: For period filtering
- `idx_attendance_sessions_subject`: For subject filtering
- `idx_attendance_sessions_class_date`: Composite index for class + date queries

**attendance_records:**
- `idx_attendance_records_session_id`: For session-based queries
- `idx_attendance_records_student_id`: For student-based queries
- `idx_attendance_records_class_id`: For class-based queries
- `idx_attendance_records_date`: For date-based queries
- `idx_attendance_records_status`: For status filtering
- `idx_attendance_records_marked_by`: For user-based queries
- `idx_attendance_records_student_date`: Composite index for student + date queries
- `idx_attendance_records_session_student`: Composite index for session + student queries

## Views

### 1. attendance_stats_view

Provides monthly attendance statistics by class.

**Columns:**
- `class_id`, `class_name`: Class identification
- `month`: Month (truncated to month)
- `total_sessions`: Number of sessions in the month
- `total_records`: Total attendance records
- `present_count`, `absent_count`, `late_count`, `excused_count`: Counts by status
- `attendance_rate`: Percentage of present students

### 2. student_attendance_summary_view

Provides attendance summary for each student.

**Columns:**
- `student_id`, `student_name`: Student identification
- `class_id`, `class_name`: Class identification
- `total_sessions`: Number of sessions attended
- `present_count`, `absent_count`, `late_count`, `excused_count`: Counts by status
- `attendance_rate`: Overall attendance percentage
- `last_absent`: Date of last absence
- `status`: Attendance status ('excellent', 'good', 'concerning', 'critical')

## Triggers and Functions

### 1. update_updated_at_column()

Automatically updates the `updated_at` timestamp when records are modified.

### 2. update_session_counts()

Automatically updates session counts (present, absent, late, excused, total) when attendance records are inserted, updated, or deleted.

**Triggers:**
- `update_session_counts_on_insert`: Fires after INSERT on attendance_records
- `update_session_counts_on_update`: Fires after UPDATE on attendance_records
- `update_session_counts_on_delete`: Fires after DELETE on attendance_records

## Relationships

```
attendance_sessions (1) ←→ (N) attendance_records
students (1) ←→ (N) attendance_records
users (1) ←→ (N) attendance_records (marked_by)
users (1) ←→ (N) attendance_sessions (teacher_id)
```

## Usage Examples

### Create a new attendance session
```sql
INSERT INTO attendance_sessions (class_id, class_name, date, period, subject, teacher_name, status)
VALUES ('class-uuid', 'Form 1A', '2024-01-15', 'Morning', 'Mathematics', 'John Smith', 'pending');
```

### Mark student attendance
```sql
INSERT INTO attendance_records (session_id, student_id, student_name, class_id, class_name, date, status, marked_by)
VALUES ('session-uuid', 'student-uuid', 'Alice Johnson', 'class-uuid', 'Form 1A', '2024-01-15', 'present', 'teacher-uuid');
```

### Get attendance statistics for a class
```sql
SELECT * FROM attendance_stats_view 
WHERE class_id = 'class-uuid' 
AND month >= '2024-01-01' 
AND month <= '2024-01-31';
```

### Get student attendance summary
```sql
SELECT * FROM student_attendance_summary_view 
WHERE student_id = 'student-uuid';
```

## Security Considerations

1. **Row Level Security (RLS)**: Consider implementing RLS policies to restrict access based on user roles
2. **Audit Trail**: The `created_at` and `updated_at` fields provide basic audit information
3. **Data Integrity**: Foreign key constraints ensure referential integrity
4. **Permissions**: Grant only necessary permissions to application users

## Migration Notes

When running the SQL script:
1. Ensure the `uuid-ossp` extension is available
2. The script uses `IF NOT EXISTS` to prevent errors on re-runs
3. Sample data is commented out by default - uncomment if needed for testing
4. Adjust permissions as needed for your database setup

## Future Enhancements

1. **Attendance Patterns**: Add views for identifying attendance patterns
2. **Notifications**: Add triggers for sending notifications on consecutive absences
3. **Reporting**: Add more comprehensive reporting views
4. **Audit Log**: Add separate audit table for tracking changes
5. **Bulk Operations**: Add functions for bulk attendance operations
