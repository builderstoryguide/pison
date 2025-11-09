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
    const { data: existingLevel } = await supabase
      .from('levels')
      .select('id')
      .eq('name', name)
      .eq('subsystem', subsystem)
      .eq('branch', branch)
      .single()

    if (existingLevel) {
      return NextResponse.json(
        { error: 'Level already exists for this subsystem and branch combination' },
        { status: 409 }
      )
    }

    // Check authentication and require admin role
    const user = await requireRole(request, 'admin')

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

