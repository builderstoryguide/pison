import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

async function listAll() {
  console.log('--- ALL CLASSES ---');
  const { data: classes } = await supabase.from('classes').select('name').order('name');
  classes?.forEach(c => console.log(c.name));

  console.log('\n--- ALL SUBJECTS ---');
  const { data: subjects } = await supabase.from('subjects').select('name, code').order('name');
  subjects?.forEach(s => console.log(`${s.name} (${s.code})`));
}

listAll();
