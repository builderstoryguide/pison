import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const subsystem = searchParams.get('subsystem')
    const branch = searchParams.get('branch')

    let query = supabase
      .from('levels')
      .select('*')
      .order('name', { ascending: true })

    if (subsystem) {
      query = query.eq('subsystem', subsystem)
    }
    if (branch) {
      query = query.eq('branch', branch)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching levels:', serializeSupabaseError(error))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in levels GET:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication and require admin role first
    let user
    try {
      user = await requireRole(request, 'admin')
    } catch (authError) {
      // requireRole throws a NextResponse on auth failure
      if (authError instanceof NextResponse) {
        return authError
      }
      // If it's some other error, return a generic auth error
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, subsystem, branch } = body

    // Validate required fields
    if (!name || !subsystem || !branch) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subsystem, and branch are required' },
        { status: 400 }
      )
    }

    // Check if level already exists for this subsystem and branch
    const { data: existingLevel, error: checkError } = await supabase
      .from('levels')
      .select('id')
      .eq('name', name)
      .eq('subsystem', subsystem)
      .eq('branch', branch)
      .single()

    // Check for database errors during existence check
    // PGRST116 is "not found" error, which is expected when level doesn't exist
    // Any other error indicates a database problem
    if (checkError) {
      // Check if error has code property and it's not the expected "not found" error
      if (checkError.code && checkError.code !== 'PGRST116') {
        // Any other error code indicates a database problem
        console.error('Error checking for existing level:', serializeSupabaseError(checkError))
        return NextResponse.json(
          { error: 'Failed to verify level existence. Please try again.' },
          { status: 500 }
        )
      }
      // If error exists but no code, or code is undefined, treat as database error
      if (!checkError.code) {
        console.error('Unknown error checking for existing level:', serializeSupabaseError(checkError))
        return NextResponse.json(
          { error: 'Failed to verify level existence. Please try again.' },
          { status: 500 }
        )
      }
      // If code is PGRST116, level doesn't exist (expected), continue
    }

    if (existingLevel) {
      return NextResponse.json(
        { error: `Level "${name}" already exists for ${subsystem} subsystem and ${branch} branch combination` },
        { status: 409 }
      )
    }

    // Create level
    const { data: newLevel, error } = await supabase
      .from('levels')
      .insert({
        name,
        subsystem,
        branch,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating level:', serializeSupabaseError(error))
      return NextResponse.json(
        { error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true,
        level: newLevel
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in levels POST:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

