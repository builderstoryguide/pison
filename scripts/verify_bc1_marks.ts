import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CLASS_NAME = 'Form 1 BC'; // Mapped from 'BC 1'
const SUBJECT_PATTERNS = [
  'Quality Hygine', // For 'QUALITY HYGINE AND SAFTY ENVIRONMENT'
  'Engineering Science', // For 'ENGINEERING SCIENCE'
  'Survey, Soil', // For 'Survey, Soil Mechanics and Material ( SMS)'
  'Construction process', // For 'Construction process and Building practice (CPB)'
  'Mathematics' // For 'MATHEMATICS'
];
const SEQUENCES = ['First sequence', 'Second sequence'];

async function verifyMarks() {
  console.log(`Verifying marks for ${CLASS_NAME}...\n`);

  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', CLASS_NAME);

  if (classError || !classes || classes.length === 0) {
    console.error(`❌ Class "${CLASS_NAME}" not found`);
    return;
  }
  const classId = classes[0].id;
  console.log(`Found Class: ${classes[0].name} (ID: ${classId})`);

  // 2. Check each subject
  for (const subjectPattern of SUBJECT_PATTERNS) {
    console.log(`\nChecking Subject Pattern: "${subjectPattern}"`);

    for (const sequence of SEQUENCES) {
      process.stdout.write(`  Checking Sequence: "${sequence}" ...`);
      
      const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id, title, subject, total_marks')
        .eq('class_id', classId)
        .ilike('subject', `%${subjectPattern}%`) 
        .ilike('title', `%${sequence}%`); // Assuming sequence in title

      if (assessError) {
        console.log(` ❌ Error: ${assessError.message}`);
        continue;
      }

      if (!assessments || assessments.length === 0) {
        console.log(` ❌ No assessment found.`);
        continue;
      }

      // Count Grades
      let totalGrades = 0;
      for (const assessment of assessments) {
        const { count } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assessment.id);
        totalGrades += (count || 0);
      }

      if (totalGrades > 0) {
        console.log(` ✅ ${totalGrades} marks recorded.`);
      } else {
        console.log(` ⚠️  Assessment found but NO MARKS recorded.`);
      }
    }
  }
}

verifyMarks().catch(console.error);
