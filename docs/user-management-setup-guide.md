# User Management System Setup Guide

This guide explains how to set up and use the comprehensive user management system for the school management application.

## Overview

The user management system provides:
- User creation, editing, and deletion
- Role-based access control (Admin, Teacher, Student, Parent, Bursar)
- Password management with default passwords and reset functionality
- Activity logging and audit trails
- User profiles with role-specific information
- Session management and security features

## Database Schema

### Core Tables

#### 1. `users` Table
Main user authentication and basic information:
```sql
- id (UUID, Primary Key)
- email (VARCHAR, Unique)
- password_hash (VARCHAR)
- name (VARCHAR)
- role (VARCHAR) - admin, teacher, student, parent, bursar
- status (VARCHAR) - active, inactive, suspended
- avatar_url (TEXT)
- phone (VARCHAR)
- address (TEXT)
- date_of_birth (DATE)
- gender (VARCHAR) - male, female, other
- permissions (TEXT[]) - Array of permission strings
- has_default_password (BOOLEAN)
- password_last_changed (TIMESTAMP)
- password_expiry_date (TIMESTAMP)
- last_login (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- created_by (UUID, Foreign Key to users.id)
```

#### 2. `user_profiles` Table
Role-specific information and additional details:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- role_specific_id (VARCHAR, Unique) - STU2024001, TCH2024001, etc.
- subsystem (VARCHAR) - english, french
- branch (VARCHAR) - grammar, technical, commercial
- class_name (VARCHAR)
- occupation (VARCHAR)
- relationship (VARCHAR) - father, mother, guardian, other
- emergency_contact_name (VARCHAR)
- emergency_contact_phone (VARCHAR)
- emergency_contact_relationship (VARCHAR)
- blood_group (VARCHAR)
- allergies (TEXT)
- medical_conditions (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 3. `user_activity_logs` Table
Audit trail for user actions:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- action (VARCHAR)
- details (TEXT)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

#### 4. `user_sessions` Table
Active user sessions:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- session_token (VARCHAR, Unique)
- expires_at (TIMESTAMP)
- ip_address (INET)
- user_agent (TEXT)
- created_at (TIMESTAMP)
```

#### 5. `password_reset_tokens` Table
Password reset functionality:
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- token (VARCHAR, Unique)
- expires_at (TIMESTAMP)
- used (BOOLEAN)
- created_at (TIMESTAMP)
```

## Setup Instructions

### 1. Environment Variables

Ensure you have the following environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Setup

#### Option A: Using the Setup Script (Recommended)

1. Install required dependencies:
```bash
npm install bcryptjs @supabase/supabase-js
```

2. Run the database setup script:
```bash
node scripts/setup-users-database.js setup
```

3. Verify the setup:
```bash
node scripts/setup-users-database.js verify
```

#### Option B: Manual SQL Execution

1. Execute the SQL script in your Supabase SQL editor:
```bash
# Copy and paste the contents of scripts/create-users-table.sql
```

### 3. Default Admin User

The setup creates a default admin user:
- **Email**: admin@pisonacademy.cm
- **Password**: Admin@2024
- **Role**: admin
- **Permissions**: all

⚠️ **IMPORTANT**: Change this password immediately after first login!

## API Endpoints

### User Management

#### GET `/api/users`
Retrieve users with filtering and pagination.

**Query Parameters:**
- `role` - Filter by user role
- `status` - Filter by user status
- `search` - Search in name, email, or role-specific ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)

**Response:**
```json
{
  "users": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST `/api/users`
Create a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "role": "teacher",
  "phone": "+237 677 123 456",
  "address": "Yaoundé, Cameroon",
  "dateOfBirth": "1985-03-15",
  "gender": "male",
  "subsystem": "english",
  "branch": "grammar",
  "class": "Form 5A",
  "createdBy": "admin-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "password": "Teacher@2024123",
  "message": "User created successfully"
}
```

#### PUT `/api/users`
Update an existing user.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "name": "Updated Name",
  "phone": "+237 677 654 321",
  "updatedBy": "admin-user-id"
}
```

#### DELETE `/api/users?id=user-uuid&deletedBy=admin-user-id`
Delete a user.

### Password Management

#### POST `/api/users/reset-password`
Reset user password (admin action).

**Request Body:**
```json
{
  "userId": "user-uuid",
  "resetBy": "admin-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "password": "NewPassword123!",
  "message": "Password reset successfully"
}
```

#### PUT `/api/users/reset-password`
Request password reset (self-service).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### PATCH `/api/users/reset-password`
Use reset token to change password.

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "NewSecurePassword123!"
}
```

## Role-Based Permissions

### Admin
- **Permissions**: `['all']`
- **Capabilities**: Full system access, user management, system configuration

### Teacher
- **Permissions**: `['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']`
- **Capabilities**: Class management, grading, attendance, parent communication

### Student
- **Permissions**: `['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']`
- **Capabilities**: View grades and schedule, submit assignments, communicate with teachers

### Parent
- **Permissions**: `['view_child_progress', 'communicate_teachers', 'view_financial_records']`
- **Capabilities**: View child's progress, communicate with teachers, view financial records

### Bursar
- **Permissions**: `['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']`
- **Capabilities**: Financial management, payment tracking, report generation

## Security Features

### Password Management
- Default passwords are generated for new users
- Passwords expire after 30 days
- Strong password requirements for self-service resets
- Secure password hashing using bcrypt

### Session Management
- Session tokens with expiration
- IP address and user agent tracking
- Automatic session cleanup

### Activity Logging
- All user actions are logged
- IP address and user agent tracking
- Detailed audit trail for compliance

### Data Validation
- Input validation on all API endpoints
- SQL injection prevention
- XSS protection through proper escaping

## Usage Examples

### Creating a New Teacher

```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Jane Smith',
    email: 'jane.smith@pisonacademy.cm',
    role: 'teacher',
    phone: '+237 677 234 567',
    address: 'Douala, Cameroon',
    dateOfBirth: '1988-07-15',
    gender: 'female',
    subsystem: 'english',
    branch: 'grammar',
    createdBy: 'admin-user-id'
  })
});

const result = await response.json();
console.log('Generated password:', result.password);
```

### Fetching Users with Filters

```javascript
const response = await fetch('/api/users?role=teacher&status=active&page=1&limit=20');
const data = await response.json();
console.log('Teachers:', data.users);
console.log('Total pages:', data.pagination.totalPages);
```

### Resetting User Password

```javascript
const response = await fetch('/api/users/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user-uuid',
    resetBy: 'admin-user-id'
  })
});

const result = await response.json();
console.log('New password:', result.password);
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify environment variables are set correctly
   - Check Supabase project status
   - Ensure service role key has proper permissions

2. **Permission Denied Errors**
   - Verify RLS (Row Level Security) policies
   - Check user permissions in Supabase dashboard
   - Ensure proper role assignments

3. **Password Reset Issues**
   - Check token expiration (1 hour default)
   - Verify email configuration for reset links
   - Ensure proper token cleanup

### Debugging

Enable detailed logging by checking the browser console and server logs for:
- API request/response details
- Database query errors
- Authentication issues
- Permission violations

## Best Practices

1. **Security**
   - Always change default passwords
   - Use strong password policies
   - Implement rate limiting for password resets
   - Regular security audits

2. **Data Management**
   - Regular database backups
   - Archive old activity logs
   - Clean up expired sessions
   - Monitor database performance

3. **User Experience**
   - Clear error messages
   - Intuitive user interfaces
   - Responsive design
   - Accessibility compliance

## Support

For additional support or questions:
1. Check the application logs
2. Review the API documentation
3. Consult the Supabase documentation
4. Contact the development team

---

**Last Updated**: January 2024
**Version**: 1.0.0
