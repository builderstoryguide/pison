# Timetable Bulk Delete Feature

## Overview

The Timetable Bulk Delete feature allows administrators to efficiently delete multiple class timetables at once, streamlining the management of scheduling data in the school management system.

## Features

### ✅ Bulk Selection
- **Master Checkbox**: Select/deselect all available timetables at once
- **Individual Checkboxes**: Select specific timetables for deletion
- **Smart Selection**: Only shows checkboxes for classes that have generated timetables
- **Visual Feedback**: Selected timetables are clearly indicated

### ✅ Bulk Actions Toolbar
- **Selection Counter**: Shows the number of selected timetables
- **Delete Selected**: Bulk delete button with destructive styling
- **Clear Selection**: Quick way to deselect all items
- **Conditional Display**: Only appears when timetables are selected

### ✅ Confirmation Dialog
- **Safety Confirmation**: Prevents accidental deletions
- **Clear Messaging**: Shows exactly how many timetables will be deleted
- **Destructive Action Styling**: Uses appropriate UI colors for dangerous actions

### ✅ Toast Notifications
- **Success Messages**: Confirms successful bulk deletions
- **Warning Messages**: Shows partial success with error details
- **Error Messages**: Clear error reporting for failed operations

### ✅ Smart State Management
- **Auto-clear Selection**: Clears selection when filters change
- **Consistent State**: Maintains selection state consistency
- **Loading States**: Shows appropriate loading indicators during operations

## User Interface

### Bulk Selection
1. **Master Checkbox**: Located in the table header, allows selecting all timetables with generated schedules
2. **Individual Checkboxes**: Located in the first column of each table row, only visible for classes with timetables
3. **Selection State**: Maintains consistent state between master and individual checkboxes

### Bulk Actions Toolbar
```
[X] 3 timetables selected    [Delete Selected] [Clear Selection]
```
- Appears above the table when one or more timetables are selected
- Shows count of selected items
- Provides primary actions for bulk operations

### Confirmation Dialog
- **Title**: "Delete Selected Timetables"
- **Message**: Clear description of the action and its consequences
- **Actions**: Cancel or confirm deletion with appropriate button styling

## API Endpoint

### POST `/api/timetable/bulk-delete`

**Request Body:**
```json
{
  "classIds": ["class-id-1", "class-id-2", "class-id-3"]
}
```

**Success Response:**
```json
{
  "success": true,
  "deletedCount": 3,
  "errors": [],
  "message": "Successfully deleted 3 timetables"
}
```

**Partial Success Response:**
```json
{
  "success": true,
  "deletedCount": 2,
  "errors": ["Failed to delete timetable for class class-id-3: Database error"],
  "message": "Successfully deleted 2 timetables with 1 errors"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No timetables were deleted",
  "deletedCount": 0,
  "errors": ["Database connection failed"]
}
```

## Security & Validation

### Input Validation
- **Required Fields**: `classIds` array is required and must not be empty
- **Array Validation**: Ensures `classIds` is a valid array
- **Database Validation**: Verifies classes exist before attempting deletion

### Error Handling
- **Database Errors**: Gracefully handles database connection issues
- **Partial Failures**: Continues processing even if some deletions fail
- **Transaction Safety**: Each deletion is handled independently to prevent cascading failures

### Data Integrity
- **Referential Integrity**: Properly removes all related timetable periods
- **Cascade Deletion**: Ensures complete cleanup of timetable data
- **State Consistency**: Updates UI state to reflect database changes

## Usage Instructions

### For Administrators

1. **Navigate to Timetable Management**
   - Access the timetable management interface
   - View the list of classes with their timetable status

2. **Select Timetables for Deletion**
   - Use individual checkboxes to select specific timetables
   - Or use the master checkbox to select all available timetables
   - Only classes with generated timetables can be selected

3. **Initiate Bulk Delete**
   - Click "Delete Selected" in the bulk actions toolbar
   - Review the confirmation dialog carefully
   - Confirm the deletion to proceed

4. **Review Results**
   - Check the toast notification for operation results
   - Verify that selected timetables have been removed
   - The table will automatically update to reflect changes

### Best Practices

1. **Backup Before Bulk Operations**
   - Consider creating backups before large bulk deletions
   - Use export functionality to save timetable data if needed

2. **Selective Deletion**
   - Review selections carefully before confirming
   - Use filters to narrow down the list before selecting

3. **Gradual Processing**
   - For very large datasets, consider processing in smaller batches
   - Monitor system performance during bulk operations

## Technical Implementation

### Frontend Components
- **TimetableManagement**: Enhanced with bulk selection UI
- **Bulk Actions Toolbar**: Conditional component for selected items
- **Confirmation Dialog**: AlertDialog for deletion confirmation
- **Toast Notifications**: User feedback system

### Backend API
- **Bulk Delete Endpoint**: `/api/timetable/bulk-delete`
- **Transaction Handling**: Individual deletion processing
- **Error Aggregation**: Collects and reports all errors

### State Management
- **Selection State**: Uses Set for efficient selection tracking
- **Context Integration**: Integrated with TimetableContext
- **UI Synchronization**: Maintains consistent state across components

## Testing

### Test Page
A dedicated test page is available at `/test-timetable-bulk-delete` to demonstrate and test the bulk delete functionality.

### Test Scenarios
1. **Single Selection**: Select and delete one timetable
2. **Multiple Selection**: Select and delete multiple timetables
3. **Select All**: Use master checkbox to select all timetables
4. **Mixed Results**: Test scenarios with partial success/failure
5. **Error Handling**: Test with invalid data or network issues

## Troubleshooting

### Common Issues

1. **No Checkboxes Visible**
   - Ensure classes have generated timetables
   - Only classes with periods show checkboxes

2. **Bulk Delete Button Not Appearing**
   - Select at least one timetable
   - The toolbar only appears when items are selected

3. **Deletion Failures**
   - Check database connectivity
   - Verify timetable data integrity
   - Review server logs for detailed error information

4. **State Inconsistencies**
   - Refresh the page to reset state
   - Check for JavaScript console errors
   - Verify API responses are properly formatted

### Support
For additional support or bug reports, refer to the system administrator or check the application logs for detailed error information.
