-- ============================================
-- EMPLOYEE MANAGEMENT SAMPLE DATA
-- ============================================
-- This script inserts sample data for testing the Employee Management system
-- Run this AFTER running the main schema migration script
-- WARNING: This is for development/testing only
-- ============================================

-- ============================================
-- PART 1: UPDATE EXISTING TEACHERS WITH HR DATA
-- ============================================

-- Update some existing teachers with additional HR fields
UPDATE public.teachers
SET 
    department = 'Mathematics',
    specialization = 'Algebra and Calculus',
    is_verified = true,
    profile_completed = true
WHERE id IN (
    SELECT id FROM public.teachers
    WHERE subsystem = 'english' 
    AND subjects && ARRAY['Mathematics']
    LIMIT 5
);

UPDATE public.teachers
SET 
    department = 'Sciences',
    specialization = 'Physics and Chemistry',
    is_verified = true,
    profile_completed = true
WHERE id IN (
    SELECT id FROM public.teachers
    WHERE subsystem = 'english' 
    AND subjects && ARRAY['Physics', 'Chemistry']
    LIMIT 5
);

UPDATE public.teachers
SET 
    department = 'Languages',
    specialization = 'English Literature',
    is_verified = true,
    profile_completed = true
WHERE id IN (
    SELECT id FROM public.teachers
    WHERE subsystem = 'english' 
    AND subjects && ARRAY['English']
    LIMIT 5
);

UPDATE public.teachers
SET 
    department = 'Sciences Humaines',
    specialization = 'Histoire et Géographie',
    is_verified = true,
    profile_completed = true
WHERE id IN (
    SELECT id FROM public.teachers
    WHERE subsystem = 'french' 
    AND subjects && ARRAY['Histoire', 'Géographie']
    LIMIT 5
);

-- ============================================
-- PART 2: CREATE LEAVE BALANCES FOR ALL ACTIVE EMPLOYEES
-- ============================================

-- Create leave balances for current year for all active teachers
INSERT INTO public.leave_balances (
    employee_id,
    year,
    annual_leave_total,
    annual_leave_used,
    annual_leave_remaining,
    sick_leave_total,
    sick_leave_used,
    sick_leave_remaining,
    study_leave_total,
    study_leave_used,
    study_leave_remaining,
    compassionate_leave_total,
    compassionate_leave_used,
    compassionate_leave_remaining,
    carried_forward_days
)
SELECT 
    id,
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    30, -- annual_leave_total
    0,  -- annual_leave_used
    30, -- annual_leave_remaining
    14, -- sick_leave_total
    0,  -- sick_leave_used
    14, -- sick_leave_remaining
    0,  -- study_leave_total
    0,  -- study_leave_used
    0,  -- study_leave_remaining
    5,  -- compassionate_leave_total
    0,  -- compassionate_leave_used
    5,  -- compassionate_leave_remaining
    0   -- carried_forward_days
FROM public.teachers
WHERE status = 'active'
ON CONFLICT (employee_id, year) DO NOTHING;

-- ============================================
-- PART 3: SAMPLE LEAVE REQUESTS
-- ============================================

-- Create some sample leave requests
INSERT INTO public.leave_requests (
    employee_id,
    employee_name,
    leave_type,
    start_date,
    end_date,
    total_days,
    reason,
    status
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    'annual',
    CURRENT_DATE + INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '11 days',
    5,
    'Family vacation',
    'pending'
FROM public.teachers t
WHERE t.status = 'active'
LIMIT 3;

INSERT INTO public.leave_requests (
    employee_id,
    employee_name,
    leave_type,
    start_date,
    end_date,
    total_days,
    reason,
    status,
    approved_by,
    approved_at
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    'sick',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE - INTERVAL '3 days',
    3,
    'Medical appointment',
    'approved',
    (SELECT id FROM public.users WHERE role = 'admin' LIMIT 1),
    CURRENT_DATE - INTERVAL '5 days'
FROM public.teachers t
WHERE t.status = 'active'
LIMIT 2;

-- ============================================
-- PART 4: SAMPLE ATTENDANCE RECORDS
-- ============================================

-- Create attendance records for the past week for active employees
INSERT INTO public.attendance_records (
    employee_id,
    employee_name,
    date,
    check_in,
    check_out,
    status,
    hours_worked
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    d.date,
    '07:30:00'::TIME,
    '16:00:00'::TIME,
    'present',
    8.5
FROM public.teachers t
CROSS JOIN (
    SELECT CURRENT_DATE - INTERVAL '1 day' * s AS date
    FROM generate_series(1, 5) s
) d
WHERE t.status = 'active'
AND EXTRACT(DOW FROM d.date) NOT IN (0, 6) -- Exclude weekends
LIMIT 50
ON CONFLICT (employee_id, date) DO NOTHING;

-- Add some late attendance records
INSERT INTO public.attendance_records (
    employee_id,
    employee_name,
    date,
    check_in,
    check_out,
    status,
    hours_worked,
    notes
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    CURRENT_DATE - INTERVAL '2 days',
    '08:15:00'::TIME,
    '16:00:00'::TIME,
    'late',
    7.75,
    'Traffic delay'
FROM public.teachers t
WHERE t.status = 'active'
LIMIT 2
ON CONFLICT (employee_id, date) DO NOTHING;

-- ============================================
-- PART 5: SAMPLE PERFORMANCE REVIEWS
-- ============================================

-- Create sample performance reviews
INSERT INTO public.performance_reviews (
    employee_id,
    employee_name,
    review_period,
    review_date,
    reviewer_id,
    reviewer_name,
    overall_rating,
    teaching_effectiveness,
    classroom_management,
    student_engagement,
    professionalism,
    collaboration,
    strengths,
    areas_for_improvement,
    goals,
    comments,
    status
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    '2024 Q3',
    CURRENT_DATE - INTERVAL '30 days',
    u.id,
    u.name,
    4.2,
    4.5,
    4.0,
    4.3,
    4.5,
    4.0,
    'Excellent teaching skills, good rapport with students, strong subject knowledge',
    'Could improve on punctuality and administrative tasks completion',
    'Attend professional development workshop, mentor junior teachers',
    'Overall strong performance. Recommended for continued employment.',
    'completed'
FROM public.teachers t
CROSS JOIN (SELECT id, name FROM public.users WHERE role = 'admin' LIMIT 1) u
WHERE t.status = 'active'
LIMIT 5;

-- ============================================
-- PART 6: SAMPLE PAYROLL RECORDS
-- ============================================

-- Create payroll records for the current month
INSERT INTO public.payroll_records (
    employee_id,
    employee_name,
    month,
    year,
    basic_salary,
    allowances,
    bonuses,
    deductions,
    tax,
    net_salary,
    payment_date,
    payment_method,
    payment_reference,
    status
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    TO_CHAR(CURRENT_DATE, 'Month'),
    EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
    t.salary,
    t.salary * 0.15, -- 15% allowances
    0, -- no bonuses for now
    t.salary * 0.05, -- 5% deductions
    t.salary * 0.11, -- 11% tax
    t.salary + (t.salary * 0.15) - (t.salary * 0.05) - (t.salary * 0.11), -- net calculation
    CURRENT_DATE,
    'bank-transfer',
    'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY t.id)::TEXT, 4, '0'),
    'paid'
FROM public.teachers t
WHERE t.status = 'active'
AND t.salary > 0
ON CONFLICT (employee_id, month, year) DO NOTHING;

-- Create pending payroll for next month
INSERT INTO public.payroll_records (
    employee_id,
    employee_name,
    month,
    year,
    basic_salary,
    allowances,
    bonuses,
    deductions,
    tax,
    net_salary,
    payment_method,
    status
)
SELECT 
    t.id,
    t.first_name || ' ' || t.last_name,
    TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'Month'),
    EXTRACT(YEAR FROM CURRENT_DATE + INTERVAL '1 month')::INTEGER,
    t.salary,
    t.salary * 0.15,
    0,
    t.salary * 0.05,
    t.salary * 0.11,
    t.salary + (t.salary * 0.15) - (t.salary * 0.05) - (t.salary * 0.11),
    'bank-transfer',
    'pending'
FROM public.teachers t
WHERE t.status = 'active'
AND t.salary > 0
ON CONFLICT (employee_id, month, year) DO NOTHING;

-- ============================================
-- VERIFICATION & SUMMARY
-- ============================================

DO $$ 
DECLARE
    leave_balances_count INTEGER;
    leave_requests_count INTEGER;
    attendance_count INTEGER;
    performance_count INTEGER;
    payroll_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE DATA INSERTION SUMMARY';
    RAISE NOTICE '========================================';
    
    -- Count leave balances
    SELECT COUNT(*) INTO leave_balances_count FROM public.leave_balances;
    RAISE NOTICE '✓ Leave Balances: % records', leave_balances_count;
    
    -- Count leave requests
    SELECT COUNT(*) INTO leave_requests_count FROM public.leave_requests;
    RAISE NOTICE '✓ Leave Requests: % records', leave_requests_count;
    
    -- Count attendance records
    SELECT COUNT(*) INTO attendance_count FROM public.attendance_records;
    RAISE NOTICE '✓ Attendance Records: % records', attendance_count;
    
    -- Count performance reviews
    SELECT COUNT(*) INTO performance_count FROM public.performance_reviews;
    RAISE NOTICE '✓ Performance Reviews: % records', performance_count;
    
    -- Count payroll records
    SELECT COUNT(*) INTO payroll_count FROM public.payroll_records;
    RAISE NOTICE '✓ Payroll Records: % records', payroll_count;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Sample data insertion complete!';
    RAISE NOTICE '========================================';
END $$;

-- ============================================
-- SAMPLE QUERIES TO VERIFY DATA
-- ============================================

-- View leave balances
SELECT 
    t.teacher_id,
    t.first_name || ' ' || t.last_name as employee_name,
    lb.annual_leave_remaining,
    lb.sick_leave_remaining
FROM public.teachers t
JOIN public.leave_balances lb ON t.id = lb.employee_id
LIMIT 5;

-- View pending leave requests
SELECT 
    employee_name,
    leave_type,
    start_date,
    end_date,
    total_days,
    status
FROM public.leave_requests
WHERE status = 'pending'
LIMIT 5;

-- View recent attendance
SELECT 
    employee_name,
    date,
    check_in,
    check_out,
    status,
    hours_worked
FROM public.attendance_records
ORDER BY date DESC
LIMIT 10;

-- View performance reviews
SELECT 
    employee_name,
    review_period,
    overall_rating,
    status
FROM public.performance_reviews
LIMIT 5;

-- View current month payroll
SELECT 
    employee_name,
    basic_salary,
    net_salary,
    status
FROM public.payroll_records
WHERE month = TO_CHAR(CURRENT_DATE, 'Month')
AND year = EXTRACT(YEAR FROM CURRENT_DATE)
LIMIT 10;

