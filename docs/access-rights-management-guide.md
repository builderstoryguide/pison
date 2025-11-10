# Access Rights Management Guide

This guide explains how to use the new access rights management feature in the school management system.

## Overview

The access rights management system allows administrators to:
- View current permissions for any user
- Add or remove specific permissions from user accounts
- Manage permissions based on user roles
- Track permission changes in activity logs

## Features

### 1. Role-Based Permissions

Each user role has a predefined set of available permissions:

#### Admin
- `all` - Full system access (use with caution)
- `manage_users` - Create, edit, and delete user accounts
- `manage_system` - Configure system settings
- `view_reports` - Access system reports
- Plus all other permissions

#### Teacher
- `manage_classes` - Create and manage class assignments
- `grade_students` - Enter and modify student grades
- `mark_attendance` - Record student attendance
- `communicate_parents` - Send messages to parents
- `view_grades` - View student grades
- `view_schedule` - Access class schedules
- `submit_assignments` - Submit assignments
- `communicate_teachers` - Send messages to teachers
- `view_reports` - Access reports

#### Student
- `view_grades` - View their own grades
- `view_schedule` - Access their class schedule
- `submit_assignments` - Submit assignments
- `communicate_teachers` - Send messages to teachers
- `view_attendance` - View their attendance records

#### Parent
- `view_child_progress` - View child's academic progress
- `communicate_teachers` - Send messages to teachers
- `view_financial_records` - View financial information
- `view_attendance` - View child's attendance

#### Bursar
- `manage_finances` - Manage financial records
- `track_payments` - Track payment transactions
- `generate_reports` - Generate financial reports
- `send_fee_notices` - Send fee payment notices
- `view_financial_records` - View financial information

### 2. Permission Categories

Permissions are organized into logical categories:

- **System Management**: Core system administration permissions
- **Academic Management**: Teaching and learning related permissions
- **Communication**: Messaging and communication permissions
- **Financial Management**: Financial and payment related permissions
- **Student/Parent Access**: Student and parent specific permissions

## How to Use

### Method 1: From User Management Dashboard

1. Navigate to **User Management** in the admin dashboard
2. Find the user you want to manage
3. Click the **Actions** menu (three dots) for that user
4. Select **"Manage Access Rights"**
5. In the dialog that opens:
   - Review current permissions
   - Check/uncheck permissions to add/remove them
   - Use "Select All" for entire categories
   - Click **"Save Changes"** when done

### Method 2: From Edit User Form

1. Navigate to **User Management**
2. Click **"Edit User"** for the user you want to manage
3. In the edit form, find the **"Access Rights"** section
4. Click **"Manage Access Rights"** button
5. Follow the same steps as Method 1

### Method 3: Direct API Access

For programmatic access, use the API endpoints:

#### Get Available Permissions
```http
GET /api/users/access-rights?role=teacher
```

#### Update User Permissions
```http
PUT /api/users/access-rights
Content-Type: application/json

{
  "userId": "user-uuid",
  "permissions": ["manage_classes", "grade_students"],
  "updatedBy": "admin-user-id"
}
```

## Security Considerations

### Admin Permissions
- The `all` permission grants unrestricted system access
- Use extreme caution when assigning `all` permission
- Consider using specific permissions instead of `all` when possible

### Role Restrictions
- Users can only be assigned permissions appropriate for their role
- Attempting to assign invalid permissions will result in an error
- The system validates permissions against the user's role

### Activity Logging
- All permission changes are logged in the activity logs
- Logs include who made the change, when, and what permissions were modified
- This provides an audit trail for security compliance

## Best Practices

### 1. Principle of Least Privilege
- Only assign permissions that users actually need
- Regularly review and remove unnecessary permissions
- Start with minimal permissions and add more as needed

### 2. Regular Audits
- Periodically review user permissions
- Check activity logs for permission changes
- Ensure permissions align with current job responsibilities

### 3. Role-Based Approach
- Use role-based permissions as the foundation
- Only add additional permissions when necessary
- Document why specific permissions were granted

### 4. Testing
- Test permission changes in a development environment first
- Verify that users can still perform their required tasks
- Ensure that restricted users cannot access unauthorized features

## Troubleshooting

### Common Issues

#### "Invalid permissions for role" Error
- **Cause**: Trying to assign permissions not available for the user's role
- **Solution**: Check the available permissions for the user's role and only assign valid ones

#### "Failed to update access rights" Error
- **Cause**: Database or API error
- **Solution**: Check the server logs, verify database connectivity, and try again

#### User Cannot Access Expected Features
- **Cause**: Missing required permissions
- **Solution**: Review the user's current permissions and add the necessary ones

### Getting Help

1. Check the activity logs for detailed error information
2. Verify that the user's role supports the permissions you're trying to assign
3. Test with a different user to isolate the issue
4. Contact system administrator if problems persist

## API Reference

### Endpoints

#### GET /api/users/access-rights
Get available permissions for a specific role.

**Parameters:**
- `role` (query): The user role (admin, teacher, student, parent, bursar)

**Response:**
```json
{
  "success": true,
  "permissions": ["manage_classes", "grade_students", ...]
}
```

#### PUT /api/users/access-rights
Update user access rights.

**Request Body:**
```json
{
  "userId": "string",
  "permissions": ["string"],
  "updatedBy": "string" // optional
}
```

**Response:**
```json
{
  "success": true,
  "user": { ... },
  "message": "Access rights updated successfully"
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid permissions for teacher role: invalid_permission",
  "validPermissions": ["manage_classes", "grade_students", ...]
}
```

#### 404 Not Found
```json
{
  "error": "User not found"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Testing

Use the test page at `/test-access-rights` to verify functionality:

1. Navigate to the test page
2. Review the test results
3. Test the UI components with sample users
4. Verify API endpoints are working correctly

This comprehensive access rights management system provides administrators with fine-grained control over user permissions while maintaining security and auditability.
