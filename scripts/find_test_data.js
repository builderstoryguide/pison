const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTestData() {
  const classId = '8fe6b8a4-0eba-4e52-8813-32975299b206'; // AC 4
  
  console.log(`Finding subjects for class: ${classId}`);
  const { data: classSubjects, error: csError } = await supabase
    .from('class_subjects')
    .select('subject_id, subjects(id, name)')
    .eq('class_id', classId);
    
  if (csError) {
    console.error('Error fetching class subjects:', csError);
  } else {
    console.log('Class Subjects:', JSON.stringify(classSubjects, null, 2));
  }

  console.log('Finding a teacher with assigned subjects...');
  const { data: teacherAss, error: taError } = await supabase
    .from('teacher_subjects')
    .select('teacher_id, subject_id, teachers(id, first_name, last_name)')
    .eq('is_active', true)
    .limit(5);

  if (taError) {
    console.error('Error fetching teacher assignments:', taError);
  } else {
    console.log('Teacher Assignments:', JSON.stringify(teacherAss, null, 2));
  }

  console.log('Finding students for class...');
  const { data: students, error: sError } = await supabase
    .from('students')
    .select('id, first_name, last_name, student_id')
    .eq('class', classId)
    .limit(3);

  if (sError) {
    console.error('Error fetching students:', sError);
  } else {
    console.log('Students:', JSON.stringify(students, null, 2));
  }
}

findTestData();
