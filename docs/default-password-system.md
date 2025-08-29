# Default Password System

## Overview

The default password system automatically assigns secure passwords to new users created by administrators. This ensures that all new accounts have proper authentication credentials from the start, and users can immediately log in with their assigned credentials.

## Features

### 1. Automatic Password Generation
- **Format**: `Role@Year + 4 random alphanumeric characters`
- **Examples**: 
  - Teacher: `Teacher@2024Xy9z`
  - Student: `Student@2024Ab3c`
  - Parent: `Parent@2024Kj8m`
  - Admin: `Admin@2024Pq7r`
  - Bursar: `Bursar@2024Nt5v`

### 2. Password Expiry
- **New Users**: 30 days from creation
- **Password Resets**: 7 days from reset
- **Security**: Forces users to change passwords regularly

### 3. Password Strength Validation
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

## Implementation

### User Creation Flow

1. **Admin creates user** via the User Management interface
2. **System generates default password** using the role-based format
3. **Password dialog appears** showing the generated password
4. **Admin copies password** and shares it securely with the user
5. **User receives credentials** and can log in immediately

### Password Reset Flow

1. **Admin clicks "Reset Password"** for a user
2. **System generates temporary password** with 7-day expiry
3. **Password dialog appears** showing the new temporary password
4. **Admin shares new password** with the user
5. **User must change password** within 7 days

## Technical Details

### Files Modified

1. **`lib/password-utils.ts`** - Password generation and validation utilities
2. **`lib/user-management-context.tsx`** - Updated user creation and password reset functions
3. **`components/admin/create-user-form.tsx`** - Added password display dialog
4. **`components/admin/user-management.tsx`** - Added password reset dialog
5. **`app/api/users/route.ts`** - API endpoint for user CRUD with password generation
6. **`app/api/users/reset-password/route.ts`** - API endpoint for password operations

### Database Schema Updates

The User interface now includes password management fields:

```sql
-- Users table includes these password-related fields:
has_default_password BOOLEAN DEFAULT true,
password_last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
password_expiry_date TIMESTAMP WITH TIME ZONE,
```

### API Endpoints

#### POST /api/users
- Creates new user with default password
- Returns generated password in response
- Sets password expiry to 30 days

#### POST /api/users/reset-password
- Resets user password to new temporary password
- Returns new password in response
- Sets password expiry to 7 days

#### PUT /api/users/reset-password
- Self-service password reset request
- Generates reset token and sends email (TODO)

#### PATCH /api/users/reset-password
- Verifies reset token and updates password
- Used for self-service password changes

## Usage Examples

### Creating a New User

```typescript
const result = await createUser({
  name: 'John Doe',
  email: 'john.doe@school.com',
  role: 'teacher',
  // ... other user data
})

if (result.success) {
  console.log('Generated password:', result.password)
  // Show password dialog to admin
}
```

### Resetting User Password

```typescript
const result = await resetUserPassword(userId)

if (result.success) {
  console.log('New temporary password:', result.password)
  // Show password dialog to admin
}
```

## Security Considerations

### Password Generation
- Uses cryptographically secure random generation
- Includes role prefix for easy identification
- Includes year for versioning
- 4 random characters for uniqueness

### Password Storage
- Passwords are hashed using bcrypt (cost factor 12)
- Never stored in plain text
- Password history not maintained (consider for future)

### Password Expiry
- Forces regular password changes
- Reduces risk of compromised passwords
- Different expiry periods for new vs reset passwords

### Access Control
- Only administrators can create users and reset passwords
- Self-service password reset available (email-based)
- All password operations are logged

## User Experience

### For Administrators
- Clear password display in modal dialogs
- Copy-to-clipboard functionality
- Expiry date information
- Success/error feedback

### For End Users
- Immediate access with provided credentials
- Clear password expiry notifications
- Self-service password reset capability
- Password strength requirements

## Future Enhancements

### Planned Features
1. **Email Integration**: Send passwords via email
2. **Password History**: Prevent reuse of recent passwords
3. **Password Policies**: Configurable strength requirements
4. **Bulk Operations**: Create multiple users at once
5. **Audit Trail**: Enhanced password change logging

### Security Improvements
1. **Multi-factor Authentication**: Add 2FA support
2. **Session Management**: Track active sessions
3. **Brute Force Protection**: Rate limiting for login attempts
4. **Password Complexity**: More sophisticated validation rules

## Troubleshooting

### Common Issues

1. **Password Not Generated**
   - Check API endpoint availability
   - Verify database connection
   - Check server logs for errors

2. **Password Dialog Not Showing**
   - Ensure createUser returns success: true
   - Check for JavaScript errors in console
   - Verify component state management

3. **Password Reset Fails**
   - Check user exists in database
   - Verify API permissions
   - Check database constraints

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG_PASSWORD_SYSTEM=true
```

This will log password generation and API calls for troubleshooting.

## Testing

### Unit Tests
- Password generation functions
- Password validation
- API endpoint responses

### Integration Tests
- User creation flow
- Password reset flow
- Database operations

### Manual Testing
1. Create new user with each role
2. Verify password format and expiry
3. Test password reset functionality
4. Verify password change via reset token

## Deployment Notes

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Setup
Ensure the users table has the required password fields:
```sql
-- Run the create-users-table.sql script
-- This sets up all necessary tables and indexes
```

### Production Considerations
1. **HTTPS Only**: Ensure all API calls use HTTPS
2. **Rate Limiting**: Implement API rate limiting
3. **Monitoring**: Set up alerts for failed password operations
4. **Backup**: Regular database backups including user data
5. **Compliance**: Ensure password policies meet regulatory requirements
