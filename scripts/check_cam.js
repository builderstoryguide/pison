const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

    const { data: subjects, error: subjError } = await supabase
        .from('subjects')
        .select('id, name')
        .or('name.ilike.%Computer Aided Management%,name.ilike.%CAM%'); 

    if (subjError || !subjects || subjects.length === 0) {
        console.error('Subject not found:', subjError || 'No matching subjects');
        return;
    }
    if (subjError || !subjects || subjects.length === 0) {
        console.error('Subject not found');
        return;
checkCAM().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
    const camSubject = subjects[0]; // Assume first fit
    console.log(`Analyzing Subject: ${camSubject.name} (${camSubject.id})`);

    // 2. Check Branch Config
    const { count: branches } = await supabase.from('subject_branches').select('*', { count: 'exact', head: true }).eq('subject_id', camSubject.id);
    const { count: subBranches } = await supabase.from('subject_sub_branches').select('*', { count: 'exact', head: true }).eq('subject_id', camSubject.id);
    
    const { data: classSubjects, error: classError } = await supabase
        .from('class_subjects')
        .select('class_id, classes(id, name)')
        .eq('subject_id', camSubject.id);

    if (classError || !classSubjects || classSubjects.length === 0) {
        console.log('No class assignments found:', classError || 'No results');
        return;
    }
    if (!classSubjects || classSubjects.length === 0) {
        console.log('No class assignments found.');
        return;
    }

    // Iterate classes to find one with grades
    for (const cs of classSubjects) {
        const classId = cs.class_id;
        const className = cs.classes.name;
        
        // Check for MATCHING assessments (fuzzy name match as per report card logic)
        const { data: assessments } = await supabase
            .from('assessments')
            .select('id')
            .eq('class_id', classId)
            .ilike('subject', '%Computer Aided%');

        if (assessments && assessments.length > 0) {
            const assessIds = assessments.map(a => a.id);
            
            // Check for grades
            const { data: grade } = await supabase
                .from('grades')
                .select('student_id')
                .in('assessment_id', assessIds)
                .limit(1)
                .maybeSingle();

            if (grade) {
                console.log(`FOUND TARGET: Class ${className} (${classId}), Student ${grade.student_id}`);
                
                // Write info
                const output = {
                    subjectId: camSubject.id,
                    subjectName: camSubject.name,
                    isBranch: isBranch,
                    studentId: grade.student_id,
                    classId: classId
                };
                fs.writeFileSync('cam_info.json', JSON.stringify(output, null, 2));
                console.log('Data written to cam_info.json');
                return; // Stop after finding one valid target
            }
        }
    }
    console.log('No valid student/grade found for CAM.');
}

checkCAM();
