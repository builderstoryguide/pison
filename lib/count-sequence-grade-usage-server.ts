import type { SupabaseClient } from '@supabase/supabase-js'
import { getSequenceDisplayName } from '@/lib/sequence-term-mapping'
import { getSequenceName } from '@/lib/report-card-utils'

export type SequenceGradeUsage = {
  gradeCount: number
  assessmentCount: number
}

/** Assessment titles / IDs that identify a global sequence number in grade data */
function titlesForGlobalSequence(sequenceNumber: number, sequenceId?: string): string[] {
  const titles = [getSequenceDisplayName(sequenceNumber), getSequenceName(sequenceNumber)]
  if (sequenceId) titles.push(sequenceId)
  return [...new Set(titles)]
}

/**
 * Count assessments and grade rows linked to a global sequence (e.g. 6) for an academic year.
 * Matches sequence_id on assessments when present, plus known title patterns and sequence UUID as title.
 */
export async function getSequenceGradeUsage(
  supabase: SupabaseClient,
  academicYear: string,
  sequenceNumber: number
): Promise<SequenceGradeUsage> {
  const { data: seqRow, error: seqRowError } = await supabase
    .from('academic_sequences')
    .select('id')
    .eq('academic_year', academicYear)
    .eq('sequence_number', sequenceNumber)
    .maybeSingle()

  if (seqRowError) {
    console.error('getSequenceGradeUsage academic_sequences lookup error:', seqRowError)
  }

  const assessmentIds = new Set<string>()
  const titles = titlesForGlobalSequence(sequenceNumber, seqRow?.id)

  if (seqRow?.id) {
    const { data: bySequenceId, error: seqIdError } = await supabase
      .from('assessments')
      .select('id')
      .eq('sequence_id', seqRow.id)

    if (seqIdError) {
      console.error('getSequenceGradeUsage assessments by sequence_id error:', seqIdError)
    } else if (bySequenceId) {
      bySequenceId.forEach((row) => assessmentIds.add(row.id))
    }
  }

  for (const title of titles) {
    const { data: exact, error: exactError } = await supabase
      .from('assessments')
      .select('id')
      .eq('title', title)

    if (exactError) {
      console.error('getSequenceGradeUsage assessments exact title error:', exactError, { title })
    } else {
      exact?.forEach((row) => assessmentIds.add(row.id))
    }

    const { data: fuzzy, error: fuzzyError } = await supabase
      .from('assessments')
      .select('id')
      .ilike('title', `%${title}%`)

    if (fuzzyError) {
      console.error('getSequenceGradeUsage assessments fuzzy title error:', fuzzyError, { title })
    } else {
      fuzzy?.forEach((row) => assessmentIds.add(row.id))
    }
  }

  const ids = [...assessmentIds]
  if (ids.length === 0) {
    return { gradeCount: 0, assessmentCount: 0 }
  }

  const { count, error: gradeError } = await supabase
    .from('grades')
    .select('id', { count: 'exact', head: true })
    .in('assessment_id', ids)

  if (gradeError) {
    console.error('getSequenceGradeUsage grade count error:', gradeError)
    return { gradeCount: 0, assessmentCount: ids.length }
  }

  return {
    gradeCount: count ?? 0,
    assessmentCount: ids.length,
  }
}
