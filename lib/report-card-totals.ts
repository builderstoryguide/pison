import { isAnnualCoefEligible, type TermSequenceCounts } from '@/lib/sequence-term-mapping'
import type { SequenceMarks } from '@/lib/report-card-subject-marks'

export const RANK_EPSILON = 1e-6

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

export function isSubjectCoefEligibleForTerm(
  sequenceMarks: SequenceMarks,
  termNum: 1 | 2 | 3,
  termSequenceCounts: TermSequenceCounts
): boolean {
  const slots = termSequenceCounts
  const termKey = termNum === 1 ? 'Term 1' : termNum === 2 ? 'Term 2' : 'Term 3'
  const count = slots[termKey]
  let start = 1
  if (termNum === 2) start = slots['Term 1'] + 1
  if (termNum === 3) start = slots['Term 1'] + slots['Term 2'] + 1

  for (let i = 0; i < count; i++) {
    const slot = start + i
    if (sequenceMarks[`seq${slot}`] === undefined) return false
  }
  return true
}

export function isSubjectCoefEligibleForAnnual(
  sequenceMarks: SequenceMarks,
  termSequenceCounts: TermSequenceCounts
): boolean {
  return isAnnualCoefEligible(sequenceMarks, termSequenceCounts)
}
