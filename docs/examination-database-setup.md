# Examination Database Setup

## Overview

This document explains how to set up the database tables for the examination management system.

## Database Tables

### 1. Examinations Table

The `examinations` table stores all examination information:

```sql
CREATE TABLE IF NOT EXISTS examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('internal', 'external', 'mock', 'continuous_assessment')),
    exam_board VARCHAR(255) NOT NULL,
    subsystem VARCHAR(20) NOT NULL CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) NOT NULL CHECK (branch IN ('grammar', 'technical', 'commercial')),
    level VARCHAR(50) NOT NULL,
    subjects TEXT[] NOT NULL, -- Array of subject names
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    total_marks INTEGER NOT NULL,
    passing_marks INTEGER NOT NULL,
    venue VARCHAR(255) NOT NULL,
    instructions TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
    enrolled_students INTEGER DEFAULT 0,
    completed_students INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Exam Results Table

The `exam_results` table stores individual student results for each examination:

```sql
CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks INTEGER NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    remarks TEXT,
    date_recorded TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(examination_id, student_id, subject)
);
```

## Setup Instructions

### Option 1: Using the Setup Script

1. Make sure you have the required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Run the setup script:
   ```bash
   node scripts/setup-examinations-table.js
   ```

### Option 2: Manual SQL Execution

1. Open your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the SQL from `scripts/create-examinations-table.sql`
4. Execute the SQL

### Option 3: Using Supabase CLI

1. Install Supabase CLI if you haven't already
2. Run the migration:
   ```bash
   supabase db push
   ```

## Environment Variables

Make sure you have these environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Verification

After setting up the tables, you can verify they were created correctly by:

1. Going to your Supabase dashboard
2. Navigating to the Table Editor
3. Checking that both `examinations` and `exam_results` tables exist
4. Verifying the columns and constraints match the schema above

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you're using the service role key for table creation
2. **UUID Extension Missing**: The `uuid-ossp` extension should be enabled in Supabase
3. **Foreign Key Errors**: Make sure the referenced tables (`users`, `students`) exist

### Error Messages

- `relation "examinations" does not exist`: Table wasn't created, run the setup script again
- `permission denied`: Check your service role key permissions
- `invalid input syntax for type uuid`: Make sure the UUID extension is enabled

## Data Flow

1. **Create Examination**: Form data → `createExamination()` → Database insert → Local state update
2. **Update Examination**: Form data → `updateExamination()` → Database update → Local state update
3. **Delete Examination**: ID → `deleteExamination()` → Database delete → Local state update
4. **Load Examinations**: `loadExaminations()` → Database select → Local state update

## Testing

After setup, you can test the functionality by:

1. Creating a new examination through the form
2. Checking that it appears in the database
3. Verifying it shows up in the examination list
4. Testing edit and delete operations
