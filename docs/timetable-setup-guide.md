# Timetable Management Setup Guide

## Overview

The Timetable Management System allows administrators to generate, view, and manage class timetables for the school. This comprehensive system provides automatic timetable generation with smart assignment of teachers, rooms, and subjects while preventing scheduling conflicts.

## Features

### ✅ Implemented Features

1. **Database Integration**
   - All timetable data is stored in Supabase database
   - Real-time data synchronization
   - Proper error handling for database connection issues

2. **Timetable Generation**
   - Automatic generation for selected classes
   - Smart teacher assignment based on subject expertise
   - Intelligent room allocation based on availability
   - Conflict resolution to prevent scheduling conflicts

3. **Timetable Management**
   - View timetables in weekly and daily formats
   - Edit existing timetables manually
   - Delete timetables for classes
   - Export timetables to CSV format

4. **Filtering and Search**
   - Filter by subsystem (English/French)
   - Filter by branch (Grammar/Technical/Commercial)
   - Class selection for specific operations

5. **Empty States and Loading**
   - Loading indicators during data fetching
   - Empty state when no classes exist
   - Empty state when filters return no results
   - Error states with retry functionality

## Database Schema

### Core Tables

#### `timetable_classes`
Stores class information for timetabling purposes.

#### `timetable_teachers`
Stores teacher information and scheduling preferences.

#### `timetable_rooms`
Stores room information and availability for scheduling.

#### `timetable_subjects`
Stores subject definitions and requirements.

#### `timetable_periods`
Stores individual timetable periods with all assignments.

#### `timetable_schedules`
Stores complete timetable schedules for academic terms.

#### `timetable_constraints`
Stores scheduling constraints and rules.

#### `timetable_time_slots`
Stores available time slots for scheduling.

## API Endpoints

### GET `/api/timetable`
Retrieve timetables with optional filtering.

**Query Parameters:**
- `classId` - Filter by specific class
- `subsystem` - Filter by subsystem
- `branch` - Filter by branch
- `academicYear` - Filter by academic year

### POST `/api/timetable`
Generate timetable for a class.

**Request Body:**
```json
{
  "classId": "uuid",
  "academicYear": "2024-2025",
  "term": "first",
  "generatedBy": "admin-user-id"
}
```

### DELETE `/api/timetable?classId=uuid`
Delete timetable for a class.

### GET `/api/timetable/classes`
Retrieve classes for timetable management.

### POST `/api/timetable/classes`
Create a new class for timetable management.

## Setup Instructions

### Step 1: Database Setup

1. **Run the Database Setup Script**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Copy and paste the entire content of `scripts/timetable-database-setup.sql`
   - Click "Run" to execute the script

2. **Verify Tables Created**
   Run this query to verify all tables exist:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'timetable_%';
   ```

### Step 2: Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Test the System

1. **Test API Endpoints**
   - Visit `/api/timetable/classes` to test class fetching
   - Visit `/api/timetable` to test timetable fetching

2. **Test User Interface**
   - Visit `/test-timetable` to test the complete system

## Usage Guide

### For Administrators

1. **Access Timetable Management**
   - Log in as an administrator
   - Navigate to "Timetable Management" in the sidebar

2. **Generate a Timetable**
   - Select the desired subsystem and branch filters
   - Choose a specific class from the dropdown
   - Click "Generate Timetable"
   - Wait for the generation process to complete

3. **View Timetables**
   - Generated timetables appear in the "Class Timetables" table
   - Click on a class to view its detailed timetable
   - Switch between weekly and daily views using the tabs

4. **Export Timetables**
   - Click the actions dropdown for any class
   - Select "Export CSV"
   - The timetable will be downloaded as a CSV file

5. **Delete Timetables**
   - Click the actions dropdown for any class
   - Select "Delete Timetable"
   - Confirm the deletion

## Time Slots

The system uses the following time slots:
- 08:00-08:45 (Period 1)
- 08:45-09:30 (Period 2)
- 09:30-10:15 (Period 3)
- 10:15-11:00 (Period 4)
- 11:00-11:45 (Period 5)
- 11:45-12:30 (Period 6)
- 12:30-13:15 (Period 7)
- 13:15-14:00 (Period 8)
- 14:00-14:45 (Period 9)
- 14:45-15:30 (Period 10)
- 15:30-16:15 (Period 11)
- 16:15-17:00 (Period 12)

## Days of the Week

- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

## Empty States

The system provides appropriate empty states for different scenarios:

1. **No Classes**: When no classes are configured in the database
2. **No Filter Results**: When filters return no matches
3. **Loading**: During data fetching
4. **Error**: When database connection fails

## Troubleshooting

### Common Issues

1. **"Database not configured" Error**
   - **Solution**: Run the timetable database setup script in Supabase SQL Editor

2. **"No classes found" Error**
   - **Solution**: Ensure classes are properly configured in the `timetable_classes` table

3. **"Failed to generate timetable" Error**
   - **Solution**: Check that teachers, rooms, and subjects are properly configured

4. **API Errors**
   - **Solution**: Verify environment variables and Supabase permissions

### Debug Steps

1. **Check Database Tables**
   ```sql
   SELECT COUNT(*) FROM timetable_classes;
   SELECT COUNT(*) FROM timetable_teachers;
   SELECT COUNT(*) FROM timetable_rooms;
   SELECT COUNT(*) FROM timetable_subjects;
   ```

2. **Test API Endpoints**
   - Visit `/api/timetable/classes` in browser
   - Check browser console for errors
   - Verify API responses in Network tab

3. **Check Supabase Logs**
   - Go to Supabase Dashboard > Logs
   - Look for any error messages

## Sample Data Setup

### Insert Sample Classes
```sql
INSERT INTO timetable_classes (name, level, subsystem, branch, academic_year) VALUES
('Form 1A', 'Form 1', 'english', 'grammar', '2024-2025'),
('Form 2B', 'Form 2', 'english', 'technical', '2024-2025'),
('Form 5 Science', 'Form 5', 'english', 'grammar', '2024-2025'),
('Sixième A', 'Sixième', 'french', 'grammar', '2024-2025');
```

### Insert Sample Teachers
```sql
INSERT INTO timetable_teachers (name, email, max_periods_per_day, max_periods_per_week) VALUES
('Paul Biya Mbeki', 'p.mbeki@school.com', 6, 30),
('Marie Ngozi', 'm.ngozi@school.com', 6, 30),
('Jean Claude', 'j.claude@school.com', 6, 30);
```

### Insert Sample Rooms
```sql
INSERT INTO timetable_rooms (name, room_type, capacity) VALUES
('Room 101', 'classroom', 30),
('Room 102', 'classroom', 30),
('Science Lab 1', 'laboratory', 25),
('Computer Lab', 'laboratory', 20);
```

### Insert Sample Subjects
```sql
INSERT INTO timetable_subjects (name, code, description, hours_per_week) VALUES
('Mathematics', 'MATH', 'Advanced Mathematics', 6),
('English Language', 'ENG', 'English Language and Literature', 5),
('Biology', 'BIO', 'Biology and Life Sciences', 4),
('Chemistry', 'CHEM', 'Chemistry and Laboratory', 4);
```

## Testing

### Test Page
Visit `/test-timetable` to test the complete timetable management system.

### Database Testing
1. Ensure all database tables exist
2. Verify API endpoints are working
3. Test timetable generation and management
4. Verify empty states and error handling

## Future Enhancements

1. **Advanced Scheduling Algorithms**
   - Genetic algorithm optimization
   - Constraint satisfaction algorithms
   - Multi-objective optimization

2. **Teacher Preferences**
   - Preferred time slots
   - Preferred days
   - Workload balancing

3. **Room Management**
   - Room capacity optimization
   - Special equipment requirements
   - Room maintenance scheduling

4. **Student Groups**
   - Split class scheduling
   - Group rotation
   - Special needs accommodations

## Support

For issues or questions about the Timetable Management System:
1. Check this documentation
2. Review the database setup scripts
3. Test with the provided test page
4. Check the API endpoints directly
