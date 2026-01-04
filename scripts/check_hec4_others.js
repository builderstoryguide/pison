const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    console.log('--- Verifying "Others" Subjects for HEC 4 ---');

    // 1. Find HEC 4 class
    const { data: classes, error: cError } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .or('name.eq.HEC 4,class_name.eq.HEC 4')
        .order('name');

    if (cError) {
        console.error('Error fetching classes:', cError);
        return;
    }

    if (classes.length === 0) {
        console.log('No HEC 4 class found.');
        return;
    }

    console.log(`Found ${classes.length} HEC 4 classes.`);

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

        const subjects = classSubjects.map(cs => cs.subjects);
        console.log(`Total subjects assigned: ${subjects.length}`);

        const othersSubjects = [];
        
        // 3. Categorize
        subjects.forEach(s => {
             // console.log(`  - Subject: ${s.name} (Code: ${s.code}, Group: ${s.subject_groupings})`);
             if (s.subject_groupings && s.subject_groupings.includes('others')) {
                 othersSubjects.push(s);
             }
        });

        console.log(`\nSummary for ${className}:`);
        console.log(`  Total Subjects: ${subjects.length}`);
        console.log(`  "Others" Count: ${othersSubjects.length}`);
        othersSubjects.forEach(s => console.log(`    * ${s.name}`));

        // 4. Fetch one student
        const { data: students, error: sError } = await supabase
            .from('students')
            .select('id, first_name, last_name')
            .eq('class', cls.id) // Try by UUID first
            .limit(1);

        if (students && students.length > 0) {
            console.log(`\nSample Student: ${students[0].first_name} ${students[0].last_name}`);
            console.log(`Student ID: ${students[0].id}`);
            console.log(`Class ID: ${cls.id}`);
            console.log(`Test URL: http://localhost:3000/api/admin/reports/student-report?studentId=${students[0].id}&classId=${cls.id}&academicTermId=first`);
        } else {
             // Try by name
             const { data: studentsByName } = await supabase
                .from('students')
                .select('id, first_name, last_name')
                .eq('class', className)
                .limit(1);
             
             if (studentsByName && studentsByName.length > 0) {
                console.log(`\nSample Student (by class name): ${studentsByName[0].first_name} ${studentsByName[0].last_name}`);
                console.log(`Student ID: ${studentsByName[0].id}`);
                console.log(`Class ID: ${cls.id}`);
                console.log(`Test URL: http://localhost:3000/api/admin/reports/student-report?studentId=${studentsByName[0].id}&classId=${cls.id}&academicTermId=first`);
             } else {
                console.log('\nNo students found in this class.');
             }
        }

    }
}

check();
