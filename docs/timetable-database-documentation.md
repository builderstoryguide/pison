# Timetable Management Database Documentation

## Overview

This document provides comprehensive documentation for the timetable management database schema, including table structures, relationships, functions, views, and usage instructions.

## Database Schema

### Core Tables

#### 1. `timetable_classes`
Stores class information for timetabling purposes.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `class_id` (UUID, Foreign Key): References `classes(id)`
- `name` (VARCHAR(100)): Class name
- `level` (VARCHAR(50)): Academic level (e.g., "Form 1", "Form 2")
- `subsystem` (VARCHAR(20)): English or French subsystem
- `branch` (VARCHAR(20)): Grammar, Technical, or Commercial branch
- `academic_year` (VARCHAR(20)): Academic year
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(class_id, academic_year)`
- Check constraint on `subsystem` (english/french)
- Check constraint on `branch` (grammar/technical/commercial)

#### 2. `timetable_teachers`
Stores teacher information and scheduling preferences.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `teacher_id` (UUID, Foreign Key): References `teachers(id)`
- `name` (VARCHAR(200)): Teacher name
- `email` (VARCHAR(255)): Email address
- `phone` (VARCHAR(50)): Phone number
- `max_periods_per_day` (INTEGER): Maximum periods per day (default: 6)
- `max_periods_per_week` (INTEGER): Maximum periods per week (default: 30)
- `preferred_days` (TEXT[]): Array of preferred days
- `preferred_times` (TEXT[]): Array of preferred time slots
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `teacher_id`

#### 3. `timetable_rooms`
Stores room information and availability for scheduling.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `name` (VARCHAR(100)): Room name
- `room_number` (VARCHAR(20)): Room number
- `capacity` (INTEGER): Room capacity
- `room_type` (VARCHAR(50)): Type of room
- `building` (VARCHAR(100)): Building name
- `floor` (INTEGER): Floor number
- `equipment` (TEXT[]): Array of available equipment
- `is_available` (BOOLEAN): Availability status
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(name, building)`
- Check constraint on `room_type` (classroom/laboratory/library/hall/computer_lab/science_lab)

#### 4. `timetable_subjects`
Stores subject definitions and requirements.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `name` (VARCHAR(100)): Subject name
- `code` (VARCHAR(20)): Subject code
- `description` (TEXT): Subject description
- `credits` (INTEGER): Credit hours (default: 1)
- `hours_per_week` (INTEGER): Hours per week (default: 5)
- `subject_type` (VARCHAR(50)): Core, elective, or optional
- `applicable_subsystems` (TEXT[]): Applicable subsystems
- `applicable_branches` (TEXT[]): Applicable branches
- `applicable_levels` (TEXT[]): Applicable levels
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `code`
- Check constraint on `subject_type` (core/elective/optional)

#### 5. `timetable_teacher_subjects`
Maps teachers to subjects they can teach.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `teacher_id` (UUID, Foreign Key): References `timetable_teachers(id)`
- `subject_id` (UUID, Foreign Key): References `timetable_subjects(id)`
- `proficiency_level` (VARCHAR(20)): Beginner, intermediate, or expert
- `years_of_experience` (INTEGER): Years of experience
- `is_primary` (BOOLEAN): Primary subject for teacher
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(teacher_id, subject_id)`
- Check constraint on `proficiency_level` (beginner/intermediate/expert)

#### 6. `timetable_periods`
Stores individual timetable periods with all assignments.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `schedule_id` (UUID): References timetable schedules
- `class_id` (UUID, Foreign Key): References `timetable_classes(id)`
- `subject_id` (UUID, Foreign Key): References `timetable_subjects(id)`
- `teacher_id` (UUID, Foreign Key): References `timetable_teachers(id)`
- `room_id` (UUID, Foreign Key): References `timetable_rooms(id)`
- `day_of_week` (VARCHAR(20)): Day of the week
- `start_time` (TIME): Start time
- `end_time` (TIME): End time
- `period_number` (INTEGER): Period number
- `period_type` (VARCHAR(20)): Type of period
- `is_break` (BOOLEAN): Break period flag
- `notes` (TEXT): Additional notes
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(class_id, day_of_week, start_time)`
- Unique constraint on `(teacher_id, day_of_week, start_time)`
- Unique constraint on `(room_id, day_of_week, start_time)`
- Check constraint on `day_of_week` (Monday-Saturday)
- Check constraint on `period_type` (regular/break/lunch/assembly/exam)

#### 7. `timetable_schedules`
Stores complete timetable schedules for academic terms.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `name` (VARCHAR(200)): Schedule name
- `academic_year` (VARCHAR(20)): Academic year
- `term` (VARCHAR(20)): Academic term
- `start_date` (DATE): Start date
- `end_date` (DATE): End date
- `is_active` (BOOLEAN): Active status
- `is_template` (BOOLEAN): Template flag
- `created_by` (UUID, Foreign Key): References `users(id)`
- `approved_by` (UUID, Foreign Key): References `users(id)`
- `approved_at` (TIMESTAMP): Approval timestamp
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(academic_year, term)`
- Check constraint on `term` (first/second/third)

#### 8. `timetable_constraints`
Stores scheduling constraints and rules.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `constraint_type` (VARCHAR(50)): Type of constraint
- `constraint_name` (VARCHAR(200)): Constraint name
- `description` (TEXT): Constraint description
- `teacher_id` (UUID, Foreign Key): References `timetable_teachers(id)`
- `room_id` (UUID, Foreign Key): References `timetable_rooms(id)`
- `subject_id` (UUID, Foreign Key): References `timetable_subjects(id)`
- `day_of_week` (VARCHAR(20)): Day of week
- `start_time` (TIME): Start time
- `end_time` (TIME): End time
- `is_blocked` (BOOLEAN): Blocked or preferred
- `priority` (INTEGER): Priority level (1-5)
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Check constraint on `constraint_type` (teacher_availability/room_availability/subject_requirement/break_requirement/lunch_requirement)
- Check constraint on `priority` (1-5)

#### 9. `timetable_time_slots`
Defines available time slots for scheduling.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `slot_name` (VARCHAR(50)): Slot name
- `start_time` (TIME): Start time
- `end_time` (TIME): End time
- `duration_minutes` (INTEGER): Duration in minutes
- `slot_number` (INTEGER): Slot number
- `is_break` (BOOLEAN): Break slot flag
- `break_type` (VARCHAR(20)): Type of break
- `is_active` (BOOLEAN): Active status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Constraints:**
- Unique constraint on `(start_time, end_time)`
- Check constraint on `break_type` (regular/lunch/assembly)

#### 10. `timetable_generation_logs`
Logs timetable generation attempts and results.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `generation_type` (VARCHAR(50)): Type of generation
- `class_id` (UUID, Foreign Key): References `timetable_classes(id)`
- `generated_by` (UUID, Foreign Key): References `users(id)`
- `status` (VARCHAR(20)): Generation status
- `total_periods_generated` (INTEGER): Total periods generated
- `conflicts_resolved` (INTEGER): Conflicts resolved
- `generation_time_seconds` (INTEGER): Generation time
- `error_message` (TEXT): Error message
- `generated_at` (TIMESTAMP): Generation timestamp
- `completed_at` (TIMESTAMP): Completion timestamp

**Constraints:**
- Check constraint on `generation_type` (automatic/manual/regenerate)
- Check constraint on `status` (started/completed/failed/cancelled)

## Database Views

### 1. `v_class_timetables`
Provides a comprehensive view of class timetables with all related information.

**Usage:**
```sql
SELECT * FROM v_class_timetables WHERE class_id = 'uuid';
```

### 2. `v_teacher_timetables`
Provides a comprehensive view of teacher timetables with all related information.

**Usage:**
```sql
SELECT * FROM v_teacher_timetables WHERE teacher_id = 'uuid';
```

### 3. `v_room_timetables`
Provides a comprehensive view of room timetables with all related information.

**Usage:**
```sql
SELECT * FROM v_room_timetables WHERE room_id = 'uuid';
```

### 4. `v_timetable_conflicts`
Identifies and displays timetable conflicts.

**Usage:**
```sql
SELECT * FROM v_timetable_conflicts;
```

## Database Functions

### 1. `check_timetable_conflicts()`
Checks for conflicts when scheduling periods.

**Parameters:**
- `p_class_id` (UUID, optional): Class ID
- `p_teacher_id` (UUID, optional): Teacher ID
- `p_room_id` (UUID, optional): Room ID
- `p_day_of_week` (VARCHAR, optional): Day of week
- `p_start_time` (TIME, optional): Start time
- `p_end_time` (TIME, optional): End time

**Returns:** Table with conflict information

**Usage:**
```sql
SELECT * FROM check_timetable_conflicts(
    p_class_id := 'uuid',
    p_day_of_week := 'Monday',
    p_start_time := '08:00:00',
    p_end_time := '08:45:00'
);
```

### 2. `get_available_time_slots()`
Returns available time slots for a given day and entity.

**Parameters:**
- `p_day_of_week` (VARCHAR): Day of week
- `p_class_id` (UUID, optional): Class ID
- `p_teacher_id` (UUID, optional): Teacher ID
- `p_room_id` (UUID, optional): Room ID

**Returns:** Table with available time slots

**Usage:**
```sql
SELECT * FROM get_available_time_slots(
    p_day_of_week := 'Monday',
    p_class_id := 'uuid'
);
```

### 3. `generate_class_timetable()`
Generates a complete timetable for a class.

**Parameters:**
- `p_class_id` (UUID): Class ID
- `p_academic_year` (VARCHAR): Academic year
- `p_term` (VARCHAR): Academic term
- `p_generated_by` (UUID): User ID who generated the timetable

**Returns:** Schedule ID (UUID)

**Usage:**
```sql
SELECT generate_class_timetable(
    p_class_id := 'uuid',
    p_academic_year := '2024-2025',
    p_term := 'first',
    p_generated_by := 'user_uuid'
);
```

## Indexes

The database includes comprehensive indexes for optimal performance:

### Timetable Classes Indexes
- `idx_timetable_classes_subsystem`: Index on subsystem
- `idx_timetable_classes_branch`: Index on branch
- `idx_timetable_classes_academic_year`: Index on academic year
- `idx_timetable_classes_active`: Index on active status

### Timetable Teachers Indexes
- `idx_timetable_teachers_active`: Index on active status
- `idx_timetable_teachers_name`: Index on teacher name

### Timetable Rooms Indexes
- `idx_timetable_rooms_type`: Index on room type
- `idx_timetable_rooms_available`: Index on availability
- `idx_timetable_rooms_capacity`: Index on capacity

### Timetable Periods Indexes
- `idx_timetable_periods_class_day`: Composite index on class and day
- `idx_timetable_periods_teacher_day`: Composite index on teacher and day
- `idx_timetable_periods_room_day`: Composite index on room and day
- `idx_timetable_periods_time`: Index on time slots

## Triggers

### Automatic Timestamp Updates
All tables include triggers that automatically update the `updated_at` timestamp when records are modified.

**Function:** `update_updated_at_column()`

## Sample Data

The database script includes sample data for:

### Time Slots
- 12 standard time slots (8:00 AM - 4:30 PM)
- Break and lunch periods
- 45-minute regular periods

### Subjects
- Core subjects: Mathematics, English, French, Biology, Chemistry, Physics
- Humanities: History, Geography
- Electives: Computer Science, Economics

### Rooms
- 8 different rooms with various types and capacities
- Equipment specifications
- Building and floor information

## Installation Instructions

### 1. Run the Database Script
```bash
psql -d your_database -f scripts/timetable-database-setup.sql
```

### 2. Verify Installation
```sql
-- Check if tables were created
\dt timetable_*

-- Check if views were created
\dv v_*

-- Check if functions were created
\df check_timetable_conflicts
\df get_available_time_slots
\df generate_class_timetable
```

### 3. Test Sample Data
```sql
-- Check sample time slots
SELECT * FROM timetable_time_slots;

-- Check sample subjects
SELECT * FROM timetable_subjects;

-- Check sample rooms
SELECT * FROM timetable_rooms;
```

## Usage Examples

### 1. Create a New Class Timetable
```sql
-- Insert a new class
INSERT INTO timetable_classes (class_id, name, level, subsystem, branch, academic_year)
VALUES ('existing_class_uuid', 'Form 1A', 'Form 1', 'english', 'grammar', '2024-2025');

-- Generate timetable for the class
SELECT generate_class_timetable(
    p_class_id := 'new_class_uuid',
    p_academic_year := '2024-2025',
    p_term := 'first',
    p_generated_by := 'admin_uuid'
);
```

### 2. Check for Conflicts
```sql
-- Check if a teacher has conflicts on Monday at 8:00 AM
SELECT * FROM check_timetable_conflicts(
    p_teacher_id := 'teacher_uuid',
    p_day_of_week := 'Monday',
    p_start_time := '08:00:00',
    p_end_time := '08:45:00'
);
```

### 3. Get Available Time Slots
```sql
-- Get available time slots for a class on Monday
SELECT * FROM get_available_time_slots(
    p_day_of_week := 'Monday',
    p_class_id := 'class_uuid'
);
```

### 4. View Class Timetable
```sql
-- View complete timetable for a class
SELECT * FROM v_class_timetables 
WHERE class_id = 'class_uuid' 
ORDER BY day_of_week, start_time;
```

### 5. Identify Conflicts
```sql
-- View all timetable conflicts
SELECT * FROM v_timetable_conflicts;
```

## Maintenance

### Regular Maintenance Tasks

1. **Clean up old generation logs:**
```sql
DELETE FROM timetable_generation_logs 
WHERE generated_at < CURRENT_DATE - INTERVAL '1 year';
```

2. **Update room availability:**
```sql
UPDATE timetable_rooms 
SET is_available = false 
WHERE room_type = 'maintenance';
```

3. **Archive old schedules:**
```sql
UPDATE timetable_schedules 
SET is_active = false 
WHERE end_date < CURRENT_DATE;
```

### Performance Monitoring

1. **Check index usage:**
```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename LIKE 'timetable_%';
```

2. **Monitor slow queries:**
```sql
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements 
WHERE query LIKE '%timetable%'
ORDER BY mean_time DESC;
```

## Security Considerations

1. **Row Level Security (RLS):** Consider implementing RLS for multi-tenant scenarios
2. **Data Encryption:** Ensure sensitive data is encrypted at rest
3. **Access Control:** Implement proper user roles and permissions
4. **Audit Logging:** Monitor all timetable modifications
5. **Backup Strategy:** Regular backups of timetable data

## Troubleshooting

### Common Issues

1. **Constraint Violations:**
   - Check for overlapping periods
   - Verify teacher availability
   - Ensure room availability

2. **Performance Issues:**
   - Check index usage
   - Monitor query performance
   - Consider partitioning for large datasets

3. **Data Integrity:**
   - Validate foreign key relationships
   - Check for orphaned records
   - Verify constraint compliance

### Debug Queries

```sql
-- Check for orphaned periods
SELECT * FROM timetable_periods tp
LEFT JOIN timetable_classes tc ON tp.class_id = tc.id
WHERE tc.id IS NULL;

-- Check for overlapping periods
SELECT * FROM v_timetable_conflicts;

-- Check generation logs for errors
SELECT * FROM timetable_generation_logs 
WHERE status = 'failed'
ORDER BY generated_at DESC;
```

## Conclusion

This database schema provides a comprehensive foundation for timetable management in the school management system. It includes all necessary tables, relationships, constraints, and functions to support efficient timetable generation, conflict detection, and management.

For additional support or questions, refer to the application documentation or contact the development team.
