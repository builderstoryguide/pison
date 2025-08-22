# Timetable Management Feature

## Overview

The Timetable Management feature allows administrators to generate, view, and manage class timetables for the school. This feature provides a comprehensive interface for creating weekly schedules that assign subjects, teachers, and rooms to specific time slots.

## Features

### 1. Timetable Generation
- **Automatic Generation**: Generate timetables automatically for selected classes
- **Smart Assignment**: Automatically assigns teachers based on their subject expertise
- **Room Allocation**: Intelligently assigns rooms based on availability and capacity
- **Conflict Resolution**: Prevents scheduling conflicts between teachers and rooms

### 2. Timetable Management
- **View Timetables**: Display timetables in both weekly and daily views
- **Edit Timetables**: Modify existing timetables manually
- **Delete Timetables**: Remove timetables for classes
- **Export Functionality**: Export timetables to CSV format

### 3. Filtering and Search
- **Subsystem Filter**: Filter classes by English or French subsystem
- **Branch Filter**: Filter by Grammar, Technical, or Commercial branches
- **Class Selection**: Select specific classes for timetable operations

## User Interface

### Main Components

1. **Filters Section**
   - Subsystem dropdown (English/French)
   - Branch dropdown (Grammar/Technical/Commercial)
   - Class selection dropdown

2. **Generate Timetable Section**
   - Generate button with loading state
   - Error handling and success messages

3. **Timetables List**
   - Table showing all classes with their timetable status
   - Actions dropdown for each class (Edit, Export, Delete)
   - Status indicators (Generated/Not Generated)

4. **Timetable Viewer**
   - Weekly view: Grid layout showing all days and time slots
   - Daily view: Card-based layout for each day
   - Period details: Subject, teacher, and room information

## Data Structure

### TimetablePeriod
```typescript
interface TimetablePeriod {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  teacher: string
  room: string
  class: string
}
```

### TimetableClass
```typescript
interface TimetableClass {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  periods: TimetablePeriod[]
}
```

### TimetableTeacher
```typescript
interface TimetableTeacher {
  id: string
  name: string
  subjects: string[]
  maxPeriodsPerDay: number
}
```

### TimetableRoom
```typescript
interface TimetableRoom {
  id: string
  name: string
  capacity: number
  type: "classroom" | "laboratory" | "library" | "hall"
}
```

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

## Usage Instructions

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
   - Confirm the deletion in the dialog

## Technical Implementation

### Context Provider

The feature uses a React Context (`TimetableProvider`) to manage state and provide the following functions:

- `generateTimetable(classId)`: Generate timetable for a class
- `updateTimetable(classId, periods)`: Update existing timetable
- `deleteTimetable(classId)`: Delete timetable for a class
- `exportTimetable(classId)`: Export timetable to CSV
- `getClassTimetable(classId)`: Get timetable for a specific class
- `getTeacherTimetable(teacherId)`: Get timetable for a specific teacher
- `getRoomTimetable(roomId)`: Get timetable for a specific room

### Component Structure

```
TimetableManagement/
├── Filters Section
├── Generate Timetable Section
├── Timetables List Table
└── Timetable Viewer
    ├── Weekly View Tab
    └── Daily View Tab
```

## Mock Data

The system includes mock data for testing:

### Classes
- Form 1A (English, Grammar)
- Form 2B (English, Technical)
- Form 5 Science (English, Grammar)
- Form 3A (English, Commercial)
- Sixième A (French, Grammar)

### Teachers
- Mr. John Doe (Mathematics, Physics)
- Mrs. Sarah Johnson (English Language, Literature)
- Dr. Mary Smith (Biology, Chemistry)
- Mr. David Wilson (History, Geography)
- Mrs. Grace Tabi (French Language, Spanish)

### Rooms
- Room 101 (Classroom, 40 capacity)
- Science Lab 1 (Laboratory, 30 capacity)
- Computer Lab (Laboratory, 25 capacity)
- Room 102 (Classroom, 35 capacity)
- Library (Library, 50 capacity)

## Future Enhancements

1. **Advanced Scheduling Algorithm**
   - Implement more sophisticated conflict resolution
   - Add teacher availability constraints
   - Include room capacity and equipment requirements

2. **Timetable Templates**
   - Create reusable timetable templates
   - Support for different academic years
   - Template-based generation

3. **Real-time Updates**
   - Live timetable updates
   - Notifications for schedule changes
   - Integration with calendar systems

4. **Mobile Support**
   - Responsive design for mobile devices
   - Mobile app integration
   - Push notifications for schedule changes

5. **Analytics and Reporting**
   - Timetable utilization reports
   - Teacher workload analysis
   - Room usage statistics

## Testing

To test the timetable functionality:

1. Navigate to `/test-timetable` in the application
2. Use the interface to generate timetables for different classes
3. Test the export functionality
4. Verify the weekly and daily views work correctly

## Dependencies

- React Context for state management
- Lucide React for icons
- shadcn/ui components for the interface
- CSV export functionality for downloads

## Security Considerations

- Only administrators can access timetable management
- Role-based access control is enforced
- All operations are logged for audit purposes
- Data validation prevents invalid timetable entries
