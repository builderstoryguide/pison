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

const CLASSES_TO_CHECK = [
  'Form 2 BC',
  'Form 3 BC',
  'Form 4 BC',
  'Form 5 BC'
];

const SEQUENCES = ['First sequence', 'Second sequence'];

async function verifyClassMarks(className: string) {
  console.log(`\n========================================`);
  console.log(`VERIFYING CLASS: ${className}`);
  console.log(`========================================`);

  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', className);

  if (classError || !classes || classes.length === 0) {
    console.error(`❌ Class "${className}" not found`);
    return;
  }
  const classId = classes[0].id;

  // 2. Get assigned subjects
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subjects (
          id,
          name
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    console.error(`Error fetching subjects:`, subjectsError);
    return;
  }

  const subjects = classSubjects?.map((cs: any) => cs.subjects?.name).sort() || [];

  if (subjects.length === 0) {
    console.log(`⚠️  No subjects assigned to this class.`);
    return;
  }

  // 3. Check marks for each subject
  for (const subjectName of subjects) {
    let resultString = `${subjectName.padEnd(40)} | `;
    
    for (const sequence of SEQUENCES) {
      // Find assessment
      const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id, total_marks')
        .eq('class_id', classId)
        .ilike('subject', subjectName) // Exact subject name match from DB
        .ilike('title', `%${sequence}%`);

      let hasMarks = false;
      let gradeCount = 0;

      if (assessments && assessments.length > 0) {
        // Check grades for the first matching assessment found (usually only one per seq/subject)
        for (const assess of assessments) {
          const { count } = await supabase
          .from('grades')
          .select('*', { count: 'exact', head: true })
          .eq('assessment_id', assess.id);
          
          if (count && count > 0) {
             hasMarks = true;
             gradeCount = count;
             break; 
          }
        }
      }

      const status = hasMarks ? `✅ Yes (${gradeCount})` : `❌ No`;
      resultString += `${sequence}: ${status.padEnd(15)} | `;
    }
    console.log(resultString);
  }
}

async function verifyAll() {
  for (const cls of CLASSES_TO_CHECK) {
    await verifyClassMarks(cls);
  }
}

verifyAll().catch(console.error);
