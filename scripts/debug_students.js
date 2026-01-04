const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugStudents() {
  console.log('=== Debugging Students ===\n');

  // get total count
  const { count, error: countError } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  
  if (countError) {
    console.error('Error counting students:', countError);
  } else {
    console.log('Total students in DB:', count);
  }

  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name, class_id, classes(name)')    .from('students')
    .select('id, first_name, last_name, class_id, classes(name)')
    .limit(10);
  
  if (studentError) {
    console.error('Error fetching students:', studentError);
    return;
  }

  const redactedStudents = students.map(s => ({
    id: s.id,
    first_name: s.first_name ? '***' : null,
    last_name: s.last_name ? '***' : null,
    class_id: s.class_id,
    classes: s.classes
  }));
  }

  console.log('Sample students:', JSON.stringify(students, null, 2));
}

debugStudents().catch(console.error);
