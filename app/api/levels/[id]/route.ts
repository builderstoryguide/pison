import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Level ID is required' },
        { status: 400 }
      )
    }

    // Check if level exists
    const { data: level, error: fetchError } = await supabase
      .from('levels')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError || !level) {
      return NextResponse.json(
        { error: 'Level not found' },
        { status: 404 }
      )
    }

    // Delete the level
    const { error } = await supabase
      .from('levels')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting level:', serializeSupabaseError(error))
      return NextResponse.json(
        { error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in levels DELETE:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}






