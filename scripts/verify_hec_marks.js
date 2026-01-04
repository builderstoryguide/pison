const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyHECMarks() {
  console.log('=== Verifying Marks for HEC Class ===\n');

  // 1. Find the subjects
  console.log('1. Looking for subjects...');
  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or('name.ilike.%Resource Management%,name.ilike.%Computer Aided Management%');
  
  if (subjectError) {
    console.error('Error fetching subjects:', subjectError);
    return;
  }

  console.log('Found subjects:', subjects);

  if (!subjects || subjects.length === 0) {
    console.log('❌ Subjects not found in database');
    return;
  }

  // 2. Find HEC class
  console.log('2. Looking for HEC class...');
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', '%HEC%');

  if (classError) {
    console.error('Error fetching class:', classError);
    return;
  }

  console.log('Found classes:', classes);

  if (!classes || classes.length === 0) {
    console.log('❌ HEC class not found');
    return;
  }

  // 3. Process each class and subject
  for (const hecClass of classes) {
    console.log(`\n=== Verifying for Class: ${hecClass.name} (ID: ${hecClass.id}) ===`);

    for (const subject of subjects) {
      console.log(`\n  --- Verification for ${subject.name} (Code: ${subject.code}) ---`);

      // Check if subject is assigned to HEC
      // console.log(`  Checking if ${subject.name} is assigned to ${hecClass.name}...`);
      const { data: classSubjects, error: csError } = await supabase
        .from('class_subjects')
        .select('id')
        .eq('class_id', hecClass.id)
        .eq('subject_id', subject.id);

      if (csError) {
        console.error('  Error checking class subjects:', csError);
      } else if (!classSubjects || classSubjects.length === 0) {
        console.log(`  ❌ ${subject.name} is NOT assigned to ${hecClass.name}`);
      } else {
        console.log(`  ✓ ${subject.name} IS assigned to ${hecClass.name}`);
      }

      // Check for marks //
      
      // Get all students in HEC
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, student_id, first_name, last_name')
        .eq('class_id', hecClass.id);

      if (studentsError) {
        console.error('  Error fetching students:', studentsError);
        continue;
      }

      if (!students || students.length === 0) {
        console.log(`  ❌ No students found in ${hecClass.name}`);
        continue;
      }
      
      // Optimization: No need to log number of students for every subject if it's the same class, but it's fine for now.

      const studentIds = students.map(s => s.id);

      // Get assessments for this subject
      const { data: assessments, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          id,
          name,
          max_score,
          sequence_id,
          academic_sequences(name)
        `)
        .eq('subject_id', subject.id);

      if (assessmentsError) {
        console.error('  Error fetching assessments:', assessmentsError);
        continue;
      }

      if (!assessments || assessments.length === 0) {
        console.log(`  ❌ No assessments found for ${subject.name}`);
        continue;
      }

      // Get grades for these assessments and students
      const assessmentIds = assessments.map(a => a.id);
      
      const { data: grades, error: gradesError } = await supabase
        .from('grades')
        .select('id, student_id, assessment_id, score')
        .in('assessment_id', assessmentIds)
        .in('student_id', studentIds);

      if (gradesError) {
        console.error('  Error fetching grades:', gradesError);
        continue;
      }

      if (!grades || grades.length === 0) {
        console.log(`  ❌ NO MARKS FOUND for ${subject.name} in ${hecClass.name}`);
      } else {
        console.log(`  ✓ MARKS FOUND: ${grades.length} grade entries`);
        console.log(`     - Students with marks: ${new Set(grades.map(g => g.student_id)).size} out of ${students.length}`);
        
        // Group by sequence
        const gradesBySequence = {};
        grades.forEach(grade => {
          const assessment = assessments.find(a => a.id === grade.assessment_id);
          if (assessment && assessment.academic_sequences) {
            const seqName = assessment.academic_sequences.name || 'Unknown';
            if (!gradesBySequence[seqName]) {
              gradesBySequence[seqName] = [];
            }
            gradesBySequence[seqName].push(grade);
          }
        });

        console.log('     Breakdown by sequence:');
        Object.entries(gradesBySequence).forEach(([seqName, seqGrades]) => {
          console.log(`       - ${seqName}: ${seqGrades.length} grades`);
        });
      }
    }
  }
}

verifyHECMarks().catch(console.error);
