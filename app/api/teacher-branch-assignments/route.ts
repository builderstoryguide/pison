import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  AssignTeacherToBranchRequest,
  TeacherBranchAssignmentsResponse,
  TeacherBranchAssignmentWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/teacher-branch-assignments - List teacher branch assignments
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          assignments: [],
          total: 0
        } as TeacherBranchAssignmentsResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          assignments: [],
          total: 0
        } as TeacherBranchAssignmentsResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacherId')
    const branchId = searchParams.get('branchId')
    const classId = searchParams.get('classId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')

    // Build the query
    let query = supabase
      .from('teacher_branch_assignments')
      .select(`
        *,
        teacher:teachers(
          id,
          teacher_id,
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

    const { data: assignments, error } = await query.order('assigned_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher branch assignments:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch teacher branch assignments',
          assignments: [],
          total: 0
        } as TeacherBranchAssignmentsResponse,
        { status: 500 }
      )
    }

    // Transform the data to match the expected interface
    const assignmentsWithDetails: TeacherBranchAssignmentWithDetails[] = (assignments || []).map(assignment => ({
      id: assignment.id,
      teacher_id: assignment.teacher_id,
      branch_id: assignment.branch_id,
      class_id: assignment.class_id,
      academic_year: assignment.academic_year,
      term: assignment.term,
      is_primary_teacher: assignment.is_primary_teacher,
      assigned_at: assignment.assigned_at,
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
      teacher: {
        id: assignment.teacher.id,
        teacher_id: assignment.teacher.teacher_id,
        first_name: assignment.teacher.first_name,
        last_name: assignment.teacher.last_name,
        email: assignment.teacher.email
      },
      branch: {
        id: assignment.branch.id,
        branch_name: assignment.branch.branch_name,
        branch_code: assignment.branch.branch_code,
        subject_id: assignment.branch.subject_id
      },
      subject: {
        id: assignment.subject.subjects.id,
        subject_name: assignment.subject.subjects.subject_name,
        subject_code: assignment.subject.subjects.subject_code
      },
      class: {
        id: assignment.class.id,
        class_name: assignment.class.class_name,
        class_level: assignment.class.class_level
      }
    }))

    return NextResponse.json({
      success: true,
      assignments: assignmentsWithDetails,
      total: assignmentsWithDetails.length
    } as TeacherBranchAssignmentsResponse)

  } catch (error) {
    console.error('Error in teacher branch assignments API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        assignments: [],
        total: 0
      } as TeacherBranchAssignmentsResponse,
      { status: 500 }
    )
  }
}

// POST /api/teacher-branch-assignments - Assign teacher to a branch
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

    const body: AssignTeacherToBranchRequest = await request.json()
    
    console.log('🔍 Teacher branch assignment request:', JSON.stringify(body, null, 2))

    // Validate required fields
    if (!body.teacher_id || !body.branch_id || !body.class_id || !body.academic_year) {
      console.error('❌ Missing required fields:', {
        teacher_id: body.teacher_id,
        branch_id: body.branch_id,
        class_id: body.class_id,
        academic_year: body.academic_year
      })
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: teacher_id, branch_id, class_id, academic_year'
        },
        { status: 400 }
      )
    }

    // Check if teacher exists
    console.log('🔍 Looking for teacher with ID:', body.teacher_id)
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, teacher_id, first_name, last_name')
      .eq('id', body.teacher_id)
      .single()

    console.log('📊 Teacher lookup result:', { teacher, teacherError })

    if (teacherError || !teacher) {
      console.error('❌ Teacher not found with ID:', body.teacher_id, 'Error:', teacherError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher not found'
        },
        { status: 404 }
      )
    }

    // Check if branch exists
    const { data: branch, error: branchError } = await supabase
      .from('subject_branches')
      .select('id, branch_name, branch_code, subject_id')
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

    // Check for existing assignment
    const { data: existingAssignment } = await supabase
      .from('teacher_branch_assignments')
      .select('id')
      .eq('teacher_id', body.teacher_id)
      .eq('branch_id', body.branch_id)
      .eq('class_id', body.class_id)
      .eq('academic_year', body.academic_year)
      .eq('term', body.term || null)
      .single()

    if (existingAssignment) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Teacher is already assigned to this branch for the specified class, academic year, and term'
        },
        { status: 409 }
      )
    }

    // If this is set as primary teacher, unset other primary teachers for this branch/class
    if (body.is_primary_teacher) {
      await supabase
        .from('teacher_branch_assignments')
        .update({ is_primary_teacher: false })
        .eq('branch_id', body.branch_id)
        .eq('class_id', body.class_id)
        .eq('academic_year', body.academic_year)
        .eq('term', body.term || null)
    }

    // Create the assignment
    console.log('💾 Creating teacher branch assignment with data:', {
      teacher_id: body.teacher_id,
      branch_id: body.branch_id,
      class_id: body.class_id,
      academic_year: body.academic_year,
      term: body.term || null,
      is_primary_teacher: body.is_primary_teacher || false
    })
    
    const { data: newAssignment, error: createError } = await supabase
      .from('teacher_branch_assignments')
      .insert({
        teacher_id: body.teacher_id,
        branch_id: body.branch_id,
        class_id: body.class_id,
        academic_year: body.academic_year,
        term: body.term || null,
        is_primary_teacher: body.is_primary_teacher || false
      })
      .select()
      .single()

    console.log('📊 Assignment creation result:', { newAssignment, createError })

    if (createError) {
      console.error('❌ Error creating teacher branch assignment:', createError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to assign teacher to branch'
        },
        { status: 500 }
      )
    }

    console.log('✅ Teacher branch assignment created successfully:', newAssignment)
    return NextResponse.json({
      success: true,
      assignment: newAssignment,
      message: 'Teacher assigned to branch successfully'
    })

  } catch (error) {
    console.error('Error in assign teacher to branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
