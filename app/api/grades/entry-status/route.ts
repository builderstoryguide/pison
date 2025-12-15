import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'

export const runtime = 'nodejs'

/**
 * GET /api/grades/entry-status
 * Get completion status for sequences across classes/subjects
 * Query params:
 *   - teacherId (required): Teacher's user ID
 *   - classId (optional): Filter by specific class
 *   - subjectId (optional): Filter by specific subject
 *   - academicYear (optional): Academic year, defaults to current
 *   - term (optional): Term, defaults to Term 1
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const teacherId = searchParams.get('teacherId')
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const academicYearParam = searchParams.get('academicYear')
    const academicYear = academicYearParam || await getAcademicYearFromConfig()
    const term = searchParams.get('term') || 'Term 1'

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: 'teacherId is required' },
        { status: 400 }
      )
    }

    // Get sequences for the academic period
    const { data: sequences, error: sequencesError } = await supabase.rpc('get_academic_sequences', {
      p_academic_year: academicYear,
      p_term: term
    }).catch(() => {
      // Fallback to default sequences if function doesn't exist
      return {
        data: [
          { id: '1st-sequence', sequence_number: 1, sequence_name: '1st Sequence' },
          { id: '2nd-sequence', sequence_number: 2, sequence_name: '2nd Sequence' },
          { id: '3rd-sequence', sequence_number: 3, sequence_name: '3rd Sequence' },
          { id: '4th-sequence', sequence_number: 4, sequence_name: '4th Sequence' },
          { id: '5th-sequence', sequence_number: 5, sequence_name: '5th Sequence' },
          { id: '6th-sequence', sequence_number: 6, sequence_name: '6th Sequence' },
        ],
        error: null
      }
    })

    if (sequencesError) {
      console.error('Error fetching sequences:', sequencesError)
    }

    const sequenceList = sequences || []

    // Get teacher's assigned classes and subjects
    let classesQuery = supabase
      .from('teacher_branch_assignments')
      .select(`
        class_id,
        classes:class_id (
          id,
          class_name,
          class_level,
          subsystem,
          stream,
          academic_year
        ),
        subject_branches (
          id,
          branch_name,
          branch_code,
          subject_id,
          subjects:subject_id (
            id,
            name,
            code
          )
        )
      `)
      .eq('teacher_id', teacherId)

    if (classId) {
      classesQuery = classesQuery.eq('class_id', classId)
    }

    const { data: assignments, error: assignmentsError } = await classesQuery

    if (assignmentsError) {
      console.error('Error fetching teacher assignments:', assignmentsError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(assignmentsError) },
        { status: 500 }
      )
    }

    // Build result structure
    const statusMap = new Map<string, {
      classId: string
      className: string
      subjectId: string
      subjectName: string
      sequences: Array<{
        sequenceId: string
        sequenceName: string
        sequenceNumber: number
        isCompleted: boolean
        completedDate?: string
        studentCount: number
        enteredCount: number
      }>
    }>()

    // Process each assignment
    for (const assignment of assignments || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const classData = (assignment as any).classes
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branchData = (assignment as any).subject_branches

      if (!classData || !branchData) continue

      const classIdValue = classData.id
      const className = classData.class_name || 'Unknown Class'
      
      // Handle both branch and subject cases
      let subjectIdValue: string
      let subjectName: string

      if (branchData.subjects) {
        subjectIdValue = branchData.subjects.id
        subjectName = branchData.subjects.name || branchData.branch_name
      } else {
        subjectIdValue = branchData.id
        subjectName = branchData.branch_name || 'Unknown Subject'
      }

      // Apply subject filter if provided
      if (subjectId && subjectIdValue !== subjectId) continue

      const key = `${classIdValue}-${subjectIdValue}`

      // Get student count for this class
      const { count: studentCount } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classIdValue)
        .catch(() => ({ count: 0 }))

      // Check completion status for each sequence
      const sequenceStatuses = await Promise.all(
        sequenceList.map(async (seq: any) => {
          const sequenceName = seq.sequence_name || seq.sequenceName || `${seq.sequence_number}${getOrdinalSuffix(seq.sequence_number)} Sequence`
          
          // Find assessments matching this class, subject, and sequence
          const { data: assessments, error: assessError } = await supabase
            .from('assessments')
            .select('id, assessment_date, created_at')
            .eq('class_id', classIdValue)
            .eq('subject', subjectName)
            .eq('title', sequenceName)
            .eq('teacher_id', teacherId)
            .limit(1)

          if (assessError) {
            console.error('Error checking assessment:', assessError)
          }

          const assessment = assessments && assessments.length > 0 ? assessments[0] : null
          const isCompleted = !!assessment

          // Count entered grades for this assessment
          let enteredCount = 0
          if (assessment) {
            const { count } = await supabase
              .from('grades')
              .select('*', { count: 'exact', head: true })
              .eq('assessment_id', assessment.id)
              .catch(() => ({ count: 0 }))
            enteredCount = count || 0
          }

          return {
            sequenceId: seq.id || `seq${seq.sequence_number}`,
            sequenceName,
            sequenceNumber: seq.sequence_number || parseInt(seq.id?.replace(/\D/g, '') || '0'),
            isCompleted,
            completedDate: assessment?.created_at || assessment?.assessment_date,
            studentCount: studentCount || 0,
            enteredCount
          }
        })
      )

      statusMap.set(key, {
        classId: classIdValue,
        className,
        subjectId: subjectIdValue,
        subjectName,
        sequences: sequenceStatuses
      })
    }

    // Convert map to array
    const results = Array.from(statusMap.values())

    return NextResponse.json({
      success: true,
      data: results,
      academicYear,
      term,
      totalClasses: results.length,
      totalSequences: sequenceList.length
    })

  } catch (error: any) {
    console.error('Error in GET /api/grades/entry-status:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}

function getOrdinalSuffix(num: number): string {
  const j = num % 10
  const k = num % 100
  if (j === 1 && k !== 11) return 'st'
  if (j === 2 && k !== 12) return 'nd'
  if (j === 3 && k !== 13) return 'rd'
  return 'th'
}
