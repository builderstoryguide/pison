-- Fix subjects for AC 1 and AC 2

DO $$
DECLARE
    v_ac1_id UUID;
    v_ac2_id UUID;
    v_subject_names TEXT[] := ARRAY[
        'French Language',
        'English Language',
        'Mathematics',
        'Computer Aided Management',
        'Introduction to Marketing',
        'Accounting',
        'Office Practice',
        'Citizenship',
        'Physical Education',
        'Manual Labour'
    ];
    v_subject_ids UUID[];
    v_class_id UUID;
    v_subject_name TEXT;
    v_subject_id UUID;
BEGIN
    -- 1. Get Class IDs
    SELECT id INTO v_ac1_id FROM classes WHERE name = 'AC 1' OR class_name = 'AC 1' LIMIT 1;
    SELECT id INTO v_ac2_id FROM classes WHERE name = 'AC 2' OR class_name = 'AC 2' LIMIT 1;

    IF v_ac1_id IS NULL THEN
        RAISE NOTICE 'Class AC 1 not found';
    ELSE
        RAISE NOTICE 'Found AC 1: %', v_ac1_id;
    END IF;

    IF v_ac2_id IS NULL THEN
        RAISE NOTICE 'Class AC 2 not found';
    ELSE
         RAISE NOTICE 'Found AC 2: %', v_ac2_id;
    END IF;

    -- 2. Validate Subject IDs exist and collect them
    FOREACH v_subject_name IN ARRAY v_subject_names
    LOOP
        SELECT id INTO v_subject_id FROM subjects WHERE name ILIKE v_subject_name LIMIT 1;
        IF v_subject_id IS NULL THEN
            RAISE NOTICE 'WARNING: Subject "%" not found in database!', v_subject_name;
        ELSE
             v_subject_ids := array_append(v_subject_ids, v_subject_id);
        END IF;
    END LOOP;

    -- 3. Update AC 1
    IF v_ac1_id IS NOT NULL THEN
        -- Delete extras
        DELETE FROM class_subjects 
        WHERE class_id = v_ac1_id 
        AND subject_id NOT IN (SELECT unnest(v_subject_ids));
        
        RAISE NOTICE 'Deleted extra subjects for AC 1';

        -- Insert missing
        INSERT INTO class_subjects (class_id, subject_id, subject_name)
        SELECT v_ac1_id, s.id, s.name
        FROM subjects s
        WHERE s.id = ANY(v_subject_ids)
        AND NOT EXISTS (
            SELECT 1 FROM class_subjects cs 
            WHERE cs.class_id = v_ac1_id AND cs.subject_id = s.id
        );
        
        RAISE NOTICE 'Inserted missing subjects for AC 1';
    END IF;

    -- 4. Update AC 2
    IF v_ac2_id IS NOT NULL THEN
        -- Delete extras
        DELETE FROM class_subjects 
        WHERE class_id = v_ac2_id 
        AND subject_id NOT IN (SELECT unnest(v_subject_ids));
        
        RAISE NOTICE 'Deleted extra subjects for AC 2';

        -- Insert missing
        INSERT INTO class_subjects (class_id, subject_id, subject_name)
        SELECT v_ac2_id, s.id, s.name
        FROM subjects s
        WHERE s.id = ANY(v_subject_ids)
        AND NOT EXISTS (
            SELECT 1 FROM class_subjects cs 
            WHERE cs.class_id = v_ac2_id AND cs.subject_id = s.id
        );
        
        RAISE NOTICE 'Inserted missing subjects for AC 2';
    END IF;

END $$;
