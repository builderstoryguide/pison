-- Enhanced Bursar Reports Database Setup - Part 2
-- Predictive Analytics, Risk Assessment, and Performance Optimization
-- This script builds upon Part 1 and existing bursar-reports-setup.sql

-- ============================================================================
-- 1. PREDICTIVE ANALYTICS FUNCTIONS
-- ============================================================================

-- 1.1 Predictive Analytics Function
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

-- 1.2 Risk Assessment Function
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

-- 1.3 Cash Flow Projection Function
CREATE OR REPLACE FUNCTION project_cash_flow(
    projection_months INTEGER DEFAULT 12,
    academic_year TEXT DEFAULT NULL
)
RETURNS TABLE (
    projection_month DATE,
    expected_collection NUMERIC,
    projected_collection NUMERIC,
    confidence_level NUMERIC,
    factors TEXT[]
) AS $$
DECLARE
    current_month DATE := DATE_TRUNC('month', CURRENT_DATE);
    month_counter INTEGER := 0;
    historical_monthly_avg NUMERIC;
    seasonal_factors NUMERIC[];
    factors TEXT[];
BEGIN
    -- Get historical monthly average
    SELECT AVG(monthly_total) INTO historical_monthly_avg
    FROM (
        SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as monthly_total
        FROM payments 
        WHERE status = 'completed'
        AND (academic_year IS NULL OR academic_year = project_cash_flow.academic_year)
        GROUP BY DATE_TRUNC('month', payment_date)
    ) monthly_totals;
    
    -- Define seasonal factors for each month
    seasonal_factors := ARRAY[1.2, 1.1, 0.9, 0.8, 1.0, 0.9, 1.1, 1.0, 0.9, 0.7, 0.7, 0.7];
    
    -- Build factors array
    factors := ARRAY[
        'Historical monthly average: ' || COALESCE(historical_monthly_avg::TEXT, 'N/A'),
        'Projection period: ' || projection_months::TEXT || ' months',
        'Academic year: ' || COALESCE(academic_year, 'All years')
    ];
    
    -- Generate projections for each month
    WHILE month_counter < projection_months LOOP
        RETURN QUERY
        SELECT 
            (current_month + (month_counter || ' months')::INTERVAL)::DATE,
            historical_monthly_avg::NUMERIC,
            (historical_monthly_avg * seasonal_factors[EXTRACT(MONTH FROM current_month + (month_counter || ' months')::INTERVAL)])::NUMERIC,
            0.8::NUMERIC, -- Base confidence level
            factors;
        
        month_counter := month_counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. PERFORMANCE OPTIMIZATION
-- ============================================================================

-- 2.1 Create additional indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_student_date ON payments(student_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_method_date ON payments(payment_method_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_student_fees_student_status ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_student_fees_class_status ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_fee_structures_year_term ON fee_structures(academic_year, term);
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments(status, payment_date);

-- 2.2 Create partial indexes for active records
CREATE INDEX IF NOT EXISTS idx_active_students ON students(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_active_fee_structures ON fee_structures(id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_completed_payments ON payments(id) WHERE status = 'completed';

-- 2.3 Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_student_fees_composite ON student_fees(student_id, academic_year, term);
CREATE INDEX IF NOT EXISTS idx_payments_composite ON payments(student_id, payment_date, status);

-- 2.4 Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_payments_monthly ON payments(DATE_TRUNC('month', payment_date));
CREATE INDEX IF NOT EXISTS idx_payments_quarterly ON payments(DATE_TRUNC('quarter', payment_date));
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date_status ON student_fees(due_date, status);

-- ============================================================================
-- 3. MATERIALIZED VIEWS FOR FREQUENTLY ACCESSED DATA
-- ============================================================================

-- 3.1 Daily Collection Summary Materialized View
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

-- 3.2 Monthly Financial Summary Materialized View
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

-- 3.3 Class Performance Summary Materialized View
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

-- 3.4 Student Risk Assessment Materialized View
CREATE MATERIALIZED VIEW IF NOT EXISTS student_risk_assessment_mv AS
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.student_id as student_number,
    c.class_name,
    COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue_count,
    SUM(sf.balance_amount) as total_outstanding,
    COUNT(p.id) as payment_history_count,
    CASE 
        WHEN COUNT(p.id) > 0 THEN 
            COUNT(CASE WHEN p.payment_date > sf.due_date THEN 1 END) * 100.0 / COUNT(p.id)
        ELSE 0 
    END as late_payment_rate,
    CASE 
        WHEN (COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) * 20) + 
             (CASE WHEN COUNT(p.id) > 0 THEN 
                COUNT(CASE WHEN p.payment_date > sf.due_date THEN 1 END) * 100.0 / COUNT(p.id)
              ELSE 0 END * 0.5) + 
             (CASE WHEN SUM(sf.balance_amount) > 100000 THEN 30 ELSE SUM(sf.balance_amount) / 10000 END) +
             (CASE WHEN COUNT(p.id) = 0 THEN 25 ELSE 0 END) > 70 THEN 'High'
        WHEN (COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) * 20) + 
             (CASE WHEN COUNT(p.id) > 0 THEN 
                COUNT(CASE WHEN p.payment_date > sf.due_date THEN 1 END) * 100.0 / COUNT(p.id)
              ELSE 0 END * 0.5) + 
             (CASE WHEN SUM(sf.balance_amount) > 100000 THEN 30 ELSE SUM(sf.balance_amount) / 10000 END) +
             (CASE WHEN COUNT(p.id) = 0 THEN 25 ELSE 0 END) > 40 THEN 'Medium'
        ELSE 'Low'
    END as risk_level
FROM students s
JOIN classes c ON s.class = c.class_name
LEFT JOIN student_fees sf ON s.id = sf.student_id
LEFT JOIN payments p ON s.id = p.student_id
WHERE s.is_active = true
GROUP BY s.id, s.first_name, s.last_name, s.student_id, c.class_name
ORDER BY risk_level DESC, total_outstanding DESC;

-- ============================================================================
-- 4. REFRESH FUNCTIONS FOR MATERIALIZED VIEWS
-- ============================================================================

-- 4.1 Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_financial_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW daily_collection_summary_mv;
    REFRESH MATERIALIZED VIEW monthly_financial_summary_mv;
    REFRESH MATERIALIZED VIEW class_performance_summary_mv;
    REFRESH MATERIALIZED VIEW student_risk_assessment_mv;
    REFRESH MATERIALIZED VIEW financial_summary_mv;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Function to refresh specific materialized view
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
        WHEN 'student_risk_assessment_mv' THEN
            REFRESH MATERIALIZED VIEW student_risk_assessment_mv;
        WHEN 'financial_summary_mv' THEN
            REFRESH MATERIALIZED VIEW financial_summary_mv;
        ELSE
            RAISE EXCEPTION 'Unknown materialized view: %', view_name;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC REFRESH
-- ============================================================================

-- 5.1 Trigger function for automatic refresh
CREATE OR REPLACE FUNCTION trigger_refresh_financial_views()
RETURNS TRIGGER AS $$
BEGIN
    -- Refresh views based on the table that was modified
    IF TG_TABLE_NAME = 'payments' THEN
        PERFORM refresh_financial_view('daily_collection_summary_mv');
        PERFORM refresh_financial_view('monthly_financial_summary_mv');
    ELSIF TG_TABLE_NAME = 'student_fees' THEN
        PERFORM refresh_financial_view('class_performance_summary_mv');
        PERFORM refresh_financial_view('student_risk_assessment_mv');
        PERFORM refresh_financial_view('financial_summary_mv');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5.2 Create triggers for automatic refresh
CREATE TRIGGER refresh_financial_views_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_financial_views();

CREATE TRIGGER refresh_financial_views_student_fees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON student_fees
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_financial_views();

-- ============================================================================
-- 6. ADDITIONAL ANALYTICS FUNCTIONS
-- ============================================================================

-- 6.1 Student Payment Pattern Analysis
CREATE OR REPLACE FUNCTION analyze_student_payment_patterns(
    student_id UUID DEFAULT NULL,
    class_id UUID DEFAULT NULL
)
RETURNS TABLE (
    pattern_type TEXT,
    pattern_description TEXT,
    frequency NUMERIC,
    average_amount NUMERIC,
    total_impact NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH payment_patterns AS (
        SELECT 
            CASE 
                WHEN p.payment_date <= sf.due_date THEN 'On-time payments'
                WHEN p.payment_date <= sf.due_date + INTERVAL '7 days' THEN 'Slightly late payments'
                WHEN p.payment_date <= sf.due_date + INTERVAL '30 days' THEN 'Moderately late payments'
                ELSE 'Very late payments'
            END as pattern_type,
            COUNT(*) as frequency,
            AVG(p.amount) as average_amount,
            SUM(p.amount) as total_impact
        FROM payments p
        JOIN student_fees sf ON p.student_fee_assignment_id = sf.id
        WHERE (student_id IS NULL OR p.student_id = analyze_student_payment_patterns.student_id)
        AND (class_id IS NULL OR p.student_id IN (
            SELECT s.id FROM students s 
            WHERE s.class = (SELECT class_name FROM classes WHERE id = class_id)
        ))
        AND p.status = 'completed'
        GROUP BY 
            CASE 
                WHEN p.payment_date <= sf.due_date THEN 'On-time payments'
                WHEN p.payment_date <= sf.due_date + INTERVAL '7 days' THEN 'Slightly late payments'
                WHEN p.payment_date <= sf.due_date + INTERVAL '30 days' THEN 'Moderately late payments'
                ELSE 'Very late payments'
            END
    )
    SELECT 
        pp.pattern_type,
        CASE pp.pattern_type
            WHEN 'On-time payments' THEN 'Payments made before or on due date'
            WHEN 'Slightly late payments' THEN 'Payments made within 7 days of due date'
            WHEN 'Moderately late payments' THEN 'Payments made within 30 days of due date'
            ELSE 'Payments made more than 30 days after due date'
        END,
        pp.frequency,
        pp.average_amount,
        pp.total_impact
    FROM payment_patterns pp
    ORDER BY pp.frequency DESC;
END;
$$ LANGUAGE plpgsql;

-- 6.2 Collection Efficiency Analysis
CREATE OR REPLACE FUNCTION analyze_collection_efficiency(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    class_id UUID DEFAULT NULL
)
RETURNS TABLE (
    efficiency_metric TEXT,
    metric_value NUMERIC,
    benchmark NUMERIC,
    performance_status TEXT,
    recommendations TEXT
) AS $$
DECLARE
    total_expected NUMERIC;
    total_collected NUMERIC;
    collection_rate NUMERIC;
    avg_days_to_collect NUMERIC;
    overdue_percentage NUMERIC;
BEGIN
    -- Calculate collection rate
    SELECT 
        SUM(sf.total_amount),
        SUM(sf.paid_amount),
        CASE WHEN SUM(sf.total_amount) > 0 THEN 
            (SUM(sf.paid_amount) * 100.0 / SUM(sf.total_amount))
        ELSE 0 END
    INTO total_expected, total_collected, collection_rate
    FROM student_fees sf
    JOIN students s ON sf.student_id = s.id
    WHERE (start_date IS NULL OR sf.created_at >= start_date)
    AND (end_date IS NULL OR sf.created_at <= end_date)
    AND (class_id IS NULL OR s.class = (SELECT class_name FROM classes WHERE id = class_id));
    
    -- Calculate average days to collect
    SELECT AVG(EXTRACT(EPOCH FROM (p.payment_date - sf.due_date)) / (24 * 3600))
    INTO avg_days_to_collect
    FROM payments p
    JOIN student_fees sf ON p.student_fee_assignment_id = sf.id
    JOIN students s ON sf.student_id = s.id
    WHERE p.status = 'completed'
    AND (start_date IS NULL OR p.payment_date >= start_date)
    AND (end_date IS NULL OR p.payment_date <= end_date)
    AND (class_id IS NULL OR s.class = (SELECT class_name FROM classes WHERE id = class_id));
    
    -- Calculate overdue percentage
    SELECT 
        CASE WHEN COUNT(*) > 0 THEN 
            COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) * 100.0 / COUNT(*)
        ELSE 0 END
    INTO overdue_percentage
    FROM student_fees sf
    JOIN students s ON sf.student_id = s.id
    WHERE (start_date IS NULL OR sf.created_at >= start_date)
    AND (end_date IS NULL OR sf.created_at <= end_date)
    AND (class_id IS NULL OR s.class = (SELECT class_name FROM classes WHERE id = class_id));
    
    RETURN QUERY
    SELECT 
        'Collection Rate'::TEXT,
        collection_rate,
        85.0::NUMERIC, -- Benchmark: 85%
        CASE WHEN collection_rate >= 85 THEN 'Excellent'
             WHEN collection_rate >= 70 THEN 'Good'
             WHEN collection_rate >= 50 THEN 'Fair'
             ELSE 'Poor' END::TEXT,
        CASE WHEN collection_rate < 85 THEN 'Implement stricter collection policies'
             ELSE 'Maintain current collection strategies' END::TEXT
    
    UNION ALL
    
    SELECT 
        'Average Days to Collect'::TEXT,
        COALESCE(avg_days_to_collect, 0),
        0.0::NUMERIC, -- Benchmark: 0 days (on time)
        CASE WHEN COALESCE(avg_days_to_collect, 0) <= 0 THEN 'Excellent'
             WHEN COALESCE(avg_days_to_collect, 0) <= 7 THEN 'Good'
             WHEN COALESCE(avg_days_to_collect, 0) <= 30 THEN 'Fair'
             ELSE 'Poor' END::TEXT,
        CASE WHEN COALESCE(avg_days_to_collect, 0) > 7 THEN 'Implement early payment incentives'
             ELSE 'Continue current payment policies' END::TEXT
    
    UNION ALL
    
    SELECT 
        'Overdue Percentage'::TEXT,
        overdue_percentage,
        15.0::NUMERIC, -- Benchmark: 15%
        CASE WHEN overdue_percentage <= 15 THEN 'Excellent'
             WHEN overdue_percentage <= 30 THEN 'Good'
             WHEN overdue_percentage <= 50 THEN 'Fair'
             ELSE 'Poor' END::TEXT,
        CASE WHEN overdue_percentage > 15 THEN 'Implement stricter follow-up procedures'
             ELSE 'Maintain current follow-up processes' END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. GRANT PERMISSIONS
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
GRANT EXECUTE ON FUNCTION predict_payment_collection TO authenticated;
GRANT EXECUTE ON FUNCTION assess_payment_risk TO authenticated;
GRANT EXECUTE ON FUNCTION project_cash_flow TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_student_payment_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_collection_efficiency TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_financial_views TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_financial_view TO authenticated;

-- ============================================================================
-- 8. DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON FUNCTION predict_payment_collection IS 'Predicts future payment collection based on historical data and seasonal factors';
COMMENT ON FUNCTION assess_payment_risk IS 'Assesses payment risk for students or classes with recommendations';
COMMENT ON FUNCTION project_cash_flow IS 'Projects cash flow for future months based on historical patterns';
COMMENT ON FUNCTION analyze_student_payment_patterns IS 'Analyzes individual student payment patterns and behaviors';
COMMENT ON FUNCTION analyze_collection_efficiency IS 'Analyzes overall collection efficiency with benchmarks and recommendations';
COMMENT ON MATERIALIZED VIEW daily_collection_summary_mv IS 'Daily collection summary for quick dashboard access';
COMMENT ON MATERIALIZED VIEW monthly_financial_summary_mv IS 'Monthly financial summary with collection rates';
COMMENT ON MATERIALIZED VIEW class_performance_summary_mv IS 'Class performance summary with collection metrics';
COMMENT ON MATERIALIZED VIEW student_risk_assessment_mv IS 'Student risk assessment for quick risk evaluation';

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================

SELECT 'Enhanced Bursar Reports Part 2 Setup Complete' as status;
