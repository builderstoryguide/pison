const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is not set');
  process.exit(1);
}

const authKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!authKey) {
  console.error('Error: Neither SUPABASE_SERVICE_ROLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is set');
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, authKey);
async function check() {
    const classId = '3a508d31-a9de-48b9-996e-c70f0aaed8d9'; // HEC 4
    const subjectName = 'Citizenship';

    console.log(`Checking ${subjectName} for class ${classId}...`);

    // 1. Check Class Subject
    const { data: classSubjects, error: csError } = await supabase.from('class_subjects')
        .select('id, subjects!inner(name, id, subject_groupings)')
        .eq('class_id', classId)
        .ilike('subjects.name', `%${subjectName}%`);
    
    if (csError) console.error('CS Error:', csError);
    console.log('Class Subjects:', JSON.stringify(classSubjects, null, 2));

    if (!classSubjects || classSubjects.length === 0) return;
    const subjectId = classSubjects[0].subjects.id;

    // 2. Check Assessments
    const { data: assessments, error: assError } = await supabase.from('assessments')
        .select('id, title, teacher_id, subject, term, academic_year')
        .eq('class_id', classId)
        .ilike('subject', `%${subjectName}%`);
    
    if (assError) console.error('Ass Error:', assError);
    console.log('Assessments (Count):', assessments?.length || 0);

    if (!assessments || assessments.length === 0) {
        console.log('No assessments found for Citizenship.');
        return;
    }

    // 3. Check Grades
    const { data: grades, error: gError } = await supabase.from('grades')
        .select('*')
        .in('assessment_id', assessments.map(a => a.id));
    
    if (gError) console.error('Grades Error:', gError);
    console.log(`Found ${grades?.length || 0} grades.`);
}

check();
