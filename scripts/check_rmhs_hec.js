
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkRMHS() {
    console.log('--- Investigating RMHS for HEC Classes ---');

    // 1. Find HEC Classes
    const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .ilike('name', '%HEC%');
    
    if (classesError) { console.error('Error fetching classes:', classesError); return; }
    
    console.log(`Found ${classes.length} HEC classes:`, classes.map(c => c.name).join(', '));
    const classIds = classes.map(c => c.id);

    // 2. Find Subject "Resource Management on Home Studies" (or variations)
    // Try broad search first
    const { data: subjects, error: subjError } = await supabase
        .from('subjects')
        .select('id, name, code')
        .or('name.ilike.%Resource Management%,name.ilike.%RMHS%'); // Search broadly
    
    if (subjError) { console.error('Error fetching subjects:', subjError); return; }
    
    if (subjects.length === 0) {
        console.error('CRITICAL: Subject "Resource Management on Home Studies" NOT found in subjects table!');
        return;
    }
    
    console.log(`Found ${subjects.length} potential subjects:`, subjects.map(s => `${s.name} (${s.id})`));
    const subjectIds = subjects.map(s => s.id);

    // 2b. Check Branch Configuration
    console.log('\n--- Checking Branch Configuration ---');
    for (const s of subjects) {
        const { count: branches, error: bErr } = await supabase.from('subject_branches').select('*', { count: 'exact', head: true }).eq('subject_id', s.id);
        const { count: subBranches, error: sbErr } = await supabase.from('subject_sub_branches').select('*', { count: 'exact', head: true }).eq('subject_id', s.id);
        
        console.log(`Subject "${s.name}" (${s.id}):`);
        console.log(`  - Branches: ${branches || 0}`);
        console.log(`  - Sub-Branches: ${subBranches || 0}`);
        
        if ((branches && branches > 0) || (subBranches && subBranches > 0)) {
            console.warn(`  [INFO] This is a BRANCH subject. Grades should be on sub-branches?`);
        } else {
            console.log(`  [INFO] Standard subject (No branches).`);
        }
    }

    // 3. Check Class-Subject Assignments
    for (const cls of classes) {
        console.log(`\nChecking Class: ${cls.name} (${cls.id})`);
        
        const { data: classSubjects, error: csError } = await supabase
            .from('class_subjects')
            .select(`
                id, class_id, subject_id,
                subjects (name)
            `)
            .eq('class_id', cls.id)
            .in('subject_id', subjectIds);
            
        if (csError) { console.error('Error checking class_subjects:', csError); continue; }
        
        if (classSubjects.length === 0) {
            console.warn(`  [WARNING] RMHS NOT assigned to this class!`);
        } else {
            console.log(`  [OK] Assigned Subjects:`, classSubjects.map(cs => cs.subjects.name).join(', '));
        }

        // 4. Check Assessments
        // We check using subject NAME (fuzzy) because assessments use name, not ID usually
        const { data: assessments, error: assessError } = await supabase
            .from('assessments')
            .select('id, title, subject, teacher_id')
            .eq('class_id', cls.id)
            .ilike('subject', '%Resource Management%');
            
        if (assessError) { console.error('Error checking assessments:', assessError); continue; }
        
        console.log(`  Assessments found: ${assessments.length}`);
        
        // Create a summary of problems instead of logging every line
        let problems = 0;
        let validAssignments = 0;
        
        for (const a of assessments) {
            if (a.teacher_id) {
                const { data: assignment, error: assignError } = await supabase
                    .from('teacher_subjects')
                    .select('id, subject_name, is_active')
                    .eq('teacher_id', a.teacher_id)
                    .in('subject_id', subjectIds);
                    
                if (assignError) { 
                    console.error('      Error checking teacher_subjects:', assignError); 
                } else if (!assignment || assignment.length === 0) {
                     console.warn(`      [PROBLEM] Assessment "${a.title}" created by Teacher ${a.teacher_id} who is NOT assigned to RMHS!`);
                     problems++;
                } else {
                     validAssignments++;
                }
            } else {
                console.warn(`      [PROBLEM] Assessment "${a.title}" has NO teacher_id!`);
                problems++;
            }
        }
        
        if (problems > 0) {
             console.log(`      Found ${problems} assessments with INVALID/MISSING teacher assignments.`);
        } else {
             console.log(`      [OK] All ${assessments.length} assessments have valid teacher assignments.`);
        }

        if (assessments.length > 0) {
             // 5. Check Grades count for these assessments
            const assessIds = assessments.map(a => a.id);
            const { count, error: gradesError } = await supabase
                .from('grades')
                .select('*', { count: 'exact', head: true })
                .in('assessment_id', assessIds);
                
            if (gradesError) console.error('Error counting grades:', gradesError);
            else console.log(`      Total Grades found for these assessments: ${count}`);

            // NEW: Find a student in this class who has grades for these assessments
            if (count > 0) {
                const { data: gradedStudent } = await supabase
                    .from('grades')
                    .select('student_id')
                    .in('assessment_id', assessIds)
                    .limit(1)
                    .single();
                
                if (gradedStudent) {
                    console.log(`\n      [VERIFICATION TARGET] Student ID with grades: ${gradedStudent.student_id}`);
                    console.log(`      Class ID: ${cls.id}`);
                    console.log(`      Term ID: first`); 
                    console.log(`      URL: http://localhost:3000/api/admin/reports/student-report?studentId=${gradedStudent.student_id}&classId=${cls.id}&academicTermId=first`);
                }
            }
        } else {
             console.warn(`      [WARNING] No assessments found for RMHS in this class.`);
        }
    }
}

checkRMHS();
