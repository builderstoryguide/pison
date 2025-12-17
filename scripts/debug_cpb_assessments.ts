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

const TARGET_CLASSES = ['Form 2 BC', 'Form 3 BC', 'Form 5 BC'];
const SUBJECT_SEARCH = 'Construction%'; // Broad search

async function debugCPB() {
  console.log(`\n========================================`);
  console.log(`DEBUGGING "Construction process" (CPB)`);
  console.log(`========================================`);

  for (const className of TARGET_CLASSES) {
    console.log(`\n----------------------------------------`);
    console.log(`Class: ${className}`);
    
    // 1. Get Class ID
    const { data: classes } = await supabase
      .from('classes')
      .select('id')
      .ilike('name', className);
      
    if (!classes || classes.length === 0) {
      console.log(`❌ Class not found.`);
      continue;
    }
    const classId = classes[0].id;

    // 2. Fetch ALL assessments for this subject (ignoring sequence filter)
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('id, title, subject, created_at, total_marks')
      .eq('class_id', classId)
      .ilike('subject', SUBJECT_SEARCH);

    if (error) {
      console.error('Error fetching assessments:', error);
      continue;
    }

    if (!assessments || assessments.length === 0) {
      console.log(`❌ No assessments found matching "${SUBJECT_SEARCH}"`);
      continue;
    }

    console.log(`Found ${assessments.length} assessment(s):`);

    // 3. Inspect each assessment
    for (const assess of assessments) {
      // Count grades
      const { count } = await supabase
        .from('grades')
        .select('*', { count: 'exact', head: true })
        .eq('assessment_id', assess.id);

      console.log(`   - Title: "${assess.title}"`);
      console.log(`     Subject: "${assess.subject}"`);
      console.log(`     Created At: ${new Date(assess.created_at).toLocaleDateString()}`);
      console.log(`     Grades: ${count} recorded`);
      console.log(`     ID: ${assess.id}`);
      console.log('');
    }
  }
}

debugCPB().catch(console.error);
