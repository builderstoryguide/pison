const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('class_subjects').select('*').limit(1);
    if (error) console.log('Error:', error);
    else if (data.length === 0) console.log('No data found in class_subjects table');
    else console.log(Object.keys(data[0]));
}check();
