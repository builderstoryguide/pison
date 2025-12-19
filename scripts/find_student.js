const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function findStudent() {
  const term = 'Akikea';
  const { data, error } = await supabase
    .from('students')
    .select('first_name, last_name, class, classes(name)')
    .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`);
    
  if (error) console.error(error);
  console.log('Search "Akikea":', data);

  const term2 = 'Marus';
    const { data: data2 } = await supabase
      .from('students')
      .select('first_name, last_name, class, classes(name)')
      .or(`first_name.ilike.%${term2}%,last_name.ilike.%${term2}%`);
    console.log('Search "Marus":', data2);
}

findStudent();
