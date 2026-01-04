const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHECStudents() {
  console.log('=== Checking HEC Classes and Students ===\n');

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', '%HEC%');

  if (classError) {
    console.error('Error fetching classes:', classError);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('❌ No classes found matching "HEC"');
    return;
  }

  console.log(`Found ${classes.length} HEC classes:`);

  const studentCounts = await Promise.all(
    classes.map(async (cls) => {
      const { count, error: countError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id);
      
      return { cls, count, error: countError };
    })
  );

  for (const { cls, count, error: countError } of studentCounts) {
    if (countError) {
      console.error(`Error counting students for ${cls.name}:`, countError);
    } else {
      console.log(`- ${cls.name} (ID: ${cls.id}): ${count} students`);
    }
  }}

checkHECStudents().catch(console.error);
