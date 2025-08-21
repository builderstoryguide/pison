# Attendance Management CRUD Operations

This document outlines the complete CRUD (Create, Read, Update, Delete) operations available for Admin users in the Attendance Management section.

## Overview

The Attendance Management system provides comprehensive CRUD operations for both individual attendance records and attendance sessions. Admin users can perform all operations through an intuitive interface with proper validation and confirmation dialogs.

## Components

### 1. Attendance Context (`lib/attendance-context.tsx`)

The central context that provides all CRUD operations:

#### Create Operations
- `markAttendance(sessionId, records)` - Mark attendance for a session
- `createAttendanceSession(session)` - Create a new attendance session

#### Read Operations
- `getAttendanceByClass(classId, dateRange)` - Get attendance by class
- `getAttendanceByStudent(studentId, dateRange)` - Get attendance by student
- `getAttendanceStats(filters)` - Get attendance statistics
- `getAttendanceSession(sessionId)` - Get specific session
- `getAttendanceRecord(recordId)` - Get specific record

#### Update Operations
- `updateAttendanceRecord(recordId, updates)` - Update individual record
- `updateAttendanceSession(sessionId, updates)` - Update session details

#### Delete Operations
- `deleteAttendanceRecord(recordId)` - Delete individual record
- `deleteAttendanceSession(sessionId)` - Delete session and all records
- `deleteAttendanceRecordsBySession(sessionId)` - Delete only records for a session

#### Bulk Operations
- `bulkUpdateAttendance(updates)` - Update multiple records at once
- `bulkDeleteAttendanceRecords(recordIds)` - Delete multiple records at once

### 2. Edit Attendance Record Form (`components/admin/edit-attendance-record-form.tsx`)

A comprehensive form for editing individual attendance records.

**Features:**
- View record information (student, class, date, marked by)
- Update attendance status (present, absent, late, excused)
- Edit period, subject, and notes
- Delete individual records with confirmation
- Real-time validation

**Usage:**
```tsx
<EditAttendanceRecordForm
  recordId="att_001"
  onSuccess={() => console.log("Record updated")}
  onCancel={() => console.log("Edit cancelled")}
/>
```

### 3. Attendance Session Management (`components/admin/attendance-session-management.tsx`)

A multi-tab interface for managing attendance sessions.

**Features:**
- **View Tab**: Display session overview and attendance summary
- **Edit Tab**: Update session details (period, subject, status)
- **Records Tab**: View all individual records for the session
- Delete session with all records
- Delete only records while keeping session

**Usage:**
```tsx
<AttendanceSessionManagement
  sessionId="ses_001"
  onSuccess={() => console.log("Session updated")}
  onCancel={() => console.log("Management cancelled")}
/>
```

### 4. Bulk Attendance Operations (`components/admin/bulk-attendance-operations.tsx`)

A powerful interface for performing operations on multiple records.

**Features:**
- Select multiple records with checkboxes
- Select all records option
- Bulk status updates
- Bulk deletion with confirmation
- Real-time selection count

**Usage:**
```tsx
<BulkAttendanceOperations
  records={attendanceRecords}
  onSuccess={() => console.log("Bulk operation completed")}
  onCancel={() => console.log("Bulk operation cancelled")}
/>
```

## Main Attendance Management Interface

The main attendance management component (`components/admin/attendance-management.tsx`) integrates all CRUD operations through organized tabs:

### Tabs Available

1. **Attendance Sessions** - Manage attendance sessions with full CRUD
2. **Individual Records** - Manage individual attendance records with bulk operations
3. **Student Summary** - View student attendance summaries
4. **Analytics** - View attendance trends and patterns
5. **Reports** - Generate various attendance reports

## Data Models

### AttendanceRecord Interface
```typescript
interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  studentName: string
  classId: string
  className: string
  date: string
  status: "present" | "absent" | "late" | "excused"
  markedBy: string
  markedAt: string
  notes?: string
  period?: string
  subject?: string
}
```

### AttendanceSession Interface
```typescript
interface AttendanceSession {
  id: string
  classId: string
  className: string
  date: string
  period: string
  subject: string
  teacherId: string
  teacherName: string
  totalStudents: number
  presentCount: number
  absentCount: number
  lateCount: number
  excusedCount: number
  status: "pending" | "completed" | "locked"
  markedAt?: string
}
```

## CRUD Operations Examples

### Create Operations

#### Create Attendance Session
```typescript
const sessionId = await createAttendanceSession({
  classId: "cls_001",
  className: "Form 5A Science",
  date: "2024-01-15",
  period: "Period 1",
  subject: "Mathematics",
  teacherId: "tch_001",
  teacherName: "Dr. Emmanuel Mbeki",
  totalStudents: 30,
  presentCount: 0,
  absentCount: 0,
  lateCount: 0,
  excusedCount: 0,
  status: "pending"
})
```

#### Mark Attendance
```typescript
await markAttendance(sessionId, [
  {
    sessionId: "ses_001",
    studentId: "std_001",
    studentName: "Marie Ngozi",
    classId: "cls_001",
    className: "Form 5A Science",
    date: "2024-01-15",
    status: "present",
    markedBy: "tch_001",
    period: "Period 1",
    subject: "Mathematics"
  }
])
```

### Read Operations

#### Get Attendance by Class
```typescript
const classAttendance = getAttendanceByClass("cls_001", {
  start: "2024-01-01",
  end: "2024-01-31"
})
```

#### Get Attendance Statistics
```typescript
const stats = getAttendanceStats({
  classId: "cls_001",
  dateRange: {
    start: "2024-01-01",
    end: "2024-01-31"
  }
})
```

### Update Operations

#### Update Individual Record
```typescript
await updateAttendanceRecord("att_001", {
  status: "excused",
  notes: "Medical appointment"
})
```

#### Update Session
```typescript
await updateAttendanceSession("ses_001", {
  status: "completed",
  period: "Period 2"
})
```

### Delete Operations

#### Delete Individual Record
```typescript
await deleteAttendanceRecord("att_001")
```

#### Delete Session with All Records
```typescript
await deleteAttendanceSession("ses_001")
```

#### Delete Only Records for Session
```typescript
await deleteAttendanceRecordsBySession("ses_001")
```

### Bulk Operations

#### Bulk Update
```typescript
await bulkUpdateAttendance([
  {
    recordId: "att_001",
    updates: { status: "present" }
  },
  {
    recordId: "att_002",
    updates: { status: "absent" }
  }
])
```

#### Bulk Delete
```typescript
await bulkDeleteAttendanceRecords(["att_001", "att_002", "att_003"])
```

## Security and Validation

### Input Validation
- All form inputs are validated before submission
- Required fields are enforced
- Date formats are validated
- Status values are restricted to valid options

### Confirmation Dialogs
- Delete operations require confirmation
- Bulk operations show count of affected records
- Session deletion warns about cascading record deletion

### Error Handling
- All operations include proper error handling
- User-friendly error messages
- Loading states during operations
- Graceful fallbacks for failed operations

## User Interface Features

### Visual Indicators
- Color-coded status badges (green for present, red for absent, etc.)
- Progress bars for attendance rates
- Icons for different status types
- Loading spinners during operations

### Responsive Design
- Mobile-friendly interface
- Responsive tables and forms
- Touch-friendly buttons and controls

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Integration Points

### Context Integration
All components integrate with the `AttendanceProvider` context for:
- State management
- Data persistence
- Real-time updates
- Error handling

### Event Handling
- Success callbacks for all operations
- Cancel callbacks for user-initiated cancellations
- Refresh triggers for data updates

## Future Enhancements

### Planned Features
- Export functionality for reports
- Advanced filtering and search
- Attendance trend analysis
- Automated notifications
- Integration with external systems

### Performance Optimizations
- Pagination for large datasets
- Virtual scrolling for tables
- Caching strategies
- Optimistic updates

## Testing

### Unit Tests
- Component rendering tests
- Form validation tests
- CRUD operation tests
- Error handling tests

### Integration Tests
- Context integration tests
- User workflow tests
- Data persistence tests

### E2E Tests
- Complete user journey tests
- Cross-browser compatibility
- Mobile responsiveness tests

## Conclusion

The Attendance Management CRUD operations provide a comprehensive solution for admin users to manage student attendance effectively. The system offers both individual and bulk operations with proper validation, confirmation dialogs, and error handling. The modular component architecture ensures maintainability and extensibility for future enhancements.
