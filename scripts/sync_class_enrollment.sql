-- Sync Class Enrollment Data
-- This script recalculates enrollment counts by counting actual students assigned to each class
-- and ensures that current_enrollment and student_count columns are accurate

-- Step 1: Update enrollment counts based on actual student assignments
-- Count students where their class column matches the class ID
UPDATE public.classes c
SET 
  current_enrollment = COALESCE((
    SELECT COUNT(*)
    FROM public.students s
    WHERE s.class = c.id::TEXT
  ), 0),
  student_count = COALESCE((
    SELECT COUNT(*)
    FROM public.students s
    WHERE s.class = c.id::TEXT
  ), 0),
  updated_at = NOW()
WHERE c.id IS NOT NULL;

-- Step 2: Display summary of changes
DO $$
DECLARE
  total_classes INTEGER;
  classes_with_students INTEGER;
  total_students_assigned INTEGER;
BEGIN
  -- Count total classes
  SELECT COUNT(*) INTO total_classes FROM public.classes;
  
  -- Count classes that have students
  SELECT COUNT(*) INTO classes_with_students 
  FROM public.classes 
  WHERE current_enrollment > 0;
  
  -- Count total students assigned to classes
  SELECT SUM(current_enrollment) INTO total_students_assigned 
  FROM public.classes;
  
  -- Display summary
  RAISE NOTICE '=== Class Enrollment Sync Summary ===';
  RAISE NOTICE 'Total classes: %', total_classes;
  RAISE NOTICE 'Classes with students: %', classes_with_students;
  RAISE NOTICE 'Total students assigned: %', COALESCE(total_students_assigned, 0);
  RAISE NOTICE '====================================';
END $$;

-- Step 3: Identify classes with missing teacher assignments
DO $$
DECLARE
  classes_without_teacher INTEGER;
BEGIN
  SELECT COUNT(*) INTO classes_without_teacher
  FROM public.classes
  WHERE class_teacher_id IS NULL AND status = 'active';
  
  IF classes_without_teacher > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: % active class(es) do not have a teacher assigned!', classes_without_teacher;
    RAISE NOTICE 'These classes will show "Not Assigned" in the Class Management table.';
    RAISE NOTICE '';
    
    -- List the classes without teachers
    RAISE NOTICE 'Classes without assigned teachers:';
    FOR rec IN 
      SELECT 
        COALESCE(class_name, name) as class_name,
        COALESCE(class_level, level) as class_level
      FROM public.classes
      WHERE class_teacher_id IS NULL AND status = 'active'
      ORDER BY class_name
    LOOP
      RAISE NOTICE '  - % (Level: %)', rec.class_name, rec.class_level;
    END LOOP;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE 'All active classes have assigned teachers.';
  END IF;
END $$;

-- Step 4: Verify subject assignments
DO $$
DECLARE
  classes_without_subjects INTEGER;
BEGIN
  SELECT COUNT(*) INTO classes_without_subjects
  FROM public.classes c
  WHERE status = 'active'
  AND NOT EXISTS (
    SELECT 1 
    FROM public.class_subjects cs 
    WHERE cs.class_id = c.id
  );
  
  IF classes_without_subjects > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: % active class(es) do not have subjects assigned!', classes_without_subjects;
    RAISE NOTICE 'These classes will show "0 subjects" in the Class Management table.';
    RAISE NOTICE '';
    
    -- List the classes without subjects
    RAISE NOTICE 'Classes without assigned subjects:';
    FOR rec IN 
      SELECT 
        COALESCE(c.class_name, c.name) as class_name,
        COALESCE(c.class_level, c.level) as class_level
      FROM public.classes c
      WHERE c.status = 'active'
      AND NOT EXISTS (
        SELECT 1 
        FROM public.class_subjects cs 
        WHERE cs.class_id = c.id
      )
      ORDER BY c.class_name
    LOOP
      RAISE NOTICE '  - % (Level: %)', rec.class_name, rec.class_level;
    END LOOP;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE 'All active classes have assigned subjects.';
  END IF;
END $$;

RAISE NOTICE '';
RAISE NOTICE 'Enrollment sync completed successfully!';
RAISE NOTICE 'Please refresh the Class Management page to see updated data.';
