import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAcademicYearFromConfig } from '@/lib/app-config-server';
import { PisonReportCardData } from '@/components/admin/reports/report-card-types';

export async function GET(req: NextRequest) {
  /* eslint-disable no-console */
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

  try {
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
      
      // #region agent log - check CPB in class_subjects
      const cpbInClassSubjects = classSubjects.filter(cs => {
        const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
        const name = (subj?.name || '').toLowerCase();
        return name.includes('construction') || name.includes('cpb') || name.includes('building');
      });
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-report/route.ts:cpb-class-subjects',message:'CPB in class_subjects',data:{count:cpbInClassSubjects.length,subjects:cpbInClassSubjects.map(cs=>{const s=Array.isArray(cs.subjects)?cs.subjects[0]:cs.subjects;return{id:s?.id,name:s?.name}}),classId,className:classData?.class_name||classData?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CPB'})}).catch(()=>{});
      // #endregion
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

    // Create a map of subject_id -> array of teacher_ids who are assigned to teach it
    const subjectTeacherMap = new Map<string, Set<string>>();
    if (teacherAssignments) {
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

    // 5. Fetch Sub-branches for these subjects
    // Try both tables: subject_sub_branches (older) and subject_branches (newer)
    let subBranches: any[] = [];
    
    // Try subject_sub_branches first (older system)
    const { data: subBranchesOld, error: subBranchesError } = await supabase
      .from('subject_sub_branches')
      .select('*')
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    if (subBranchesOld) {
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
      console.warn('Failed to fetch grades', gradesError);
    }

    // Filter grades to only include those entered by teachers assigned to teach the subject
    // This ensures data integrity - only marks from authorized teachers appear on report cards
    // EXCEPTION: Office Practice grades are always included regardless of teacher assignment
    let filteredGradesData = typedGradesData;
    
    // #region agent log - check CPB grades before filtering
    const cpbGradesBeforeFilter = typedGradesData.filter((g: any) => {
      const subj = (g.assessment?.subject || '').toLowerCase();
      return subj.includes('construction') || subj.includes('cpb') || subj.includes('building');
    });
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-report/route.ts:cpb-before-filter',message:'CPB grades before teacher filter',data:{count:cpbGradesBeforeFilter.length,grades:cpbGradesBeforeFilter.map((g:any)=>({subject:g.assessment?.subject,mark:g.marks_obtained,title:g.assessment?.title,teacherId:g.assessment?.teacher_id})),classId,studentId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CPB'})}).catch(()=>{});
    // #endregion
    
    if (gradesData && subjectTeacherMap.size > 0) {
      filteredGradesData = typedGradesData.filter((grade) => {
        const assessment = grade.assessment;
        const assessSubject = assessment?.subject || '';
        const assessTeacherId = assessment?.teacher_id;
        const normalizedSubject = normalizeSubjectName(assessSubject);
        const isOfficePractice = normalizedSubject.includes('office practice') || normalizedSubject === 'office practice';
        
        // ALWAYS include Office Practice grades regardless of teacher assignment
        if (isOfficePractice) {
          console.log(`[OFFICE PRACTICE] ✓ Including grade (marks: ${grade.marks_obtained}) - Office Practice grades are always included regardless of teacher assignment`);
          return true;
        }
        
        // Find the subject ID for this grade's subject name
        let matchingSubjectId: string | null = null;
        for (const cs of classSubjects) {
          const subj = Array.isArray(cs.subjects) ? cs.subjects[0] : cs.subjects;
          if (subj && subjectNamesMatch(subj.name, assessSubject)) {
            matchingSubjectId = subj.id;
            break;
          }
        }
        
        if (!matchingSubjectId) {
          console.warn(`[Report Card] No matching subject found for grade subject: "${assessSubject}"`);
          return false;
        }
        
        // Check if the teacher who entered this grade is assigned to teach this subject
        const assignedTeachers = subjectTeacherMap.get(matchingSubjectId);
        if (!assignedTeachers || assignedTeachers.size === 0) {
          // No teachers assigned to this subject - log warning but include the grade
          // (might be legacy data or subject without explicit assignment)
          console.warn(`[Report Card] No teachers assigned to subject "${assessSubject}" (ID: ${matchingSubjectId}). Including grade for backward compatibility.`);
          return true; // Include it anyway to avoid losing data
        }
        
        if (assessTeacherId && !assignedTeachers.has(assessTeacherId)) {
          console.warn(`[Report Card] Grade for subject "${assessSubject}" entered by teacher ${assessTeacherId} who is not assigned to teach this subject. Excluding from report card.`);
          return false;
        }
        
        // If teacher_id is null/undefined, we can't verify, so include it (might be legacy data)
        if (!assessTeacherId) {
          console.warn(`[Report Card] Grade for subject "${assessSubject}" has no teacher_id. Including for backward compatibility.`);
        }
        
        return true;
      });
      
      if (filteredGradesData.length !== gradesData.length) {
        console.log(`[Report Card] Filtered ${gradesData.length - filteredGradesData.length} grades that don't match teacher assignments`);
      }
    }

    // Use filtered grades data (only marks from assigned teachers)
    const validGradesData = filteredGradesData;

    // #region agent log - check CPB grades after filtering
    const cpbGradesAfterFilter = validGradesData.filter((g: any) => {
      const subj = (g.assessment?.subject || '').toLowerCase();
      return subj.includes('construction') || subj.includes('cpb') || subj.includes('building');
    });
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-report/route.ts:cpb-after-filter',message:'CPB grades after teacher filter',data:{countBefore:cpbGradesBeforeFilter.length,countAfter:cpbGradesAfterFilter.length,filtered:cpbGradesBeforeFilter.length-cpbGradesAfterFilter.length,grades:cpbGradesAfterFilter.map((g:any)=>({subject:g.assessment?.subject,mark:g.marks_obtained,title:g.assessment?.title}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CPB'})}).catch(()=>{});
    // #endregion

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
          
          const assignedTeachers = subjectTeacherMap.get(branchSubjectId);
          if (!assignedTeachers || assignedTeachers.size === 0) {
            // No teachers assigned - include for backward compatibility
            return true;
          }
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const assessment = bg.assessment as any;
          const assessTeacherId = assessment?.teacher_id;
          
          if (assessTeacherId && !assignedTeachers.has(assessTeacherId)) {
            console.warn(`[Report Card] Branch grade entered by teacher ${assessTeacherId} who is not assigned to subject ${branchSubjectId}. Excluding from report card.`);
            return false;
          }
          
          return true;
        });
      }
    }

    // Helper to determine term from assessment title using sequence number
    const getTermFromTitle = (title: string | null): number | null => {
        if (!title) return null;
        const globalSeqNum = extractGlobalSequenceNumber(title);
        if (globalSeqNum === null) return null;
        
        // Map global sequence to term:
        // Sequences 1-2 → Term 1
        // Sequences 3-4 → Term 2
        // Sequences 5-6 → Term 3
        if (globalSeqNum >= 1 && globalSeqNum <= 2) return 1;
        if (globalSeqNum >= 3 && globalSeqNum <= 4) return 2;
        if (globalSeqNum >= 5 && globalSeqNum <= 6) return 3;
        return null;
    };

    // Helper to normalize term matching
    const isTargetTerm = (termStr: string | null, title?: string | null) => {
        // First try to determine term from title if provided
        if (title) {
            const termFromTitle = getTermFromTitle(title);
            if (termFromTitle !== null) {
                const requestedTerm = getTermNumber(academicTermId);
                return termFromTitle === requestedTerm;
            }
        }
        
        // Fallback to string matching if termStr is provided
        if (termStr) {
            const normalizedInput = academicTermId.toLowerCase();
            const normalizedDb = termStr.toLowerCase();
            
            if (normalizedInput === normalizedDb) return true;
            
            if (normalizedInput.includes('first') && (normalizedDb.includes('1st') || normalizedDb.includes('first'))) return true;
            if (normalizedInput.includes('second') && (normalizedDb.includes('2nd') || normalizedDb.includes('second'))) return true;
            if (normalizedInput.includes('third') && (normalizedDb.includes('3rd') || normalizedDb.includes('third'))) return true;
            if (normalizedDb.includes(normalizedInput)) return true;
        }
        
        // If we can't determine term from title or termStr, include the grade anyway
        // This handles legacy data or assessments with UUID titles
        // The grade will be processed and included using the fallback mechanism
        console.warn(`[Report Card] Could not determine term for assessment (title: "${title}", term: "${termStr}"). Including grade anyway.`);
        return true;
    };

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
    const subjectsList = Array.from(subjectsMap.values());
    
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
            console.warn(`[Report Card] Class subjects with NO matching assessments:`, missingInAssessments);
        }
        if (missingInClassSubjects.length > 0) {
            console.warn(`[Report Card] Assessment subjects with NO matching class subjects:`, missingInClassSubjects);
        }
    }

    let totalScore = 0;
    let totalCoef = 0;
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSubBranchesFlag = (subject as any).has_sub_branches;
        
        // Check if this subject has branches in either table
        // Some subjects like CPB use subject_branches (newer system) even if has_sub_branches is false
        const branchesFromOldTable = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
        // subjectBranchesNew is defined earlier in the function scope (line ~295)
        const branchesFromNewTable = (typeof subjectBranchesNew !== 'undefined' && subjectBranchesNew) 
          ? subjectBranchesNew.filter((sb: any) => sb.subject_id === subjectId) 
          : [];
        const hasSubBranches = hasSubBranchesFlag || branchesFromOldTable.length > 0 || branchesFromNewTable.length > 0;
        
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
            const validCategories = ['languages', 'related_trade_subjects', 'trade_subjects', 'others'];
            if (validCategories.includes(rawCategory)) {
              category = rawCategory;
            }
          }
        } catch (err) {
          // If there's any error extracting category, default to 'others'
          console.warn('Error extracting subject category:', err);
        }

        let finalMark = 0;
        let hasMark = false;
        let remark = 'No Grade';

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
                    return isTargetTerm(assessment?.term || null, assessment?.title || null);
                  });
                  console.log(`[CPB DIAGNOSTIC] Branch grades for target term: ${termFiltered.length}`);
                }
              }
            }
            
            if (branches.length > 0) {
                let sumScaledMarks = 0;
                let countBranchedGraded = 0;

                for (const branch of branches) {
                    const bGrades = branchGradesData?.filter(bg => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessment = bg.assessment as any;
                        return bg.branch_id === branch.id && 
                            isTargetTerm(assessment?.term || null, assessment?.title || null);
                    }) || [];

                    if (bGrades.length > 0) {
                        // Average marks for this branch
                        const branchAvgRaw = bGrades.reduce((acc, curr) => acc + curr.marks_obtained, 0) / bGrades.length;
                        
                        // Marks are already out of 20
                        const scaledTo20 = branchAvgRaw; 
                        
                        sumScaledMarks += scaledTo20;
                        countBranchedGraded++;
                    }
                }

                if (countBranchedGraded > 0) {
                    // Average of available branches
                    finalMark = sumScaledMarks / countBranchedGraded;
                    hasMark = true;
                    
                    // Log CPB calculation result
                    if (isCPB) {
                      console.log(`[CPB DIAGNOSTIC] Calculated final mark: ${finalMark}, from ${countBranchedGraded} branches`);
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
                    isTargetTerm(assessment?.term || null, assessment?.title || null);
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

            // Determine term number for mapping in-term sequences to global sequences
            const currentTermNumber = getTermNumber(academicTermId);

            // Group grades by GLOBAL sequence number (1-6)
            const gradesBySequence: Record<number, number[]> = {};
            
            // Helper to check if a string is a UUID
            const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
            
            for (const grade of sGrades) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assessmentTitle = (grade.assessment as any).title || '';
                let globalSeqNum: number | null = null;
                
                // First, try to extract sequence number from title text (e.g., "First Sequence", "Seq 1")
                const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
                
                if (inTermSeqNum !== null) {
                    // Map to global sequence number based on term
                    // Term 1: Seq 1 → seq1, Seq 2 → seq2
                    // Term 2: Seq 1 → seq3, Seq 2 → seq4
                    // Term 3: Seq 1 → seq5, Seq 2 → seq6
                    globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
                } else if (isUUID(assessmentTitle) && sequenceIdToNumberMap.has(assessmentTitle)) {
                    // If title is a UUID, look it up in the sequence map
                    globalSeqNum = sequenceIdToNumberMap.get(assessmentTitle) || null;
                    if (globalSeqNum !== null) {
                        console.log(`[Report Card] Resolved UUID title "${assessmentTitle}" to sequence ${globalSeqNum} for subject "${subjectName}"`);
                    }
                }
                
                if (globalSeqNum !== null && globalSeqNum >= 1 && globalSeqNum <= 6) {
                    if (!gradesBySequence[globalSeqNum]) {
                        gradesBySequence[globalSeqNum] = [];
                    }
                    gradesBySequence[globalSeqNum].push(grade.marks_obtained);
                } else {
                    // Fallback: if no sequence number found
                    // For legacy data without sequence in title
                    console.warn(`[Report Card] Could not determine sequence for grade (title: "${assessmentTitle}", subject: "${subjectName}"). Using fallback.`);
                    if (!gradesBySequence[0]) {
                        gradesBySequence[0] = [];
                    }
                    gradesBySequence[0].push(grade.marks_obtained);
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
                    if (seqNum >= 1 && seqNum <= 6) {
                        sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }

            // FALLBACK: If we have unknown grades (in gradesBySequence[0]), distribute them to sequences
            // This handles cases where assessment titles are UUIDs or otherwise unrecognizable
            if (gradesBySequence[0] && gradesBySequence[0].length > 0) {
                const unknownGrades = gradesBySequence[0];
                const currentTermNumber = getTermNumber(academicTermId);
                
                // Calculate which global sequences to use based on term
                // Term 1: seq1, seq2 | Term 2: seq3, seq4 | Term 3: seq5, seq6
                const seq1ForTerm = (currentTermNumber - 1) * 2 + 1; // 1, 3, or 5
                const seq2ForTerm = (currentTermNumber - 1) * 2 + 2; // 2, 4, or 6
                
                if (unknownGrades.length === 2) {
                    // Exactly 2 grades - distribute to seq1 and seq2 for the current term
                    if (!gradesBySequence[seq1ForTerm]) gradesBySequence[seq1ForTerm] = [];
                    if (!gradesBySequence[seq2ForTerm]) gradesBySequence[seq2ForTerm] = [];
                    
                    gradesBySequence[seq1ForTerm].push(unknownGrades[0]);
                    gradesBySequence[seq2ForTerm].push(unknownGrades[1]);
                    
                    console.log(`[Report Card] Subject "${subjectName}": Distributed 2 unknown grades to seq${seq1ForTerm} (${unknownGrades[0]}) and seq${seq2ForTerm} (${unknownGrades[1]})`);
                    
                    // Clear the fallback bucket since we've distributed the grades
                    delete gradesBySequence[0];
                } else if (unknownGrades.length === 1) {
                    // Only 1 grade - assign to seq1 for the current term
                    if (!gradesBySequence[seq1ForTerm]) gradesBySequence[seq1ForTerm] = [];
                    gradesBySequence[seq1ForTerm].push(unknownGrades[0]);
                    
                    console.log(`[Report Card] Subject "${subjectName}": Assigned 1 unknown grade to seq${seq1ForTerm} (${unknownGrades[0]})`);
                    
                    // Clear the fallback bucket
                    delete gradesBySequence[0];
                }
                // For more than 2 grades, we leave them in gradesBySequence[0] for legacy averaging
            }
            
            // Recalculate sequence marks after potential redistribution
            for (const seqNumStr of Object.keys(gradesBySequence)) {
                const seqNum = parseInt(seqNumStr, 10);
                if (seqNum >= 1 && seqNum <= 6) {
                    const marks = gradesBySequence[seqNum];
                    if (marks && marks.length > 0) {
                        const avg = marks.reduce((a, b) => a + b, 0) / marks.length;
                        sequenceMarks[`seq${seqNum}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }
            
            // Calculate term average from available sequence marks
            const availableSeqMarks = Object.values(sequenceMarks).filter((m): m is number => m !== undefined);
            
            if (availableSeqMarks.length > 0) {
                finalMark = availableSeqMarks.reduce((a, b) => a + b, 0) / availableSeqMarks.length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Found ${availableSeqMarks.length} sequence marks, average: ${finalMark.toFixed(2)}`);
                
                // #region agent log - CPB final mark calculation
                const normSubjForLog = normalizeSubjectName(subjectName);
                if (normSubjForLog.includes('construction') || normSubjForLog.includes('cpb') || normSubjForLog.includes('bcd') || normSubjForLog.includes('building')) {
                    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-report/route.ts:cpb-final-mark',message:`CPB subject "${subjectName}" mark calculated`,data:{subjectName,finalMark:finalMark.toFixed(2),hasMark,sequenceMarks,gradesBySequence:Object.fromEntries(Object.entries(gradesBySequence).map(([k,v])=>[k,v])),sGradesCount:sGrades.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CPB'})}).catch(()=>{});
                }
                // #endregion
                
                // Log successful mark calculation for target subjects
                if (isTargetSubject) {
                    console.log(`[${subjectName.toUpperCase()} SUCCESS] Marks calculated successfully:`, {
                        subjectName,
                        finalMark: finalMark.toFixed(2),
                        sequenceMarks: availableSeqMarks,
                        sequenceCount: availableSeqMarks.length
                    });
                }
            } else if (gradesBySequence[0] && gradesBySequence[0].length > 0) {
                // Fallback for legacy grades with more than 2 unknown sequence numbers
                finalMark = gradesBySequence[0].reduce((a, b) => a + b, 0) / gradesBySequence[0].length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Using legacy grades (${gradesBySequence[0].length} grades with unknown sequences), average: ${finalMark.toFixed(2)}`);
                
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
        }

        if (hasMark) {
            const coef = subjectCoef;
            const total = finalMark * coef;
            
            totalScore += total;
            totalCoef += coef;
            if (finalMark >= 10) passedCount++;
            remark = calculateRemark(finalMark);
            
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
            if (!hasSubBranches) {
                // Use validGradesData which has been filtered by teacher assignments
                const sGradesForOutput = validGradesData?.filter(g => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const assessment = g.assessment as any;
                    const assessSubject = assessment?.subject || '';
                    // Use normalized comparison to handle case sensitivity and whitespace
                    return subjectNamesMatch(assessSubject, subjectName) && 
                        isTargetTerm(assessment?.term || null, assessment?.title || null);
                }) || [];
                
                // Recalculate sequence marks for output using proper term-based mapping
                const currentTermNumber = getTermNumber(academicTermId);
                const gradesBySeq: Record<number, number[]> = {};
                const unknownSeqGrades: number[] = [];
                
                // Helper to check if a string is a UUID
                const isUUIDStr = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
                
                for (const grade of sGradesForOutput) {
                    const assessmentTitle = grade.assessment?.title || '';
                    let globalSeqNum: number | null = null;
                    
                    // First try to extract from title text
                    const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
                    if (inTermSeqNum !== null) {
                        globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
                    } else if (isUUIDStr(assessmentTitle) && sequenceIdToNumberMap.has(assessmentTitle)) {
                        // If title is a UUID, look it up in the sequence map
                        globalSeqNum = sequenceIdToNumberMap.get(assessmentTitle) || null;
                    }
                    
                    if (globalSeqNum !== null && globalSeqNum >= 1 && globalSeqNum <= 6) {
                        if (!gradesBySeq[globalSeqNum]) gradesBySeq[globalSeqNum] = [];
                        gradesBySeq[globalSeqNum].push(grade.marks_obtained);
                    } else {
                        // Track unknown grades for fallback distribution
                        unknownSeqGrades.push(grade.marks_obtained);
                    }
                }
                
                // FALLBACK: Distribute unknown grades to sequences based on count
                if (unknownSeqGrades.length > 0) {
                    const seq1ForTerm = (currentTermNumber - 1) * 2 + 1;
                    const seq2ForTerm = (currentTermNumber - 1) * 2 + 2;
                    
                    if (unknownSeqGrades.length === 2) {
                        // Exactly 2 grades - distribute to seq1 and seq2
                        if (!gradesBySeq[seq1ForTerm]) gradesBySeq[seq1ForTerm] = [];
                        if (!gradesBySeq[seq2ForTerm]) gradesBySeq[seq2ForTerm] = [];
                        gradesBySeq[seq1ForTerm].push(unknownSeqGrades[0]);
                        gradesBySeq[seq2ForTerm].push(unknownSeqGrades[1]);
                    } else if (unknownSeqGrades.length === 1) {
                        // Only 1 grade - assign to seq1
                        if (!gradesBySeq[seq1ForTerm]) gradesBySeq[seq1ForTerm] = [];
                        gradesBySeq[seq1ForTerm].push(unknownSeqGrades[0]);
                    }
                    // For more than 2, we can't reliably distribute, so they're not included in sequence marks
                }
                
                for (let i = 1; i <= 6; i++) {
                    if (gradesBySeq[i] && gradesBySeq[i].length > 0) {
                        const avg = gradesBySeq[i].reduce((a, b) => a + b, 0) / gradesBySeq[i].length;
                        subjectSequenceMarks[`seq${i}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }

            // Get subject rank (will be calculated later if not available yet)
            const subjectRank = subjectRanks.get(normalizeSubjectName(subjectName)) || 0;
            
            reportItems.push({
                name: subjectName.trim(), // Ensure trimmed for consistency
                subjectId: subjectId, // Include subjectId for editing functionality
                code: subjectCode || undefined, // Include subject code for GCE identification
                eval: parseFloat(finalMark.toFixed(2)),
                coef: coef,
                total: parseFloat(total.toFixed(2)),
                grade: calculateGrade(finalMark),
                rank: subjectRank, 
                remark: remark,
                category: category,
                // Include individual sequence marks
                ...subjectSequenceMarks
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
                total: '-',
                grade: '-',
                rank: '-',
                remark: 'No Grade',
                category: category
            });
            // Note: Coefficient is set to 0 so subjects without marks don't count toward any calculations
        }
    }

    // #region agent log - CPB in final reportItems
    const cpbInReportItems = reportItems.filter((item: any) => {
        const name = (item.name || '').toLowerCase();
        return name.includes('construction') || name.includes('cpb') || name.includes('bcd') || name.includes('building');
    });
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'student-report/route.ts:cpb-report-items',message:'CPB in final reportItems',data:{count:cpbInReportItems.length,items:cpbInReportItems.map((i:any)=>({name:i.name,eval:i.eval,coef:i.coef,grade:i.grade,seq1:i.seq1,seq2:i.seq2,category:i.category})),totalReportItems:reportItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'CPB'})}).catch(()=>{});
    // #endregion

    // Calculate student's rank in class (overall and per subject)
    // Fetch all students in the same class to calculate rank
    let studentRank = 0;
    
    try {
        // Fetch all students in the class - handle both UUID and class name cases
        // First try by UUID (most reliable)
        let { data: allClassStudents } = await supabase
            .from('students')
            .select('id, class')
            .eq('class', classId);
        
        // If no students found by UUID, try by class name (for backward compatibility)
        if (!allClassStudents || allClassStudents.length === 0) {
            const { data: classData } = await supabase
                .from('classes')
                .select('name, class_name')
                .eq('id', classId)
                .single();
            
            if (classData) {
                const className = classData.class_name || classData.name;
                if (className) {
                    const { data: studentsByName } = await supabase
                        .from('students')
                        .select('id, class')
                        .eq('class', className);
                    
                    if (studentsByName) {
                        allClassStudents = studentsByName;
                    }
                }
            }
        }
        
        if (allClassStudents && allClassStudents.length > 0) {
            const studentAverages: Array<{ studentId: string, average: number }> = [];
            const currentStudentAverage = totalCoef > 0 ? totalScore / totalCoef : 0;
            
            // Calculate subject-level rankings
            // OPTIMIZATION: Fetch all grades for all students in the class at once instead of per-student queries
            const currentTermNumber = getTermNumber(academicTermId);
            const allStudentIds = allClassStudents.map(s => s.id);
            
            // Batch fetch all grades for all students in the class
            interface RankingAssessment {
                subject: string | null;
                class_id: string;
                title: string;
            }
            interface RankingGradeRow {
                marks_obtained: number;
                student_id: string;
                assessment: RankingAssessment | null;
            }

            const { data: allClassGradesRaw, error: allGradesError } = await supabase
                .from('grades')
                .select(`
                    marks_obtained,
                    student_id,
                    assessment:assessments!inner (
                        subject,
                        class_id,
                        title
                    )
                `)
                .in('student_id', allStudentIds)
                .eq('assessment.class_id', classId);
            
            const allClassGrades = (allClassGradesRaw as unknown as RankingGradeRow[]) || [];
            
            if (allGradesError) {
                console.warn('[Report Card] Failed to fetch all class grades for ranking:', allGradesError);
            }
            
            // Process grades by subject for efficient ranking calculation
            for (const subject of subjectsList) {
                const subjectName = (subject as DbSubject).name;
                // const subjectId = (subject as DbSubject).id;
                
                const subjectStudentMarks: Array<{ studentId: string, mark: number }> = [];
                
                // Get current student's mark for this subject
                const currentStudentSubjectMark = reportItems.find((item: any) => 
                    subjectNamesMatch(item.name, subjectName) && typeof item.eval === 'number'
                );
                
                if (currentStudentSubjectMark) {
                    subjectStudentMarks.push({
                        studentId: studentId,
                        mark: currentStudentSubjectMark.eval
                    });
                }
                
                // Process all grades for this subject from the batch-fetched data
                if (allClassGrades && allClassGrades.length > 0) {
                    // Group grades by student_id for this subject
                    const gradesByStudent = new Map<string, number[]>();
                    
                    for (const grade of allClassGrades) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessment = grade.assessment as any;
                        const assessSubject = assessment?.subject || '';
                        
                        // Check if this grade is for the current subject
                        if (!subjectNamesMatch(assessSubject, subjectName)) continue;
                        
                        // Filter for current term
                        const globalSeqNum = extractGlobalSequenceNumber(assessment?.title || '');
                        let termFromTitle: number | null = null;
                        if (globalSeqNum !== null) {
                            if (globalSeqNum >= 1 && globalSeqNum <= 2) termFromTitle = 1;
                            else if (globalSeqNum >= 3 && globalSeqNum <= 4) termFromTitle = 2;
                            else if (globalSeqNum >= 5 && globalSeqNum <= 6) termFromTitle = 3;
                        }
                        if (termFromTitle !== currentTermNumber) continue;
                        
                        // Skip current student (already added above)
                        if (grade.student_id === studentId) continue;
                        
                        // Add grade to student's collection
                        if (!gradesByStudent.has(grade.student_id)) {
                            gradesByStudent.set(grade.student_id, []);
                        }
                        gradesByStudent.get(grade.student_id)!.push(grade.marks_obtained);
                    }
                    
                    // Calculate average for each student
                    for (const [studentIdKey, marks] of gradesByStudent.entries()) {
                        if (marks.length > 0) {
                            const subjectAvg = marks.reduce((sum, m) => sum + m, 0) / marks.length;
                            subjectStudentMarks.push({
                                studentId: studentIdKey,
                                mark: subjectAvg
                            });
                        }
                    }
                }
                
                // Sort by mark descending and calculate rank
                subjectStudentMarks.sort((a, b) => b.mark - a.mark);
                
                // Find current student's rank in this subject
                let subjectRank = 0;
                let currentRank = 1;
                for (let i = 0; i < subjectStudentMarks.length; i++) {
                    if (i > 0 && subjectStudentMarks[i].mark < subjectStudentMarks[i - 1].mark) {
                        currentRank = i + 1;
                    }
                    if (subjectStudentMarks[i].studentId === studentId) {
                        subjectRank = currentRank;
                        break;
                    }
                }
                
                if (subjectRank > 0) {
                    subjectRanks.set(normalizeSubjectName(subjectName), subjectRank);
                }
            }
            
            // Calculate average for each student in the class
            // OPTIMIZATION: Use the batch-fetched grades instead of per-student queries
            // Add current student first
            studentAverages.push({
                studentId: studentId,
                average: currentStudentAverage
            });
            
            // Process all other students using the batch-fetched grades
            if (allClassGrades && allClassGrades.length > 0) {
                // Group grades by student_id
                const gradesByStudent = new Map<string, any[]>();
                for (const grade of allClassGrades) {
                    if (grade.student_id === studentId) continue; // Skip current student (already added)
                    
                    if (!gradesByStudent.has(grade.student_id)) {
                        gradesByStudent.set(grade.student_id, []);
                    }
                    gradesByStudent.get(grade.student_id)!.push(grade);
                }
                
                // Calculate average for each student
                for (const [otherStudentId, studentGrades] of gradesByStudent.entries()) {
                    // Filter grades for current term
                    const termGrades = studentGrades.filter(grade => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessment = grade.assessment as any;
                        const globalSeqNum = extractGlobalSequenceNumber(assessment?.title || '');
                        let termFromTitle: number | null = null;
                        if (globalSeqNum !== null) {
                            if (globalSeqNum >= 1 && globalSeqNum <= 2) termFromTitle = 1;
                            else if (globalSeqNum >= 3 && globalSeqNum <= 4) termFromTitle = 2;
                            else if (globalSeqNum >= 5 && globalSeqNum <= 6) termFromTitle = 3;
                        }
                        return termFromTitle === currentTermNumber;
                    });
                    
                    if (termGrades.length > 0) {
                        // Group grades by subject and calculate averages
                        const subjectTotals: Record<string, { total: number, coef: number }> = {};
                        
                        for (const subject of subjectsList) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const subjectName = (subject as any).name;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const coef = (subject as any).coefficient || 1;
                            
                            // Get all grades for this subject
                            const subjectGrades = termGrades.filter(g => {
                                const assessSubject = g.assessment?.subject || '';
                                return subjectNamesMatch(assessSubject, subjectName);
                            });
                            
                            if (subjectGrades.length > 0) {
                                const subjectAvg = subjectGrades.reduce((sum, g) => sum + g.marks_obtained, 0) / subjectGrades.length;
                                subjectTotals[subjectName] = { 
                                    total: subjectAvg * coef, 
                                    coef: coef 
                                };
                            }
                        }
                        
                        // Calculate overall average
                        const otherTotalScore = Object.values(subjectTotals).reduce((sum, s) => sum + s.total, 0);
                        const otherTotalCoef = Object.values(subjectTotals).reduce((sum, s) => sum + s.coef, 0);
                        const otherAverage = otherTotalCoef > 0 ? otherTotalScore / otherTotalCoef : 0;
                        
                        studentAverages.push({
                            studentId: otherStudentId,
                            average: otherAverage
                        });
                    } else {
                        // Student has no grades for this term, add with 0 average
                        studentAverages.push({
                            studentId: otherStudentId,
                            average: 0
                        });
                    }
                }
            }
            
            // Add students with no grades at all
            for (const classStudent of allClassStudents) {
                if (classStudent.id === studentId) continue;
                if (!studentAverages.find(s => s.studentId === classStudent.id)) {
                    studentAverages.push({
                        studentId: classStudent.id,
                        average: 0
                    });
                }
            }
            
            // Sort by average descending and assign ranks
            studentAverages.sort((a, b) => b.average - a.average);
            
            // Calculate ranks with proper tie handling
            // Students with the same average get the same rank
            // Next rank skips the number of students with the previous rank
            let currentRank = 1;
            for (let i = 0; i < studentAverages.length; i++) {
                // If this is not the first student and average is different from previous, update rank
                if (i > 0 && studentAverages[i].average < studentAverages[i - 1].average) {
                    // Count how many students have the previous average (for tie handling)
                    // let tieCount = 1;
                    for (let j = i - 2; j >= 0 && studentAverages[j].average === studentAverages[i - 1].average; j--) {
                        // tieCount++;
                    }
                    currentRank = i + 1;
                }
                
                // If this is the current student, record their rank
                if (studentAverages[i].studentId === studentId) {
                    studentRank = currentRank;
                    break;
                }
            }
            
            // Log ranking information for debugging
            console.log(`[Report Card] Student rank calculation:`, {
                studentId,
                studentRank,
                totalStudents: studentAverages.length,
                studentAverage: currentStudentAverage,
                topAverage: studentAverages[0]?.average,
                bottomAverage: studentAverages[studentAverages.length - 1]?.average
            });
            
            // Update reportItems with calculated subject ranks
            for (let i = 0; i < reportItems.length; i++) {
                const item = reportItems[i];
                if (typeof item.eval === 'number' && item.rank !== '-') {
                    const normalizedName = normalizeSubjectName(item.name);
                    const rank = subjectRanks.get(normalizedName);
                    if (rank !== undefined && rank > 0) {
                        reportItems[i].rank = rank;
                    } else if (rank === undefined) {
                        // Subject rank not calculated (might be no other students with marks)
                        // Keep existing rank (0 or calculated value)
                        console.warn(`[Report Card] Subject rank not found for "${item.name}"`);
                    }
                }
            }
            
            // Log subject ranks for debugging
            console.log(`[Report Card] Subject ranks calculated:`, 
                Array.from(subjectRanks.entries()).map(([name, rank]) => ({ subject: name, rank }))
            );
        }
    } catch (error) {
        // If rank calculation fails, default to 0
        console.warn('Failed to calculate student rank:', error);
        studentRank = 0;
    }
    
    // Calculate generic stats
    const classSize = 0; // Requires refetching all students for class
    
    // Determine term number
    let termNumber: 1 | 2 | 3 | 'annual' = 1;
    const lowerTerm = academicTermId.toLowerCase();
    if (lowerTerm.includes('first') || lowerTerm.includes('1st')) termNumber = 1;
    else if (lowerTerm.includes('second') || lowerTerm.includes('2nd')) termNumber = 2;
    else if (lowerTerm.includes('third') || lowerTerm.includes('3rd')) termNumber = 3;
    else if (lowerTerm === 'annual') termNumber = 'annual';

    const reportData: PisonReportCardData = {
        student: {
            // Mapping to strictly match matching fields
            id: student.id, // DB primary key (UUID)
            studentId: student.matricule_number || student.student_id || '', // Matricule number for display
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
        subjects: {
            general: {
                title: 'GENERAL SUBJECTS',
                items: reportItems,
                summary: {
                    coef: totalCoef,
                    total: parseFloat(totalScore.toFixed(2)),
                    avg: totalCoef ? parseFloat((totalScore / totalCoef).toFixed(2)) : 0,
                    rank: 0,
                    remark: ''
                }
            }
        },
        totals: {
            coef: totalCoef,
            score: parseFloat(totalScore.toFixed(2)),
            average: totalCoef ? parseFloat((totalScore / totalCoef).toFixed(2)) : 0
        },
        history: {
            term1: 0,
            term2: 0,
            term3: 0,
            annualAvg: 0,
            rank: studentRank
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
        }
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

function calculateGrade(mark: number) {
    if (mark >= 17) return 'A';
    if (mark >= 14) return 'B';
    if (mark >= 10) return 'C';
    if (mark >= 7) return 'D';
    return 'U';
}

function calculateRemark(mark: number) {
    if (mark >= 17) return 'Excellent';
    if (mark >= 14) return 'Very Good';
    if (mark >= 10) return 'Passed';
    if (mark >= 7) return 'Failed';
    return 'Very Weak';
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
    
    // First extract the global sequence number
    const globalSeqNum = extractGlobalSequenceNumber(title);
    if (globalSeqNum === null) return null;
    
    // Map global sequence number to in-term sequence number based on term
    // Term 1: seq1, seq2 → 1, 2
    // Term 2: seq3, seq4 → 1, 2
    // Term 3: seq5, seq6 → 1, 2
    if (termNumber === 1) {
        if (globalSeqNum === 1) return 1;
        if (globalSeqNum === 2) return 2;
    } else if (termNumber === 2) {
        if (globalSeqNum === 3) return 1;
        if (globalSeqNum === 4) return 2;
    } else if (termNumber === 3) {
        if (globalSeqNum === 5) return 1;
        if (globalSeqNum === 6) return 2;
    }
    
    // If the global sequence doesn't match the current term, return null
    return null;
}

/**
 * Map in-term sequence number (1 or 2) to global sequence number (1-6)
 * based on the term
 * - Term 1: Seq 1 → seq1, Seq 2 → seq2
 * - Term 2: Seq 1 → seq3, Seq 2 → seq4
 * - Term 3: Seq 1 → seq5, Seq 2 → seq6
 */
function mapToGlobalSequence(inTermSeq: number, termNumber: number): number {
    const baseOffset = (termNumber - 1) * 2;
    return baseOffset + inTermSeq;
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

/**
 * Subject alias mapping for common abbreviations
 * Maps abbreviations and variations to canonical subject names
 */
const SUBJECT_ALIASES: Record<string, string[]> = {
    'building construction': ['bc', 'b.c.', 'b.c', 'buildingconstruction', 'construction'],
    'physical education': ['eps', 'e.p.s.', 'e.p.s', 'pe', 'p.e.', 'p.e', 'physicaleducation', 'sport'],
    'accounting': ['ac', 'a.c.', 'a.c', 'accountancy', 'accounts'],
    'home economics': ['hec', 'h.e.c.', 'h.e.c', 'homeeconomics', 'home ec', 'homeec'],
    'office practice': ['op', 'o.p.', 'o.p', 'officepractice', 'office prac', 'off practice'],
    'mathematics': ['math', 'maths', 'general mathematics', 'general math', 'gen math'],
    'business mathematics': ['business math', 'biz math', 'business maths', 'bm', 'b.m.', 'commercial math', 'commercial mathematics'],
};

/**
 * Get all possible variations of a subject name (including aliases)
 */
function getSubjectVariations(name: string): string[] {
    const normalized = normalizeSubjectName(name);
    const variations = [normalized];
    
    // Check if this name is an alias for another subject
    for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
        if (normalized === canonical || aliases.includes(normalized)) {
            // Add canonical name and all aliases
            variations.push(canonical);
            variations.push(...aliases);
        }
    }
    
    // Also check if normalized name matches any canonical name
    if (SUBJECT_ALIASES[normalized]) {
        variations.push(...SUBJECT_ALIASES[normalized]);
    }
    
    return [...new Set(variations)]; // Remove duplicates
}

/**
 * Normalize subject name for consistent comparison
 * Trims whitespace and converts to lowercase
 * Also handles common abbreviations via alias mapping
 */
function normalizeSubjectName(name: string | null | undefined): string {
    if (!name) return '';
    const trimmed = name.trim().toLowerCase();
    
    // Check if this is a known alias and return canonical name
    for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
        if (trimmed === canonical || aliases.includes(trimmed)) {
            return canonical;
        }
    }
    
    return trimmed;
}

/**
 * Check if two subject names match (case-insensitive, trimmed, with alias support)
 * Also handles partial matches for longer subject names
 */
function subjectNamesMatch(name1: string | null | undefined, name2: string | null | undefined): boolean {
    if (!name1 || !name2) return false;
    
    const norm1 = normalizeSubjectName(name1);
    const norm2 = normalizeSubjectName(name2);
    
    // Exact match
    if (norm1 === norm2) return true;
    
    // Check if they're aliases of the same subject
    const variations1 = getSubjectVariations(name1);
    const variations2 = getSubjectVariations(name2);
    
    if (variations1.some(v1 => variations2.includes(v1))) return true;
    
    // For longer subject names, try partial matching
    // If one name contains the other (after removing common words), consider it a match
    const removeCommonWords = (str: string): string => {
        const commonWords = ['the', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'a', 'an'];
        return str.split(' ')
            .filter(word => !commonWords.includes(word))
            .join(' ')
            .trim();
    };
    
    const cleaned1 = removeCommonWords(norm1);
    const cleaned2 = removeCommonWords(norm2);
    
    // Word-by-word matching for multi-word subjects
    const words1 = cleaned1.split(' ').filter(w => w.length > 2);
    const words2 = cleaned2.split(' ').filter(w => w.length > 2);
    
    // IMPORTANT: Prevent false matches between single-word and multi-word subjects
    // "Mathematics" should NOT match "Business Mathematics"
    // Only allow exact match for single-word subjects unless they're aliases
    if (words1.length === 1 && words2.length === 1) {
        // Both are single words - exact match only
        return words1[0] === words2[0];
    }
    
    // If one is single-word and other is multi-word, don't match by substring
    // (This prevents "Mathematics" from matching "Business Mathematics")
    if ((words1.length === 1 && words2.length > 1) || (words1.length > 1 && words2.length === 1)) {
        // Only match if the single word equals ALL words in the multi-word subject (very rare case)
        return false;
    }
    
    // For multi-word subjects (both have multiple words), check if they share significant words
    if (words1.length > 1 && words2.length > 1) {
        const matchingWords = words1.filter(w1 => words2.some(w2 => w1 === w2));
        // Require at least 2 exact word matches, or all words from one subject present in the other
        if (matchingWords.length >= 2) {
            return true;
        }
        // Check if one is a subset of the other (all words match exactly)
        const allWords1Match = words1.every(w1 => words2.includes(w1));
        const allWords2Match = words2.every(w2 => words1.includes(w2));
        if (allWords1Match || allWords2Match) {
            return true;
        }
    }
    
    return false;
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