# User Management Changes

## Overview
Modified the User Management section to restrict user creation to only Admin, Teacher, and Bursar roles, while still displaying all users (including Students and Parents) in the user table.

## Changes Made

### 1. DynamicUserForm Component (`components/admin/dynamic-user-form.tsx`)

#### Role Selection Changes
- **Before**: Allowed creation of Admin, Teacher, Bursar, Student, and Parent
- **After**: Only allows creation of Admin, Teacher, and Bursar

#### Key Changes:
- Split `roleIcons` into `creatableRoleIcons` and `allRoleIcons`
- Updated role selection grid to only show creatable roles
- Added informational section explaining that Students and Parents are created through Student Management
- Updated `AdminBursarParentForm` type definition to remove 'parent' role
- Removed parent permissions from `rolePermissions`

#### New UI Elements:
- Added informational card explaining where to create Students and Parents
- Updated role descriptions to be more specific

### 2. User Management Component (`components/admin/user-management.tsx`)

#### Dialog Description Update
- **Before**: "Add a new user to the school management system"
- **After**: "Add a new Admin, Teacher, or Bursar to the school management system. Students and Parents are created through Student Management."

## User Experience

### What Users Can Do:
✅ **Create**: Admin, Teacher, Bursar accounts
✅ **View**: All users (Admin, Teacher, Bursar, Student, Parent) in the table
✅ **Edit**: All users regardless of role
✅ **Manage**: All users through the existing user management interface

### What Users Cannot Do:
❌ **Create**: Student or Parent accounts through User Management
✅ **Create**: Students and Parents through Student Management (as intended)

## Benefits

1. **Clear Separation of Concerns**: User Management focuses on staff accounts
2. **Better User Experience**: Clear guidance on where to create different user types
3. **Maintained Functionality**: All users still visible and manageable
4. **Consistent Workflow**: Students and Parents created through their dedicated section

## Technical Details

### Files Modified:
- `components/admin/dynamic-user-form.tsx`
- `components/admin/user-management.tsx`

### Type Changes:
- `AdminBursarParentForm` role type: `'admin' | 'bursar' | 'parent'` → `'admin' | 'bursar'`
- Removed parent permissions from role permissions object

### UI Changes:
- Role selection grid now shows only 3 options instead of 5
- Added informational section about Students and Parents
- Updated dialog descriptions for clarity

## Migration Notes

- **No database changes required**
- **No API changes required**
- **Existing users remain unaffected**
- **All existing functionality preserved**
