const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables (NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

async function listSubjects() {
  const { data: subjects, error } = await supabase
    .from('subjects')
    .select('id, name')
    .or('name.ilike.%Resource%,name.ilike.%Computer%');
  
  if (error) {
    console.error('Error querying subjects:', error);
    return;
  }

  console.log('--- Matching Subjects ---');
  if (subjects && subjects.length > 0) {
    subjects.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
  } else {
    console.log('No matching subjects found.');
  }
}
listSubjects().catch(console.error);
