import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAcademicYearFromConfig } from '@/lib/app-config-server';
import { PisonReportCardData } from '@/components/admin/reports/report-card-types';
import { loadSequenceYearConfig } from '@/lib/load-sequence-config-server';
import {
  DEFAULT_TERM_COUNTS,
  mapInTermToGlobal,
  globalToTerm,
  getGlobalSlotsForTerm,
  getTermAveragesFromSequenceMarks,
  getAnnualAverageFromTermAverages,
  isAnnualCoefEligible,
  isTermCoefEligible,
  type TermSequenceCounts,
  type TermAverages,
} from '@/lib/sequence-term-mapping';
import {
  computeWeightedTermHistory,
  accumulatePartialAnnualSection,
} from '@/lib/report-card-totals';
import { calculateGrade, getRemarkForMark } from '@/lib/grading-utils';
import { getTermFromAssessment } from '@/lib/report-card-assessment-resolution';
import { REPORT_CARD_CATEGORIES } from '@/lib/report-card-transform';
import {
  isYearSummaryReport,
  isThirdTermYearSummaryTable,
} from '@/lib/report-card-year-summary';
import type { ReportCardWarning } from '@/components/admin/reports/report-card-types';
import {
  emptySequenceMarks,
  computeBranchSubjectMarks,
  getAverageFromPopulatedSequenceMarks,
} from '@/lib/report-card-subject-marks';
import {
  subjectNamesMatch,
  normalizeSubjectName,
  isSubjectExcludedForClass,
} from '@/lib/report-card-subject-matching';
import {
  buildCohortRankingMetrics,
  rankCohortByMetrics,
  rankSubjectsForCohort,
  type RankingScope,
  type StudentGradeRow,
  type StudentBranchGradeRow,
} from '@/lib/report-card-class-ranking';
import {
  shouldIncludeReportCardGrade,
  shouldIncludeReportCardBranchGrade,
  type ReportCardGradeFilterContext,
} from '@/lib/report-card-grade-filter';

const DEBUG_REPORT_CARD = process.env.DEBUG_REPORT_CARD === '1';

let activeTermSequenceCounts: TermSequenceCounts = { ...DEFAULT_TERM_COUNTS };
let activeTotalSequences: 5 | 6 = 6;

export async function GET(req: NextRequest) {
  /* eslint-disable no-console */
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId'); // This is the database ID (int or uuid)
    const classId = searchParams.get('classId');
    const academicTermId = searchParams.get('academicTermId'); // e.g., 'first', 'second' -> 1, 2, 3

    if (!studentId || !classId || !academicTermId) {
      return NextResponse.json(
        { message: 'Missing studentId, classId, or academicTermId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. Fetch Student Details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Verify that the classId matches the student's class
    // Handle both UUID and class name cases
    const studentClassValue = student.class;
    if (!studentClassValue) {
      throw new Error('Student is not assigned to a class');
    }

    // Check if student.class is a UUID
    const isStudentClassUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentClassValue);
    
    // If student.class is a UUID, it must match the passed classId
    // If student.class is a class name, we need to verify the classId corresponds to that class name
    if (isStudentClassUUID) {
      if (studentClassValue !== classId) {
        throw new Error(`Class ID mismatch: student is in class ${studentClassValue}, but report requested for class ${classId}`);
      }
    } else {
      // student.class is a class name, verify that classId corresponds to this class name
      // Try multiple approaches to find the class: exact match on name, class_name, or case-insensitive match
      let classByName = null;
      
      // First try: exact match on class_name (preferred field)
      const { data: classByName1 } = await supabase
        .from('classes')
        .select('id, name, class_name')
        .eq('class_name', studentClassValue)
        .maybeSingle();
      
      if (classByName1) {
        classByName = classByName1;
      } else {
        // Second try: exact match on name field (legacy)
        const { data: classByName2 } = await supabase
          .from('classes')
          .select('id, name, class_name')
          .eq('name', studentClassValue)
          .maybeSingle();
        
        if (classByName2) {
          classByName = classByName2;
        } else {
          // Third try: case-insensitive match on class_name
          const { data: allClasses } = await supabase
            .from('classes')
            .select('id, name, class_name');
          
          if (allClasses) {
            const normalizedInput = studentClassValue.trim().toLowerCase();
            classByName = allClasses.find(cls => {
              const className = (cls.class_name || cls.name || '').trim().toLowerCase();
              return className === normalizedInput;
            }) || null;
          }
        }
      }
      
      if (classByName && classByName.id !== classId) {
        throw new Error(`Class ID mismatch: student is in class "${studentClassValue}" (ID: ${classByName.id}), but report requested for class ${classId}`);
      }
      
      // If class not found by name, log a warning but continue (classId might still be valid)
      if (!classByName) {
        console.warn(`[Report Card] Could not verify class name "${studentClassValue}" matches classId ${classId}, but proceeding with classId`);
      }
    }

    // 2. Fetch Class Details (for Year/Level)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) {
      console.warn('Class not found', classError);
    }

    // 3. Fetch Class Subjects
    // Explicitly define return type to avoid array-inference issues on joins
    // CRITICAL: Ensure subjects are fetched ONLY from the student's class via class_subjects table
    interface DbSubject {
      id: string;
      name: string;
      code: string;
      coefficient: number;
      has_sub_branches: boolean;
      subject_groupings: string[];
      is_active: boolean;
    }

    interface ClassSubjectRow {
      subject_id: string;
      class_id: string;
      subjects: DbSubject | DbSubject[];
    }

    interface Assessment {
      id: string;
      subject: string | null;
      type: string;
      title: string;
      class_id: string;
      teacher_id: string;
      assessment_date: string;
      term?: string; // Implicitly joined sometimes or inferred
    }

    interface GradeRow {
      marks_obtained: number;
      student_id: string;
      assessment: Assessment | null; // Join might theoretically return null if broken fk but inner join prevents it
    }

    const { data: initialClassSubjects, error: subjectsError } = await supabase
      .from('class_subjects')
      .select(`
        subject_id,
        class_id,
        subjects!inner (
          id,
          name,
          code,
          coefficient,
          has_sub_branches,
          subject_groupings,
          is_active
        )
      `)
      .eq('class_id', classId);
      
    let classSubjects: ClassSubjectRow[] = (initialClassSubjects as unknown as ClassSubjectRow[]) || [];

    if (subjectsError) {
      console.error('[Report Card] Error fetching class subjects:', subjectsError);
      throw new Error(`Failed to fetch subjects for class ${classId}: ${subjectsError.message}`);
    }

    // Filter out inactive subjects
    if (classSubjects) {
      const initialCount = classSubjects.length;
      classSubjects = classSubjects.filter(cs => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isActive = (subj as any)?.is_active; 
        return isActive !== false; // Default to true if undefined
      });
      
      if (classSubjects.length < initialCount) {
        console.log(`[Report Card] Filtered out ${initialCount - classSubjects.length} inactive subjects`);
      }
    }
    
    // Verify that subjects were found and log for debugging
    if (!classSubjects || classSubjects.length === 0) {
      console.warn(`[Report Card] No subjects found for class ${classId} (${classData?.class_name || classData?.name || 'Unknown'})`);
      // Don't throw error, just log - student might not have subjects assigned yet
    } else {
      // Verify all subjects belong to the correct class
      const invalidSubjects = classSubjects.filter(cs => cs.class_id !== classId);
      if (invalidSubjects.length > 0) {
        console.error(`[Report Card] WARNING: Found ${invalidSubjects.length} subjects with incorrect class_id!`);
      }
      
      console.log(`[Report Card] Found ${classSubjects.length} subjects for class ${classId} (${classData?.class_name || classData?.name || 'Unknown'}):`, 
        classSubjects.map(cs => {
          const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
          return subj ? { id: subj.id, name: subj.name, class_id: cs.class_id } : null;
        }).filter(Boolean)
      );
    }

    // 4. Fetch Teacher-Subject Assignments for these subjects
    // This ensures we only include marks from assessments created by teachers assigned to teach these subjects
    const subjectIds = classSubjects.map(cs => cs.subject_id);
    const { data: teacherAssignments, error: teacherAssignmentsError } = await supabase
      .from('teacher_subjects')
      .select(`
        teacher_id,
        subject_id,
        subject_name,
        is_active
      `)
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    if (teacherAssignmentsError) {
      console.warn('Failed to fetch teacher-subject assignments', teacherAssignmentsError);
    }

    // Fetch admin user IDs - admin-entered marks should always be included
    const { data: adminUsers, error: adminUsersError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin');
    
    const adminUserIds = new Set<string>();
    if (adminUsers && !adminUsersError) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      adminUsers.forEach((user: any) => {
        if (user.id) adminUserIds.add(user.id);
      });
      console.log(`[Report Card] Found ${adminUserIds.size} admin users - their marks will always be included`);
    } else if (adminUsersError) {
      console.warn('Failed to fetch admin users', adminUsersError);
    }

    // Create a map of subject_id -> array of teacher_ids who are assigned to teach it
    const subjectTeacherMap = new Map<string, Set<string>>();
    if (teacherAssignments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      teacherAssignments.forEach((assignment: any) => {
        const subjId = assignment.subject_id;
        if (subjId) {
          if (!subjectTeacherMap.has(subjId)) {
            subjectTeacherMap.set(subjId, new Set());
          }
          subjectTeacherMap.get(subjId)!.add(assignment.teacher_id);
        }
        // Also handle subject_name matching for backward compatibility
        if (assignment.subject_name) {
          // Find subject by name and add teacher
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subjectByName = classSubjects.find((cs: any) => {
            const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
            return subj && normalizeSubjectName(subj.name) === normalizeSubjectName(assignment.subject_name);
          });
          if (subjectByName) {
            const subjIdByName = Array.isArray(subjectByName.subjects) 
              ? (subjectByName.subjects as DbSubject[])[0]?.id 
              : (subjectByName.subjects as DbSubject)?.id;
            if (subjIdByName) {
              if (!subjectTeacherMap.has(subjIdByName)) {
                subjectTeacherMap.set(subjIdByName, new Set());
              }
              subjectTeacherMap.get(subjIdByName)!.add(assignment.teacher_id);
            }
          }
        }
      });
    }

    console.log(`[Report Card] Found teacher assignments for ${subjectTeacherMap.size} subjects:`, 
      Array.from(subjectTeacherMap.entries()).map(([subjId, teachers]) => ({
        subjectId: subjId,
        teacherCount: teachers.size,
        teacherIds: Array.from(teachers)
      }))
    );

    const gradeFilterCtx: ReportCardGradeFilterContext = {
      classSubjects: classSubjects
        .map((cs) => {
          const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
          return subj ? { id: subj.id, name: subj.name } : null;
        })
        .filter((s): s is { id: string; name: string } => s !== null),
      subjectTeacherMap,
      adminUserIds,
    };

    // 5. Fetch Sub-branches for these subjects
    // Try both tables: subject_sub_branches (older) and subject_branches (newer)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let subBranches: any[] = [];
    
    // Try subject_sub_branches first (older system)
    const { data: subBranchesOld, error: subBranchesError } = await supabase
      .from('subject_sub_branches')
      .select('*')
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    if (subBranchesOld) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subBranches = subBranchesOld.map((sb: any) => ({
        ...sb,
        id: sb.id,
        subject_id: sb.subject_id,
        name: sb.name,
        is_active: sb.is_active
      }));
    }

    // Also try subject_branches (newer system used by CPB)
    const { data: subjectBranchesNew, error: subjectBranchesError } = await supabase
      .from('subject_branches')
      .select('*')
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    if (subjectBranchesNew) {
      // Map subject_branches to the same format as subject_sub_branches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mappedBranches = subjectBranchesNew.map((sb: any) => ({
        id: sb.id,
        subject_id: sb.subject_id,
        name: sb.branch_name || sb.name, // Use branch_name from subject_branches
        is_active: sb.is_active
      }));
      subBranches = [...subBranches, ...mappedBranches];
    }

    if (subBranchesError && subjectBranchesError) {
      console.warn('Failed to fetch sub-branches from both tables:', { subBranchesError, subjectBranchesError });
    }

    // 6. Fetch Grades
    // Teachers enter grades by selecting: Subject (from their assigned subjects) -> Term -> Sequence -> Marks
    // Assessments are just a technical grouping mechanism in the database
    // We fetch grades and filter to ensure only marks from teachers assigned to teach each subject are included
    
    // Always use academic year from App Configuration
    const academicYear = await getAcademicYearFromConfig();

    const seqYearConfig = await loadSequenceYearConfig(supabase, academicYear);
    activeTermSequenceCounts = seqYearConfig.termSequenceCounts;
    activeTotalSequences = seqYearConfig.totalSequences;
    
    // Fetch academic sequences to create a lookup map (sequence_id -> sequence_number)
    // This is needed because some assessment titles are UUIDs (sequence IDs) instead of names
    const sequenceIdToNumberMap = new Map<string, number>();
    const { data: academicSequences } = await supabase
      .from('academic_sequences')
      .select('id, sequence_number, sequence_name')
      .eq('academic_year', academicYear);
    
    if (academicSequences) {
      for (const seq of academicSequences) {
        sequenceIdToNumberMap.set(seq.id, seq.sequence_number);
        // Also map by sequence_name for flexibility
        if (seq.sequence_name) {
          sequenceIdToNumberMap.set(seq.sequence_name.toLowerCase(), seq.sequence_number);
        }
      }
      console.log(`[Report Card] Loaded ${academicSequences.length} academic sequences for lookup`);
    }

    // Fetch Grades
    // Grades are linked to assessments (which contain subject, term/sequence info via title)
    // We filter by class_id and determine term from assessment title
    const { data: gradesData, error: gradesError } = await supabase
      .from('grades')
      .select(`
        marks_obtained,
        student_id,
        assessment:assessments!inner (
          id,
          subject,
          type,
          title,
          class_id,
          teacher_id,
          assessment_date
        )
      `)
      .eq('student_id', studentId)
      .eq('assessment.class_id', classId);

    const typedGradesData = (gradesData as unknown as GradeRow[]) || [];

    if (gradesError) {
      console.error('Failed to fetch grades', gradesError);
    }

    // Use filtered grades data (only marks from assigned teachers)
    const validGradesData = typedGradesData.filter((grade) => {
      const assessment = grade.assessment;
      const assessSubject = assessment?.subject || '';
      return shouldIncludeReportCardGrade(assessSubject, assessment?.teacher_id, gradeFilterCtx);
    });

    if (validGradesData.length !== typedGradesData.length) {
      console.log(
        `[Report Card] Filtered ${typedGradesData.length - validGradesData.length} grades that don't match teacher assignments`
      );
    }

    // Fetch Branch Grades (if table exists)
    // Branch grades work similarly - teachers select subject branch, term, sequence, and enter marks
    // Note: branch_assessments table has academic_year and term columns
    // This table may not exist in all installations, so we handle errors gracefully
    let branchGradesData = null;
    
    const branchResult = await supabase
      .from('branch_grades')
      .select(`
        marks_obtained,
        student_id,
        branch_id,
        assessment:branch_assessments!inner (
          id,
          title, 
          type,
          academic_year,
          term,
          class_id,
          teacher_id
        )
      `)
      .eq('student_id', studentId)
      .eq('assessment.academic_year', academicYear)
      .eq('assessment.class_id', classId);
    
    // Only use the data if there's no error, or if the error is just "table doesn't exist"
    if (branchResult.error) {
      // PGRST205 = table not found - this is expected if branch_grades table doesn't exist
      if (branchResult.error.code === 'PGRST205') {
        // Table doesn't exist, that's okay - branch grades are optional
        branchGradesData = null;
      } else {
        // Other error - log it but continue
        console.warn('Failed to fetch branch grades:', branchResult.error);
        branchGradesData = null;
      }
    } else {
      branchGradesData = branchResult.data;
      
      // Filter branch grades to only include those entered by teachers assigned to teach the subject
      // For branch grades, we need to check the subject_id of the branch
      if (branchGradesData && subjectTeacherMap.size > 0) {
        // First, get branch details to map branch_id to subject_id
        // Check both tables: subject_sub_branches (older) and subject_branches (newer, used by CPB)
        const branchIds = [...new Set(branchGradesData.map((bg: any) => bg.branch_id))];
        
        const branchToSubjectMap = new Map<string, string>();
        
        // Try subject_sub_branches (older system)
        const { data: branchDetailsOld } = await supabase
          .from('subject_sub_branches')
          .select('id, subject_id')
          .in('id', branchIds);
        
        if (branchDetailsOld) {
          branchDetailsOld.forEach((branch: any) => {
            branchToSubjectMap.set(branch.id, branch.subject_id);
          });
        }
        
        // Also try subject_branches (newer system, used by CPB)
        const { data: branchDetailsNew } = await supabase
          .from('subject_branches')
          .select('id, subject_id')
          .in('id', branchIds);
        
        if (branchDetailsNew) {
          branchDetailsNew.forEach((branch: any) => {
            // Only add if not already mapped (prefer older table if both exist)
            if (!branchToSubjectMap.has(branch.id)) {
              branchToSubjectMap.set(branch.id, branch.subject_id);
            }
          });
        }
        
        branchGradesData = branchGradesData.filter((bg: any) => {
          const branchSubjectId = branchToSubjectMap.get(bg.branch_id);
          if (!branchSubjectId) {
            console.warn(`[Report Card] Branch ${bg.branch_id} has no subject_id. Excluding from report card.`);
            return false;
          }
          const assessment = bg.assessment as { teacher_id?: string | null } | null;
          return shouldIncludeReportCardBranchGrade(
            branchSubjectId,
            assessment?.teacher_id,
            gradeFilterCtx
          );
        });
      }
    }

    const termMode = parseAcademicTermMode(academicTermId);
    const yearSummary = isYearSummaryReport(termMode);
    const thirdTermTable = isThirdTermYearSummaryTable(termMode);
    /** Load marks from every term when building year-summary columns (annual or term 3 table). */
    const includeAllTermsGrades = yearSummary;

    // Helper to normalize term matching (strict for per-term reports; loose for annual)
    const isTargetTerm = (
        termStr: string | null,
        title: string | null | undefined,
        assessSubject?: string | null
    ) => {
        if (termMode.mode === 'annual') {
            return true;
        }
        const requestedTerm = termMode.term;

        const termFromData = getTermFromAssessment(title ?? null, termStr ?? null, sequenceIdToNumberMap, activeTermSequenceCounts);
        if (termFromData !== null) {
            return termFromData === requestedTerm;
        }

        if (termStr) {
            const normalizedInput = academicTermId.toLowerCase();
            const normalizedDb = termStr.toLowerCase();

            if (normalizedInput === normalizedDb) return true;

            if (normalizedInput.includes('first') && (normalizedDb.includes('1st') || normalizedDb.includes('first'))) return true;
            if (normalizedInput.includes('second') && (normalizedDb.includes('2nd') || normalizedDb.includes('second'))) return true;
            if (normalizedInput.includes('third') && (normalizedDb.includes('3rd') || normalizedDb.includes('third'))) return true;
            if (normalizedDb.includes(normalizedInput)) return true;
        }

        const subj = assessSubject ? normalizeSubjectName(assessSubject) : '';
        if (subj.includes('office practice') && includeAllTermsGrades) {
            if (DEBUG_REPORT_CARD) {
                console.warn(
                    `[Report Card] Office Practice: could not determine term (title: "${title}", term: "${termStr}"). Included for year-summary only.`
                );
            }
            return true;
        }

        if (DEBUG_REPORT_CARD) {
            console.warn(
                `[Report Card] Excluding grade: could not determine term (title: "${title}", term: "${termStr}", subject: "${assessSubject ?? ''}").`
            );
        }
        return false;
    };

    const gradeIncludedForReport = (
        termStr: string | null,
        title: string | null | undefined,
        assessSubject?: string | null
    ) => {
        if (includeAllTermsGrades) return true;
        return isTargetTerm(termStr, title, assessSubject);
    };

    const reportWarnings: ReportCardWarning[] = [];

    if (gradesError) {
      reportWarnings.push({
        type: 'GRADES_FETCH_FAILED',
        message: `Could not load student grades: ${gradesError.message}. Report marks may be incomplete.`,
      });
    }

    // Process Subjects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reportItems: any[] = [];
    
    // Map subjects and deduplicate by subject ID to avoid duplicates
    const subjectsMap = new Map<string, any>();
    classSubjects.forEach(cs => {
        // Handle explicit single/array return from supabase join
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
        if (subj && (subj as any).id) {
            const subjectId = (subj as any).id;
            // Only add if we haven't seen this subject ID before
            if (!subjectsMap.has(subjectId)) {
                subjectsMap.set(subjectId, subj);
            }
        }
    });
    
    // Convert map to array (already deduplicated)
    let subjectsList = Array.from(subjectsMap.values());

    // Resolve class label once for class-specific subject exclusion rules.
    const currentClassLabel = String(classData?.class_name || classData?.name || student.class || '').trim();

    const beforeExclusionCount = subjectsList.length;
    subjectsList = subjectsList.filter(
        (s: { name?: string }) => !isSubjectExcludedForClass(currentClassLabel, s.name)
    );
    if (subjectsList.length < beforeExclusionCount) {
        console.log(
            `[Report Card] Omitted ${beforeExclusionCount - subjectsList.length} excluded subject(s) for class "${currentClassLabel}"`
        );
    }

    // Log subjects found for debugging
    console.log(`[Report Card] Found ${subjectsList.length} subjects for class ${classId}:`, 
        subjectsList.map((s: any) => ({ id: s.id, name: s.name, normalized: normalizeSubjectName(s.name) }))
    );
    
    // Log all assessment subjects found in grades for comparison
    if (gradesData && gradesData.length > 0) {
        const allAssessmentSubjects = typedGradesData.map((g) => {
            const assessment = g.assessment;
            return assessment?.subject || '';
        }).filter(Boolean);
        const uniqueAssessmentSubjects = [...new Set(allAssessmentSubjects)];
        console.log(`[Report Card] Found ${uniqueAssessmentSubjects.length} unique assessment subjects in grades:`, 
            uniqueAssessmentSubjects.map(s => ({
                original: s,
                normalized: normalizeSubjectName(s)
            }))
        );
        
        // Compare class subjects with assessment subjects
        const classSubjectNames = subjectsList.map((s: any) => normalizeSubjectName(s.name));
        const assessmentSubjectNames = uniqueAssessmentSubjects.map(s => normalizeSubjectName(s));
        
        const missingInAssessments = classSubjectNames.filter(cs => 
            !assessmentSubjectNames.some(as => subjectNamesMatch(cs, as))
        );
        const missingInClassSubjects = assessmentSubjectNames.filter(as => 
            !classSubjectNames.some(cs => subjectNamesMatch(cs, as))
        );
        
        if (missingInAssessments.length > 0) {
            if (DEBUG_REPORT_CARD) {
                console.warn(`[Report Card] Class subjects with NO matching assessments:`, missingInAssessments);
            }
            for (const subj of missingInAssessments) {
                reportWarnings.push({
                    type: 'NO_MATCHING_ASSESSMENT',
                    message: `Class subject has no matching assessment records`,
                    subject: subj,
                });
            }
        }
        if (missingInClassSubjects.length > 0) {
            if (DEBUG_REPORT_CARD) {
                console.warn(`[Report Card] Assessment subjects with NO matching class subjects:`, missingInClassSubjects);
            }
            for (const subj of missingInClassSubjects) {
                reportWarnings.push({
                    type: 'ORPHAN_ASSESSMENT_SUBJECT',
                    message: `Assessment subject not in class_subjects`,
                    subject: subj,
                });
            }
        }
    }

    let totalScore = 0;
    let totalCoef = 0;
    /** Third-term footer uses term-3 weighted average; table uses annual totals in totalScore. */
    let footerTotalScore = 0;
    let footerTotalCoef = 0;
    let passedCount = 0;
    
    // Track GCE subjects (subjects with codes) for GCE section
    // Count only PASSED subjects (marks >= 10) for each category
    let gceTradeSubjectsPassed = 0;
    let gceRelatedTradePassed = 0;
    let gceLanguageSubjectsPassed = 0;
    let gceOtherSubjectsPassed = 0;
    let gceSubjectsPassed = 0; // Total of all GCE subjects passed
    
    // Track processed subject names to prevent duplicates in reportItems
    const processedSubjectNames = new Set<string>();
    
    // Initialize subject ranks map (will be populated during ranking calculation)
    const subjectRanks = new Map<string, number>();

    // Track specific subjects for Form 1 EPS class diagnostics
    const targetSubjectNames = [
        'Professional English',
        'Industrial Computing', 
        'Mathematics',
        'Building Construction Drawing',
        'Computer Aided Management',
        'Electrical Technology and Diagrams'
    ];
    
    // Find all target subjects in class_subjects
    const foundTargetSubjects = subjectsList.filter((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return targetSubjectNames.some(target => 
            normalized === normalizeSubjectName(target) || 
            normalized.includes(normalizeSubjectName(target)) ||
            normalizeSubjectName(target).includes(normalized)
        );
    });
    
    if (foundTargetSubjects.length > 0) {
        console.log(`[FORM 1 EPS DIAGNOSTIC] Found ${foundTargetSubjects.length} target subjects in class_subjects:`, 
            foundTargetSubjects.map((s: any) => ({
                id: s.id,
                name: s.name,
                normalized: normalizeSubjectName(s.name)
            }))
        );
    } else {
        console.log(`[FORM 1 EPS DIAGNOSTIC] None of the target subjects found in class_subjects for class ${classId}`);
        console.log(`[FORM 1 EPS DIAGNOSTIC] Available subjects:`, subjectsList.map((s: any) => ({
            name: s.name,
            normalized: normalizeSubjectName(s.name)
        })));
    }
    
    // BC-SPECIFIC DIAGNOSTIC: Check if BC subject exists and log details
    const bcSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'bc' || normalized === 'building construction' || 
               normalized.includes('bc') || normalized.includes('building construction');
    });
    if (bcSubject) {
        console.log(`[BC DIAGNOSTIC] BC subject found in class_subjects:`, {
            id: bcSubject.id,
            name: bcSubject.name,
            normalized: normalizeSubjectName(bcSubject.name)
        });
    } else {
        console.log(`[BC DIAGNOSTIC] BC subject NOT found in class_subjects for class ${classId}`);
        console.log(`[BC DIAGNOSTIC] Available subjects:`, subjectsList.map((s: any) => s.name));
    }
    
    // EPS-SPECIFIC DIAGNOSTIC: Check if EPS subject exists and log details
    const epsSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'eps' || normalized === 'physical education' || normalized === 'pe' ||
               normalized.includes('eps') || normalized.includes('physical education') || normalized.includes('pe');
    });
    if (epsSubject) {
        console.log(`[EPS DIAGNOSTIC] EPS subject found in class_subjects:`, {
            id: epsSubject.id,
            name: epsSubject.name,
            normalized: normalizeSubjectName(epsSubject.name)
        });
    } else {
        console.log(`[EPS DIAGNOSTIC] EPS subject NOT found in class_subjects for class ${classId}`);
    }
    
    // AC-SPECIFIC DIAGNOSTIC: Check if AC subject exists and log details
    const acSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'ac' || normalized === 'accounting' || normalized === 'accountancy' ||
               normalized.includes('ac') || normalized.includes('accounting');
    });
    if (acSubject) {
        console.log(`[AC DIAGNOSTIC] AC subject found in class_subjects:`, {
            id: acSubject.id,
            name: acSubject.name,
            normalized: normalizeSubjectName(acSubject.name)
        });
    } else {
        console.log(`[AC DIAGNOSTIC] AC subject NOT found in class_subjects for class ${classId}`);
    }
    
    // HEC-SPECIFIC DIAGNOSTIC: Check if HEC subject exists and log details
    const hecSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'hec' || normalized === 'home economics' || normalized === 'home ec' ||
               normalized.includes('hec') || normalized.includes('home economics');
    });
    if (hecSubject) {
        console.log(`[HEC DIAGNOSTIC] HEC subject found in class_subjects:`, {
            id: hecSubject.id,
            name: hecSubject.name,
            normalized: normalizeSubjectName(hecSubject.name)
        });
    } else {
        console.log(`[HEC DIAGNOSTIC] HEC subject NOT found in class_subjects for class ${classId}`);
    }
    
    // DIAGNOSTIC: Call diagnostic logging after grades are fetched and subject variables are declared
    // This must be after bcSubject, epsSubject, acSubject, hecSubject are declared
    
    // Log diagnostics for Form 1 EPS target subjects
    foundTargetSubjects.forEach((targetSubject: any) => {
        logSubjectMarkDiagnostics(targetSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    });
    
    if (bcSubject) {
        logSubjectMarkDiagnostics(bcSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    }
    if (epsSubject) {
        logSubjectMarkDiagnostics(epsSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    }
    if (acSubject) {
        logSubjectMarkDiagnostics(acSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    }
    if (hecSubject) {
        logSubjectMarkDiagnostics(hecSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    }
    
    // Office Practice diagnostic
    const officePracticeSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'office practice' || normalized.includes('office practice');
    });
    if (officePracticeSubject) {
        console.log(`[OFFICE PRACTICE DIAGNOSTIC] Office Practice subject found in class_subjects:`, {
            id: officePracticeSubject.id,
            name: officePracticeSubject.name,
            normalized: normalizeSubjectName(officePracticeSubject.name)
        });
        logSubjectMarkDiagnostics(officePracticeSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    } else {
        console.log(`[OFFICE PRACTICE DIAGNOSTIC] Office Practice subject NOT found in class_subjects for class ${classId}`);
    }

    // Mathematics diagnostic
    const mathematicsSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'mathematics' || normalized.includes('mathematics') || 
               normalized === 'math' || normalized === 'maths';
    });
    if (mathematicsSubject) {
        console.log(`[MATHEMATICS DIAGNOSTIC] Mathematics subject found in class_subjects:`, {
            id: mathematicsSubject.id,
            name: mathematicsSubject.name,
            normalized: normalizeSubjectName(mathematicsSubject.name)
        });
        logSubjectMarkDiagnostics(mathematicsSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    } else {
        console.log(`[MATHEMATICS DIAGNOSTIC] Mathematics subject NOT found in class_subjects for class ${classId}`);
    }

    // Business Mathematics diagnostic
    const businessMathSubject = subjectsList.find((s: any) => {
        const normalized = normalizeSubjectName(s.name);
        return normalized === 'business mathematics' || normalized.includes('business mathematics') || 
               normalized.includes('business math') || normalized === 'biz math';
    });
    if (businessMathSubject) {
        console.log(`[BUSINESS MATHEMATICS DIAGNOSTIC] Business Mathematics subject found in class_subjects:`, {
            id: businessMathSubject.id,
            name: businessMathSubject.name,
            normalized: normalizeSubjectName(businessMathSubject.name)
        });
        logSubjectMarkDiagnostics(businessMathSubject.name, classSubjects, gradesData || [], subjectTeacherMap, studentId);
    } else {
        console.log(`[BUSINESS MATHEMATICS DIAGNOSTIC] Business Mathematics subject NOT found in class_subjects for class ${classId}`);
    }

    for (const subject of subjectsList) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!subject || !(subject as any).name) continue;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectName = String((subject as any).name).trim(); // Ensure trimmed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectId = (subject as any).id;
        
        // Log subject being processed
        console.log(`[Report Card] Processing subject: "${subjectName}" (ID: ${subjectId})`);
        
        // Skip if we've already processed this subject (safety check) - Case Insensitive
        const normalizedSubjectName = normalizeSubjectName(subjectName);
        if (processedSubjectNames.has(normalizedSubjectName)) {
            console.warn(`Skipping duplicate subject: ${subjectName} (normalized: ${normalizedSubjectName})`);
            continue;
        }
        
        // Mark this subject as processed
        processedSubjectNames.add(normalizedSubjectName);
        let computedSequenceMarksForSubject: Record<string, number | undefined> | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSubBranchesFlag = (subject as any).has_sub_branches;
        
        // Check if this subject has branches in either table
        // Some subjects like CPB use subject_branches (newer system) even if has_sub_branches is false
        const branchesFromOldTable = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
        // subjectBranchesNew is defined earlier in the function scope (line ~295)
        const branchesFromNewTable = (typeof subjectBranchesNew !== 'undefined' && subjectBranchesNew) 
          ? subjectBranchesNew.filter((sb: any) => sb.subject_id === subjectId) 
          : [];
        let hasSubBranches = hasSubBranchesFlag || branchesFromOldTable.length > 0 || branchesFromNewTable.length > 0;
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectCoef = (subject as any).coefficient || 1;
        // Check if this is a GCE subject (has a code)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectCode = (subject as any).code;
        const isGceSubject = subjectCode && String(subjectCode).trim().length > 0;

        // Get category from subject_groupings, default to 'others'
        let category = 'others';
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subjectGroupings = (subject as any).subject_groupings;
          if (Array.isArray(subjectGroupings) && subjectGroupings.length > 0) {
            const rawCategory = subjectGroupings[0];
            const validCategories = [...REPORT_CARD_CATEGORIES];
            if (validCategories.includes(rawCategory as (typeof REPORT_CARD_CATEGORIES)[number])) {
              category = rawCategory;
            }
          }
        } catch (err) {
          // If there's any error extracting category, default to 'others'
          console.warn('Error extracting subject category:', err);
        }

        if (isSubjectExcludedForClass(currentClassLabel, subjectName)) {
            continue;
        }

        let finalMark = 0;
        let hasMark = false;
        let remark = 'No Grade';
        let annualTermAvgsForSubject: TermAverages | undefined;

        if (hasSubBranches) {
            // Logic for Sub-branches
            // Combine branches from both tables
            const branchesOld = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
            const branchesNew = (typeof subjectBranchesNew !== 'undefined' && subjectBranchesNew)
              ? subjectBranchesNew.filter((sb: any) => sb.subject_id === subjectId).map((sb: any) => ({
                  id: sb.id,
                  subject_id: sb.subject_id,
                  name: sb.branch_name || sb.name,
                  is_active: sb.is_active
                }))
              : [];
            const branches = [...branchesOld, ...branchesNew];
            
            // Log CPB-specific diagnostics
            const isCPB = normalizedSubjectName.includes('construction process') || normalizedSubjectName.includes('cpb');
            if (isCPB) {
              console.log(`[CPB DIAGNOSTIC] Subject: ${subjectName} (ID: ${subjectId}), hasSubBranches flag: ${hasSubBranchesFlag}`);
              console.log(`[CPB DIAGNOSTIC] Branches found - Old table: ${branchesOld.length}, New table: ${branchesNew.length}, Total: ${branches.length}`);
              console.log(`[CPB DIAGNOSTIC] Branch grades available: ${branchGradesData?.length || 0}`);
              if (branches.length > 0) {
                console.log(`[CPB DIAGNOSTIC] Branch IDs:`, branches.map(b => b.id));
              }
              if (branchGradesData && branchGradesData.length > 0) {
                const cpbBranchGrades = branchGradesData.filter((bg: any) => {
                  const branchId = bg.branch_id;
                  return branches.some(b => b.id === branchId);
                });
                console.log(`[CPB DIAGNOSTIC] Branch grades matching CPB branches: ${cpbBranchGrades.length}`);
                if (cpbBranchGrades.length > 0) {
                  const termFiltered = cpbBranchGrades.filter((bg: any) => {
                    const assessment = bg.assessment as any;
                    return gradeIncludedForReport(assessment?.term || null, assessment?.title || null, assessment?.subject || null);
                  });
                  console.log(`[CPB DIAGNOSTIC] Branch grades for target term: ${termFiltered.length}`);
                }
              }
            }
            
            if (branches.length > 0) {
                const branchIds = branches.map((b) => b.id);
                const filteredBranchGrades =
                    branchGradesData?.filter((bg) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessment = bg.assessment as any;
                        return (
                            branchIds.includes(bg.branch_id) &&
                            gradeIncludedForReport(
                                assessment?.term || null,
                                assessment?.title || null,
                                assessment?.subject || null
                            )
                        );
                    }) || [];

                const perTermForBranch = termMode.mode === 'per_term' ? termMode.term : null;
                const branchResult = computeBranchSubjectMarks({
                    branchGrades: filteredBranchGrades.map((bg) => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessment = bg.assessment as any;
                        return {
                            marks_obtained: bg.marks_obtained,
                            branch_id: bg.branch_id,
                            title: assessment?.title || '',
                        };
                    }),
                    branchIds,
                    sequenceIdToNumberMap,
                    termSequenceCounts: activeTermSequenceCounts,
                    totalSequences: activeTotalSequences,
                    perTermNum: perTermForBranch,
                    yearSummary,
                });

                if (branchResult.hasMark) {
                    finalMark = branchResult.finalMark;
                    hasMark = true;
                    computedSequenceMarksForSubject = branchResult.sequenceMarks;

                    if (isCPB && DEBUG_REPORT_CARD) {
                      console.log(
                          `[CPB DIAGNOSTIC] Calculated final mark: ${finalMark}, branches: ${branchIds.length}, yearSummary: ${yearSummary}`
                      );
                    }
                } else {
                    // Log if no branches had grades
                    if (isCPB) {
                      console.log(`[CPB DIAGNOSTIC] No branch grades found for target term. Branches checked: ${branches.length}`);
                    }
                }
            } else {
                // Log if no branches found
                if (isCPB) {
                  console.log(`[CPB DIAGNOSTIC] No branches found for CPB subject! This is the problem.`);
                }
            }

            // FALLBACK: If "Branch" subject has no branch grades, try standard grades
            // This handles cases where a subject is marked as "has_sub_branches" but grades were entered directly
            if (!hasMark) {
                console.log(`[Report Card] Branch subject "${subjectName}" has no branch grades. Checking for standard grades...`);
                
                 // BC/EPS/AC/HEC/CPB AND FORM 1 EPS SUBJECTS: Check if this is a target subject for logging

                
                // Reuse normal subject logic
                const sGrades = validGradesData?.filter(g => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const assessment = g.assessment as any;
                    const assessSubject = assessment?.subject || '';
                    return subjectNamesMatch(assessSubject, subjectName) && 
                        gradeIncludedForReport(assessment?.term || null, assessment?.title || null, assessment?.subject || null);
                }) || [];

                if (sGrades.length > 0) {
                     console.log(`[Report Card] FOUND standard grades for Branch subject "${subjectName}". Using fallback logic.`);
                     
                     // Calculate Final Mark from standard grades (Legacy/Standard Average)
                     let sum = 0;
                     if (sGrades.length > 0) {
                        sum = sGrades.reduce((a, b) => a + b.marks_obtained, 0);
                        finalMark = sum / sGrades.length;
                        hasMark = true;
                     }

                     // IMPORTANT: Flip the flag to treat this as a Normal Subject downstream
                     // This ensures that the shared sequence mark calculation logic (lines 1345+) runs for this subject
                     // generating the seq1, seq2, etc. columns correctly.
                     hasSubBranches = false;
                }
            }

        } else {
            // Normal Subject - Group grades by sequence number
            // Use validGradesData which has been filtered by teacher assignments
            
            // BC/EPS/AC/HEC AND FORM 1 EPS SUBJECTS: Check if this is a target subject for logging
            const targetSubjectsList = [
                'bc', 'eps', 'ac', 'hec', 
                'building construction', 'physical education', 'accounting', 'home economics',
                'professional english', 'mathematics', 'business mathematics',
                'building construction drawing', 'computer aided management',
                'electrical technology and diagrams', 'office practice',
                'construction process', 'cpb', 'bcd' // Added CPB subjects
            ];
            const isTargetSubject = targetSubjectsList
                .some(target => {
                    const normSubj = normalizeSubjectName(subjectName);
                    const normTarget = normalizeSubjectName(target);
                    return normSubj.includes(normTarget) || normTarget.includes(normSubj) || 
                           normSubj === normTarget;
                });
            
            const sGrades = validGradesData?.filter(g => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assessment = g.assessment as any;
                const assessSubject = assessment?.subject || '';
                // Use normalized comparison to handle case sensitivity and whitespace
                const matches = subjectNamesMatch(assessSubject, subjectName);
                
                // BC/EPS/AC/HEC AND FORM 1 EPS SUBJECTS: Log matching attempts
                if (isTargetSubject && !matches) {
                    console.log(`[${subjectName.toUpperCase()} MATCHING] Assessment subject "${assessSubject}" does NOT match "${subjectName}"`, {
                        normalizedAssess: normalizeSubjectName(assessSubject),
                        normalizedSubject: normalizeSubjectName(subjectName),
                        match: matches,
                        assessSubjectWords: normalizeSubjectName(assessSubject).split(' '),
                        subjectNameWords: normalizeSubjectName(subjectName).split(' ')
                    });
                }
                if (isTargetSubject && matches) {
                    console.log(`[${subjectName.toUpperCase()} MATCHING] ✓ Assessment subject "${assessSubject}" MATCHES "${subjectName}"`);
                }
                
                return matches && 
                    gradeIncludedForReport(assessment?.term || null, assessment?.title || null, assessment?.subject || null);
            }) || [];
            
            // BC/EPS/AC/HEC AND FORM 1 EPS SUBJECTS: Log grades found
            const targetSubjectsList2 = [
                'bc', 'eps', 'ac', 'hec', 
                'building construction', 'physical education', 'accounting', 'home economics',
                'professional english', 'mathematics', 'business mathematics',
                'building construction drawing', 'computer aided management',
                'electrical technology and diagrams', 'office practice',
                'construction process', 'cpb', 'bcd' // Added CPB subjects
            ];
            const isTargetSubject2 = targetSubjectsList2
                .some(target => {
                    const normSubj = normalizeSubjectName(subjectName);
                    const normTarget = normalizeSubjectName(target);
                    return normSubj.includes(normTarget) || normTarget.includes(normSubj) || 
                           normSubj === normTarget;
                });
                if (isTargetSubject2) {
                    console.log(`[${subjectName.toUpperCase()} GRADES] Found ${sGrades.length} grades for subject "${subjectName}"`, {
                        subjectName,
                        normalizedSubjectName: normalizeSubjectName(subjectName),
                        gradesCount: sGrades.length,
                        grades: sGrades.map((g) => ({
                            marks: g.marks_obtained,
                            assessmentSubject: g.assessment?.subject,
                            normalizedAssessmentSubject: normalizeSubjectName(g.assessment?.subject),
                            assessmentTitle: g.assessment?.title,
                            matches: subjectNamesMatch(g.assessment?.subject, subjectName)
                        }))
                    });
                
                // If no grades found, log all available assessment subjects for debugging
                if (sGrades.length === 0) {
                    const allAssessmentSubjects = validGradesData?.map((g: any) => {
                        const assessment = g.assessment as any;
                        return assessment?.subject || '';
                    }).filter(Boolean) || [];
                    const uniqueAssessmentSubjects = [...new Set(allAssessmentSubjects)];
                    console.error(`[${subjectName.toUpperCase()} ERROR] No grades found! Available assessment subjects:`, uniqueAssessmentSubjects.map(s => ({
                        original: s,
                        normalized: normalizeSubjectName(s),
                        matches: subjectNamesMatch(s, subjectName)
                    })));
                }
            }

            // Map grades to global sequence slots (1–6). Annual reports use global titles/UUIDs directly.
            const perTermNum = termMode.mode === 'per_term' ? termMode.term : null;

            // Group grades by GLOBAL sequence number (1-6)
            const gradesBySequence: Record<number, number[]> = {};
            const unknownGradesByTerm: Array<{ mark: number; term: number }> = [];
            
            for (const grade of sGrades) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assessment = grade.assessment as any;
                const assessmentTitle = assessment?.title || '';
                let globalSeqNum: number | null = null;

                if (yearSummary) {
                    globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap);
                } else if (perTermNum !== null) {
                    const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, perTermNum);
                    if (inTermSeqNum !== null) {
                        globalSeqNum = mapToGlobalSequence(inTermSeqNum, perTermNum);
                    } else {
                        globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap);
                    }
                }
                
                if (globalSeqNum !== null && globalSeqNum >= 1 && globalSeqNum <= 6) {
                    if (!gradesBySequence[globalSeqNum]) {
                        gradesBySequence[globalSeqNum] = [];
                    }
                    gradesBySequence[globalSeqNum].push(grade.marks_obtained);
                    if (isUuidString(assessmentTitle.trim())) {
                        console.log(`[Report Card] Resolved UUID title "${assessmentTitle}" to sequence ${globalSeqNum} for subject "${subjectName}"`);
                    }
                } else {
                    const resolvedTerm =
                        getTermFromAssessment(
                            assessmentTitle,
                            assessment?.term ?? null,
                            sequenceIdToNumberMap,
                            activeTermSequenceCounts
                        ) ??
                        (termMode.mode === 'per_term' ? termMode.term : null);

                    if (resolvedTerm !== null) {
                        unknownGradesByTerm.push({
                            mark: grade.marks_obtained,
                            term: resolvedTerm,
                        });
                    } else {
                        console.warn(`[Report Card] Could not determine sequence for grade (title: "${assessmentTitle}", subject: "${subjectName}"). Using fallback.`);
                        unknownGradesByTerm.push({
                            mark: grade.marks_obtained,
                            term: termMode.mode === 'per_term' ? termMode.term : 1,
                        });
                    }
                }
            }

            // Calculate average per sequence
            const sequenceMarks: Record<string, number | undefined> = {
                seq1: undefined,
                seq2: undefined,
                seq3: undefined,
                seq4: undefined,
                seq5: undefined,
                seq6: undefined
            };
            
            for (const seqNumStr of Object.keys(gradesBySequence)) {
                const seqNum = parseInt(seqNumStr, 10);
                const marks = gradesBySequence[seqNum];
                if (marks.length > 0) {
                    const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
                    if (seqNum >= 1 && seqNum <= activeTotalSequences) {
                        sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }

            // FALLBACK: distribute unmapped grades to the correct term's sequence slots
            if (unknownGradesByTerm.length > 0) {
                const marksByTerm = new Map<number, number[]>();
                for (const entry of unknownGradesByTerm) {
                    if (!marksByTerm.has(entry.term)) marksByTerm.set(entry.term, []);
                    marksByTerm.get(entry.term)!.push(entry.mark);
                }

                for (const [termNum, unknownGrades] of marksByTerm) {
                    const slots = getGlobalSlotsForTerm(termNum as 1 | 2 | 3, activeTermSequenceCounts);
                    if (slots.length === 0) continue;

                    if (unknownGrades.length === 2 && slots.length >= 2) {
                        if (!gradesBySequence[slots[0]]) gradesBySequence[slots[0]] = [];
                        if (!gradesBySequence[slots[1]]) gradesBySequence[slots[1]] = [];
                        gradesBySequence[slots[0]].push(unknownGrades[0]);
                        gradesBySequence[slots[1]].push(unknownGrades[1]);
                        console.log(
                            `[Report Card] Subject "${subjectName}": Distributed 2 unknown Term ${termNum} grades to seq${slots[0]} (${unknownGrades[0]}) and seq${slots[1]} (${unknownGrades[1]})`
                        );
                    } else if (unknownGrades.length === 1) {
                        if (!gradesBySequence[slots[0]]) gradesBySequence[slots[0]] = [];
                        gradesBySequence[slots[0]].push(unknownGrades[0]);
                        console.log(
                            `[Report Card] Subject "${subjectName}": Assigned 1 unknown Term ${termNum} grade to seq${slots[0]} (${unknownGrades[0]})`
                        );
                    } else if (unknownGrades.length > 2) {
                        for (let i = 0; i < Math.min(unknownGrades.length, slots.length); i++) {
                            if (!gradesBySequence[slots[i]]) gradesBySequence[slots[i]] = [];
                            gradesBySequence[slots[i]].push(unknownGrades[i]);
                        }
                        console.log(
                            `[Report Card] Subject "${subjectName}": Distributed ${unknownGrades.length} unknown Term ${termNum} grades across seq${slots.join(', seq')}`
                        );
                    }
                }
            }
            
            // Recalculate sequence marks after potential redistribution
            for (const seqNumStr of Object.keys(gradesBySequence)) {
                const seqNum = parseInt(seqNumStr, 10);
                if (seqNum >= 1 && seqNum <= activeTotalSequences) {
                    const marks = gradesBySequence[seqNum];
                    if (marks && marks.length > 0) {
                        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
                        sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }
            
            // Calculate term average from sequence marks for this report only (not all six slots on a term bulletin)
            let marksForTermAverage: number[] = [];
            if (yearSummary) {
                annualTermAvgsForSubject = getTermAveragesFromSequenceMarks(
                    sequenceMarks,
                    activeTermSequenceCounts
                );
                const annualAvg = getAnnualAverageFromTermAverages(annualTermAvgsForSubject);
                if (annualAvg !== undefined) {
                    marksForTermAverage = [annualAvg];
                } else {
                    const partialTermMarks = [
                        annualTermAvgsForSubject.term1,
                        annualTermAvgsForSubject.term2,
                        annualTermAvgsForSubject.term3,
                    ].filter((m): m is number => typeof m === 'number');
                    if (partialTermMarks.length > 0) {
                        marksForTermAverage =
                            thirdTermTable &&
                            typeof annualTermAvgsForSubject.term3 === 'number'
                                ? [annualTermAvgsForSubject.term3]
                                : partialTermMarks;
                    } else {
                        const populatedAvg = getAverageFromPopulatedSequenceMarks(
                            sequenceMarks,
                            activeTotalSequences
                        );
                        if (populatedAvg !== undefined) {
                            marksForTermAverage = [populatedAvg];
                        }
                    }
                }
            } else if (perTermNum !== null) {
                const slots = getGlobalSequenceSlotsForTerm(perTermNum);
                for (const slot of slots) {
                    const m = sequenceMarks[`seq${slot}`];
                    if (m !== undefined) marksForTermAverage.push(m);
                }
            }

            if (marksForTermAverage.length > 0) {
                finalMark = marksForTermAverage.reduce((acc, m) => acc + m, 0) / marksForTermAverage.length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Found ${marksForTermAverage.length} sequence mark(s) for this report, average: ${finalMark.toFixed(2)}`);

                // Log successful mark calculation for target subjects
                if (isTargetSubject) {
                    console.log(`[${subjectName.toUpperCase()} SUCCESS] Marks calculated successfully:`, {
                        subjectName,
                        finalMark: finalMark.toFixed(2),
                        sequenceMarks: marksForTermAverage,
                        sequenceCount: marksForTermAverage.length
                    });
                }
            } else if (gradesBySequence[0] && gradesBySequence[0].length > 0) {
                // Fallback for legacy grades with more than 2 unknown sequence numbers
                finalMark = gradesBySequence[0].reduce((a, b) => a + b, 0) / gradesBySequence[0].length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Using legacy grades (${gradesBySequence[0].length} grades with unknown sequences), average: ${finalMark.toFixed(2)}`);
                if (termMode.mode === 'per_term' && perTermNum !== null) {
                    const slots = getGlobalSequenceSlotsForTerm(perTermNum);
                    if (slots[0]) {
                        sequenceMarks[`seq${slots[0]}`] = parseFloat(finalMark.toFixed(2));
                    }
                }
                
                // Log legacy marks for target subjects
                if (isTargetSubject) {
                    console.log(`[${subjectName.toUpperCase()} LEGACY] Using legacy grades:`, {
                        subjectName,
                        finalMark: finalMark.toFixed(2),
                        legacyGradesCount: gradesBySequence[0].length
                    });
                }
            } else {
                // Log when no grades found for debugging
                const allAssessmentSubjects = gradesData?.map((g: any) => {
                    const assessment = g.assessment as any;
                    return assessment?.subject || '';
                }).filter(Boolean) || [];
                const uniqueAssessmentSubjects = [...new Set(allAssessmentSubjects)];
                console.warn(`[Report Card] Subject "${subjectName}": No grades found. Available assessment subjects:`, uniqueAssessmentSubjects);
                
                // BC/EPS/AC/HEC SPECIFIC: Detailed logging when marks are missing
                if (isTargetSubject) {
                    console.error(`[${subjectName.toUpperCase()} ERROR] No marks found for subject "${subjectName}"`, {
                        subjectName,
                        normalizedSubjectName: normalizeSubjectName(subjectName),
                        availableAssessmentSubjects: uniqueAssessmentSubjects,
                        normalizedAvailable: uniqueAssessmentSubjects.map(s => normalizeSubjectName(s)),
                        matchingAttempts: uniqueAssessmentSubjects.map(assessSubj => ({
                            assessmentSubject: assessSubj,
                            normalized: normalizeSubjectName(assessSubj),
                            matches: subjectNamesMatch(assessSubj, subjectName)
                        }))
                    });
                }
            }
            computedSequenceMarksForSubject = { ...sequenceMarks };
        }

        if (hasMark) {
            remark = getRemarkForMark(finalMark);
            
            // Track GCE subjects (only subjects with codes) that are PASSED (marks >= 10)
            if (isGceSubject && finalMark >= 10) {
                if (category === 'trade_subjects') {
                    gceTradeSubjectsPassed++;
                    gceSubjectsPassed++;
                } else if (category === 'related_trade_subjects') {
                    gceRelatedTradePassed++;
                    gceSubjectsPassed++;
                } else if (category === 'languages') {
                    gceLanguageSubjectsPassed++;
                    gceSubjectsPassed++;
                } else if (category === 'others') {
                    gceOtherSubjectsPassed++;
                    gceSubjectsPassed++;
                }
            }

            // Get sequence marks for this subject (for normal subjects only)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const subjectSequenceMarks: any = {};
            if (computedSequenceMarksForSubject) {
                for (let i = 1; i <= activeTotalSequences; i++) {
                    const v = computedSequenceMarksForSubject[`seq${i}`];
                    if (v !== undefined) {
                        subjectSequenceMarks[`seq${i}`] = v;
                    }
                }
            } else if (!hasSubBranches) {
                // Branch subject that fell back to standard grades never ran the normal-subject block
                const sGradesForOutput = validGradesData?.filter(g => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const assessment = g.assessment as any;
                    const assessSubject = assessment?.subject || '';
                    return subjectNamesMatch(assessSubject, subjectName) &&
                        gradeIncludedForReport(assessment?.term || null, assessment?.title || null, assessment?.subject || null);
                }) || [];
                const perTermOut = termMode.mode === 'per_term' ? termMode.term : null;
                const gradesBySeq: Record<number, number[]> = {};
                const unknownSeqGrades: number[] = [];
                for (const grade of sGradesForOutput) {
                    const assessmentTitle = grade.assessment?.title || '';
                    let globalSeqNum: number | null = null;
                    if (yearSummary) {
                        globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap);
                    } else if (perTermOut !== null) {
                        const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, perTermOut);
                        if (inTermSeqNum !== null) {
                            globalSeqNum = mapToGlobalSequence(inTermSeqNum, perTermOut);
                        } else {
                            globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap);
                        }
                    }
                    if (globalSeqNum !== null && globalSeqNum >= 1 && globalSeqNum <= activeTotalSequences) {
                        if (!gradesBySeq[globalSeqNum]) gradesBySeq[globalSeqNum] = [];
                        gradesBySeq[globalSeqNum].push(grade.marks_obtained);
                    } else {
                        unknownSeqGrades.push(grade.marks_obtained);
                    }
                }
                if (unknownSeqGrades.length > 0) {
                    const termForDist = termMode.mode === 'per_term' ? termMode.term : 1;
                    const slotsForTerm = getGlobalSequenceSlotsForTerm(termForDist);
                    unknownSeqGrades.forEach((mark, idx) => {
                        const slot = slotsForTerm[idx];
                        if (slot) {
                            if (!gradesBySeq[slot]) gradesBySeq[slot] = [];
                            gradesBySeq[slot].push(mark);
                        }
                    });
                }
                for (let i = 1; i <= activeTotalSequences; i++) {
                    if (gradesBySeq[i] && gradesBySeq[i].length > 0) {
                        const avg = gradesBySeq[i].reduce((a, b) => a + b, 0) / gradesBySeq[i].length;
                        subjectSequenceMarks[`seq${i}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }

            // On term reports, include coefficient only when all sequence marks exist for that term.
            // On annual / third-term summary table, full-year coef requires all slots; partial year uses plannedCoef.
            let eligibleForCoef = true;
            let term1CoefEligible = false;
            let term2CoefEligible = false;
            let term3CoefEligible = false;
            if (yearSummary) {
                eligibleForCoef = isAnnualCoefEligible(
                    subjectSequenceMarks,
                    activeTermSequenceCounts
                );
                term1CoefEligible = isTermCoefEligible(
                    subjectSequenceMarks,
                    1,
                    activeTermSequenceCounts
                );
                term2CoefEligible = isTermCoefEligible(
                    subjectSequenceMarks,
                    2,
                    activeTermSequenceCounts
                );
                term3CoefEligible = isTermCoefEligible(
                    subjectSequenceMarks,
                    3,
                    activeTermSequenceCounts
                );
            } else if (termMode.mode === 'per_term') {
                const slots = getGlobalSequenceSlotsForTerm(termMode.term);
                eligibleForCoef =
                    slots.length > 0 &&
                    slots.every((slot) => typeof subjectSequenceMarks[`seq${slot}`] === 'number');
            }

            const partialAnnualEligible =
                yearSummary &&
                (eligibleForCoef ||
                    term1CoefEligible ||
                    term2CoefEligible ||
                    term3CoefEligible);

            const coef = eligibleForCoef ? subjectCoef : '-';
            const total =
                eligibleForCoef || partialAnnualEligible
                    ? parseFloat((finalMark * subjectCoef).toFixed(2))
                    : '-';

            if (eligibleForCoef || partialAnnualEligible) {
                totalScore += finalMark * subjectCoef;
                totalCoef += subjectCoef;
                if (thirdTermTable && annualTermAvgsForSubject?.term3 !== undefined) {
                    footerTotalScore += annualTermAvgsForSubject.term3 * subjectCoef;
                    footerTotalCoef += subjectCoef;
                }
                if (finalMark >= 10) passedCount++;
            }

            // Get subject rank (will be calculated later if not available yet)
            const subjectRank = subjectRanks.get(normalizeSubjectName(subjectName)) || 0;
            
            if (
                yearSummary &&
                !annualTermAvgsForSubject &&
                Object.keys(subjectSequenceMarks).length > 0
            ) {
                annualTermAvgsForSubject = getTermAveragesFromSequenceMarks(
                    subjectSequenceMarks,
                    activeTermSequenceCounts
                );
            }

            const annualAvgForSubject =
                annualTermAvgsForSubject !== undefined
                    ? getAnnualAverageFromTermAverages(annualTermAvgsForSubject)
                    : undefined;

            const annualTermFields =
                yearSummary && annualTermAvgsForSubject
                    ? {
                          term1: annualTermAvgsForSubject.term1,
                          term2: annualTermAvgsForSubject.term2,
                          term3: annualTermAvgsForSubject.term3,
                          annualAverage: annualAvgForSubject,
                      }
                    : {};

            reportItems.push({
                name: subjectName.trim(), // Ensure trimmed for consistency
                subjectId: subjectId, // Include subjectId for editing functionality
                code: subjectCode || undefined, // Include subject code for GCE identification
                eval: parseFloat(finalMark.toFixed(2)),
                coef: coef,
                plannedCoef: subjectCoef,
                total: total,
                grade: calculateGrade(finalMark),
                rank: subjectRank, 
                remark: remark,
                category: category,
                hasMark: true,
                coefEligible: eligibleForCoef,
                partialAnnualEligible: Boolean(partialAnnualEligible),
                term1CoefEligible,
                term2CoefEligible,
                term3CoefEligible,
                // Include individual sequence marks
                ...subjectSequenceMarks,
                ...annualTermFields,
            });
        } else {
            // Subject has no marks - don't include it in the average calculation
            // Set coefficient to 0 so it's excluded from all calculations and displays
            reportItems.push({
                name: subjectName.trim(), // Ensure trimmed for consistency
                subjectId: subjectId, // Include subjectId for editing functionality
                code: subjectCode || undefined, // Include subject code for GCE identification
                eval: '-',
                coef: 0, // Set to 0 when no marks - excluded from calculations
                plannedCoef: subjectCoef, // Nominal coefficient from class_subjects (display only)
                total: '-',
                grade: '-',
                rank: '-',
                remark: 'No Grade',
                category: category,
                hasMark: false,
                coefEligible: false,
            });
            // Note: Coefficient is set to 0 so subjects without marks don't count toward any calculations
        }
    }

    // Calculate student's rank in class (overall and per subject) using normalized points ranking
    let studentRank = 0;
    let rank1 = 0;
    let rank2 = 0;
    let rank3 = 0;
    let classSize = 0;
    let cohortAnnualAvg: number | undefined;
    let cohortTerm1Avg: number | undefined;
    let cohortTerm2Avg: number | undefined;
    let cohortTerm3Avg: number | undefined;
    let cohortFooterAvg: number | undefined;

    try {
        const gradeBelongsToTerm = (
            term: 1 | 2 | 3,
            assessmentTerm: string | null | undefined,
            assessmentTitle: string | null | undefined,
            assessmentSubject: string | null | undefined
        ): boolean => {
            const resolved = getTermFromAssessment(
                assessmentTitle ?? null,
                assessmentTerm ?? null,
                sequenceIdToNumberMap,
                activeTermSequenceCounts
            );
            if (resolved !== null) return resolved === term;
            if (assessmentTerm) {
                const normalizedDb = assessmentTerm.toLowerCase();
                if (term === 1 && (normalizedDb.includes('1st') || normalizedDb.includes('first') || normalizedDb.includes('term 1'))) return true;
                if (term === 2 && (normalizedDb.includes('2nd') || normalizedDb.includes('second') || normalizedDb.includes('term 2'))) return true;
                if (term === 3 && (normalizedDb.includes('3rd') || normalizedDb.includes('third') || normalizedDb.includes('term 3'))) return true;
            }
            const subj = assessmentSubject ? normalizeSubjectName(assessmentSubject) : '';
            if (subj.includes('office practice') && includeAllTermsGrades) return true;
            return false;
        };

        // Restrict ranking cohort to canonical class references only.
        const { data: classData } = await supabase
            .from('classes')
            .select('name, class_name')
            .eq('id', classId)
            .single();

        const classKeys = Array.from(
            new Set(
                [classId, classData?.name, classData?.class_name]
                    .filter((v): v is string => Boolean(v && v.trim()))
                    .map((v) => v.trim())
            )
        );

        const studentsBuckets: Array<Array<{ id: string; class: string | null }>> = [];
        for (const classKey of classKeys) {
            const { data } = await supabase
                .from('students')
                .select('id, class')
                .eq('class', classKey);
            studentsBuckets.push(data || []);
        }

        const allClassStudents = Array.from(
            new Map(studentsBuckets.flat().map((entry) => [entry.id, entry])).values()
        );
        classSize = allClassStudents.length;
        if (allClassStudents.length === 0) {
            throw new Error(`No class students found for ranking (classId=${classId})`);
        }

        const allStudentIds = allClassStudents.map((s) => s.id);

        interface RankingAssessment {
            subject: string | null;
            title: string | null;
            term?: string | null;
            class_id: string;
            teacher_id?: string | null;
        }
        interface RankingGradeRow {
            marks_obtained: number;
            student_id: string;
            assessment: RankingAssessment | null;
        }
        interface RankingBranchGradeRow {
            marks_obtained: number;
            student_id: string;
            branch_id: string;
            assessment: RankingAssessment | null;
        }

        const { data: allClassGradesRaw, error: allGradesError } = await supabase
            .from('grades')
            .select(`
                marks_obtained,
                student_id,
                assessment:assessments!inner (
                    subject,
                    title,
                    class_id,
                    teacher_id
                )
            `)
            .in('student_id', allStudentIds)
            .eq('assessment.class_id', classId);
        if (allGradesError) {
            console.warn('[Report Card] Failed to fetch grades for class ranking', allGradesError);
            throw new Error(`Ranking aborted: class grades query failed (${allGradesError.message})`);
        }
        const allClassGrades = (allClassGradesRaw as unknown as RankingGradeRow[]) || [];

        const { data: allClassBranchGradesRaw, error: allBranchGradesError } = await supabase
            .from('branch_grades')
            .select(`
                marks_obtained,
                student_id,
                branch_id,
                assessment:branch_assessments!inner (
                    title,
                    term,
                    class_id,
                    academic_year,
                    teacher_id
                )
            `)
            .in('student_id', allStudentIds)
            .eq('assessment.class_id', classId);
        if (allBranchGradesError && allBranchGradesError.code !== 'PGRST205') {
            console.warn('[Report Card] Failed to fetch branch grades for class ranking', allBranchGradesError);
        }
        const allClassBranchGrades = (allClassBranchGradesRaw as unknown as RankingBranchGradeRow[]) || [];

        const branchIdsBySubjectId = new Map<string, string[]>();
        const rankingSubjects = (subjectsList as DbSubject[]).map((subject) => {
            const subjectId = subject.id;
            const branchesOld = subBranches?.filter((sb) => sb.subject_id === subjectId) || [];
            const branchesNew =
                typeof subjectBranchesNew !== 'undefined' && subjectBranchesNew
                    ? subjectBranchesNew.filter((sb: { subject_id: string }) => sb.subject_id === subjectId)
                    : [];
            const branchIds = [
                ...branchesOld.map((b) => b.id),
                ...branchesNew.map((b: { id: string }) => b.id),
            ];
            if (branchIds.length > 0) {
                branchIdsBySubjectId.set(subjectId, branchIds);
            }
            const hasSubBranches =
                Boolean(subject.has_sub_branches) ||
                branchesOld.length > 0 ||
                branchesNew.length > 0;
            return {
                id: subjectId,
                name: subject.name,
                coefficient: subject.coefficient || 1,
                hasSubBranches,
            };
        });

        const branchIdToSubjectId = new Map<string, string>();
        for (const [subjectId, ids] of branchIdsBySubjectId) {
            for (const branchId of ids) {
                branchIdToSubjectId.set(branchId, subjectId);
            }
        }

        const gradesByStudentId = new Map<string, StudentGradeRow[]>();
        for (const grade of allClassGrades) {
            const subjectName = grade.assessment?.subject || '';
            if (!subjectName) continue;
            if (
                !gradeIncludedForReport(
                    null,
                    grade.assessment?.title,
                    subjectName
                )
            ) {
                continue;
            }
            if (
                !shouldIncludeReportCardGrade(
                    subjectName,
                    grade.assessment?.teacher_id,
                    gradeFilterCtx
                )
            ) {
                continue;
            }
            const sid = grade.student_id;
            if (!gradesByStudentId.has(sid)) gradesByStudentId.set(sid, []);
            gradesByStudentId.get(sid)!.push({
                marks_obtained: grade.marks_obtained,
                title: grade.assessment?.title || '',
                subject: subjectName,
                term: null,
            });
        }

        const branchGradesByStudentId = new Map<string, StudentBranchGradeRow[]>();
        const subjectNameById = new Map(
            (subjectsList as DbSubject[]).map((s) => [s.id, s.name] as const)
        );
        for (const bg of allClassBranchGrades) {
            const branchSubjectId = branchIdToSubjectId.get(bg.branch_id);
            if (!branchSubjectId) continue;
            const branchSubjectName = subjectNameById.get(branchSubjectId);
            if (
                !gradeIncludedForReport(
                    bg.assessment?.term ?? null,
                    bg.assessment?.title,
                    branchSubjectName
                )
            ) {
                continue;
            }
            if (
                !shouldIncludeReportCardBranchGrade(
                    branchSubjectId,
                    bg.assessment?.teacher_id,
                    gradeFilterCtx
                )
            ) {
                continue;
            }
            const sid = bg.student_id;
            if (!branchGradesByStudentId.has(sid)) branchGradesByStudentId.set(sid, []);
            branchGradesByStudentId.get(sid)!.push({
                marks_obtained: bg.marks_obtained,
                branch_id: bg.branch_id,
                title: bg.assessment?.title || '',
                term: bg.assessment?.term ?? null,
            });
        }

        const activeTerm = termMode.mode === 'per_term' ? termMode.term : null;
        const overallScope: RankingScope = yearSummary ? 'annual' : 'active_term';

        const cohortBase = {
            studentIds: allStudentIds,
            subjects: rankingSubjects,
            gradesByStudentId,
            branchGradesByStudentId,
            branchIdsBySubjectId,
            yearSummary,
            activeTerm,
            sequenceIdToNumberMap,
            termSequenceCounts: activeTermSequenceCounts,
            totalSequences: activeTotalSequences,
            gradeIncluded: gradeIncludedForReport,
            gradeBelongsToTerm,
            includeAllTermsGrades,
            academicTermId,
        };

        const overallMetrics = buildCohortRankingMetrics({
            ...cohortBase,
            scope: overallScope,
        });
        const overallRankMap = rankCohortByMetrics(overallMetrics);
        studentRank = overallRankMap.get(studentId) || 0;
        const rankedStudents = [...overallMetrics.values()].filter((m) => m.hasMarks);

        const selfOverall = overallMetrics.get(studentId);
        if (selfOverall?.hasMarks) {
            if (yearSummary) {
                cohortAnnualAvg = selfOverall.weightedAvg;
            } else {
                cohortFooterAvg = selfOverall.weightedAvg;
            }
        }

        if (yearSummary) {
            const term1Metrics = buildCohortRankingMetrics({ ...cohortBase, scope: 'term1' });
            const term2Metrics = buildCohortRankingMetrics({ ...cohortBase, scope: 'term2' });
            const term3Metrics = buildCohortRankingMetrics({ ...cohortBase, scope: 'term3' });
            const rank1Map = rankCohortByMetrics(term1Metrics);
            const rank2Map = rankCohortByMetrics(term2Metrics);
            const rank3Map = rankCohortByMetrics(term3Metrics);
            rank1 = rank1Map.get(studentId) || 0;
            rank2 = rank2Map.get(studentId) || 0;
            rank3 = rank3Map.get(studentId) || 0;
            const t1 = term1Metrics.get(studentId);
            const t2 = term2Metrics.get(studentId);
            const t3 = term3Metrics.get(studentId);
            if (t1?.hasMarks) cohortTerm1Avg = t1.weightedAvg;
            if (t2?.hasMarks) cohortTerm2Avg = t2.weightedAvg;
            if (t3?.hasMarks) cohortTerm3Avg = t3.weightedAvg;
            if (termMode.mode === 'per_term' && termMode.term === 3) {
                studentRank = rank3;
            }
        }

        // Subject-level ranks (same subject evals as overall cohort metrics)
        for (const subject of subjectsList as DbSubject[]) {
            const normalizedSubject = normalizeSubjectName(subject.name);
            const subjectRankMap = rankSubjectsForCohort(overallMetrics, normalizedSubject);
            const subjectRank = subjectRankMap.get(studentId);
            if (subjectRank !== undefined && subjectRank > 0) {
                subjectRanks.set(normalizedSubject, subjectRank);
            }
        }

        for (let i = 0; i < reportItems.length; i++) {
            const item = reportItems[i];
            if (typeof item.eval !== 'number' || item.rank === '-') continue;
            const rank = subjectRanks.get(normalizeSubjectName(item.name));
            if (rank !== undefined && rank > 0) {
                reportItems[i].rank = rank;
            }
        }

        console.log('[Report Card] Ranking recalculated with points method', {
            classId,
            studentId,
            studentRank,
            classSize,
            rankingCohortSize: rankedStudents.length,
            excludedNoMarks: classSize - rankedStudents.length
        });
    } catch (error) {
        console.warn('Failed to calculate student rank:', error);
        studentRank = 0;
    }
    
    // Calculate generic stats
    // classSize is set from ranking cohort discovery; defaults to 0 when unavailable
    
    // Determine term number
    let termNumber: 1 | 2 | 3 | 'annual' = 1;
    const lowerTerm = academicTermId.toLowerCase();
    if (lowerTerm.includes('first') || lowerTerm.includes('1st')) termNumber = 1;
    else if (lowerTerm.includes('second') || lowerTerm.includes('2nd')) termNumber = 2;
    else if (lowerTerm.includes('third') || lowerTerm.includes('3rd')) termNumber = 3;
    else if (lowerTerm === 'annual') termNumber = 'annual';

    // Dynamic Subject Grouping Logic
    const groupedSubjects: Record<string, any[]> = {};
    const categoryTitles: Record<string, string> = {
        'general': 'GENERAL SUBJECTS',
        'trade_subjects': 'PROFESSIONAL SUBJECTS',
        'related_trade_subjects': 'RELATED PROFESSIONAL SUBJECTS',
        'others': 'OTHER SUBJECTS',
        'languages': 'LANGUAGE SUBJECTS'
    };
    
    // Sort items by name consistently
    reportItems.sort((a: any, b: any) => a.name.localeCompare(b.name));

    for (const item of reportItems) {
        if (item.remark === 'Excluded for class') continue;
        const rawCat = (item.category || 'others').toLowerCase().trim();
        // Ensure category key is valid or default to 'others'
        const category = categoryTitles[rawCat] ? rawCat : 'others';
        
        if (!groupedSubjects[category]) {
            groupedSubjects[category] = [];
        }
        groupedSubjects[category].push(item);
    }

    // Build grouped sections
    const subjectSections: Record<string, any> = {};
    
    // Explicit order for categories if desired (or just iterate object)
    const categoryOrder = ['general', 'trade_subjects', 'related_trade_subjects', 'languages', 'others'];
    
    // Ensure all groups present in items are processed, even if not in explicit order list
    const allCategories = new Set([...categoryOrder, ...Object.keys(groupedSubjects)]);
    
    allCategories.forEach(category => {
        const items = groupedSubjects[category];
        if (items && items.length > 0) {
            let sectionCoef = 0;
            let sectionTotal = 0;
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items.forEach((item: any) => {
                 const sectionPart = accumulatePartialAnnualSection(item);
                 if (sectionPart) {
                     sectionCoef += sectionPart.coef;
                     sectionTotal += sectionPart.total;
                 }
            });
            
            const sectionAvg = sectionCoef > 0 ? sectionTotal / sectionCoef : 0;
            
            subjectSections[category] = {
                title: categoryTitles[category] || `${category.toUpperCase()} SUBJECTS`,
                items: items,
                summary: {
                    coef: sectionCoef,
                    total: parseFloat(sectionTotal.toFixed(2)),
                    avg: parseFloat(sectionAvg.toFixed(2)),
                    rank: 0, 
                    remark: getRemarkForMark(sectionAvg)
                }
            };
        }
    });

    const historyTerm1 = yearSummary
        ? (cohortTerm1Avg ?? computeWeightedTermHistory(reportItems, 'term1'))
        : 0;
    const historyTerm2 = yearSummary
        ? (cohortTerm2Avg ?? computeWeightedTermHistory(reportItems, 'term2'))
        : 0;
    const historyTerm3 = yearSummary
        ? (cohortTerm3Avg ?? computeWeightedTermHistory(reportItems, 'term3'))
        : 0;
    const historyAnnualAvg = yearSummary
        ? (cohortAnnualAvg ??
          (totalCoef > 0 ? parseFloat((totalScore / totalCoef).toFixed(2)) : 0))
        : 0;

    const footerCoef = thirdTermTable && footerTotalCoef > 0 ? footerTotalCoef : totalCoef;
    const footerScore =
        thirdTermTable && footerTotalCoef > 0
            ? parseFloat(footerTotalScore.toFixed(2))
            : parseFloat(totalScore.toFixed(2));
    const footerAverage =
        cohortFooterAvg ??
        (footerCoef > 0 ? parseFloat((footerScore / footerCoef).toFixed(2)) : 0);

    const reportData: PisonReportCardData = {
        student: {
            // Mapping to strictly match matching fields
            id: student.id, // DB primary key (UUID)
            // Form field matricule_number only (no fallback to auto-generated student_id)
            studentId: String(student.matricule_number ?? '').trim(),
            name: [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' '),
            firstName: student.first_name,
            lastName: student.last_name,
            dob: student.date_of_birth || '',
            pob: student.place_of_birth || '', 
            sex: student.gender === 'male' ? 'M' : 'F',
            class: classData?.class_name || classData?.name || '',
            className: classData?.class_name || classData?.name || '',
            speciality: '',
            classMaster: '',
            enrollment: 0,
            photoUrl: student.profile_picture_url
        },
        academic: {
            year: academicYear,
            term: termNumber,
            orderNo: `REF-${new Date().getFullYear()}`
        },
        subjects: subjectSections,
        totals: {
            coef: footerCoef,
            score: footerScore,
            average: footerAverage,
        },
        history: {
            term1: historyTerm1,
            term2: historyTerm2,
            term3: historyTerm3,
            annualAvg: historyAnnualAvg,
            ...(yearSummary
                ? { rank1, rank2, rank3 }
                : {}),
            rank: studentRank,
        },
        stats: {
            // Fill required fields with defaults if not calculated for whole class
            classSize: classSize,
            maxAvg: 0,
            minAvg: 0,
            passed: passedCount,
            passPercent: subjectsList.length ? parseFloat(((passedCount / subjectsList.length) * 100).toFixed(1)) : 0,
            classAvg: 0,
            
            // Legacy/Optional fields
            max: 0,
            min: 0,
            percent: subjectsList.length ? parseFloat(((passedCount / subjectsList.length) * 100).toFixed(1)) : 0,
            
            // GCE Section counts (only subjects with codes that are PASSED - marks >= 10)
            gceTradeSubjects: gceTradeSubjectsPassed,
            gceRelatedTrade: gceRelatedTradePassed,
            gceLanguageSubjects: gceLanguageSubjectsPassed,
            gceOtherSubjects: gceOtherSubjectsPassed,
            gceSubjectsPassed: gceSubjectsPassed,
        },
        discipline: {
            absences: 0,
            suspensions: 0,
            warnings: 0,
        },
        reportWarnings,
    };

    return NextResponse.json(reportData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });


  } catch (error: unknown) {
    console.error('Report Generation Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { message: message },
      { status: 500 }
    );
  }
}

/**
 * Extract the global sequence number from assessment title (1-6)
 * Matches patterns like: "1st Sequence", "Seq 1", "Sequence 2", "2nd Seq", "First Sequence", "Second Sequence", etc.
 * Returns the global sequence number (1-6), which will be mapped to in-term sequence (1 or 2) based on term
 */
function extractGlobalSequenceNumber(title: string): number | null {
    if (!title) return null;
    
    // First, try to match word-based sequence names (e.g., "First Sequence", "Second Sequence")
    const wordBasedPattern = /(First|Second|Third|Fourth|Fifth|Sixth)\s+[Ss]eq(?:uence)?/i;
    const wordMatch = title.match(wordBasedPattern);
    if (wordMatch) {
        const word = wordMatch[1].toLowerCase();
        const wordToNum: Record<string, number> = {
            'first': 1,
            'second': 2,
            'third': 3,
            'fourth': 4,
            'fifth': 5,
            'sixth': 6
        };
        return wordToNum[word] || null;
    }
    
    // Then try numeric patterns
    const patterns = [
        /(\d+)(?:st|nd|rd|th)?\s*[Ss]eq(?:uence)?/i,  // "1st Sequence", "2nd Seq"
        /[Ss]eq(?:uence)?\s*(\d+)/i,                   // "Seq 1", "Sequence 2"
        /[Ss]équence\s*(\d+)/i,                        // French: "Séquence 1"
        /(\d+)(?:st|nd|rd|th)?\s*[Ee]val(?:uation)?/i, // "1st Evaluation"
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
            const num = parseInt(match[1], 10);
            // Return the number if it's between 1 and 6
            if (num >= 1 && num <= 6) return num;
        }
    }
    return null;
}

/**
 * Extract the in-term sequence number from assessment title (1 or 2)
 * Matches patterns like: "1st Sequence", "Seq 1", "Sequence 2", "2nd Seq", "First Sequence", "Second Sequence", etc.
 * Note: This returns the sequence number within the term (1 or 2), not the global sequence number
 */
function extractInTermSequenceNumber(title: string, termNumber: number): number | null {
    if (!title) return null;
    const globalSeqNum = extractGlobalSequenceNumber(title);
    if (globalSeqNum === null) return null;
    const mapped = globalToTerm(globalSeqNum, activeTermSequenceCounts);
    if (!mapped || mapped.termNumber !== termNumber) return null;
    return mapped.inTermPosition;
}

function mapToGlobalSequence(inTermSeq: number, termNumber: number): number {
    return mapInTermToGlobal(inTermSeq, termNumber as 1 | 2 | 3, activeTermSequenceCounts);
}

/**
 * Get term number from term string
 */
function getTermNumber(termStr: string): number {
    const lower = termStr.toLowerCase();
    if (lower.includes('first') || lower.includes('1st') || lower === '1') return 1;
    if (lower.includes('second') || lower.includes('2nd') || lower === '2') return 2;
    if (lower.includes('third') || lower.includes('3rd') || lower === '3') return 3;
    return 1; // Default to term 1
}

function isUuidString(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}

type AcademicReportTermMode =
    | { mode: 'per_term'; term: 1 | 2 | 3 }
    | { mode: 'annual' };

function parseAcademicTermMode(academicTermId: string): AcademicReportTermMode {
    const lower = academicTermId.toLowerCase();
    if (lower === 'annual' || lower.includes('annual')) {
        return { mode: 'annual' };
    }
    return { mode: 'per_term', term: getTermNumber(academicTermId) as 1 | 2 | 3 };
}

function getGlobalSequenceSlotsForTerm(term: 1 | 2 | 3): number[] {
    return getGlobalSlotsForTerm(term, activeTermSequenceCounts);
}

/** Global sequence 1–6 from title text or academic_sequences UUID / name map */
function resolveGlobalSequenceFromTitle(
    title: string | null | undefined,
    sequenceIdToNumberMap: Map<string, number>
): number | null {
    if (!title) return null;
    const t = title.trim();
    const normalizedTitle = t.toLowerCase();
    if (isUuidString(t) && sequenceIdToNumberMap.has(t)) {
        const n = sequenceIdToNumberMap.get(t);
        if (n !== undefined && n >= 1 && n <= 6) return n;
    }
    if (isUuidString(normalizedTitle) && sequenceIdToNumberMap.has(normalizedTitle)) {
        const n = sequenceIdToNumberMap.get(normalizedTitle);
        if (n !== undefined && n >= 1 && n <= 6) return n;
    }
    if (sequenceIdToNumberMap.has(normalizedTitle)) {
        const n = sequenceIdToNumberMap.get(normalizedTitle);
        if (n !== undefined && n >= 1 && n <= 6) return n;
    }
    return extractGlobalSequenceNumber(t);
}

/**
 * Diagnostic logging function for subject mark verification
 * Logs detailed information about subject matching for BC, EPS, AC, HEC and other specified subjects
 */
function logSubjectMarkDiagnostics(
    subjectName: string,
    classSubjects: any[],
    allGrades: any[],
    subjectTeacherMap: Map<string, Set<string>>,
    studentId: string
): void {
    const targetSubjects = [
        'bc', 'eps', 'ac', 'hec', 
        'building construction', 'physical education', 'accounting', 'home economics',
        'professional english', 'mathematics', 'business mathematics',
        'building construction drawing', 'computer aided management', 
        'electrical technology and diagrams', 'office practice'
    ];
    const normalizedSubject = normalizeSubjectName(subjectName);
    
    // Only log for target subjects
    if (!targetSubjects.some(target => normalizedSubject.includes(target) || target.includes(normalizedSubject))) {
        return;
    }
    
    console.log(`\n[DIAGNOSTIC] === Subject Mark Verification for "${subjectName}" ===`);
    
    // 1. Check if subject exists in class_subjects
    const classSubjectMatch = classSubjects.find((cs: any) => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
        return subj && subjectNamesMatch(subj.name, subjectName);
    });
    
    if (classSubjectMatch) {
        const subj = Array.isArray(classSubjectMatch.subjects) ? classSubjectMatch.subjects[0] : classSubjectMatch.subjects;
        console.log(`[DIAGNOSTIC] ✓ Subject found in class_subjects:`, {
            subjectId: subj?.id,
            subjectName: subj?.name,
            classSubjectId: classSubjectMatch.subject_id,
            classId: classSubjectMatch.class_id
        });
    } else {
        console.log(`[DIAGNOSTIC] ✗ Subject NOT found in class_subjects`);
        console.log(`[DIAGNOSTIC] Available class subjects:`, classSubjects.map((cs: any) => {
            const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
            return subj ? { id: subj.id, name: subj.name, normalized: normalizeSubjectName(subj.name) } : null;
        }).filter(Boolean));
    }
    
    // 2. Check if assessments exist for this subject
    const assessmentSubjects = new Set<string>();
    allGrades.forEach((grade: any) => {
        const assessment = grade.assessment as any;
        if (assessment?.subject) {
            assessmentSubjects.add(assessment.subject);
        }
    });
    
    const matchingAssessments = Array.from(assessmentSubjects).filter(assessSubj => 
        subjectNamesMatch(assessSubj, subjectName)
    );
    
    console.log(`[DIAGNOSTIC] Assessment subjects found:`, Array.from(assessmentSubjects));
    console.log(`[DIAGNOSTIC] Matching assessment subjects:`, matchingAssessments);
    
    // 3. Check teacher assignments
    if (classSubjectMatch) {
        const subj = Array.isArray(classSubjectMatch.subjects) ? classSubjectMatch.subjects[0] : classSubjectMatch.subjects;
        const subjectId = subj?.id;
        if (subjectId) {
            const assignedTeachers = subjectTeacherMap.get(subjectId);
            console.log(`[DIAGNOSTIC] Teacher assignments:`, {
                subjectId,
                hasAssignments: !!assignedTeachers,
                teacherCount: assignedTeachers?.size || 0,
                teacherIds: assignedTeachers ? Array.from(assignedTeachers) : []
            });
        }
    }
    
    // 4. Check grades for this student and subject
    const studentGrades = allGrades.filter((grade: any) => {
        const assessment = grade.assessment as any;
        return grade.student_id === studentId && 
               assessment?.subject && 
               subjectNamesMatch(assessment.subject, subjectName);
    });
    
    console.log(`[DIAGNOSTIC] Grades found for student ${studentId}:`, {
        count: studentGrades.length,
        grades: studentGrades.map((g: any) => ({
            marks: g.marks_obtained,
            assessmentSubject: (g.assessment as any)?.subject,
            assessmentTitle: (g.assessment as any)?.title,
            assessmentId: (g.assessment as any)?.id
        }))
    });
    
    console.log(`[DIAGNOSTIC] === End Diagnostic for "${subjectName}" ===\n`);
}
