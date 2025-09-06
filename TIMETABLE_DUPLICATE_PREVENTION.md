# Timetable Duplicate Prevention System

## Overview

The timetable generation system has been enhanced with comprehensive duplicate prevention mechanisms to ensure that when generating class timetables, no scheduling conflicts occur. This prevents various types of duplicates and overlapping periods.

## Types of Duplicates Prevented

### 1. **Class Scheduling Duplicates**
- ✅ **Same class scheduled twice at the same time**
- ✅ **Overlapping periods for the same class**
- ✅ **Duplicate schedule generation for same academic year/term**

### 2. **Resource Conflicts** (Advanced)
- ✅ **Teacher double-booking** - Same teacher assigned to multiple classes simultaneously
- ✅ **Room conflicts** - Same room assigned to multiple classes at the same time
- ✅ **Time range overlaps** - Periods that overlap in time, not just exact matches

### 3. **Schedule Integrity**
- ✅ **Academic term uniqueness** - Only one schedule per academic year and term
- ✅ **Period regeneration** - Clears existing periods before creating new ones
- ✅ **Constraint validation** - Database-level enforcement of uniqueness rules

## Database Constraints

### Basic Constraints (Already Implemented)
```sql
-- Prevent same class from having overlapping periods
UNIQUE(class_id, day_of_week, start_time)

-- Prevent same teacher from being scheduled twice
UNIQUE(teacher_id, day_of_week, start_time)  

-- Prevent same room from being double-booked
UNIQUE(room_id, day_of_week, start_time)

-- Prevent duplicate schedules for same academic term
UNIQUE(academic_year, term)
```

### Enhanced Constraints (Advanced)
```sql
-- Exclusion constraints that prevent time range overlaps
ALTER TABLE timetable_periods 
ADD CONSTRAINT no_overlapping_class_periods 
EXCLUDE USING gist (
    class_id WITH =,
    day_of_week WITH =,
    tsrange(...) WITH &&
);
```

## Implementation Files

### 1. **Basic Duplicate Prevention**
- **File**: `scripts/fix-timetable-generation-function.sql`
- **Features**:
  - Handles existing schedule reuse
  - Clears old periods before regeneration
  - Basic uniqueness constraints
  - Proper error handling

### 2. **Advanced Duplicate Prevention**
- **File**: `scripts/enhance-timetable-duplicate-prevention.sql`
- **Features**:
  - Time range overlap detection
  - Teacher/room conflict checking
  - Advanced exclusion constraints
  - Conflict resolution algorithms
  - Comprehensive conflict reporting

### 3. **API Integration**
- **Files**: `app/api/timetable/generate-from-admin/route.ts`, `app/api/timetable/route.ts`
- **Features**:
  - Calls enhanced database functions
  - Returns detailed conflict information
  - Supports conflict-checking parameters

## How Duplicate Prevention Works

### 1. **Schedule Level Prevention**
```sql
-- Check if schedule already exists
SELECT id INTO v_schedule_id
FROM timetable_schedules
WHERE academic_year = p_academic_year AND term = p_term;

-- Reuse existing schedule instead of creating duplicate
IF v_schedule_id IS NULL THEN
    INSERT INTO timetable_schedules (...)
    RETURNING id INTO v_schedule_id;
END IF;
```

### 2. **Period Level Prevention**
```sql
-- Clear existing periods for this class
DELETE FROM timetable_periods 
WHERE class_id = p_class_id AND schedule_id = v_schedule_id;

-- Generate new periods with conflict checking
```

### 3. **Conflict Detection Function**
```sql
CREATE OR REPLACE FUNCTION check_timetable_conflicts(
    p_class_id UUID,
    p_teacher_id UUID,
    p_room_id UUID,
    p_day_of_week VARCHAR,
    p_start_time TIME,
    p_end_time TIME
)
RETURNS TABLE(conflict_type VARCHAR, conflict_description TEXT)
```

### 4. **Real-time Conflict Resolution**
- Detects conflicts before insertion
- Automatically adjusts time slots
- Logs conflict resolution attempts
- Provides detailed conflict reports

## Database Functions

### Core Functions

#### `generate_class_timetable(...)`
- **Purpose**: Main timetable generation with basic duplicate prevention
- **Features**: Schedule reuse, period clearing, basic constraints
- **Usage**: Standard timetable generation

#### `generate_class_timetable_with_conflict_check(...)`
- **Purpose**: Advanced generation with comprehensive conflict detection
- **Features**: All basic features plus teacher/room conflict checking
- **Usage**: When advanced conflict prevention is needed

#### `check_timetable_conflicts(...)`
- **Purpose**: Detects scheduling conflicts before period insertion
- **Returns**: Detailed conflict information
- **Usage**: Pre-insertion validation

### Utility Views

#### `v_timetable_conflicts`
- **Purpose**: Identifies existing conflicts in the timetable
- **Types**: Class overlaps, teacher conflicts, room double-booking
- **Usage**: Conflict monitoring and reporting

## Usage Instructions

### 1. **Apply Basic Duplicate Prevention**
```sql
-- Run this script to fix the original duplicate key error
-- and add basic duplicate prevention
\i scripts/fix-timetable-generation-function.sql
```

### 2. **Apply Advanced Duplicate Prevention**
```sql
-- Run this script for comprehensive conflict detection
-- and advanced duplicate prevention
\i scripts/enhance-timetable-duplicate-prevention.sql
```

### 3. **API Usage**
```javascript
// Generate timetable with duplicate prevention
const response = await fetch('/api/timetable/generate-from-admin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    classId: 'class-uuid',
    academicYear: '2024-2025',
    term: 'first',
    generatedBy: 'admin-uuid'
  })
});
```

### 4. **Check for Conflicts**
```sql
-- View existing conflicts
SELECT * FROM v_timetable_conflicts;

-- Check specific conflicts before scheduling
SELECT * FROM check_timetable_conflicts(
    'class-id', 'teacher-id', 'room-id', 
    'Monday', '09:00:00', '09:45:00'
);
```

## Error Handling

### 1. **Duplicate Key Errors**
- **Before**: `duplicate key value violates unique constraint`
- **After**: Automatically reuses existing schedules

### 2. **Scheduling Conflicts**
- **Detection**: Real-time conflict checking during generation
- **Resolution**: Automatic time slot adjustment
- **Reporting**: Detailed conflict descriptions

### 3. **Resource Conflicts**
- **Teacher conflicts**: Prevents double-booking teachers
- **Room conflicts**: Prevents room scheduling conflicts
- **Time overlaps**: Prevents overlapping periods

## Testing the System

### 1. **Basic Test**
```sql
-- Generate timetable for same class twice
SELECT generate_class_timetable(
    'class-id', '2024-2025', 'first', 'admin-id'
);
-- Should reuse existing schedule, not create duplicate
```

### 2. **Conflict Test**
```sql
-- Try to schedule overlapping periods
-- Should detect and resolve conflicts automatically
```

### 3. **Monitoring**
```sql
-- Check for any remaining conflicts
SELECT COUNT(*) FROM v_timetable_conflicts;
-- Should return 0 if duplicate prevention is working
```

## Benefits

### ✅ **Prevents Scheduling Chaos**
- No more double-booked teachers
- No more room conflicts
- No more overlapping class periods

### ✅ **Data Integrity**
- Database-level constraint enforcement
- Automatic conflict detection
- Proper error handling and recovery

### ✅ **User Experience**
- No more "duplicate key" errors
- Automatic conflict resolution
- Clear conflict reporting

### ✅ **System Reliability**
- Robust duplicate prevention
- Comprehensive error handling
- Detailed logging and monitoring

## Maintenance

### Regular Monitoring
```sql
-- Check for conflicts weekly
SELECT * FROM v_timetable_conflicts;

-- Review generation logs
SELECT * FROM timetable_generation_logs 
WHERE status = 'failed' 
ORDER BY generated_at DESC;
```

### Performance Optimization
- Indexes on frequently queried columns
- Efficient conflict detection algorithms
- Optimized exclusion constraints

The timetable duplicate prevention system ensures reliable, conflict-free schedule generation for your school management system!
