import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'
import { loadSequenceYearConfig } from '@/lib/load-sequence-config-server'
import { assessmentMatchesTermFilter } from '@/lib/report-card-marks-list-filters'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser(request)
    if (authError || !user) {
      return authError || NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId')
    const assessmentId = searchParams.get('assessmentId')
    const term = searchParams.get('term')
    const academicYear = searchParams.get('academicYear')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Build query for grades with joins
    let query = supabase
      .from('grades')
      .select(`
        id,
        student_id,
        marks_obtained,
        percentage,
        grade_letter,
        remarks,
        submitted_at,
        assessment_id,
        assessments!inner(
          id,
          title,
          type,
          subject,
          class_id,
          total_marks,
          assessment_date
        ),
        students!inner(
          id,
          first_name,
          last_name
        )
      `)

    // Apply filters
    if (assessmentId) {
      query = query.eq('assessment_id', assessmentId)
    }
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (classId) {
      query = query.eq('assessments.class_id', classId)
    }
    if (type) {
      query = query.eq('assessments.type', type)
    }

    const { data: grades, error: gradesError } = await query

    if (gradesError) {
      console.error('Error fetching grades:', gradesError)
      return NextResponse.json(
        { error: 'Failed to fetch grades' },
        { status: 500 }
      )
    }

    // Get subject information for filtering
    let subjectFilter: any = null
    if (subjectId) {
      const { data: subject } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', subjectId)
        .single()
      
      if (subject) {
        subjectFilter = subject.name.trim()
      }
    }

    // Transform and filter grades
    let transformedMarks = (grades || []).map((g: any) => {
      const assessment = g.assessments
      const student = g.students
      const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim()

      return {
        id: g.id,
        studentId: g.student_id,
        studentName,
        assessmentId: assessment?.id,
        assessmentName: assessment?.title,
        assessmentType: assessment?.type,
        subjectName: assessment?.subject,
        classId: assessment?.class_id,
        marksObtained: parseFloat(g.marks_obtained) || 0,
        totalMarks: assessment?.total_marks || 20,
        percentage: parseFloat(g.percentage) || 0,
        gradeLetter: g.grade_letter,
        remarks: g.remarks,
        submittedAt: g.submitted_at,
        assessmentDate: assessment?.assessment_date,
      }
    })

    // Apply subject filter
    if (subjectFilter) {
      transformedMarks = transformedMarks.filter((m: any) => 
        m.subjectName?.toLowerCase().trim() === subjectFilter.toLowerCase().trim()
      )
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      transformedMarks = transformedMarks.filter((m: any) =>
        m.studentName?.toLowerCase().includes(searchLower) ||
        m.assessmentName?.toLowerCase().includes(searchLower) ||
        m.subjectName?.toLowerCase().includes(searchLower)
      )
    }

    if (term) {
      const year = academicYear || (await getAcademicYearFromConfig())
      const seqConfig = await loadSequenceYearConfig(supabase, year)
      const { data: academicSequences } = await supabase
        .from('academic_sequences')
        .select('id, sequence_number, sequence_name')
        .eq('academic_year', year)

      const sequenceIdToNumberMap = new Map<string, number>()
      for (const seq of academicSequences || []) {
        sequenceIdToNumberMap.set(seq.id, seq.sequence_number)
        if (seq.sequence_name) {
          sequenceIdToNumberMap.set(seq.sequence_name.toLowerCase(), seq.sequence_number)
        }
      }

      transformedMarks = transformedMarks.filter((m: { assessmentName?: string }) =>
        assessmentMatchesTermFilter(
          m.assessmentName,
          term,
          sequenceIdToNumberMap,
          seqConfig.termSequenceCounts
        )
      )
    }

    if (academicYear) {
      const { data: yearAssessments } = await supabase
        .from('assessments')
        .select('id, assessment_date')
        .in(
          'id',
          [...new Set(transformedMarks.map((m: { assessmentId?: string }) => m.assessmentId).filter(Boolean))]
        )

      const assessmentYearMap = new Map<string, string>()
      for (const a of yearAssessments || []) {
        if (a.assessment_date) {
          const y = String(a.assessment_date).slice(0, 4)
          assessmentYearMap.set(a.id, y)
        }
      }

      const yearStart = academicYear.split('-')[0]
      if (yearStart) {
        transformedMarks = transformedMarks.filter((m: { assessmentId?: string; assessmentDate?: string }) => {
          const dateYear = m.assessmentDate
            ? String(m.assessmentDate).slice(0, 4)
            : assessmentYearMap.get(m.assessmentId || '')
          return !dateYear || dateYear === yearStart || academicYear.includes(dateYear)
        })
      }
    }

    // Get class names and subject IDs
    const classIds = [...new Set(transformedMarks.map((m: any) => m.classId).filter(Boolean))]
    const subjectNames = [...new Set(transformedMarks.map((m: any) => m.subjectName).filter(Boolean))]

    // Fetch class names
    const classMap: Record<string, string> = {}
    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)
      
      if (classes) {
        classes.forEach((c: any) => {
          classMap[c.id] = c.name
        })
      }
    }

    // Fetch subject IDs
    const subjectMap: Record<string, string> = {}
    if (subjectNames.length > 0) {
      const { data: subjects } = await supabase
        .from('subjects')
        .select('id, name')
        .in('name', subjectNames)
      
      if (subjects) {
        subjects.forEach((s: any) => {
          subjectMap[s.name] = s.id
        })
      }
    }

    // Add class names and subject IDs to marks
    const finalMarks = transformedMarks.map((m: any) => ({
      ...m,
      className: classMap[m.classId] || m.classId,
      subjectId: subjectMap[m.subjectName] || '',
    }))

    return NextResponse.json({ marks: finalMarks })
  } catch (error: any) {
    console.error('Error in GET /api/admin/marks/list:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
