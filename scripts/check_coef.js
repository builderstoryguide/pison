const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
    const classId = '3a508d31-a9de-48b9-996e-c70f0aaed8d9';
    const { data: classSubjects, error } = await supabase.from('class_subjects')
        .select('id, subjects!inner(name, coefficient, is_active)')
        .eq('class_id', classId)
        .ilike('subjects.name', '%Computer%');
    
    if (error) console.log('Error:', error);
    else console.log(JSON.stringify(classSubjects, null, 2));
}
check();
