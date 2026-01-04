const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Required environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function refresh() {
    console.log('Reloading schema...');
    const { data, error } = await supabase.from('assessments').select('id').limit(1);
    if(error) console.log('Error:', error);
    else console.log('Success - Connection OK.');
}
refresh()
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });