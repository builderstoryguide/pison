-- Bursar Reports Database Setup
-- This script creates views and functions for generating financial reports

-- 1. Collection Report View
-- Provides monthly fee collection summary with payment method breakdown
CREATE OR REPLACE VIEW collection_report_view AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    EXTRACT(YEAR FROM p.payment_date) as year,
    EXTRACT(MONTH FROM p.payment_date) as month_number,
    TO_CHAR(p.payment_date, 'Month YYYY') as month_name,
    pm.name as payment_method,
    pm.code as payment_method_code,
    COUNT(p.id) as total_transactions,
    SUM(p.amount) as total_amount,
    AVG(p.amount) as average_amount,
    COUNT(DISTINCT p.student_id) as unique_students,
    COUNT(DISTINCT p.collected_by) as unique_collectors
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
WHERE p.status = 'completed'
GROUP BY 
    DATE_TRUNC('month', p.payment_date),
    EXTRACT(YEAR FROM p.payment_date),
    EXTRACT(MONTH FROM p.payment_date),
    TO_CHAR(p.payment_date, 'Month YYYY'),
    pm.name,
    pm.code
ORDER BY month DESC, total_amount DESC;

-- 2. Outstanding Balances View
-- Shows students with outstanding fee balances
CREATE OR REPLACE VIEW outstanding_balances_view AS
SELECT 
    s.id as student_id,
    s.first_name,
    s.last_name,
    s.student_id as student_number,
    c.class_name as class_name,
    c.subsystem,
    c.stream as branch,
    sf.id as student_fee_id,
    fs.name as fee_structure_name,
    fs.academic_year,
    fs.term,
    fs.due_date,
    sf.total_amount,
    sf.paid_amount,
    sf.balance_amount,
    sf.status,
    sf.last_payment_date,
    CASE 
        WHEN sf.due_date < CURRENT_DATE AND sf.balance_amount > 0 THEN 'overdue'
        WHEN sf.balance_amount > 0 THEN 'outstanding'
        ELSE 'paid'
    END as payment_status,
    CASE 
        WHEN sf.due_date < CURRENT_DATE AND sf.balance_amount > 0 
        THEN CURRENT_DATE - sf.due_date 
        ELSE 0 
    END as days_overdue
FROM student_fees sf
JOIN students s ON sf.student_id = s.id
JOIN classes c ON s.class = c.class_name
JOIN fee_structures fs ON sf.fee_structure_id = fs.id
WHERE sf.balance_amount > 0
ORDER BY 
    CASE WHEN sf.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
    sf.due_date ASC,
    sf.balance_amount DESC;

-- 3. Revenue Trends View
-- Shows revenue trends by period, class, and fee category
CREATE OR REPLACE VIEW revenue_trends_view AS
SELECT 
    DATE_TRUNC('month', p.payment_date) as month,
    EXTRACT(YEAR FROM p.payment_date) as year,
    EXTRACT(MONTH FROM p.payment_date) as month_number,
    TO_CHAR(p.payment_date, 'Month YYYY') as month_name,
    c.class_name as class_name,
    c.subsystem,
    c.stream as branch,
    fc.name as fee_category,
    fc.code as fee_category_code,
    COUNT(p.id) as total_payments,
    SUM(p.amount) as total_revenue,
    AVG(p.amount) as average_payment,
    COUNT(DISTINCT p.student_id) as unique_students
FROM payments p
JOIN student_fees sf ON p.student_fee_id = sf.id
JOIN fee_structures fs ON sf.fee_structure_id = fs.id
JOIN classes c ON fs.class_id = c.id
JOIN fee_structure_items fsi ON fs.id = fsi.fee_structure_id
JOIN fee_categories fc ON fsi.fee_category_id = fc.id
WHERE p.status = 'completed'
GROUP BY 
    DATE_TRUNC('month', p.payment_date),
    EXTRACT(YEAR FROM p.payment_date),
    EXTRACT(MONTH FROM p.payment_date),
    TO_CHAR(p.payment_date, 'Month YYYY'),
    c.name,
    c.subsystem,
    c.branch,
    fc.name,
    fc.code
ORDER BY month DESC, total_revenue DESC;

-- 4. Payment Summary View
-- Provides overall payment statistics
CREATE OR REPLACE VIEW payment_summary_view AS
SELECT 
    COUNT(*) as total_payments,
    COUNT(DISTINCT student_id) as total_students,
    COUNT(DISTINCT collected_by) as total_collectors,
    SUM(amount) as total_collected,
    AVG(amount) as average_payment,
    MIN(payment_date) as first_payment_date,
    MAX(payment_date) as last_payment_date,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_payments,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
    SUM(CASE WHEN status = 'cancelled' THEN amount ELSE 0 END) as cancelled_amount
FROM payments;

-- 5. Fee Structure Performance View
-- Shows how well each fee structure is performing
CREATE OR REPLACE VIEW fee_structure_performance_view AS
SELECT 
    fs.id as fee_structure_id,
    fs.name as fee_structure_name,
    c.class_name as class_name,
    c.subsystem,
    c.stream as branch,
    fs.academic_year,
    fs.term,
    fs.due_date,
    COUNT(sf.id) as total_assignments,
    COUNT(CASE WHEN sf.status = 'paid' THEN 1 END) as fully_paid,
    COUNT(CASE WHEN sf.status = 'partial' THEN 1 END) as partially_paid,
    COUNT(CASE WHEN sf.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN sf.status = 'overdue' THEN 1 END) as overdue,
    SUM(sf.total_amount) as expected_total,
    SUM(sf.paid_amount) as collected_total,
    SUM(sf.balance_amount) as outstanding_total,
    CASE 
        WHEN SUM(sf.total_amount) > 0 
        THEN (SUM(sf.paid_amount) / SUM(sf.total_amount)) * 100 
        ELSE 0 
    END as collection_rate
FROM fee_structures fs
JOIN classes c ON fs.class_id = c.id
LEFT JOIN student_fees sf ON fs.id = sf.fee_structure_id
GROUP BY 
    fs.id,
    fs.name,
    c.name,
    c.subsystem,
    c.branch,
    fs.academic_year,
    fs.term,
    fs.due_date
ORDER BY collection_rate DESC;

-- 6. Function to generate collection report for a specific period
CREATE OR REPLACE FUNCTION generate_collection_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    payment_method_id UUID DEFAULT NULL
)
RETURNS TABLE (
    month_name TEXT,
    payment_method TEXT,
    total_transactions BIGINT,
    total_amount DECIMAL,
    average_amount DECIMAL,
    unique_students BIGINT,
    unique_collectors BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        crv.month_name,
        crv.payment_method,
        crv.total_transactions,
        crv.total_amount,
        crv.average_amount,
        crv.unique_students,
        crv.unique_collectors
    FROM collection_report_view crv
    WHERE 
        (start_date IS NULL OR crv.month >= start_date)
        AND (end_date IS NULL OR crv.month <= end_date)
        AND (payment_method_id IS NULL OR crv.payment_method_code = payment_method_id::TEXT)
    ORDER BY crv.month DESC, crv.total_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 7. Function to generate outstanding balances report
CREATE OR REPLACE FUNCTION generate_outstanding_report(
    class_id UUID DEFAULT NULL,
    academic_year TEXT DEFAULT NULL,
    term TEXT DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    student_name TEXT,
    student_number TEXT,
    class_name TEXT,
    fee_structure_name TEXT,
    academic_year TEXT,
    term TEXT,
    due_date DATE,
    total_amount DECIMAL,
    paid_amount DECIMAL,
    balance_amount DECIMAL,
    payment_status TEXT,
    days_overdue INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CONCAT(obv.first_name, ' ', obv.last_name) as student_name,
        obv.student_number,
        obv.class_name,
        obv.fee_structure_name,
        obv.academic_year,
        obv.term,
        obv.due_date,
        obv.total_amount,
        obv.paid_amount,
        obv.balance_amount,
        obv.payment_status,
        obv.days_overdue
    FROM outstanding_balances_view obv
    WHERE 
        (class_id IS NULL OR obv.class_name = (SELECT name FROM classes WHERE id = class_id))
        AND (academic_year IS NULL OR obv.academic_year = academic_year)
        AND (term IS NULL OR obv.term = term)
        AND (status_filter IS NULL OR obv.payment_status = status_filter)
    ORDER BY obv.days_overdue DESC, obv.balance_amount DESC;
END;
$$ LANGUAGE plpgsql;

-- 8. Function to generate revenue trends report
CREATE OR REPLACE FUNCTION generate_revenue_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    class_id UUID DEFAULT NULL,
    fee_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
    month_name TEXT,
    class_name TEXT,
    fee_category TEXT,
    total_payments BIGINT,
    total_revenue DECIMAL,
    average_payment DECIMAL,
    unique_students BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rtv.month_name,
        rtv.class_name,
        rtv.fee_category,
        rtv.total_payments,
        rtv.total_revenue,
        rtv.average_payment,
        rtv.unique_students
    FROM revenue_trends_view rtv
    WHERE 
        (start_date IS NULL OR rtv.month >= start_date)
        AND (end_date IS NULL OR rtv.month <= end_date)
        AND (class_id IS NULL OR rtv.class_name = (SELECT name FROM classes WHERE id = class_id))
        AND (fee_category_id IS NULL OR rtv.fee_category_code = fee_category_id::TEXT)
    ORDER BY rtv.month DESC, rtv.total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- 9. Create indexes for better report performance
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_status ON student_fees(status);
CREATE INDEX IF NOT EXISTS idx_student_fees_due_date ON student_fees(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_structures_academic_year ON fee_structures(academic_year);
CREATE INDEX IF NOT EXISTS idx_fee_structures_term ON fee_structures(term);

-- 10. Create a materialized view for frequently accessed summary data
CREATE MATERIALIZED VIEW IF NOT EXISTS financial_summary_mv AS
SELECT 
    (SELECT COUNT(*) FROM students WHERE is_active = true) as total_students,
    (SELECT COUNT(*) FROM fee_structures WHERE is_active = true) as total_fee_structures,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed') as total_completed_payments,
    (SELECT SUM(amount) FROM payments WHERE status = 'completed') as total_collected,
    (SELECT SUM(total_amount) FROM student_fees) as total_expected,
    (SELECT SUM(balance_amount) FROM student_fees WHERE balance_amount > 0) as total_outstanding,
    (SELECT COUNT(*) FROM student_fees WHERE balance_amount > 0 AND due_date < CURRENT_DATE) as overdue_count
FROM (SELECT 1) as dummy;

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_financial_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW financial_summary_mv;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create a trigger to refresh the materialized view when payments are updated
CREATE OR REPLACE FUNCTION trigger_refresh_financial_summary()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_financial_summary();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_financial_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_financial_summary();

-- Comments for documentation
COMMENT ON VIEW collection_report_view IS 'Monthly fee collection summary with payment method breakdown';
COMMENT ON VIEW outstanding_balances_view IS 'Students with outstanding fee balances and overdue information';
COMMENT ON VIEW revenue_trends_view IS 'Revenue trends by period, class, and fee category';
COMMENT ON VIEW payment_summary_view IS 'Overall payment statistics and summary';
COMMENT ON VIEW fee_structure_performance_view IS 'Fee structure performance metrics and collection rates';
COMMENT ON MATERIALIZED VIEW financial_summary_mv IS 'Materialized view for frequently accessed financial summary data';

