# Employee Management Feature Documentation

## Overview

The **Employee Management** system is a comprehensive HR-focused module designed to manage teachers as employees. This feature provides a complete solution for tracking employment details, attendance, leave requests, performance reviews, and payroll information.

## Features

### 1. Employee Overview Dashboard

The main dashboard provides a comprehensive view of all employees with key statistics:

- **Total Employees**: Complete count of all employees
- **Active Employees**: Currently employed staff
- **Employment Type Distribution**: Breakdown by full-time, part-time, contract, and temporary
- **Average Salary**: Calculated average monthly salary
- **Employee Status Overview**: Active, inactive, suspended employees

### 2. Employee Directory

A complete searchable directory with advanced filtering:

- **Search**: Search by name, email, or employee ID
- **Filter by Employment Type**: Full-time, part-time, contract, temporary
- **Filter by Status**: Active, inactive, suspended, terminated, retired
- **Filter by Department**: Department-based filtering

#### Employee Information Display:
- Employee name and photo
- Employee ID
- Employment type
- Department
- Monthly salary
- Contact information (email, phone)
- Status badge

### 3. Employee Details View

Comprehensive employee profile including:

#### Personal Information:
- Full name with title
- Date of birth
- Gender
- Nationality
- National ID number

#### Contact Information:
- Email address
- Phone number
- Physical address
- City and region

#### Employment Details:
- Employee ID
- Employment type
- Department
- Specialization
- Start date
- End date (if applicable)
- Contract renewal date (for contract employees)
- Monthly salary

#### Professional Information:
- Subsystem (English/French)
- Subjects taught
- Classes assigned
- Qualifications
- Experience

#### Emergency Contact:
- Emergency contact name
- Relationship
- Phone number
- Email
- Address

### 4. Leave Management (Coming Soon)

Comprehensive leave tracking system:

- **Leave Types**:
  - Annual leave
  - Sick leave
  - Maternity leave
  - Paternity leave
  - Unpaid leave
  - Study leave
  - Compassionate leave

- **Leave Request Workflow**:
  - Submit leave requests
  - Approve/reject requests
  - Track leave balances
  - View leave history

- **Leave Statistics**:
  - Pending requests count
  - Approved leaves this month
  - Employees on leave today
  - Total leave days taken

### 5. Attendance Tracking (Coming Soon)

Daily attendance monitoring system:

- **Attendance Recording**:
  - Check-in/check-out times
  - Present, absent, late, on-leave, half-day status
  - Attendance notes

- **Attendance Statistics**:
  - Present today count
  - Absent today count
  - Late arrivals count
  - On leave count

- **Attendance Reports**:
  - Daily attendance records
  - Monthly attendance rate
  - Attendance trends
  - Historical data export

### 6. Payroll Management (Coming Soon)

Comprehensive payroll processing:

- Monthly salary processing
- Allowances tracking
- Deductions management
- Net salary calculation
- Payment method tracking
- Payslip generation
- Payroll history

### 7. Performance Reviews (Coming Soon)

Employee performance evaluation system:

- Performance rating criteria
- Review period tracking
- Reviewer assignment
- Performance metrics
- Strengths and areas for improvement
- Goal setting
- Review history

## Technical Implementation

### Context Provider

**File**: `lib/employee-management-context.tsx`

The context provides comprehensive state management for:
- Employee data
- Leave requests
- Attendance records
- Performance reviews
- Payroll records

**Key Functions**:
- `loadEmployees()` - Load all employees
- `getEmployeeById()` - Get single employee details
- `updateEmployee()` - Update employee information
- `updateEmployeeStatus()` - Update employee status
- Leave management functions (coming soon)
- Attendance tracking functions (coming soon)
- Payroll management functions (coming soon)

### Components

1. **EmployeeManagement** (`components/admin/employee-management.tsx`)
   - Main dashboard with tabs
   - Employee directory with filters
   - Statistics overview
   - Quick actions

2. **EmployeeDetailsDialog** (`components/admin/employee-details-dialog.tsx`)
   - Comprehensive employee profile view
   - All employee information in organized sections
   - Action buttons for editing

3. **EmployeeLeaveManagement** (`components/admin/employee-leave-management.tsx`)
   - Leave request management interface
   - Leave statistics dashboard
   - Leave balance tracking

4. **EmployeeAttendanceTracking** (`components/admin/employee-attendance-tracking.tsx`)
   - Daily attendance recording
   - Attendance statistics
   - Attendance reports

### Data Model

The Employee interface extends the Teacher model with HR-specific fields:

```typescript
interface Employee {
  id: string
  employeeId: string
  title: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  nationality: string
  idNumber: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  subjects: string[]
  classes: string[]
  qualifications: string[]
  experience: string
  employmentType: "full-time" | "part-time" | "contract" | "temporary"
  salary: number
  startDate: string
  endDate?: string
  contractRenewalDate?: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
    email?: string
    address?: string
  }
  status: "active" | "inactive" | "suspended" | "terminated" | "retired"
  department?: string
  specialization?: string
  createdAt: string
  updatedAt: string
}
```

## Navigation

The Employee Management feature is accessible from the admin dashboard:

**Admin Menu** → **Manage Employees**

The menu item is displayed with a briefcase icon and is positioned after "Teacher Management" in the admin navigation.

## Database Integration

The feature integrates with the existing `teachers` table in the database:

- Reads employee data from the `teachers` table
- Transforms teacher records to employee records
- Maintains compatibility with existing teacher management features

## Future Enhancements

### Phase 1 (Coming Soon):
- Leave request submission and approval
- Daily attendance recording
- Basic payroll processing

### Phase 2 (Future):
- Performance review system
- Document management (contracts, certificates)
- Employee training and development tracking
- Advanced payroll features (tax calculation, benefits)

### Phase 3 (Future):
- Employee self-service portal
- Mobile attendance tracking
- Automated leave approval workflows
- Comprehensive HR analytics and reports

## User Roles and Permissions

### Admin:
- Full access to all employee management features
- Can view, edit, and update all employee information
- Can approve/reject leave requests
- Can process payroll
- Can conduct performance reviews

### HR Manager (Future):
- Access to employee management features
- Cannot edit salary information (requires admin approval)
- Can approve leave requests
- Can view attendance records

### Employee (Future):
- View own employee profile
- Submit leave requests
- View own attendance records
- View own payslips
- View own performance reviews

## Usage Examples

### Viewing Employee Details

1. Navigate to **Admin Dashboard** → **Manage Employees**
2. Click on the **Employees** tab
3. Search or filter employees as needed
4. Click the menu icon (three dots) next to an employee
5. Select **View Details**
6. View comprehensive employee information

### Filtering Employees

1. Navigate to the **Employees** tab
2. Use the search bar to search by name, email, or ID
3. Use the **Employment Type** dropdown to filter by type
4. Use the **Status** dropdown to filter by status
5. Results update automatically

### Accessing Leave Management

1. Navigate to **Admin Dashboard** → **Manage Employees**
2. Click on the **Leave Management** tab
3. View pending leave requests
4. Filter by leave type or status
5. Approve or reject requests (coming soon)

### Checking Attendance

1. Navigate to **Admin Dashboard** → **Manage Employees**
2. Click on the **Attendance** tab
3. View today's attendance statistics
4. Filter by date range or status
5. Export attendance reports (coming soon)

## Benefits

### For Administrators:
- Centralized employee information management
- Real-time HR statistics and insights
- Streamlined leave and attendance tracking
- Simplified payroll processing

### For HR Department:
- Efficient employee record keeping
- Automated leave approval workflows
- Comprehensive attendance tracking
- Performance review management

### For Employees:
- Easy access to personal information
- Self-service leave requests
- Transparent attendance records
- Access to payroll information

## Best Practices

1. **Regular Updates**: Keep employee information up to date
2. **Attendance Recording**: Record attendance daily for accurate tracking
3. **Leave Management**: Process leave requests promptly
4. **Performance Reviews**: Conduct regular performance reviews
5. **Data Security**: Protect sensitive employee information
6. **Backup**: Regularly backup employee data

## Support and Maintenance

For issues or questions regarding the Employee Management feature:

1. Check this documentation
2. Review the technical implementation
3. Contact the development team for support

## Version History

- **v1.0.0** (2024): Initial release with employee directory and details view
- **v1.1.0** (Coming Soon): Leave management and attendance tracking
- **v1.2.0** (Future): Payroll management and performance reviews

