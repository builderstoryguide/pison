# Teacher Assignment Management System

## Overview

The Teacher Assignment Management System provides teachers with a comprehensive interface to create, manage, and grade student assignments. This system integrates seamlessly with the existing school management application and provides a complete workflow from assignment creation to grading.

## Features

### 🎯 Core Functionality

1. **Assignment Creation**
   - Create assignments with detailed information
   - Upload assignment files (PDF, DOCX, DOC)
   - Set due dates, total marks, and passing marks
   - Configure submission types (file, text, or both)
   - Add detailed instructions for students

2. **Assignment Management**
   - View all created assignments in a organized list
   - Edit existing assignments
   - Delete assignments (with confirmation)
   - Filter assignments by status and class
   - Search assignments by title or subject

3. **Submission Management**
   - View all student submissions for each assignment
   - Download submitted files
   - Grade submissions with marks and feedback
   - Track submission status (submitted, graded, late, absent)

4. **Grading System**
   - Grade submissions with numerical marks
   - Provide written feedback
   - Automatic grade letter calculation (A+, A, B+, B, C, D, F)
   - Track grading progress

## User Interface

### Dashboard Integration

The assignment management is integrated into the teacher dashboard with three main tabs:

1. **Overview Tab**
   - General statistics and class information
   - Quick access to recent activities
   - Assignment count summary

2. **Assignments Tab**
   - Full assignment management interface
   - Create, edit, and manage assignments
   - View submission statistics

3. **Attendance Tab**
   - Attendance management (existing functionality)

### Assignment Management Interface

#### Main View
- **Header**: Title, description, and "Create Assignment" button
- **Filters**: Search bar, status filter, class filter
- **Assignment List**: Cards showing assignment details with action buttons

#### Assignment Cards
Each assignment card displays:
- Assignment title and subject
- Class and status badge
- Due date and total marks
- Submission count and graded count
- Action buttons (View Submissions, Edit, Delete)

#### Create/Edit Dialog
Comprehensive form with fields for:
- Basic information (title, subject, description)
- Class assignment and due date
- Grading parameters (total marks, passing marks)
- Submission configuration (type, late submission settings)
- File upload (optional)
- Instructions for students

#### Submissions View
Modal dialog showing:
- List of all submissions for an assignment
- Student information and submission date
- Submission content (text and/or files)
- Grading interface for ungraded submissions
- Display of grades and feedback for graded submissions

## Database Schema

### Assignments Table
```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject VARCHAR(100) NOT NULL,
    class_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    passing_marks DECIMAL(5,2) DEFAULT 50.0,
    weight_percentage DECIMAL(5,2) DEFAULT 100.0,
    assignment_file_url TEXT,
    assignment_file_name VARCHAR(255),
    assignment_file_size INTEGER,
    assignment_file_type VARCHAR(100),
    assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    instructions TEXT,
    submission_type VARCHAR(20) DEFAULT 'file',
    allow_late_submission BOOLEAN DEFAULT false,
    late_penalty_percentage DECIMAL(5,2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Assignment Submissions Table
```sql
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(100) UNIQUE NOT NULL,
    assignment_id UUID NOT NULL REFERENCES assignments(id),
    student_id VARCHAR(255) NOT NULL,
    teacher_id VARCHAR(255) NOT NULL,
    submitted_text TEXT,
    submission_file_url TEXT,
    submission_file_name VARCHAR(255),
    submission_file_size INTEGER,
    submission_file_type VARCHAR(100),
    marks_obtained DECIMAL(5,2),
    percentage DECIMAL(5,2),
    grade_letter VARCHAR(2),
    grade_point DECIMAL(3,2),
    feedback TEXT,
    is_late BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## File Storage

### Supabase Storage
- **Bucket**: `assignments`
- **Structure**: `assignments/{teacher_id}_{timestamp}.{extension}`
- **Supported Formats**: PDF, DOCX, DOC
- **File Size Limit**: 10MB
- **Access**: Public read, authenticated upload

### Storage Policies
```sql
-- Public read access for assignment files
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'assignments');

-- Authenticated users can upload assignment files
CREATE POLICY "Authenticated users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');
```

## API Endpoints

### Assignments API (`/api/assignments`)
- `GET` - Fetch assignments (with optional filters)
- `POST` - Create new assignment
- `PUT` - Update existing assignment
- `DELETE` - Delete assignment

### Submissions API (`/api/assignments/submissions`)
- `GET` - Fetch submissions for an assignment
- `POST` - Create new submission
- `PUT` - Update submission (grading)
- `DELETE` - Delete submission

## Usage Workflow

### 1. Creating an Assignment
1. Navigate to Teacher Dashboard → Assignments tab
2. Click "Create Assignment" button
3. Fill in assignment details:
   - Title and subject
   - Class assignment
   - Due date and grading parameters
   - Upload assignment file (optional)
   - Add instructions
4. Click "Create Assignment"

### 2. Managing Assignments
1. View all assignments in the main list
2. Use filters to find specific assignments
3. Click "Edit" to modify assignment details
4. Click "Delete" to remove assignment (with confirmation)
5. Click "View Submissions" to see student work

### 3. Grading Submissions
1. Open submissions view for an assignment
2. Review student submissions (text and/or files)
3. For ungraded submissions:
   - Enter marks (0 to total marks)
   - Add feedback comments
   - Click "Grade" to save
4. View graded submissions with marks and feedback

## Security Features

### Authentication
- All operations require teacher authentication
- Teachers can only access their own assignments
- Student submissions are protected by teacher access

### File Security
- File type validation (PDF, DOCX, DOC only)
- File size limits (10MB maximum)
- Secure file storage with access controls

### Data Validation
- Form validation using Zod schemas
- Server-side validation for all inputs
- SQL injection protection through Supabase

## Performance Optimizations

### Database Indexes
```sql
-- Performance indexes for common queries
CREATE INDEX idx_assignments_teacher_id ON assignments(teacher_id);
CREATE INDEX idx_assignments_class_id ON assignments(class_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignment_submissions_assignment_id ON assignment_submissions(assignment_id);
CREATE INDEX idx_assignment_submissions_student_id ON assignment_submissions(student_id);
```

### Caching
- Client-side caching of assignment lists
- Optimistic updates for better UX
- Efficient re-rendering with React state management

## Error Handling

### User-Friendly Errors
- Clear error messages for validation failures
- File upload error handling
- Network error recovery
- Graceful degradation for missing data

### Logging
- Console logging for debugging
- Error tracking for production monitoring
- User action logging for audit trails

## Testing

### Test Page
Access `/test-teacher-assignments` to test the assignment management functionality in isolation.

### Test Scenarios
1. **Assignment Creation**: Create assignments with various configurations
2. **File Upload**: Test PDF and Word document uploads
3. **Assignment Editing**: Modify existing assignments
4. **Submission Grading**: Grade student submissions
5. **Error Handling**: Test validation and error scenarios

## Future Enhancements

### Planned Features
1. **Bulk Operations**: Grade multiple submissions at once
2. **Assignment Templates**: Save and reuse assignment templates
3. **Advanced Grading**: Rubric-based grading
4. **Notifications**: Email notifications for new submissions
5. **Analytics**: Assignment performance analytics
6. **Plagiarism Detection**: Integration with plagiarism checking tools

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live updates
2. **Offline Support**: PWA capabilities for offline assignment creation
3. **Mobile Optimization**: Enhanced mobile interface
4. **API Rate Limiting**: Protection against abuse
5. **Advanced Search**: Full-text search capabilities

## Troubleshooting

### Common Issues

#### Assignment Not Appearing
- Check if teacher is logged in
- Verify assignment was created successfully
- Check database connection

#### File Upload Failures
- Verify file type (PDF, DOCX, DOC only)
- Check file size (max 10MB)
- Ensure storage bucket exists and is configured

#### Grading Issues
- Verify marks are within valid range
- Check if submission exists
- Ensure teacher has permission to grade

#### Performance Issues
- Check database indexes
- Monitor file storage usage
- Review network connectivity

### Debug Information
- Browser console logs for client-side issues
- Network tab for API request debugging
- Supabase dashboard for database issues
- Storage logs for file upload problems

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team
4. Submit issues through the project repository

---

*This documentation is maintained as part of the School Management Application project.*
