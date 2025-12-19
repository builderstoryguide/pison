const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findBC1Class() {
  // List all classes to see what BC classes exist
  const { data: allClasses, error } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('All classes in database:');
  allClasses.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));

  console.log('\nBC classes:');
  const bcClasses = allClasses.filter(c => c.name.includes('BC'));
  bcClasses.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
}

findBC1Class().catch(console.error);
