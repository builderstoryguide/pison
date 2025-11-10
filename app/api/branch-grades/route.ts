import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  GradeBranchAssessmentRequest,
  BranchGradesResponse,
  BranchGradeWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/branch-grades - List branch grades
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          grades: [],
          total: 0
        } as BranchGradesResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          grades: [],
          total: 0
        } as BranchGradesResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const assessmentId = searchParams.get('assessmentId')
    const studentId = searchParams.get('studentId')
    const teacherId = searchParams.get('teacherId')
    const branchId = searchParams.get('branchId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')

    // Build the query
    let query = supabase
      .from('branch_grades')
      .select(`
        *,
        assessment:branch_assessments(
          id,
          title,
          type,
          total_marks,
          assessment_date
        ),
        student:students(
          id,
          student_id,
          first_name,
          last_name
        ),
        teacher:teachers(
          id,
          teacher_id,
          first_name,
          last_name
        ),
        branch:subject_branches(
          id,
          branch_name,
          branch_code
        )
      `)

    // Apply filters
    if (assessmentId) {
      query = query.eq('assessment_id', assessmentId)
    }
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId)
    }
    if (branchId) {
      query = query.eq('branch_id', branchId)
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }

    const { data: grades, error } = await query.order('graded_at', { ascending: false })

    if (error) {
      console.error('Error fetching branch grades:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch branch grades',
          grades: [],
          total: 0
        } as BranchGradesResponse,
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const gradesWithDetails: BranchGradeWithDetails[] = (grades || []).map(grade => ({
      id: grade.id,
      grade_id: grade.grade_id,
      assessment_id: grade.assessment_id,
      student_id: grade.student_id,
      teacher_id: grade.teacher_id,
      branch_id: grade.branch_id,
      marks_obtained: grade.marks_obtained,
      percentage: grade.percentage,
      grade_letter: grade.grade_letter,
      grade_point: grade.grade_point,
      remarks: grade.remarks,
      feedback: grade.feedback,
      is_late: grade.is_late,
      is_absent: grade.is_absent,
      is_excused: grade.is_excused,
      submitted_at: grade.submitted_at,
      graded_at: grade.graded_at,
      created_at: grade.created_at,
      updated_at: grade.updated_at,
      assessment: {
        id: grade.assessment.id,
        title: grade.assessment.title,
        type: grade.assessment.type,
        total_marks: grade.assessment.total_marks,
        assessment_date: grade.assessment.assessment_date
      },
      student: {
        id: grade.student.id,
        student_id: grade.student.student_id,
        first_name: grade.student.first_name,
        last_name: grade.student.last_name
      },
      teacher: {
        id: grade.teacher.id,
        teacher_id: grade.teacher.teacher_id,
        first_name: grade.teacher.first_name,
        last_name: grade.teacher.last_name
      },
      branch: {
        id: grade.branch.id,
        branch_name: grade.branch.branch_name,
        branch_code: grade.branch.branch_code
      }
    }))

    return NextResponse.json({
      success: true,
      grades: gradesWithDetails,
      total: gradesWithDetails.length
    } as BranchGradesResponse)

  } catch (error) {
    console.error('Error in branch grades API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        grades: [],
        total: 0
      } as BranchGradesResponse,
      { status: 500 }
    )
  }
}

// POST /api/branch-grades - Grade a branch assessment
export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed'
        },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available'
        },
        { status: 500 }
      )
    }

    const body: GradeBranchAssessmentRequest = await request.json()

    // Validate required fields
    if (!body.assessment_id || !body.student_id || !body.teacher_id || body.marks_obtained === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: assessment_id, student_id, teacher_id, marks_obtained'
        },
        { status: 400 }
      )
    }

    // Validate marks
    if (body.marks_obtained < 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Marks obtained cannot be negative'
        },
        { status: 400 }
      )
    }

    // Check if assessment exists
    const { data: assessment, error: assessmentError } = await supabase
      .from('branch_assessments')
      .select(`
        id,
        title,
        total_marks,
        branch_id,
        teacher_id,
        class_id,
        academic_year,
        term
      `)
      .eq('id', body.assessment_id)
      .single()

    if (assessmentError || !assessment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Assessment not found'
        },
        { status: 404 }
      )
    }

    // Validate marks against total marks
    if (body.marks_obtained > assessment.total_marks) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Marks obtained (${body.marks_obtained}) cannot exceed total marks (${assessment.total_marks})`
        },
        { status: 400 }
      )
    }

    // Check if student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, student_id, first_name, last_name')
      .eq('id', body.student_id)
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    // Check if teacher exists
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name')
      .eq('id', body.teacher_id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher not found'
        },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the branch
    const { data: enrollment } = await supabase
      .from('student_branch_enrollments')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('branch_id', assessment.branch_id)
      .eq('class_id', assessment.class_id)
      .eq('academic_year', assessment.academic_year)
      .eq('term', assessment.term)
      .eq('enrollment_status', 'enrolled')
      .single()

    if (!enrollment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student is not enrolled in this subject branch'
        },
        { status: 403 }
      )
    }

    // Check if teacher is assigned to this branch
    const { data: teacherAssignment } = await supabase
      .from('teacher_branch_assignments')
      .select('id')
      .eq('teacher_id', body.teacher_id)
      .eq('branch_id', assessment.branch_id)
      .eq('class_id', assessment.class_id)
      .eq('academic_year', assessment.academic_year)
      .eq('term', assessment.term)
      .single()

    if (!teacherAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher is not assigned to this subject branch'
        },
        { status: 403 }
      )
    }

    // Calculate percentage and grade
    const percentage = (body.marks_obtained / assessment.total_marks) * 100
    const gradeLetter = calculateGradeLetter(percentage)
    const gradePoint = calculateGradePoint(percentage)

    // Generate unique grade_id
    const gradeId = `GRADE-${body.assessment_id}-${body.student_id}-${Date.now()}`

    // Check if grade already exists
    const { data: existingGrade } = await supabase
      .from('branch_grades')
      .select('id')
      .eq('assessment_id', body.assessment_id)
      .eq('student_id', body.student_id)
      .single()

    let gradeData
    if (existingGrade) {
      // Update existing grade
      const { data: updatedGrade, error: updateError } = await supabase
        .from('branch_grades')
        .update({
          marks_obtained: body.marks_obtained,
          percentage: percentage,
          grade_letter: gradeLetter,
          grade_point: gradePoint,
          remarks: body.remarks || null,
          feedback: body.feedback || null,
          is_late: body.is_late || false,
          is_absent: body.is_absent || false,
          is_excused: body.is_excused || false,
          graded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGrade.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating branch grade:', updateError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to update branch grade'
          },
          { status: 500 }
        )
      }

      gradeData = updatedGrade
    } else {
      // Create new grade
      const { data: newGrade, error: createError } = await supabase
        .from('branch_grades')
        .insert({
          grade_id: gradeId,
          assessment_id: body.assessment_id,
          student_id: body.student_id,
          teacher_id: body.teacher_id,
          branch_id: assessment.branch_id,
          marks_obtained: body.marks_obtained,
          percentage: percentage,
          grade_letter: gradeLetter,
          grade_point: gradePoint,
          remarks: body.remarks || null,
          feedback: body.feedback || null,
          is_late: body.is_late || false,
          is_absent: body.is_absent || false,
          is_excused: body.is_excused || false
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating branch grade:', createError)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to create branch grade'
          },
          { status: 500 }
        )
      }

      gradeData = newGrade
    }

    return NextResponse.json({
      success: true,
      grade: gradeData,
      message: existingGrade ? 'Branch grade updated successfully' : 'Branch grade created successfully'
    })

  } catch (error) {
    console.error('Error in grade branch assessment API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate grade letter
function calculateGradeLetter(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  if (percentage >= 30) return 'D'
  return 'F'
}

// Helper function to calculate grade point
function calculateGradePoint(percentage: number): number {
  if (percentage >= 90) return 4.0
  if (percentage >= 80) return 3.5
  if (percentage >= 70) return 3.0
  if (percentage >= 60) return 2.5
  if (percentage >= 50) return 2.0
  if (percentage >= 40) return 1.5
  if (percentage >= 30) return 1.0
  return 0.0
}
