# Product Requirements Document (PRD)
## School Management Application

**Version:** 1.0  
**Last Updated:** December 2024  
**Project:** School Management System  
**Target Institution:** Pison Academy of Excellence

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Core Features](#core-features)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [User Interface Requirements](#user-interface-requirements)
9. [Security & Compliance](#security--compliance)
10. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The School Management Application is a comprehensive web-based system designed to streamline administrative, academic, and financial operations for secondary schools. The application supports dual-language subsystems (English and French), multiple branches (Grammar, Technical, Commercial), and provides role-based access for administrators, teachers, students, parents, and bursars.

### Key Objectives
- Centralize school operations in a single platform
- Enable real-time data synchronization across all stakeholders
- Provide comprehensive reporting and analytics
- Support multi-language and multi-branch educational systems
- Ensure data security and compliance

### Target Users
- School Administrators
- Teachers
- Students
- Parents/Guardians
- Bursar/Financial Officers

---

## Product Overview

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication with bcryptjs
- **State Management**: React Context API
- **Form Handling**: React Hook Form with Zod validation
- **File Storage**: Supabase Storage
- **PDF Generation**: Puppeteer

### Key Capabilities
- Multi-role user management with role-based access control
- Student enrollment and academic record management
- Teacher management and subject assignment
- Class and timetable management
- Comprehensive grading and assessment system
- Attendance tracking
- Financial management and fee collection
- Reporting and analytics
- Document generation and export

---

## User Roles & Permissions

### 1. Administrator
**Access Level**: Full system access  
**Primary Responsibilities**:
- User account management (create, edit, delete, activate/deactivate)
- Student enrollment and management
- Teacher enrollment and management
- Class creation and management
- Timetable generation and management
- Examination creation and management
- Financial overview and configuration
- Attendance management
- System configuration and customization
- Reports generation and analytics
- Activity logging and audit trails

**Permissions**: `['all']`

### 2. Teacher
**Access Level**: Class and student-specific  
**Primary Responsibilities**:
- View assigned classes and students
- Create and manage assessments (quizzes, tests, exams, assignments, projects)
- Enter and manage student grades
- Create and manage assignments
- Grade student submissions
- Mark attendance for assigned classes
- View student performance analytics
- Communicate with parents (basic messaging)

**Permissions**: `['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']`

### 3. Student
**Access Level**: Personal records only  
**Primary Responsibilities**:
- View personal academic records and grades
- View class timetable and schedule
- View and submit assignments
- View attendance records
- Access learning resources
- Track personal performance
- View assignment grades and feedback

**Permissions**: `['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']`

### 4. Parent
**Access Level**: Child-specific information  
**Primary Responsibilities**:
- Monitor child's academic progress
- View child's attendance records
- View child's grades and assessments
- Access school communications
- View child's assignments and submissions
- View financial records (if applicable)

**Permissions**: `['view_child_progress', 'communicate_teachers', 'view_financial_records']`

### 5. Bursar
**Access Level**: Financial management  
**Primary Responsibilities**:
- Manage fee structures (create, edit, delete)
- Record student payments
- Generate payment receipts
- Track student fee balances
- Generate financial reports (collection, outstanding balances, revenue trends)
- Manage payment methods and fee categories
- View payment history

**Permissions**: `['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']`

---

## Core Features

### 1. Authentication & User Management

#### 1.1 User Account Management
- **User Creation**: Create accounts for all user roles with automatic password generation
- **User Editing**: Edit user profiles, contact information, and role assignments
- **User Status Management**: Activate, deactivate, or suspend user accounts
- **Password Management**: 
  - Default password assignment for new users
  - Password reset functionality
  - Password expiry tracking
  - Default password indicators
- **Role Assignment**: Assign and modify user roles (admin, teacher, student, parent, bursar)
- **Bulk Operations**: Bulk user creation, deletion, and status updates
- **User Search & Filtering**: Advanced search and filtering capabilities

#### 1.2 Authentication & Authorization
- **Secure Login**: Role-based authentication with email and password
- **Session Management**: Automatic session timeout and management
- **Password Policy**: Password validation and policy enforcement
- **Activity Logging**: Comprehensive audit trail of user actions
- **Avatar Management**: User profile picture upload and management

#### 1.3 User Profiles
- **Profile Settings**: Personal information management
- **Role-Specific Profiles**: Extended profiles with role-specific information
- **Contact Management**: Phone, email, address management
- **Emergency Contacts**: Emergency contact information storage

---

### 2. Student Management

#### 2.1 Student Enrollment
- **Multi-Step Enrollment Form**: 6-step progressive enrollment process
  1. Personal Information (name, birth details, gender, nationality)
  2. Contact Information (email, address, phone)
  3. Academic Information (subsystem, branch, class selection)
  4. Parent/Guardian Information
  5. Emergency & Medical Information
  6. Required Documents Confirmation
- **Dual Subsystem Support**: Enrollment in English or French subsystems
- **Branch Selection**: Support for Grammar, Technical, and Commercial branches
- **Automatic ID Generation**: Student ID (STU2024XXX) and Parent Code (PAR2024XXX)
- **Bulk Upload**: CSV import for bulk student enrollment
- **Enrollment Confirmation**: Success dialog with generated credentials

#### 2.2 Student Records Management
- **Comprehensive Student Profiles**: Complete student information management
- **Student Search & Filtering**: Search by name, ID, class, subsystem, branch
- **Student Status Management**: Active, inactive, graduated, transferred
- **Class Assignment**: Add/remove students from classes
- **Academic Progress Tracking**: Track progress across terms and academic years
- **Student Details View**: Comprehensive student information display
- **Bulk Operations**: Bulk student deletion and status updates
- **Pagination**: Efficient data pagination for large student lists

#### 2.3 Student Academic Information
- **Academic History**: Track academic progression
- **Class Promotion**: Automatic and manual class promotion
- **Medical Information**: Blood group, allergies, medical conditions
- **Emergency Contacts**: Multiple emergency contact management

---

### 3. Teacher Management

#### 3.1 Teacher Enrollment
- **Teacher Registration Form**: Comprehensive teacher enrollment
- **Teacher Profile Management**: Complete teacher information
- **Subject Assignment**: Assign subjects to teachers
- **Class Assignment**: Assign teachers to classes
- **Teacher ID Generation**: Automatic teacher ID generation (TCH2024XXX)

#### 3.2 Teacher Records
- **Teacher Profiles**: Complete teacher information management
- **Teacher Search & Filtering**: Advanced search capabilities
- **Subject-Teacher Mapping**: Manage subject assignments
- **Class-Teacher Relationships**: Manage class assignments
- **Teacher Export**: Export teacher data to CSV

---

### 4. Class Management

#### 4.1 Class Creation & Organization
- **Class Creation Form**: Create classes for each year and branch
- **Class Configuration**: Set subsystem, branch, level, and academic year
- **Subject Definition**: Define subjects for each branch and level
- **Class Capacity**: Set maximum student capacity

#### 4.2 Class Management
- **Class Roster Management**: Add/remove students from classes
- **Class Details View**: Comprehensive class information
- **Subject Management**: Manage class subjects
- **Teacher Assignment**: Assign teachers to classes and subjects
- **Class Statistics**: Student count, attendance rates, performance metrics

#### 4.3 Class Operations
- **Student Enrollment**: Enroll students in classes
- **Student Removal**: Remove students from classes
- **Class Search & Filtering**: Filter by subsystem, branch, level

---

### 5. Timetable Management

#### 5.1 Timetable Generation
- **Automatic Generation**: Generate timetables automatically for selected classes
- **Smart Assignment**: Automatically assigns teachers based on subject expertise
- **Room Allocation**: Intelligent room assignment based on availability
- **Conflict Resolution**: Prevents scheduling conflicts between teachers and rooms
- **Generation Options**: Customizable generation parameters

#### 5.2 Timetable Management
- **Timetable Viewing**: Multiple view modes (weekly, daily, list)
- **Timetable Editing**: Manual period editing and modification
- **Period Management**: Create, update, delete individual periods
- **Bulk Operations**: Bulk period creation, update, and deletion
- **Status Tracking**: Track timetable status (not_generated, generating, generated, modified, error)
- **Timetable Export**: Export timetables to CSV format

#### 5.3 Timetable Features
- **Filtering**: Filter by subsystem, branch, class
- **Conflict Detection**: Visual conflict indicators
- **Statistics Dashboard**: Period counts, subject distribution, teacher workload
- **Period Details**: Subject, teacher, room, time slot information

---

### 6. Academic Assessment

#### 6.1 Grade Management
- **Assessment Creation**: Create assessments (quiz, test, exam, assignment, project)
- **Grade Entry**: Enter and edit student grades
- **Bulk Grade Entry**: Enter grades for all students at once
- **Grade Calculation**: Automatic calculation of percentages and letter grades
- **Grade Validation**: Validation against total marks
- **Grade History**: Track grade changes and history
- **Performance Analytics**: Student and class performance statistics

#### 6.2 Examination Management
- **Examination Creation**: Create internal, external, mock, and continuous assessments
- **Major Exam Support**: Support for GCE, BEPC, Probatoire, Baccalauréat
- **Examination Scheduling**: Set examination dates and duration
- **Subject Selection**: Multi-subject examination support
- **Examination Management**: View, edit, delete examinations
- **Examination Details**: Comprehensive examination information display
- **Status Management**: Draft, scheduled, ongoing, completed, cancelled

#### 6.3 Assignment Management (Teachers)
- **Assignment Creation**: Create assignments with file uploads
- **Assignment Configuration**: Set due dates, total marks, passing marks
- **Submission Types**: File upload, text submission, or both
- **Assignment Management**: View, edit, delete assignments
- **Student Submission Viewing**: View and download student submissions
- **Grading System**: Grade submissions with marks and feedback
- **Submission Status Tracking**: Submitted, graded, late, absent, excused

#### 6.4 Assignment Management (Students)
- **Assignment Viewing**: View all assignments for student's class
- **Assignment Details**: View assignment instructions and files
- **File Download**: Download assignment files (PDF, DOCX)
- **Assignment Submission**: Upload files or submit text responses
- **Grade Viewing**: View grades, feedback, and letter grades

---

### 7. Attendance Management

#### 7.1 Attendance Tracking
- **Daily Attendance Recording**: Record attendance for classes
- **Attendance Statuses**: Present, absent, late, excused
- **Attendance Sessions**: Create and manage attendance sessions
- **Bulk Attendance Operations**: Mark attendance for multiple students
- **Attendance Validation**: Prevent duplicate attendance records

#### 7.2 Attendance Management
- **Attendance Records CRUD**: Create, read, update, delete attendance records
- **Attendance Sessions CRUD**: Manage attendance sessions
- **Attendance Editing**: Edit individual attendance records
- **Bulk Operations**: Bulk update and delete attendance records
- **Attendance History**: View attendance history by student or class

#### 7.3 Attendance Analytics
- **Attendance Percentages**: Calculate attendance percentages
- **Attendance Reports**: Generate attendance reports
- **Pattern Analysis**: Identify attendance patterns
- **Attendance Summaries**: Class and student attendance summaries
- **Statistics Dashboard**: Attendance statistics and metrics

---

### 8. Financial Management (Bursar)

#### 8.1 Fee Structure Management
- **Fee Structure Creation**: Create fee structures for classes and terms
- **Fee Structure Items**: Manage fee categories and amounts
- **Fee Structure CRUD**: Full CRUD operations for fee structures
- **Status Management**: Activate/deactivate fee structures
- **Fee Categories**: Predefined fee categories (Tuition, Registration, Examination, etc.)
- **Mandatory vs Optional**: Distinguish required and optional fees

#### 8.2 Payment Management
- **Payment Recording**: Record student payments with receipt generation
- **Payment Methods**: Support for Cash, Bank Transfer, Mobile Money, Cheque, Credit Card
- **Receipt Generation**: Automatic receipt number generation
- **Payment History**: View all payment transactions
- **Payment Updates**: Modify and cancel payments
- **Payment Validation**: Ensure payment amounts don't exceed balances

#### 8.3 Student Fee Management
- **Fee Assignment**: Assign fee structures to students
- **Balance Tracking**: Automatic calculation of paid vs outstanding amounts
- **Status Updates**: Automatic status updates (paid, partial, pending, overdue)
- **Outstanding Balances**: View and track outstanding balances
- **Due Date Management**: Track and enforce payment due dates

#### 8.4 Financial Reports
- **Collection Report**: Monthly fee collection summary with payment method breakdown
- **Outstanding Balances Report**: Students with outstanding balances and overdue payments
- **Revenue Trends Report**: Revenue analysis by period, class, and fee category
- **Export Functionality**: Export reports to CSV and JSON
- **Financial Statistics**: Total collections, outstanding amounts, payment trends

---

### 9. Reports & Analytics

#### 9.1 Analytics Dashboard
- **Metrics Overview**: Key performance indicators across all modules
- **Category Filtering**: Filter by enrollment, academic, financial, attendance, staffing
- **Time Period Selection**: Current week, month, term, academic year
- **Data Visualization**: Charts and graphs for data representation
- **Real-time Updates**: Live data refresh

#### 9.2 Academic Performance Reports
- **Student Performance Reports**: Individual and class performance reports
- **Subject Analysis**: Subject-wise performance analysis
- **Performance Distribution**: Visual breakdown of performance
- **Trend Analysis**: Performance trends over time
- **Report Generation**: Generate PDF and Excel reports

#### 9.3 Report Templates
- **Template Management**: Pre-defined report templates
- **Template Categories**: Academic, financial, attendance templates
- **Custom Templates**: Create custom report templates
- **Template Configuration**: Configure template parameters

#### 9.4 Generated Reports
- **Report History**: View previously generated reports
- **Report Download**: Download generated reports
- **Report Search**: Search and filter generated reports
- **Report Status**: Track report generation status

#### 9.5 Report Cards
- **Term Report Cards**: Generate term report cards
- **Sequence Results**: Generate sequence results
- **Annual Summaries**: Produce annual academic summaries
- **Promotion Statements**: Generate promotion/admission statements

---

### 10. App Configuration

#### 10.1 School Configuration
- **School Information**: School name, logo, address, contact information
- **School Branding**: Customize colors, logo, and branding
- **Academic Settings**: Academic year, terms, currency, timezone
- **Localization**: Language, date format, time format

#### 10.2 System Settings
- **Configuration Management**: CRUD operations for app configuration
- **Logo Upload**: Upload and manage school logo
- **Theme Customization**: Primary and secondary color customization
- **Settings Persistence**: Configuration changes persist across sessions

---

## Technical Architecture

### Frontend Architecture
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Components**: shadcn/ui component library
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Form Management**: React Hook Form with Zod validation
- **Data Fetching**: Server-side API routes with client-side state management

### Backend Architecture
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom authentication with bcryptjs
- **API Routes**: Next.js API routes
- **File Storage**: Supabase Storage
- **Real-time**: Supabase real-time subscriptions (basic implementation)

### Data Flow
1. User interactions trigger API calls
2. API routes interact with Supabase database
3. Data is validated and transformed
4. Responses are sent back to frontend
5. React Context updates application state
6. UI components re-render with new data

---

## Database Schema

### Core Tables

#### Users & Authentication
- **users**: User accounts with authentication and basic information
- **user_profiles**: Role-specific user information
- **user_activity_logs**: Audit trail for user actions

#### Academic Management
- **students**: Student records and information
- **teachers**: Teacher records and information
- **classes**: Class definitions and organization
- **subjects**: Subject definitions
- **class_students**: Student-class relationships
- **class_teachers**: Teacher-class relationships
- **teacher_subjects**: Teacher-subject assignments

#### Timetable
- **timetable_classes**: Class information for timetabling
- **timetable_teachers**: Teacher scheduling information
- **timetable_rooms**: Room information and availability
- **timetable_subjects**: Subject definitions for timetabling
- **timetable_periods**: Individual timetable periods
- **timetable_schedules**: Complete timetable schedules

#### Academic Assessment
- **assessments**: Assessment definitions
- **grades**: Student grades for assessments
- **examinations**: Examination definitions
- **assignments**: Assignment definitions
- **assignment_submissions**: Student assignment submissions

#### Attendance
- **attendance_sessions**: Attendance session definitions
- **attendance_records**: Individual attendance records

#### Financial
- **fee_structures**: Fee structure definitions
- **fee_structure_items**: Fee items within structures
- **student_fees**: Student fee assignments
- **payments**: Payment transactions
- **fee_categories**: Fee category definitions
- **payment_methods**: Payment method definitions

#### Configuration
- **app_configuration**: School and system configuration

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/password` - Password reset

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users` - Update user
- `DELETE /api/users` - Delete user
- `POST /api/users/reset-password` - Reset password
- `POST /api/users/bulk-delete` - Bulk delete users

### Students
- `GET /api/students` - List students
- `POST /api/students` - Create student
- `PUT /api/students` - Update student
- `DELETE /api/students` - Delete student

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class
- `PUT /api/classes` - Update class
- `DELETE /api/classes` - Delete class

### Timetable
- `GET /api/timetable` - Get timetable data
- `POST /api/timetable/generate-from-admin` - Generate timetable
- `GET /api/timetable/periods` - Get periods
- `POST /api/timetable/periods` - Create period
- `PUT /api/timetable/periods/[periodId]` - Update period
- `DELETE /api/timetable/periods/[periodId]` - Delete period
- `POST /api/timetable/bulk-delete` - Bulk delete periods
- `POST /api/timetable/bulk-update` - Bulk update periods

### Examinations
- `GET /api/examinations` - List examinations
- `POST /api/examinations` - Create examination
- `PUT /api/examinations` - Update examination
- `DELETE /api/examinations` - Delete examination

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments` - Update assignment
- `DELETE /api/assignments` - Delete assignment
- `GET /api/assignments/submissions` - List submissions
- `POST /api/assignments/submissions` - Create submission
- `PUT /api/assignments/submissions` - Update submission

### Attendance
- `GET /api/attendance` - Get attendance data
- `POST /api/attendance` - Create attendance record
- `PUT /api/attendance` - Update attendance record
- `DELETE /api/attendance` - Delete attendance record

### Financial (Bursar)
- `GET /api/bursar/fee-structures` - List fee structures
- `POST /api/bursar/fee-structures` - Create fee structure
- `PUT /api/bursar/fee-structures/[id]` - Update fee structure
- `DELETE /api/bursar/fee-structures/[id]` - Delete fee structure
- `GET /api/bursar/payments` - List payments
- `POST /api/bursar/payments` - Record payment
- `PUT /api/bursar/payments/[id]` - Update payment
- `DELETE /api/bursar/payments/[id]` - Cancel payment
- `GET /api/bursar/student-fees` - List student fees
- `POST /api/bursar/student-fees` - Assign fee to student
- `GET /api/bursar/reports/collection` - Collection report
- `GET /api/bursar/reports/outstanding` - Outstanding balances report
- `GET /api/bursar/reports/revenue` - Revenue trends report

### Configuration
- `GET /api/configuration` - Get app configuration
- `PUT /api/configuration` - Update app configuration
- `POST /api/configuration/upload-logo` - Upload logo

### Activity Logs
- `GET /api/activity-logs` - Get activity logs

---

## User Interface Requirements

### Design Principles
- **Responsive Design**: Mobile-first, works on all screen sizes
- **Accessibility**: WCAG compliant components
- **Modern UI**: Clean, professional interface using shadcn/ui
- **Dark Mode**: Theme toggle support
- **Loading States**: Clear loading indicators
- **Error Handling**: User-friendly error messages
- **Success Feedback**: Clear success notifications

### Component Library
- **shadcn/ui**: Modern, accessible component library
- **Radix UI**: Accessible primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization charts
- **React Hook Form**: Form management
- **Zod**: Schema validation

### Key UI Features
- **Sidebar Navigation**: Role-based navigation menus
- **Data Tables**: Sortable, filterable, paginated tables
- **Form Dialogs**: Modal forms for CRUD operations
- **Confirmation Dialogs**: Safe deletion and critical actions
- **Toast Notifications**: Success and error notifications
- **Progress Indicators**: Step-by-step progress in multi-step forms
- **Search & Filter**: Advanced search and filtering capabilities
- **Bulk Operations**: Bulk selection and operations
- **Export Functionality**: CSV and JSON export

---

## Security & Compliance

### Authentication & Authorization
- **Password Hashing**: bcryptjs for password hashing
- **Role-Based Access Control**: Strict role-based permissions
- **Session Management**: Secure session handling
- **Activity Logging**: Comprehensive audit trails

### Data Security
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: React's built-in XSS protection
- **File Upload Validation**: File type and size validation

### Data Privacy
- **User Data Protection**: Secure storage of sensitive information
- **Access Control**: Users can only access permitted data
- **Activity Tracking**: Log all user actions for audit purposes

---

## Future Enhancements

### Planned Features
- **Multi-Factor Authentication**: Enhanced security with MFA
- **Email Notifications**: Automated email notifications for key events
- **SMS Notifications**: SMS alerts for important updates
- **Mobile App**: Native mobile applications for iOS and Android
- **Parent Portal**: Enhanced parent communication portal
- **Library Management**: Library and resource management
- **Event Management**: School event and calendar management
- **Transportation Management**: School bus and transportation tracking
- **Inventory Management**: School inventory and asset management
- **Advanced Analytics**: Machine learning-based analytics and predictions

### Communication Enhancements
- **Group Messaging**: Enhanced group communication features
- **Announcement System**: Broadcast school announcements
- **Event Notifications**: Automated event notifications
- **Communication Preferences**: User communication preferences

### Reporting Enhancements
- **Custom Report Builder**: Build custom reports with drag-and-drop
- **Scheduled Reports**: Automatically generate and email reports
- **Advanced Analytics**: Predictive analytics and insights
- **Data Export**: Enhanced export formats (PDF, Excel, CSV)

---

## Appendix

### Glossary
- **Subsystem**: English or French educational system
- **Branch**: Grammar, Technical, or Commercial educational branch
- **Form/Level**: Grade level (Form 1-5, Sixth Form, etc.)
- **Term**: Academic term (First, Second, Third)
- **Academic Year**: Current academic year (e.g., 2024-2025)

### Acronyms
- **GCE**: General Certificate of Education
- **BEPC**: Brevet d'Études du Premier Cycle
- **STU**: Student ID prefix
- **TCH**: Teacher ID prefix
- **PAR**: Parent code prefix

### Version History
- **v1.0** (December 2024): Initial comprehensive PRD based on existing features

---

**Document Status**: Complete  
**Maintained By**: Development Team  
**Review Cycle**: Quarterly

