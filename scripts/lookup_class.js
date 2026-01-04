const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function lookup() {
    const id = '3a508d31-a9de-48b9-996e-c70f0aaed8d9';
    const { data } = await supabase.from('classes').select('name').eq('id', id).single();
    console.log(`Class ID ${id} is: ${data ? data.name : 'Unknown'}`);
}
lookup().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});