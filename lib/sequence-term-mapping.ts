/**
 * Academic sequence layout: total per year (5 or 6) distributed across Term 1–3.
 * Global sequence numbers 1..N are assigned in term order.
 */

export const TERM_KEYS = ['Term 1', 'Term 2', 'Term 3'] as const
export type TermKey = (typeof TERM_KEYS)[number]

export type TermSequenceCounts = Record<TermKey, number>

export const DEFAULT_TOTAL_SEQUENCES = 6
export const DEFAULT_TERM_COUNTS: TermSequenceCounts = {
  'Term 1': 2,
  'Term 2': 2,
  'Term 3': 2,
}

export const PRESET_5_TERM_COUNTS: TermSequenceCounts = {
  'Term 1': 2,
  'Term 2': 2,
  'Term 3': 1,
}

export interface SequenceAssignment {
  sequenceNumber: number
  term: TermKey
}

export interface GlobalSequenceSlot {
  globalNumber: number
  term: TermKey
  inTermPosition: number
  sequenceName: string
}

export function isValidTotalSequences(total: number): total is 5 | 6 {
  return total === 5 || total === 6
}

/** Active global sequence slots for report cards (1..5 or 1..6). */
export function getActiveGlobalSequenceCount(totalSequences: number): 5 | 6 {
  return isValidTotalSequences(totalSequences) ? totalSequences : DEFAULT_TOTAL_SEQUENCES
}

/** @alias PRESET_5_TERM_COUNTS */
export const PRESET_5_SEQ = PRESET_5_TERM_COUNTS

export function normalizeTermCounts(
  counts: Partial<Record<string, number>> | null | undefined,
  total: number
): TermSequenceCounts {
  const normalized: TermSequenceCounts = { ...DEFAULT_TERM_COUNTS }
  for (const key of TERM_KEYS) {
    const v = counts?.[key]
    normalized[key] = typeof v === 'number' && v >= 0 ? Math.floor(v) : 0
  }
  const sum = TERM_KEYS.reduce((s, k) => s + normalized[k], 0)
  if (sum !== total) {
    return total === 5 ? { ...PRESET_5_TERM_COUNTS } : { ...DEFAULT_TERM_COUNTS }
  }
  return normalized
}

export function validateSequenceConfig(
  totalSequences: number,
  termSequenceCounts: TermSequenceCounts
): { valid: true } | { valid: false; error: string } {
  if (!isValidTotalSequences(totalSequences)) {
    return { valid: false, error: 'Total sequences must be 5 or 6' }
  }
  for (const key of TERM_KEYS) {
    const n = termSequenceCounts[key]
    if (typeof n !== 'number' || n < 0 || n > totalSequences) {
      return { valid: false, error: `Invalid count for ${key}` }
    }
  }
  const sum = TERM_KEYS.reduce((s, k) => s + termSequenceCounts[k], 0)
  if (sum !== totalSequences) {
    return {
      valid: false,
      error: `Term counts must sum to ${totalSequences} (currently ${sum})`,
    }
  }
  return { valid: true }
}

export function getSequenceDisplayName(globalNumber: number): string {
  const suffix =
    globalNumber === 1 ? 'st' : globalNumber === 2 ? 'nd' : globalNumber === 3 ? 'rd' : 'th'
  return `${globalNumber}${suffix} Sequence`
}

export function termCountsToAssignments(
  totalSequences: number,
  termSequenceCounts: TermSequenceCounts
): SequenceAssignment[] {
  const validation = validateSequenceConfig(totalSequences, termSequenceCounts)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const assignments: SequenceAssignment[] = []
  let global = 1
  for (const term of TERM_KEYS) {
    const count = termSequenceCounts[term]
    for (let inTerm = 1; inTerm <= count; inTerm++) {
      assignments.push({ sequenceNumber: global, term })
      global++
    }
  }
  return assignments
}

export function assignmentsToTermCounts(
  assignments: SequenceAssignment[]
): { totalSequences: number; termSequenceCounts: TermSequenceCounts } {
  const termSequenceCounts: TermSequenceCounts = {
    'Term 1': 0,
    'Term 2': 0,
    'Term 3': 0,
  }
  for (const a of assignments) {
    if (TERM_KEYS.includes(a.term as TermKey)) {
      termSequenceCounts[a.term as TermKey]++
    }
  }
  const totalSequences = assignments.length
  return { totalSequences, termSequenceCounts }
}

export function deriveTermCountsFromSequences(
  sequences: Array<{ term: string; sequence_number: number; is_active?: boolean }>
): { totalSequences: number; termSequenceCounts: TermSequenceCounts } {
  const active = sequences.filter((s) => s.is_active !== false)
  const termSequenceCounts: TermSequenceCounts = {
    'Term 1': 0,
    'Term 2': 0,
    'Term 3': 0,
  }
  for (const seq of active) {
    const t = seq.term as TermKey
    if (TERM_KEYS.includes(t)) {
      termSequenceCounts[t]++
    }
  }
  const totalSequences = active.length
  return { totalSequences, termSequenceCounts }
}

export function buildGlobalSlotMap(
  totalSequences: number,
  termSequenceCounts: TermSequenceCounts
): GlobalSequenceSlot[] {
  const validation = validateSequenceConfig(totalSequences, termSequenceCounts)
  if (!validation.valid) {
    return []
  }
  const assignments = termCountsToAssignments(totalSequences, termSequenceCounts)
  const countsByTerm: Record<TermKey, number> = { 'Term 1': 0, 'Term 2': 0, 'Term 3': 0 }

  return assignments.map((a) => {
    countsByTerm[a.term]++
    return {
      globalNumber: a.sequenceNumber,
      term: a.term,
      inTermPosition: countsByTerm[a.term],
      sequenceName: getSequenceDisplayName(a.sequenceNumber),
    }
  })
}

export function getTermNumber(termStr: string): 1 | 2 | 3 {
  const lower = termStr.toLowerCase()
  if (lower.includes('first') || lower.includes('1st') || lower === '1' || lower === 'term 1')
    return 1
  if (lower.includes('second') || lower.includes('2nd') || lower === '2' || lower === 'term 2')
    return 2
  if (lower.includes('third') || lower.includes('3rd') || lower === '3' || lower === 'term 3')
    return 3
  return 1
}

export function getTermKey(termNumber: 1 | 2 | 3): TermKey {
  return `Term ${termNumber}` as TermKey
}

/** Cumulative global offset before this term (1-based term number). */
function termStartOffset(termNumber: 1 | 2 | 3, counts: TermSequenceCounts): number {
  if (termNumber === 1) return 0
  if (termNumber === 2) return counts['Term 1']
  return counts['Term 1'] + counts['Term 2']
}

export function mapInTermToGlobal(
  inTermSeq: number,
  termNumber: 1 | 2 | 3,
  counts: TermSequenceCounts
): number {
  return termStartOffset(termNumber, counts) + inTermSeq
}

export function globalToTerm(
  globalSeq: number,
  counts: TermSequenceCounts
): { termNumber: 1 | 2 | 3; inTermPosition: number } | null {
  let cursor = 0
  for (let t = 1; t <= 3; t++) {
    const termKey = getTermKey(t as 1 | 2 | 3)
    const n = counts[termKey]
    if (globalSeq > cursor && globalSeq <= cursor + n) {
      return { termNumber: t as 1 | 2 | 3, inTermPosition: globalSeq - cursor }
    }
    cursor += n
  }
  return null
}

export function getGlobalSlotsForTerm(
  termNumber: 1 | 2 | 3,
  counts: TermSequenceCounts
): number[] {
  const termKey = getTermKey(termNumber)
  const n = counts[termKey]
  const start = termStartOffset(termNumber, counts) + 1
  return Array.from({ length: n }, (_, i) => start + i)
}

/** Mean of defined sequence marks for a term (1 or 2+ slots). */
export function averageSequenceMarks(marks: (number | undefined)[]): number {
  const defined = marks.filter((m): m is number => typeof m === 'number' && !Number.isNaN(m))
  if (defined.length === 0) return 0
  return defined.reduce((sum, m) => sum + m, 0) / defined.length
}

export type TermAverages = {
  term1?: number
  term2?: number
  term3?: number
}

/** Sequence marks keyed by global slot (seq1..seq6) or nested `sequences`. */
export type SubjectSequenceMarksInput = {
  sequences?: Partial<Record<`seq${number}`, number>>
  seq1?: number
  seq2?: number
  seq3?: number
  seq4?: number
  seq5?: number
  seq6?: number
}

export function readGlobalSeqMark(
  subject: SubjectSequenceMarksInput,
  globalNum: number
): number | undefined {
  const key = `seq${globalNum}` as keyof NonNullable<SubjectSequenceMarksInput['sequences']>
  const fromNested = subject.sequences?.[key]
  if (fromNested !== undefined) return fromNested
  const flat = subject[key as keyof SubjectSequenceMarksInput]
  return typeof flat === 'number' ? flat : undefined
}

/** Per-term averages from populated sequence slots in each term (partial slots allowed). */
export function getTermAveragesFromSequenceMarks(
  sequenceMarks: Record<string, number | undefined> | SubjectSequenceMarksInput,
  counts: TermSequenceCounts
): TermAverages {
  const read = (globalNum: number) => {
    if ('sequences' in sequenceMarks || 'seq1' in sequenceMarks) {
      return readGlobalSeqMark(sequenceMarks as SubjectSequenceMarksInput, globalNum)
    }
    return sequenceMarks[`seq${globalNum}`]
  }

  const result: TermAverages = {}
  for (let termNumber = 1; termNumber <= 3; termNumber++) {
    const slots = getGlobalSlotsForTerm(termNumber as 1 | 2 | 3, counts)
    if (slots.length === 0) continue
    const marks = slots.map((slot) => read(slot))
    const populatedMarks = marks.filter(
      (m): m is number => typeof m === 'number' && !Number.isNaN(m)
    )
    if (populatedMarks.length > 0) {
      const avg = averageSequenceMarks(populatedMarks)
      if (termNumber === 1) result.term1 = parseFloat(avg.toFixed(2))
      else if (termNumber === 2) result.term2 = parseFloat(avg.toFixed(2))
      else result.term3 = parseFloat(avg.toFixed(2))
    }
  }
  return result
}

/** Annual subject average = mean of term1, term2, term3 when all three are defined. */
export function getAnnualAverageFromTermAverages(termAvgs: TermAverages): number | undefined {
  const { term1, term2, term3 } = termAvgs
  if (
    typeof term1 !== 'number' ||
    typeof term2 !== 'number' ||
    typeof term3 !== 'number'
  ) {
    return undefined
  }
  return parseFloat(averageSequenceMarks([term1, term2, term3]).toFixed(2))
}

/** Coefficient counts only when every slot in each term has a mark. */
export function isAnnualCoefEligible(
  sequenceMarks: Record<string, number | undefined>,
  counts: TermSequenceCounts
): boolean {
  for (let termNumber = 1; termNumber <= 3; termNumber++) {
    if (!isTermCoefEligible(sequenceMarks, termNumber as 1 | 2 | 3, counts)) {
      return false
    }
  }
  return true
}

/** Coefficient counts when every configured slot in one term has a mark. */
export function isTermCoefEligible(
  sequenceMarks: Record<string, number | undefined>,
  termNumber: 1 | 2 | 3,
  counts: TermSequenceCounts
): boolean {
  const slots = getGlobalSlotsForTerm(termNumber, counts)
  if (slots.length === 0) return false
  return slots.every((slot) => typeof sequenceMarks[`seq${slot}`] === 'number')
}

/** Mean of completed term averages (partial year when not all three terms exist). */
export function getPartialAnnualAverageFromTermAverages(
  termAvgs: TermAverages
): number | undefined {
  const partial: number[] = []
  if (typeof termAvgs.term1 === 'number') partial.push(termAvgs.term1)
  if (typeof termAvgs.term2 === 'number') partial.push(termAvgs.term2)
  if (typeof termAvgs.term3 === 'number') partial.push(termAvgs.term3)
  if (partial.length === 0) return undefined
  return parseFloat(averageSequenceMarks(partial).toFixed(2))
}

export function adjustTermCountsForTotal(
  counts: TermSequenceCounts,
  newTotal: 5 | 6
): TermSequenceCounts {
  const current = { ...counts }
  let sum = TERM_KEYS.reduce((s, k) => s + current[k], 0)
  while (sum > newTotal) {
    if (current['Term 3'] > 0) current['Term 3']--
    else if (current['Term 2'] > 0) current['Term 2']--
    else if (current['Term 1'] > 0) current['Term 1']--
    else break
    sum--
  }
  while (sum < newTotal) {
    current['Term 3']++
    sum++
  }
  return current
}
