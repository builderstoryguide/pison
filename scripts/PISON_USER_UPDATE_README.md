# Pison Academy User Update Scripts

This directory contains scripts to update all users in your database to use Pison Academy email addresses and reset their passwords.

## 📁 Files

1. **`update-all-users-to-pison.sql`** - Basic SQL script with placeholder password hashes
2. **`generate-pison-user-update-sql.js`** - Node.js script that generates the complete SQL with real password hashes
3. **`update-all-users-to-pison-with-hashes.sql`** - Generated SQL script with actual password hashes (created when you run the JS script)

## 🚀 How to Use

### Option 1: Use the Generated Script (Recommended)

1. **Run the generator script:**
   ```bash
   node scripts/generate-pison-user-update-sql.js
   ```

2. **Copy the generated SQL script** from `update-all-users-to-pison-with-hashes.sql`

3. **Open your Supabase SQL Editor**

4. **Paste and run the script**

5. **Verify the results** using the verification queries at the end of the script

### Option 2: Use the Basic Script

1. **Copy the SQL script** from `update-all-users-to-pison.sql`

2. **Replace the placeholder password hashes** with real bcrypt hashes

3. **Run in your Supabase SQL Editor**

## 📋 What the Script Does

### Updates Existing Users
- Changes all email addresses to use `@pisonacademy.cm` domain
- Resets all passwords to new secure defaults
- Sets `has_default_password = true` for all users
- Updates `password_last_changed` timestamp

### Creates Default Users (if they don't exist)
- **Admin**: `admin@pisonacademy.cm`
- **Teacher**: `teacher@pisonacademy.cm`
- **Student**: `student@pisonacademy.cm`
- **Parent**: `parent@pisonacademy.cm`
- **Bursar**: `bursar@pisonacademy.cm`

### Email Address Mapping
- `@gbhs-yaounde.cm` → `@pisonacademy.cm`
- `@gbhs.cm` → `@pisonacademy.cm`
- `@student.gbhs.cm` → `@student.pisonacademy.cm`
- Any existing admin/teacher/student/parent/bursar emails → corresponding Pison Academy emails

## 🔐 Generated Passwords

The script generates secure passwords using the format: `Role@Year + 4 random characters`

**Example passwords:**
- Admin: `Admin@2024`
- Teacher: `Teacher@2024K3W9`
- Student: `Student@20249YIK`
- Parent: `Parent@2024T93U`
- Bursar: `Bursar@2024ARJB`

## ⚠️ Important Notes

1. **Backup your database** before running the script
2. **All passwords expire in 30 days** - users should change them on first login
3. **The script uses `ON CONFLICT` clauses** to safely handle existing users
4. **Verification queries** are included to check the results
5. **All users will have `has_default_password = true`** after the update

## 🔍 Verification

After running the script, use these queries to verify the results:

```sql
-- Check all users
SELECT id, email, name, role, status, has_default_password 
FROM users 
ORDER BY role, email;

-- Count users by role
SELECT role, COUNT(*) as user_count
FROM users 
GROUP BY role
ORDER BY role;
```

## 🛠️ Troubleshooting

### If the script fails:
1. Check that you have the correct permissions in Supabase
2. Ensure the `users` table exists and has the required columns
3. Verify that email addresses are unique (no duplicates)

### If users can't log in:
1. Check that the password hashes were generated correctly
2. Verify that the email addresses were updated properly
3. Ensure the application is using the correct email addresses

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify the SQL syntax is correct
3. Ensure all required columns exist in the users table
4. Test with a single user first before running the full script
