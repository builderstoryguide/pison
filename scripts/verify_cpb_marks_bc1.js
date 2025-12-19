const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyConstructionProcessMarks() {
  console.log('=== Verifying Construction Process and Building Practice Marks for BC 1 ===\n');

  // 1. Find the subject
  console.log('1. Looking for Construction Process and Building Practice subject...');
  const { data: subjects, error: subjectError } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or('name.ilike.%Construction%,name.ilike.%Process%,name.ilike.%Building%,name.ilike.%Practice%,code.ilike.%CPB%');
  if (subjectError) {
    console.error('Error fetching subject:', subjectError);
    return;
  }

  console.log('Found subjects:', subjects);

  if (!subjects || subjects.length === 0) {
    console.log('❌ Subject not found in database');
    return;
  }

  const subject = subjects[0];
  console.log(`✓ Subject found: ${subject.name} (ID: ${subject.id}, Code: ${subject.code})\n`);

  // 2. Find Form 1 BC class
  console.log('2. Looking for Form 1 BC class...');
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'Form 1 BC');

  if (classError) {
    console.error('Error fetching class:', classError);
    return;
  }

  console.log('Found classes:', classes);

  if (!classes || classes.length === 0) {
    console.log('❌ BC 1 class not found');
    return;
  }

  const bc1Class = classes[0];
  console.log(`✓ Class found: ${bc1Class.name} (ID: ${bc1Class.id})\n`);

  // 3. Check if subject is assigned to BC 1
  console.log('3. Checking if subject is assigned to BC 1...');
  const { data: classSubjects, error: csError } = await supabase
    .from('class_subjects')
    .select('id')
    .eq('class_id', bc1Class.id)
    .eq('subject_id', subject.id);

  if (csError) {
    console.error('Error checking class subjects:', csError);
    return;
  }

  if (!classSubjects || classSubjects.length === 0) {
    console.log('❌ Subject is NOT assigned to BC 1 class\n');
  } else {
    console.log('✓ Subject IS assigned to BC 1 class\n');
  }

  // 4. Check for marks
  console.log('4. Checking for marks in this subject for BC 1 students...');
  
  // Get all students in Form 1 BC
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name')
    .eq('class_id', bc1Class.id);

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return;
  }

  console.log(`Found ${students?.length || 0} students in BC 1\n`);

  if (!students || students.length === 0) {
    console.log('❌ No students found in BC 1');
    return;
  }

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
    console.error('Error fetching assessments:', assessmentsError);
    return;
  }

  console.log(`Found ${assessments?.length || 0} assessments for this subject\n`);

  if (!assessments || assessments.length === 0) {
    console.log('❌ No assessments found for this subject');
    return;
  }

  // Get grades for these assessments and students
  const assessmentIds = assessments.map(a => a.id);
  
  const { data: grades, error: gradesError } = await supabase
    .from('grades')
    .select('id, student_id, assessment_id, score')
    .in('assessment_id', assessmentIds)
    .in('student_id', studentIds);

  if (gradesError) {
    console.error('Error fetching grades:', gradesError);
    return;
  }

  console.log('=== RESULTS ===\n');
  
  if (!grades || grades.length === 0) {
    console.log('❌ NO MARKS FOUND for Construction Process and Building Practice in BC 1');
    console.log(`   - Subject exists: ${subject.name}`);
    console.log(`   - Class exists: ${bc1Class.name}`);
    console.log(`   - Students in class: ${students.length}`);
    console.log(`   - Assessments for subject: ${assessments.length}`);
    console.log('   - Grades recorded: 0');
  } else {
    console.log(`✓ MARKS FOUND: ${grades.length} grade entries`);
    console.log(`   - Students with marks: ${new Set(grades.map(g => g.student_id)).size} out of ${students.length}`);
    
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

    console.log('\nBreakdown by sequence:');
    Object.entries(gradesBySequence).forEach(([seqName, seqGrades]) => {
      console.log(`   - ${seqName}: ${seqGrades.length} grades`);
    });

    // Show sample marks
    console.log('\nSample marks (first 5):');
    for (let i = 0; i < Math.min(5, grades.length); i++) {
      const grade = grades[i];
      const student = students.find(s => s.id === grade.student_id);
      const assessment = assessments.find(a => a.id === grade.assessment_id);
      console.log(`   - ${student?.first_name} ${student?.last_name} (${student?.student_id}): ${grade.score}/${assessment?.max_score} in ${assessment?.name}`);
    }
  }
}

verifyConstructionProcessMarks().catch(console.error);
