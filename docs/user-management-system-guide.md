# User Management System Guide

## Overview

The User Management System provides comprehensive user account management for the school management application. It allows administrators to view, create, edit, and manage all user types (Admin, Teachers, Students, Parents, and Bursars) with proper database integration and empty state handling.

## Features

### ✅ Implemented Features

1. **Database Integration**
   - All user data is fetched from the Supabase database
   - Real-time data synchronization
   - Proper error handling for database connection issues

2. **User Management**
   - View all users with role-based filtering
   - Create new users with role-specific information
   - Edit existing user profiles
   - Delete users with confirmation
   - Toggle user status (active/inactive/suspended)

3. **Search and Filtering**
   - Search users by name, email, or ID
   - Filter by role (Admin, Teacher, Student, Parent, Bursar)
   - Filter by status (Active, Inactive, Suspended)
   - Filter by subsystem (English, French)
   - Filter by branch (Grammar, Technical, Commercial)

4. **Password Management**
   - Reset user passwords with temporary passwords
   - Default password generation based on role
   - Password expiry tracking

5. **Empty States and Loading**
   - Loading indicators during data fetching
   - Empty state when no users exist
   - Empty state when search/filters return no results
   - Error states with retry functionality

6. **User Statistics**
   - Total user count
   - Role-based user counts
   - Status-based user counts

7. **Activity Logging**
   - Track user actions and changes
   - Audit trail for security compliance

## Database Schema

### Core Tables

#### `users` Table
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

#### `user_profiles` Table
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

#### `user_activity_logs` Table
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users.id)
- action (VARCHAR)
- details (TEXT)
- ip_address (INET)
- user_agent (TEXT)
- timestamp (TIMESTAMP)
```

### Database View

#### `user_details` View
A comprehensive view that joins users and user_profiles tables to provide all user information in a single query.

## API Endpoints

### GET `/api/users`
Retrieve users with optional filtering and pagination.

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

### POST `/api/users`
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

### PUT `/api/users`
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

### DELETE `/api/users?id=user-uuid&deletedBy=admin-user-id`
Delete a user.

### POST `/api/users/reset-password`
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

## User Roles and Permissions

### Admin
- **Permissions**: `['all']`
- **Capabilities**: Full system access, user management, system configuration

### Teacher
- **Permissions**: `['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']`
- **Capabilities**: Class management, grading, attendance tracking

### Student
- **Permissions**: `['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']`
- **Capabilities**: View academic information, submit work

### Parent
- **Permissions**: `['view_child_progress', 'communicate_teachers', 'view_financial_records']`
- **Capabilities**: Monitor child's progress, communicate with teachers

### Bursar
- **Permissions**: `['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']`
- **Capabilities**: Financial management, payment tracking

## Setup Instructions

### 1. Database Setup
Run the database setup script in your Supabase SQL Editor:

```sql
-- Run the contents of scripts/quick-users-setup.sql
```

### 2. Environment Variables
Ensure your environment variables are configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Component Integration
Wrap your user management component with the provider:

```tsx
import { UserManagementProvider } from '@/lib/user-management-context'
import { UserManagement } from '@/components/admin/user-management'

export default function AdminPage() {
  return (
    <UserManagementProvider>
      <UserManagement />
    </UserManagementProvider>
  )
}
```

## Usage Guide

### Viewing Users
1. Navigate to the User Management section
2. View the statistics dashboard showing user counts by role
3. Use the search bar to find specific users
4. Apply filters to narrow down results

### Creating Users
1. Click "Add User" button
2. Fill in the required information
3. Select the appropriate role
4. Add role-specific details
5. The system will generate a default password

### Managing Users
1. Use the actions menu (three dots) for each user
2. View detailed user information
3. Edit user profiles
4. Reset passwords
5. Toggle user status
6. Delete users (with confirmation)

### Search and Filter
- **Search**: Enter text to search by name, email, or ID
- **Role Filter**: Select specific roles to view
- **Status Filter**: Filter by active, inactive, or suspended users
- **Subsystem Filter**: Filter by English or French subsystem
- **Branch Filter**: Filter by grammar, technical, or commercial

## Empty States

The system provides appropriate empty states for different scenarios:

1. **No Users**: When the database is empty
2. **No Search Results**: When filters return no matches
3. **Loading**: During data fetching
4. **Error**: When database connection fails

## Security Features

1. **Password Management**
   - Secure password hashing with bcrypt
   - Default password generation
   - Password expiry tracking
   - Temporary password system

2. **Activity Logging**
   - All user actions are logged
   - IP address and user agent tracking
   - Audit trail for compliance

3. **Role-Based Access**
   - Permission-based access control
   - Role-specific capabilities
   - Secure API endpoints

## Testing

### Test Page
Visit `/test-user-management` to test the user management system.

### Database Testing
1. Ensure database tables exist
2. Verify API endpoints are working
3. Test user creation and management
4. Verify empty states and error handling

## Troubleshooting

### Common Issues

1. **No Users Displayed**
   - Check database connection
   - Verify tables exist
   - Check API endpoint responses

2. **API Errors**
   - Verify environment variables
   - Check Supabase permissions
   - Review server logs

3. **Empty States Not Showing**
   - Ensure proper loading states
   - Check error handling
   - Verify component logic

### Debug Steps
1. Check browser console for errors
2. Verify API responses in Network tab
3. Check Supabase logs
4. Test API endpoints directly

## Future Enhancements

1. **Email Integration**
   - Password reset emails
   - User notification emails
   - Bulk email functionality

2. **Advanced Filtering**
   - Date range filters
   - Custom field filters
   - Saved filter presets

3. **Bulk Operations**
   - Bulk user import
   - Bulk status changes
   - Bulk password resets

4. **Advanced Security**
   - Two-factor authentication
   - Session management
   - Advanced audit logging

## Support

For issues or questions about the User Management System:
1. Check this documentation
2. Review the code comments
3. Test with the provided test page
4. Check the database setup scripts
