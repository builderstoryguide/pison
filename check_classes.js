
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStudentClasses() {
  const { data, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, class')
    .limit(5);

  if (error) {
    console.error('Error fetching students:', error);
  } else {
    console.log('Student Data Sample:', JSON.stringify(data, null, 2));
  }
}

checkStudentClasses();
