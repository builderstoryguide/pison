# Database Setup Troubleshooting Guide

## Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when the API endpoint returns an HTML page instead of JSON data. This typically happens when:

1. **Database tables don't exist**
2. **Environment variables are not configured**
3. **Supabase connection issues**

## Quick Fix Steps

### Step 1: Check Environment Variables

Ensure your `.env.local` file has the correct Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 2: Run Database Setup Script

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire content of `scripts/quick-users-setup.sql`
4. Click "Run" to execute the script

### Step 3: Test Database Connection

Visit `/api/users/test` in your browser to test the database connection. You should see:

```json
{
  "success": true,
  "message": "Database connection successful",
  "userCount": 0
}
```

### Step 4: Verify Tables Exist

In Supabase SQL Editor, run:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'user_activity_logs');
```

You should see all three tables listed.

## Common Issues and Solutions

### Issue 1: "Database not set up" Error

**Solution**: Run the setup script in Supabase SQL Editor

### Issue 2: "Missing environment variables" Error

**Solution**: Check your `.env.local` file and restart your development server

### Issue 3: "Permission denied" Error

**Solution**: Ensure you're using the correct service role key, not the anon key

### Issue 4: "Table does not exist" Error

**Solution**: The setup script didn't run successfully. Try running it again.

## Manual Database Setup

If the automated script fails, you can create tables manually:

### 1. Create Users Table

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent', 'bursar')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    avatar_url TEXT,
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    permissions TEXT[],
    has_default_password BOOLEAN DEFAULT true,
    password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    password_expiry_date TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);
```

### 2. Create User Profiles Table

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_specific_id VARCHAR(50) UNIQUE,
    subsystem VARCHAR(20) CHECK (subsystem IN ('english', 'french')),
    branch VARCHAR(20) CHECK (branch IN ('grammar', 'technical', 'commercial')),
    class_name VARCHAR(50),
    occupation VARCHAR(100),
    relationship VARCHAR(20) CHECK (relationship IN ('father', 'mother', 'guardian', 'other')),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(20),
    blood_group VARCHAR(10),
    allergies TEXT,
    medical_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Create Activity Logs Table

```sql
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Create User Details View

```sql
CREATE OR REPLACE VIEW user_details AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.role,
    u.status,
    u.avatar_url,
    u.phone,
    u.address,
    u.date_of_birth,
    u.gender,
    u.permissions,
    u.has_default_password,
    u.password_last_changed,
    u.password_expiry_date,
    u.last_login,
    u.created_at,
    u.updated_at,
    u.created_by,
    up.role_specific_id,
    up.subsystem,
    up.branch,
    up.class_name,
    up.occupation,
    up.relationship,
    up.emergency_contact_name,
    up.emergency_contact_phone,
    up.emergency_contact_relationship,
    up.blood_group,
    up.allergies,
    up.medical_conditions
FROM users u
LEFT JOIN user_profiles up ON u.id = up.user_id;
```

## Testing the Setup

After setting up the database:

1. **Test API**: Visit `/api/users/test`
2. **Test User Management**: Visit `/test-user-management`
3. **Check Console**: Look for any error messages in the browser console

## Still Having Issues?

1. **Check Supabase Logs**: Go to Supabase Dashboard > Logs
2. **Verify API Routes**: Ensure all API files are in the correct location
3. **Restart Development Server**: Run `npm run dev` again
4. **Clear Browser Cache**: Hard refresh the page (Ctrl+F5)

## Support

If you're still experiencing issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase project settings
3. Ensure your environment variables are correctly set
4. Test the API endpoints directly in the browser
