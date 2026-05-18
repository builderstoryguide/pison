import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DEFAULT_TERM_COUNTS,
  DEFAULT_TOTAL_SEQUENCES,
  deriveTermCountsFromSequences,
  normalizeTermCounts,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'

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

  if (config?.term_sequence_counts && typeof config.term_sequence_counts === 'object') {
    const raw = config.term_sequence_counts as Record<string, number>
    const total =
      config.total_sequences === 5 || config.total_sequences === 6
        ? config.total_sequences
        : DEFAULT_TOTAL_SEQUENCES
    return {
      totalSequences: total,
      termSequenceCounts: normalizeTermCounts(raw, total),
    }
  }

  const { data: sequences } = await supabase
    .from('academic_sequences')
    .select('term, sequence_number, is_active')
    .eq('academic_year', academicYear)
    .eq('is_active', true)

  if (sequences && sequences.length > 0) {
    const derived = deriveTermCountsFromSequences(sequences)
    const total =
      derived.totalSequences === 5 || derived.totalSequences === 6
        ? (derived.totalSequences as 5 | 6)
        : DEFAULT_TOTAL_SEQUENCES
    return {
      totalSequences: total,
      termSequenceCounts: normalizeTermCounts(derived.termSequenceCounts, total),
    }
  }

  return {
    totalSequences: DEFAULT_TOTAL_SEQUENCES,
    termSequenceCounts: { ...DEFAULT_TERM_COUNTS },
  }
}
