const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
async function findTarget() {
    // Find HEC Class
    const { data: classes, error: classesError } = await supabase.from('classes').select('id, name').ilike('name', '%HEC%').limit(1);
    if (classesError) { console.error('Error fetching classes:', classesError); return; }
    if (!classes || classes.length === 0) { console.log('NO_HEC_CLASS_FOUND'); return; }
    const cls = classes[0];

    // Find RMHS Assessments
    const { data: assessments, error: assessmentsError } = await supabase.from('assessments').select('id').eq('class_id', cls.id).ilike('subject', '%Resource Management%');
    if (assessmentsError) { console.error('Error fetching assessments:', assessmentsError); return; }
    if (!assessments || assessments.length === 0) { console.log('NO_ASSESSMENTS_FOUND'); return; }
    const ids = assessments.map(a => a.id);    if (!assessments || assessments.length === 0) return;
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