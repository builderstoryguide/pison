const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findStudent() {
  const term1 = 'Mbolo';
  const term2 = 'Dajo';
  const term3 = 'Daio';
  const { data, error } = await supabase
    .from('students')
    .select('first_name, last_name, class, classes(name)')
    .or(`first_name.ilike.%${term1}%,last_name.ilike.%${term1}%,first_name.ilike.%${term2}%,last_name.ilike.%${term2}%,first_name.ilike.%${term3}%,last_name.ilike.%${term3}%`);
    
  if (error) console.error(error);
  console.log('Search "Mbolo/Dajo/Daio":', data);
}

findStudent();
