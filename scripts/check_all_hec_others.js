const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL');
  console.error('Required: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
async function check() {
    console.log('--- Verifying "Others" Subjects for HEC Classes ---');

    // 1. Find all HEC classes
    const { data: classes, error: cError } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .or('name.ilike.%HEC%,class_name.ilike.%HEC%')
        .order('name');

    if (cError) {
        console.error('Error fetching classes:', cError);
        return;
    }

    console.log(`Found ${classes.length} HEC classes.`);

    for (const cls of classes) {
        const className = cls.class_name || cls.name;
        console.log(`\nChecking Class: ${className} (${cls.id})`);

        // 2. Fetch subjects for this class
        const { data: classSubjects, error: csError } = await supabase
            .from('class_subjects')
            .select(`
                id,
                subjects!inner (
                    id,
                    name,
                    code,
                    subject_groupings
                )
            `)
            .eq('class_id', cls.id);

        if (csError) {
            console.error(`Error fetching subjects for ${className}:`, csError);
            continue;
        }

        const othersSubjects = [];

        // 3. Categorize
        classSubjects.forEach(cs => {
            const s = cs.subjects;
            let category = 'others';
            if (Array.isArray(s.subject_groupings) && s.subject_groupings.length > 0) {
                const rawCategory = s.subject_groupings[0];
                const validCategories = ['languages', 'related_trade_subjects', 'trade_subjects', 'others'];
                if (validCategories.includes(rawCategory)) {
                    category = rawCategory;
                }
            }
            
            // If category matches 'others', add to list
            if (category === 'others') {
                othersSubjects.push(`${s.name} (Code: ${s.code || 'N/A'}) [Grouping: ${s.subject_groupings?.[0] || 'None'}]`);
            }
        });

        if (othersSubjects.length > 0) {
            console.log(`  Found ${othersSubjects.length} "Others" subjects:`);
            othersSubjects.forEach(subj => console.log(`    - ${subj}`));
        } else {
            console.log('  No "Others" subjects assigned.');
        }
    }
}

check();
