const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: classes, error } = await supabase.from('classes').select('*').ilike('name', 'HEC 4');
    
    if (error) {
        console.error('Error querying classes:', error.message);
        process.exit(1);
    }
    
    console.log('Classes named HEC 4:', classes?.length ?? 0);
    classes?.forEach(c => console.log(`- ID: ${c.id}, Name: ${c.name}`));}
check().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});