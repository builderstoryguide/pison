# Cross-Role Permission Assignment Guide

## Overview

The cross-role permission assignment system allows administrators to assign permissions from any role to any user, creating flexible access control that goes beyond traditional role-based restrictions.

## Key Features

### 🔄 **Cross-Role Assignment**
- Admins can assign any permission to any user, regardless of their role
- Teachers can be given admin privileges
- Bursars can be given teacher permissions
- Any combination of permissions is possible

### 🛡️ **Admin-Only Control**
- Only users with `manage_users` permission can assign cross-role permissions
- All permission changes are logged for audit purposes
- Clear distinction between standard and cross-role permissions

### 📊 **Organized Permission Categories**
- **System Management**: Core system administration permissions
- **Academic Management**: Teaching and learning related permissions
- **Communication**: Messaging and communication permissions
- **Financial Management**: Financial and payment related permissions
- **Student/Parent Access**: Student and parent specific permissions
- **Reports & Analytics**: Access to system reports and analytics

## How to Use

### 1. Access the Enhanced Access Rights Dialog

1. Navigate to **User Management** in the admin dashboard
2. Find the user you want to manage
3. Click the **Actions** menu (three dots) for that user
4. Select **"Manage Access Rights"**

### 2. Enable Cross-Role Assignment

1. In the access rights dialog, toggle **"Enable Cross-Role Permission Assignment"**
2. This will show all available permissions from all roles
3. Cross-role permissions are marked with a "Cross-Role" badge

### 3. Assign Permissions

#### Standard Assignment (Role-Based)
- Only shows permissions appropriate for the user's role
- Permissions are marked with "Standard" badge
- Follows traditional role-based access control

#### Cross-Role Assignment
- Shows ALL available permissions in the system
- Permissions from other roles are marked with "Cross-Role" badge
- Allows maximum flexibility in permission assignment

### 4. Permission Categories

Each category can be:
- **Selected individually**: Check/uncheck specific permissions
- **Selected as a group**: Use the category checkbox to select all permissions in that category
- **Partially selected**: Shows indeterminate state when some permissions are selected

## API Usage

### Get All Permissions for Cross-Role Assignment

```http
GET /api/users/access-rights?role=teacher&forAdmin=true
```

**Response:**
```json
{
  "success": true,
  "permissions": ["all", "manage_users", "manage_system", ...],
  "rolePermissions": ["manage_classes", "grade_students", ...],
  "crossRoleAssignment": true
}
```

### Update User Permissions with Cross-Role Assignment

```http
PUT /api/users/access-rights
Content-Type: application/json

{
  "userId": "user-uuid",
  "permissions": ["manage_classes", "generate_reports", "manage_users"],
  "allowCrossRole": true,
  "updatedBy": "admin-user-id"
}
```

**Response:**
```json
{
  "success": true,
  "user": {...},
  "message": "User access rights updated successfully with cross-role permissions",
  "crossRoleAssignment": true,
  "assignedPermissions": ["manage_classes", "generate_reports", "manage_users"]
}
```

## Permission Categories

### System Management
- `all` - Full system access (use with extreme caution)
- `manage_users` - Create, edit, and delete user accounts
- `manage_system` - Configure system settings

### Academic Management
- `manage_classes` - Create and manage class assignments
- `grade_students` - Enter and modify student grades
- `mark_attendance` - Record student attendance
- `view_grades` - View student grades
- `view_schedule` - Access class schedules
- `submit_assignments` - Submit assignments

### Communication
- `communicate_parents` - Send messages to parents
- `communicate_teachers` - Send messages to teachers

### Financial Management
- `manage_finances` - Manage financial records
- `track_payments` - Track payment transactions
- `generate_reports` - Generate financial reports
- `send_fee_notices` - Send fee payment notices
- `view_financial_records` - View financial information

### Student/Parent Access
- `view_child_progress` - View child's academic progress
- `view_attendance` - View attendance records

### Reports & Analytics
- `view_reports` - Access system reports

## Common Use Cases

### 1. Teacher with Admin Privileges
```json
{
  "role": "teacher",
  "permissions": [
    "manage_classes",
    "grade_students",
    "mark_attendance",
    "manage_users",  // Cross-role: Admin permission
    "view_reports"   // Cross-role: Admin permission
  ]
}
```

### 2. Bursar with Teacher Capabilities
```json
{
  "role": "bursar",
  "permissions": [
    "manage_finances",
    "track_payments",
    "generate_reports",
    "manage_classes",    // Cross-role: Teacher permission
    "grade_students"     // Cross-role: Teacher permission
  ]
}
```

### 3. Student with Parent Access
```json
{
  "role": "student",
  "permissions": [
    "view_grades",
    "view_schedule",
    "submit_assignments",
    "view_child_progress"  // Cross-role: Parent permission
  ]
}
```

## Security Considerations

### ⚠️ **Important Security Notes**

1. **Admin Permissions**: The `all` permission grants unrestricted system access
2. **Audit Trail**: All cross-role permission changes are logged
3. **Admin Only**: Only users with `manage_users` permission can assign cross-role permissions
4. **Validation**: All permissions are validated against the complete permission list

### 🔍 **Best Practices**

1. **Principle of Least Privilege**: Only assign permissions that are actually needed
2. **Regular Review**: Periodically review cross-role assignments
3. **Documentation**: Document why cross-role permissions were assigned
4. **Monitoring**: Monitor activity logs for unusual permission usage

## Error Handling

### Common Error Responses

#### Insufficient Permissions
```json
{
  "error": "Insufficient permissions",
  "message": "Only administrators can manage user access rights"
}
```

#### Invalid Permissions
```json
{
  "error": "Invalid permissions: invalid_perm1, invalid_perm2",
  "validPermissions": ["manage_users", "manage_system", ...],
  "crossRoleAssignment": true
}
```

#### User Not Found
```json
{
  "error": "User not found"
}
```

## Activity Logging

All cross-role permission changes are logged with detailed information:

```
Action: UPDATE_ACCESS_RIGHTS
Details: Updated access rights for John Doe with cross-role permissions. New permissions: manage_classes, generate_reports, manage_users
Timestamp: 2024-01-15T10:30:00Z
```

This comprehensive logging ensures full auditability of permission changes and helps maintain security compliance.
