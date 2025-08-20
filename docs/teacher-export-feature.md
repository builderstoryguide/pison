# Teacher Data Export Feature

## Overview

The Teacher Data Export feature allows administrators to export teacher information from the school management system with customizable options for selecting which data to export and which teachers to include.

## Features

### 1. Export Types
- **Single Teacher Export**: Export data for one specific teacher
- **Multiple Teachers Export**: Export data for multiple selected teachers
- **Filtered Export**: Export data for all teachers matching current filters

### 2. Data Field Selection
The export includes comprehensive teacher data organized into categories:

#### Basic Info
- Teacher ID
- Title
- First Name
- Last Name

#### Contact Information
- Email
- Phone
- Address
- City
- Region

#### Personal Information
- Date of Birth
- Gender
- Nationality
- ID Number

#### Professional Information
- Subsystem (English/French)
- Subjects
- Classes
- Qualifications
- Experience
- Employment Type
- Salary
- Start Date
- Status

#### Emergency Contact
- Emergency Contact Name
- Relationship
- Phone Number

#### System Information
- Created Date
- Updated Date

### 3. Export Formats
- **CSV (Comma Separated Values)**: Standard spreadsheet format
- **JSON (JavaScript Object Notation)**: Structured data format

## How to Use

### Method 1: Export All Teachers
1. Navigate to Teacher Management
2. Click the "Export Data" button in the header
3. Choose export type (Single/Multiple)
4. Select teachers (if multiple)
5. Choose data fields to include
6. Select export format (CSV/JSON)
7. Click "Export Data"

### Method 2: Export Filtered Results
1. Apply filters (search, subsystem, status)
2. Click "Export Filtered (X)" button
3. Choose data fields to include
4. Select export format
5. Click "Export Data"

### Method 3: Export Individual Teacher
1. Find the teacher in the table
2. Click the actions menu (⋮)
3. Select "Export Data"
4. Choose data fields to include
5. Select export format
6. Click "Export Data"

## File Naming Convention

Exported files are automatically named with the following pattern:
- `teachers_export_YYYY-MM-DD.csv` for CSV files
- `teachers_export_YYYY-MM-DD.json` for JSON files

Where `YYYY-MM-DD` is the current date.

## Data Formatting

### CSV Format
- Headers are human-readable field names
- Arrays (subjects, classes, qualifications) are joined with commas
- Objects (emergency contact) are formatted as "Name (Relationship) - Phone"
- Special characters are properly escaped

### JSON Format
- Structured data with proper nesting
- Arrays and objects are preserved in their original format
- Includes all selected fields with their original data types

## User Interface Features

### Selection Controls
- **Select All/Deselect All**: Quick selection for fields and teachers
- **Category Grouping**: Fields are organized by category for easy selection
- **Real-time Counters**: Shows how many teachers and fields are selected

### Validation
- Prevents export with no teachers selected
- Prevents export with no fields selected
- Shows appropriate error messages

### Feedback
- Toast notifications for successful exports
- Error messages for failed operations
- Progress indicators during export process

## Technical Implementation

### Components
- `TeacherExportForm`: Main export interface
- Integrated into `TeacherManagement` component
- Uses existing teacher data from `TeacherManagementContext`

### State Management
- Manages export type selection
- Tracks selected teachers and fields
- Handles export format preferences

### File Generation
- Client-side file generation using Blob API
- Automatic download trigger
- Proper MIME types for different formats

## Security Considerations

- Export only includes data the user has access to
- No sensitive data is transmitted to external servers
- Files are generated locally in the browser
- Export permissions are tied to user role

## Future Enhancements

Potential improvements for future versions:
- Export scheduling
- Email delivery of exports
- Custom field mapping
- Export templates
- Integration with external systems
- Advanced filtering options
- Export history tracking
