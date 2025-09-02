# Admin User Creation Scripts

This directory contains scripts to create admin users for the Pison Academy School Management System.

## 🚀 Quick Start

### Option 1: SQL Script (Recommended)

1. **Open your Supabase dashboard**
2. **Go to SQL Editor**
3. **Copy and paste the content of `create-admin-users-complete.sql`**
4. **Click "Run" to execute the script**

### Option 2: Node.js Script

1. **Install dependencies:**
   ```bash
   npm install @supabase/supabase-js bcryptjs dotenv
   ```

2. **Run the script:**
   ```bash
   node scripts/create-admin-user.js
   ```

## 📋 Available Admin Users

After running the script, you'll have access to these admin accounts:

### Primary Administrator
- **Email:** `admin@pisonacademy.cm`
- **Password:** `Admin@2024`
- **Role:** admin
- **Permissions:** all
- **Admin ID:** ADM2024001

### Financial Administrator
- **Email:** `bursar@pisonacademy.cm`
- **Password:** `Admin@2024`
- **Role:** admin
- **Permissions:** all
- **Admin ID:** BUR2024001

### IT Administrator
- **Email:** `it@pisonacademy.cm`
- **Password:** `Admin@2024`
- **Role:** admin
- **Permissions:** all
- **Admin ID:** IT2024001

## 🔐 Login Instructions

1. **Open your application**
2. **Go to the login page**
3. **Select "Administrator" as your role**
4. **Enter one of the email addresses above**
5. **Enter the password:** `Admin@2024`
6. **Click "Sign In"**

## ⚠️ Important Security Notes

- **All users share the same initial password** for setup purposes
- **Password expires in 30 days** for security
- **Change password immediately** after first login
- **These are admin accounts** with full system access

## 🛠️ Troubleshooting

### If the script fails:

1. **Check your environment variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. **Verify database tables exist:**
   - `users` table
   - `user_profiles` table

3. **Check Supabase permissions:**
   - Ensure your service role key has write access

### If login still doesn't work:

1. **Verify the authentication API** is working
2. **Check browser console** for errors
3. **Verify the user was created** in the database
4. **Test with the `/test-auth` page** first

## 📁 Files Overview

- **`create-admin-user.sql`** - Simple SQL script for one admin user
- **`create-admin-users-complete.sql`** - Comprehensive script with multiple admin users
- **`create-admin-user.js`** - Node.js script for programmatic creation
- **`README.md`** - This instruction file

## 🎯 Next Steps

After successfully creating admin users:

1. **Log in to the system**
2. **Explore the admin dashboard**
3. **Create additional users** (teachers, students, parents)
4. **Set up classes and subjects**
5. **Configure system settings**

## 🆘 Need Help?

If you encounter issues:

1. **Check the terminal/logs** for error messages
2. **Verify your Supabase connection**
3. **Ensure all required tables exist**
4. **Test the authentication API endpoint**

---

**Happy Administering! 🎓**
