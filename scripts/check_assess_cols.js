/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAssessmentColumns() {
  console.log('Checking assessment columns...');
  const { data, error } = await supabase.from('assessments').select('*').limit(1);
  
  if (error) {
    console.error('Error fetching assessments:', error);
    process.exit(1);
  }
  
  if (data && data.length > 0) {
    console.log('Columns:', Object.keys(data[0]));
  } else {
    console.log('No assessments found to check columns.');
  }
}

checkAssessmentColumns().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
