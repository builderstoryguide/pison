import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { serializeSupabaseError } from '@/lib/safe-error'
import { requireRole } from '@/lib/auth/server'

export const runtime = 'nodejs'

interface SequenceAssignment {
  sequenceNumber: number
  term: string
}

/**
 * GET /api/sequences/configuration
 * Fetch sequence configuration for an academic year
 * Query params: academicYear
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const academicYear = searchParams.get('academicYear')

    if (!academicYear) {
      return NextResponse.json(
        { success: false, error: 'academicYear is required' },
        { status: 400 }
      )
    }

    // Get sequence configuration (per academic year, not per term)
    const { data: config, error: configError } = await supabase
      .from('sequence_configurations')
      .select('*')
      .eq('academic_year', academicYear)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching sequence configuration:', configError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(configError) },
        { status: 500 }
      )
    }

    // Get all sequences for this academic year
    const { data: sequences, error: sequencesError } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .order('sequence_number', { ascending: true })

    if (sequencesError) {
      console.error('Error fetching sequences:', sequencesError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(sequencesError) },
        { status: 500 }
      )
    }

    // Group sequences by term
    const sequencesByTerm: Record<string, typeof sequences> = {}

    sequences?.forEach(seq => {
      const termKey = seq.term || 'Unassigned'
      if (!sequencesByTerm[termKey]) {
        sequencesByTerm[termKey] = []
      }
      sequencesByTerm[termKey].push(seq)
    })
    return NextResponse.json({
      success: true,
      configuration: config || null,
      sequences: sequences || [],
      sequencesByTerm,
      academicYear
    })

  } catch (error: any) {
    console.error('Error in GET /api/sequences/configuration:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sequences/configuration
 * Update sequence configuration for an academic year (admin only)
 * Body: { academicYear, numberOfSequences, defaultMaxMarks?, useFixedSequences?, sequenceAssignments? }
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication and admin role using requireRole
    const user = await requireRole(request, 'admin')
    
    // Use service client to bypass RLS (we've already validated admin access)
    const supabase = createServiceClient()

    const body = await request.json()
    const {
      academicYear,
      numberOfSequences,
      defaultMaxMarks = 20,
      useFixedSequences = true,
      sequenceAssignments
    } = body

    if (!academicYear || !numberOfSequences || numberOfSequences < 1 || numberOfSequences > 6) {
      return NextResponse.json(
        { success: false, error: 'academicYear and numberOfSequences (1-6) are required' },
        { status: 400 }
      )
    }

    // Upsert sequence configuration (per academic year)
    // Note: The unique constraint should be on academic_year only after migration
    const { data: config, error: configError } = await supabase
      .from('sequence_configurations')
      .upsert({
        academic_year: academicYear,
        term: null, // Config is per year, not per term
        use_fixed_sequences: useFixedSequences,
        default_max_marks: defaultMaxMarks,
        created_by: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'academic_year'
      })
      .select()
      .single()

    if (configError) {
      console.error('Error updating sequence configuration:', configError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(configError) },
        { status: 500 }
      )
    }

    // Get existing sequences for this academic year
    const { data: existingSequences } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .order('sequence_number', { ascending: true })

    const existingCount = existingSequences?.filter(s => s.is_active).length || 0

    // Determine sequence assignments
    let assignments: SequenceAssignment[] = []
    
    if (sequenceAssignments && Array.isArray(sequenceAssignments)) {
      // Use provided assignments
      assignments = sequenceAssignments
    } else {
      // Auto-distribute: Term 1: 1-2, Term 2: 3-4, Term 3: 5-6
      for (let i = 1; i <= numberOfSequences; i++) {
        let term = 'Term 1'
        if (i > 4) {
          term = 'Term 3'
        } else if (i > 2) {
          term = 'Term 2'
        }
        assignments.push({ sequenceNumber: i, term })
      }
    }

    // Validate assignments: all sequences 1-N must be assigned exactly once
    const assignedNumbers = assignments.map(a => a.sequenceNumber).sort()
    const expectedNumbers = Array.from({ length: numberOfSequences }, (_, i) => i + 1)
    if (JSON.stringify(assignedNumbers) !== JSON.stringify(expectedNumbers)) {
      return NextResponse.json(
        { success: false, error: `All sequences from 1 to ${numberOfSequences} must be assigned exactly once` },
        { status: 400 }
      )
    }

    // Create or update sequences
    const sequencesToUpsert = assignments.map(assignment => {
      const seqNum = assignment.sequenceNumber
      const seqName = seqNum + (seqNum === 1 ? 'st' : seqNum === 2 ? 'nd' : seqNum === 3 ? 'rd' : 'th') + ' Sequence'
      
      // Find existing sequence to preserve ID
      const existingSeq = existingSequences?.find(s => s.sequence_number === seqNum)

      return {
        id: existingSeq?.id, // Includes ID if it exists, triggering an update instead of insert
        academic_year: academicYear,
        term: assignment.term,
        sequence_number: seqNum,
        sequence_name: seqName,
        max_marks: defaultMaxMarks,
        is_active: true,
        updated_at: new Date().toISOString()
      }
    })

    // Supabase accepts column names in onConflict parameter
    // We use id if available (update), otherwise insert
    const { data: upsertedSequences, error: upsertError } = await supabase
      .from('academic_sequences')
      .upsert(sequencesToUpsert, {
        onConflict: 'academic_year,sequence_number'
      })
      .select()

    if (upsertError) {
      console.error('Error upserting sequences:', upsertError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(upsertError) },
        { status: 500 }
      )
    }

    if (existingCount > numberOfSequences) {
      const sequencesToDeactivate = existingSequences
        ?.filter(seq => seq.sequence_number > numberOfSequences)
        .map(seq => seq.id) || []

      if (sequencesToDeactivate.length > 0) {
        const { error: deactivateError } = await supabase
          .from('academic_sequences')
          .update({ is_active: false })
          .in('id', sequencesToDeactivate)

        if (deactivateError) {
          console.error('Error deactivating sequences:', deactivateError)
          // Don't fail, just log
        }
      }
    }

    // Fetch updated sequences
    const { data: updatedSequences } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .order('sequence_number', { ascending: true })


    // Group by term
    const sequencesByTerm: Record<string, typeof updatedSequences> = {}

    updatedSequences?.forEach(seq => {
      const termKey = seq.term || 'Unassigned'
      if (!sequencesByTerm[termKey]) {
        sequencesByTerm[termKey] = []
      }
      sequencesByTerm[termKey].push(seq)
    })

    // Log successful save
    console.log('✅ Sequence configuration saved successfully:', {
      academicYear,
      numberOfSequences,
      sequencesCreated: updatedSequences?.length || 0,
      sequencesByTerm: Object.keys(sequencesByTerm),
      message: `Sequence configuration updated successfully. ${numberOfSequences} sequences configured.`
    })

    return NextResponse.json({
      success: true,
      configuration: config,
      sequences: updatedSequences || [],
      sequencesByTerm,
      message: `Sequence configuration updated successfully. ${numberOfSequences} sequences configured.`
    })

  } catch (error: any) {
    console.error('Error in PUT /api/sequences/configuration:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
