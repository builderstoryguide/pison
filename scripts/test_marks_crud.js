const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runCrudTest() {
  const classId = '8fe6b8a4-0eba-4e52-8813-32975299b206'; // AC 4
  const studentId = '282f92a1-20e9-4834-825c-21eb46ab2350'; // FESSI SOH DIEUDONNE
  const subjectName = 'General Mathematics';
  const sequenceName = 'First Sequence';
  const testMark1 = 15.5;
  const testMark2 = 18.0;

  console.log('--- STARTING STUDENT MARKS CRUD TEST ---');

  try {
    // 1. Initial State - Check if assessment exists
    console.log(`Step 1: Checking for assessment: ${classId}, ${subjectName}, ${sequenceName}`);
    let { data: assessment, error: aError } = await supabase
      .from('assessments')
      .select('id, total_marks')
      .eq('class_id', classId)
      .eq('subject', subjectName)
      .eq('title', sequenceName)
      .maybeSingle();

    if (aError) throw aError;
    
    if (assessment) {
      console.log(`Assessment found: ${assessment.id}`);
    } else {
      console.log('Assessment not found, will be created via API during POST if needed (or we can create it here for cleaner manual test but let\'s simulate the route logic)');
    }

    // 2. CREATE / UPDATE (via API simulation or direct DB if route is hard to call without real session)
    // Actually, I can't easily call the API route from a script due to authenticateUser(request) which needs a real request object.
    // So I will simulate the DB operations that the route performs to verify the DB constraints and logic.
    
    console.log(`Step 2: Entering mark ${testMark1} for student ${studentId}`);
    
    // Mimic handleRegularSubjectMark logic
    if (!assessment) {
      console.log('Creating assessment...');
      const { data: newAssessment, error: createAError } = await supabase
        .from('assessments')
        .insert({
          title: sequenceName,
          type: 'test',
          subject: subjectName,
          class_id: classId,
          teacher_id: 'fbefe12d-39d0-4794-898d-3f6974955ded', // Dummy teacher ID for test
          total_marks: 20,
          status: 'published',
          assessment_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();
      if (createAError) throw createAError;
      assessment = newAssessment;
      console.log(`Assessment created: ${assessment.id}`);
    }

    // Check for existing grade
    const { data: existingGrade } = await supabase
      .from('grades')
      .select('id')
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingGrade) {
      console.log(`Updating existing grade: ${existingGrade.id}`);
      const { error: uError } = await supabase
        .from('grades')
        .update({
          marks_obtained: testMark1,
          percentage: (testMark1 / 20) * 100,
          grade_letter: 'B+', // Simple calculation for test
          remarks: 'Very Good',
        })
        .eq('id', existingGrade.id);
      if (uError) throw uError;
    } else {
      console.log('Inserting new grade...');
      const { error: iError } = await supabase
        .from('grades')
        .insert({
          assessment_id: assessment.id,
          student_id: studentId,
          marks_obtained: testMark1,
          percentage: (testMark1 / 20) * 100,
          grade_letter: 'B+',
          remarks: 'Very Good',
          submitted_at: new Date().toISOString(),
        });
      if (iError) throw iError;
    }

    // 3. READ
    console.log('Step 3: Reading mark back...');
    const { data: readGrade, error: rError } = await supabase
      .from('grades')
      .select('marks_obtained, remarks')
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId)
      .single();

    if (rError) throw rError;
    console.log(`Read success: Mark = ${readGrade.marks_obtained}, Remarks = ${readGrade.remarks}`);
    if (readGrade.marks_obtained !== testMark1) throw new Error('Mark mismatch after create/update');

    // 4. UPDATE
    console.log(`Step 4: Updating mark to ${testMark2}...`);
    const { error: uError2 } = await supabase
      .from('grades')
      .update({
        marks_obtained: testMark2,
        percentage: (testMark2 / 20) * 100,
        grade_letter: 'A',
        remarks: 'Excellent',
      })
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId);
    
    if (uError2) throw uError2;

    // Verify update
    const { data: readGrade2, error: rError2 } = await supabase
      .from('grades')
      .select('marks_obtained')
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId)
      .single();

    if (rError2) throw rError2;
    console.log(`Update success: Mark = ${readGrade2.marks_obtained}`);
    if (readGrade2.marks_obtained !== testMark2) throw new Error('Mark mismatch after update');

    // 5. DELETE (Clear)
    console.log('Step 5: Deleting (clearing) mark...');
    const { error: dError } = await supabase
      .from('grades')
      .delete()
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId);
    
    if (dError) throw dError;

    // Verify deletion
    const { data: readGrade3, error: rError3 } = await supabase
      .from('grades')
      .select('*')
      .eq('assessment_id', assessment.id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (rError3) throw rError3;
    if (readGrade3) throw new Error('Grade still exists after deletion');
    console.log('Delete success: Grade record removed.');

    console.log('--- CRUD TEST PASSED SUCCESSFULLY ---');

  } catch (err) {
    console.error('--- CRUD TEST FAILED ---');
    console.error(err);
    process.exit(1);
  }
}

runCrudTest();
