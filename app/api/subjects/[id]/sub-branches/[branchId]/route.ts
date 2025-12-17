import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, branchId } = await params
    const body = await request.json()

    const { name, description, is_active } = body

    // Check if sub-branch exists
    const { data: existingSubBranch } = await supabase
      .from('subject_sub_branches')
      .select('id, subject_id, name')
      .eq('id', branchId)
      .eq('subject_id', id)
      .single()

    if (!existingSubBranch) {
      return NextResponse.json(
        { ok: false, error: 'Sub-branch not found' },
        { status: 404 }
      )
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingSubBranch.name) {
      const { data: duplicateSubBranch } = await supabase
        .from('subject_sub_branches')
        .select('id')
        .eq('subject_id', id)
        .eq('name', name.trim())
        .neq('id', branchId)
        .single()

      if (duplicateSubBranch) {
        return NextResponse.json(
          { ok: false, error: 'Sub-branch with this name already exists for this subject' },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: updatedSubBranch, error: updateError } = await supabase
      .from('subject_sub_branches')
      .update(updateData)
      .eq('id', branchId)
      .eq('subject_id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating sub-branch:', serializeSupabaseError(updateError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(updateError) },
        { status: 500 }
      )
    }

    const responseSubBranch = {
      id: updatedSubBranch.id,
      subject_id: updatedSubBranch.subject_id,
      name: updatedSubBranch.name,
      description: updatedSubBranch.description,
      is_active: updatedSubBranch.is_active !== false,
      created_at: updatedSubBranch.created_at,
      updated_at: updatedSubBranch.updated_at,
    }

    return NextResponse.json({
      ok: true,
      sub_branch: responseSubBranch,
    })
  } catch (error) {
    console.error('Error in sub-branch PUT:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, branchId } = await params

    // Check if sub-branch exists
    const { data: existingSubBranch } = await supabase
      .from('subject_sub_branches')
      .select('id, subject_id')
      .eq('id', branchId)
      .eq('subject_id', id)
      .single()

    if (!existingSubBranch) {
      return NextResponse.json(
        { ok: false, error: 'Sub-branch not found' },
        { status: 404 }
      )
    }

    // Check if sub-branch has assessments/grades (prevent deletion if it does)
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('sub_branch_id', branchId)
      .limit(1)

    if (assessments && assessments.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Cannot delete sub-branch with existing assessments. Please delete assessments first.' },
        { status: 400 }
      )
    }

    // Delete sub-branch
    const { error: deleteError } = await supabase
      .from('subject_sub_branches')
      .delete()
      .eq('id', branchId)
      .eq('subject_id', id)

    if (deleteError) {
      console.error('Error deleting sub-branch:', serializeSupabaseError(deleteError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(deleteError) },
        { status: 500 }
      )
    }

    // Check if subject has any remaining sub-branches
    const { data: remainingSubBranches } = await supabase
      .from('subject_sub_branches')
      .select('id')
      .eq('subject_id', id)
      .limit(1)

    // Update subject has_sub_branches flag if no sub-branches remain
    if (!remainingSubBranches || remainingSubBranches.length === 0) {
      await supabase
        .from('subjects')
        .update({ has_sub_branches: false })
        .eq('id', id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in sub-branch DELETE:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

