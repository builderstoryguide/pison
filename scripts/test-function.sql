-- =====================================================
-- Test Script for create_assessment Function
-- =====================================================

-- Test 1: Create assessment with minimal required parameters
SELECT 'Test 1: Minimal parameters' as test_description;
SELECT create_assessment(
    'Mathematics Quiz'::VARCHAR(255),
    'quiz'::VARCHAR(20),
    'Mathematics'::VARCHAR(100),
    'class-1'::VARCHAR(255),
    'teacher-1'::VARCHAR(255),
    20.00::DECIMAL(5,2),
    CURRENT_DATE::DATE
) as new_assessment_id;

-- Test 2: Create assessment with all parameters
SELECT 'Test 2: All parameters' as test_description;
SELECT create_assessment(
    'Physics Midterm'::VARCHAR(255),
    'midterm'::VARCHAR(20),
    'Physics'::VARCHAR(100),
    'class-2'::VARCHAR(255),
    'teacher-1'::VARCHAR(255),
    50.00::DECIMAL(5,2),
    CURRENT_DATE::DATE,
    'Comprehensive physics assessment'::TEXT,
    60.00::DECIMAL(5,2),
    100.00::DECIMAL(5,2),
    (CURRENT_DATE + INTERVAL '7 days')::DATE,
    'draft'::VARCHAR(20)
) as new_assessment_id;

-- Test 3: Verify the assessments were created
SELECT 'Test 3: Verify assessments' as test_description;
SELECT 
    assessment_id,
    title,
    type,
    subject,
    total_marks,
    status,
    created_at
FROM assessments 
ORDER BY created_at DESC 
LIMIT 5;

-- Test 4: Test create_grade function
SELECT 'Test 4: Create grade' as test_description;
SELECT create_grade(
    (SELECT id FROM assessments WHERE title = 'Mathematics Quiz' LIMIT 1)::UUID,
    'student-1'::VARCHAR(255),
    'teacher-1'::VARCHAR(255),
    18.00::DECIMAL(5,2),
    'Excellent work!'::TEXT
) as new_grade_id;

-- Test 5: Verify the grade was created
SELECT 'Test 5: Verify grade' as test_description;
SELECT 
    g.grade_id,
    g.student_id,
    g.marks_obtained,
    g.percentage,
    g.grade_letter,
    g.grade_point,
    a.title as assessment_title
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
ORDER BY g.created_at DESC 
LIMIT 3;

-- Test 6: Test get_assessments_by_teacher function
SELECT 'Test 6: Get assessments by teacher' as test_description;
SELECT * FROM get_assessments_by_teacher('teacher-1'::VARCHAR(255));

-- Test 7: Test get_grades_by_assessment function
SELECT 'Test 7: Get grades by assessment' as test_description;
SELECT * FROM get_grades_by_assessment(
    (SELECT id FROM assessments WHERE title = 'Mathematics Quiz' LIMIT 1)::UUID
);

-- Test 8: Test views
SELECT 'Test 8: Test assessment_details_view' as test_description;
SELECT 
    assessment_id,
    title,
    total_grades,
    average_percentage,
    pass_count,
    fail_count
FROM assessment_details_view 
LIMIT 3;

SELECT 'Test 9: Test teacher_assessments_view' as test_description;
SELECT 
    assessment_id,
    title,
    graded_count,
    average_percentage
FROM teacher_assessments_view 
WHERE teacher_id = 'teacher-1'
LIMIT 3;

-- Test 10: Summary
SELECT 'Test 10: Summary' as test_description;
SELECT 
    'assessments' as table_name, COUNT(*) as record_count 
FROM assessments
UNION ALL
SELECT 
    'grades' as table_name, COUNT(*) as record_count 
FROM grades;
