const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSequences() {
  const { data, error } = await supabase.from('academic_sequences').select('id, name');
  if (error) console.error(error);
  console.log('Available Sequences:');
  console.log(data);
}

checkSequences();
