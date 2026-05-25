import { globalToTerm } from '@/lib/sequence-term-mapping'
import type { TermSequenceCounts } from '@/lib/sequence-term-mapping'
import {
  resolveGlobalSequenceFromTitle,
  getTermNumber,
} from '@/lib/report-card-assessment-resolution'

/** Returns true if assessment title maps to the requested term (1|2|3) or all terms when term is null. */
export function assessmentMatchesTermFilter(
  title: string | null | undefined,
  termFilter: string | null,
  sequenceIdToNumberMap: Map<string, number>,
  termSequenceCounts: TermSequenceCounts
): boolean {
  if (!termFilter) return true

  const lower = termFilter.toLowerCase()
  if (lower === 'annual' || lower.includes('annual')) return true

  const requestedTerm = getTermNumber(termFilter) as 1 | 2 | 3
  const globalSeq = resolveGlobalSequenceFromTitle(title, sequenceIdToNumberMap)
  if (globalSeq === null) return false

  const mapped = globalToTerm(globalSeq, termSequenceCounts)
  return mapped?.termNumber === requestedTerm
}
