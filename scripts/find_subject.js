/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSubject() {
  const term = 'Food';
  console.log(`Searching for subjects matching "${term}"...`);

  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, code')
    .ilike('name', `%${term}%`);
    
  if (error) {
    console.error('Error searching for subjects:', error);
    return;
  }
  
  console.log('Results:', data);
}

findSubject().catch(console.error);
