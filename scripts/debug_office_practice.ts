
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('--- Debugging Office Practice for AC 1 ---');

  // 1. Get Class AC 1
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', 'AC 1')
    .single();

  if (classError || !classData) {
    console.error('Error finding class AC 1:', classError);
    return;
  }
  console.log('Class found:', classData);

  // 2. Get Subject "Office Practice" (Broad Search)
  const { data: subjects, error: subjError } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%Office%');
    
  if (subjError) {
    console.error('Error searching subjects:', subjError);
    return;
  }
  console.log('Subjects found matching "Office Practice":', subjects);
  
  const opSubjectId = subjects?.find(s => s.name.toLowerCase() === 'office practice')?.id;

  // 3. Check Class Subject Assignment
  const { data: assignments } = await supabase
    .from('class_subjects')
    .select('subject_id')
    .eq('class_id', classData.id);
    
  const assignedIds = assignments?.map((a: any) => a.subject_id) || [];
  console.log('Assigned Subject IDs to AC 1:', assignedIds);
  
  subjects?.forEach(s => {
      const isAssigned = assignedIds.includes(s.id);
      console.log(`Subject "${s.name}" (ID: ${s.id}) is assigned? ${isAssigned}`);
  });

  // 4. Check Teacher Assignment
  // Note: Report card logic often joins with teacher_subjects (or whatever map). 
  // Let's check if there is a teacher assigned to this subject for this class.
  const { data: teacherAssigns } = await supabase
    .from('teacher_subjects')
    .select('*')
    .eq('class_id', classData.id)
    .in('subject_id', subjects?.map(s => s.id) || []);
    
  console.log('Teacher Assignments for Office Practice in AC 1:', teacherAssigns);
  if (!teacherAssigns || teacherAssigns.length === 0) {
      console.error('❌ WARNING: NO TEACHER ASSIGNED! This might hide the subject on the report card.');
      if (opSubjectId) console.log('DEBUG: Office Practice ID is:', opSubjectId);
  } else {
      console.log('Teacher assignment found. Subject ID checked:', opSubjectId);
  }


    
  // 5. Check Grades presence (via Assessments)
  console.log('Checking for ANY grades for this subject ID: ' + opSubjectId);
  if (opSubjectId) {
    // First get assessment IDs for this subject
    const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id')
        .eq('subject_id', opSubjectId);

    if (assessError) {
        console.error('Error fetching assessments:', assessError);
    } else {
        const assessmentIds = assessments?.map(a => a.id) || [];
        console.log(`Found ${assessmentIds.length} assessments for Office Practice.`);
        
        if (assessmentIds.length > 0) {
            const { count, error: gradesError } = await supabase
                .from('grades')
                .select('*', { count: 'exact', head: true })
                .in('assessment_id', assessmentIds);
                
            if (gradesError) {
                console.error('Error counting grades:', gradesError);
            } else {
                console.log(`Found ${count} grades for Office Practice (globally).`);
            }
        }
    }
  }

}

check();
