-- Enhanced Bursar Reports Database Setup
-- This script creates comprehensive views, functions, and analytics for advanced financial reporting
-- Builds upon existing bursar-reports-setup.sql and adds new capabilities

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
        'XOF'::TEXT,
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
-- 3. ADVANCED ANALYTICS FUNCTIONS
-- ============================================================================

-- 3.1 Predictive Analytics Function
CREATE OR REPLACE FUNCTION predict_payment_collection(
    target_date DATE,
    academic_year TEXT DEFAULT NULL,
    term TEXT DEFAULT NULL
)
RETURNS TABLE (
    predicted_amount NUMERIC,
    confidence_level NUMERIC,
    factors_considered TEXT[]
) AS $$
DECLARE
    historical_avg NUMERIC;
    seasonal_factor NUMERIC;
    current_trend NUMERIC;
    confidence NUMERIC;
    factors TEXT[];
BEGIN
    -- Calculate historical average
    SELECT AVG(amount) INTO historical_avg
    FROM payments 
    WHERE status = 'completed'
    AND (academic_year IS NULL OR academic_year = predict_payment_collection.academic_year)
    AND (term IS NULL OR term = predict_payment_collection.term);
    
    -- Calculate seasonal factor based on month
    SELECT 
        CASE EXTRACT(MONTH FROM target_date)
            WHEN 9 THEN 1.2  -- September (start of term)
            WHEN 10 THEN 1.1 -- October
            WHEN 11 THEN 0.9 -- November
            WHEN 12 THEN 0.8 -- December (holidays)
            WHEN 1 THEN 1.0  -- January
            WHEN 2 THEN 0.9  -- February
            WHEN 3 THEN 1.1  -- March
            WHEN 4 THEN 1.0  -- April
            WHEN 5 THEN 0.9  -- May
            ELSE 0.7         -- Summer months
        END INTO seasonal_factor;
    
    -- Calculate current trend (last 30 days vs previous 30 days)
    SELECT 
        CASE 
            WHEN prev_30.avg_amount > 0 THEN 
                (curr_30.avg_amount - prev_30.avg_amount) / prev_30.avg_amount
            ELSE 0 
        END INTO current_trend
    FROM 
        (SELECT AVG(amount) as avg_amount FROM payments 
         WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days' 
         AND payment_date < CURRENT_DATE) curr_30,
        (SELECT AVG(amount) as avg_amount FROM payments 
         WHERE payment_date >= CURRENT_DATE - INTERVAL '60 days' 
         AND payment_date < CURRENT_DATE - INTERVAL '30 days') prev_30;
    
    -- Calculate confidence level
    confidence := 0.7 + (seasonal_factor * 0.2) + (ABS(current_trend) * 0.1);
    confidence := LEAST(confidence, 0.95); -- Cap at 95%
    
    -- Build factors array
    factors := ARRAY[
        'Historical average: ' || COALESCE(historical_avg::TEXT, 'N/A'),
        'Seasonal factor: ' || seasonal_factor::TEXT,
        'Current trend: ' || (current_trend * 100)::TEXT || '%',
        'Target date: ' || target_date::TEXT
    ];
    
    RETURN QUERY
    SELECT 
        (historical_avg * seasonal_factor * (1 + current_trend))::NUMERIC,
        confidence::NUMERIC,
        factors;
END;
$$ LANGUAGE plpgsql;

-- 3.2 Risk Assessment Function
CREATE OR REPLACE FUNCTION assess_payment_risk(
    student_id UUID DEFAULT NULL,
    class_id UUID DEFAULT NULL
)
RETURNS TABLE (
    risk_level TEXT,
    risk_score NUMERIC,
    risk_factors TEXT[],
    recommendations TEXT[]
) AS $$
DECLARE
    risk_score NUMERIC := 0;
    risk_factors TEXT[] := ARRAY[]::TEXT[];
    recommendations TEXT[] := ARRAY[]::TEXT[];
    overdue_count INTEGER;
    late_payment_rate NUMERIC;
    outstanding_amount NUMERIC;
    payment_history_count INTEGER;
BEGIN
    -- Count overdue payments
    SELECT COUNT(*) INTO overdue_count
    FROM student_fees sf
    WHERE (student_id IS NULL OR sf.student_id = assess_payment_risk.student_id)
    AND (class_id IS NULL OR sf.student_id IN (
        SELECT s.id FROM students s 
        WHERE s.class = (SELECT class_name FROM classes WHERE id = class_id)
    ))
    AND sf.status = 'overdue';
    
    -- Calculate late payment rate
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                COUNT(CASE WHEN p.payment_date > sf.due_date THEN 1 END) * 100.0 / COUNT(*)
            ELSE 0 
        END INTO late_payment_rate
    FROM payments p
    JOIN student_fees sf ON p.student_fee_assignment_id = sf.id
    WHERE (student_id IS NULL OR p.student_id = assess_payment_risk.student_id)
    AND (class_id IS NULL OR p.student_id IN (
        SELECT s.id FROM students s 
        WHERE s.class = (SELECT class_name FROM classes WHERE id = class_id)
    ));
    
    -- Calculate outstanding amount
    SELECT COALESCE(SUM(sf.balance_amount), 0) INTO outstanding_amount
    FROM student_fees sf
    WHERE (student_id IS NULL OR sf.student_id = assess_payment_risk.student_id)
    AND (class_id IS NULL OR sf.student_id IN (
        SELECT s.id FROM students s 
        WHERE s.class = (SELECT class_name FROM classes WHERE id = class_id)
    ));
    
    -- Count payment history
    SELECT COUNT(*) INTO payment_history_count
    FROM payments p
    WHERE (student_id IS NULL OR p.student_id = assess_payment_risk.student_id)
    AND (class_id IS NULL OR p.student_id IN (
        SELECT s.id FROM students s 
        WHERE s.class = (SELECT class_name FROM classes WHERE id = class_id)
    ));
    
    -- Calculate risk score
    risk_score := 
        (overdue_count * 20) + 
        (late_payment_rate * 0.5) + 
        (CASE WHEN outstanding_amount > 100000 THEN 30 ELSE outstanding_amount / 10000 END) +
        (CASE WHEN payment_history_count = 0 THEN 25 ELSE 0 END);
    
    -- Build risk factors
    IF overdue_count > 0 THEN
        risk_factors := array_append(risk_factors, overdue_count::TEXT || ' overdue payments');
    END IF;
    
    IF late_payment_rate > 50 THEN
        risk_factors := array_append(risk_factors, late_payment_rate::TEXT || '% late payment rate');
    END IF;
    
    IF outstanding_amount > 50000 THEN
        risk_factors := array_append(risk_factors, 'Outstanding amount: ' || outstanding_amount::TEXT);
    END IF;
    
    IF payment_history_count = 0 THEN
        risk_factors := array_append(risk_factors, 'No payment history');
    END IF;
    
    -- Build recommendations
    IF risk_score > 70 THEN
        recommendations := ARRAY[
            'Immediate follow-up required',
            'Consider payment plan options',
            'Schedule parent meeting',
            'Monitor payment behavior closely'
        ];
    ELSIF risk_score > 40 THEN
        recommendations := ARRAY[
            'Send payment reminder',
            'Offer payment plan',
            'Follow up within 7 days'
        ];
    ELSE
        recommendations := ARRAY[
            'Continue normal collection process',
            'Monitor for any changes in payment behavior'
        ];
    END IF;
    
    RETURN QUERY
    SELECT 
        CASE 
            WHEN risk_score > 70 THEN 'High'
            WHEN risk_score > 40 THEN 'Medium'
            ELSE 'Low'
        END::TEXT,
        risk_score::NUMERIC,
        risk_factors,
        recommendations;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- 4.1 Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_student_date ON payments(student_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_status ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_fees_class_status ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_structures_year_term ON fee_structures(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments(status, payment_date);

-- 4.2 Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_students ON students(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_fee_structures ON fee_structures(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_completed_payments ON payments(id) WHERE status = 'completed';

-- 4.3 Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_fees_composite ON student_fees(student_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_payments_composite ON payments(student_id, payment_date, status);

-- ============================================================================
-- 5. MATERIALIZED VIEWS FOR FREQUENTLY ACCESSED DATA
-- ============================================================================

-- 5.1 Daily Collection Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_collection_summary_mv AS
SELECT 
    DATE(p.payment_date) as collection_date,
    COUNT(p.id) as total_transactions,
    SUM(p.amount) as total_amount,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.received_by) as unique_collectors,
    COUNT(DISTINCT p.payment_method_id) as payment_methods_used,
    AVG(p.amount) as average_amount,
    MIN(p.amount) as minimum_amount,
    MAX(p.amount) as maximum_amount
FROM payments p
WHERE p.status = 'completed'
GROUP BY DATE(p.payment_date)
ORDER BY collection_date DESC;

-- 5.2 Monthly Financial Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_financial_summary_mv AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    EXTRACT(YEAR FROM p.payment_date) as year,
    EXTRACT(MONTH FROM p.payment_date) as month_number,
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_collected,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.received_by) as unique_collectors,
    AVG(p.amount) as average_payment,
    SUM(sf.total_amount) as total_expected,
    SUM(sf.balance_amount) as total_outstanding,
    CASE 
        WHEN SUM(sf.total_amount) > 0 THEN 
            (SUM(p.amount) * 100.0 / SUM(sf.total_amount))
        ELSE 0 
    END as collection_rate
FROM payments p
JOIN student_fees sf ON p.student_id = sf.student_id
WHERE p.status = 'completed'
GROUP BY DATE_TRUNC('month', p.payment_date), EXTRACT(YEAR FROM p.payment_date), EXTRACT(MONTH FROM p.payment_date)
ORDER BY month DESC;

-- 5.3 Class Performance Summary Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS class_performance_summary_mv AS
SELECT 
    c.class_name,
    c.subsystem,
    c.stream as branch,
    COUNT(s.id) as total_students,
    COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as fully_paid,
    COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partially_paid,
    COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue,
    SUM(sf.total_amount) as total_expected,
    SUM(sf.paid_amount) as total_collected,
    SUM(sf.balance_amount) as total_outstanding,
    CASE 
        WHEN SUM(sf.total_amount) > 0 THEN 
            (SUM(sf.paid_amount) * 100.0 / SUM(sf.total_amount))
        ELSE 0 
    END as collection_rate
FROM classes c
LEFT JOIN students s ON c.class_name = s.class
LEFT JOIN student_fees sf ON s.id = sf.student_id
WHERE c.is_active = true
GROUP BY c.class_name, c.subsystem, c.stream
ORDER BY collection_rate DESC;

-- ============================================================================
-- 6. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- 6.1 Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_financial_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_collection_summary_mv;
    REFRESH MATERIALIZED VIEW monthly_financial_summary_mv;
    REFRESH MATERIALIZED VIEW class_performance_summary_mv;
    REFRESH MATERIALIZED VIEW financial_summary_mv;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Function to refresh specific materialized view
CREATE OR REPLACE FUNCTION refresh_financial_view(view_name TEXT)
RETURNS void AS $$
BEGIN
    CASE view_name
        WHEN 'daily_collection_summary_mv' THEN
            REFRESH MATERIALIZED VIEW daily_collection_summary_mv;
        WHEN 'monthly_financial_summary_mv' THEN
            REFRESH MATERIALIZED VIEW monthly_financial_summary_mv;
        WHEN 'class_performance_summary_mv' THEN
            REFRESH MATERIALIZED VIEW class_performance_summary_mv;
        WHEN 'financial_summary_mv' THEN
            REFRESH MATERIALIZED VIEW financial_summary_mv;
        ELSE
            RAISE EXCEPTION 'Unknown materialized view: %', view_name;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS FOR AUTOMATIC REFRESH
-- ============================================================================

-- 7.1 Trigger function for automatic refresh
CREATE OR REPLACE FUNCTION trigger_refresh_financial_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh views based on the table that was modified
    IF TG_TABLE_NAME = 'payments' THEN
        PERFORM refresh_financial_view('daily_collection_summary_mv');
        PERFORM refresh_financial_view('monthly_financial_summary_mv');
    ELSIF TG_TABLE_NAME = 'student_fees' THEN
        PERFORM refresh_financial_view('class_performance_summary_mv');
        PERFORM refresh_financial_view('financial_summary_mv');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7.2 Create triggers for automatic refresh
CREATE TRIGGER refresh_financial_views_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_financial_views();

CREATE TRIGGER refresh_financial_views_student_fees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON student_fees
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_financial_views();

-- ============================================================================
-- 8. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions on materialized views individually
GRANT SELECT ON daily_collection_summary_mv TO authenticated;
GRANT SELECT ON monthly_financial_summary_mv TO authenticated;
GRANT SELECT ON class_performance_summary_mv TO authenticated;
GRANT SELECT ON student_risk_assessment_mv TO authenticated;
GRANT SELECT ON financial_summary_mv TO authenticated;

-- Grant specific permissions for report generation
GRANT EXECUTE ON FUNCTION generate_financial_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_payment_history TO authenticated;
GRANT EXECUTE ON FUNCTION generate_class_comparison_report TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_payment_method_performance TO authenticated;
GRANT EXECUTE ON FUNCTION predict_payment_collection TO authenticated;
GRANT EXECUTE ON FUNCTION assess_payment_risk TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_financial_views TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_financial_view TO authenticated;

-- ============================================================================
-- 9. DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON VIEW student_payment_behavior_view IS 'Comprehensive analytics of student payment behavior patterns';
COMMENT ON VIEW class_performance_analytics_view IS 'Detailed class-level performance analytics and collection metrics';
COMMENT ON VIEW payment_method_analytics_view IS 'Payment method usage analytics and performance metrics';
COMMENT ON VIEW seasonal_payment_trends_view IS 'Seasonal and quarterly payment trend analysis';
COMMENT ON MATERIALIZED VIEW daily_collection_summary_mv IS 'Daily collection summary for quick dashboard access';
COMMENT ON MATERIALIZED VIEW monthly_financial_summary_mv IS 'Monthly financial summary with collection rates';
COMMENT ON MATERIALIZED VIEW class_performance_summary_mv IS 'Class performance summary with collection metrics';
COMMENT ON FUNCTION generate_financial_dashboard IS 'Generates comprehensive financial dashboard metrics with trends';
COMMENT ON FUNCTION get_student_payment_history IS 'Retrieves detailed payment history for a specific student';
COMMENT ON FUNCTION generate_class_comparison_report IS 'Generates class comparison report with performance rankings';
COMMENT ON FUNCTION analyze_payment_method_performance IS 'Analyzes payment method performance and preferences';
COMMENT ON FUNCTION predict_payment_collection IS 'Predicts future payment collection based on historical data';
COMMENT ON FUNCTION assess_payment_risk IS 'Assesses payment risk for students or classes';

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify that all views and functions were created successfully
SELECT 'Enhanced Bursar Reports Setup Complete' as status;

-- Show created views
SELECT schemaname, viewname, definition 
FROM pg_views 
WHERE viewname LIKE '%bursar%' OR viewname LIKE '%payment%' OR viewname LIKE '%financial%'
ORDER BY viewname;

-- Show created functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%financial%' OR proname LIKE '%payment%' OR proname LIKE '%report%'
ORDER BY proname;

-- Show created materialized views
SELECT schemaname, matviewname 
FROM pg_matviews 
ORDER BY matviewname;

-- Show created indexes
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE indexname LIKE '%payment%' OR indexname LIKE '%financial%' OR indexname LIKE '%bursar%'
ORDER BY indexname;
