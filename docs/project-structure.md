# School Management App - Project Directory Structure

## Overview
This document provides a comprehensive overview of the project directory structure for the School Management Application built with Next.js, TypeScript, and Supabase.

## Root Directory Structure

```
school-management-app/
├── app/                          # Next.js App Router directory
├── components/                   # React components organized by feature
├── lib/                         # Utility libraries and contexts
├── hooks/                       # Custom React hooks
├── public/                      # Static assets
├── scripts/                     # Database and utility scripts
├── styles/                      # Global styles
├── docs/                        # Project documentation
├── package.json                 # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── next.config.mjs             # Next.js configuration
├── postcss.config.mjs          # PostCSS configuration
├── components.json             # shadcn/ui configuration
├── pnpm-lock.yaml              # Package lock file
├── .gitignore                  # Git ignore rules
└── README.md                   # Project readme
```

## Detailed Directory Breakdown

### 📁 app/ - Next.js App Router
```
app/
├── globals.css                  # Global CSS styles
├── layout.tsx                   # Root layout component
├── loading.tsx                  # Loading component
└── page.tsx                     # Home page component
```

### 📁 components/ - React Components

#### 📁 components/ui/ - Reusable UI Components
```
components/ui/
├── alert-dialog.tsx            # Alert dialog component
├── alert.tsx                   # Alert component
├── avatar.tsx                  # Avatar component
├── badge.tsx                   # Badge component
├── button.tsx                  # Button component
├── calendar.tsx                # Calendar component
├── card.tsx                    # Card component
├── checkbox.tsx                # Checkbox component
├── dialog.tsx                  # Dialog component
├── dropdown-menu.tsx           # Dropdown menu component
├── form.tsx                    # Form component
├── input.tsx                   # Input component
├── label.tsx                   # Label component
├── popover.tsx                 # Popover component
├── progress.tsx                # Progress component
├── radio-group.tsx             # Radio group component
├── scroll-area.tsx             # Scroll area component
├── select.tsx                  # Select component
├── separator.tsx               # Separator component
├── sheet.tsx                   # Sheet component
├── sidebar.tsx                 # Sidebar component
├── skeleton.tsx                # Skeleton component
├── switch.tsx                  # Switch component
├── table.tsx                   # Table component
├── tabs.tsx                    # Tabs component
├── textarea.tsx                # Textarea component
└── tooltip.tsx                 # Tooltip component
```

#### 📁 components/admin/ - Administrator Components
```
components/admin/
├── activity-logs-view.tsx       # Activity logs viewing component
├── analytics-dashboard.tsx      # Analytics dashboard component
├── attendance-management.tsx    # Attendance management component
├── attendance-marking-form.tsx  # Attendance marking form
├── class-creation-form.tsx      # Class creation form
├── class-details-dialog.tsx     # Class details dialog
├── class-management.tsx         # Class management component
├── create-user-form.tsx         # User creation form
├── edit-user-form.tsx           # User editing form
├── enrollment-success-dialog.tsx # Enrollment success dialog
├── examination-creation-form.tsx # Examination creation form
├── examination-details-dialog.tsx # Examination details dialog
├── examination-management.tsx   # Examination management
├── fee-structure-form.tsx       # Fee structure form
├── financial-management.tsx     # Financial management
├── payment-form.tsx             # Payment form
├── report-generation-form.tsx   # Report generation form
├── reports-analytics-management.tsx # Reports and analytics
├── student-details-dialog.tsx   # Student details dialog
├── student-enrollment-form.tsx  # Student enrollment form
├── student-fees-dialog.tsx      # Student fees dialog
├── student-management.tsx       # Student management
├── teacher-enrollment-form.tsx  # Teacher enrollment form
├── teacher-enrollment-success-dialog.tsx # Teacher enrollment success
├── teacher-management.tsx       # Teacher management
├── user-details-dialog.tsx      # User details dialog
└── user-management.tsx          # User management
```

#### 📁 components/auth/ - Authentication Components
```
components/auth/
├── auth-page.tsx                # Authentication page wrapper
├── login-form.tsx               # Login form component
├── password-reset.tsx           # Password reset component
└── register-form.tsx            # Registration form component
```

#### 📁 components/bursar/ - Bursar Components
```
components/bursar/
└── bursar-dashboard.tsx         # Bursar dashboard component
```

#### 📁 components/parent/ - Parent Components
```
components/parent/
├── parent-child-records.tsx     # Parent child records view
├── parent-communication.tsx     # Parent communication component
└── parent-dashboard.tsx         # Parent dashboard component
```

#### 📁 components/profile/ - Profile Management Components
```
components/profile/
├── avatar-upload.tsx            # Avatar upload component
├── notification-preferences.tsx # Notification preferences
├── password-change.tsx          # Password change component
└── profile-settings.tsx         # Profile settings component
```

#### 📁 components/teacher/ - Teacher Components
```
components/teacher/
├── assessment-creation-form.tsx # Assessment creation form
├── class-details-dialog.tsx     # Class details dialog
├── grade-entry-form.tsx         # Grade entry form
├── grades-management.tsx        # Grades management
├── student-grades-view.tsx      # Student grades view
├── teacher-attendance-form.tsx  # Teacher attendance form
├── teacher-classes-view.tsx     # Teacher classes view
└── teacher-dashboard.tsx        # Teacher dashboard
```

#### 📁 components/ - Root Level Components
```
components/
├── dashboard.tsx                # Main dashboard component
├── theme-provider.tsx           # Theme provider component
└── theme-toggle.tsx             # Theme toggle component
```

### 📁 lib/ - Utility Libraries and Contexts
```
lib/
├── attendance-context.tsx       # Attendance context provider
├── auth-context.tsx             # Authentication context
├── bursar-context.tsx           # Bursar context provider
├── class-management-context.tsx # Class management context
├── examination-context.tsx      # Examination context
├── financial-context.tsx        # Financial context
├── profile-context.tsx          # Profile context
├── reports-analytics-context.tsx # Reports and analytics context
├── storage-utils.tsx            # Storage utility functions
├── student-enrollment-context.tsx # Student enrollment context
├── student-management-context.tsx # Student management context
├── supabase.ts                  # Supabase client configuration
├── teacher-attendance-context.tsx # Teacher attendance context
├── teacher-classes-context.tsx  # Teacher classes context
├── teacher-grades-context.tsx   # Teacher grades context
├── teacher-management-context.tsx # Teacher management context
├── user-management-context.tsx  # User management context
└── utils.ts                     # General utility functions
```

### 📁 hooks/ - Custom React Hooks
```
hooks/
└── use-mobile.ts               # Mobile detection hook
```

### 📁 public/ - Static Assets
```
public/
├── placeholder_64px.png         # 64px placeholder image
├── placeholder-32px.png         # 32px placeholder image
├── placeholder-logo.png         # Logo placeholder
├── placeholder-logo.svg         # Logo SVG placeholder
├── placeholder-user.jpg         # User placeholder image
├── placeholder-xyltx.png        # Xyltx placeholder image
├── placeholder.jpg              # General placeholder image
└── placeholder.svg              # General SVG placeholder
```

### 📁 scripts/ - Database and Utility Scripts
```
scripts/
└── create-tables.sql           # Database table creation script
```

### 📁 styles/ - Global Styles
```
styles/
└── globals.css                 # Global CSS styles
```

## Key Configuration Files

### package.json
- Dependencies and development dependencies
- Scripts for development, building, and deployment
- Project metadata

### tsconfig.json
- TypeScript configuration
- Compiler options and paths

### next.config.mjs
- Next.js configuration
- Build and deployment settings

### components.json
- shadcn/ui configuration
- Component library settings

### postcss.config.mjs
- PostCSS configuration
- CSS processing settings

## Architecture Patterns

### 1. Role-Based Component Organization
Components are organized by user roles:
- **Admin**: System administration and management
- **Teacher**: Teaching and grading functionality
- **Bursar**: Financial management
- **Parent**: Parent-specific features
- **Auth**: Authentication and authorization

### 2. Context-Based State Management
Each major feature has its own context provider in the `lib/` directory:
- Centralized state management
- Separation of concerns
- Reusable state logic

### 3. UI Component Library
Comprehensive set of reusable UI components using shadcn/ui:
- Consistent design system
- Accessible components
- Theme support

### 4. Database Integration
- Supabase integration for backend services
- SQL scripts for database setup
- Context providers for data management

## Development Guidelines

### Component Naming Convention
- Use kebab-case for file names
- Descriptive names that indicate functionality
- Group related components in feature directories

### File Organization
- Keep related files together
- Separate concerns by feature
- Use consistent directory structure

### State Management
- Use React Context for global state
- Keep contexts focused and specific
- Implement proper error handling

This structure provides a scalable and maintainable foundation for the school management application, with clear separation of concerns and role-based organization.
