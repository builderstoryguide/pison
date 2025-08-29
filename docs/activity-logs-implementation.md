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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

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

### 3. **API Route** (`app/api/activity-logs/route.ts`)
- New endpoint for fetching activity logs
- Supports filtering and search
- Proper error handling
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

1. **No Logs Appearing**:
   - Check if `user_activity_logs` table exists
   - Verify API endpoint is accessible
   - Check browser console for errors

2. **Empty State Not Showing**:
   - Verify `activityLogs` array is empty
   - Check if loading state is working correctly

3. **API Errors**:
   - Check Supabase connection
   - Verify table permissions
   - Check API route logs

### Debug Commands

```sql
-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'user_activity_logs'
);

-- Check table structure
\d user_activity_logs

-- Check for data
SELECT COUNT(*) FROM user_activity_logs;

-- Check recent logs
SELECT * FROM user_activity_logs ORDER BY created_at DESC LIMIT 10;
```
