# Timetable CSV Import Guide

## Overview

This guide explains how to import the timetable sample data using CSV files into your Supabase database. This method is more reliable than running SQL scripts and gives you better control over the import process.

## CSV Files Available

The following CSV files are located in the `data/` directory:

1. **`timetable-classes.csv`** - 20 classes (10 English, 10 French)
2. **`timetable-teachers.csv`** - 8 teachers with contact information
3. **`timetable-rooms.csv`** - 11 rooms (classrooms, labs, library, hall)
4. **`timetable-subjects.csv`** - 12 academic subjects
5. **`timetable-teacher-subjects.csv`** - Teacher-subject assignments
6. **`timetable-time-slots.csv`** - 12 time periods (including breaks)

## Import Order

**Important**: Import the files in this specific order to maintain referential integrity:

1. `timetable-classes.csv`
2. `timetable-teachers.csv`
3. `timetable-rooms.csv`
4. `timetable-subjects.csv`
5. `timetable-teacher-subjects.csv`
6. `timetable-time-slots.csv`

## Method 1: Supabase Dashboard Import

### Step 1: Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** in the left sidebar
3. Select the table you want to import data into

### Step 2: Import Each Table
For each table:

1. **Click on the table name** (e.g., `timetable_classes`)
2. **Click the "Import" button** (usually in the top-right)
3. **Select "CSV"** as the import format
4. **Upload the corresponding CSV file**
5. **Configure import settings**:
   - **Header row**: Yes (first row contains column names)
   - **Delimiter**: Comma (,)
   - **Quote character**: Double quote (")
   - **Encoding**: UTF-8
6. **Map columns** (if needed):
   - Ensure CSV columns match database columns
   - Check that data types are compatible
7. **Click "Import"** to start the import process

### Step 3: Verify Import
After each import:
1. Check the table to ensure data was imported correctly
2. Verify the row count matches the CSV file
3. Check for any import errors in the logs

## Method 2: Supabase SQL Editor Import

### Step 1: Prepare CSV Data
If you prefer using SQL, you can convert the CSV data to SQL INSERT statements:

```sql
-- Example for timetable_classes
COPY timetable_classes (id, name, level, subsystem, branch, academic_year, is_active, created_at, updated_at)
FROM 'path/to/timetable-classes.csv'
WITH (FORMAT csv, HEADER true);
```

### Step 2: Use Supabase Storage
1. Upload CSV files to Supabase Storage
2. Use the `COPY` command with the storage URL
3. Execute in SQL Editor

## Method 3: Programmatic Import

### Using Supabase Client
You can also import programmatically using the Supabase client:

```typescript
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import csv from 'csv-parser'

const supabase = createClient(url, key)

async function importCSV(tableName: string, csvFilePath: string) {
  const results: any[] = []
  
  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const { data, error } = await supabase
        .from(tableName)
        .insert(results)
      
      if (error) {
        console.error(`Error importing ${tableName}:`, error)
      } else {
        console.log(`Successfully imported ${results.length} rows to ${tableName}`)
      }
    })
}
```

## Data Structure Overview

### Classes (20 records)
- **English Classes**: Form 1A-5B (10 classes)
- **French Classes**: Sixième A - Seconde B (10 classes)
- **Subsystems**: english, french
- **Branches**: grammar, technical, commercial
- **Academic Year**: 2024-2025

### Teachers (8 records)
- **Names**: Paul Biya Mbeki, Marie Ngozi, Jean Claude, etc.
- **Contact**: Email and phone numbers
- **Limits**: 6 periods per day, 30 per week
- **Preferences**: Available days and times

### Rooms (11 records)
- **Types**: classroom, science_lab, computer_lab, library, hall
- **Buildings**: Main Building, Science Building, IT Building
- **Equipment**: Detailed equipment lists
- **Capacity**: 20-200 students

### Subjects (12 records)
- **Core Subjects**: Mathematics, English, Biology, Chemistry, Physics
- **Humanities**: History, Geography
- **Languages**: French, Spanish
- **Specialized**: Computer Science, Economics, Physical Education

### Teacher-Subject Assignments (13 records)
- **Primary Assignments**: Each teacher has a primary subject
- **Secondary Assignments**: Some teachers teach multiple subjects
- **Proficiency Levels**: expert, intermediate
- **Experience**: Years of teaching experience

### Time Slots (12 records)
- **Periods**: 10 teaching periods
- **Breaks**: 2 break periods (morning break, lunch)
- **Schedule**: 08:00-16:30 daily schedule

## Troubleshooting Import Issues

### Common Problems

#### 1. **UUID Format Issues**
**Problem**: UUIDs not recognized
**Solution**: Ensure UUIDs are in correct format (8-4-4-4-12 characters)

#### 2. **Array Data Issues**
**Problem**: PostgreSQL arrays not importing correctly
**Solution**: 
- Use proper array syntax: `{item1,item2,item3}`
- Ensure no spaces in array values
- Use double quotes for arrays with special characters

#### 3. **Timestamp Issues**
**Problem**: Date/time format not recognized
**Solution**: 
- Use ISO 8601 format: `2024-12-01 00:00:00+00`
- Ensure timezone information is included

#### 4. **Foreign Key Constraints**
**Problem**: Import fails due to missing referenced records
**Solution**: 
- Import tables in the correct order (see Import Order above)
- Check that referenced IDs exist in parent tables

#### 5. **Column Mismatch**
**Problem**: CSV columns don't match database columns
**Solution**: 
- Verify column names are exactly the same
- Check for extra spaces or special characters
- Ensure all required columns are present

### Verification Queries

After importing, run these queries to verify the data:

```sql
-- Check class counts by subsystem
SELECT subsystem, COUNT(*) as count 
FROM timetable_classes 
GROUP BY subsystem;

-- Check teacher assignments
SELECT t.name as teacher, s.name as subject, ts.proficiency_level
FROM timetable_teachers t
JOIN timetable_teacher_subjects ts ON t.id = ts.teacher_id
JOIN timetable_subjects s ON ts.subject_id = s.id
ORDER BY t.name;

-- Check room distribution
SELECT room_type, COUNT(*) as count 
FROM timetable_rooms 
GROUP BY room_type;

-- Verify time slots
SELECT slot_name, start_time, end_time, is_break 
FROM timetable_time_slots 
ORDER BY slot_number;
```

## Post-Import Setup

### 1. **Test the API Endpoints**
Visit these URLs to verify the data is accessible:
- `/api/timetable/test` - Database connection test
- `/api/timetable/classes` - List all classes
- `/api/timetable/classes?subsystem=english` - Filtered classes

### 2. **Test the Frontend**
1. Visit `/test-timetable`
2. Test the filters (subsystem, branch)
3. Select a class and generate a timetable
4. Verify the timetable displays correctly

### 3. **Verify Relationships**
Ensure that:
- Teachers can be assigned to subjects
- Classes can be assigned to rooms
- Time slots are properly configured
- All foreign key relationships work

## Data Customization

### Adding More Classes
To add more classes, edit `timetable-classes.csv`:
1. Add new rows with unique UUIDs
2. Follow the naming convention
3. Set appropriate subsystem and branch values
4. Import the updated CSV

### Adding More Teachers
To add more teachers, edit `timetable-teachers.csv`:
1. Add new teacher records
2. Assign subjects in `timetable-teacher-subjects.csv`
3. Import both files

### Modifying Subjects
To modify subjects, edit `timetable-subjects.csv`:
1. Update subject details
2. Modify applicable levels/branches
3. Re-import the file

## Backup and Restore

### Creating Backups
Before making changes, create backups:

```sql
-- Export current data
COPY timetable_classes TO '/tmp/timetable-classes-backup.csv' WITH CSV HEADER;
COPY timetable_teachers TO '/tmp/timetable-teachers-backup.csv' WITH CSV HEADER;
-- ... repeat for all tables
```

### Restoring Data
To restore from backup:

```sql
-- Clear existing data
TRUNCATE timetable_classes CASCADE;
-- Import backup
COPY timetable_classes FROM '/tmp/timetable-classes-backup.csv' WITH CSV HEADER;
```

## Support

If you encounter issues during import:

1. **Check the CSV files** for formatting issues
2. **Verify the database schema** matches the CSV structure
3. **Review import logs** for specific error messages
4. **Test with a small subset** of data first
5. **Check the troubleshooting guide** for common solutions

The CSV import method provides a reliable way to populate your timetable database with sample data for testing and development.
