import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const AC4_CLASS_ID = '8fe6b8a4-0eba-4e52-8813-32975299b206';
const SUBJECT_NAME = 'MATHEMATICS';

// Expected First Sequence marks (for verification)
const EXPECTED_FIRST_SEQ_MARKS: Record<string, number> = {
  'AMADOU MEMUNA': 14,
  'AMADOU MEMONA': 14, // alternate spelling
  'MENDI MUYENG': 11,
  'NAIM AMAL': 8,
  'EMO NOAMI': 9,
  'FESSI SOH DIEUDONNE': 5,
  'FESSIS SOH DIEUDONNE': 5, // alternate spelling
  'MBONG CYNTHIA': 16,
  'MBONG BENEDIT CITHIA': 16, // from DB name
  'NGO ESSEGRA SOPHIE': 15,
  'NGO BASSEGA SOPHIE MERIME': 15, // from DB name
  'BUSSI JEANT': 15,
  'BUSSE JEANET KANG': 15, // from DB name
};

async function inspectMathAssessments() {
  console.log('='.repeat(60));
  console.log('INSPECTING MATHEMATICS ASSESSMENTS FOR AC 4');
  console.log('='.repeat(60));

  // 1. Find all Mathematics assessments for AC 4
  const { data: assessments, error: assessError } = await supabase
    .from('assessments')
    .select('id, title, subject, class_id, teacher_id, created_at')
    .eq('class_id', AC4_CLASS_ID)
    .ilike('subject', `%${SUBJECT_NAME}%`);

  if (assessError) {
    console.error('Error fetching assessments:', assessError);
    return;
  }

  console.log(`\nFound ${assessments?.length || 0} Mathematics assessments for AC 4:\n`);

  if (!assessments || assessments.length === 0) {
    console.log('No assessments found.');
    return;
  }

  for (const assessment of assessments) {
    console.log(`📝 Assessment ID: ${assessment.id}`);
    console.log(`   Title: "${assessment.title}"`);
    console.log(`   Subject: "${assessment.subject}"`);
    console.log(`   Created: ${new Date(assessment.created_at).toLocaleString()}`);

    // Get grades for this assessment
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        id,
        marks_obtained,
        student_id,
        students!inner(first_name, last_name)
      `)
      .eq('assessment_id', assessment.id);

    if (gradesError) {
      console.error(`   Error fetching grades:`, gradesError);
    } else {
      console.log(`   Grades: ${grades?.length || 0} students`);
      if (grades && grades.length > 0) {
        console.log('   Student Marks:');
        for (const grade of grades) {
          const student = grade.students as any;
          const fullName = `${student.first_name} ${student.last_name}`.toUpperCase().trim();
          const mark = grade.marks_obtained;
          
          // Check if mark matches expected first sequence value
          const matchesExpected = Object.entries(EXPECTED_FIRST_SEQ_MARKS).some(
            ([name, expectedMark]) => fullName.includes(name.split(' ')[0]) && mark === expectedMark
          );
          
          const indicator = matchesExpected ? '✓ (matches expected 1st seq)' : '';
          console.log(`      - ${fullName}: ${mark} ${indicator}`);
        }
      }
    }
    console.log('');
  }
}

async function fixSequenceTitle() {
  console.log('\n' + '='.repeat(60));
  console.log('FIX OPTIONS');
  console.log('='.repeat(60));
  
  // Find the "Second Sequence" assessment that should be "First Sequence"
  // Use exact subject match to avoid Business Mathematics
  const { data: wrongAssessments, error } = await supabase
    .from('assessments')
    .select('id, title, subject')
    .eq('class_id', AC4_CLASS_ID)
    .eq('subject', SUBJECT_NAME) // Exact match for MATHEMATICS (not Business Mathematics)
    .eq('title', 'Second Sequence');

  const wrongAssessment = wrongAssessments?.[0];

  if (error || !wrongAssessment) {
    console.log('\nNo "Second Sequence" assessment found for MATHEMATICS (exact match) in AC 4.');
    console.log('The data may already be correct or needs manual inspection.');
    console.log('Error:', error);
    return;
  }

  console.log(`\nFound wrongly titled assessment:`);
  console.log(`   ID: ${wrongAssessment.id}`);
  console.log(`   Current Title: "${wrongAssessment.title}"`);
  console.log(`   Subject: "${wrongAssessment.subject}"`);

  // Check if a "First Sequence" assessment already exists for MATHEMATICS (exact match)
  const { data: existingFirst } = await supabase
    .from('assessments')
    .select('id, title, subject')
    .eq('class_id', AC4_CLASS_ID)
    .eq('subject', SUBJECT_NAME) // Exact match - not Business Mathematics
    .eq('title', 'First Sequence');

  if (existingFirst && existingFirst.length > 0) {
    console.log(`\n⚠️  WARNING: A "First Sequence" assessment already exists!`);
    console.log(`   Existing ID: ${existingFirst[0].id}`);
    console.log(`   This requires manual intervention - you may need to:`);
    console.log(`   1. Delete the empty "First Sequence" assessment, OR`);
    console.log(`   2. Merge grades from both assessments`);
    return;
  }

  console.log(`\n✅ No existing "First Sequence" assessment found.`);
  console.log(`   Safe to create "First Sequence" and copy grades from "${wrongAssessment.title}"`);
  
  // Ask for confirmation before fixing
  console.log(`\n🔧 TO FIX: Run this script with --fix flag`);
  console.log(`   Command: npx ts-node scripts/fix_ac4_math_sequence.ts --fix`);
  console.log(`\n   This will:`);
  console.log(`   1. Create a new "First Sequence" assessment for MATHEMATICS`);
  console.log(`   2. Copy all grades from "Second Sequence" to "First Sequence"`);
  console.log(`   3. Keep "Second Sequence" unchanged`);
}

async function applyFix() {
  console.log('\n' + '='.repeat(60));
  console.log('APPLYING FIX - Creating First Sequence and Copying Grades');
  console.log('='.repeat(60));

  // Find the "Second Sequence" assessment - exact match for MATHEMATICS
  const { data: sourceAssessments, error: findError } = await supabase
    .from('assessments')
    .select('*')
    .eq('class_id', AC4_CLASS_ID)
    .eq('subject', SUBJECT_NAME) // Exact match
    .eq('title', 'Second Sequence');

  const sourceAssessment = sourceAssessments?.[0];

  if (findError || !sourceAssessment) {
    console.log('❌ Could not find the "Second Sequence" assessment to copy from.');
    console.log('Error:', findError);
    return;
  }

  console.log(`\n📋 Source Assessment Found:`);
  console.log(`   ID: ${sourceAssessment.id}`);
  console.log(`   Title: "${sourceAssessment.title}"`);
  console.log(`   Subject: "${sourceAssessment.subject}"`);

  // Check if "First Sequence" already exists for MATHEMATICS
  const { data: existingFirst } = await supabase
    .from('assessments')
    .select('id')
    .eq('class_id', AC4_CLASS_ID)
    .eq('subject', SUBJECT_NAME)
    .eq('title', 'First Sequence');

  if (existingFirst && existingFirst.length > 0) {
    console.log('❌ Cannot create: "First Sequence" assessment already exists.');
    console.log(`   Existing ID: ${existingFirst[0].id}`);
    return;
  }

  // Step 1: Create a new "First Sequence" assessment
  console.log('\n🔧 Step 1: Creating new "First Sequence" assessment...');
  
  const { data: newAssessment, error: createError } = await supabase
    .from('assessments')
    .insert({
      title: 'First Sequence',
      type: sourceAssessment.type || 'test',
      subject: SUBJECT_NAME,
      class_id: AC4_CLASS_ID,
      teacher_id: sourceAssessment.teacher_id,
      total_marks: sourceAssessment.total_marks || 20,
      status: sourceAssessment.status || 'published',
      assessment_date: sourceAssessment.assessment_date || new Date().toISOString().split('T')[0],
    })
    .select()
    .single();

  if (createError || !newAssessment) {
    console.error('❌ Error creating new assessment:', createError);
    return;
  }

  console.log(`   ✅ Created new assessment with ID: ${newAssessment.id}`);

  // Step 2: Fetch grades from source assessment
  console.log('\n🔧 Step 2: Fetching grades from "Second Sequence"...');
  
  const { data: sourceGrades, error: gradesError } = await supabase
    .from('grades')
    .select('*')
    .eq('assessment_id', sourceAssessment.id);

  if (gradesError) {
    console.error('❌ Error fetching source grades:', gradesError);
    return;
  }

  if (!sourceGrades || sourceGrades.length === 0) {
    console.log('   ⚠️ No grades found in source assessment.');
    return;
  }

  console.log(`   Found ${sourceGrades.length} grades to copy.`);

  // Step 3: Copy grades to the new assessment
  console.log('\n🔧 Step 3: Copying grades to "First Sequence"...');
  
  const gradesToInsert = sourceGrades.map(grade => ({
    assessment_id: newAssessment.id,
    student_id: grade.student_id,
    marks_obtained: grade.marks_obtained,
    percentage: grade.percentage,
    grade_letter: grade.grade_letter,
    remarks: grade.remarks,
  }));

  const { error: insertError } = await supabase
    .from('grades')
    .insert(gradesToInsert);

  if (insertError) {
    console.error('❌ Error inserting grades:', insertError);
    // Rollback: delete the created assessment
    await supabase.from('assessments').delete().eq('id', newAssessment.id);
    console.log('   Rolled back: Deleted the new assessment.');
    return;
  }

  console.log(`   ✅ Copied ${gradesToInsert.length} grades successfully!`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ SUCCESS! First Sequence assessment created with copied grades.');
  console.log('='.repeat(60));
  console.log(`\n   New Assessment ID: ${newAssessment.id}`);
  console.log(`   Title: "First Sequence"`);
  console.log(`   Subject: "${SUBJECT_NAME}"`);
  console.log(`   Grades Copied: ${gradesToInsert.length}`);
  console.log('\n📋 Students should now see both First and Second Sequence marks.');
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');

  await inspectMathAssessments();
  
  if (shouldFix) {
    await applyFix();
  } else {
    await fixSequenceTitle();
  }
}

main().catch(console.error);
