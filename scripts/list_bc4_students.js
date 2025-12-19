const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function listStudents() {
  // First get class ID
  const { data: cls } = await supabase.from('classes').select('id').eq('name', 'Form 4 BC').single();
  if (!cls) { console.log('Class Form 4 BC not found'); return; }

  const { data: students } = await supabase
    .from('students')
    .select('first_name, last_name')
    .eq('class', cls.id);
    
  console.log('Students in Form 4 BC:');
  students.forEach(s => console.log(` - ${s.first_name} ${s.last_name}`));
}

listStudents();
