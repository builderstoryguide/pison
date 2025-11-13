# Employee Management Database Schema Documentation

## Overview

This document describes the complete database schema for the Employee Management system. The schema extends the existing `teachers` table and adds new tables for leave management, attendance tracking, performance reviews, payroll processing, and leave balance tracking.

## Schema Migration Script

**File**: `scripts/2025-11-13_030_employee_management_schema.sql`

Run this script to set up the complete employee management database schema.

## Database Tables

### 1. Teachers Table (Extended)

**Table Name**: `public.teachers`

This table stores core employee information. We've extended it with additional HR-specific fields.

#### New/Updated Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `employment_type` | VARCHAR(20) | Type of employment | CHECK: 'full-time', 'part-time', 'contract', **'temporary'** (added) |
| `status` | VARCHAR(20) | Employment status | CHECK: 'active', 'inactive', 'suspended', **'terminated', 'retired'** (added) |
| `end_date` | DATE | Contract end date | Optional, must be >= start_date |
| `contract_renewal_date` | DATE | Contract renewal date | Optional |
| `department` | VARCHAR(100) | Department name | Optional |
| `specialization` | VARCHAR(255) | Area of specialization | Optional |
| `emergency_contact_email` | VARCHAR(255) | Emergency contact email | Optional |
| `emergency_contact_address` | TEXT | Emergency contact address | Optional |
| `postal_code` | VARCHAR(20) | Postal code | Optional |
| `country` | VARCHAR(100) | Country | Default: 'Cameroon' |
| `is_verified` | BOOLEAN | Profile verification status | Default: false |
| `profile_completed` | BOOLEAN | Profile completion status | Default: false |

#### Existing Columns (for reference):

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `teacher_id` | VARCHAR(32) | Unique teacher/employee ID |
| `title` | VARCHAR(50) | Title (Mr., Mrs., Dr., etc.) |
| `first_name` | VARCHAR(100) | First name |
| `last_name` | VARCHAR(100) | Last name |
| `email` | VARCHAR(255) | Email address |
| `phone` | VARCHAR(20) | Phone number |
| `date_of_birth` | DATE | Date of birth |
| `gender` | VARCHAR(10) | Gender |
| `nationality` | VARCHAR(100) | Nationality |
| `id_number` | VARCHAR(100) | National ID number |
| `address` | TEXT | Physical address |
| `city` | VARCHAR(100) | City |
| `region` | VARCHAR(100) | Region |
| `subsystem` | VARCHAR(20) | Subsystem (english/french) |
| `subjects` | TEXT[] | Array of subjects taught |
| `classes` | TEXT[] | Array of classes assigned |
| `qualifications` | TEXT[] | Array of qualifications |
| `experience` | TEXT | Work experience |
| `salary` | NUMERIC(12,2) | Monthly salary |
| `start_date` | DATE | Employment start date |
| `emergency_contact_name` | VARCHAR(255) | Emergency contact name |
| `emergency_contact_relationship` | VARCHAR(50) | Emergency contact relationship |
| `emergency_contact_phone` | VARCHAR(20) | Emergency contact phone |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | Record update timestamp |

---

### 2. Leave Requests Table

**Table Name**: `public.leave_requests`

Stores employee leave requests and approval workflow.

#### Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `employee_id` | UUID | Foreign key to teachers.id | NOT NULL, ON DELETE CASCADE |
| `employee_name` | VARCHAR(255) | Employee full name | NOT NULL |
| `leave_type` | VARCHAR(20) | Type of leave | CHECK: 'annual', 'sick', 'maternity', 'paternity', 'unpaid', 'study', 'compassionate' |
| `start_date` | DATE | Leave start date | NOT NULL |
| `end_date` | DATE | Leave end date | NOT NULL, must be >= start_date |
| `total_days` | INTEGER | Total leave days | NOT NULL, > 0 |
| `reason` | TEXT | Reason for leave | NOT NULL |
| `status` | VARCHAR(20) | Request status | CHECK: 'pending', 'approved', 'rejected', 'cancelled'. Default: 'pending' |
| `approved_by` | UUID | Foreign key to users.id | Optional |
| `approved_at` | TIMESTAMPTZ | Approval timestamp | Optional |
| `rejection_reason` | TEXT | Reason for rejection | Optional |
| `notes` | TEXT | Additional notes | Optional |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Record update timestamp | Auto-updated |

#### Indexes:
- `idx_leave_requests_employee_id` on `employee_id`
- `idx_leave_requests_status` on `status`
- `idx_leave_requests_leave_type` on `leave_type`
- `idx_leave_requests_start_date` on `start_date`
- `idx_leave_requests_end_date` on `end_date`
- `idx_leave_requests_approved_by` on `approved_by`

---

### 3. Attendance Records Table

**Table Name**: `public.attendance_records`

Tracks daily employee attendance, check-in/check-out times.

#### Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `employee_id` | UUID | Foreign key to teachers.id | NOT NULL, ON DELETE CASCADE |
| `employee_name` | VARCHAR(255) | Employee full name | NOT NULL |
| `date` | DATE | Attendance date | NOT NULL |
| `check_in` | TIME | Check-in time | Optional |
| `check_out` | TIME | Check-out time | Optional |
| `status` | VARCHAR(20) | Attendance status | CHECK: 'present', 'absent', 'late', 'on-leave', 'half-day'. Default: 'present' |
| `hours_worked` | NUMERIC(4,2) | Total hours worked | Optional |
| `notes` | TEXT | Additional notes | Optional |
| `marked_by` | UUID | Foreign key to users.id | Optional |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Record update timestamp | Auto-updated |

#### Constraints:
- **UNIQUE**: One record per employee per day `(employee_id, date)`

#### Indexes:
- `idx_attendance_records_employee_id` on `employee_id`
- `idx_attendance_records_date` on `date`
- `idx_attendance_records_status` on `status`
- `idx_attendance_records_check_in` on `check_in`
- `idx_attendance_records_marked_by` on `marked_by`

---

### 4. Performance Reviews Table

**Table Name**: `public.performance_reviews`

Stores employee performance evaluations and reviews.

#### Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `employee_id` | UUID | Foreign key to teachers.id | NOT NULL, ON DELETE CASCADE |
| `employee_name` | VARCHAR(255) | Employee full name | NOT NULL |
| `review_period` | VARCHAR(50) | Review period (e.g., "2024 Q1") | NOT NULL |
| `review_date` | DATE | Date of review | NOT NULL |
| `reviewer_id` | UUID | Foreign key to users.id | NOT NULL |
| `reviewer_name` | VARCHAR(255) | Reviewer full name | NOT NULL |
| `overall_rating` | NUMERIC(2,1) | Overall rating (1-5) | Range: 1.0 to 5.0 |
| `teaching_effectiveness` | NUMERIC(2,1) | Teaching effectiveness (1-5) | Range: 1.0 to 5.0 |
| `classroom_management` | NUMERIC(2,1) | Classroom management (1-5) | Range: 1.0 to 5.0 |
| `student_engagement` | NUMERIC(2,1) | Student engagement (1-5) | Range: 1.0 to 5.0 |
| `professionalism` | NUMERIC(2,1) | Professionalism (1-5) | Range: 1.0 to 5.0 |
| `collaboration` | NUMERIC(2,1) | Collaboration (1-5) | Range: 1.0 to 5.0 |
| `strengths` | TEXT | Employee strengths | Optional |
| `areas_for_improvement` | TEXT | Areas to improve | Optional |
| `goals` | TEXT | Future goals | Optional |
| `comments` | TEXT | Additional comments | Optional |
| `status` | VARCHAR(20) | Review status | CHECK: 'draft', 'completed', 'acknowledged'. Default: 'draft' |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Record update timestamp | Auto-updated |

#### Indexes:
- `idx_performance_reviews_employee_id` on `employee_id`
- `idx_performance_reviews_reviewer_id` on `reviewer_id`
- `idx_performance_reviews_review_date` on `review_date`
- `idx_performance_reviews_status` on `status`

---

### 5. Payroll Records Table

**Table Name**: `public.payroll_records`

Manages monthly payroll processing and salary payments.

#### Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `employee_id` | UUID | Foreign key to teachers.id | NOT NULL, ON DELETE CASCADE |
| `employee_name` | VARCHAR(255) | Employee full name | NOT NULL |
| `month` | VARCHAR(20) | Payroll month | NOT NULL |
| `year` | INTEGER | Payroll year | NOT NULL, Range: 2020-2100 |
| `basic_salary` | NUMERIC(12,2) | Base salary | NOT NULL, >= 0 |
| `allowances` | NUMERIC(12,2) | Total allowances | Default: 0, >= 0 |
| `bonuses` | NUMERIC(12,2) | Total bonuses | Default: 0, >= 0 |
| `deductions` | NUMERIC(12,2) | Total deductions | Default: 0, >= 0 |
| `tax` | NUMERIC(12,2) | Tax amount | Default: 0, >= 0 |
| `net_salary` | NUMERIC(12,2) | Net salary after deductions | NOT NULL, >= 0 |
| `payment_date` | DATE | Actual payment date | Optional |
| `payment_method` | VARCHAR(20) | Payment method | CHECK: 'bank-transfer', 'cash', 'cheque', 'mobile-money'. Default: 'bank-transfer' |
| `payment_reference` | VARCHAR(100) | Payment reference number | Optional |
| `status` | VARCHAR(20) | Payroll status | CHECK: 'pending', 'processed', 'paid', 'cancelled'. Default: 'pending' |
| `notes` | TEXT | Additional notes | Optional |
| `processed_by` | UUID | Foreign key to users.id | Optional |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Record update timestamp | Auto-updated |

#### Constraints:
- **UNIQUE**: One payroll record per employee per month per year `(employee_id, month, year)`

#### Indexes:
- `idx_payroll_records_employee_id` on `employee_id`
- `idx_payroll_records_year` on `year`
- `idx_payroll_records_month` on `month`
- `idx_payroll_records_status` on `status`
- `idx_payroll_records_payment_date` on `payment_date`
- `idx_payroll_records_processed_by` on `processed_by`

---

### 6. Leave Balances Table

**Table Name**: `public.leave_balances`

Tracks annual leave balances by employee and year.

#### Columns:

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | Auto-generated |
| `employee_id` | UUID | Foreign key to teachers.id | NOT NULL, ON DELETE CASCADE |
| `year` | INTEGER | Balance year | NOT NULL, Range: 2020-2100 |
| `annual_leave_total` | INTEGER | Total annual leave days | Default: 30, >= 0 |
| `annual_leave_used` | INTEGER | Used annual leave days | Default: 0, >= 0 |
| `annual_leave_remaining` | INTEGER | Remaining annual leave days | Default: 30, >= 0 |
| `sick_leave_total` | INTEGER | Total sick leave days | Default: 14, >= 0 |
| `sick_leave_used` | INTEGER | Used sick leave days | Default: 0, >= 0 |
| `sick_leave_remaining` | INTEGER | Remaining sick leave days | Default: 14, >= 0 |
| `study_leave_total` | INTEGER | Total study leave days | Default: 0, >= 0 |
| `study_leave_used` | INTEGER | Used study leave days | Default: 0, >= 0 |
| `study_leave_remaining` | INTEGER | Remaining study leave days | Default: 0, >= 0 |
| `compassionate_leave_total` | INTEGER | Total compassionate leave days | Default: 5, >= 0 |
| `compassionate_leave_used` | INTEGER | Used compassionate leave days | Default: 0, >= 0 |
| `compassionate_leave_remaining` | INTEGER | Remaining compassionate leave days | Default: 5, >= 0 |
| `carried_forward_days` | INTEGER | Days carried forward from previous year | Default: 0, >= 0 |
| `created_at` | TIMESTAMPTZ | Record creation timestamp | Auto-generated |
| `updated_at` | TIMESTAMPTZ | Record update timestamp | Auto-updated |

#### Constraints:
- **UNIQUE**: One balance record per employee per year `(employee_id, year)`

#### Indexes:
- `idx_leave_balances_employee_id` on `employee_id`
- `idx_leave_balances_year` on `year`

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│     teachers        │
│  (Employees Base)   │
└──────────┬──────────┘
           │
           │ 1:N
           │
    ┌──────┴───────────────┬────────────────┬──────────────────┬─────────────────┐
    │                      │                │                  │                 │
    ▼                      ▼                ▼                  ▼                 ▼
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐  ┌────────────────┐
│ leave_       │  │ attendance_      │  │ performance_     │  │ payroll_   │  │ leave_         │
│ requests     │  │ records          │  │ reviews          │  │ records    │  │ balances       │
└──────────────┘  └──────────────────┘  └──────────────────┘  └────────────┘  └────────────────┘
```

## Database Features

### 1. Automatic Timestamps

All tables have `created_at` and `updated_at` columns that are automatically managed:
- `created_at`: Set to current timestamp on record creation
- `updated_at`: Automatically updated on record modification via triggers

### 2. Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow authenticated users to read all records
- Allow authenticated users to insert new records
- Allow authenticated users to update existing records
- Future enhancement: Role-based access control

### 3. Data Integrity

**Cascading Deletes:**
- When an employee (teacher) is deleted, all related records are automatically deleted:
  - Leave requests
  - Attendance records
  - Performance reviews
  - Payroll records
  - Leave balances

**Check Constraints:**
- Date validations (end_date >= start_date)
- Numeric ranges (ratings 1-5, positive amounts)
- Status enumerations
- Unique constraints for data consistency

### 4. Indexing Strategy

Indexes are created on:
- Foreign key columns for join performance
- Status columns for filtering
- Date columns for range queries
- Frequently searched columns

## Installation Instructions

### Step 1: Backup Current Database
```sql
-- Create a backup before running migrations
pg_dump your_database > backup_$(date +%Y%m%d).sql
```

### Step 2: Run Migration Script
```bash
psql -U your_username -d your_database -f scripts/2025-11-13_030_employee_management_schema.sql
```

### Step 3: Verify Installation

The script includes automatic verification that will display:
```
========================================
EMPLOYEE MANAGEMENT SCHEMA VERIFICATION
========================================
✓ Teachers table extended successfully
✓ leave_requests table created successfully
✓ attendance_records table created successfully
✓ performance_reviews table created successfully
✓ payroll_records table created successfully
✓ leave_balances table created successfully
========================================
Schema setup complete!
========================================
```

### Step 4: Check Tables

```sql
-- List all employee management tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'teachers', 
    'leave_requests', 
    'attendance_records', 
    'performance_reviews', 
    'payroll_records', 
    'leave_balances'
);
```

## Sample Queries

### Get Employee with Leave Balance
```sql
SELECT 
    t.teacher_id as employee_id,
    t.first_name,
    t.last_name,
    t.email,
    t.employment_type,
    t.salary,
    lb.annual_leave_remaining,
    lb.sick_leave_remaining
FROM teachers t
LEFT JOIN leave_balances lb ON t.id = lb.employee_id AND lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
WHERE t.status = 'active';
```

### Get Pending Leave Requests
```sql
SELECT 
    lr.id,
    lr.employee_name,
    lr.leave_type,
    lr.start_date,
    lr.end_date,
    lr.total_days,
    lr.reason,
    lr.created_at
FROM leave_requests lr
WHERE lr.status = 'pending'
ORDER BY lr.created_at DESC;
```

### Get Monthly Attendance Summary
```sql
SELECT 
    employee_name,
    COUNT(*) as total_days,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_days,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent_days,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_days
FROM attendance_records
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY employee_id, employee_name;
```

### Get Payroll Summary for Month
```sql
SELECT 
    employee_name,
    basic_salary,
    allowances,
    deductions,
    net_salary,
    status
FROM payroll_records
WHERE month = 'November' AND year = 2024
ORDER BY employee_name;
```

## Migration Considerations

### Backwards Compatibility

- The migration is **non-destructive**
- Existing `teachers` table data is preserved
- New columns have sensible defaults
- All changes are additive (no data loss)

### Rollback Strategy

If you need to rollback:

```sql
-- Remove new tables
DROP TABLE IF EXISTS public.leave_balances CASCADE;
DROP TABLE IF EXISTS public.payroll_records CASCADE;
DROP TABLE IF EXISTS public.performance_reviews CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.leave_requests CASCADE;

-- Remove new columns from teachers (optional)
ALTER TABLE public.teachers DROP COLUMN IF EXISTS end_date;
ALTER TABLE public.teachers DROP COLUMN IF EXISTS contract_renewal_date;
-- ... (continue for other new columns)
```

## Security Considerations

1. **RLS Enabled**: Row Level Security is enabled on all tables
2. **Foreign Key Constraints**: Maintain referential integrity
3. **Check Constraints**: Prevent invalid data entry
4. **Audit Trail**: All tables have timestamps for tracking
5. **Future Enhancement**: Role-based policies (admin vs employee access)

## Performance Optimization

1. **Indexes**: Created on frequently queried columns
2. **Partitioning**: Consider partitioning by date for large datasets
3. **Archiving**: Old records can be archived after a retention period
4. **Query Optimization**: Use provided sample queries as templates

## Next Steps

After running the migration:

1. ✅ Initialize leave balances for existing employees
2. ✅ Set up payroll records for the current period
3. ✅ Configure leave policies (days per year, etc.)
4. ✅ Train administrators on new features
5. ✅ Update application code to use new tables

## Support

For issues or questions:
- Check table structure: `\d+ table_name` in psql
- Review logs for errors
- Verify RLS policies are correct
- Check foreign key relationships

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Migration Script**: `scripts/2025-11-13_030_employee_management_schema.sql`

