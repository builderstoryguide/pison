const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssessmentsContent() {
  const { data, error } = await supabase.from('assessments').select('*').limit(5);
  if (error) console.error(error);
  console.log('Assessments Sample:', data);
}

checkAssessmentsContent();
