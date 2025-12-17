
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const targets = [
  'French', 'English', 'Math', 'Computer', 'Marketing', 'Account', 'Office', 'Citizenship', 'Physical', 'Manual', 'Business'
];

async function check() {
  console.log('Searching for subjects...');
  const { data: allSubjects, error } = await supabase.from('subjects').select('id, name, code').order('name');
  
  if (error) {
    console.error(error);
    return;
  }

  const matched = allSubjects.filter((s: any) => 
    targets.some(t => s.name.toLowerCase().includes(t.toLowerCase()))
  );
  
  console.log('--- FOUND SUBJECTS ---');
  matched.forEach((s: any) => console.log(`"${s.name}" (Code: ${s.code || 'N/A'}, ID: ${s.id})`));
}

check();
