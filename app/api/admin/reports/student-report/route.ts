import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAcademicYearFromConfig } from '@/lib/app-config-server';
import { PisonReportCardData } from '@/components/admin/reports/report-card-types';

export async function GET(req: NextRequest) {
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/reports/student-report/route.ts:21',message:'student-report endpoint called',data:{studentId,classId,academicTermId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/reports/student-report/route.ts:26',message:'Student fetched in student-report',data:{requestedStudentId:studentId,found:!!student,studentDbId:student?.id,studentDbIdField:student?.student_id,studentFirstName:student?.first_name,studentLastName:student?.last_name,studentClass:student?.class,error:studentError?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // 2. Fetch Class Details (for Year/Level)
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('*')
      .eq('id', classId)
      .single();

    if (classError) {
      // eslint-disable-next-line no-console
      console.warn('Class not found', classError);
    }

    // 3. Fetch Class Subjects
    // Explicitly define return type to avoid array-inference issues on joins
    const { data: classSubjects, error: subjectsError } = await supabase
      .from('class_subjects')
      .select(`
        subject_id,
        subjects!inner (
          id,
          name,
          code,
          coefficient,
          has_sub_branches,
          subject_groupings
        )
      `)
      .eq('class_id', classId);

    if (subjectsError) {
      throw new Error('Failed to fetch subjects');
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
      // eslint-disable-next-line no-console
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
              ? subjectByName.subjects[0]?.id 
              : subjectByName.subjects?.id;
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
    const { data: subBranches, error: subBranchesError } = await supabase
      .from('subject_sub_branches')
      .select('*')
      .in('subject_id', subjectIds)
      .eq('is_active', true);

    if (subBranchesError) {
      // eslint-disable-next-line no-console
      console.warn('Failed to fetch sub-branches', subBranchesError);
    }

    // 6. Fetch Grades
    // Teachers enter grades by selecting: Subject (from their assigned subjects) -> Term -> Sequence -> Marks
    // Assessments are just a technical grouping mechanism in the database
    // We fetch grades and filter to ensure only marks from teachers assigned to teach each subject are included
    
    // Always use academic year from App Configuration
    const academicYear = await getAcademicYearFromConfig();

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

    if (gradesError) {
      console.warn('Failed to fetch grades', gradesError);
    }

    // Filter grades to only include those entered by teachers assigned to teach the subject
    // This ensures data integrity - only marks from authorized teachers appear on report cards
    let filteredGradesData = gradesData;
    if (gradesData && subjectTeacherMap.size > 0) {
      filteredGradesData = gradesData.filter((grade: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const assessment = grade.assessment as any;
        const assessSubject = assessment?.subject || '';
        const assessTeacherId = assessment?.teacher_id;
        
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
    const validGradesData = filteredGradesData || gradesData;

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
        const branchIds = [...new Set(branchGradesData.map((bg: any) => bg.branch_id))];
        const { data: branchDetails } = await supabase
          .from('subject_sub_branches')
          .select('id, subject_id')
          .in('id', branchIds);
        
        const branchToSubjectMap = new Map<string, string>();
        if (branchDetails) {
          branchDetails.forEach((branch: any) => {
            branchToSubjectMap.set(branch.id, branch.subject_id);
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
        if (!termStr) return false;
        const normalizedInput = academicTermId.toLowerCase();
        const normalizedDb = termStr.toLowerCase();
        
        if (normalizedInput === normalizedDb) return true;
        
        if (normalizedInput.includes('first') && (normalizedDb.includes('1st') || normalizedDb.includes('first'))) return true;
        if (normalizedInput.includes('second') && (normalizedDb.includes('2nd') || normalizedDb.includes('second'))) return true;
        if (normalizedInput.includes('third') && (normalizedDb.includes('3rd') || normalizedDb.includes('third'))) return true;
        return normalizedDb.includes(normalizedInput);
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

    let totalScore = 0;
    let totalCoef = 0;
    let passedCount = 0;
    
    // Track processed subject names to prevent duplicates in reportItems
    const processedSubjectNames = new Set<string>();

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
        const hasSubBranches = (subject as any).has_sub_branches;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subjectCoef = (subject as any).coefficient || 1;
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
            const branches = subBranches?.filter(sb => sb.subject_id === subjectId) || [];
            
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
                }
            }

        } else {
            // Normal Subject - Group grades by sequence number
            // Use validGradesData which has been filtered by teacher assignments
            const sGrades = validGradesData?.filter(g => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assessment = g.assessment as any;
                const assessSubject = assessment?.subject || '';
                // Use normalized comparison to handle case sensitivity and whitespace
                return subjectNamesMatch(assessSubject, subjectName) && 
                    isTargetTerm(assessment?.term || null, assessment?.title || null);
            }) || [];

            // Determine term number for mapping in-term sequences to global sequences
            const currentTermNumber = getTermNumber(academicTermId);

            // Group grades by GLOBAL sequence number (1-6)
            const gradesBySequence: Record<number, number[]> = {};
            
            for (const grade of sGrades) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assessmentTitle = (grade.assessment as any).title || '';
                // Extract in-term sequence number (1 or 2) based on term
                const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
                
                if (inTermSeqNum !== null) {
                    // Map to global sequence number based on term
                    // Term 1: Seq 1 → seq1, Seq 2 → seq2
                    // Term 2: Seq 1 → seq3, Seq 2 → seq4
                    // Term 3: Seq 1 → seq5, Seq 2 → seq6
                    const globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
                    if (!gradesBySequence[globalSeqNum]) {
                        gradesBySequence[globalSeqNum] = [];
                    }
                    gradesBySequence[globalSeqNum].push(grade.marks_obtained);
                } else {
                    // Fallback: if no sequence number found
                    // For legacy data without sequence in title
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

            // Calculate term average from available sequence marks
            const availableSeqMarks = Object.values(sequenceMarks).filter((m): m is number => m !== undefined);
            
            if (availableSeqMarks.length > 0) {
                finalMark = availableSeqMarks.reduce((a, b) => a + b, 0) / availableSeqMarks.length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Found ${availableSeqMarks.length} sequence marks, average: ${finalMark.toFixed(2)}`);
            } else if (gradesBySequence[0] && gradesBySequence[0].length > 0) {
                // Fallback for legacy grades without sequence numbers
                finalMark = gradesBySequence[0].reduce((a, b) => a + b, 0) / gradesBySequence[0].length;
                hasMark = true;
                console.log(`[Report Card] Subject "${subjectName}": Using legacy grades (no sequence numbers), average: ${finalMark.toFixed(2)}`);
            } else {
                // Log when no grades found for debugging
                const allAssessmentSubjects = gradesData?.map((g: any) => {
                    const assessment = g.assessment as any;
                    return assessment?.subject || '';
                }).filter(Boolean) || [];
                const uniqueAssessmentSubjects = [...new Set(allAssessmentSubjects)];
                console.warn(`[Report Card] Subject "${subjectName}": No grades found. Available assessment subjects:`, uniqueAssessmentSubjects);
            }
        }

        if (hasMark) {
            const coef = subjectCoef;
            const total = finalMark * coef;
            
            totalScore += total;
            totalCoef += coef;
            if (finalMark >= 10) passedCount++;
            remark = calculateRemark(finalMark);

            // Get sequence marks for this subject (for normal subjects only)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let subjectSequenceMarks: any = {};
            if (!hasSubBranches) {
                // Use validGradesData which has been filtered by teacher assignments
                const sGrades = validGradesData?.filter(g => {
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
                
                for (const grade of sGrades) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const assessmentTitle = (grade.assessment as any).title || '';
                    const inTermSeqNum = extractInTermSequenceNumber(assessmentTitle, currentTermNumber);
                    if (inTermSeqNum !== null) {
                        // Map in-term sequence (1 or 2) to global sequence (1-6)
                        const globalSeqNum = mapToGlobalSequence(inTermSeqNum, currentTermNumber);
                        if (!gradesBySeq[globalSeqNum]) gradesBySeq[globalSeqNum] = [];
                        gradesBySeq[globalSeqNum].push(grade.marks_obtained);
                    }
                }
                
                for (let i = 1; i <= 6; i++) {
                    if (gradesBySeq[i] && gradesBySeq[i].length > 0) {
                        const avg = gradesBySeq[i].reduce((a, b) => a + b, 0) / gradesBySeq[i].length;
                        subjectSequenceMarks[`seq${i}`] = parseFloat(avg.toFixed(2));
                    }
                }
            }

            reportItems.push({
                name: subjectName.trim(), // Ensure trimmed for consistency
                eval: parseFloat(finalMark.toFixed(2)),
                coef: coef,
                total: parseFloat(total.toFixed(2)),
                grade: calculateGrade(finalMark),
                rank: 0, 
                remark: remark,
                category: category,
                // Include individual sequence marks
                ...subjectSequenceMarks
            });
        } else {
            reportItems.push({
                name: subjectName.trim(), // Ensure trimmed for consistency
                eval: '-',
                coef: subjectCoef,
                total: '-',
                grade: '-',
                rank: '-',
                remark: 'No Grade',
                category: category
            });
            totalCoef += subjectCoef;
        }
    }

    // Calculate student's rank in class
    // Fetch all students in the same class to calculate rank
    let studentRank = 0;
    try {
        const { data: allClassStudents } = await supabase
            .from('students')
            .select('id')
            .eq('class', classId);
        
        if (allClassStudents && allClassStudents.length > 0) {
            const studentAverages: Array<{ studentId: string, average: number }> = [];
            const currentStudentAverage = totalCoef > 0 ? totalScore / totalCoef : 0;
            
            // Calculate average for each student in the class
            for (const classStudent of allClassStudents) {
                if (classStudent.id === studentId) {
                    // Add current student
                    studentAverages.push({
                        studentId: classStudent.id,
                        average: currentStudentAverage
                    });
                    continue;
                }
                
                // Calculate average for other students
                const { data: otherStudentGrades } = await supabase
                    .from('grades')
                    .select(`
                        marks_obtained,
                        assessment:assessments!inner (
                            subject,
                            class_id,
                            title
                        )
                    `)
                    .eq('student_id', classStudent.id)
                    .eq('assessment.class_id', classId);
                
                if (otherStudentGrades && otherStudentGrades.length > 0) {
                    // Filter grades for current term
                    const currentTermNumber = getTermNumber(academicTermId);
                    const termGrades = otherStudentGrades.filter(grade => {
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
                    
                    // Group grades by subject and calculate averages
                    const subjectTotals: Record<string, { total: number, coef: number }> = {};
                    
                    for (const subject of subjectsList) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const subjectName = (subject as any).name;
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const coef = (subject as any).coefficient || 1;
                        
                    // Get all grades for this subject
                    // Use normalized comparison to handle case sensitivity and whitespace
                    // Note: termGrades is already filtered from validGradesData which respects teacher assignments
                    const subjectGrades = termGrades.filter(g => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const assessSubject = (g.assessment as any).subject || '';
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
                        studentId: classStudent.id,
                        average: otherAverage
                    });
                } else {
                    // Student has no grades, add with 0 average
                    studentAverages.push({
                        studentId: classStudent.id,
                        average: 0
                    });
                }
            }
            
            // Sort by average descending and assign ranks
            studentAverages.sort((a, b) => b.average - a.average);
            
            // Find rank of current student
            let rank = 1;
            for (let i = 0; i < studentAverages.length; i++) {
                if (i > 0 && studentAverages[i].average < studentAverages[i - 1].average) {
                    rank = i + 1;
                }
                if (studentAverages[i].studentId === studentId) {
                    studentRank = rank;
                    break;
                }
            }
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
            id: student.student_id, // ID for display
            studentId: student.id, // DB primary key
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
        }
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/admin/reports/student-report/route.ts:353',message:'Returning reportData',data:{requestedStudentId:studentId,reportDataStudentId:reportData.student.id,reportDataStudentIdField:reportData.student.studentId,reportDataName:reportData.student.name,reportDataClassName:reportData.student.className,subjectsCount:reportData.subjects.general.items.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion

    return NextResponse.json(reportData);


  } catch (error: unknown) {
    // eslint-disable-next-line no-console
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
 * Normalize subject name for consistent comparison
 * Trims whitespace and converts to lowercase
 */
function normalizeSubjectName(name: string | null | undefined): string {
    if (!name) return '';
    return name.trim().toLowerCase();
}

/**
 * Check if two subject names match (case-insensitive, trimmed)
 */
function subjectNamesMatch(name1: string | null | undefined, name2: string | null | undefined): boolean {
    return normalizeSubjectName(name1) === normalizeSubjectName(name2);
}