import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const isActive = searchParams.get('is_active')
    const hasSubBranches = searchParams.get('has_sub_branches')

    let query = supabase
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
      .order('name', { ascending: true })

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    if (hasSubBranches !== null) {
      query = query.eq('has_sub_branches', hasSubBranches === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching subjects:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    // Apply search filter if provided
    let filteredData = data || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter((subject: any) =>
        subject.name?.toLowerCase().includes(searchLower) ||
        subject.code?.toLowerCase().includes(searchLower) ||
        subject.description?.toLowerCase().includes(searchLower)
      )
    }

    // Transform data to match expected interface
    const transformedData = filteredData.map((subject: any) => ({
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
    }))

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in subjects GET:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      name,
      code,
      description,
      has_sub_branches = false,
      coefficient,
      is_active = true,
      sub_branches = [],
      subject_groupings = [],
    } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Subject name is required' },
        { status: 400 }
      )
    }

    // Validate coefficient for simple subjects
    if (!has_sub_branches) {
      const coefficientValue = coefficient !== undefined ? parseFloat(coefficient) : 1.0
      if (isNaN(coefficientValue) || coefficientValue <= 0) {
        return NextResponse.json(
          { ok: false, error: 'Coefficient must be a positive number' },
          { status: 400 }
        )
      }
    }

    // Validate subject_groupings
    const validGroupings = ['languages', 'related_trade_subjects', 'trade_subjects', 'others']
    if (subject_groupings) {
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

    // Check if subject with same name already exists
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingSubject) {
      return NextResponse.json(
        { ok: false, error: 'Subject with this name already exists' },
        { status: 400 }
      )
    }

    // Create subject
    const subjectData: any = {
      name: name.trim(),
      code: code?.trim() || null,
      description: description?.trim() || null,
      has_sub_branches: has_sub_branches === true,
      is_active: is_active !== false,
      subject_groupings: Array.isArray(subject_groupings) && subject_groupings.length > 0 
        ? subject_groupings 
        : [],
    }

    // Only add coefficient for simple subjects (without sub-branches)
    if (!has_sub_branches) {
      subjectData.coefficient = coefficient !== undefined ? parseFloat(coefficient) : 1.0
    }

    const { data: newSubject, error: subjectError } = await supabase
      .from('subjects')
      .insert(subjectData)
      .select()
      .single()

    if (subjectError) {
      console.error('Error creating subject:', serializeSupabaseError(subjectError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(subjectError) },
        { status: 500 }
      )
    }

    // Create sub-branches if provided
    let createdSubBranches: any[] = []
    if (has_sub_branches && Array.isArray(sub_branches) && sub_branches.length > 0) {
      const subBranchesData = sub_branches.map((sb: any) => ({
        subject_id: newSubject.id,
        name: sb.name.trim(),
        coefficient: parseFloat(sb.coefficient) || 1.0,
        description: sb.description?.trim() || null,
        is_active: sb.is_active !== false,
      }))

      // Validate sub-branch names are unique within the subject
      const subBranchNames = subBranchesData.map((sb) => sb.name.toLowerCase())
      const uniqueNames = new Set(subBranchNames)
      if (uniqueNames.size !== subBranchNames.length) {
        // Rollback subject creation
        await supabase.from('subjects').delete().eq('id', newSubject.id)
        return NextResponse.json(
          { ok: false, error: 'Sub-branch names must be unique within a subject' },
          { status: 400 }
        )
      }

      const { data: insertedSubBranches, error: subBranchesError } = await supabase
        .from('subject_sub_branches')
        .insert(subBranchesData)
        .select()

      if (subBranchesError) {
        console.error('Error creating sub-branches:', serializeSupabaseError(subBranchesError))
        // Rollback subject creation
        await supabase.from('subjects').delete().eq('id', newSubject.id)
        return NextResponse.json(
          { ok: false, error: serializeSupabaseError(subBranchesError) },
          { status: 500 }
        )
      }

      createdSubBranches = insertedSubBranches || []
    }

    // Transform response
    const responseSubject = {
      id: newSubject.id,
      name: newSubject.name,
      code: newSubject.code,
      description: newSubject.description,
      has_sub_branches: newSubject.has_sub_branches,
      coefficient: newSubject.has_sub_branches ? undefined : (newSubject.coefficient ? parseFloat(newSubject.coefficient) : 1.0),
      is_active: newSubject.is_active,
      created_at: newSubject.created_at,
      updated_at: newSubject.updated_at,
      subject_groupings: newSubject.subject_groupings || [],
      sub_branches: createdSubBranches.map((sb) => ({
        id: sb.id,
        subject_id: newSubject.id,
        name: sb.name,
        coefficient: parseFloat(sb.coefficient) || 1.0,
        description: sb.description,
        is_active: sb.is_active,
        created_at: sb.created_at,
        updated_at: sb.updated_at,
      })),
    }

    return NextResponse.json({
      ok: true,
      subject: responseSubject,
    })
  } catch (error) {
    console.error('Error in subjects POST:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

