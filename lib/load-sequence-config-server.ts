import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveSequenceYearConfig } from '@/lib/resolve-sequence-year-config'
import { DEFAULT_TOTAL_SEQUENCES, type TermSequenceCounts } from '@/lib/sequence-term-mapping'

export type SequenceYearConfig = {
  totalSequences: 5 | 6
  termSequenceCounts: TermSequenceCounts
}

export async function loadSequenceYearConfig(
  supabase: SupabaseClient,
  academicYear: string
): Promise<SequenceYearConfig> {
  const { data: config } = await supabase
    .from('sequence_configurations')
    .select('total_sequences, term_sequence_counts')
    .eq('academic_year', academicYear)
    .maybeSingle()

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('term, sequence_number, is_active')
    .eq('academic_year', academicYear)
    .eq('is_active', true)

  const resolved = resolveSequenceYearConfig(config, sequences || [])
  const total =
    resolved.totalSequences === 5 || resolved.totalSequences === 6
      ? (resolved.totalSequences as 5 | 6)
      : DEFAULT_TOTAL_SEQUENCES

  return {
    totalSequences: total,
    termSequenceCounts: resolved.termSequenceCounts,
  }
}
