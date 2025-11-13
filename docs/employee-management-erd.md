# Employee Management Entity Relationship Diagram (ERD)

## Visual Database Schema

```
┌─────────────────────────────────────────────────────────────────────┐
│                          TEACHERS (EMPLOYEES)                        │
│─────────────────────────────────────────────────────────────────────│
│ PK │ id                        UUID                                  │
│ UK │ teacher_id                VARCHAR(32)                           │
│    │ title                     VARCHAR(50)                           │
│    │ first_name                VARCHAR(100)                          │
│    │ last_name                 VARCHAR(100)                          │
│    │ email                     VARCHAR(255)                          │
│    │ phone                     VARCHAR(20)                           │
│    │ date_of_birth             DATE                                  │
│    │ gender                    VARCHAR(10)                           │
│    │ nationality               VARCHAR(100)                          │
│    │ id_number                 VARCHAR(100)                          │
│    │ address                   TEXT                                  │
│    │ city                      VARCHAR(100)                          │
│    │ region                    VARCHAR(100)                          │
│    │ postal_code               VARCHAR(20)         [NEW]             │
│    │ country                   VARCHAR(100)        [NEW]             │
│    │ subsystem                 VARCHAR(20)                           │
│    │ subjects                  TEXT[]                                │
│    │ classes                   TEXT[]                                │
│    │ qualifications            TEXT[]                                │
│    │ experience                TEXT                                  │
│    │ department                VARCHAR(100)        [NEW]             │
│    │ specialization            VARCHAR(255)        [NEW]             │
│    │ employment_type           VARCHAR(20)                           │
│    │ salary                    NUMERIC(12,2)                         │
│    │ start_date                DATE                                  │
│    │ end_date                  DATE                [NEW]             │
│    │ contract_renewal_date     DATE                [NEW]             │
│    │ emergency_contact_name    VARCHAR(255)                          │
│    │ emergency_contact_relationship VARCHAR(50)                      │
│    │ emergency_contact_phone   VARCHAR(20)                           │
│    │ emergency_contact_email   VARCHAR(255)        [NEW]             │
│    │ emergency_contact_address TEXT                [NEW]             │
│    │ status                    VARCHAR(20)                           │
│    │ is_verified               BOOLEAN             [NEW]             │
│    │ profile_completed         BOOLEAN             [NEW]             │
│    │ created_at                TIMESTAMPTZ                           │
│    │ updated_at                TIMESTAMPTZ                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┬────────────────┬─────────────────┐
                    │               │               │                │                 │
                    ▼               ▼               ▼                ▼                 ▼
    ┌───────────────────────┐ ┌─────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────┐
    │   LEAVE_REQUESTS      │ │ ATTENDANCE_RECORDS  │ │ PERFORMANCE_REVIEWS  │ │ PAYROLL_RECORDS  │ │ LEAVE_BALANCES  │
    │───────────────────────│ │─────────────────────│ │──────────────────────│ │──────────────────│ │─────────────────│
    │ PK │ id          UUID │ │ PK │ id       UUID  │ │ PK │ id        UUID  │ │ PK │ id    UUID  │ │ PK │ id   UUID  │
    │ FK │ employee_id UUID │ │ FK │ employee_id    │ │ FK │ employee_id     │ │ FK │ employee_id │ │ FK │ employee_id│
    │    │ employee_name    │ │    │ employee_name  │ │    │ employee_name   │ │    │ employee_name│ │    │ year       │
    │    │ leave_type       │ │    │ date           │ │    │ review_period   │ │    │ month        │ │    │            │
    │    │ start_date       │ │    │ check_in       │ │    │ review_date     │ │    │ year         │ │    │ annual_*   │
    │    │ end_date         │ │    │ check_out      │ │ FK │ reviewer_id     │ │    │ basic_salary │ │    │ sick_*     │
    │    │ total_days       │ │    │ status         │ │    │ reviewer_name   │ │    │ allowances   │ │    │ study_*    │
    │    │ reason           │ │    │ hours_worked   │ │    │ overall_rating  │ │    │ bonuses      │ │    │ compassionate_*│
    │    │ status           │ │    │ notes          │ │    │ teaching_*      │ │    │ deductions   │ │    │ carried_*  │
    │ FK │ approved_by      │ │ FK │ marked_by      │ │    │ classroom_*     │ │    │ tax          │ │    │            │
    │    │ approved_at      │ │    │ created_at     │ │    │ student_*       │ │    │ net_salary   │ │    │ created_at │
    │    │ rejection_reason │ │    │ updated_at     │ │    │ professionalism │ │    │ payment_date │ │    │ updated_at │
    │    │ notes            │ │                     │ │    │ collaboration   │ │    │ payment_method│ │               │
    │    │ created_at       │ │ UNIQUE:             │ │    │ strengths       │ │    │ payment_ref  │ │ UNIQUE:        │
    │    │ updated_at       │ │ (employee_id, date) │ │    │ areas_improve   │ │    │ status       │ │ (employee_id,  │
    │                       │ │                     │ │    │ goals           │ │    │ notes        │ │  year)         │
    │                       │ │                     │ │    │ comments        │ │ FK │ processed_by │ │                │
    │                       │ │                     │ │    │ status          │ │    │ created_at   │ │                │
    │                       │ │                     │ │    │ created_at      │ │    │ updated_at   │ │                │
    │                       │ │                     │ │    │ updated_at      │ │                  │ │                │
    │                       │ │                     │ │                      │ │ UNIQUE:          │ │                │
    │                       │ │                     │ │                      │ │ (employee_id,    │ │                │
    │                       │ │                     │ │                      │ │  month, year)    │ │                │
    └───────────────────────┘ └─────────────────────┘ └──────────────────────┘ └──────────────────┘ └─────────────────┘
              │                         │                         │                      │
              │                         │                         │                      │
              ▼                         ▼                         ▼                      ▼
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                              USERS                                        │
    │──────────────────────────────────────────────────────────────────────────│
    │ PK │ id                        UUID                                      │
    │    │ name                      VARCHAR(255)                              │
    │    │ email                     VARCHAR(255)                              │
    │    │ role                      VARCHAR(20)                               │
    │    │ ... (other user fields)                                             │
    └──────────────────────────────────────────────────────────────────────────┘
```

## Relationships Explained

### 1. Teachers ↔ Leave Requests (1:N)
- One employee can have multiple leave requests
- Each leave request belongs to one employee
- **Cascade**: Deleting an employee deletes all their leave requests
- **Reference**: `approved_by` links to `users` table (approver)

### 2. Teachers ↔ Attendance Records (1:N)
- One employee has multiple daily attendance records
- Each attendance record belongs to one employee
- **Cascade**: Deleting an employee deletes all their attendance records
- **Unique**: One record per employee per day
- **Reference**: `marked_by` links to `users` table (who marked attendance)

### 3. Teachers ↔ Performance Reviews (1:N)
- One employee can have multiple performance reviews
- Each review belongs to one employee
- **Cascade**: Deleting an employee deletes all their reviews
- **Reference**: `reviewer_id` links to `users` table (reviewer)

### 4. Teachers ↔ Payroll Records (1:N)
- One employee has multiple payroll records (one per month)
- Each payroll record belongs to one employee
- **Cascade**: Deleting an employee deletes all their payroll records
- **Unique**: One record per employee per month per year
- **Reference**: `processed_by` links to `users` table (processor)

### 5. Teachers ↔ Leave Balances (1:N)
- One employee has one balance record per year
- Each balance record belongs to one employee
- **Cascade**: Deleting an employee deletes all their balance records
- **Unique**: One record per employee per year

## Cardinality Summary

```
teachers (1) ────< (N) leave_requests
teachers (1) ────< (N) attendance_records
teachers (1) ────< (N) performance_reviews
teachers (1) ────< (N) payroll_records
teachers (1) ────< (N) leave_balances

users (1) ────< (N) leave_requests.approved_by
users (1) ────< (N) attendance_records.marked_by
users (1) ────< (N) performance_reviews.reviewer_id
users (1) ────< (N) payroll_records.processed_by
```

## Indexes Overview

### Leave Requests
```sql
- idx_leave_requests_employee_id (employee_id)
- idx_leave_requests_status (status)
- idx_leave_requests_leave_type (leave_type)
- idx_leave_requests_start_date (start_date)
- idx_leave_requests_end_date (end_date)
- idx_leave_requests_approved_by (approved_by)
```

### Attendance Records
```sql
- idx_attendance_records_employee_id (employee_id)
- idx_attendance_records_date (date)
- idx_attendance_records_status (status)
- idx_attendance_records_check_in (check_in)
- idx_attendance_records_marked_by (marked_by)
```

### Performance Reviews
```sql
- idx_performance_reviews_employee_id (employee_id)
- idx_performance_reviews_reviewer_id (reviewer_id)
- idx_performance_reviews_review_date (review_date)
- idx_performance_reviews_status (status)
```

### Payroll Records
```sql
- idx_payroll_records_employee_id (employee_id)
- idx_payroll_records_year (year)
- idx_payroll_records_month (month)
- idx_payroll_records_status (status)
- idx_payroll_records_payment_date (payment_date)
- idx_payroll_records_processed_by (processed_by)
```

### Leave Balances
```sql
- idx_leave_balances_employee_id (employee_id)
- idx_leave_balances_year (year)
```

## Constraints Summary

### Check Constraints

**Teachers:**
- `employment_type` IN ('full-time', 'part-time', 'contract', 'temporary')
- `status` IN ('active', 'inactive', 'suspended', 'terminated', 'retired')
- `start_date <= end_date OR end_date IS NULL`

**Leave Requests:**
- `leave_type` IN ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'study', 'compassionate')
- `status` IN ('pending', 'approved', 'rejected', 'cancelled')
- `total_days > 0`
- `end_date >= start_date`

**Attendance Records:**
- `status` IN ('present', 'absent', 'late', 'on-leave', 'half-day')

**Performance Reviews:**
- All ratings >= 1 AND <= 5
- `status` IN ('draft', 'completed', 'acknowledged')

**Payroll Records:**
- `year >= 2020 AND year <= 2100`
- `payment_method` IN ('bank-transfer', 'cash', 'cheque', 'mobile-money')
- `status` IN ('pending', 'processed', 'paid', 'cancelled')
- All monetary amounts >= 0

**Leave Balances:**
- `year >= 2020 AND year <= 2100`
- All day counts >= 0

### Unique Constraints

- `teachers.teacher_id` - UNIQUE
- `attendance_records (employee_id, date)` - UNIQUE
- `payroll_records (employee_id, month, year)` - UNIQUE
- `leave_balances (employee_id, year)` - UNIQUE

## Triggers

All tables have `updated_at` triggers:

```sql
CREATE TRIGGER update_[table_name]_updated_at
    BEFORE UPDATE ON public.[table_name]
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

Applied to:
- `leave_requests`
- `attendance_records`
- `performance_reviews`
- `payroll_records`
- `leave_balances`

## Row Level Security (RLS)

All tables have RLS enabled with policies:

```sql
-- Read policy
CREATE POLICY "Allow authenticated users to read [table_name]"
    ON public.[table_name] FOR SELECT
    TO authenticated
    USING (true);

-- Insert policy
CREATE POLICY "Allow authenticated users to insert [table_name]"
    ON public.[table_name] FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Update policy
CREATE POLICY "Allow authenticated users to update [table_name]"
    ON public.[table_name] FOR UPDATE
    TO authenticated
    USING (true);
```

## Sample Data Flow

### Leave Request Workflow

```
1. Employee creates leave_request (status: 'pending')
   ↓
2. Admin reviews and approves (status: 'approved', approved_by set)
   ↓
3. Leave balance updated (leave_balances.[type]_used incremented)
   ↓
4. Attendance records auto-marked (status: 'on-leave') for date range
```

### Attendance Workflow

```
1. Daily attendance marked (check_in time recorded)
   ↓
2. Employee checks out (check_out time recorded)
   ↓
3. Hours calculated automatically
   ↓
4. Status updated based on time (present/late)
```

### Payroll Workflow

```
1. Monthly payroll_record created (status: 'pending')
   ↓
2. Calculations done (allowances, deductions, tax, net_salary)
   ↓
3. Record processed (status: 'processed', processed_by set)
   ↓
4. Payment made (status: 'paid', payment_date set)
```

## Legend

- `PK` - Primary Key
- `FK` - Foreign Key
- `UK` - Unique Key
- `[NEW]` - New column added by migration
- `*` - Wildcard (multiple related columns)
- `(1)` - One (in cardinality)
- `(N)` - Many (in cardinality)

---

**This ERD represents the complete Employee Management database schema**  
**Version**: 1.0.0  
**Last Updated**: November 2024

