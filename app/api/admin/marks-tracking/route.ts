import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'
import type { MarksTrackingResponse, MarksTrackingSummary } from '@/lib/marks-tracking-types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' } as MarksTrackingResponse,
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear') || await getAcademicYearFromConfig()
    const term = searchParams.get('term') || null
    const classId = searchParams.get('classId') || null
    const subjectId = searchParams.get('subjectId') || null

    // Get all teacher assignments for the academic year and term
    const teacherAssignmentsQuery = supabase
      .from('teacher_branch_assignments')
      .select(`
        teacher_id,
        branch_id,
        class_id,
        academic_year,
        term,
        branch:subject_branches(
          id,
          branch_name,
          branch_code,
          subject_id,
          subjects:subject_id(
            id,
            name,
            code
          )
        ),
        teacher:teachers(
          id,
          first_name,
          last_name,
          email
        ),
        class:classes(
          id,
          class_name,
          class_level
        )
      `)
      .eq('academic_year', academicYear)
      .eq('status', 'active')

    if (term) {
      teacherAssignmentsQuery.eq('term', term)
    }
    if (classId) {
      teacherAssignmentsQuery.eq('class_id', classId)
    }

    const { data: assignments, error: assignmentsError } = await teacherAssignmentsQuery

    if (assignmentsError) {
      console.error('Error fetching teacher assignments:', assignmentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teacher assignments' } as MarksTrackingResponse,
        { status: 500 }
      )
    }

    // Also get teacher_subjects assignments (legacy/fallback)
    const { data: teacherSubjects, error: teacherSubjectsError } = await supabase
      .from('teacher_subjects')
      .select(`
        teacher_id,
        subject_name,
        teacher:users!inner(
          id,
          email
        )
      `)
      .eq('is_active', true)

    if (teacherSubjectsError) {
      console.warn('Error fetching teacher subjects:', teacherSubjectsError)
    }

    // First, get branch assessments for the period (gracefully handle missing table)
    let branchAssessments: any[] = []
    try {
      const branchAssessmentsQuery = supabase
        .from('branch_assessments')
        .select(`
          id,
          branch_id,
          class_id,
          academic_year,
          term
        `)
        .eq('academic_year', academicYear)

      if (term) {
        branchAssessmentsQuery.eq('term', term)
      }
      if (classId) {
        branchAssessmentsQuery.eq('class_id', classId)
      }

      const { data, error } = await branchAssessmentsQuery

      if (error) {
        // Table might not exist - log warning but continue
        console.warn('Branch assessments table query failed (table may not exist):', error.message)
        console.warn('Continuing without branch assessment data...')
      } else {
        branchAssessments = data || []
      }
    } catch (err) {
      console.warn('Error querying branch_assessments:', err)
      // Continue without branch assessments data
    }

    // Then get branch grades for those assessments
    const assessmentIds = branchAssessments?.map(a => a.id) || []
    let branchGrades: any[] = []
    
    if (assessmentIds.length > 0) {
      const { data: gradesData, error: branchGradesError } = await supabase
        .from('branch_grades')
        .select(`
          id,
          assessment_id,
          student_id,
          teacher_id,
          branch_id
        `)
        .in('assessment_id', assessmentIds)

      if (branchGradesError) {
        console.warn('Error fetching branch grades:', branchGradesError)
      } else {
        branchGrades = gradesData || []
        // Attach assessment info to each grade
        branchGrades = branchGrades.map(grade => {
          const assessment = branchAssessments?.find(a => a.id === grade.assessment_id)
          return {
            ...grade,
            assessment: {
              branch_assessments: assessment
            }
          }
        })
      }
    }

    // Get exam results
    const examResultsQuery = supabase
      .from('exam_results')
      .select(`
        id,
        examination_id,
        student_id,
        subject,
        date_recorded,
        examination:examinations!inner(
          id,
          level,
          subsystem,
          branch
        )
      `)

    // Note: exam_results doesn't have academic_year directly, filter by date if needed
    const { data: examResults, error: examResultsError } = await examResultsQuery

    if (examResultsError) {
      console.warn('Error fetching exam results:', examResultsError)
    }

    // Get general grades
    // First, if filtering by classId, get assessment IDs for that class
    let assessmentIdsForClass: string[] | null = null
    if (classId) {
      const { data: assessmentsForClass } = await supabase
        .from('assessments')
        .select('id')
        .eq('class_id', classId)
      
      if (assessmentsForClass && assessmentsForClass.length > 0) {
        assessmentIdsForClass = assessmentsForClass.map(a => a.id)
      } else {
        // No assessments for this class, so no grades - set to empty array
        assessmentIdsForClass = []
      }
    }

    const gradesQuery = supabase
      .from('grades')
      .select(`
        id,
        assessment_id,
        student_id,
        assessments!inner(
          id,
          subject,
          class_id,
          class_name
        )
      `)

    if (classId && assessmentIdsForClass !== null) {
      if (assessmentIdsForClass.length > 0) {
        gradesQuery.in('assessment_id', assessmentIdsForClass)
      } else {
        // No assessments for this class, return empty result by using impossible filter
        gradesQuery.eq('id', '00000000-0000-0000-0000-000000000000')
      }
    }

    const { data: generalGrades, error: generalGradesError } = await gradesQuery

    if (generalGradesError) {
      console.warn('Error fetching general grades:', generalGradesError)
    }

    // Process assignments to build expected vs actual
    const teacherMap = new Map<string, {
      id: string
      name: string
      email?: string
      assignments: Array<{
        branchId?: string
        branchName?: string
        subjectId?: string
        subjectName: string
        classId: string
        className: string
      }>
      marksEntered: Set<string> // Set of "classId-subjectId" or "classId-branchId"
    }>()

    // Process branch assignments
    assignments?.forEach((assignment: any) => {
      if (!assignment.teacher || !assignment.branch || !assignment.class) return
      
      const teacherId = assignment.teacher.id
      const teacherName = `${assignment.teacher.first_name} ${assignment.teacher.last_name}`.trim()
      const subjectName = assignment.branch.subjects?.name || 'Unknown Subject'
      const subjectId = assignment.branch.subjects?.id || assignment.branch.subject_id
      const branchId = assignment.branch.id
      const branchName = assignment.branch.branch_name
      const classId = assignment.class.id
      const className = assignment.class.class_name || assignment.class.class_level

      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          id: teacherId,
          name: teacherName,
          email: assignment.teacher.email,
          assignments: [],
          marksEntered: new Set()
        })
      }

      const teacher = teacherMap.get(teacherId)!
      teacher.assignments.push({
        branchId,
        branchName,
        subjectId,
        subjectName,
        classId,
        className
      })
    })

    // Process branch grades to mark as entered
    branchGrades?.forEach((grade: any) => {
      if (!grade.assessment || !grade.assessment.branch_assessments) return
      
      const assessment = grade.assessment.branch_assessments
      const teacherId = grade.teacher_id
      const classId = assessment.class_id
      const branchId = assessment.branch_id
      const subjectId = assessment.branch?.subject_id

      if (teacherId && classId && branchId) {
        const key = `${classId}-${branchId}`
        const teacher = teacherMap.get(teacherId)
        if (teacher) {
          teacher.marksEntered.add(key)
        }
      }
    })

    // Process general grades
    generalGrades?.forEach((grade: any) => {
      if (!grade.assessments) return
      
      const assessment = grade.assessments
      const classId = assessment.class_id
      const subject = assessment.subject

      // Try to match with teacher assignments by subject name
      teacherMap.forEach((teacher) => {
        const matchingAssignment = teacher.assignments.find(
          a => a.classId === classId && a.subjectName === subject
        )
        if (matchingAssignment) {
          const key = `${classId}-${matchingAssignment.subjectId || matchingAssignment.branchId}`
          teacher.marksEntered.add(key)
        }
      })
    })
    // Build summary
    const uniqueTeachers = new Set(teacherMap.keys())
    const teachersWithMarks = Array.from(teacherMap.values()).filter(
      t => t.marksEntered.size > 0
    )
    const teachersWithoutMarks = Array.from(teacherMap.values()).filter(
      t => t.marksEntered.size === 0
    )

    // Get unique subjects and classes
    const subjectSet = new Set<string>()
    const classSet = new Set<string>()
    const subjectClassMap = new Map<string, Set<string>>() // subject -> classes
    const classSubjectMap = new Map<string, Set<string>>() // class -> subjects

    teacherMap.forEach((teacher) => {
      teacher.assignments.forEach((assignment) => {
        const subjectKey = assignment.subjectId || assignment.branchId || assignment.subjectName
        const classKey = assignment.classId

        subjectSet.add(subjectKey)
        classSet.add(classKey)

        if (!subjectClassMap.has(subjectKey)) {
          subjectClassMap.set(subjectKey, new Set())
        }
        subjectClassMap.get(subjectKey)!.add(classKey)

        if (!classSubjectMap.has(classKey)) {
          classSubjectMap.set(classKey, new Set())
        }
        classSubjectMap.get(classKey)!.add(subjectKey)
      })
    })

    // Count subjects and classes with marks
    const subjectsWithMarks = new Set<string>()
    const classesWithMarks = new Set<string>()

    teacherMap.forEach((teacher) => {
      teacher.marksEntered.forEach((key) => {
        const [classId, subjectId] = key.split('-')
        classesWithMarks.add(classId)
        subjectsWithMarks.add(subjectId)
      })
    })

    const summary: MarksTrackingSummary = {
      totalTeachers: uniqueTeachers.size,
      teachersFilled: teachersWithMarks.length,
      teachersPending: teachersWithoutMarks.length,
      totalSubjects: subjectSet.size,
      subjectsFilled: subjectsWithMarks.size,
      totalClasses: classSet.size,
      classesFilled: classesWithMarks.size
    }

    // Build teachers filled list
    const teachersFilled = teachersWithMarks.map(teacher => ({
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      subjectsCount: new Set(teacher.assignments.map(a => a.subjectId || a.branchId)).size,
      classesCount: new Set(teacher.assignments.map(a => a.classId)).size,
      totalMarksEntered: teacher.marksEntered.size,
      lastEntryDate: undefined // Could be calculated from grades if needed
    }))

    // Build teachers pending list
    const teachersPending = teachersWithoutMarks.map(teacher => ({
      teacherId: teacher.id,
      teacherName: teacher.name,
      teacherEmail: teacher.email,
      expectedSubjects: Array.from(new Set(teacher.assignments.map(a => ({
        subjectId: a.subjectId || '',
        subjectName: a.subjectName,
        branchId: a.branchId,
        branchName: a.branchName
      })))).filter(s => s.subjectId || s.branchId),
      expectedClasses: Array.from(new Set(teacher.assignments.map(a => ({
        classId: a.classId,
        className: a.className
      }))))
    }))

    // Build subjects breakdown
    const subjectsBreakdown = Array.from(subjectSet).map(subjectKey => {
      const teacherAssignments = Array.from(teacherMap.values())
        .flatMap(t => t.assignments.filter(a => 
          (a.subjectId || a.branchId || a.subjectName) === subjectKey
        ))

      const classes = Array.from(new Set(teacherAssignments.map(a => a.classId))).map(classId => {
        const classAssignments = teacherAssignments.filter(a => a.classId === classId)
        const firstAssignment = classAssignments[0]
        const teacher = teacherMap.get(
          Array.from(teacherMap.entries()).find(([_, t]) =>
            t.assignments.some(a => a.classId === classId && 
              (a.subjectId || a.branchId || a.subjectName) === subjectKey)
          )?.[0] || ''
        )

        const hasMarks = teacher ? teacher.marksEntered.has(`${classId}-${subjectKey}`) : false

        return {
          classId,
          className: firstAssignment?.className || 'Unknown',
          hasMarks,
          teacherId: teacher?.id,
          teacherName: teacher?.name,
          marksCount: hasMarks ? 1 : 0, // Simplified, could count actual marks
          lastEntryDate: undefined
        }
      })

      const firstAssignment = teacherAssignments[0]
      return {
        subjectId: firstAssignment?.subjectId || '',
        subjectName: firstAssignment?.subjectName || 'Unknown',
        branchId: firstAssignment?.branchId,
        branchName: firstAssignment?.branchName,
        classes
      }
    })

    // Build classes breakdown
    const classesBreakdown = Array.from(classSet).map(classId => {
      const teacherAssignments = Array.from(teacherMap.values())
        .flatMap(t => t.assignments.filter(a => a.classId === classId))

      const subjects = Array.from(new Set(teacherAssignments.map(a => 
        a.subjectId || a.branchId || a.subjectName
      ))).map(subjectKey => {
        const subjectAssignments = teacherAssignments.filter(a =>
          (a.subjectId || a.branchId || a.subjectName) === subjectKey
        )
        const firstAssignment = subjectAssignments[0]
        const teacher = teacherMap.get(
          Array.from(teacherMap.entries()).find(([_, t]) =>
            t.assignments.some(a => a.classId === classId && 
              (a.subjectId || a.branchId || a.subjectName) === subjectKey)
          )?.[0] || ''
        )

        const hasMarks = teacher ? teacher.marksEntered.has(`${classId}-${subjectKey}`) : false

        return {
          subjectId: firstAssignment?.subjectId || '',
          subjectName: firstAssignment?.subjectName || 'Unknown',
          branchId: firstAssignment?.branchId,
          branchName: firstAssignment?.branchName,
          hasMarks,
          teacherId: teacher?.id,
          teacherName: teacher?.name,
          marksCount: hasMarks ? 1 : 0,
          lastEntryDate: undefined
        }
      })

      const firstAssignment = teacherAssignments[0]
      return {
        classId,
        className: firstAssignment?.className || 'Unknown',
        subjects
      }
    })

    // Filter by subjectId if provided
    let filteredSubjects = subjectsBreakdown
    if (subjectId) {
      filteredSubjects = subjectsBreakdown.filter(s => 
        s.subjectId === subjectId || s.branchId === subjectId
      )
    }

    const response: MarksTrackingResponse = {
      success: true,
      summary,
      teachers: {
        filled: teachersFilled,
        pending: teachersPending
      },
      subjects: filteredSubjects,
      classes: classesBreakdown
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in marks tracking API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      } as MarksTrackingResponse,
      { status: 500 }
    )
  }
}

