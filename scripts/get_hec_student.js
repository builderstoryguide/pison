const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) { console.error('Missing creds'); process.exit(1); }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function findTarget() {
    // Find HEC Class
    const { data: classes } = await supabase.from('classes').select('id, name').ilike('name', '%HEC%').limit(1);
    if (!classes || classes.length === 0) return;
    const cls = classes[0];

    // Find RMHS Assessments
    const { data: assessments } = await supabase.from('assessments').select('id').eq('class_id', cls.id).ilike('subject', '%Resource Management%');
    if (!assessments || assessments.length === 0) return;
    const ids = assessments.map(a => a.id);

    // Find Student
    const { data: student } = await supabase.from('grades').select('student_id').in('assessment_id', ids).limit(1).maybeSingle();
    
    const fs = require('fs');
    if (student) {
        const output = { studentId: student.student_id, classId: cls.id };
        console.log(JSON.stringify(output));
        fs.writeFileSync('ids.json', JSON.stringify(output));
    } else {
        console.log('NO_STUDENT_FOUND');
    }
}
findTarget().catch(err => {
    console.error('Error in findTarget:', err);
    process.exit(1);
});