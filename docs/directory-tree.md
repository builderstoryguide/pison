# School Management App - Directory Tree

```
school-management-app/
├── 📁 app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
│
├── 📁 components/
│   ├── 📁 admin/
│   │   ├── activity-logs-view.tsx
│   │   ├── analytics-dashboard.tsx
│   │   ├── attendance-management.tsx
│   │   ├── attendance-marking-form.tsx
│   │   ├── class-creation-form.tsx
│   │   ├── class-details-dialog.tsx
│   │   ├── class-management.tsx
│   │   ├── create-user-form.tsx
│   │   ├── edit-user-form.tsx
│   │   ├── enrollment-success-dialog.tsx
│   │   ├── examination-creation-form.tsx
│   │   ├── examination-details-dialog.tsx
│   │   ├── examination-management.tsx
│   │   ├── fee-structure-form.tsx
│   │   ├── financial-management.tsx
│   │   ├── payment-form.tsx
│   │   ├── report-generation-form.tsx
│   │   ├── reports-analytics-management.tsx
│   │   ├── student-details-dialog.tsx
│   │   ├── student-enrollment-form.tsx
│   │   ├── student-fees-dialog.tsx
│   │   ├── student-management.tsx
│   │   ├── teacher-enrollment-form.tsx
│   │   ├── teacher-enrollment-success-dialog.tsx
│   │   ├── teacher-management.tsx
│   │   ├── user-details-dialog.tsx
│   │   └── user-management.tsx
│   │
│   ├── 📁 auth/
│   │   ├── auth-page.tsx
│   │   ├── login-form.tsx
│   │   ├── password-reset.tsx
│   │   └── register-form.tsx
│   │
│   ├── 📁 bursar/
│   │   └── bursar-dashboard.tsx
│   │
│   ├── 📁 parent/
│   │   ├── parent-child-records.tsx
│   │   ├── parent-communication.tsx
│   │   └── parent-dashboard.tsx
│   │
│   ├── 📁 profile/
│   │   ├── avatar-upload.tsx
│   │   ├── notification-preferences.tsx
│   │   ├── password-change.tsx
│   │   └── profile-settings.tsx
│   │
│   ├── 📁 teacher/
│   │   ├── assessment-creation-form.tsx
│   │   ├── class-details-dialog.tsx
│   │   ├── grade-entry-form.tsx
│   │   ├── grades-management.tsx
│   │   ├── student-grades-view.tsx
│   │   ├── teacher-attendance-form.tsx
│   │   ├── teacher-classes-view.tsx
│   │   └── teacher-dashboard.tsx
│   │
│   ├── 📁 ui/
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   └── tooltip.tsx
│   │
│   ├── dashboard.tsx
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── 📁 docs/
│   ├── project-structure.md
│   └── directory-tree.md
│
├── 📁 hooks/
│   └── use-mobile.ts
│
├── 📁 lib/
│   ├── attendance-context.tsx
│   ├── auth-context.tsx
│   ├── bursar-context.tsx
│   ├── class-management-context.tsx
│   ├── examination-context.tsx
│   ├── financial-context.tsx
│   ├── profile-context.tsx
│   ├── reports-analytics-context.tsx
│   ├── storage-utils.tsx
│   ├── student-enrollment-context.tsx
│   ├── student-management-context.tsx
│   ├── supabase.ts
│   ├── teacher-attendance-context.tsx
│   ├── teacher-classes-context.tsx
│   ├── teacher-grades-context.tsx
│   ├── teacher-management-context.tsx
│   ├── user-management-context.tsx
│   └── utils.ts
│
├── 📁 public/
│   ├── placeholder_64px.png
│   ├── placeholder-32px.png
│   ├── placeholder-logo.png
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   ├── placeholder-xyltx.png
│   ├── placeholder.jpg
│   └── placeholder.svg
│
├── 📁 scripts/
│   └── create-tables.sql
│
├── 📁 styles/
│   └── globals.css
│
├── .gitignore
├── components.json
├── next.config.mjs
├── package.json
├── pnpm-lock.yaml
├── postcss.config.mjs
├── README.md
└── tsconfig.json
```

## File Count Summary

- **Total Components**: 89 files
  - Admin Components: 25 files
  - Auth Components: 4 files
  - Bursar Components: 1 file
  - Parent Components: 3 files
  - Profile Components: 4 files
  - Teacher Components: 8 files
  - UI Components: 25 files
  - Root Components: 3 files

- **Context Providers**: 18 files
- **Custom Hooks**: 1 file
- **Static Assets**: 8 files
- **Configuration Files**: 6 files
- **Documentation**: 2 files

## Component Categories

### 🎯 Role-Based Components
- **Admin**: System administration, user management, financial oversight
- **Teacher**: Classroom management, grading, attendance
- **Bursar**: Financial management and fee collection
- **Parent**: Child monitoring and communication
- **Auth**: Authentication and user registration

### 🎨 UI Components
- **Form Elements**: Input, select, textarea, checkbox, radio
- **Layout**: Card, dialog, sheet, sidebar, tabs
- **Feedback**: Alert, badge, progress, skeleton
- **Navigation**: Dropdown, popover, tooltip
- **Data Display**: Table, calendar, avatar

### 🔧 Utility Components
- **Context Providers**: State management for each feature
- **Custom Hooks**: Reusable logic
- **Configuration**: Supabase setup and utilities
