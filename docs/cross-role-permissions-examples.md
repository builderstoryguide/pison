# Cross-Role Permission Assignment Examples

## Example Scenarios

### 1. Teacher with Administrative Powers

**Scenario**: A senior teacher needs to manage user accounts and view system reports.

**Standard Teacher Permissions**:
- `manage_classes`
- `grade_students`
- `mark_attendance`
- `communicate_parents`
- `view_grades`
- `view_schedule`
- `submit_assignments`
- `communicate_teachers`
- `view_reports`

**Cross-Role Permissions Added**:
- `manage_users` (from admin role)
- `view_reports` (enhanced from admin role)

**Result**: The teacher can now create/edit user accounts while maintaining their teaching responsibilities.

### 2. Bursar with Teaching Capabilities

**Scenario**: A bursar who also teaches some classes needs grading and class management permissions.

**Standard Bursar Permissions**:
- `manage_finances`
- `track_payments`
- `send_fee_notices`
- `view_financial_records`

**Cross-Role Permissions Added**:
- `manage_classes` (from teacher role)
- `grade_students` (from teacher role)
- `mark_attendance` (from teacher role)
- `view_grades` (from teacher role)

**Result**: The bursar can manage both financial operations and teach classes.

### 3. Parent with Administrative Access

**Scenario**: A parent who is also a school board member needs administrative access.

**Standard Parent Permissions**:
- `view_child_progress`
- `communicate_teachers`
- `view_financial_records`
- `view_attendance`

**Cross-Role Permissions Added**:
- `manage_users` (from admin role)
- `view_reports` (from admin role)
- `manage_system` (from admin role)

**Result**: The parent can now perform administrative functions while maintaining parent access.

### 4. Student with Parent-Like Access

**Scenario**: An older student (e.g., in Form 6) who helps manage younger siblings' accounts.

**Standard Student Permissions**:
- `view_grades`
- `view_schedule`
- `submit_assignments`
- `communicate_teachers`
- `view_attendance`

**Cross-Role Permissions Added**:
- `view_child_progress` (from parent role)

**Result**: The student can view their siblings' academic progress.

## API Usage Examples

### Example 1: Grant Teacher Admin Permissions

```javascript
// Update a teacher to have admin user management capabilities
const response = await fetch('/api/users/access-rights', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'teacher-uuid-123',
    permissions: [
      // Standard teacher permissions
      'manage_classes',
      'grade_students',
      'mark_attendance',
      'communicate_parents',
      'view_grades',
      'view_schedule',
      'submit_assignments',
      'communicate_teachers',
      'view_reports',
      // Cross-role admin permissions
      'manage_users',
      'view_reports'
    ],
    allowCrossRole: true,
    updatedBy: 'admin-uuid-456'
  })
})

const result = await response.json()
console.log(result.message) // "User access rights updated successfully with cross-role permissions"
```

### Example 2: Grant Bursar Teaching Permissions

```javascript
// Update a bursar to have teaching capabilities
const response = await fetch('/api/users/access-rights', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'bursar-uuid-789',
    permissions: [
      // Standard bursar permissions
      'manage_finances',
      'track_payments',
      'send_fee_notices',
      'view_financial_records',
      // Cross-role teacher permissions
      'manage_classes',
      'grade_students',
      'mark_attendance',
      'view_grades'
    ],
    allowCrossRole: true,
    updatedBy: 'admin-uuid-456'
  })
})
```

### Example 3: Get All Available Permissions

```javascript
// Get all permissions available for cross-role assignment
const response = await fetch('/api/users/access-rights?role=teacher&forAdmin=true')
const result = await response.json()

console.log('All permissions:', result.permissions)
console.log('Role-specific permissions:', result.rolePermissions)
console.log('Cross-role assignment enabled:', result.crossRoleAssignment)
```

## Frontend Component Usage

### Using the Enhanced Access Rights Dialog

```tsx
import { EnhancedAccessRightsDialog } from '@/components/admin/enhanced-access-rights-dialog'

function UserManagementPage() {
  const [selectedUser, setSelectedUser] = useState(null)
  const [showAccessDialog, setShowAccessDialog] = useState(false)

  const handleManageAccessRights = (user) => {
    setSelectedUser(user)
    setShowAccessDialog(true)
  }

  return (
    <div>
      {/* User list with manage access rights button */}
      <button onClick={() => handleManageAccessRights(user)}>
        Manage Access Rights
      </button>

      {/* Enhanced access rights dialog */}
      {selectedUser && (
        <EnhancedAccessRightsDialog
          user={selectedUser}
          open={showAccessDialog}
          onOpenChange={setShowAccessDialog}
        />
      )}
    </div>
  )
}
```

## Permission Validation Examples

### Valid Cross-Role Assignments

```javascript
// ✅ Valid: Teacher with admin permissions
{
  "role": "teacher",
  "permissions": ["manage_classes", "manage_users", "view_reports"],
  "allowCrossRole": true
}

// ✅ Valid: Bursar with teacher permissions
{
  "role": "bursar", 
  "permissions": ["manage_finances", "grade_students", "manage_classes"],
  "allowCrossRole": true
}

// ✅ Valid: Student with parent permissions
{
  "role": "student",
  "permissions": ["view_grades", "view_child_progress"],
  "allowCrossRole": true
}
```

### Invalid Assignments

```javascript
// ❌ Invalid: Non-existent permission
{
  "role": "teacher",
  "permissions": ["manage_classes", "invalid_permission"],
  "allowCrossRole": true
}
// Error: "Invalid permissions: invalid_permission"

// ❌ Invalid: Cross-role disabled but using cross-role permissions
{
  "role": "teacher",
  "permissions": ["manage_classes", "manage_users"],
  "allowCrossRole": false
}
// Error: "Invalid permissions for teacher role: manage_users"

// ❌ Invalid: Non-admin trying to manage permissions
// Error: "Only administrators can manage user access rights"
```

## Best Practices

### 1. Document Cross-Role Assignments

When assigning cross-role permissions, document the reason:

```javascript
// Good: Document why cross-role permissions are needed
const crossRoleAssignment = {
  userId: 'teacher-123',
  permissions: ['manage_classes', 'manage_users'],
  allowCrossRole: true,
  reason: 'Senior teacher needs to manage substitute teacher accounts',
  updatedBy: 'admin-456'
}
```

### 2. Regular Permission Audits

```javascript
// Audit function to check for unusual cross-role assignments
async function auditCrossRolePermissions() {
  const users = await getAllUsers()
  
  users.forEach(user => {
    const rolePermissions = getStandardPermissions(user.role)
    const crossRolePermissions = user.permissions.filter(
      p => !rolePermissions.includes(p)
    )
    
    if (crossRolePermissions.length > 0) {
      console.log(`${user.name} has cross-role permissions:`, crossRolePermissions)
    }
  })
}
```

### 3. Gradual Permission Assignment

```javascript
// Start with minimal permissions and add more as needed
const minimalPermissions = ['manage_classes', 'grade_students']
const enhancedPermissions = [...minimalPermissions, 'manage_users']
const fullPermissions = [...enhancedPermissions, 'manage_system']

// Assign permissions gradually based on actual needs
```

This flexible permission system allows for precise access control while maintaining security and auditability.
