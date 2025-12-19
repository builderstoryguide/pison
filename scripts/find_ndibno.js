const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findStudent() {
  const terms = ['Ndibno', 'Prince', 'Joy'];
  
  let query = supabase
    .from('students')
    .select('first_name, last_name, class, classes(name)');
    
  const orClause = terms.map(t => `first_name.ilike.%${t}%,last_name.ilike.%${t}%`).join(',');
  query = query.or(orClause).limit(10);

  const { data, error } = await query;
  if (error) console.error(error);
  
  console.log('Search Results:', data);
}

findStudent();
