const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssessmentColumns() {
  const { data, error } = await supabase.from('assessments').select('*').limit(1);
  if (error) console.error(error);
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    // If no data, we can't see columns via select *.
    // But we saw previous attempts to create assessments failed.
    console.log('No assessments found.');
  }
}

checkAssessmentColumns();
