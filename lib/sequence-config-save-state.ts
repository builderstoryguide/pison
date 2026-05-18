import {
  TERM_KEYS,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'
import type { SequenceConfigurationResponse } from '@/hooks/use-sequence-configuration'

export function sequenceConfigMatchesSaved(
  loaded: SequenceConfigurationResponse | undefined,
  totalSequences: 5 | 6,
  termSequenceCounts: TermSequenceCounts,
  defaultMaxMarks: number
): boolean {
  if (!loaded) return false

  if (!loaded.configuration) return false

  if (loaded.totalSequences !== totalSequences) return false

  const savedMax = loaded.configuration.default_max_marks
  if (typeof savedMax !== 'number' || savedMax !== defaultMaxMarks) return false

  for (const key of TERM_KEYS) {
    if ((loaded.termSequenceCounts?.[key] ?? 0) !== termSequenceCounts[key]) {
      return false
    }
  }

  return true
}
