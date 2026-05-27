import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser, isAdmin } from '@/lib/auth/server'
import {
  calculateGradeFromMarks,
  getGradeRemarks,
} from '@/lib/grading-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gradeId: string }> }
) {
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

    const { gradeId } = await params
    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Fetch grade with full info
    const { data: grade, error: gradeError } = await supabase
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
      .eq('id', gradeId)
      .maybeSingle()

    if (gradeError) {
      console.error('Error fetching grade:', gradeError)
      return NextResponse.json(
        { error: 'Failed to fetch grade' },
        { status: 500 }
      )
    }

    if (!grade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      )
    }

    // Fetch class name and subject ID
    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', grade.assessments?.class_id)
      .single()
    
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', grade.assessments?.subject)
      .single()

    // Transform to match frontend format
    const student = grade.students
    const assessmentData = grade.assessments
    const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim()

    const mark = {
      id: grade.id,
      studentId: grade.student_id,
      studentName,
      assessmentId: assessmentData?.id,
      assessmentName: assessmentData?.title,
      assessmentType: assessmentData?.type,
      subjectName: assessmentData?.subject,
      subjectId: subjectData?.id || '',
      classId: assessmentData?.class_id,
      className: classData?.name || assessmentData?.class_id,
      marksObtained: parseFloat(grade.marks_obtained) || 0,
      totalMarks: assessmentData?.total_marks || 20,
      percentage: parseFloat(grade.percentage) || 0,
      gradeLetter: grade.grade_letter,
      remarks: grade.remarks,
      submittedAt: grade.submitted_at,
      assessmentDate: assessmentData?.assessment_date,
    }

    return NextResponse.json({
      success: true,
      mark,
    })
  } catch (error: any) {
    console.error('Error in GET /api/admin/marks/[gradeId]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ gradeId: string }> }
) {
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

    const { gradeId } = await params
    const body = await request.json()
    const { marksObtained, remarks } = body

    // Validate required fields
    if (marksObtained === undefined) {
      return NextResponse.json(
        { error: 'Missing required field: marksObtained' },
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

    // Get existing grade with assessment info
    const { data: existingGrade, error: gradeError } = await supabase
      .from('grades')
      .select(`
        id,
        assessment_id,
        assessments!inner(
          id,
          total_marks
        )
      `)
      .eq('id', gradeId)
      .single()

    if (gradeError || !existingGrade) {
      return NextResponse.json(
        { error: 'Grade not found' },
        { status: 404 }
      )
    }

    // Calculate percentage and grade
    const totalMarks = existingGrade.assessments?.total_marks || 20
    const percentage = Math.round((marksObtained / totalMarks) * 100 * 100) / 100
    const gradeLetter = calculateGradeFromMarks(marksObtained, totalMarks)
    const gradeRemarks = remarks !== undefined ? remarks : getGradeRemarks(gradeLetter)

    // Update grade
    const { error: updateError } = await supabase
      .from('grades')
      .update({
        marks_obtained: marksObtained,
        percentage,
        grade_letter: gradeLetter,
        remarks: gradeRemarks,
      })
      .eq('id', gradeId)

    if (updateError) {
      console.error('Error updating grade:', updateError)
      return NextResponse.json(
        { error: 'Failed to update grade' },
        { status: 500 }
      )
    }

    // Fetch updated grade with full info
    const { data: updatedGrade } = await supabase
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
      .eq('id', gradeId)
      .single()

    if (!updatedGrade) {
      return NextResponse.json(
        { error: 'Failed to fetch updated grade' },
        { status: 500 }
      )
    }

    // Transform to match frontend format
    const student = updatedGrade.students
    const assessmentData = updatedGrade.assessments
    const studentName = `${student?.first_name || ''} ${student?.last_name || ''}`.trim()

    const mark = {
      id: updatedGrade.id,
      studentId: updatedGrade.student_id,
      studentName,
      assessmentId: assessmentData?.id,
      assessmentName: assessmentData?.title,
      assessmentType: assessmentData?.type,
      subjectName: assessmentData?.subject,
      classId: assessmentData?.class_id,
      marksObtained: parseFloat(updatedGrade.marks_obtained) || 0,
      totalMarks: assessmentData?.total_marks || 20,
      percentage: parseFloat(updatedGrade.percentage) || 0,
      gradeLetter: updatedGrade.grade_letter,
      remarks: updatedGrade.remarks,
      submittedAt: updatedGrade.submitted_at,
      assessmentDate: assessmentData?.assessment_date,
    }

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      mark,
    })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/marks/[gradeId]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gradeId: string }> }
) {
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

    const { gradeId } = await params

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    // Delete grade
    const { error: deleteError } = await supabase
      .from('grades')
      .delete()
      .eq('id', gradeId)

    if (deleteError) {
      console.error('Error deleting grade:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete grade' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Grade deleted successfully',
    })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/marks/[gradeId]:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
