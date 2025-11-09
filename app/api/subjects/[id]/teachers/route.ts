import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get all teacher assignments for this subject
    const { data: assignments, error } = await supabase
      .from('teacher_subjects')
      .select(`
        id,
        teacher_id,
        subject_id,
        sub_branch_id,
        assignment_type,
        is_active,
        created_at,
        subject_sub_branches (
          id,
          name
        )
      `)
      .eq('subject_id', id)

    if (error) {
      console.error('Error fetching teacher assignments:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    // Fetch teacher names
    const teacherIds = [...new Set((assignments || []).map((a: any) => a.teacher_id))]
    const { data: teachers } = await supabase
      .from('users')
      .select('id, name')
      .in('id', teacherIds)

    const teacherMap = new Map((teachers || []).map((t: any) => [t.id, t.name]))

    const transformedAssignments = (assignments || []).map((assignment: any) => ({
      id: assignment.id,
      teacher_id: assignment.teacher_id,
      teacher_name: teacherMap.get(assignment.teacher_id) || 'Unknown',
      subject_id: assignment.subject_id,
      sub_branch_id: assignment.sub_branch_id || null,
      sub_branch_name: assignment.subject_sub_branches?.name || null,
      assignment_type: assignment.assignment_type || 'main_subject',
      is_active: assignment.is_active !== false,
      created_at: assignment.created_at,
    }))

    return NextResponse.json({
      ok: true,
      assignments: transformedAssignments,
    })
  } catch (error) {
    console.error('Error in teachers GET:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { teacher_id, sub_branch_id } = body

    // Validate required fields
    if (!teacher_id) {
      return NextResponse.json(
        { ok: false, error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Check if subject exists
    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', id)
      .single()

    if (!subject) {
      return NextResponse.json(
        { ok: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // If sub_branch_id is provided, validate it exists and belongs to this subject
    if (sub_branch_id) {
      const { data: subBranch } = await supabase
        .from('subject_sub_branches')
        .select('id, subject_id')
        .eq('id', sub_branch_id)
        .eq('subject_id', id)
        .single()

      if (!subBranch) {
        return NextResponse.json(
          { ok: false, error: 'Sub-branch not found or does not belong to this subject' },
          { status: 400 }
        )
      }
    }

    // Check if teacher exists
    const { data: teacher } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', teacher_id)
      .eq('role', 'teacher')
      .single()

    if (!teacher) {
      return NextResponse.json(
        { ok: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }

    // Check if assignment already exists
    const assignmentQuery = supabase
      .from('teacher_subjects')
      .select('id')
      .eq('teacher_id', teacher_id)
      .eq('subject_id', id)

    if (sub_branch_id) {
      assignmentQuery.eq('sub_branch_id', sub_branch_id)
    } else {
      assignmentQuery.is('sub_branch_id', null)
    }

    const { data: existingAssignment } = await assignmentQuery.single()

    if (existingAssignment) {
      return NextResponse.json(
        { ok: false, error: 'Teacher is already assigned to this subject/sub-branch' },
        { status: 400 }
      )
    }

    // Create assignment
    const assignmentData: any = {
      teacher_id,
      subject_id: id,
      assignment_type: sub_branch_id ? 'sub_branch' : 'main_subject',
      is_active: true,
    }

    if (sub_branch_id) {
      assignmentData.sub_branch_id = sub_branch_id
    }

    // Also maintain backward compatibility with subject_name
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', id)
      .single()

    if (subjectData) {
      assignmentData.subject_name = subjectData.name
    }

    const { data: newAssignment, error: createError } = await supabase
      .from('teacher_subjects')
      .insert(assignmentData)
      .select()
      .single()

    if (createError) {
      console.error('Error creating teacher assignment:', serializeSupabaseError(createError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(createError) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      assignment: newAssignment,
    })
  } catch (error) {
    console.error('Error in teachers POST:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

