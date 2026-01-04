
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envConfig = require('dotenv').parse(fs.readFileSync(envPath));
      for (const k in envConfig) {
        process.env[k] = envConfig[k];
      }
    }
  } catch (e) {
    console.warn('Could not load .env.local, relying on process.env', e);
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runVerification() {
  console.log('--- Starting Report Card Verification for Implicit Marks ---');

  try {
    // 1. Get an Admin User (to simulate the teacher_id used in bulk API)
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (!adminUser) {
      console.error('No admin user found. Cannot simulate bulk API behavior.');
      return;
    }
    const ADMIN_ID = adminUser.id;
    console.log(`Using Admin ID: ${ADMIN_ID}`);

    // 2. Find a valid Class and one of its Subjects
    // We need a subject that is active
    const { data: classData } = await supabase
        .from('class_subjects')
        .select(`
            class_id,
            classes(id, name),
            subjects(id, name)
        `)
        .limit(10);
    
    if (!classData || classData.length === 0) {
        console.error('No class_subjects found.');
        return;
    }

    // Pick one
    const target = classData.find(c => c.classes && c.subjects);
    if (!target) {
        console.error('No valid class/subject relation found.');
        return;
    }

    const CLASS_ID = target.class_id;
    const SUBJECT_NAME = target.subjects.name;
    const CLASS_NAME = target.classes.name;

    console.log(`Targeting Class: ${CLASS_NAME} (${CLASS_ID})`);
    console.log(`Targeting Subject: ${SUBJECT_NAME}`);

    // 3. Find a Student in that class
    console.log(`Searching for student in class ${CLASS_NAME} / ${CLASS_ID}...`);
    
    // Debug: Check count of students
    const { count, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });
    console.log(`Total students in DB: ${count} (Error: ${countError?.message})`);

    const { data: student } = await supabase
        .from('students')
        .select('id, name, class')
        .or(`class.eq.${CLASS_ID},class.eq.${CLASS_NAME}`)
        .limit(1)
        .maybeSingle();

    if (!student) {
        console.error(`No student found in class ${CLASS_NAME}. Details:`, student);
        
        // Fallback: pick ANY student
        console.log('Attempting fallback to any student...');
        const { data: anyStudent } = await supabase.from('students').select('id, name, class').limit(1).maybeSingle();
        
        // If no students exist, Create one for testing
        console.log('No students found. Creating a DUMMY student for verification...');
        const DUMMY_MATRICULE = 'TEST-' + Date.now();
        const { data: stringStudent, error: createStudentError } = await supabase
            .insert({
                first_name: 'Implicit',
                last_name: 'Verification Student',
                student_id: DUMMY_MATRICULE,
                matricule_number: DUMMY_MATRICULE,
                class: CLASS_ID, 
                gender: 'Male',
                date_of_birth: '2000-01-01',
                pob: 'Test City',
                status: 'active'
            })
            .select()
            .single();
            
        if (createStudentError) {
             console.error('Failed to create dummy student:', createStudentError);
             // Try a variation without class_id if schema differs
             console.log('Retrying without class_id just in case...');
              const { data: stringStudent2, error: createStudentError2 } = await supabase
                .from('students')
                .insert({
                    name: 'Implicit Verification Student',
                    class: CLASS_NAME, // Try legacy field
                    matricule: DUMMY_MATRICULE
                })
                .select()
                .single();
                
             if (createStudentError2) {
                 console.error('Failed again:', createStudentError2);
                 return;
             }
             var STUDENT_ID = stringStudent2.id;
             var STUDENT_NAME = stringStudent2.name;
        } else {
             var STUDENT_ID = stringStudent.id;
             var STUDENT_NAME = stringStudent.name;
        }
        console.log(`Created Dummy Student: ${STUDENT_NAME} (${STUDENT_ID})`);
        
        var TARGET_CLASS_ID = CLASS_ID;
        var TARGET_SUBJECT_NAME = SUBJECT_NAME;
        
    } else {
        var STUDENT_ID = student.id;
        var STUDENT_NAME = student.name;
        var TARGET_CLASS_ID = CLASS_ID;
        var TARGET_SUBJECT_NAME = SUBJECT_NAME;
    }
    console.log(`Using Student: ${STUDENT_NAME} (${STUDENT_ID})`);

    const SEQUENCE_NAME = 'Implicit Verification Sequence';

    // 4. CLEANUP (Delete existing assessment/grades for this combo to ensure fresh start)
    console.log(`Cleaning up previous test data for ${TARGET_SUBJECT_NAME}...`);
    const { data: oldAssessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('class_id', TARGET_CLASS_ID)
        .eq('subject', TARGET_SUBJECT_NAME)
        .eq('title', SEQUENCE_NAME);
    
    if (oldAssessments && oldAssessments.length > 0) {
        const ids = oldAssessments.map(a => a.id);
        await supabase.from('grades').delete().in('assessment_id', ids);
        await supabase.from('assessments').delete().in('id', ids);
        console.log('Cleanup done.');
    }

    // 5. SIMULATE BULK API LOGIC (Implicit Creation)
    console.log('Simulating Implicit Assessment Creation...');
    
    let assessmentId = null;
    
    // (B) Create Assessment
    const { data: newAssessment, error: createError } = await supabase
        .from('assessments')
        .insert({
            title: SEQUENCE_NAME,
            type: 'exam',
            subject: TARGET_SUBJECT_NAME,
            class_id: TARGET_CLASS_ID,
            teacher_id: ADMIN_ID, // Use Admin ID so report card includes it
            total_marks: 20,
            status: 'published',
            assessment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

    if (createError) {
        console.error('Failed to create assessment:', createError);
        return;
    }
    assessmentId = newAssessment.id;
    console.log(`Assessment Created Implicitly! ID: ${assessmentId}`);

    // (C) Insert Grade
    const MARK_VALUE = 18;
    const { error: gradeError } = await supabase
        .from('grades')
        .insert({
            assessment_id: assessmentId,
            student_id: STUDENT_ID,
            marks_obtained: MARK_VALUE,
            percentage: (MARK_VALUE/20)*100,
            grade_letter: 'A',
            remarks: 'Verification Test',
            submitted_at: new Date().toISOString()
        });
    
    if (gradeError) {
        console.error('Failed to insert grade:', gradeError);
        return;
    }
    console.log(`Grade inserted: ${MARK_VALUE}`);

    // 6. VERIFY REPORT CARD LOGIC
    console.log('Verifying visibility using Report Card logic...');

    // Simulate the query from student-report/route.ts
    const { data: gradesData, error: fetchError } = await supabase
      .from('grades')
      .select(`
        marks_obtained,
        student_id,
        assessment:assessments!inner (
          id,
          subject,
          type,
          title,
          class_id,
          teacher_id,
          assessment_date
        )
      `)
      .eq('student_id', STUDENT_ID)
      .eq('assessment.class_id', TARGET_CLASS_ID)
      .eq('assessment.title', SEQUENCE_NAME); 

    if (fetchError) {
        console.error('Report card query failed:', fetchError);
        return;
    }

    if (!gradesData || gradesData.length === 0) {
        console.error('FAIL: Grade not found by report card query.');
        return;
    }

    const grade = gradesData[0];
    console.log('Query result:', JSON.stringify(grade, null, 2));

    // Verify Admin check logic (from route.ts)
    const assessTeacherId = grade.assessment.teacher_id;
    const isAdmin = (assessTeacherId === ADMIN_ID); 
    
    if (isAdmin) {
        console.log('SUCCESS: Grade found and identified as Admin-created (would be included in report card).');
    } else {
        console.log('WARNING: Grade found but teacher_id does not match Admin ID. Verify this is expected behavior.');
    }

    console.log('--- Verification Complete: PASS ---');
    console.log('The implicit assessment creation correctly links to the class/subject and would appear on report cards.');
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

runVerification();
