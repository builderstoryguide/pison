import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/database-utils'
import type { 
  SubjectBranchWithDetails 
} from '@/lib/subject-branches-types'

// GET /api/subject-branches/[id] - Get a specific subject branch
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: branchId } = await params

    // Get the subject branch with related data
    const { data: branch, error } = await supabase
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
      .eq('id', branchId)
      .single()

    if (error || !branch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject branch not found'
        },
        { status: 404 }
      )
    }

    // Get teachers assigned to this branch
    const { data: teachers } = await supabase
      .from('teacher_branch_assignments')
      .select(`
        teacher_id,
        is_primary_teacher,
        teachers:teacher_id(
          id,
          teacher_id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('branch_id', branchId)

    // Get enrolled students count
    const { count: enrolledStudentsCount } = await supabase
      .from('student_branch_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('enrollment_status', 'enrolled')

    const branchWithDetails: SubjectBranchWithDetails = {
      ...branch,
      teachers: teachers?.map(t => ({
        id: t.teachers[0]?.id,
        teacher_id: t.teachers[0]?.teacher_id,
        first_name: t.teachers[0]?.first_name,
        last_name: t.teachers[0]?.last_name,
        email: t.teachers[0]?.email,
        is_primary_teacher: t.is_primary_teacher
      })) || [],
      enrolled_students_count: enrolledStudentsCount || 0
    }

    return NextResponse.json({
      success: true,
      branch: branchWithDetails
    })

  } catch (error) {
    console.error('Error in get subject branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// PUT /api/subject-branches/[id] - Update a subject branch
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: branchId } = await params
    const body = await request.json()

    // Check if branch exists
    const { data: existingBranch, error: fetchError } = await supabase
      .from('subject_branches')
      .select('id, subject_id, academic_year, term')
      .eq('id', branchId)
      .single()

    if (fetchError || !existingBranch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject branch not found'
        },
        { status: 404 }
      )
    }

    // Validate weight percentage if provided
    if (body.weight_percentage !== undefined && (body.weight_percentage <= 0 || body.weight_percentage > 100)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Weight percentage must be between 0 and 100'
        },
        { status: 400 }
      )
    }

    // Check for duplicate branch code if being updated
    if (body.branch_code) {
      const { data: duplicateBranch } = await supabase
        .from('subject_branches')
        .select('id')
        .eq('subject_id', existingBranch.subject_id)
        .eq('branch_code', body.branch_code)
        .eq('academic_year', existingBranch.academic_year)
        .eq('term', existingBranch.term)
        .neq('id', branchId)
        .single()

      if (duplicateBranch) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Branch code already exists for this subject in the specified academic year and term'
          },
          { status: 409 }
        )
      }
    }

    // Update the subject branch
    const { data: updatedBranch, error: updateError } = await supabase
      .from('subject_branches')
      .update({
        ...(body.branch_name && { branch_name: body.branch_name }),
        ...(body.branch_code && { branch_code: body.branch_code }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.weight_percentage !== undefined && { weight_percentage: body.weight_percentage }),
        ...(body.is_optional !== undefined && { is_optional: body.is_optional }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        updated_at: new Date().toISOString()
      })
      .eq('id', branchId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subject branch:', updateError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update subject branch'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      branch: updatedBranch,
      message: 'Subject branch updated successfully'
    })

  } catch (error) {
    console.error('Error in update subject branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/subject-branches/[id] - Delete a subject branch
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: branchId } = await params

    // Check if branch exists
    const { data: existingBranch, error: fetchError } = await supabase
      .from('subject_branches')
      .select('id, branch_name')
      .eq('id', branchId)
      .single()

    if (fetchError || !existingBranch) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Subject branch not found'
        },
        { status: 404 }
      )
    }

    // Check if there are any enrolled students
    const { count: enrolledStudentsCount } = await supabase
      .from('student_branch_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .eq('enrollment_status', 'enrolled')

    if (enrolledStudentsCount && enrolledStudentsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete branch. There are ${enrolledStudentsCount} students currently enrolled. Please unenroll all students first.`
        },
        { status: 409 }
      )
    }

    // Check if there are any assessments
    const { count: assessmentsCount } = await supabase
      .from('branch_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)

    if (assessmentsCount && assessmentsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Cannot delete branch. There are ${assessmentsCount} assessments associated with this branch. Please delete all assessments first.`
        },
        { status: 409 }
      )
    }

    // Delete the subject branch
    const { error: deleteError } = await supabase
      .from('subject_branches')
      .delete()
      .eq('id', branchId)

    if (deleteError) {
      console.error('Error deleting subject branch:', deleteError)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to delete subject branch'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Subject branch deleted successfully'
    })

  } catch (error) {
    console.error('Error in delete subject branch API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
