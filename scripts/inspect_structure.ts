import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function inspect() {
  console.log('Inspecting assessments table...');
  const { data, error } = await supabase.from('assessments').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data.length > 0) {
    console.log('Sample Assessment Keys:', Object.keys(data[0]));
    console.log('Sample Assessment Data:', data[0]);
  } else {
    console.log('No assessments found to inspect columns.');
  }

  console.log('\nInspecting grades table...');
  const { data: gData, error: gError } = await supabase.from('grades').select('*').limit(1);
  if (gError) {
    console.error('Error:', gError);
  } else if (gData && gData.length > 0) {
    console.log('Sample Grade Keys:', Object.keys(gData[0]));
  }
}

inspect();
