const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listClasses() {
  console.log('=== Listing All Classes and Student Counts ===\n');

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');

  if (classError) {
    console.error('Error fetching classes:', classError);
    return;
  }

  if (!classes || classes.length === 0) {
    console.log('❌ No classes found');
    return;
  }

  console.log(`Found ${classes.length} classes:`);

  for (const cls of classes) {
    const { count, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', cls.id);

    if (countError) {
      console.error(`Error counting students for ${cls.name}:`, countError);
    } else {
      console.log(`- ${cls.name} (ID: ${cls.id}): ${count} students`);    }
  }
}

listClasses().catch(console.error);
