const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGradesColumns() {
  const { data, error } = await supabase.from('grades').select('*').limit(1);
  if (error) console.error(error);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // If no data, try to select specific columns or just headers if possible (supabase-js doesn't expose schema easily without data or introspection)
    // But usually select * returns something if table not empty.
    if (!data || data.length === 0) console.log('No grades found to inspect columns.');
  }
}

checkGradesColumns();
