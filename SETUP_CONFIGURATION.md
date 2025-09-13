# App Configuration Setup Guide

## 🚨 Current Issue
The app configuration system is failing because the `app_configuration` table doesn't exist in your Supabase database yet.

## ✅ Quick Fix

### Step 1: Create the Database Table

1. **Open your Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project
   - Go to the **SQL Editor** tab

2. **Run the SQL Script**
   - Copy the contents of `scripts/create-app-configuration-table.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute the script

### Step 2: Verify the Setup

1. **Check the Table**
   - Go to **Table Editor** in your Supabase dashboard
   - Look for the `app_configuration` table
   - You should see one default record with "Pison Academy" as the school name

2. **Test the Configuration**
   - Refresh your app at `http://localhost:3000`
   - Login as an admin user
   - Navigate to "App Configuration" in the admin sidebar
   - You should now see the configuration interface working

## 🔧 Alternative: Manual Table Creation

If you prefer to create the table manually, use this simplified SQL:

```sql
-- Create the app_configuration table
CREATE TABLE app_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name VARCHAR(255) NOT NULL DEFAULT 'Pison Academy',
  school_logo_url TEXT,
  school_logo_alt_text VARCHAR(255) DEFAULT 'School Logo',
  school_address TEXT,
  school_phone VARCHAR(50),
  school_email VARCHAR(255),
  school_website VARCHAR(255),
  school_motto TEXT,
  primary_color VARCHAR(7) DEFAULT '#1f2937',
  secondary_color VARCHAR(7) DEFAULT '#3b82f6',
  academic_year VARCHAR(20) DEFAULT '2024-2025',
  currency VARCHAR(10) DEFAULT 'XOF',
  timezone VARCHAR(50) DEFAULT 'Africa/Douala',
  language VARCHAR(10) DEFAULT 'en',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(10) DEFAULT '24h',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Insert default configuration
INSERT INTO app_configuration (
  school_name,
  school_logo_url,
  school_logo_alt_text,
  school_address,
  school_phone,
  school_email,
  school_website,
  school_motto,
  primary_color,
  secondary_color,
  academic_year,
  currency,
  timezone,
  language,
  date_format,
  time_format
) VALUES (
  'Pison Academy',
  '/placeholder-logo.svg',
  'Pison Academy Logo',
  'Douala, Cameroon',
  '+237 123 456 789',
  'info@pisonacademy.cm',
  'https://pisonacademy.cm',
  'Excellence in Education',
  '#1f2937',
  '#3b82f6',
  '2024-2025',
  'XOF',
  'Africa/Douala',
  'en',
  'DD/MM/YYYY',
  '24h'
);

-- Enable Row Level Security
ALTER TABLE app_configuration ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all authenticated users to read, only admins to modify)
CREATE POLICY "Allow authenticated users to read app configuration" ON app_configuration
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin users to update app configuration" ON app_configuration
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow admin users to insert app configuration" ON app_configuration
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );
```

## 🎯 What This Fixes

- ✅ Resolves the "Failed to fetch configuration" error
- ✅ Enables the admin configuration interface
- ✅ Allows dynamic school name and logo changes
- ✅ Makes configuration changes visible to all users

## 🚀 After Setup

Once the table is created, you can:

1. **Change School Name**: Update from "Pison Academy" to your actual school name
2. **Upload Logo**: Add your school's logo
3. **Customize Colors**: Set your school's brand colors
4. **Configure Settings**: Set academic year, currency, timezone, etc.

The changes will be reflected immediately across all user interfaces (admin, teacher, student, parent, bursar portals).

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. Check that your Supabase environment variables are correctly set in `.env.local`
2. Verify that you're logged in as an admin user
3. Check the browser console for any additional error messages
4. Ensure the development server is running on port 3000
