
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('--- Checking for Class Name Ambiguity ---');
  const { data: allClasses } = await supabase
    .from('classes')
    .select('id, name, class_name')
    .or('name.ilike.%AC 1%,name.ilike.%AC 2%');
    
  console.log('Found Classes matching AC 1/AC 2:', allClasses);

  // Check specific subject details for CAM
  console.log('\n--- Checking Computer Aided Management Details ---');
  const { data: cam } = await supabase
    .from('subjects')
    .select('*')
    .ilike('name', 'Computer Aided Management%')
    .single();
  console.log(cam);
}

check();
