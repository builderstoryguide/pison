/* eslint-disable no-console */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSequences() {
  const { data, error } = await supabase.from('academic_sequences').select('*');
  
  if (error) {
    console.error('Error fetching sequences:', error);
    process.exit(1);
  }  
  console.log('Available Sequences:');
  console.log(data);
}

checkSequences().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
