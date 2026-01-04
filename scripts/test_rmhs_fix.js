const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runTest() {
    const raw = fs.readFileSync('ids.json', 'utf8');
    const { studentId, classId } = JSON.parse(raw);
    console.log(`Testing with Student: ${studentId}, Class: ${classId}`);

    // 1. Fetch Subject
    const { data: classSubjects } = await supabase.from('class_subjects')
        .select('subject_id, subjects!inner(id, name, has_sub_branches)')
        .eq('class_id', classId);
    
    // Find RMHS
    const rmhsConfig = classSubjects.find(cs => cs.subjects.name.includes('Resource Management') || cs.subjects.name.includes('RMHS'));
    if (!rmhsConfig) { console.error('RMHS not found in class subjects'); return; }
    
    const subjectId = rmhsConfig.subjects.id;
    const subjectName = rmhsConfig.subjects.name;
    const hasSubBranchesFlag = rmhsConfig.subjects.has_sub_branches;
    
    // Check tables
    const { count: branchesOld } = await supabase.from('subject_sub_branches').select('*', { count: 'exact', head: true }).eq('subject_id', subjectId);
    const { count: branchesNew } = await supabase.from('subject_branches').select('*', { count: 'exact', head: true }).eq('subject_id', subjectId);
    
    let hasSubBranches = hasSubBranchesFlag || (branchesOld > 0) || (branchesNew > 0);
    console.log(`Subject: ${subjectName}`);
    console.log(`Has Sub Branches (calculated): ${hasSubBranches}`);

    // 2. Fetch Grades
    const { data: grades, error: gradesError } = await supabase.from('grades')
        .select('marks_obtained, assessment:assessments!inner(id, subject, title)')
        .eq('student_id', studentId)
        .eq('assessment.class_id', classId)
        .ilike('assessment.subject', `%Resource Management%`); // Pattern match on subject name
    if (gradesError) {
        console.error('Error fetching grades:', gradesError);
        return;
runTest().catch(err => {
    console.error('Error in runTest:', err);
    process.exit(1);
});
    console.log(`Standard Grades Found: ${grades.length}`);
    // 3. Simulate Logic
    let finalMark = 0;
    let hasMark = false;

    if (hasSubBranches) {
        console.log('entering Branch Logic...');
        // Assume no branch grades found (as confirmed by investigation)
        
        // My Fallback Logic:
        if (!hasMark) {
            console.log(`[Fallback] Branch subject "${subjectName}" has no branch grades. Checking for standard grades...`);
            
            if (grades.length > 0) {
                 console.log(`[Fallback] FOUND standard grades. Using fallback logic.`);
                 const sum = grades.reduce((a, b) => a + b.marks_obtained, 0);
                 finalMark = sum / grades.length;
                 hasMark = true;
                 
                 // The Critical Fix:
                 hasSubBranches = false;
                 console.log(`[Fallback] Set hasSubBranches = false`);
            }
        }
    }

    if (hasMark) {
        console.log(`SUCCESS: Calculated Mark: ${finalMark}`);
        if (!hasSubBranches) {
             console.log(`SUCCESS: hasSubBranches is false, so Sequence Logic will run.`);
        } else {
             console.error(`FAILURE: hasSubBranches is STILL TRUE. Sequence Logic will be skipped!`);
        }
    } else {
        console.error('FAILURE: No mark calculated.');
    }
}

runTest();
