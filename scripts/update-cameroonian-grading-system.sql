-- =====================================================
-- Cameroonian Grading System Update
-- =====================================================
-- This script updates the grading system to use Cameroonian standards:
-- - Averages calculated on a scale of 20
-- - Grade letters: A (16-20), B (14-15.99), C (12-13.99), D (10-11.99), E (8-9.99), F (0-7.99)

-- Update the calculate_grade_letter function to use Cameroonian standards
CREATE OR REPLACE FUNCTION calculate_grade_letter(percentage DECIMAL)
RETURNS VARCHAR(2) AS $$
DECLARE
    average_on_20 DECIMAL(4,2);
BEGIN
    -- Convert percentage to Cameroonian scale of 20
    average_on_20 := (percentage / 100) * 20;
    
    IF average_on_20 >= 16 THEN
        RETURN 'A'; -- 16-20: Excellent
    ELSIF average_on_20 >= 14 THEN
        RETURN 'B'; -- 14-15.99: Very Good
    ELSIF average_on_20 >= 12 THEN
        RETURN 'C'; -- 12-13.99: Good
    ELSIF average_on_20 >= 10 THEN
        RETURN 'D'; -- 10-11.99: Fair
    ELSIF average_on_20 >= 8 THEN
        RETURN 'E'; -- 8-9.99: Poor
    ELSE
        RETURN 'F'; -- 0-7.99: Very Poor
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Update the calculate_grade_point function to return average on 20 instead of GPA
CREATE OR REPLACE FUNCTION calculate_grade_point(grade_letter VARCHAR(2))
RETURNS DECIMAL(4,2) AS $$
DECLARE
    percentage DECIMAL(5,2);
BEGIN
    -- This function now calculates the average on 20 based on grade letter
    -- For now, we'll return the midpoint of each grade range
    CASE grade_letter
        WHEN 'A' THEN RETURN 18.00; -- Midpoint of 16-20
        WHEN 'B' THEN RETURN 15.00; -- Midpoint of 14-15.99
        WHEN 'C' THEN RETURN 13.00; -- Midpoint of 12-13.99
        WHEN 'D' THEN RETURN 11.00; -- Midpoint of 10-11.99
        WHEN 'E' THEN RETURN 9.00;  -- Midpoint of 8-9.99
        WHEN 'F' THEN RETURN 4.00;  -- Midpoint of 0-7.99
        ELSE RETURN 0.00;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create a new function to calculate average on 20 from percentage
CREATE OR REPLACE FUNCTION calculate_average_on_20(percentage DECIMAL)
RETURNS DECIMAL(4,2) AS $$
BEGIN
    -- Convert percentage to Cameroonian scale of 20
    RETURN ROUND((percentage / 100) * 20, 2);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get grade description
CREATE OR REPLACE FUNCTION get_grade_description(grade_letter VARCHAR(2))
RETURNS VARCHAR(50) AS $$
BEGIN
    CASE grade_letter
        WHEN 'A' THEN RETURN 'Excellent';
        WHEN 'B' THEN RETURN 'Very Good';
        WHEN 'C' THEN RETURN 'Good';
        WHEN 'D' THEN RETURN 'Fair';
        WHEN 'E' THEN RETURN 'Poor';
        WHEN 'F' THEN RETURN 'Very Poor';
        ELSE RETURN 'Unknown';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Update existing grades to use the new system
-- This will recalculate all existing grades using the new Cameroonian system
UPDATE grades 
SET 
    grade_letter = calculate_grade_letter(percentage),
    grade_point = calculate_average_on_20(percentage)
WHERE percentage IS NOT NULL;

-- Update assignment submissions to use the new system
UPDATE assignment_submissions 
SET 
    grade_letter = calculate_grade_letter(percentage),
    grade_point = calculate_average_on_20(percentage)
WHERE percentage IS NOT NULL;

-- Add comments to explain the new system
COMMENT ON FUNCTION calculate_grade_letter(DECIMAL) IS 'Calculates grade letter using Cameroonian grading system (scale of 20)';
COMMENT ON FUNCTION calculate_grade_point(VARCHAR(2)) IS 'Returns average on 20 scale based on grade letter';
COMMENT ON FUNCTION calculate_average_on_20(DECIMAL) IS 'Converts percentage to Cameroonian average on scale of 20';
COMMENT ON FUNCTION get_grade_description(VARCHAR(2)) IS 'Returns description for grade letter in Cameroonian system';

-- Create a view for grade statistics using the new system
CREATE OR REPLACE VIEW grade_statistics_view AS
SELECT 
    assessment_id,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_submissions,
    ROUND(AVG(CASE WHEN status = 'graded' THEN grade_point END), 2) as average_on_20,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'A' THEN 1 END) as grade_a_count,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'B' THEN 1 END) as grade_b_count,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'C' THEN 1 END) as grade_c_count,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'D' THEN 1 END) as grade_d_count,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'E' THEN 1 END) as grade_e_count,
    COUNT(CASE WHEN status = 'graded' AND grade_letter = 'F' THEN 1 END) as grade_f_count
FROM assignment_submissions
GROUP BY assessment_id;

-- Add comments to the view
COMMENT ON VIEW grade_statistics_view IS 'Provides grade statistics using Cameroonian grading system (scale of 20)';
