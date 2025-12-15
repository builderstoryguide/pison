
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

async function checkSubjects() {
  console.log('Checking subjects for class AC 1...');

  // 1. Get Class ID for "AC 1"
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or('name.eq.AC 1,class_name.eq.AC 1');

  if (classError || !classes || classes.length === 0) {
    console.error('Class "AC 1" not found', classError);
    return;
  }

  const classId = classes[0].id;
  console.log(`Found class "AC 1" with ID: ${classId}`);

  // 2. Get subjects for this class
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subject_id,
        subjects (
          id,
          name,
          code,
          coefficient
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    console.error('Error fetching subjects:', subjectsError);
    return;
  }

  console.log(`Found ${classSubjects.length} subjects for AC 1:`);
  classSubjects.forEach((cs: any) => {
      const subject = cs.subjects;
      console.log(`- ${subject?.name} (ID: ${subject?.id}, Coef: ${subject?.coefficient})`);
  });

  const mathSubject = classSubjects.find((cs: any) => cs.subjects?.name.toLowerCase().includes('math'));
  if (mathSubject) {
      console.log('Mathematics IS assigned to this class.');
  } else {
      console.log('Mathematics is NOT assigned to this class.');
  }
}

checkSubjects().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});