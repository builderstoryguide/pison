import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serializeSupabaseError } from '@/lib/safe-error'
import { getAcademicYearFromConfig } from '@/lib/app-config-server'
import { loadSequenceYearConfig } from '@/lib/load-sequence-config-server'
import {
  getGlobalSlotsForTerm,
  getSequenceDisplayName,
  getTermNumber,
  getActiveGlobalSequenceCount,
} from '@/lib/sequence-term-mapping'

export const runtime = 'nodejs'

/**
 * GET /api/sequences
 * Fetch sequences for an academic year/term
 * Query params: academicYear, term
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear')
    const term = searchParams.get('term')

    // If no params provided, get current academic year from app configuration
    const year = academicYear || await getAcademicYearFromConfig()
    const termValue = term || 'Term 1'

    // Use the database function to get sequences (which auto-initializes if needed)
    const { data: sequences, error } = await supabase.rpc('get_academic_sequences', {
      p_academic_year: year,
      p_term: termValue
    })

    const yearConfig = await loadSequenceYearConfig(supabase, year)
    const termNum = getTermNumber(termValue)
    const allowedGlobals = new Set(getGlobalSlotsForTerm(termNum, yearConfig.termSequenceCounts))

    if (error) {
      console.error('Error fetching sequences:', error)
      const total = getActiveGlobalSequenceCount(yearConfig.totalSequences)
      const fallbackSequences = Array.from({ length: total }, (_, i) => i + 1)
        .filter((n) => allowedGlobals.has(n))
        .map((n) => ({
          id: `seq-${n}`,
          sequence_number: n,
          sequence_name: getSequenceDisplayName(n),
          max_marks: yearConfig.totalSequences ? 20 : 20,
          is_active: true,
          academic_year: year,
          term: termValue,
          start_date: null,
          end_date: null,
        }))

      return NextResponse.json({
        success: true,
        sequences: fallbackSequences,
        academicYear: year,
        term: termValue,
        totalSequences: yearConfig.totalSequences,
        termSequenceCounts: yearConfig.termSequenceCounts,
        useFixed: true,
      })
    }

    const filtered = (sequences || []).filter(
      (seq: { sequence_number: number; is_active?: boolean }) =>
        seq.is_active !== false && allowedGlobals.has(seq.sequence_number)
    )

    return NextResponse.json({
      success: true,
      sequences: filtered,
      academicYear: year,
      term: termValue,
      totalSequences: yearConfig.totalSequences,
      termSequenceCounts: yearConfig.termSequenceCounts,
      useFixed: false,
    })

  } catch (error: any) {
    console.error('Error in GET /api/sequences:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sequences
 * Create or update a sequence (admin only)
 * Body: { academicYear, term, sequenceNumber, sequenceName, startDate?, endDate?, maxMarks?, isActive? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user role:', userError)
      return NextResponse.json(
        { success: false, error: 'Failed to verify user permissions' },
        { status: 500 }
      )
    }

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }
    const body = await request.json()
    const {
      academicYear,
      term,
      sequenceNumber,
      sequenceName,
      startDate,
      endDate,
      maxMarks = 20,
      isActive = true
    } = body

    if (!academicYear || !term || !sequenceNumber || !sequenceName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: academicYear, term, sequenceNumber, sequenceName' },
        { status: 400 }
      )
    }

    // Upsert sequence (using global numbering: unique constraint is academic_year,sequence_number)
    const { data: sequence, error } = await supabase
      .from('academic_sequences')
      .upsert({
        academic_year: academicYear,
        term: term,
        sequence_number: sequenceNumber,
        sequence_name: sequenceName,
        start_date: startDate || null,
        end_date: endDate || null,
        max_marks: maxMarks,
        is_active: isActive,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'academic_year,sequence_number'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating sequence:', error)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(error) },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sequence
    })

  } catch (error: any) {
    console.error('Error in POST /api/sequences:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
