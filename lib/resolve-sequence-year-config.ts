import {
  DEFAULT_TERM_COUNTS,
  DEFAULT_TOTAL_SEQUENCES,
  deriveTermCountsFromSequences,
  isValidTotalSequences,
  normalizeTermCounts,
  TERM_KEYS,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'

export type SequenceConfigRow = {
  term_sequence_counts?: unknown
  total_sequences?: number | null
} | null

export type ActiveSequenceRow = {
  term: string
  sequence_number: number
  is_active?: boolean
}

export function hasPersistedTermCounts(config: SequenceConfigRow): boolean {
  return (
    config?.term_sequence_counts != null &&
    typeof config.term_sequence_counts === 'object' &&
    !Array.isArray(config.term_sequence_counts)
  )
}

export function parseTermCountsFromConfigRow(config: SequenceConfigRow): {
  totalSequences: number
  termSequenceCounts: TermSequenceCounts
} {
  if (hasPersistedTermCounts(config)) {
    const raw = config!.term_sequence_counts as Record<string, number>
    const total =
      config!.total_sequences && isValidTotalSequences(config!.total_sequences)
        ? config!.total_sequences
        : TERM_KEYS.reduce((s, k) => s + (Number(raw[k]) || 0), 0) || DEFAULT_TOTAL_SEQUENCES
    return {
      totalSequences: isValidTotalSequences(total) ? total : DEFAULT_TOTAL_SEQUENCES,
      termSequenceCounts: normalizeTermCounts(raw, total),
    }
  }
  return {
    totalSequences: DEFAULT_TOTAL_SEQUENCES,
    termSequenceCounts: { ...DEFAULT_TERM_COUNTS },
  }
}

/**
 * Resolves total sequences and per-term counts for an academic year.
 * Prefers saved sequence_configurations; falls back to active academic_sequences (legacy).
 */
export function resolveSequenceYearConfig(
  config: SequenceConfigRow,
  activeSequences: ActiveSequenceRow[]
): { totalSequences: number; termSequenceCounts: TermSequenceCounts } {
  if (hasPersistedTermCounts(config)) {
    return parseTermCountsFromConfigRow(config)
  }

  if (activeSequences.length > 0) {
    const derived = deriveTermCountsFromSequences(activeSequences)
    if (derived.totalSequences > 0) {
      const total = isValidTotalSequences(derived.totalSequences)
        ? derived.totalSequences
        : DEFAULT_TOTAL_SEQUENCES
      return {
        totalSequences: total,
        termSequenceCounts: normalizeTermCounts(derived.termSequenceCounts, total),
      }
    }
  }

  return {
    totalSequences: DEFAULT_TOTAL_SEQUENCES,
    termSequenceCounts: { ...DEFAULT_TERM_COUNTS },
  }
}
