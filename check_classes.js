
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClasses() {
  console.log('Testing Supabase Connection...');
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error fetching classes:', error);
  } else {
    console.log('Classes Data Sample:', JSON.stringify(data, null, 2));
  }
}

checkClasses();
