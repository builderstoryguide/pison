# Bulk User Actions Guide

## Overview

The enhanced User Management system now provides Admins with bulk actions capabilities, specifically bulk deletion of multiple users.

## Features

### 1. Bulk Selection
- Checkbox for each user row
- Select all checkbox in table header
- Smart selection state management
- Selection persists across pagination

### 2. Bulk Actions Toolbar
- Appears when users are selected
- Shows selection count
- Bulk delete button
- Clear selection option

### 3. Bulk Delete
- Confirmation dialog
- Progress tracking
- Detailed results reporting
- Error handling for partial failures

## Security Features

- Admin role required
- Prevents self-deletion
- Protects admin accounts
- Cascading deletion of related data
- Comprehensive audit logging

## Usage

1. **Select Users**: Use checkboxes to select individual users or select all
2. **Bulk Actions**: Use the toolbar that appears when users are selected
3. **Confirm Deletion**: Confirm the action in the dialog
4. **Monitor Progress**: Watch for success/error messages
5. **Review Results**: Check the detailed results summary

## API Endpoint

**POST** `/api/users/bulk-delete`

**Request**:
```json
{
  "userIds": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Response**:
```json
{
  "success": true,
  "deletedCount": 3,
  "errors": [],
  "message": "Successfully deleted 3 users"
}
```

## Benefits

- Efficient management of large user bases
- Reduced administrative overhead
- Maintains data integrity
- Comprehensive security controls
- Detailed audit trail
