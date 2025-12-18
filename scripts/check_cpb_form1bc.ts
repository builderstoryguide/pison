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

const TARGET_CLASS = 'Form 1 BC';
const SUBJECT_PATTERNS = ['Construction%', 'CPB%', '%Building%'];

async function checkCPB() {
  console.log('='.repeat(60));
  console.log(`CHECKING CPB MARKS FOR ${TARGET_CLASS}`);
  console.log('='.repeat(60));

  // 1. Find the class
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or(`name.ilike.%${TARGET_CLASS}%,class_name.ilike.%${TARGET_CLASS}%`);

  if (classError || !classes || classes.length === 0) {
    console.log(`\n❌ Class "${TARGET_CLASS}" not found.`);
    
    // List available classes for reference
    const { data: allClasses } = await supabase
      .from('classes')
      .select('name, class_name')
      .order('name');
    
    console.log('\nAvailable classes:');
    allClasses?.forEach(c => console.log(`  - ${c.class_name || c.name}`));
    return;
  }

  const classInfo = classes[0];
  const classId = classInfo.id;
  console.log(`\n✅ Found class: ${classInfo.class_name || classInfo.name} (ID: ${classId})`);

  // 2. Check class_subjects for CPB
  console.log('\n--- Class Subjects with CPB/Construction ---');
  const { data: classSubjects } = await supabase
    .from('class_subjects')
    .select(`
      subject_id,
      subjects!inner(id, name, code)
    `)
    .eq('class_id', classId);

  const cpbSubjects = classSubjects?.filter((cs: any) => {
    const subj = cs.subjects;
    const name = (subj?.name || '').toLowerCase();
    const code = (subj?.code || '').toLowerCase();
    return name.includes('construction') || name.includes('building') || 
           name.includes('cpb') || code.includes('cpb');
  });

  if (cpbSubjects && cpbSubjects.length > 0) {
    console.log(`Found ${cpbSubjects.length} CPB-related subject(s) assigned to class:`);
    cpbSubjects.forEach((cs: any) => {
      console.log(`  - ${cs.subjects.name} (Code: ${cs.subjects.code || 'N/A'}, ID: ${cs.subjects.id})`);
    });
  } else {
    console.log('⚠️  No CPB-related subjects found in class_subjects for this class.');
  }

  // 3. Check assessments for CPB
  console.log('\n--- Assessments for CPB/Construction ---');
  
  let allAssessments: any[] = [];
  for (const pattern of SUBJECT_PATTERNS) {
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id, title, subject, created_at, total_marks, teacher_id')
      .eq('class_id', classId)
      .ilike('subject', pattern);
    
    if (assessments && assessments.length > 0) {
      allAssessments = [...allAssessments, ...assessments];
    }
  }

  // Remove duplicates
  const uniqueAssessments = allAssessments.filter((a, idx, arr) => 
    arr.findIndex(x => x.id === a.id) === idx
  );

  if (uniqueAssessments.length === 0) {
    console.log('❌ No assessments found for CPB/Construction subjects.');
    
    // Check what subjects have assessments for this class
    const { data: classAssessments } = await supabase
      .from('assessments')
      .select('subject')
      .eq('class_id', classId);
    
    if (classAssessments && classAssessments.length > 0) {
      const subjects = [...new Set(classAssessments.map(a => a.subject))];
      console.log('\nSubjects that have assessments for this class:');
      subjects.forEach(s => console.log(`  - ${s}`));
    } else {
      console.log('⚠️  No assessments at all for this class.');
    }
    return;
  }

  console.log(`Found ${uniqueAssessments.length} assessment(s):\n`);

  // 4. Check grades for each assessment
  let totalGrades = 0;
  for (const assess of uniqueAssessments) {
    const { data: grades, count } = await supabase
      .from('grades')
      .select('marks_obtained, student_id', { count: 'exact' })
      .eq('assessment_id', assess.id);

    const gradeCount = count || 0;
    totalGrades += gradeCount;
    const hasMarks = gradeCount > 0;
    const icon = hasMarks ? '✅' : '❌';

    console.log(`${icon} Assessment: "${assess.title}"`);
    console.log(`   Subject: ${assess.subject}`);
    console.log(`   Grades Recorded: ${gradeCount}`);
    
    if (hasMarks && grades && grades.length > 0) {
      const sampleMarks = grades.slice(0, 3).map(g => g.marks_obtained);
      console.log(`   Sample Marks: ${sampleMarks.join(', ')}${grades.length > 3 ? '...' : ''}`);
    }
    console.log('');
  }

  // 5. Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Class: ${TARGET_CLASS}`);
  console.log(`CPB Assessments Found: ${uniqueAssessments.length}`);
  console.log(`Total Grades Recorded: ${totalGrades}`);
  
  if (totalGrades > 0) {
    console.log(`\n✅ CPB has marks for ${TARGET_CLASS}`);
  } else {
    console.log(`\n❌ CPB has NO marks for ${TARGET_CLASS}`);
  }
}

checkCPB().catch(console.error);
