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

const requiredSubjects = [
  'French Language',
  'English Language',
  'Mathematics',
  'Computer Aided Management',
  'Introduction to Marketing',
  'Accounting',
  'Office Practice',
  'Citizenship',
  'Physical Education',
  'Manual Labour'
];

async function verifySubjectsForClass(className: string) {
  console.log(`\nVerifying subjects for class ${className}...`);

  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', className);

  if (classError || !classes || classes.length === 0) {
    console.error(`Class "${className}" not found`, classError);
    return;
  }

  const classId = classes[0].id;
  console.log(`Found class "${classes[0].name}" with ID: ${classId}`);

  // 2. Get subjects for this class
  const { data: classSubjects, error: subjectsError } = await supabase
    .from('class_subjects')
    .select(`
        subject_id,
        subjects (
          id,
          name,
          code
        )
      `)
    .eq('class_id', classId);

  if (subjectsError) {
    console.error(`Error fetching subjects for ${className}:`, subjectsError);
    return;
  }

  const assignedSubjectNames = classSubjects?.map((cs: any) => cs.subjects?.name) || [];
  
  console.log(`\nAssigned Subjects (${assignedSubjectNames.length}):`);
  assignedSubjectNames.forEach(name => console.log(`- ${name}`));

  // Compare with required
  console.log('\nDiscrepancy Check:');
  const missing = requiredSubjects.filter(req => !assignedSubjectNames.includes(req));
  const extra = assignedSubjectNames.filter(assigned => !requiredSubjects.includes(assigned));

  if (missing.length > 0) {
    console.log('MISSING subjects:', missing);
  } else {
    console.log('All required subjects are present.');
  }

  if (extra.length > 0) {
    console.log('EXTRA subjects (assigned but not in required list):', extra);
  } else {
    console.log('No extra subjects found.');
  }

  return { classId, missing, extra };
}

async function verifyAll() {
  await verifySubjectsForClass('AC 1');
  await verifySubjectsForClass('AC 2');
}

verifyAll().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
