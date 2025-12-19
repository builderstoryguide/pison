/* eslint-disable no-console */
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

interface StudentMark {
  studentId: string;
  studentName: string;
  matricule?: string;
  firstSequence?: {
    marks: number;
    totalMarks?: number;
    percentage?: number;
  };
  secondSequence?: {
    marks: number;
    totalMarks?: number;
    percentage?: number;
  };
}

interface ClassMarks {
  className: string;
  classId: string;
  subjectName: string;
  students: StudentMark[];
}

// Normalize subject name for matching
function normalizeSubjectName(name: string): string {
  return name.toLowerCase().trim();
}

// Check if subject name matches "Building construction"
// Since there's no exact "Building Construction" subject, we'll match:
// - "Construction process and Building practice (CPB)" - closest match
// - Any subject with "building construction" in the name (excluding drawing)
function isBuildingConstruction(subjectName: string): boolean {
  const normalized = normalizeSubjectName(subjectName);
  // Match CPB (Construction process and Building practice) as it's the closest to "Building construction"
  // Also match any subject with "building construction" but exclude "Building Construction Drawing" and "BCD"
  return (normalized.includes('construction process and building practice') ||
          normalized.includes('cpb') ||
          (normalized.includes('building construction') && 
           !normalized.includes('drawing') && 
           !normalized.includes('bcd')));
}

async function getBuildingConstructionMarks(): Promise<ClassMarks[]> {
  const results: ClassMarks[] = [];

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

  // 2. For each class, find Building Construction subject
  for (const cls of classes || []) {
    // Get class subjects
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
      console.warn(`Error fetching subjects for class ${cls.name}:`, csError);
      continue;
    }

    // Find Building Construction subject
    const buildingConstructionSubject = classSubjects?.find(cs => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const subjectData = cs.subjects as any;
      return subjectData && isBuildingConstruction(subjectData.name);
    });

    if (!buildingConstructionSubject) {
      // No Building Construction in this class - check what subjects exist for debugging
      const allSubjectNames = classSubjects?.map(cs => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectData = cs.subjects as any;
        return subjectData?.name || 'Unknown';
      }).filter(Boolean) || [];
      // Only log if there are subjects that might be related
      const relatedSubjects = allSubjectNames.filter(name => 
        normalizeSubjectName(name).includes('construction') || 
        normalizeSubjectName(name).includes('building')
      );
      if (relatedSubjects.length > 0) {
        console.log(`  [${cls.name}] No exact "Building Construction" found, but found related: ${relatedSubjects.join(', ')}`);
      }
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subjectData = buildingConstructionSubject.subjects as any;
    const subjectId = subjectData.id;
    const subjectName = subjectData.name;

    // Check if this subject has branches (like CPB)
    const { data: subjectBranches } = await supabase
      .from('subject_branches')
      .select('id, branch_name, subject_id')
      .eq('subject_id', subjectId);

    const hasBranches = subjectBranches && subjectBranches.length > 0;

    // 3. Get all students in this class
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, first_name, last_name, matricule_number')
      .eq('class', cls.id)
      .eq('status', 'active')
      .order('first_name');

    if (studentsError) {
      console.warn(`Error fetching students for class ${cls.name}:`, studentsError);
      continue;
    }

    if (!students || students.length === 0) {
      continue;
    }

    const studentMarks: StudentMark[] = [];

    // 4. For each student, get their marks for First and Second Sequence
    for (const student of students) {
      const studentMark: StudentMark = {
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        matricule: student.matricule_number || undefined,
      };

      if (hasBranches) {
        // Handle branch subjects (like CPB)
        // Get branch assessments for First Sequence
        const branchIds = subjectBranches!.map(b => b.id);
        const { data: firstSeqBranchAssessments } = await supabase
          .from('branch_assessments')
          .select('id, title, total_marks, branch_id')
          .eq('class_id', cls.id)
          .in('branch_id', branchIds)
          .or('title.ilike.%First Sequence%,title.ilike.%first sequence%,title.ilike.%First sequence%');

        if (firstSeqBranchAssessments && firstSeqBranchAssessments.length > 0) {
          const assessmentIds = firstSeqBranchAssessments.map(a => a.id);
          const { data: firstSeqBranchGrades } = await supabase
            .from('branch_grades')
            .select('marks_obtained, percentage, assessment:branch_assessments!inner(total_marks)')
            .eq('student_id', student.id)
            .in('assessment_id', assessmentIds);

          if (firstSeqBranchGrades && firstSeqBranchGrades.length > 0) {
            // Average across all branches for this sequence
            const totalMarks = firstSeqBranchGrades.reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
            const avgMarks = totalMarks / firstSeqBranchGrades.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMarksValue = (firstSeqBranchGrades[0].assessment as any)?.total_marks;
            const avgPercentage = firstSeqBranchGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / firstSeqBranchGrades.length;

            studentMark.firstSequence = {
              marks: Math.round(avgMarks * 100) / 100,
              totalMarks: totalMarksValue,
              percentage: Math.round(avgPercentage * 100) / 100,
            };
          }
        }

        // Get branch assessments for Second Sequence
        const { data: secondSeqBranchAssessments } = await supabase
          .from('branch_assessments')
          .select('id, title, total_marks, branch_id')
          .eq('class_id', cls.id)
          .in('branch_id', branchIds)
          .or('title.ilike.%Second Sequence%,title.ilike.%second sequence%,title.ilike.%Second sequence%');

        if (secondSeqBranchAssessments && secondSeqBranchAssessments.length > 0) {
          const assessmentIds = secondSeqBranchAssessments.map(a => a.id);
          const { data: secondSeqBranchGrades } = await supabase
            .from('branch_grades')
            .select('marks_obtained, percentage, assessment:branch_assessments!inner(total_marks)')
            .eq('student_id', student.id)
            .in('assessment_id', assessmentIds);

          if (secondSeqBranchGrades && secondSeqBranchGrades.length > 0) {
            // Average across all branches for this sequence
            const totalMarks = secondSeqBranchGrades.reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
            const avgMarks = totalMarks / secondSeqBranchGrades.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMarksValue = (secondSeqBranchGrades[0].assessment as any)?.total_marks;
            const avgPercentage = secondSeqBranchGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / secondSeqBranchGrades.length;

            studentMark.secondSequence = {
              marks: Math.round(avgMarks * 100) / 100,
              totalMarks: totalMarksValue,
              percentage: Math.round(avgPercentage * 100) / 100,
            };
          }
        }
      } else {
        // Handle regular subjects (non-branch)
        // Get assessments for First Sequence (try multiple variations)
        const { data: firstSeqAssessments, error: firstSeqError } = await supabase
          .from('assessments')
          .select('id, title, total_marks')
          .eq('class_id', cls.id)
          .eq('subject', subjectName)
          .or('title.ilike.%First Sequence%,title.ilike.%first sequence%,title.ilike.%First sequence%');

        if (!firstSeqError && firstSeqAssessments && firstSeqAssessments.length > 0) {
          // Get grades for these assessments
          const assessmentIds = firstSeqAssessments.map(a => a.id);
          const { data: firstSeqGrades, error: firstGradesError } = await supabase
            .from('grades')
            .select('marks_obtained, percentage, assessment:assessments!inner(total_marks)')
            .eq('student_id', student.id)
            .in('assessment_id', assessmentIds);

          if (!firstGradesError && firstSeqGrades && firstSeqGrades.length > 0) {
            // Calculate average if multiple assessments
            const totalMarks = firstSeqGrades.reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
            const avgMarks = totalMarks / firstSeqGrades.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMarksValue = (firstSeqGrades[0].assessment as any)?.total_marks;
            const avgPercentage = firstSeqGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / firstSeqGrades.length;

            studentMark.firstSequence = {
              marks: Math.round(avgMarks * 100) / 100,
              totalMarks: totalMarksValue,
              percentage: Math.round(avgPercentage * 100) / 100,
            };
          }
        }

        // Get assessments for Second Sequence (try multiple variations)
        const { data: secondSeqAssessments, error: secondSeqError } = await supabase
          .from('assessments')
          .select('id, title, total_marks')
          .eq('class_id', cls.id)
          .eq('subject', subjectName)
          .or('title.ilike.%Second Sequence%,title.ilike.%second sequence%,title.ilike.%Second sequence%');

        if (!secondSeqError && secondSeqAssessments && secondSeqAssessments.length > 0) {
          // Get grades for these assessments
          const assessmentIds = secondSeqAssessments.map(a => a.id);
          const { data: secondSeqGrades, error: secondGradesError } = await supabase
            .from('grades')
            .select('marks_obtained, percentage, assessment:assessments!inner(total_marks)')
            .eq('student_id', student.id)
            .in('assessment_id', assessmentIds);

          if (!secondGradesError && secondSeqGrades && secondSeqGrades.length > 0) {
            // Calculate average if multiple assessments
            const totalMarks = secondSeqGrades.reduce((sum, g) => sum + (g.marks_obtained || 0), 0);
            const avgMarks = totalMarks / secondSeqGrades.length;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalMarksValue = (secondSeqGrades[0].assessment as any)?.total_marks;
            const avgPercentage = secondSeqGrades.reduce((sum, g) => sum + (g.percentage || 0), 0) / secondSeqGrades.length;

            studentMark.secondSequence = {
              marks: Math.round(avgMarks * 100) / 100,
              totalMarks: totalMarksValue,
              percentage: Math.round(avgPercentage * 100) / 100,
            };
          }
        }
      }

      // Only include students who have at least one sequence mark
      if (studentMark.firstSequence || studentMark.secondSequence) {
        studentMarks.push(studentMark);
      }
    }

    if (studentMarks.length > 0) {
      results.push({
        className: cls.name,
        classId: cls.id,
        subjectName: subjectName,
        students: studentMarks,
      });
    }
  }

  return results;
}

function printMarksReport(classMarks: ClassMarks[]): void {
  console.log('\n\n');
  console.log('═'.repeat(100));
  console.log('BUILDING CONSTRUCTION MARKS REPORT');
  console.log('First and Second Sequences - All Classes');
  console.log('═'.repeat(100));
  console.log('\n');

  if (classMarks.length === 0) {
    console.log('❌ No marks found for Building Construction in any class.\n');
    return;
  }

  for (const classData of classMarks) {
    console.log('\n' + '─'.repeat(100));
    console.log(`📚 CLASS: ${classData.className}`);
    console.log(`📖 SUBJECT: ${classData.subjectName}`);
    console.log(`👥 STUDENTS: ${classData.students.length}`);
    console.log('─'.repeat(100));
    console.log('');

    // Table header
    console.log(
      'Matricule'.padEnd(15) +
      'Student Name'.padEnd(30) +
      'First Sequence'.padEnd(20) +
      'Second Sequence'.padEnd(20)
    );
    console.log('─'.repeat(100));

    // Student rows
    for (const student of classData.students) {
      const matricule = (student.matricule || 'N/A').padEnd(15);
      const name = student.studentName.padEnd(30);
      
      const firstSeq = student.firstSequence
        ? `${student.firstSequence.marks}${student.firstSequence.totalMarks ? `/${student.firstSequence.totalMarks}` : ''} (${student.firstSequence.percentage}%)`
        : 'No marks';
      const firstSeqPadded = firstSeq.padEnd(20);

      const secondSeq = student.secondSequence
        ? `${student.secondSequence.marks}${student.secondSequence.totalMarks ? `/${student.secondSequence.totalMarks}` : ''} (${student.secondSequence.percentage}%)`
        : 'No marks';
      const secondSeqPadded = secondSeq.padEnd(20);

      console.log(matricule + name + firstSeqPadded + secondSeqPadded);
    }

    // Summary for this class
    const studentsWithFirstSeq = classData.students.filter(s => s.firstSequence).length;
    const studentsWithSecondSeq = classData.students.filter(s => s.secondSequence).length;
    const studentsWithBoth = classData.students.filter(s => s.firstSequence && s.secondSequence).length;

    console.log('─'.repeat(100));
    console.log(`Summary: ${studentsWithFirstSeq} with First Sequence | ${studentsWithSecondSeq} with Second Sequence | ${studentsWithBoth} with both`);
  }

  // Overall summary
  console.log('\n\n' + '═'.repeat(100));
  console.log('OVERALL SUMMARY');
  console.log('═'.repeat(100));
  const totalClasses = classMarks.length;
  const totalStudents = classMarks.reduce((sum, c) => sum + c.students.length, 0);
  const totalWithFirstSeq = classMarks.reduce((sum, c) => sum + c.students.filter(s => s.firstSequence).length, 0);
  const totalWithSecondSeq = classMarks.reduce((sum, c) => sum + c.students.filter(s => s.secondSequence).length, 0);
  const totalWithBoth = classMarks.reduce((sum, c) => sum + c.students.filter(s => s.firstSequence && s.secondSequence).length, 0);

  console.log(`Total Classes: ${totalClasses}`);
  console.log(`Total Students: ${totalStudents}`);
  console.log(`Students with First Sequence marks: ${totalWithFirstSeq}`);
  console.log(`Students with Second Sequence marks: ${totalWithSecondSeq}`);
  console.log(`Students with both sequences: ${totalWithBoth}`);
  console.log('═'.repeat(100));
  console.log('\n');
}

async function listAllConstructionSubjects(): Promise<void> {
  console.log('\n🔍 Listing all subjects containing "construction" or "building"...\n');
  
  const { data: allSubjects, error } = await supabase
    .from('subjects')
    .select('id, name')
    .or('name.ilike.%construction%,name.ilike.%building%')
    .order('name');

  if (error) {
    console.error('Error fetching subjects:', error);
    return;
  }

  if (!allSubjects || allSubjects.length === 0) {
    console.log('No subjects found containing "construction" or "building".\n');
    return;
  }

  console.log('Found subjects:');
  for (const subject of allSubjects) {
    console.log(`  - ${subject.name}`);
  }
  console.log('');
}

async function main() {
  console.log('🔍 Fetching Building Construction marks for all classes...\n');
  console.log('Looking for First and Second Sequence marks...\n');

  // First, list available construction-related subjects
  await listAllConstructionSubjects();

  const classMarks = await getBuildingConstructionMarks();
  printMarksReport(classMarks);
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
