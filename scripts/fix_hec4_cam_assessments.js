const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
    const classId = '3a508d31-a9de-48b9-996e-c70f0aaed8d9';
    const currentYear = '2024-2025';

    console.log('--- Fixing HEC 4 CAM Assessments ---');
    
    // 1. Get IDs
    const { data: assessments, error: queryError } = await supabase.from('assessments')
        .select('id, title, subject')
        .eq('class_id', classId)
        .ilike('subject', '%Computer Aided%');
    
    if (queryError) {
        console.error('Error fetching assessments:', queryError);
        process.exit(1);
    }
    
    if (!assessments || assessments.length === 0) {
        console.log('No assessments found.');
        return;
    }
    
    console.log(`Found ${assessments.length} assessments.`);    
    for (const a of assessments) {
        // Determine Term based on Sequence
        // First Sequence -> Term 1
        // Second Sequence -> Term 1
        // Third Sequence -> Term 2
        
        let term = 1;
        if (a.title.includes('Third') || a.title.includes('Fourth')) term = 2;
        if (a.title.includes('Fifth') || a.title.includes('Sixth')) term = 3;

        console.log(`Updating Assessment ${a.id} (${a.title}): Year=${currentYear}, Term=${term}`);
        
        const { error } = await supabase.from('assessments')
            .update({ academic_year: currentYear, term: term })
            .eq('id', a.id);
            
        if (error) console.error('Error updating:', error);
        else console.log('Success.');
    }
}

fix().catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
});