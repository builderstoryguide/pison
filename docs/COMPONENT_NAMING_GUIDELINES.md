# Component Naming Guidelines

## Overview
This document establishes naming conventions for React components to prevent naming conflicts and maintain consistency across the codebase.

## Naming Convention Rules

### 1. Role-Based Prefixing
All role-specific components MUST be prefixed with the role name:

- **Admin Components**: No prefix (e.g., `ExaminationManagement`, `UserManagement`)
- **Teacher Components**: Prefix with `Teacher` (e.g., `TeacherExaminationManagement`, `TeacherClassesView`)
- **Student Components**: Prefix with `Student` (e.g., `StudentGradesView`, `StudentDashboard`)
- **Parent Components**: Prefix with `Parent` (e.g., `ParentDashboard`, `ParentCommunication`)
- **Bursar Components**: Prefix with `Bursar` (e.g., `BursarDashboard`, `BursarProfile`)

### 2. Component File Organization
Components should be organized in role-specific folders:
```
components/
  ├── admin/
  │   ├── examination-management.tsx    (exports: ExaminationManagement)
  │   └── user-management.tsx
  ├── teacher/
  │   ├── examination-management.tsx    (exports: TeacherExaminationManagement)
  │   └── teacher-classes-view.tsx
  ├── student/
  │   └── student-grades-view.tsx
  └── parent/
      └── parent-dashboard.tsx
```

### 3. Export Names Must Be Unique
- Each component export name MUST be unique across the entire codebase
- If two components have similar functionality but different roles, they MUST have different names
- Example: `ExaminationManagement` (admin) vs `TeacherExaminationManagement` (teacher)

## Common Patterns

### Management Components
- Admin: `{Feature}Management` (e.g., `ExaminationManagement`)
- Teacher: `Teacher{Feature}Management` (e.g., `TeacherExaminationManagement`)
- Student: `Student{Feature}View` (e.g., `StudentGradesView`)

### Dashboard Components
- Admin: `Dashboard` or `{Feature}Dashboard`
- Teacher: `TeacherDashboard`
- Student: `StudentDashboard`
- Parent: `ParentDashboard`
- Bursar: `BursarDashboard`

### View Components
- Admin: `{Feature}View` or `{Feature}Management`
- Teacher: `Teacher{Feature}View` or `Teacher{Feature}Management`
- Student: `Student{Feature}View`
- Parent: `Parent{Feature}View`

## Checklist Before Adding New Components

Before creating a new component, verify:
- [ ] Component name follows the role-based prefixing convention
- [ ] Component name is unique (no conflicts with existing components)
- [ ] Component is placed in the correct role-specific folder
- [ ] Export name matches the component name
- [ ] Import statements in `dashboard.tsx` use the correct name

## How to Check for Conflicts

### Manual Check
1. Search for the component name across the codebase:
   ```bash
   grep -r "export function ComponentName" components/
   ```

2. Check all import statements in `components/dashboard.tsx` for duplicate names

### Automated Check (Recommended)
Create a pre-commit hook or script to check for duplicate component names:
```bash
# Example script to check for duplicate exports
grep -r "export function" components/ | sort | uniq -d
```

## Example: Correct Implementation

### Admin Component
```typescript
// components/admin/examination-management.tsx
export function ExaminationManagement() {
  // Component implementation
}
```

### Teacher Component
```typescript
// components/teacher/examination-management.tsx
export function TeacherExaminationManagement() {
  // Component implementation
}
```

### Dashboard Import
```typescript
// components/dashboard.tsx
import { ExaminationManagement } from "./admin/examination-management"
import { TeacherExaminationManagement } from "./teacher/examination-management"

// Usage in switch statement
case "examinations":
  return <ExaminationManagement />  // Admin view
case "examinations":
  return <TeacherExaminationManagement />  // Teacher view
```

## What to Do If You Find a Conflict

1. **Identify the conflict**: Which two components have the same name?
2. **Determine the correct naming**: Follow the role-based prefixing convention
3. **Rename one component**: Update the component function name and export
4. **Update all references**: 
   - Update import statements in `dashboard.tsx`
   - Update usage in switch statements
   - Search for any other references
5. **Verify**: Run the build and check for errors

## Prevention Tips

1. **Always check existing components** before creating a new one
2. **Use descriptive, role-prefixed names** from the start
3. **Follow the established patterns** in the codebase
4. **Update this document** if new naming patterns emerge

## Related Files

- `components/dashboard.tsx` - Main dashboard with all component imports
- `components/teacher/` - Teacher-specific components
- `components/admin/` - Admin-specific components
- `components/student/` - Student-specific components
- `components/parent/` - Parent-specific components

