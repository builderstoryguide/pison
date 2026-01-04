const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findMarksOrigin() {
  console.log('=== Tracing Marks Origin ===\n');

  // 1. Find the subjects
  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name')
    .or('name.ilike.%Resource%,name.ilike.%Computer%');
  
  if (subjectError) {
    console.error('Error fetching subjects:', subjectError);
    return;
  }

  if (!subjects || subjects.length === 0) {
    console.log('❌ Subjects not found');
    return;
  }

  console.log('Found subjects:', subjects.map(s => s.name));

  for (const subject of subjects) {
    console.log(`\nChecking ${subject.name}...`);
    
    // Get assessments
    const { data: assessments, error: asmError } = await supabase
      .from('assessments')
      .select('id, name')
      .eq('subject_id', subject.id);

    if (asmError) {
      console.error('  Error fetching assessments:', asmError);
      continue;
    }
    if (asmError) {
      console.error('  Error fetching assessments:', asmError);
      continue;
    }
    if (!assessments || assessments.length === 0) {
      console.log('  No assessments found.');
      continue;
    }    const assessmentIds = assessments.map(a => a.id);

    // Get a sample grade
    const { data: grades, error: gradeError } = await supabase
      .from('grades')
      .select('student_id')
      .in('assessment_id', assessmentIds)
      .limit(1); // Just need one to trace

    if (gradeError) {
      console.error('  Error fetching grades:', gradeError);
      continue;
    }
    if (!grades || grades.length === 0) {
      console.log('  No grades found for ANY student.');
      continue;
    }
    console.log('  ✓ Found at least one grade!');
    const studentId = grades[0].student_id;

    // Get student and class
    const { data: student, error: stError } = await supabase
      .from('students')
      .select('first_name, last_name, class_id, classes(name)')
      .eq('id', studentId)
      .single();

    if (stError) {
      console.error('  Error fetching student:', stError);
    } else {
      console.log(`  Grade belongs to student: ${student.first_name} ${student.last_name}`);
      console.log(`  Student is in class: ${student.classes ? student.classes.name : 'Unassigned'} (ID: ${student.class_id})`);
    }
  }
}

findMarksOrigin().catch(console.error);
