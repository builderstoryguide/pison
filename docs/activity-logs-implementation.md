# Activity Logs Implementation

This document describes the implementation of the activity logs functionality for the User Management section.

## Overview

The activity logs feature provides a comprehensive audit trail of user activities and system events. It displays data from the database and shows an appropriate empty state when no data is available.

## Features Implemented

### ✅ **Database Integration**
- **API Endpoint**: `/api/activity-logs` - Fetches activity logs from the `user_activity_logs` table
- **Real-time Data**: Activity logs are loaded from the database instead of mock data
- **Filtering Support**: API supports filtering by action, user, and search terms
- **Pagination Ready**: API supports limit and offset parameters for pagination

### ✅ **User Interface**
- **Loading States**: Shows loading spinner while fetching data
- **Empty State**: Displays a helpful message when no logs are found
- **Search & Filter**: Users can search and filter activity logs
- **Export Functionality**: Export filtered logs to CSV format
- **Refresh Button**: Manual refresh capability
- **Responsive Design**: Works on all screen sizes

### ✅ **Empty State Handling**
- **No Data Scenario**: Shows message when no activity logs exist in the database
- **Filtered Empty**: Shows different message when filters return no results
- **Refresh Option**: Provides refresh button to retry loading data
- **Clear Messaging**: Explains what activity logs are and when they appear

## Database Schema

The activity logs are stored in the `user_activity_logs` table:

```sql
CREATE TABLE user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Important**: The column is named `details` (not `description`). If you encounter schema mismatch errors, run the migration script `2025-11-04_019_fix_activity_logs_schema.sql` to ensure the schema is correct.

### Database Functions

Two database functions are available for activity logs:

1. **`get_recent_activity_logs(p_limit, p_offset)`**: Optimized function to fetch recent activity logs with user information
   - Returns logs with joined user data
   - More efficient than regular queries for unfiltered requests
   - Falls back to regular query if function is not available

2. **`log_user_activity(p_user_id, p_action, p_details, p_ip_address, p_user_agent)`**: Function to insert new activity logs
   - Returns the UUID of the created log entry
   - Used by API routes to log user activities
   - Handles all required fields automatically

## API Endpoint

### GET `/api/activity-logs`

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 100)
- `offset` (optional): Number of logs to skip (default: 0)
- `action` (optional): Filter by specific action
- `userId` (optional): Filter by specific user
- `search` (optional): Search in details, user name, or action

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "action": "LOGIN",
      "details": "User logged in successfully",
      "timestamp": "2024-01-01T12:00:00Z",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    }
  ],
  "total": 15,
  "hasMore": true
}
```

## Components Updated

### 1. **ActivityLogsView** (`components/admin/activity-logs-view.tsx`)
- Added loading state handling
- Implemented empty state with different messages
- Added refresh functionality
- Enhanced export with validation
- Improved responsive design

### 2. **UserManagementContext** (`lib/user-management-context.tsx`)
- Added `loadActivityLogs()` function
- Added `refreshActivityLogs()` function
- Added `isLoadingLogs` state
- Updated context interface and provider

### 3. **API Routes**
- **`app/api/activity-logs/route.ts`**: Main endpoint for fetching activity logs
- **`app/api/activity-logs/simple/route.ts`**: Simplified endpoint without function dependencies
- **`app/api/activity-logs/optimized/route.ts`**: Optimized endpoint using database functions
- All routes support filtering and search
- Proper error handling with actionable error messages
- Schema validation before querying
- Data transformation for frontend compatibility

## Usage Instructions

### For Administrators

1. **View Activity Logs**:
   - Navigate to User Management → Activity Logs
   - View all user activities and system events
   - Use search and filters to find specific activities

2. **Export Data**:
   - Click "Export Logs" to download CSV file
   - Export includes filtered results only

3. **Refresh Data**:
   - Click "Refresh" button to reload latest logs
   - Useful for monitoring real-time activities

### For Developers

1. **Add Sample Data**:
   ```sql
   -- Run in Supabase SQL Editor
   \i scripts/insert-sample-activity-logs.sql
   ```

2. **Test the Feature**:
   - Visit `/test-activity-logs` to test the functionality
   - Verify empty state, loading states, and data display

3. **Log New Activities**:
   ```typescript
   const { logActivity } = useUserManagement()
   
   // Log user activity
   logActivity('LOGIN', 'User logged in successfully', userId)
   ```

## Empty State Scenarios

### 1. **No Data in Database**
- **Message**: "No activity logs have been recorded yet. Activity logs will appear here as users interact with the system."
- **Action**: Shows refresh button to retry loading

### 2. **No Results from Filters**
- **Message**: "No activity logs match your current search criteria. Try adjusting your filters."
- **Action**: No refresh button (user should adjust filters)

### 3. **Loading State**
- **Message**: "Loading activity logs..."
- **Action**: Shows spinning refresh icon

## Testing

### Manual Testing Steps

1. **Empty State Test**:
   - Clear all data from `user_activity_logs` table
   - Visit activity logs page
   - Verify empty state message appears

2. **Data Loading Test**:
   - Insert sample data using the provided script
   - Refresh the page
   - Verify logs appear in the table

3. **Filtering Test**:
   - Use search box to filter logs
   - Use action and user filters
   - Verify filtered results

4. **Export Test**:
   - Apply some filters
   - Click export button
   - Verify CSV file contains filtered data

### Test Page

Visit `/test-activity-logs` to test the functionality in isolation.

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live updates
2. **Advanced Filtering**: Date range filters, bulk actions
3. **Analytics**: Activity trends and statistics
4. **Retention Policy**: Automatic cleanup of old logs
5. **Export Formats**: PDF, Excel export options

## Troubleshooting

### Common Issues

1. **Schema Mismatch Errors** (Column "details" does not exist):
   - **Cause**: The database column may be named `description` instead of `details`
   - **Solution**: Run the migration script `2025-11-04_019_fix_activity_logs_schema.sql` in your Supabase SQL Editor
   - This script will rename the column and create missing functions

2. **Function Not Found Errors** (Could not find the function):
   - **Cause**: Database functions `get_recent_activity_logs` or `log_user_activity` are missing
   - **Solution**: Run the migration script `2025-11-04_019_fix_activity_logs_schema.sql`
   - The API will automatically fall back to regular queries if functions are unavailable

3. **No Logs Appearing**:
   - Check if `user_activity_logs` table exists
   - Verify API endpoint is accessible
   - Check browser console for errors
   - Verify the `details` column exists (not `description`)

4. **Empty State Not Showing**:
   - Verify `activityLogs` array is empty
   - Check if loading state is working correctly

5. **API Errors**:
   - Check Supabase connection
   - Verify table permissions
   - Check API route logs
   - Look for schema validation errors in the response

### Debug Commands

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'user_activity_logs'
);

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_activity_logs'
ORDER BY ordinal_position;

-- Verify details column exists (not description)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_activity_logs' 
AND column_name IN ('details', 'description');

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_recent_activity_logs', 'log_user_activity');

-- Check for data
SELECT COUNT(*) FROM user_activity_logs;

-- Check recent logs
SELECT * FROM user_activity_logs ORDER BY created_at DESC LIMIT 10;

-- Test the get_recent_activity_logs function
SELECT * FROM get_recent_activity_logs(10, 0);
```

### Migration Script

If you encounter schema issues, run the migration script:

```sql
-- Run in Supabase SQL Editor
-- File: scripts/2025-11-04_019_fix_activity_logs_schema.sql
```

This script will:
- Rename `description` column to `details` (if needed)
- Create `get_recent_activity_logs` function
- Create `log_user_activity` function
- Add helpful indexes
- Grant necessary permissions
