const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findSubject() {
  const term = 'Food';
  const { data, error } = await supabase
    .from('subjects')
    .select('id, name, code')
    .ilike('name', `%${term}%`);
    
  if (error) console.error(error);
  console.log('Search "Food":', data);
}

findSubject();
