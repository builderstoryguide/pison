import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { serializeSupabaseError } from '@/lib/safe-error'
import { requireRole } from '@/lib/auth/server'

export const runtime = 'nodejs'

/**
 * PUT /api/sequences/assign
 * Reassign a sequence to a different term (admin only)
 * Body: { academicYear, sequenceNumber, term }
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role using requireRole
    const user = await requireRole(request, 'admin')
    
    // Use service client to bypass RLS (we've already validated admin access)
    const supabase = createServiceClient()

    const body = await request.json()
    const { academicYear, sequenceNumber, term } = body

    if (!academicYear || !sequenceNumber || !term) {
      return NextResponse.json(
        { success: false, error: 'academicYear, sequenceNumber, and term are required' },
        { status: 400 }
      )
    }

    // Validate term
    if (!['Term 1', 'Term 2', 'Term 3'].includes(term)) {
      return NextResponse.json(
        { success: false, error: 'term must be one of: Term 1, Term 2, Term 3' },
        { status: 400 }
      )
    }

    // Validate sequence number
    if (sequenceNumber < 1 || sequenceNumber > 6) {
      return NextResponse.json(
        { success: false, error: 'sequenceNumber must be between 1 and 6' },
        { status: 400 }
      )
    }

    // First check if the sequence exists
    const { data: existingSequence, error: checkError } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('sequence_number', sequenceNumber)
      .maybeSingle()
    
    // Also check what sequences exist for this academic year
    const { data: allSequences } = await supabase
      .from('academic_sequences')
      .select('sequence_number, term, is_active')
      .eq('academic_year', academicYear)
      .order('sequence_number', { ascending: true })

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking sequence:', checkError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(checkError) },
        { status: 500 }
      )
    }

    if (!existingSequence) {
      const existingSequenceNumbers = allSequences?.filter(s => s.is_active).map(s => s.sequence_number) || []
      const maxSequence = existingSequenceNumbers.length > 0 ? Math.max(...existingSequenceNumbers) : 0
      
      let errorMessage = `Sequence ${sequenceNumber} not found for academic year ${academicYear}.`
      if (existingSequenceNumbers.length === 0) {
        errorMessage += ' No sequences have been created yet. Please configure sequences first in the Sequence Configuration section.'
      } else if (sequenceNumber > maxSequence) {
        errorMessage += ` Only ${maxSequence} sequence(s) exist (${existingSequenceNumbers.join(', ')}). Please increase the number of sequences in the configuration.`
      } else {
        errorMessage += ` Available sequences: ${existingSequenceNumbers.join(', ')}.`
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 404 }
      )
    }


    // Update the sequence's term assignment
    const { data: sequence, error: updateError } = await supabase
      .from('academic_sequences')
      .update({
        term: term,
        updated_at: new Date().toISOString()
      })
      .eq('academic_year', academicYear)
      .eq('sequence_number', sequenceNumber)
      .select()
      .single()


    if (updateError) {
      console.error('Error reassigning sequence:', updateError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(updateError) },
        { status: 500 }
      )
    }

    if (!sequence) {
      return NextResponse.json(
        { success: false, error: 'Sequence not found after update' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      sequence,
      message: `Sequence ${sequenceNumber} reassigned to ${term} successfully.`
    })

  } catch (error: any) {
    console.error('Error in PUT /api/sequences/assign:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
