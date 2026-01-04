const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // HEC 4 ID from previous task: 3a508d31-a9de-48b9-996e-c70f0aaed8d9
    const classId = '3a508d31-a9de-48b9-996e-c70f0aaed8d9'; 
    
    console.log('--- Checking HEC 4 Subjects & Categories ---');
    
    const { data: classSubjects, error } = await supabase.from('class_subjects')
        .select(`
            id, 
            subjects!inner (*)
        `)
        .eq('class_id', classId);
        
    if (error) {
        console.error('Error:', error);
        return;
    }

    // Group by category/grouping to see what we have
    const byCategory = {};
    classSubjects.forEach(cs => {
        const s = cs.subjects;
        const cat = s.category || 'Uncategorized';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(`${s.name} (Code: ${s.code}, Group: ${s.subject_groupings}, Active: ${s.is_active})`);
    });

    console.log(JSON.stringify(byCategory, null, 2));
}

check();
