-- Function to calculate total paid fees for a student
CREATE OR REPLACE FUNCTION calculate_student_paid_fees(student_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
    total_paid DECIMAL;
BEGIN
    SELECT COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM payments
    WHERE student_id = student_uuid
    AND status = 'completed'; -- Only count completed payments
    
    RETURN total_paid;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update student record
CREATE OR REPLACE FUNCTION update_student_fees_on_payment_change()
RETURNS TRIGGER AS $$
DECLARE
    target_student_id UUID;
    new_total DECIMAL;
BEGIN
    -- Determine which student to update
    IF (TG_OP = 'DELETE') THEN
        target_student_id := OLD.student_id;
    ELSE
        target_student_id := NEW.student_id;
    END IF;

    -- Calculate new total
    new_total := calculate_student_paid_fees(target_student_id);

    -- Update student record
    UPDATE students
    SET 
        paid_fees = new_total,
        -- Update fees_status based on total_fees and new paid_fees
        fees_status = CASE 
            WHEN new_total >= total_fees THEN 'paid'
            WHEN new_total > 0 THEN 'partial'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = target_student_id;

    RETURN NULL; -- Return value ignored for AFTER triggers
END;
$$ LANGUAGE plpgsql;

-- Create Trigger
DROP TRIGGER IF EXISTS trigger_update_student_fees ON payments;

CREATE TRIGGER trigger_update_student_fees
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_student_fees_on_payment_change();

-- One-time sync for existing data
DO $$
DECLARE
    s RECORD;
    calculated_fees DECIMAL;
BEGIN
    FOR s IN SELECT id FROM students LOOP
        calculated_fees := calculate_student_paid_fees(s.id);
        
        UPDATE students
        SET 
            paid_fees = calculated_fees,
            fees_status = CASE 
                WHEN calculated_fees >= COALESCE(total_fees, 0) AND COALESCE(total_fees, 0) > 0 THEN 'paid'
                WHEN calculated_fees > 0 THEN 'partial'
                ELSE 'pending'
            END
        WHERE id = s.id;
    END LOOP;
END;
$$;
