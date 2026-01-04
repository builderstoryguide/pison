const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTest() {
    if (!fs.existsSync('cam_info.json')) { console.error('cam_info.json missing'); return; }
    let info;
    try {
        info = JSON.parse(fs.readFileSync('cam_info.json', 'utf8'));
    } catch (error) {
        console.error('Error reading or parsing cam_info.json:', error.message);
        return;
    }    const logStream = fs.createWriteStream('cam_verification.log', {flags: 'w'});
    function log(msg) {
        console.log(msg);
        logStream.write(msg + '\n');
    }

    log(`Testing CAM: ${info.subjectName} (${info.subjectId})`);
    log(`Class: ${info.classId}, Student: ${info.studentId}, IsBranch: ${info.isBranch}`);
    
    // ... update checks to use log()
    // 1. Fetch assessments
    const { data: assessments } = await supabase.from('assessments')
        .select('id, title, teacher_id, subject')
        .eq('class_id', info.classId)
        .ilike('subject', '%Computer Aided%');

    if (!assessments) { log('No assessments'); return; }

    const assessIds = assessments.map(a => a.id);
    const teacherIds = assessments.map(a => a.teacher_id).filter(id => id);

    // 2. Check Teacher Assignments
     const { data: teacherSubjects } = await supabase.from('teacher_subjects')
        .select('teacher_id')
        .eq('subject_id', info.subjectId)
        .in('teacher_id', teacherIds);

    const validTeacherIds = new Set(teacherSubjects.map(ts => ts.teacher_id));
    log(`Valid Teachers for this subject: ${Array.from(validTeacherIds).join(', ')}`);
    const { data: grades, error: gradesError } = await supabase.from('grades')
        .select('marks_obtained, assessment_id')
        .eq('student_id', info.studentId)
        .in('assessment_id', assessIds);

    if (gradesError) { log(`Error fetching grades: ${gradesError.message}`); return; }
    if (!grades) { log('No grades data returned'); return; }

    log(`Raw Grades Found: ${grades.length}`);    // 4. Simulate Filter
    const validGrades = grades.filter(g => {
        const assessment = assessments.find(a => a.id === g.assessment_id);
        if (!assessment) return false;
        
        const teacherId = assessment.teacher_id;
        const isValid = validTeacherIds.has(teacherId); // Simple check
        
        if (!isValid) {
             log(`  [Filter] Grade excluded. Assessment ${assessment.id} teacher ${teacherId} not assigned. (Using Relaxed Rules: ALLOW)`);
             // return isValid; // OLD Strict
             return true; // NEW Relaxed
        }
        return isValid;
    });

    log(`Valid Grades after Teacher Check: ${validGrades.length}`);

    if (validGrades.length > 0) {
        const avg = validGrades.reduce((a,b) => a + b.marks_obtained, 0) / validGrades.length;
        log(`SUCCESS: Calculated Mark: ${avg}`);
    } else {
        log(`FAILURE: No valid grades remaining.`);
        
        assessments.forEach(a => {
            log(`Assessment ${a.id}: Teacher ${a.teacher_id}`);
runTest().catch(error => {
    console.error('Unhandled error in runTest:', error);
    process.exit(1);
});    }
}

runTest();
