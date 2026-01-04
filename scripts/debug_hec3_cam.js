const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugHEC3() {
    console.log('--- Debugging HEC 3 CAM ---');

    // 1. Find Class HEC 3
    const { data: classes } = await supabase.from('classes').select('id, name').ilike('name', 'HEC 3').limit(1);
    if (!classes || classes.length === 0) { console.error('HEC 3 not found'); return; }
    const hec3 = classes[0];
    console.log(`Class: ${hec3.name} (${hec3.id})`);

    // 2. Check Assigned Subjects (CAM)
    const { data: classSubjects } = await supabase.from('class_subjects')
        .select(`
            subject_id,
            subjects (id, name, code, has_sub_branches)
        `)
        .eq('class_id', hec3.id);
    
    const camAssignments = classSubjects.filter(cs => cs.subjects.name.match(/Computer Aided|CAM/i));
    console.log(`\nAssigned CAM Subjects (${camAssignments.length}):`);
    camAssignments.forEach(cs => {
        console.log(`- ${cs.subjects.name} (ID: ${cs.subjects.id})`);
        console.log(`  Target isBranch: ${cs.subjects.has_sub_branches}`);
    });

    if (camAssignments.length === 0) {
        console.error('CRITICAL: CAM is NOT assigned to HEC 3!');
    }

    // 3. Check Assessments for HEC 3 (ALL)
    const { data: assessments } = await supabase.from('assessments')
        .select('id, title, subject, teacher_id')
        .eq('class_id', hec3.id);
    
    console.log(`\nAll Assessments found (${assessments.length}):`);
    const subjects = [...new Set(assessments.map(a => a.subject))];
    subjects.forEach(s => console.log(`- "${s}"`));

    // Filter for CAM-like again for JSON
    // Match full CAM-related subject names, not partial words
    const camAssessments = assessments.filter(a => a.subject.match(/Computer Aided Management|CAM(?!\w)/i));
    if (assessments.length > 0) {
        // 4. Check Grades
        const { count } = await supabase.from('grades')
            .select('*', { count: 'exact', head: true })
            .in('assessment_id', assessments.map(a => a.id));
        console.log(`\nTotal Grades: ${count}`);
    }

    // 5. Mismatch Check
    // Report card tries to match Assessment Subject Name to Class Subject Name.
    const fs = require('fs');
    
    const output = {
        classId: hec3.id,
        camAssignments: camAssignments.map(cs => ({ name: cs.subjects.name, id: cs.subjects.id })),
        camAssessments: camAssessments.map(a => ({ subject: a.subject, id: a.id })), // Renamed key
        allAssessmentSubjects: subjects,
        match: false
    };

    if (camAssignments.length > 0 && camAssessments.length > 0) {
        const assignedName = camAssignments[0].subjects.name;
        const assessName = camAssessments[0].subject;
        output.match = assignedName.toLowerCase().trim() === assessName.toLowerCase().trim();
        output.comparison = { assigned: assignedName, assessment: assessName };
    }
    
    fs.writeFileSync('hec3_debug.json', JSON.stringify(output, null, 2));
    console.log('Written to hec3_debug.json');
}

debugHEC3();
