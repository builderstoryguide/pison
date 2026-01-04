const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const fs = require('fs');
async function checkTeacher() {
    const teacherId = '7a5049ec-a1ac-4d1a-9e50-0a2038458164'; 
    const stream = fs.createWriteStream('teacher_info.txt', {flags: 'w'});
    function log(msg) { console.log(msg); stream.write(msg + '\n'); }

    log(`Checking Teacher: ${teacherId}`);

    // 1. Get Teacher Name
    const { data: teacher, error } = await supabase.from('teachers').select('*').eq('id', teacherId).single();
    if (error) log('Error: ' + JSON.stringify(error));
    else log('Teacher Record: ' + JSON.stringify(teacher));

    // 2. Get User Name
    if (teacher && teacher.user_id) {
         const { data: user } = await supabase.from('users').select('name, email').eq('id', teacher.user_id).single();
         log('User Profile: ' + JSON.stringify(user));
    }

    // 3. Get Assignments
    const { data: assignments } = await supabase.from('teacher_subjects')
        .select(`
            subject_id,
            subjects (id, name, code)
        `)
        .eq('teacher_id', teacherId);
    
    log('\nAssigned Subjects:');
    if (assignments && assignments.length > 0) {
        assignments.forEach(a => {
            log(`- ${a.subjects.name} (${a.subjects.code || 'No Code'}) [ID: ${a.subjects.id}]`);
        });
    } else {
        log('No subjects assigned.');
    }
}

checkTeacher().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});