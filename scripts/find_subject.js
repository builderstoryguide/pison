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
  if (error) {
    console.error('Error searching for subjects:', error);
    return;
  }
  console.log('Search "Food":', data);    .select('id, name, code')
    .ilike('name', `%${term}%`);
    
  if (error) console.error(error);
  console.log(`Search "${term}":`, data);}

findSubject();
