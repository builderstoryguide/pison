const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSequenceNames() {
  const { data, error } = await supabase.from('academic_sequences').select('sequence_name');
  if (error) console.error(error);
  if (data) {
    console.log('Sequence Names:', data.map(s => s.sequence_name));
  }
}

checkSequenceNames();
