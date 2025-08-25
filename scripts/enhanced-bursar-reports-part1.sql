-- Enhanced Bursar Reports Database Setup - Part 1
-- Advanced Analytics Views and Core Reporting Functions
-- This script builds upon existing bursar-reports-setup.sql

-- ============================================================================
-- 1. ADVANCED ANALYTICS VIEWS
-- ============================================================================

-- 1.1 Student Payment Behavior Analytics View
CREATE OR REPLACE VIEW student_payment_behavior_view AS
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.student_id as student_number,
    c.class_name,
    c.subsystem,
    c.stream as branch,
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_amount_paid,
    AVG(p.amount) as average_payment_amount,
    MIN(p.payment_date) as first_payment_date,
    MAX(p.payment_date) as last_payment_date,
    COUNT(DISTINCT EXTRACT(MONTH FROM p.payment_date)) as months_with_payments,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            EXTRACT(EPOCH FROM (MAX(p.payment_date) - MIN(p.payment_date))) / (24 * 3600) / COUNT(p.id)
        ELSE 0 
    END as average_days_between_payments,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            COUNT(CASE WHEN p.payment_date <= sf.due_date THEN 1 END) * 100.0 / COUNT(p.id)
        ELSE 0 
    END as on_time_payment_percentage,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            COUNT(CASE WHEN p.payment_date > sf.due_date THEN 1 END) * 100.0 / COUNT(p.id)
        ELSE 0 
    END as late_payment_percentage
FROM students s
JOIN classes c ON s.class = c.class_name
LEFT JOIN student_fees sf ON s.id = sf.student_id
LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'completed'
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.student_id, c.class_name, c.subsystem, c.stream
ORDER BY total_amount_paid DESC;

-- 1.2 Class Performance Analytics View
CREATE OR REPLACE VIEW class_performance_analytics_view AS
SELECT 
    c.id as class_id,
    c.class_name,
    c.subsystem,
    c.stream as branch,
    COUNT(s.id) as total_students,
    COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as fully_paid_students,
    COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partially_paid_students,
    COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending_students,
    COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_students,
    SUM(sf.total_amount) as total_expected_amount,
    SUM(sf.paid_amount) as total_collected_amount,
    SUM(sf.balance_amount) as total_outstanding_amount,
    CASE 
        WHEN SUM(sf.total_amount) > 0 THEN 
            (SUM(sf.paid_amount) / SUM(sf.total_amount)) * 100 
        ELSE 0 
    END as collection_rate,
    AVG(sf.paid_amount) as average_amount_paid_per_student,
    AVG(sf.balance_amount) as average_outstanding_per_student,
    COUNT(DISTINCT p.id) as total_payment_transactions,
    SUM(p.amount) as total_payment_amount,
    AVG(p.amount) as average_payment_transaction
FROM classes c
LEFT JOIN students s ON c.class_name = s.class
LEFT JOIN student_fees sf ON s.id = sf.student_id
LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'completed'
WHERE c.is_active = true
GROUP BY c.id, c.class_name, c.subsystem, c.stream
ORDER BY collection_rate DESC;

-- 1.3 Payment Method Analytics View
CREATE OR REPLACE VIEW payment_method_analytics_view AS
SELECT 
    pm.id as payment_method_id,
    pm.name as payment_method,
    pm.code as payment_method_code,
    COUNT(p.id) as total_transactions,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as average_amount,
    MIN(p.amount) as minimum_amount,
    MAX(p.amount) as maximum_amount,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.received_by) as unique_collectors,
    COUNT(DISTINCT DATE_TRUNC('month', p.payment_date)) as months_active,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            SUM(p.amount) * 100.0 / (SELECT SUM(amount) FROM payments WHERE status = 'completed')
        ELSE 0 
    END as percentage_of_total_payments,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            AVG(p.amount) * 100.0 / (SELECT AVG(amount) FROM payments WHERE status = 'completed')
        ELSE 0 
    END as percentage_of_average_payment
FROM payment_methods pm
LEFT JOIN payments p ON pm.id = p.payment_method_id AND p.status = 'completed'
GROUP BY pm.id, pm.name, pm.code
ORDER BY total_amount DESC;

-- 1.4 Seasonal Payment Trends View
CREATE OR REPLACE VIEW seasonal_payment_trends_view AS
SELECT 
    EXTRACT(YEAR FROM p.payment_date) as year,
    EXTRACT(MONTH FROM p.payment_date) as month,
    TO_CHAR(p.payment_date, 'Month') as month_name,
    TO_CHAR(p.payment_date, 'YYYY-MM') as year_month,
    COUNT(p.id) as total_transactions,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as average_amount,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.received_by) as unique_collectors,
    COUNT(DISTINCT pm.name) as payment_methods_used,
    CASE 
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (9, 10, 11) THEN 'Q1'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (12, 1, 2) THEN 'Q2'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (3, 4, 5) THEN 'Q3'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (6, 7, 8) THEN 'Q4'
    END as quarter,
    CASE 
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (9, 10, 11) THEN 'First Term'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (12, 1, 2) THEN 'Second Term'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (3, 4, 5) THEN 'Third Term'
        WHEN EXTRACT(MONTH FROM p.payment_date) IN (6, 7, 8) THEN 'Holiday Period'
    END as academic_period
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'completed'
GROUP BY 
    EXTRACT(YEAR FROM p.payment_date),
    EXTRACT(MONTH FROM p.payment_date),
    TO_CHAR(p.payment_date, 'Month'),
    TO_CHAR(p.payment_date, 'YYYY-MM')
ORDER BY year DESC, month DESC;

-- ============================================================================
-- 2. ADVANCED REPORTING FUNCTIONS
-- ============================================================================

-- 2.1 Comprehensive Financial Dashboard Function
CREATE OR REPLACE FUNCTION generate_financial_dashboard(
    academic_year TEXT DEFAULT NULL,
    term TEXT DEFAULT NULL,
    class_id UUID DEFAULT NULL
)
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    metric_description TEXT,
    trend_direction TEXT,
    trend_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            COALESCE(academic_year, (SELECT MAX(academic_year) FROM fee_structures)) as year,
            COALESCE(term, 'first') as term
    ),
    period_stats AS (
        SELECT 
            COUNT(DISTINCT s.id) as total_students,
            SUM(sf.total_amount) as total_expected,
            SUM(sf.paid_amount) as total_collected,
            SUM(sf.balance_amount) as total_outstanding,
            COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count,
            COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as fully_paid_count,
            COUNT(DISTINCT p.id) as total_transactions,
            AVG(p.amount) as average_payment
        FROM students s
        JOIN student_fees sf ON s.id = sf.student_id
        LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'completed'
        CROSS JOIN current_period cp
        WHERE (class_id IS NULL OR s.class = (SELECT class_name FROM classes WHERE id = class_id))
        AND (cp.year IS NULL OR sf.academic_year = cp.year)
        AND (cp.term IS NULL OR sf.term = cp.term)
    ),
    previous_period AS (
        SELECT 
            COUNT(DISTINCT s.id) as total_students,
            SUM(sf.total_amount) as total_expected,
            SUM(sf.paid_amount) as total_collected,
            SUM(sf.balance_amount) as total_outstanding,
            COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count,
            COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as fully_paid_count,
            COUNT(DISTINCT p.id) as total_transactions,
            AVG(p.amount) as average_payment
        FROM students s
        JOIN student_fees sf ON s.id = sf.student_id
        LEFT JOIN payments p ON s.id = p.student_id AND p.status = 'completed'
        CROSS JOIN current_period cp
        WHERE (class_id IS NULL OR s.class = (SELECT class_name FROM classes WHERE id = class_id))
        AND (cp.year IS NULL OR sf.academic_year = cp.year)
        AND (cp.term IS NULL OR sf.term = cp.term)
        AND p.payment_date < CURRENT_DATE - INTERVAL '30 days'
    )
    SELECT 
        'Total Students'::TEXT,
        ps.total_students::NUMERIC,
        'students'::TEXT,
        'Total number of enrolled students'::TEXT,
        CASE WHEN ps.total_students > pp.total_students THEN 'up'::TEXT
             WHEN ps.total_students < pp.total_students THEN 'down'::TEXT
             ELSE 'stable'::TEXT END,
        CASE WHEN pp.total_students > 0 THEN 
            ((ps.total_students - pp.total_students) * 100.0 / pp.total_students)
        ELSE 0 END
    FROM period_stats ps, previous_period pp
    
    UNION ALL
    
    SELECT 
        'Collection Rate'::TEXT,
        CASE WHEN ps.total_expected > 0 THEN 
            (ps.total_collected * 100.0 / ps.total_expected)
        ELSE 0 END,
        '%'::TEXT,
        'Percentage of expected fees collected'::TEXT,
        CASE WHEN ps.total_collected > pp.total_collected THEN 'up'::TEXT
             WHEN ps.total_collected < pp.total_collected THEN 'down'::TEXT
             ELSE 'stable'::TEXT END,
        CASE WHEN pp.total_collected > 0 THEN 
            ((ps.total_collected - pp.total_collected) * 100.0 / pp.total_collected)
        ELSE 0 END
    FROM period_stats ps, previous_period pp
    
    UNION ALL
    
    SELECT 
        'Outstanding Amount'::TEXT,
        ps.total_outstanding::NUMERIC,
        'XAF'::TEXT,
        'Total outstanding fee balance'::TEXT,
        CASE WHEN ps.total_outstanding < pp.total_outstanding THEN 'down'::TEXT
             WHEN ps.total_outstanding > pp.total_outstanding THEN 'up'::TEXT
             ELSE 'stable'::TEXT END,
        CASE WHEN pp.total_outstanding > 0 THEN 
            ((ps.total_outstanding - pp.total_outstanding) * 100.0 / pp.total_outstanding)
        ELSE 0 END
    FROM period_stats ps, previous_period pp
    
    UNION ALL
    
    SELECT 
        'Overdue Students'::TEXT,
        ps.overdue_count::NUMERIC,
        'students'::TEXT,
        'Number of students with overdue payments'::TEXT,
        CASE WHEN ps.overdue_count < pp.overdue_count THEN 'down'::TEXT
             WHEN ps.overdue_count > pp.overdue_count THEN 'up'::TEXT
             ELSE 'stable'::TEXT END,
        CASE WHEN pp.overdue_count > 0 THEN 
            ((ps.overdue_count - pp.overdue_count) * 100.0 / pp.overdue_count)
        ELSE 0 END
    FROM period_stats ps, previous_period pp;
END;
$$ LANGUAGE plpgsql;

-- 2.2 Student Payment History Function
CREATE OR REPLACE FUNCTION get_student_payment_history(
    student_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    payment_date DATE,
    amount NUMERIC,
    payment_method TEXT,
    receipt_number TEXT,
    fee_structure_name TEXT,
    academic_year TEXT,
    term TEXT,
    status TEXT,
    collected_by TEXT,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.payment_date,
        p.amount,
        pm.name as payment_method,
        p.receipt_number,
        fs.name as fee_structure_name,
        p.academic_year,
        p.term,
        p.status,
        u.first_name || ' ' || u.last_name as collected_by,
        p.notes
    FROM payments p
    JOIN payment_methods pm ON p.payment_method_id = pm.id
    JOIN fee_structures fs ON p.fee_structure_id = fs.id
    LEFT JOIN users u ON p.received_by = u.id
    WHERE p.student_id = get_student_payment_history.student_id
    AND (start_date IS NULL OR p.payment_date >= start_date)
    AND (end_date IS NULL OR p.payment_date <= end_date)
    ORDER BY p.payment_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 2.3 Class Comparison Report Function
CREATE OR REPLACE FUNCTION generate_class_comparison_report(
    academic_year TEXT DEFAULT NULL,
    term TEXT DEFAULT NULL
)
RETURNS TABLE (
    class_name TEXT,
    subsystem TEXT,
    branch TEXT,
    total_students BIGINT,
    collection_rate NUMERIC,
    average_outstanding NUMERIC,
    overdue_students BIGINT,
    total_expected NUMERIC,
    total_collected NUMERIC,
    total_outstanding NUMERIC,
    performance_rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH class_stats AS (
        SELECT 
            c.class_name,
            c.subsystem,
            c.stream as branch,
            COUNT(s.id) as total_students,
            SUM(sf.total_amount) as total_expected,
            SUM(sf.paid_amount) as total_collected,
            SUM(sf.balance_amount) as total_outstanding,
            COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_students,
            CASE 
                WHEN SUM(sf.total_amount) > 0 THEN 
                    (SUM(sf.paid_amount) * 100.0 / SUM(sf.total_amount))
                ELSE 0 
            END as collection_rate,
            CASE 
                WHEN COUNT(s.id) > 0 THEN 
                    SUM(sf.balance_amount) / COUNT(s.id)
                ELSE 0 
            END as average_outstanding
        FROM classes c
        LEFT JOIN students s ON c.class_name = s.class
        LEFT JOIN student_fees sf ON s.id = sf.student_id
        WHERE c.is_active = true
        AND (academic_year IS NULL OR sf.academic_year = academic_year)
        AND (term IS NULL OR sf.term = term)
        GROUP BY c.class_name, c.subsystem, c.stream
    )
    SELECT 
        cs.class_name,
        cs.subsystem,
        cs.branch,
        cs.total_students,
        cs.collection_rate,
        cs.average_outstanding,
        cs.overdue_students,
        cs.total_expected,
        cs.total_collected,
        cs.total_outstanding,
        RANK() OVER (ORDER BY cs.collection_rate DESC) as performance_rank
    FROM class_stats cs
    ORDER BY cs.collection_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- 2.4 Payment Method Performance Function
CREATE OR REPLACE FUNCTION analyze_payment_method_performance(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    payment_method TEXT,
    total_transactions BIGINT,
    total_amount NUMERIC,
    average_amount NUMERIC,
    success_rate NUMERIC,
    student_preference_rank BIGINT,
    amount_rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH method_stats AS (
        SELECT 
            pm.name as payment_method,
            COUNT(p.id) as total_transactions,
            SUM(p.amount) as total_amount,
            AVG(p.amount) as average_amount,
            COUNT(CASE WHEN p.status = 'completed' THEN 1 END) * 100.0 / COUNT(p.id) as success_rate
        FROM payment_methods pm
        LEFT JOIN payments p ON pm.id = p.payment_method_id
        WHERE (start_date IS NULL OR p.payment_date >= start_date)
        AND (end_date IS NULL OR p.payment_date <= end_date)
        GROUP BY pm.name
    )
    SELECT 
        ms.payment_method,
        ms.total_transactions,
        ms.total_amount,
        ms.average_amount,
        ms.success_rate,
        RANK() OVER (ORDER BY ms.total_transactions DESC) as student_preference_rank,
        RANK() OVER (ORDER BY ms.total_amount DESC) as amount_rank
    FROM method_stats ms
    ORDER BY ms.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON VIEW student_payment_behavior_view IS 'Comprehensive analytics of student payment behavior patterns';
COMMENT ON VIEW class_performance_analytics_view IS 'Detailed class-level performance analytics and collection metrics';
COMMENT ON VIEW payment_method_analytics_view IS 'Payment method usage analytics and performance metrics';
COMMENT ON VIEW seasonal_payment_trends_view IS 'Seasonal and quarterly payment trend analysis';
COMMENT ON FUNCTION generate_financial_dashboard IS 'Generates comprehensive financial dashboard metrics with trends';
COMMENT ON FUNCTION get_student_payment_history IS 'Retrieves detailed payment history for a specific student';
COMMENT ON FUNCTION generate_class_comparison_report IS 'Generates class comparison report with performance rankings';
COMMENT ON FUNCTION analyze_payment_method_performance IS 'Analyzes payment method performance and preferences';

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

SELECT 'Enhanced Bursar Reports Part 1 Setup Complete' as status;
