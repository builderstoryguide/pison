const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('subjects').select('*').limit(1);
    if (error) {
        console.log('Error:', error);
        return;
    }
    if (!data || data.length === 0) {
        console.log('No subjects found in the table');
        return;
    }
    console.log('Schema keys:', Object.keys(data[0]));}
check();
