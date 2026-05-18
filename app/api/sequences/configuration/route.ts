import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getSequenceGradeUsage } from '@/lib/count-sequence-grade-usage-server'
import { serializeSupabaseError } from '@/lib/safe-error'
import { requireRole } from '@/lib/auth/server'
import {
  type TermSequenceCounts,
  type SequenceAssignment,
  DEFAULT_TERM_COUNTS,
  DEFAULT_TOTAL_SEQUENCES,
  getSequenceDisplayName,
  normalizeTermCounts,
  termCountsToAssignments,
  assignmentsToTermCounts,
  validateSequenceConfig,
  isValidTotalSequences,
} from '@/lib/sequence-term-mapping'
import { resolveSequenceYearConfig } from '@/lib/resolve-sequence-year-config'

export const runtime = 'nodejs'

function groupByTerm<T extends { term: string | null }>(sequences: T[]): Record<string, T[]> {
  const sequencesByTerm: Record<string, T[]> = {}
  sequences?.forEach((seq) => {
    const termKey = seq.term || 'Unassigned'
    if (!sequencesByTerm[termKey]) {
      sequencesByTerm[termKey] = []
    }
    sequencesByTerm[termKey].push(seq)
  })
  return sequencesByTerm
}

/**
 * GET /api/sequences/configuration?academicYear=
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

    const { data: config, error: configError } = await supabase
      .from('sequence_configurations')
      .select('*')
      .eq('academic_year', academicYear)
      .maybeSingle()

    if (configError) {
      console.error('Error fetching sequence configuration:', configError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(configError) },
        { status: 500 }
      )
    }

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

    const activeSequences = sequences || []
    const { totalSequences, termSequenceCounts } = resolveSequenceYearConfig(
      config,
      activeSequences
    )

    const service = createServiceClient()
    const sequence6Usage = await getSequenceGradeUsage(service, academicYear, 6)

    return NextResponse.json({
      success: true,
      configuration: config || null,
      totalSequences,
      termSequenceCounts,
      sequences: activeSequences,
      sequencesByTerm: groupByTerm(activeSequences),
      academicYear,
      sequence6Usage,
    })
  } catch (error: unknown) {
    console.error('Error in GET /api/sequences/configuration:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/sequences/configuration
 * Body: { academicYear, totalSequences?, termSequenceCounts?, numberOfSequences?, sequenceAssignments?, defaultMaxMarks?, useFixedSequences? }
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    const supabase = createServiceClient()

    const body = await request.json()
    const {
      academicYear,
      totalSequences: totalSequencesBody,
      termSequenceCounts: termCountsBody,
      numberOfSequences,
      defaultMaxMarks = 20,
      useFixedSequences = true,
      sequenceAssignments,
    } = body

    let totalSequences: number =
      totalSequencesBody ?? numberOfSequences ?? DEFAULT_TOTAL_SEQUENCES

    if (!academicYear || !isValidTotalSequences(totalSequences)) {
      return NextResponse.json(
        { success: false, error: 'academicYear and totalSequences (5 or 6) are required' },
        { status: 400 }
      )
    }

    let termSequenceCounts: TermSequenceCounts
    let assignments: SequenceAssignment[]

    if (termCountsBody && typeof termCountsBody === 'object') {
      termSequenceCounts = normalizeTermCounts(termCountsBody, totalSequences)
      const validation = validateSequenceConfig(totalSequences, termSequenceCounts)
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
      }
      assignments = termCountsToAssignments(totalSequences, termSequenceCounts)
    } else if (sequenceAssignments && Array.isArray(sequenceAssignments)) {
      assignments = sequenceAssignments
      const derived = assignmentsToTermCounts(assignments)
      termSequenceCounts = derived.termSequenceCounts
      totalSequences = derived.totalSequences
      if (!isValidTotalSequences(totalSequences)) {
        return NextResponse.json(
          { success: false, error: 'Legacy assignments must sum to 5 or 6 sequences' },
          { status: 400 }
        )
      }
    } else {
      termSequenceCounts = normalizeTermCounts(
        totalSequences === 5
          ? { 'Term 1': 2, 'Term 2': 2, 'Term 3': 1 }
          : DEFAULT_TERM_COUNTS,
        totalSequences
      )
      assignments = termCountsToAssignments(totalSequences, termSequenceCounts)
    }

    const assignedNumbers = assignments.map((a) => a.sequenceNumber).sort((a, b) => a - b)
    const expectedNumbers = Array.from({ length: totalSequences }, (_, i) => i + 1)
    if (JSON.stringify(assignedNumbers) !== JSON.stringify(expectedNumbers)) {
      return NextResponse.json(
        {
          success: false,
          error: `All sequences from 1 to ${totalSequences} must be assigned exactly once`,
        },
        { status: 400 }
      )
    }

    const configPayload: Record<string, unknown> = {
      academic_year: academicYear,
      term: null,
      use_fixed_sequences: useFixedSequences,
      default_max_marks: defaultMaxMarks,
      total_sequences: totalSequences,
      term_sequence_counts: termSequenceCounts,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    }

    const { data: config, error: configError } = await supabase
      .from('sequence_configurations')
      .upsert(configPayload, { onConflict: 'academic_year' })
      .select()
      .single()

    if (configError) {
      console.error('Error updating sequence configuration:', configError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(configError) },
        { status: 500 }
      )
    }

    const { data: existingSequences } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .order('sequence_number', { ascending: true })

    const sequencesToUpsert = assignments.map((assignment) => {
      const seqNum = assignment.sequenceNumber
      const existingSeq = existingSequences?.find((s) => s.sequence_number === seqNum)
      return {
        id: existingSeq?.id,
        academic_year: academicYear,
        term: assignment.term,
        sequence_number: seqNum,
        sequence_name: getSequenceDisplayName(seqNum),
        max_marks: defaultMaxMarks,
        is_active: true,
        updated_at: new Date().toISOString(),
      }
    })

    const { error: upsertError } = await supabase
      .from('academic_sequences')
      .upsert(sequencesToUpsert, { onConflict: 'academic_year,sequence_number' })

    if (upsertError) {
      console.error('Error upserting sequences:', upsertError)
      return NextResponse.json(
        { success: false, error: serializeSupabaseError(upsertError) },
        { status: 500 }
      )
    }

    const toDeactivate =
      existingSequences
        ?.filter((seq) => seq.sequence_number > totalSequences && seq.is_active)
        .map((seq) => seq.id) || []

    if (toDeactivate.length > 0) {
      const { error: deactivateError } = await supabase
        .from('academic_sequences')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', toDeactivate)

      if (deactivateError) {
        console.error('Error deactivating sequences:', deactivateError)
      }
    }

    const { data: updatedSequences } = await supabase
      .from('academic_sequences')
      .select('*')
      .eq('academic_year', academicYear)
      .eq('is_active', true)
      .order('sequence_number', { ascending: true })

    let sequence6UsageWarning: string | undefined
    let sequence6Usage: Awaited<ReturnType<typeof getSequenceGradeUsage>> | undefined
    if (totalSequences === 5) {
      sequence6Usage = await getSequenceGradeUsage(supabase, academicYear, 6)
      if (sequence6Usage.gradeCount > 0) {
        sequence6UsageWarning = `6th sequence is now inactive, but ${sequence6Usage.gradeCount} grade row(s) across ${sequence6Usage.assessmentCount} assessment(s) still reference it. Those marks remain in the database and may still appear on some reports until removed or migrated.`
      }
    }

    return NextResponse.json({
      success: true,
      configuration: config,
      totalSequences,
      termSequenceCounts,
      sequences: updatedSequences || [],
      sequencesByTerm: groupByTerm(updatedSequences || []),
      sequence6Usage,
      warning: sequence6UsageWarning,
      message: sequence6UsageWarning
        ? `Sequence configuration saved for ${academicYear}. ${sequence6UsageWarning}`
        : `Sequence configuration updated: ${totalSequences} sequences for ${academicYear}.`,
    })
  } catch (error: unknown) {
    console.error('Error in PUT /api/sequences/configuration:', error)
    return NextResponse.json(
      { success: false, error: serializeSupabaseError(error) },
      { status: 500 }
    )
  }
}
