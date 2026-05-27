import {
  isAnnualCoefEligible,
  isTermCoefEligible,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'
import type { SequenceMarks } from '@/lib/report-card-subject-marks'

export const RANK_EPSILON = 1e-6

export { isTermCoefEligible, isAnnualCoefEligible as isSubjectCoefEligibleForAnnual }

export function computeWeightedTotal(
  items: { eval: number; coef: number; coefEligible?: boolean }[]
): { totalScore: number; totalCoef: number; average: number } {
  let totalScore = 0
  let totalCoef = 0

  for (const item of items) {
    if (item.coefEligible === false) continue
    const coef = item.coef
    if (coef <= 0) continue
    totalScore += item.eval * coef
    totalCoef += coef
  }

  const average = totalCoef > 0 ? totalScore / totalCoef : 0
  return { totalScore, totalCoef, average }
}

/** @deprecated Use isTermCoefEligible from sequence-term-mapping */
export function isSubjectCoefEligibleForTerm(
  sequenceMarks: SequenceMarks,
  termNum: 1 | 2 | 3,
  termSequenceCounts: TermSequenceCounts
): boolean {
  return isTermCoefEligible(sequenceMarks, termNum, termSequenceCounts)
}

export interface WeightedHistoryItem {
  term1?: number
  term2?: number
  term3?: number
  plannedCoef?: number
  coef?: number | string
  term1CoefEligible?: boolean
  term2CoefEligible?: boolean
  term3CoefEligible?: boolean
}

export function nominalReportCoef(item: {
  plannedCoef?: number
  coef?: number | string
}): number {
  if (typeof item.plannedCoef === 'number' && item.plannedCoef > 0) {
    return item.plannedCoef
  }
  if (typeof item.coef === 'number' && !Number.isNaN(item.coef) && item.coef > 0) {
    return item.coef
  }
  return 0
}

export function computeWeightedTermHistory(
  items: WeightedHistoryItem[],
  field: 'term1' | 'term2' | 'term3'
): number {
  const eligibleKey =
    field === 'term1'
      ? 'term1CoefEligible'
      : field === 'term2'
        ? 'term2CoefEligible'
        : 'term3CoefEligible'

  let points = 0
  let coef = 0

  for (const item of items) {
    const termVal = item[field]
    if (typeof termVal !== 'number') continue
    if (item[eligibleKey] === false) continue
    const subjectCoef = nominalReportCoef(item)
    if (subjectCoef <= 0) continue
    points += termVal * subjectCoef
    coef += subjectCoef
  }

  return coef > 0 ? parseFloat((points / coef).toFixed(2)) : 0
}

export interface PartialAnnualSummaryItem {
  eval?: number | string
  total?: number | string
  plannedCoef?: number
  coef?: number | string
  partialAnnualEligible?: boolean
}

export function accumulatePartialAnnualSection(
  item: PartialAnnualSummaryItem
): { coef: number; total: number } | null {
  if (!item.partialAnnualEligible) return null
  if (typeof item.eval !== 'number') return null
  const subjectCoef = nominalReportCoef(item)
  if (subjectCoef <= 0) return null
  const total =
    typeof item.total === 'number'
      ? item.total
      : parseFloat((item.eval * subjectCoef).toFixed(2))
  return { coef: subjectCoef, total }
}
