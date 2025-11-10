import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  EnrollStudentInBranchRequest,
  StudentBranchEnrollmentsResponse,
  StudentBranchEnrollmentWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/student-branch-enrollments - List student branch enrollments
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          enrollments: [],
          total: 0
        } as StudentBranchEnrollmentsResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          enrollments: [],
          total: 0
        } as StudentBranchEnrollmentsResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const branchId = searchParams.get('branchId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const enrollmentStatus = searchParams.get('enrollmentStatus')

    // Build the query
    let query = supabase
      .from('student_branch_enrollments')
      .select(`
        *,
        student:students(
          id,
          student_id,
          first_name,
          last_name,
          email
        ),
        branch:subject_branches(
          id,
          branch_name,
          branch_code,
          subject_id
        ),
        subject:subject_branches!inner(
          subject_id,
          subjects:subject_id(
            id,
            subject_name,
            subject_code
          )
        ),
        class:classes(
          id,
          class_name,
          class_level
        )
      `)

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
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
    if (enrollmentStatus) {
      query = query.eq('enrollment_status', enrollmentStatus)
    }

    const { data: enrollments, error } = await query.order('enrolled_at', { ascending: false })

    if (error) {
      console.error('Error fetching student branch enrollments:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch student branch enrollments',
          enrollments: [],
          total: 0
        } as StudentBranchEnrollmentsResponse,
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const enrollmentsWithDetails: StudentBranchEnrollmentWithDetails[] = (enrollments || []).map(enrollment => ({
      id: enrollment.id,
      student_id: enrollment.student_id,
      branch_id: enrollment.branch_id,
      class_id: enrollment.class_id,
      academic_year: enrollment.academic_year,
      term: enrollment.term,
      enrollment_status: enrollment.enrollment_status,
      enrolled_at: enrollment.enrolled_at,
      created_at: enrollment.created_at,
      updated_at: enrollment.updated_at,
      student: {
        id: enrollment.student.id,
        student_id: enrollment.student.student_id,
        first_name: enrollment.student.first_name,
        last_name: enrollment.student.last_name,
        email: enrollment.student.email
      },
      branch: {
        id: enrollment.branch.id,
        branch_name: enrollment.branch.branch_name,
        branch_code: enrollment.branch.branch_code,
        subject_id: enrollment.branch.subject_id
      },
      subject: {
        id: enrollment.subject.subjects.id,
        subject_name: enrollment.subject.subjects.subject_name,
        subject_code: enrollment.subject.subjects.subject_code
      },
      class: {
        id: enrollment.class.id,
        class_name: enrollment.class.class_name,
        class_level: enrollment.class.class_level
      }
    }))

    return NextResponse.json({
      success: true,
      enrollments: enrollmentsWithDetails,
      total: enrollmentsWithDetails.length
    } as StudentBranchEnrollmentsResponse)

  } catch (error) {
    console.error('Error in student branch enrollments API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        enrollments: [],
        total: 0
      } as StudentBranchEnrollmentsResponse,
      { status: 500 }
    )
  }
}

// POST /api/student-branch-enrollments - Enroll student in a branch
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

    const body: EnrollStudentInBranchRequest = await request.json()

    // Validate required fields
    if (!body.student_id || !body.branch_id || !body.class_id || !body.academic_year) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: student_id, branch_id, class_id, academic_year'
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

    // Check if branch exists
    const { data: branch, error: branchError } = await supabase
      .from('subject_branches')
      .select('id, branch_name, branch_code, subject_id, is_active')
      .eq('id', body.branch_id)
      .single()

    if (branchError || !branch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject branch not found'
        },
        { status: 404 }
      )
    }

    if (!branch.is_active) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot enroll in inactive subject branch'
        },
        { status: 400 }
      )
    }

    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, class_level')
      .eq('id', body.class_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Class not found'
        },
        { status: 404 }
      )
    }

    // Check if student is enrolled in the class
    const { data: classEnrollment } = await supabase
      .from('student_class_enrollments')
      .select('id')
      .eq('student_id', body.student_id)
      .eq('class_id', body.class_id)
      .eq('enrollment_status', 'enrolled')
      .single()

    if (!classEnrollment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Student must be enrolled in the class before enrolling in subject branches'
        },
        { status: 400 }
      )
    }

    // Check for existing enrollment
    const { data: existingEnrollment } = await supabase
      .from('student_branch_enrollments')
      .select('id, enrollment_status')
      .eq('student_id', body.student_id)
      .eq('branch_id', body.branch_id)
      .eq('class_id', body.class_id)
      .eq('academic_year', body.academic_year)
      .eq('term', body.term || null)
      .single()

    if (existingEnrollment) {
      if (existingEnrollment.enrollment_status === 'enrolled') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Student is already enrolled in this branch for the specified class, academic year, and term'
          },
          { status: 409 }
        )
      } else {
        // Update existing enrollment to enrolled
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from('student_branch_enrollments')
          .update({
            enrollment_status: 'enrolled',
            enrolled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating student branch enrollment:', updateError)
          return NextResponse.json(
            { 
              success: false, 
              error: 'Failed to update student branch enrollment'
            },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          enrollment: updatedEnrollment,
          message: 'Student branch enrollment updated successfully'
        })
      }
    }

    // Create the enrollment
    const { data: newEnrollment, error: createError } = await supabase
      .from('student_branch_enrollments')
      .insert({
        student_id: body.student_id,
        branch_id: body.branch_id,
        class_id: body.class_id,
        academic_year: body.academic_year,
        term: body.term || null,
        enrollment_status: 'enrolled'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating student branch enrollment:', createError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to enroll student in branch'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enrollment: newEnrollment,
      message: 'Student enrolled in branch successfully'
    })

  } catch (error) {
    console.error('Error in enroll student in branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
