const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function format() {
    const classId = '3a508d31-a9de-48b9-996e-c70f0aaed8d9'; // HEC 4
    const studentId = '1ebff7c4-d950-4fef-8d14-f6a1428f3d43';

    console.log('--- Debugging HEC 4 CAM Deep Dive ---');

    // 1. Class Subjects
const { data: classSubjects, error: classSubjectsError } = await supabase.from('class_subjects')
    .select('id, subject_id, coefficient, subjects(id, name, code, has_sub_branches)')
    .eq('class_id', classId);

if (classSubjectsError) {
  console.error('Error fetching class subjects:', classSubjectsError);
  process.exit(1);
}

if (!classSubjects) {
  console.error('No class subjects data returned');
  process.exit(1);
}

const camSubjects = classSubjects.filter(cs => cs.subjects?.name?.match(/Computer|CAM/i));
console.log('Class Subjects (CAM):', JSON.stringify(camSubjects, null, 2));
    // 2. Assessments (Global for this class)
    const { data: assessments } = await supabase.from('assessments')
        .select('*')
        .eq('class_id', classId)
        .ilike('subject', '%Computer%');
    
    console.log('Assessments (CAM):', JSON.stringify(assessments, null, 2));

    // 3. Grades
    const assessmentIds = assessments.map(a => a.id);
    
    if (assessmentIds.length === 0) {
      console.warn('No assessment IDs found, skipping grades fetch');
      const output = {
        classSubjects: camSubjects,
        assessments: [],
        gradesCount: 0,
        gradeSample: [],
      };
      fs.writeFileSync('hec4_debug.json', JSON.stringify(output, null, 2));
      console.log('Written to hec4_debug.json');
      return;
    }
    
    const { data: grades, error: gradesError } = await supabase.from('grades')
        .select('*')
        .eq('student_id', studentId)
        .in('assessment_id', assessmentIds);
    
    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
format().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});    }
    
    if (!grades) {
      console.error('No grades data returned');
      process.exit(1);
    }
    
    console.log('Grades found:', grades.length);
    console.log(JSON.stringify(grades, null, 2));
    const output = {
        classSubjects: camSubjects,
        assessments: assessments.map(a => ({
            id: a.id,
            title: a.title,
            subject: a.subject,
            term: a.term,
            academic_year: a.academic_year,
            type: a.type
        })),
        gradesCount: grades.length,
        gradeSample: grades.slice(0, 1),
    };
    
    fs.writeFileSync('hec4_debug.json', JSON.stringify(output, null, 2));
    console.log('Written to hec4_debug.json');
}

format().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});