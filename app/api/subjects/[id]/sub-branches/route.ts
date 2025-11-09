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

    const { data: subBranches, error } = await supabase
      .from('subject_sub_branches')
      .select('*')
      .eq('subject_id', id)
      .order('name', { ascending: true })

    if (error) {
      console.error('Error fetching sub-branches:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    const transformedData = (subBranches || []).map((sb: any) => ({
      id: sb.id,
      subject_id: sb.subject_id,
      name: sb.name,
      coefficient: parseFloat(sb.coefficient) || 1.0,
      description: sb.description,
      is_active: sb.is_active !== false,
      created_at: sb.created_at,
      updated_at: sb.updated_at,
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in sub-branches GET:', serializeSupabaseError(error as any))
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

    const { name, coefficient, description, is_active = true } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Sub-branch name is required' },
        { status: 400 }
      )
    }

    if (coefficient !== undefined && (isNaN(parseFloat(coefficient)) || parseFloat(coefficient) <= 0)) {
      return NextResponse.json(
        { ok: false, error: 'Coefficient must be a positive number' },
        { status: 400 }
      )
    }

    // Check if subject exists
    const { data: subject } = await supabase
      .from('subjects')
      .select('id, has_sub_branches')
      .eq('id', id)
      .single()

    if (!subject) {
      return NextResponse.json(
        { ok: false, error: 'Subject not found' },
        { status: 404 }
      )
    }

    // Check if sub-branch with same name already exists for this subject
    const { data: existingSubBranch } = await supabase
      .from('subject_sub_branches')
      .select('id')
      .eq('subject_id', id)
      .eq('name', name.trim())
      .single()

    if (existingSubBranch) {
      return NextResponse.json(
        { ok: false, error: 'Sub-branch with this name already exists for this subject' },
        { status: 400 }
      )
    }

    // Update subject to mark it as having sub-branches
    if (!subject.has_sub_branches) {
      await supabase
        .from('subjects')
        .update({ has_sub_branches: true })
        .eq('id', id)
    }

    // Create sub-branch
    const { data: newSubBranch, error: createError } = await supabase
      .from('subject_sub_branches')
      .insert({
        subject_id: id,
        name: name.trim(),
        coefficient: parseFloat(coefficient) || 1.0,
        description: description?.trim() || null,
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating sub-branch:', serializeSupabaseError(createError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(createError) },
        { status: 500 }
      )
    }

    const responseSubBranch = {
      id: newSubBranch.id,
      subject_id: newSubBranch.subject_id,
      name: newSubBranch.name,
      coefficient: parseFloat(newSubBranch.coefficient) || 1.0,
      description: newSubBranch.description,
      is_active: newSubBranch.is_active !== false,
      created_at: newSubBranch.created_at,
      updated_at: newSubBranch.updated_at,
    }

    return NextResponse.json({
      ok: true,
      sub_branch: responseSubBranch,
    })
  } catch (error) {
    console.error('Error in sub-branch POST:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

