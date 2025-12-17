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

const CLASS_NAME = 'AC 2';
const SUBJECTS = ['Accounting'];
const SEQUENCES = ['First sequence', 'Second sequence'];

async function verifyMarks() {
  console.log(`Verifying marks for ${CLASS_NAME}, subjects: ${SUBJECTS.join(', ')}...\n`);

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

  // 2. Check each sequence for the subject
  for (const subjectName of SUBJECTS) {
    console.log(`\nChecking Subject: ${subjectName}`);

    for (const sequence of SEQUENCES) {
      console.log(`\n  Checking Sequence: "${sequence}"`);
      
      const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id, title, subject, total_marks')
        .eq('class_id', classId)
        .ilike('subject', `%${subjectName}%`) 
        .ilike('title', `%${sequence}%`);

      if (assessError) {
        console.error('   ❌ Error searching assessments:', assessError);
        continue;
      }

      if (!assessments || assessments.length === 0) {
        console.log(`   ❌ No assessment found for "${sequence}"`);
        continue;
      }

      // 3. Count Grades
      for (const assessment of assessments) {
        const { count, error: countError } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assessment.id);

        if (countError) {
          console.error(`   ❌ Error counting grades:`, countError);
        } else {
          const hasMarks = (count || 0) > 0;
          const icon = hasMarks ? '✅' : '⚠️';
          console.log(`   ${icon} Assessment Found: "${assessment.title}"`);
          console.log(`      Marks Recorded: ${count}`);
        }
      }
    }
  }
}

verifyMarks().catch(console.error);
