import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Please check .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const CLASS_NAME = 'AC 1';
const SUBJECT_NAME = 'Office Practice';
const SEQUENCES = ['First sequence', '1st Sequence', 'Second sequence', '2nd Sequence'];

async function verifyMarks() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Verifying marks for ${CLASS_NAME} - ${SUBJECT_NAME}`);
  console.log(`Checking sequences: First and Second`);
  console.log(`${'='.repeat(60)}\n`);

  // 1. Get Class ID
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .ilike('name', CLASS_NAME);

  if (classError || !classes || classes.length === 0) {
    console.error(`❌ Class "${CLASS_NAME}" not found`);
    return;
  }
  const classId = classes[0].id;
  console.log(`✅ Found Class: ${classes[0].name} (ID: ${classId})\n`);

  // 2. Get Subject "Office Practice"
  const { data: subjects, error: subjError } = await supabase
    .from('subjects')
    .select('id, name')
    .ilike('name', '%Office%');

  if (subjError) {
    console.error('❌ Error searching subjects:', subjError);
    return;
  }

  if (!subjects || subjects.length === 0) {
    console.error(`❌ Subject "${SUBJECT_NAME}" not found`);
    return;
  }

  // Find exact match or closest match
  const officePracticeSubject = subjects.find(
    s => s.name.toLowerCase().includes('office practice') || 
         s.name.toLowerCase() === 'office practice'
  ) || subjects[0];

  console.log(`✅ Found Subject: ${officePracticeSubject.name} (ID: ${officePracticeSubject.id})\n`);

  // 3. Find Teacher who teaches Office Practice for AC 1
  console.log('🔍 Finding teacher assignment...\n');
  
  let teacherId: string | null = null;
  let teacherName: string | null = null;
  let teacherUserId: string | null = null;
  let assignmentType: string | null = null;

  // Method 1: Check teacher_branch_assignments (newer schema)
  console.log('   Checking teacher_branch_assignments...');
  const { data: branchAssignments, error: baError } = await supabase
    .from('teacher_branch_assignments')
    .select(`
      teacher_id,
      class_id,
      academic_year,
      term,
      subject_branches!inner(
        subject_id,
        subjects!inner(id, name)
      )
    `)
    .eq('class_id', classId)
    .eq('status', 'active');

  if (baError) {
    console.log(`   ⚠️  Error querying branch assignments: ${baError.message}`);
  } else if (branchAssignments && branchAssignments.length > 0) {
    console.log(`   Found ${branchAssignments.length} branch assignment(s) for AC 1`);
    for (const assignment of branchAssignments) {
      const branch = assignment.subject_branches as any;
      const subject = branch?.subjects as any;
      if (subject && subject.id === officePracticeSubject.id) {
        teacherId = assignment.teacher_id; // This is teachers.id, not users.id
        assignmentType = 'branch_assignment';
        console.log(`   ✅ Found branch assignment for Office Practice`);
        break;
      }
    }
  } else {
    console.log(`   No branch assignments found`);
  }

  // Method 2: Check teacher_subjects (older schema) - check by subject_id
  if (!teacherId) {
    console.log('\n   Checking teacher_subjects by subject_id...');
    const { data: teacherSubjects, error: tsError } = await supabase
      .from('teacher_subjects')
      .select('teacher_id, subject_id, subject_name, is_active')
      .eq('subject_id', officePracticeSubject.id)
      .eq('is_active', true);

    if (tsError) {
      console.log(`   ⚠️  Error querying teacher_subjects: ${tsError.message}`);
    } else if (teacherSubjects && teacherSubjects.length > 0) {
      console.log(`   Found ${teacherSubjects.length} teacher_subject assignment(s)`);
      // Get all unique teacher IDs
      const teacherUserIds = [...new Set(teacherSubjects.map(ts => ts.teacher_id))];
      teacherUserId = teacherUserIds[0]; // Take first one
      assignmentType = 'teacher_subject';
      console.log(`   ✅ Found teacher_subject assignment for Office Practice`);
    } else {
      console.log(`   No teacher_subject assignments found by subject_id`);
    }
  }

  // Method 3: Check teacher_subjects by subject_name (fallback)
  if (!teacherId && !teacherUserId) {
    console.log('\n   Checking teacher_subjects by subject_name...');
    const { data: teacherSubjectsByName, error: tsNameError } = await supabase
      .from('teacher_subjects')
      .select('teacher_id, subject_name, is_active')
      .ilike('subject_name', '%Office%')
      .eq('is_active', true);

    if (tsNameError) {
      console.log(`   ⚠️  Error querying by name: ${tsNameError.message}`);
    } else if (teacherSubjectsByName && teacherSubjectsByName.length > 0) {
      console.log(`   Found ${teacherSubjectsByName.length} teacher_subject assignment(s) by name`);
      const teacherUserIds = [...new Set(teacherSubjectsByName.map(ts => ts.teacher_id))];
      teacherUserId = teacherUserIds[0];
      assignmentType = 'teacher_subject_by_name';
      console.log(`   ✅ Found teacher_subject assignment by name for Office Practice`);
    } else {
      console.log(`   No teacher_subject assignments found by name`);
    }
  }

  // Get teacher details
  if (teacherId) {
    // Get teacher info from teachers table
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('user_id, first_name, last_name, email')
      .eq('id', teacherId)
      .single();
    
    if (teacherError) {
      console.log(`   ⚠️  Error fetching teacher details: ${teacherError.message}`);
    } else         if (teacher) {
          teacherUserId = teacher.user_id;
          teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
          if (!teacherName || teacherName.trim() === '') {
            // Try to get from users table
            if (teacher.user_id) {
              const { data: user } = await supabase
                .from('users')
                .select('name')
                .eq('id', teacher.user_id)
                .single();
              if (user && user.name) {
                teacherName = user.name;
              }
            }
          }
        }
  } else if (teacherUserId) {
    // Get teacher info from users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', teacherUserId)
      .single();
    
    if (userError) {
      console.log(`   ⚠️  Error fetching user details: ${userError.message}`);
    } else if (user) {
      teacherName = user.name || 'Unknown';
      
      // Also try to get from teachers table for more details
      const { data: teacher } = await supabase
        .from('teachers')
        .select('first_name, last_name')
        .eq('user_id', teacherUserId)
        .single();
      
      if (teacher) {
        const teacherFullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
        if (teacherFullName && (!teacherName || teacherName === 'Unknown')) {
          teacherName = teacherFullName;
        }
      }
    }
  }

  // Check if teacher is assigned to AC 1 specifically
  let assignedToAC1 = false;
  if (teacherUserId) {
    // Check teacher_branch_assignments for AC 1
    const { data: ac1BranchAssignments } = await supabase
      .from('teacher_branch_assignments')
      .select('class_id, subject_branches!inner(subject_id)')
      .eq('teacher_id', teacherId || '')
      .eq('class_id', classId)
      .eq('status', 'active');
    
    if (ac1BranchAssignments && ac1BranchAssignments.length > 0) {
      assignedToAC1 = true;
    } else {
      // Check if teacher_subjects has class_id (if that column exists)
      const { data: teacherSubjWithClass } = await supabase
        .from('teacher_subjects')
        .select('class_id, subject_id')
        .eq('teacher_id', teacherUserId)
        .eq('subject_id', officePracticeSubject.id)
        .eq('is_active', true);
      
      // If teacher_subjects doesn't have class_id, assume it's a general assignment
      // In that case, we'll note that it's a general assignment
      if (teacherSubjWithClass && teacherSubjWithClass.length > 0) {
        const hasClassId = teacherSubjWithClass.some(ts => ts.class_id);
        assignedToAC1 = hasClassId ? teacherSubjWithClass.some(ts => ts.class_id === classId) : true; // If no class_id, assume general assignment
      }
    }
  }

  // Final output
  console.log('\n' + '='.repeat(60));
  if (teacherName) {
    console.log(`✅ TEACHER FOUND: ${teacherName}`);
    if (teacherUserId) {
      console.log(`   User ID: ${teacherUserId}`);
    }
    if (teacherId) {
      console.log(`   Teacher Record ID: ${teacherId}`);
    }
    if (assignmentType) {
      console.log(`   Assignment Type: ${assignmentType}`);
    }
    if (assignedToAC1) {
      console.log(`   ✅ Assigned to AC 1: Yes`);
    } else {
      console.log(`   ⚠️  Assigned to AC 1: General assignment (not class-specific)`);
      console.log(`      Note: Teacher is assigned to Office Practice but may not be specifically assigned to AC 1`);
    }
  } else {
    console.log('❌ NO TEACHER ASSIGNMENT FOUND');
    console.log('   No active teacher assignment found for Office Practice in AC 1');
    console.log('   This may explain why no marks have been submitted.');
  }
  console.log('='.repeat(60) + '\n');

  // 4. Check if any assessments exist that might indicate a teacher
  console.log('🔍 Checking for any assessments that might indicate a teacher...\n');
  const { data: allAssessments, error: allAssessError } = await supabase
    .from('assessments')
    .select('id, title, subject, total_marks, assessment_date, created_at, teacher_id')
    .eq('class_id', classId)
    .ilike('subject', `%${officePracticeSubject.name}%`)
    .order('created_at', { ascending: false });

  if (allAssessError) {
    console.error('❌ Error fetching assessments:', allAssessError);
  } else if (allAssessments && allAssessments.length > 0) {
    console.log(`ℹ️  Found ${allAssessments.length} assessment(s) for Office Practice in AC 1:`);
    allAssessments.forEach(a => {
      console.log(`   - "${a.title}" (Subject: ${a.subject}, Date: ${a.assessment_date}, Teacher ID: ${a.teacher_id || 'N/A'})`);
    });
    
    // If we found assessments with teacher_id but didn't find teacher assignment, try to get teacher name from assessment
    if (!teacherName && allAssessments.some(a => a.teacher_id)) {
      const assessmentTeacherId = allAssessments.find(a => a.teacher_id)?.teacher_id;
      if (assessmentTeacherId) {
        console.log(`\n   🔍 Found teacher_id in assessment, looking up teacher...`);
        const { data: user } = await supabase
          .from('users')
          .select('full_name, name, email')
          .eq('id', assessmentTeacherId)
          .single();
        
        if (user) {
          const nameFromAssessment = user.name;
          if (nameFromAssessment) {
            teacherName = nameFromAssessment;
            teacherUserId = assessmentTeacherId;
            console.log(`   ✅ Found teacher from assessment: ${teacherName}`);
            
            // Also try to get from teachers table for more details
            const { data: teacher } = await supabase
              .from('teachers')
              .select('first_name, last_name')
              .eq('user_id', assessmentTeacherId)
              .single();
            
            if (teacher) {
              const teacherFullName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim();
              if (teacherFullName) {
                teacherName = teacherFullName;
              }
            }
          }
        }
      }
    }
    console.log('');
  } else {
    console.log('⚠️  No assessments found at all for Office Practice in AC 1\n');
  }

  // 5. Check for First and Second Sequence assessments
  console.log('🔍 Checking for sequence assessments...\n');

  const sequenceChecks = [
    { name: 'First Sequence', patterns: ['First sequence', '1st Sequence', '1st sequence', 'First Sequence', 'first sequence'] },
    { name: 'Second Sequence', patterns: ['Second sequence', '2nd Sequence', '2nd sequence', 'Second Sequence', 'second sequence'] }
  ];

  for (const seqCheck of sequenceChecks) {
    console.log(`\n${'-'.repeat(60)}`);
    console.log(`Checking: ${seqCheck.name}`);
    console.log(`${'-'.repeat(60)}`);

    let foundAssessment = null;
    let assessmentTitle = '';

    // Try each pattern
    for (const pattern of seqCheck.patterns) {
      const query = supabase
        .from('assessments')
        .select('id, title, subject, total_marks, assessment_date, created_at, teacher_id')
        .eq('class_id', classId)
        .ilike('subject', `%${officePracticeSubject.name}%`)
        .ilike('title', `%${pattern}%`);

      // Add teacher filter if we found a teacher (use teacherUserId for assessments table)
      if (teacherUserId) {
        query.eq('teacher_id', teacherUserId);
      }

      const { data: assessments, error: assessError } = await query;

      if (assessError) {
        console.error(`   ❌ Error searching assessments:`, assessError);
        continue;
      }

      if (assessments && assessments.length > 0) {
        foundAssessment = assessments[0];
        assessmentTitle = foundAssessment.title;
        break;
      }
    }

    // If not found with teacher filter, try without
    if (!foundAssessment && teacherUserId) {
      for (const pattern of seqCheck.patterns) {
        const { data: assessments, error: assessError } = await supabase
          .from('assessments')
          .select('id, title, subject, total_marks, assessment_date, created_at, teacher_id')
          .eq('class_id', classId)
          .ilike('subject', `%${officePracticeSubject.name}%`)
          .ilike('title', `%${pattern}%`);

        if (!assessError && assessments && assessments.length > 0) {
          foundAssessment = assessments[0];
          assessmentTitle = foundAssessment.title;
          break;
        }
      }
    }

    if (!foundAssessment) {
      console.log(`   ❌ No assessment found for "${seqCheck.name}"`);
      continue;
    }

    console.log(`   ✅ Assessment found: "${assessmentTitle}"`);
    console.log(`      Subject: ${foundAssessment.subject}`);
    console.log(`      Total Marks: ${foundAssessment.total_marks}`);
    console.log(`      Assessment Date: ${foundAssessment.assessment_date}`);
    console.log(`      Created At: ${foundAssessment.created_at}`);
    if (foundAssessment.teacher_id) {
      console.log(`      Teacher ID: ${foundAssessment.teacher_id}`);
    }

    // 6. Check if grades were submitted
    const { count, error: countError } = await supabase
      .from('grades')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', foundAssessment.id);

    if (countError) {
      console.error(`   ❌ Error counting grades:`, countError);
    } else {
      const hasMarks = (count || 0) > 0;
      const status = hasMarks ? '✅ SUBMITTED' : '❌ NOT SUBMITTED';
      console.log(`   ${status}`);
      console.log(`      Grades Recorded: ${count || 0}`);

      if (hasMarks) {
        // Get sample of grades to verify
        const { data: sampleGrades } = await supabase
          .from('grades')
          .select('student_name, marks_obtained')
          .eq('assessment_id', foundAssessment.id)
          .limit(3);

        if (sampleGrades && sampleGrades.length > 0) {
          console.log(`      Sample grades:`);
          sampleGrades.forEach(g => {
            console.log(`         - ${g.student_name}: ${g.marks_obtained}`);
          });
        }
      }
    }
  }

  // 7. Final check: List ALL assessments for AC 1 to see what subjects exist
  console.log(`\n${'-'.repeat(60)}`);
  console.log('Final Check: All assessments for AC 1');
  console.log(`${'-'.repeat(60)}`);
  const { data: allAC1Assessments, error: ac1Error } = await supabase
    .from('assessments')
    .select('id, title, subject, class_id, teacher_id, created_at')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (!ac1Error && allAC1Assessments && allAC1Assessments.length > 0) {
    console.log(`\nFound ${allAC1Assessments.length} assessment(s) for AC 1:`);
    const subjects = new Set(allAC1Assessments.map(a => a.subject));
    console.log(`\nSubjects found in assessments: ${Array.from(subjects).join(', ')}`);
    console.log(`\nSample assessments:`);
    allAC1Assessments.slice(0, 5).forEach(a => {
      console.log(`   - "${a.title}" | Subject: "${a.subject}"`);
    });
  } else {
    console.log('\n⚠️  No assessments found at all for AC 1');
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('Verification Complete');
  console.log(`${'='.repeat(60)}\n`);
}

verifyMarks().catch(console.error);
