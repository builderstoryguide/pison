const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('\nEnsure .env.local exists and contains these values.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
async function verifyConstructionProcessMarks() {
  console.log('=== FINAL VERIFICATION: Construction Process and Building Practice Marks for Form 1 BC ===\n');

  // 1. Find the subject
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name, code')
    .or('name.ilike.%Construction%Process%Building%Practice%,code.ilike.%CPB%');

  if (!subjects || subjects.length === 0) {
    console.log('❌ Subject not found');
    return;
  }

  const subject = subjects[0];
  console.log(`✓ Subject: ${subject.name}`);
  console.log(`  Code: ${subject.code}`);
  console.log(`  ID: ${subject.id}\n`);

  // 2. Find Form 1 BC class
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('name', 'Form 1 BC');

  if (!classes || classes.length === 0) {
    console.log('❌ Form 1 BC class not found');
    return;
  }

  const bc1Class = classes[0];
  console.log(`✓ Class: ${bc1Class.name}`);
  console.log(`  ID: ${bc1Class.id}\n`);

  // 3. Check if subject is assigned to Form 1 BC
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select('id')
    .eq('class_id', bc1Class.id)
    .eq('subject_id', subject.id);

  if (!classSubjects || classSubjects.length === 0) {
    console.log('❌ Subject is NOT assigned to Form 1 BC class\n');
    return;
  } else {
    console.log('✓ Subject IS assigned to Form 1 BC class\n');
  }

  // 4. Get students - USE THE CLASS COLUMN, NOT CLASS_ID
  const { data: students } = await supabase
    .from('students')
    .select('id, student_id, first_name, last_name')
    .eq('class', bc1Class.id);

  if (!students || students.length === 0) {
    console.log('❌ No students found in Form 1 BC');
    return;
  }

  console.log(`✓ Found ${students.length} students in Form 1 BC\n`);

  const studentIds = students.map(s => s.id);

  // 5. Get assessments for this subject
  const { data: assessments } = await supabase
    .from('assessments')
    .select(`
      id,
      name,
      max_score,
      sequence_id,
      academic_sequences(name)
    `)
    .eq('subject_id', subject.id);

  if (!assessments || assessments.length === 0) {
    console.log('⚠️  No assessments found for this subject');
    console.log('RESULT: Cannot have marks without assessments\n');
    return;
  }

  console.log(`✓ Found ${assessments.length} assessments for this subject\n`);

  // 6. Get grades for these assessments and students
  const assessmentIds = assessments.map(a => a.id);
  
  const { data: grades } = await supabase
    .from('grades')
    .select('id, student_id, assessment_id, score')
    .in('assessment_id', assessmentIds)
    .in('student_id', studentIds);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                        FINAL RESULT                        ');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  if (!grades || grades.length === 0) {
    console.log('❌ NO MARKS FOUND');
    console.log('\nSummary:');
    console.log(`   • Subject exists: ${subject.name}`);
    console.log(`   • Class exists: ${bc1Class.name}`);
    console.log(`   • Subject assigned to class: YES`);
    console.log(`   • Students enrolled: ${students.length}`);
    console.log(`   • Assessments created: ${assessments.length}`);
    console.log(`   • Grades recorded: 0`);
    console.log('\n⚠️  The subject is set up correctly, but no teacher has entered marks yet.\n');
  } else {
    console.log('✅ MARKS FOUND!\n');
    console.log(`Total grades recorded: ${grades.length}`);
    console.log(`Students with marks: ${new Set(grades.map(g => g.student_id)).size} out of ${students.length}`);
    
    // Group by sequence
    const gradesBySequence = {};
    grades.forEach(grade => {
      const assessment = assessments.find(a => a.id === grade.assessment_id);
      if (assessment && assessment.academic_sequences) {
        const seqName = assessment.academic_sequences.name || 'Unknown';
        if (!gradesBySequence[seqName]) {
          gradesBySequence[seqName] = {
            count: 0,
            students: new Set()
          };
        }
        gradesBySequence[seqName].count++;
        gradesBySequence[seqName].students.add(grade.student_id);
      }
    });

    console.log('\nMarks by Sequence:');
    Object.entries(gradesBySequence).forEach(([seqName, data]) => {
      console.log(`   • ${seqName}: ${data.count} grades for ${data.students.size} students`);
    });

    // Calculate average marks
    const avgScore = grades.reduce((sum, g) => sum + (g.score || 0), 0) / grades.length;
    console.log(`\nAverage score: ${avgScore.toFixed(2)}`);

    // Show sample marks
    console.log('\nSample marks (first 5):');
    for (let i = 0; i < Math.min(5, grades.length); i++) {
      const grade = grades[i];
      const student = students.find(s => s.id === grade.student_id);
      const assessment = assessments.find(a => a.id === grade.assessment_id);
      const seqName = assessment?.academic_sequences?.name || 'Unknown';
      console.log(`   ${i+1}. ${student?.first_name} ${student?.last_name} (${student?.student_id})`);
      console.log(`      ${assessment?.name} (${seqName}): ${grade.score}/${assessment?.max_score}`);
    }
    console.log('\n');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

verifyConstructionProcessMarks().catch(console.error);
