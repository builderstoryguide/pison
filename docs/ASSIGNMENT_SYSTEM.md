# Assignment Management System

This document describes the comprehensive assignment management system implemented in the school management application.

## Overview

The assignment system allows teachers to create and manage assignments for their classes, while students can view, download, and submit assignments. The system supports both file uploads (PDF, DOCX) and text-based submissions.

## Database Schema

### Tables

#### 1. `assignments` Table
Stores assignment information created by teachers.

**Key Fields:**
- `id`: UUID primary key
- `assignment_id`: Unique assignment identifier
- `title`: Assignment title
- `description`: Assignment description
- `subject`: Subject name
- `class_id`: Target class
- `teacher_id`: Teacher who created the assignment
- `total_marks`: Maximum marks possible
- `passing_marks`: Minimum marks to pass
- `assignment_file_url`: URL to assignment file (PDF/DOCX)
- `assignment_file_name`: Original filename
- `assignment_file_size`: File size in bytes
- `assignment_file_type`: MIME type
- `assigned_date`: Date assigned
- `due_date`: Due date
- `status`: Assignment status (draft, published, archived)
- `instructions`: Special instructions for students
- `submission_type`: Type of submission allowed (file, text, both)
- `allow_late_submission`: Whether late submissions are allowed
- `late_penalty_percentage`: Penalty for late submissions

#### 2. `assignment_submissions` Table
Stores student submissions for assignments.

**Key Fields:**
- `id`: UUID primary key
- `submission_id`: Unique submission identifier
- `assignment_id`: Reference to assignment
- `student_id`: Student who submitted
- `teacher_id`: Teacher who will grade
- `submitted_text`: Text-based submission
- `submission_file_url`: URL to submitted file
- `submission_file_name`: Original filename
- `submission_file_size`: File size in bytes
- `submission_file_type`: MIME type
- `marks_obtained`: Marks awarded
- `percentage`: Percentage score
- `grade_letter`: Letter grade (A, B, C, etc.)
- `remarks`: Teacher remarks
- `feedback`: Detailed feedback
- `is_late`: Whether submission was late
- `submitted_at`: Submission timestamp
- `graded_at`: Grading timestamp
- `status`: Submission status (submitted, graded, late, absent, excused)

## Features

### For Teachers

1. **Create Assignments**
   - Set title, description, subject, and class
   - Define total marks and passing marks
   - Set due date and instructions
   - Upload assignment files (PDF, DOCX)
   - Choose submission type (file, text, or both)
   - Configure late submission policies

2. **Manage Assignments**
   - View all created assignments
   - Edit assignment details
   - Delete assignments
   - Track submission status
   - Grade student submissions

3. **Grade Submissions**
   - View submitted work (text and files)
   - Award marks and provide feedback
   - Calculate percentages and letter grades
   - Handle late submissions with penalties

### For Students

1. **View Assignments**
   - See all assignments for their class
   - Filter by status (pending, submitted, graded, overdue)
   - Search assignments by title or subject
   - View assignment details and instructions

2. **Download Assignment Files**
   - Download PDF or Word documents
   - View assignment instructions

3. **Submit Work**
   - Upload files (PDF, DOCX, TXT)
   - Submit text-based responses
   - Add remarks or comments
   - Track submission status

4. **View Grades**
   - See awarded marks and percentages
   - Read teacher feedback
   - View letter grades

## File Storage

The system uses Supabase Storage for file management:

- **Bucket**: `assignments`
- **Assignment files**: `assignments/{teacher_id}_{timestamp}.{ext}`
- **Submission files**: `assignment-submissions/{student_id}_{timestamp}.{ext}`
- **Supported formats**: PDF, DOCX, DOC, TXT
- **File size limit**: 10MB per file

## API Endpoints

### Assignments
- `GET /api/assignments` - Get assignments with filters
- `POST /api/assignments` - Create new assignment
- `PUT /api/assignments/:id` - Update assignment
- `DELETE /api/assignments/:id` - Delete assignment

### Submissions
- `GET /api/assignments/submissions` - Get submissions with filters
- `POST /api/assignments/submissions` - Submit assignment
- `PUT /api/assignments/submissions/:id` - Grade submission
- `DELETE /api/assignments/submissions/:id` - Delete submission

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the necessary tables:

```bash
# Option 1: Run the Node.js setup script
node scripts/setup-assignments.js

# Option 2: Run SQL directly in Supabase
# Copy and paste the contents of scripts/create-assignments-table.sql
```

### 2. Storage Setup

Create the required Supabase Storage buckets:

```sql
-- Create assignments bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', true);

-- Set up storage policies
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');
```

### 3. Environment Variables

Ensure these environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Usage Examples

### Creating an Assignment (Teacher)

```typescript
const assignmentData = {
  title: "Essay on Shakespeare's Macbeth",
  description: "Write a comprehensive essay analyzing themes...",
  subject: "English Literature",
  class_id: "Form 5A",
  total_marks: 25,
  passing_marks: 12.5,
  due_date: "2024-03-15",
  instructions: "Submit as PDF or Word document...",
  submission_type: "file",
  allow_late_submission: false,
  late_penalty_percentage: 0
}

// Upload file and create assignment
const fileUrl = await uploadFile(assignmentFile)
const assignment = await createAssignment({ ...assignmentData, assignment_file_url: fileUrl })
```

### Submitting an Assignment (Student)

```typescript
const submissionData = {
  assignment_id: "assignment-uuid",
  submitted_text: "Essay content...",
  remarks: "Additional comments"
}

// Upload file and submit
const fileUrl = await uploadFile(submissionFile)
const submission = await submitAssignment({ 
  ...submissionData, 
  submission_file_url: fileUrl 
})
```

### Grading a Submission (Teacher)

```typescript
const gradeData = {
  submission_id: "submission-uuid",
  marks_obtained: 22,
  feedback: "Excellent analysis of themes...",
  remarks: "Well done!"
}

const grade = await gradeSubmission(gradeData)
```

## Sample Data

The system includes sample assignments and submissions:

1. **English Literature Essay** - Macbeth analysis (25 marks)
2. **Mathematics Problem Set** - Calculus problems (30 marks)
3. **Physics Lab Report** - Newton's laws experiment (20 marks)
4. **History Research Paper** - Colonialism impact (35 marks)
5. **Chemistry Experiment Report** - Chemical reactions (25 marks)

## Security Considerations

1. **File Validation**: Only allowed file types and sizes are accepted
2. **Access Control**: Students can only see assignments for their class
3. **Teacher Permissions**: Teachers can only manage their own assignments
4. **Submission Limits**: One submission per student per assignment
5. **Late Detection**: Automatic detection and marking of late submissions

## Performance Optimizations

1. **Database Indexes**: Optimized queries for common operations
2. **File Compression**: Efficient storage and retrieval
3. **Pagination**: Large result sets are paginated
4. **Caching**: Frequently accessed data is cached

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (max 10MB)
   - Verify file type (PDF, DOCX, DOC, TXT)
   - Ensure storage bucket exists

2. **Assignment Not Visible**
   - Verify student is in the correct class
   - Check assignment status is "published"
   - Confirm teacher assigned to the class

3. **Submission Errors**
   - Ensure assignment is not overdue (unless late submission allowed)
   - Check if student already submitted
   - Verify file upload completed successfully

### Error Messages

- `"File size must be less than 10MB"` - Reduce file size
- `"Please select a PDF or Word document"` - Use supported file type
- `"Assignment not found"` - Check assignment ID and permissions
- `"Already submitted"` - Student has already submitted this assignment

## Future Enhancements

1. **Bulk Operations**: Import/export assignments
2. **Plagiarism Detection**: Integrate with plagiarism checking services
3. **Peer Review**: Allow students to review each other's work
4. **Rubrics**: Structured grading criteria
5. **Notifications**: Email/SMS reminders for due dates
6. **Analytics**: Assignment performance analytics
7. **Templates**: Pre-built assignment templates
8. **Collaboration**: Group assignments and submissions

## Support

For technical support or questions about the assignment system, please refer to the main project documentation or contact the development team.
