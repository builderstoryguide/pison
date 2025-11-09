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

    const { data: subject, error } = await supabase
      .from('subjects')
      .select(`
        *,
        subject_sub_branches (
          id,
          name,
          coefficient,
          description,
          is_active,
          created_at,
          updated_at
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching subject:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 404 }
      )
    }

    if (!subject) {
      return NextResponse.json(
        { ok: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    const responseSubject = {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      has_sub_branches: subject.has_sub_branches || false,
      coefficient: subject.has_sub_branches ? undefined : (subject.coefficient ? parseFloat(subject.coefficient) : 1.0),
      is_active: subject.is_active !== false,
      created_at: subject.created_at,
      updated_at: subject.updated_at,
      subject_groupings: subject.subject_groupings || [],
      sub_branches: (subject.subject_sub_branches || []).map((sb: any) => ({
        id: sb.id,
        subject_id: subject.id,
        name: sb.name,
        coefficient: parseFloat(sb.coefficient) || 1.0,
        description: sb.description,
        is_active: sb.is_active !== false,
        created_at: sb.created_at,
        updated_at: sb.updated_at,
      })),
    }

    return NextResponse.json(responseSubject)
  } catch (error) {
    console.error('Error in subject GET:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const {
      name,
      code,
      description,
      has_sub_branches,
      coefficient,
      is_active,
      subject_groupings,
    } = body

    // Check if subject exists
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id, name')
      .eq('id', id)
      .single()

    if (!existingSubject) {
      return NextResponse.json(
        { ok: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // If name is being changed, check for duplicates
    if (name && name !== existingSubject.name) {
      const { data: duplicateSubject } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', name.trim())
        .neq('id', id)
        .single()

      if (duplicateSubject) {
        return NextResponse.json(
          { ok: false, error: 'Subject with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Get current subject state to check if it has sub-branches
    const { data: currentSubject } = await supabase
      .from('subjects')
      .select('has_sub_branches, coefficient')
      .eq('id', id)
      .single()

    const finalHasSubBranches = has_sub_branches !== undefined ? has_sub_branches : currentSubject?.has_sub_branches

    // Validate coefficient for simple subjects
    if (finalHasSubBranches === false && coefficient !== undefined) {
      const coefficientValue = parseFloat(coefficient)
      if (isNaN(coefficientValue) || coefficientValue <= 0) {
        return NextResponse.json(
          { ok: false, error: 'Coefficient must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Validate subject_groupings if provided
    if (subject_groupings !== undefined) {
      const validGroupings = ['languages', 'related_trade_subjects', 'trade_subjects', 'others']
      if (!Array.isArray(subject_groupings)) {
        return NextResponse.json(
          { ok: false, error: 'subject_groupings must be an array' },
          { status: 400 }
        )
      }
      const invalidGroupings = subject_groupings.filter((g: string) => !validGroupings.includes(g))
      if (invalidGroupings.length > 0) {
        return NextResponse.json(
          { ok: false, error: `Invalid subject groupings: ${invalidGroupings.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name.trim()
    if (code !== undefined) updateData.code = code?.trim() || null
    if (description !== undefined) updateData.description = description?.trim() || null
    if (has_sub_branches !== undefined) {
      updateData.has_sub_branches = has_sub_branches
      // When switching to sub-branches, clear coefficient (set to default)
      if (has_sub_branches === true) {
        updateData.coefficient = 1.0 // Set default, but won't be used
      }
    }
    // Only update coefficient for simple subjects
    if (coefficient !== undefined && finalHasSubBranches === false) {
      updateData.coefficient = parseFloat(coefficient)
    }
    // When switching from sub-branches to simple, set default coefficient if not provided
    if (has_sub_branches === false && currentSubject?.has_sub_branches === true && coefficient === undefined) {
      updateData.coefficient = 1.0
    }
    if (is_active !== undefined) updateData.is_active = is_active
    if (subject_groupings !== undefined) {
      updateData.subject_groupings = Array.isArray(subject_groupings) && subject_groupings.length > 0
        ? subject_groupings
        : []
    }

    const { data: updatedSubject, error: updateError } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating subject:', serializeSupabaseError(updateError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(updateError) },
        { status: 500 }
      )
    }

    // Fetch sub-branches
    const { data: subBranches } = await supabase
      .from('subject_sub_branches')
      .select('*')
      .eq('subject_id', id)

    const responseSubject = {
      id: updatedSubject.id,
      name: updatedSubject.name,
      code: updatedSubject.code,
      description: updatedSubject.description,
      has_sub_branches: updatedSubject.has_sub_branches,
      coefficient: updatedSubject.has_sub_branches ? undefined : (updatedSubject.coefficient ? parseFloat(updatedSubject.coefficient) : 1.0),
      is_active: updatedSubject.is_active,
      created_at: updatedSubject.created_at,
      updated_at: updatedSubject.updated_at,
      subject_groupings: updatedSubject.subject_groupings || [],
      sub_branches: (subBranches || []).map((sb: any) => ({
        id: sb.id,
        subject_id: updatedSubject.id,
        name: sb.name,
        coefficient: parseFloat(sb.coefficient) || 1.0,
        description: sb.description,
        is_active: sb.is_active !== false,
        created_at: sb.created_at,
        updated_at: sb.updated_at,
      })),
    }

    return NextResponse.json({
      ok: true,
      subject: responseSubject,
    })
  } catch (error) {
    console.error('Error in subject PUT:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check if subject exists
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', id)
      .single()

    if (!existingSubject) {
      return NextResponse.json(
        { ok: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check if subject has assessments/grades (prevent deletion if it does)
    const { data: assessments } = await supabase
      .from('assessments')
      .select('id')
      .eq('subject_id', id)
      .limit(1)

    if (assessments && assessments.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'Cannot delete subject with existing assessments. Please delete assessments first.' },
        { status: 400 }
      )
    }

    // Delete subject (cascade will handle sub-branches)
    const { error: deleteError } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting subject:', serializeSupabaseError(deleteError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(deleteError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in subject DELETE:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

