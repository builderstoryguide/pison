const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // 1. Find HEC 4 class
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .or('name.eq.HEC 4,class_name.eq.HEC 4')
        .limit(1);

    if (!classes || classes.length === 0) return;
    const cls = classes[0];

    // 2. Fetch one student
    const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('class', cls.id)
        .limit(1);

    let studentId = '';
    if (students && students.length > 0) {
        studentId = students[0].id;
    } else {
         // Try by name
         const { data: studentsByName } = await supabase
            .from('students')
            .select('id')
            .eq('class', cls.id)
            .limit(1);         if (studentsByName && studentsByName.length > 0) {
            studentId = studentsByName[0].id;
         }
    }

    const content = `Class ID: ${cls.id}\nStudent ID: ${studentId}`;
    fs.writeFileSync('ids.txt', content);
}

check();
