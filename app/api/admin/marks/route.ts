import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'

function calculateGrade(mark: number, totalMarks: number = 20): string {
  const percentage = (mark / totalMarks) * 100
  if (percentage >= 85) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}

function calculateRemarks(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'Very Good'
    case 'C': return 'Good'
    case 'D': return 'Pass'
    case 'E': return 'Weak'
    case 'F': return 'Fail'
    default: return ''
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { studentId, assessmentId, marksObtained, remarks } = body

    // Validate required fields
    if (!studentId || !assessmentId || marksObtained === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: studentId, assessmentId, marksObtained' },
        { status: 400 }
      )
    }

    // Validate mark range
    if (typeof marksObtained !== 'number' || marksObtained < 0 || marksObtained > 20) {
      return NextResponse.json(
        { error: 'Mark must be a number between 0 and 20' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Get assessment to get total marks
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, total_marks')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      )
    }

    // Check if grade already exists
    const { data: existingGrade } = await supabase
      .from('grades')
      .select('id')
      .eq('assessment_id', assessmentId)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existingGrade) {
      return NextResponse.json(
        { error: 'Grade already exists for this student and assessment. Use PUT to update.' },
        { status: 400 }
      )
    }

    // Calculate percentage and grade
    const totalMarks = assessment.total_marks || 20
    const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100
    const gradeLetter = calculateGrade(marksObtained, totalMarks)
    const gradeRemarks = remarks || calculateRemarks(gradeLetter)

    // Create grade
    const { data: newGrade, error: insertError } = await supabase
      .from('grades')
      .insert({
        assessment_id: assessmentId,
        student_id: studentId,
        marks_obtained: marksObtained,
        percentage,
        grade_letter: gradeLetter,
        remarks: gradeRemarks,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating grade:', insertError)
      return NextResponse.json(
        { error: 'Failed to create grade' },
        { status: 500 }
      )
    }

    // Fetch full grade with student and assessment info
    const { data: fullGrade } = await supabase
      .from('grades')
      .select(`
        id,
        student_id,
        marks_obtained,
        percentage,
        grade_letter,
        remarks,
        submitted_at,
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
      .eq('id', newGrade.id)
      .single()

    if (!fullGrade) {
      return NextResponse.json(
        { error: 'Failed to fetch created grade' },
        { status: 500 }
      )
    }

    // Transform to match frontend format
    const student = fullGrade.students
    const assessmentData = fullGrade.assessments
    const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim()

    const mark = {
      id: fullGrade.id,
      studentId: fullGrade.student_id,
      studentName,
      assessmentId: assessmentData?.id,
      assessmentName: assessmentData?.title,
      assessmentType: assessmentData?.type,
      subjectName: assessmentData?.subject,
      classId: assessmentData?.class_id,
      marksObtained: parseFloat(fullGrade.marks_obtained) || 0,
      totalMarks: assessmentData?.total_marks || 20,
      percentage: parseFloat(fullGrade.percentage) || 0,
      gradeLetter: fullGrade.grade_letter,
      remarks: fullGrade.remarks,
      submittedAt: fullGrade.submitted_at,
      assessmentDate: assessmentData?.assessment_date,
    }

    return NextResponse.json({
      success: true,
      message: 'Grade created successfully',
      mark,
    })
  } catch (error: any) {
    console.error('Error in POST /api/admin/marks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
