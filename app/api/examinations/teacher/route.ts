import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Verify user exists and is a teacher
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role, subsystem, branch')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('status', 'active')
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Teacher not found or not authorized' },
        { status: 404 }
      )
    }

    // Get teacher's assigned subjects
    const { data: teacherSubjects, error: subjectsError } = await supabase
      .from('teacher_subjects')
      .select('subject_name')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (subjectsError) {
      console.error('Error loading teacher subjects:', serializeSupabaseError(subjectsError))
    }

    const teacherSubjectNames = (teacherSubjects || []).map((ts: any) => ts.subject_name)

    // Get teacher's assigned classes (as class teacher)
    const { data: teacherClasses, error: classesError } = await supabase
      .from('classes')
      .select('class_level, subsystem, stream')
      .eq('class_teacher_id', teacherId)
      .eq('status', 'active')

    if (classesError) {
      console.error('Error loading teacher classes:', serializeSupabaseError(classesError))
    }

    // Query examinations that match teacher's criteria
    let query = supabase
      .from('examinations')
      .select('*')
      .in('status', ['scheduled', 'ongoing'])

    // Filter by teacher's subsystem and branch if available
    if (user.subsystem) {
      query = query.eq('subsystem', user.subsystem)
    }

    if (user.branch) {
      query = query.eq('branch', user.branch)
    }

    const { data: allExaminations, error: examsError } = await query

    if (examsError) {
      console.error('Error loading examinations:', serializeSupabaseError(examsError))
      return NextResponse.json(
        { error: 'Failed to load examinations', details: serializeSupabaseError(examsError) },
        { status: 500 }
      )
    }

    // Filter examinations to only include those relevant to the teacher
    const filteredExaminations = (allExaminations || []).filter((exam: any) => {
      // Check if examination has any subjects that match teacher's subjects
      const examSubjects = exam.subjects || []
      const hasMatchingSubject = teacherSubjectNames.length === 0 || 
        examSubjects.some((subject: string) => teacherSubjectNames.includes(subject))

      // Check if examination level matches teacher's classes
      const hasMatchingLevel = teacherClasses && teacherClasses.length > 0
        ? teacherClasses.some((cls: any) => 
            cls.class_level === exam.level &&
            cls.subsystem === exam.subsystem &&
            (cls.stream || 'grammar') === exam.branch
          )
        : true // If no classes found, don't filter by level

      // If teacher has no subjects assigned, show all examinations matching their subsystem/branch
      if (teacherSubjectNames.length === 0 && teacherClasses && teacherClasses.length === 0) {
        return hasMatchingLevel || (user.subsystem === exam.subsystem && user.branch === exam.branch)
      }

      return hasMatchingSubject && (hasMatchingLevel || teacherClasses.length === 0)
    })

    // Transform database data to match frontend interface
    const transformedExaminations = filteredExaminations.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      type: exam.type,
      examBoard: exam.exam_board,
      subsystem: exam.subsystem,
      branch: exam.branch,
      level: exam.level,
      subjects: exam.subjects || [],
      startDate: exam.start_date,
      endDate: exam.end_date,
      duration: exam.duration,
      totalMarks: exam.total_marks,
      passingMarks: exam.passing_marks,
      venue: exam.venue,
      instructions: exam.instructions || '',
      status: exam.status,
      createdAt: exam.created_at,
      createdBy: exam.created_by || 'unknown',
      enrolledStudents: exam.enrolled_students || 0,
      completedStudents: exam.completed_students || 0,
    }))

    return NextResponse.json({
      success: true,
      examinations: transformedExaminations,
    })
  } catch (error) {
    console.error('Error in GET /api/examinations/teacher:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

