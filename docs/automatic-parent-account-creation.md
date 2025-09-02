# Automatic Parent Account Creation

## Overview

When a student is enrolled, the system automatically creates a parent account linked to the student.

## How It Works

1. **Student Enrollment** → Creates student record
2. **Parent Code Generation** → Generates unique parent code (PAR2024001)
3. **Parent Record Creation** → Creates parent in parents table
4. **Parent User Account** → Creates user account with role 'parent'
5. **User Profile** → Links parent to their code
6. **Relationship Establishment** → Links parent to student

## Features

- **Automatic Password Generation**: Parent@2024
- **Parent Permissions**: View child progress, schedule, fees, attendance
- **Secure Linking**: Parent can only access their child's information
- **Phone Number Prefilling**: +237 6 for Cameroon numbers

## Database Tables

- `students` - Student information
- `parents` - Parent information linked to students
- `users` - Authentication for all users
- `user_profiles` - Role-specific information

## Success Response

Returns student ID, parent code, and generated passwords for both accounts.
