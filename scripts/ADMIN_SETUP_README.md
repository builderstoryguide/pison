# Default Admin User Setup Scripts

This directory contains scripts to create default administrator login credentials for the Pison Academy of Excellence School Management System.

## Available Scripts

### 1. `create-default-admin.sql` (Complete Version)
- **Purpose**: Creates the complete database structure and admin user
- **Use Case**: When setting up the database for the first time
- **Features**:
  - Creates `users` and `user_profiles` tables if they don't exist
  - Creates necessary indexes
  - Inserts default admin user with proper credentials
  - Includes verification functions
  - Handles conflicts gracefully

### 2. `create-admin-user-simple.sql` (Simple Version)
- **Purpose**: Creates only the admin user
- **Use Case**: When the database tables already exist
- **Features**:
  - Inserts default admin user
  - Updates existing admin if found
  - Creates admin profile
  - Displays login credentials

### 3. `create-default-admin.js` (JavaScript Version)
- **Purpose**: Node.js script to create admin user
- **Use Case**: When you prefer to run scripts from command line
- **Features**:
  - Uses Supabase client
  - Includes password hashing
  - Provides detailed logging
  - Verifies user creation
  - Handles errors gracefully

### 4. `create-admin-user-fixed.sql` (Fixed SQL Version)
- **Purpose**: Fixed version that handles constraint issues
- **Use Case**: When you get "ON CONFLICT" errors
- **Features**:
  - Ensures necessary constraints exist
  - Uses DELETE + INSERT instead of ON CONFLICT
  - Handles missing constraints gracefully
  - Includes verification

### 5. `create-admin-user-simple-fixed.sql` (Simple Fixed Version)
- **Purpose**: Simple fixed version without ON CONFLICT
- **Use Case**: When you get constraint errors with the simple version
- **Features**:
  - Avoids ON CONFLICT issues
  - Uses DELETE + INSERT approach
  - Minimal and reliable

### 6. `create-admin-user-fixed.js` (Fixed JavaScript Version)
- **Purpose**: Fixed JavaScript version
- **Use Case**: When you get constraint errors with the JavaScript version
- **Features**:
  - Handles constraint issues
  - Uses DELETE + INSERT approach
  - Includes detailed error handling

## Default Admin Credentials

After running any of these scripts, you'll have a default admin user with these credentials:

- **Email**: `admin@pisonacademy.cm`
- **Password**: `Admin@2024ABC`
- **Role**: `admin`
- **Status**: `active`
- **Permissions**: `all`

## How to Use

### Option 1: SQL Scripts (Recommended for Database Setup)

1. **For Complete Setup** (first time):
   ```bash
   # Run in Supabase SQL Editor or psql
   \i scripts/create-default-admin.sql
   ```

2. **For Simple Setup** (tables exist):
   ```bash
   # Run in Supabase SQL Editor or psql
   \i scripts/create-admin-user-simple.sql
   ```

### Option 2: JavaScript Script

1. **Set Environment Variables**:
   ```bash
   export NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
   export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
   ```

2. **Run the Script**:
   ```bash
   node scripts/create-default-admin.js
   ```

## Security Notes

⚠️ **IMPORTANT SECURITY CONSIDERATIONS**:

1. **Change Default Password**: The default password `Admin@2024ABC` should be changed immediately after first login.

2. **Environment Variables**: Never commit your Supabase service role key to version control.

3. **Access Control**: The admin user has full permissions (`all`). Use with caution.

4. **Password Expiry**: The default password expires in 30 days. Users will be prompted to change it.

## Verification

After running any script, you can verify the admin user was created by:

1. **Checking the Database**:
   ```sql
   SELECT email, name, role, status, has_default_password 
   FROM users 
   WHERE email = 'admin@pisonacademy.cm';
   ```

2. **Testing Login**: Use the credentials to log into the application.

3. **Checking Profile**:
   ```sql
   SELECT up.role_specific_id, up.occupation
   FROM user_profiles up
   JOIN users u ON up.user_id = u.id
   WHERE u.email = 'admin@pisonacademy.cm';
   ```

## Troubleshooting

### Common Issues

1. **Permission Denied**: Make sure you're using the service role key, not the anon key.

2. **Table Doesn't Exist**: Use the complete SQL script (`create-default-admin.sql`) instead of the simple one.

3. **Email Already Exists**: The scripts handle conflicts by updating existing records.

4. **Password Hash Issues**: The JavaScript script handles password hashing automatically.

5. **ON CONFLICT Error**: If you get "there is no unique or exclusion constraint matching the ON CONFLICT specification", use the fixed versions:
   - `create-admin-user-fixed.sql` (SQL version)
   - `create-admin-user-simple-fixed.sql` (Simple SQL version)
   - `create-admin-user-fixed.js` (JavaScript version)

### Error Messages

- `❌ Missing environment variables`: Set the required Supabase environment variables.
- `❌ Error creating admin user`: Check database permissions and table structure.
- `⚠️ Admin user already exists`: This is normal - the script will update the existing user.
- `ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification`: Use the fixed versions of the scripts.

## Customization

You can customize the admin user by modifying the scripts:

- **Email**: Change `admin@pisonacademy.cm` to your preferred email
- **Name**: Change `System Administrator` to your preferred name
- **Password**: Change `Admin@2024ABC` to your preferred password
- **Phone**: Update the phone number format for your region
- **Address**: Update the address to your school's location

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Verify your Supabase connection and permissions
3. Ensure the database tables exist and have the correct structure
4. Check that the role constraint allows 'admin' role

## Next Steps

After creating the admin user:

1. Log in with the default credentials
2. Change the password immediately
3. Configure school settings
4. Create additional admin users if needed
5. Set up other user roles (teachers, students, parents, bursars)
