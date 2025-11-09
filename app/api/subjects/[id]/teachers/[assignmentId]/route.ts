import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const supabase = await createClient()
    const { id, assignmentId } = await params

    // Check if assignment exists and belongs to this subject
    const { data: assignment } = await supabase
      .from('teacher_subjects')
      .select('id, subject_id')
      .eq('id', assignmentId)
      .eq('subject_id', id)
      .single()

    if (!assignment) {
      return NextResponse.json(
        { ok: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from('teacher_subjects')
      .delete()
      .eq('id', assignmentId)
      .eq('subject_id', id)

    if (deleteError) {
      console.error('Error deleting teacher assignment:', serializeSupabaseError(deleteError))
      return NextResponse.json(
        { ok: false, error: serializeSupabaseError(deleteError) },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in teacher assignment DELETE:', serializeSupabaseError(error as any))
    return NextResponse.json(
      { ok: false, error: serializeSupabaseError(error as any) },
      { status: 500 }
    )
  }
}

