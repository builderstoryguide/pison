const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listSubjects() {
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .or('name.ilike.%Resource%,name.ilike.%Computer%');
  
  console.log('--- Matching Subjects ---');
  if (subjects) {
    subjects.forEach(s => console.log(`- ${s.name} (ID: ${s.id})`));
  }
}

listSubjects().catch(console.error);
