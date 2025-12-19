-- Verify if Construction Process and Building Practice has marks for BC 1

-- First, get the subject ID for Construction Process and Building Practice
SELECT 
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code
FROM subjects s
WHERE s.name ILIKE '%Construction%Process%Building%Practice%'
   OR s.code ILIKE '%CPB%';

-- Get the class ID for BC 1
SELECT 
    c.id as class_id,
    c.name as class_name
FROM classes c
WHERE c.name ILIKE '%BC%1%' OR c.name = 'BC 1';

-- Check if the subject is assigned to BC 1
SELECT 
    cs.id,
    c.name as class_name,
    s.name as subject_name,
    s.code as subject_code
FROM class_subjects cs
JOIN classes c ON cs.class_id = c.id
JOIN subjects s ON cs.subject_id = s.id
WHERE c.name ILIKE '%BC%1%'
  AND (s.name ILIKE '%Construction%Process%Building%Practice%' OR s.code ILIKE '%CPB%');

-- Check for marks in this subject for BC 1 students
SELECT 
    COUNT(DISTINCT g.id) as total_marks_count,
    COUNT(DISTINCT g.student_id) as students_with_marks,
    aseq.name as sequence_name,
    s.name as subject_name,
    c.name as class_name
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
JOIN academic_sequences aseq ON a.sequence_id = aseq.id
JOIN subjects subj ON a.subject_id = subj.id
JOIN students st ON g.student_id = st.id
JOIN classes c ON st.class_id = c.id
WHERE c.name ILIKE '%BC%1%'
  AND (subj.name ILIKE '%Construction%Process%Building%Practice%' OR subj.code ILIKE '%CPB%')
GROUP BY aseq.name, subj.name, c.name
ORDER BY aseq.name;

-- Get detailed marks breakdown
SELECT 
    st.registration_number,
    st.first_name || ' ' || st.last_name as student_name,
    subj.name as subject_name,
    aseq.name as sequence_name,
    a.name as assessment_name,
    g.score,
    a.max_score
FROM grades g
JOIN assessments a ON g.assessment_id = a.id
JOIN academic_sequences aseq ON a.sequence_id = aseq.id
JOIN subjects subj ON a.subject_id = subj.id
JOIN students st ON g.student_id = st.id
JOIN classes c ON st.class_id = c.id
WHERE c.name ILIKE '%BC%1%'
  AND (subj.name ILIKE '%Construction%Process%Building%Practice%' OR subj.code ILIKE '%CPB%')
ORDER BY st.registration_number, aseq.name, a.name;
