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

interface ClassSubjectInfo {
  className: string;
  classId: string;
  subjectName: string;
  subjectId: string;
  hasTeacher: boolean;
  teacherNames: string[];
  hasMarks: boolean;
  marksCount: number;
  sequences: {
    name: string;
    hasMarks: boolean;
    count: number;
  }[];
}

const SEQUENCES_TO_CHECK = ['First sequence', 'Second sequence'];

async function getAllClassSubjects(): Promise<ClassSubjectInfo[]> {
  const results: ClassSubjectInfo[] = [];

  // 1. Get all classes
  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id, name')
    .order('name');

  if (classError) {
    console.error('Error fetching classes:', classError);
    return [];
  }

  console.log(`Found ${classes?.length || 0} classes\n`);

  // 2. For each class, get subjects
  for (const cls of classes || []) {
    const { data: classSubjects, error: csError } = await supabase
      .from('class_subjects')
      .select(`
        subject_id,
        subjects (
          id,
          name
        )
      `)
      .eq('class_id', cls.id);

    if (csError) {
      console.error(`Error fetching subjects for class ${cls.name}:`, csError);
      continue;
    }

    for (const cs of classSubjects || []) {
      const subjectData = cs.subjects as any;
      if (!subjectData) continue;

      results.push({
        className: cls.name,
        classId: cls.id,
        subjectName: subjectData.name,
        subjectId: subjectData.id,
        hasTeacher: false,
        teacherNames: [],
        hasMarks: false,
        marksCount: 0,
        sequences: [],
      });
    }
  }

  return results;
}

async function checkTeacherAssignments(classSubjects: ClassSubjectInfo[]): Promise<void> {
  console.log('\n========================================');
  console.log('CHECKING TEACHER ASSIGNMENTS');
  console.log('========================================\n');

  // Get all teacher_subjects assignments
  const { data: teacherSubjects, error: tsError } = await supabase
    .from('teacher_subjects')
    .select(`
      id,
      teacher_id,
      subject_id,
      subject_name,
      is_active,
      teachers!teacher_subjects_teacher_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq('is_active', true);

  if (tsError) {
    console.error('Error fetching teacher_subjects:', tsError);
    // Try alternative approach
    const { data: altTeacherSubjects, error: altError } = await supabase
      .from('teacher_subjects')
      .select('id, teacher_id, subject_id, subject_name, is_active')
      .eq('is_active', true);
    
    if (altError) {
      console.error('Alternative query also failed:', altError);
    } else {
      console.log(`Found ${altTeacherSubjects?.length || 0} teacher-subject assignments (without teacher names)`);
      
      // Get teachers separately
      const teacherIds = [...new Set(altTeacherSubjects?.map(ts => ts.teacher_id) || [])];
      const { data: teachers } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .in('id', teacherIds);
      
      const teacherMap = new Map(teachers?.map(t => [t.id, `${t.first_name} ${t.last_name}`]) || []);
      
      // Map subjects to teachers
      for (const cs of classSubjects) {
        const assignments = altTeacherSubjects?.filter(
          ts => ts.subject_id === cs.subjectId || 
                (ts.subject_name && ts.subject_name.toLowerCase() === cs.subjectName.toLowerCase())
        ) || [];

        if (assignments.length > 0) {
          cs.hasTeacher = true;
          cs.teacherNames = assignments.map(a => teacherMap.get(a.teacher_id) || 'Unknown').filter(Boolean) as string[];
        }
      }
    }
  } else {
    console.log(`Found ${teacherSubjects?.length || 0} teacher-subject assignments`);
    
    // Map subjects to teachers
    for (const cs of classSubjects) {
      const assignments = teacherSubjects?.filter(
        ts => ts.subject_id === cs.subjectId || 
              (ts.subject_name && ts.subject_name.toLowerCase() === cs.subjectName.toLowerCase())
      ) || [];

      if (assignments.length > 0) {
        cs.hasTeacher = true;
        cs.teacherNames = assignments
          .map(a => {
            const teacher = (a as any).teachers;
            return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown';
          })
          .filter(Boolean);
      }
    }
  }

  // Also check teacher_branch_assignments
  const { data: branchAssignments, error: baError } = await supabase
    .from('teacher_branch_assignments')
    .select(`
      id,
      teacher_id,
      branch_id,
      class_id,
      status,
      subject_branches (
        id,
        name,
        subject_id
      )
    `)
    .eq('status', 'active');

  if (!baError && branchAssignments) {
    console.log(`Found ${branchAssignments.length} teacher-branch assignments`);
    
    // Get teacher names
    const teacherIds = [...new Set(branchAssignments.map(ba => ba.teacher_id))];
    const { data: teachers } = await supabase
      .from('teachers')
      .select('id, first_name, last_name')
      .in('id', teacherIds);
    
    const teacherMap = new Map(teachers?.map(t => [t.id, `${t.first_name} ${t.last_name}`]) || []);

    for (const cs of classSubjects) {
      const relevantAssignments = branchAssignments.filter(ba => {
        const branch = ba.subject_branches as any;
        return ba.class_id === cs.classId && branch?.subject_id === cs.subjectId;
      });

      if (relevantAssignments.length > 0) {
        cs.hasTeacher = true;
        const names = relevantAssignments.map(a => teacherMap.get(a.teacher_id)).filter(Boolean) as string[];
        cs.teacherNames = [...new Set([...cs.teacherNames, ...names])];
      }
    }
  }
}

async function checkMarks(classSubjects: ClassSubjectInfo[]): Promise<void> {
  console.log('\n========================================');
  console.log('CHECKING MARKS/GRADES');
  console.log('========================================\n');

  for (const cs of classSubjects) {
    cs.sequences = [];

    for (const sequence of SEQUENCES_TO_CHECK) {
      // Find assessments for this class and subject
      const { data: assessments, error: assessError } = await supabase
        .from('assessments')
        .select('id, title, subject, total_marks')
        .eq('class_id', cs.classId)
        .ilike('subject', `%${cs.subjectName}%`)
        .ilike('title', `%${sequence}%`);

      if (assessError) {
        cs.sequences.push({ name: sequence, hasMarks: false, count: 0 });
        continue;
      }

      let hasMarks = false;
      let totalCount = 0;

      if (assessments && assessments.length > 0) {
        for (const assessment of assessments) {
          const { count, error: countError } = await supabase
            .from('grades')
            .select('*', { count: 'exact', head: true })
            .eq('assessment_id', assessment.id);

          if (!countError && count && count > 0) {
            hasMarks = true;
            totalCount += count;
          }
        }
      }

      cs.sequences.push({ name: sequence, hasMarks, count: totalCount });
      
      if (hasMarks) {
        cs.hasMarks = true;
        cs.marksCount += totalCount;
      }
    }
  }
}

function printReport(classSubjects: ClassSubjectInfo[]): void {
  console.log('\n\n========================================');
  console.log('VERIFICATION REPORT');
  console.log('========================================\n');

  // Group by class
  const byClass = new Map<string, ClassSubjectInfo[]>();
  for (const cs of classSubjects) {
    if (!byClass.has(cs.className)) {
      byClass.set(cs.className, []);
    }
    byClass.get(cs.className)!.push(cs);
  }

  // PART 1: Subjects without teachers
  console.log('\n📚 SUBJECTS WITHOUT TEACHERS ASSIGNED:');
  console.log('─'.repeat(60));
  
  let noTeacherCount = 0;
  const noTeacherByClass = new Map<string, string[]>();

  for (const [className, subjects] of byClass) {
    const withoutTeacher = subjects.filter(s => !s.hasTeacher);
    if (withoutTeacher.length > 0) {
      noTeacherByClass.set(className, withoutTeacher.map(s => s.subjectName));
      noTeacherCount += withoutTeacher.length;
    }
  }

  if (noTeacherCount === 0) {
    console.log('✅ All subjects have teachers assigned!\n');
  } else {
    console.log(`❌ Found ${noTeacherCount} subject(s) without teachers:\n`);
    
    for (const [className, subjects] of noTeacherByClass) {
      console.log(`\n  📍 ${className}:`);
      for (const subject of subjects) {
        console.log(`     ❌ ${subject}`);
      }
    }
  }

  // PART 2: Subjects without marks
  console.log('\n\n📝 SUBJECTS WITHOUT MARKS FILLED:');
  console.log('─'.repeat(60));
  
  let noMarksCount = 0;
  const noMarksByClass = new Map<string, { subject: string; sequences: string[] }[]>();

  for (const [className, subjects] of byClass) {
    const withoutMarks: { subject: string; sequences: string[] }[] = [];
    
    for (const s of subjects) {
      const missingSequences = s.sequences.filter(seq => !seq.hasMarks).map(seq => seq.name);
      if (missingSequences.length > 0) {
        withoutMarks.push({ subject: s.subjectName, sequences: missingSequences });
        noMarksCount++;
      }
    }
    
    if (withoutMarks.length > 0) {
      noMarksByClass.set(className, withoutMarks);
    }
  }

  if (noMarksCount === 0) {
    console.log('✅ All subjects have marks filled for all sequences!\n');
  } else {
    console.log(`❌ Found ${noMarksCount} subject(s) with missing marks:\n`);
    
    for (const [className, subjects] of noMarksByClass) {
      console.log(`\n  📍 ${className}:`);
      for (const item of subjects) {
        console.log(`     ❌ ${item.subject}`);
        console.log(`        Missing: ${item.sequences.join(', ')}`);
      }
    }
  }

  // SUMMARY
  console.log('\n\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total Classes: ${byClass.size}`);
  console.log(`Total Class-Subject combinations: ${classSubjects.length}`);
  console.log(`Subjects without teachers: ${noTeacherCount}`);
  console.log(`Subjects with missing marks: ${noMarksCount}`);
}

async function main() {
  console.log('🔍 Starting Subject/Teacher/Marks Verification...\n');
  console.log('This script checks:');
  console.log('  1. Which subjects do NOT have a teacher assigned');
  console.log('  2. Which subjects do NOT have marks filled\n');

  // Step 1: Get all class-subject combinations
  console.log('Step 1: Fetching all class-subject assignments...');
  const classSubjects = await getAllClassSubjects();
  console.log(`Found ${classSubjects.length} class-subject combinations`);

  if (classSubjects.length === 0) {
    console.log('No class subjects found. Please check database.');
    return;
  }

  // Step 2: Check teacher assignments
  console.log('\nStep 2: Checking teacher assignments...');
  await checkTeacherAssignments(classSubjects);

  // Step 3: Check marks
  console.log('\nStep 3: Checking marks/grades...');
  await checkMarks(classSubjects);

  // Step 4: Print report
  printReport(classSubjects);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
