CREATE OR REPLACE FUNCTION fix_cam_assessments()
RETURNS void AS $$
BEGIN
    UPDATE assessments
    SET academic_year = '2024-2025', term = 1
    WHERE class_id = '3a508d31-a9de-48b9-996e-c70f0aaed8d9'
    AND subject ILIKE '%Computer Aided%'
    AND (title ILIKE '%First%' OR title ILIKE '%Second%');
    
    UPDATE assessments
    SET academic_year = '2024-2025', term = 2
    WHERE class_id = '3a508d31-a9de-48b9-996e-c70f0aaed8d9'
    AND subject ILIKE '%Computer Aided%'
    AND (title ILIKE '%Third%' OR title ILIKE '%Fourth%');
END;
$$ LANGUAGE plpgsql;
