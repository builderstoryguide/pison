import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  CreateSubjectBranchRequest, 
  SubjectBranchesResponse,
  SubjectBranchWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/subject-branches - List all subject branches
export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const isConnected = await testConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database connection failed',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    const supabase = await createClient()
    if (!supabase) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Supabase client not available',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subjectId')
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')
    const isActive = searchParams.get('isActive')

    // Build the query
    let query = supabase
      .from('subject_branches')
      .select(`
        *,
        subject:subjects(
          id,
          subject_name,
          subject_code,
          subsystem
        )
      `)

    // Apply filters
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
    if (academicYear) {
      query = query.eq('academic_year', academicYear)
    }
    if (term) {
      query = query.eq('term', term)
    }
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data: branches, error } = await query.order('branch_name')

    if (error) {
      console.error('Error fetching subject branches:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch subject branches',
          branches: [],
          total: 0
        } as SubjectBranchesResponse,
        { status: 500 }
      )
    }

    // Get all branch IDs for efficient querying
    const branchIds = branches?.map(b => b.id) || []
    
    // Get all teacher assignments for all branches in one query
    const { data: allTeacherAssignments } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        branch_id,
        teacher_id,
        is_primary_teacher,
        teachers!inner(
          id,
          teacher_id,
          first_name,
          last_name,
          email
        )
      `)
      .in('branch_id', branchIds)

    // Get all student enrollment counts for all branches in one query
    const { data: allStudentEnrollments } = await supabase
      .from('student_branch_enrollments')
      .select('branch_id, enrollment_status')
      .in('branch_id', branchIds)
      .eq('enrollment_status', 'enrolled')

    // Group teacher assignments by branch_id
    const teacherAssignmentsByBranch = (allTeacherAssignments || []).reduce((acc, assignment) => {
      if (!acc[assignment.branch_id]) {
        acc[assignment.branch_id] = []
      }
      // Handle teachers as array (Supabase returns arrays even for single relations)
      const teacher = Array.isArray(assignment.teachers) ? assignment.teachers[0] : assignment.teachers
      if (teacher) {
        acc[assignment.branch_id].push({
          id: teacher.id,
          teacher_id: teacher.teacher_id,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          email: teacher.email,
          is_primary_teacher: assignment.is_primary_teacher
        })
      }
      return acc
    }, {} as Record<string, any[]>)

    // Group student enrollments by branch_id and count
    const studentCountsByBranch = (allStudentEnrollments || []).reduce((acc, enrollment) => {
      acc[enrollment.branch_id] = (acc[enrollment.branch_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Build the final result
    const branchesWithDetails: SubjectBranchWithDetails[] = (branches || []).map(branch => ({
      ...branch,
      teachers: teacherAssignmentsByBranch[branch.id] || [],
      enrolled_students_count: studentCountsByBranch[branch.id] || 0
    }))

    return NextResponse.json({
      success: true,
      branches: branchesWithDetails,
      total: branchesWithDetails.length
    } as SubjectBranchesResponse)

  } catch (error) {
    console.error('Error in subject branches API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        branches: [],
        total: 0
      } as SubjectBranchesResponse,
      { status: 500 }
    )
  }
}

// POST /api/subject-branches - Create a new subject branch
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

    const body: CreateSubjectBranchRequest = await request.json()

    // Validate required fields
    if (!body.subject_id || !body.branch_name || !body.branch_code || !body.academic_year) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: subject_id, branch_name, branch_code, academic_year'
        },
        { status: 400 }
      )
    }

    // Validate weight percentage
    if (body.weight_percentage <= 0 || body.weight_percentage > 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Weight percentage must be between 0 and 100'
        },
        { status: 400 }
      )
    }

    // Check if subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id, subject_name')
      .eq('id', body.subject_id)
      .single()

    if (subjectError || !subject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject not found'
        },
        { status: 404 }
      )
    }

    // Check for duplicate branch code within the same subject and academic year
    const { data: existingBranch } = await supabase
      .from('subject_branches')
      .select('id')
      .eq('subject_id', body.subject_id)
      .eq('branch_code', body.branch_code)
      .eq('academic_year', body.academic_year)
      .eq('term', body.term || null)
      .single()

    if (existingBranch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Branch code already exists for this subject in the specified academic year and term'
        },
        { status: 409 }
      )
    }

    // Generate unique branch_id
    const branchId = `BRANCH-${body.branch_code.toUpperCase()}-${Date.now()}`

    // Create the subject branch
    const { data: newBranch, error: createError } = await supabase
      .from('subject_branches')
      .insert({
        branch_id: branchId,
        subject_id: body.subject_id,
        branch_name: body.branch_name,
        branch_code: body.branch_code,
        description: body.description || null,
        weight_percentage: body.weight_percentage,
        is_optional: body.is_optional || false,
        academic_year: body.academic_year,
        term: body.term || null
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating subject branch:', createError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create subject branch'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      branch: newBranch,
      message: 'Subject branch created successfully'
    })

  } catch (error) {
    console.error('Error in create subject branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
