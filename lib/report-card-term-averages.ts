import {
  getTermAveragesFromSequenceMarks,
  getAnnualAverageFromTermAverages,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'
import type { SubjectGrade } from '@/components/admin/reports/report-card-types'

export function formatReportMark(value: number | undefined): string {
  return typeof value === 'number' && !Number.isNaN(value) ? value.toFixed(2) : '-'
}

export function getSubjectTermAvg(
  subject: SubjectGrade,
  term: 1 | 2 | 3,
  termCounts: TermSequenceCounts
): number | undefined {
  const key = term === 1 ? 'term1' : term === 2 ? 'term2' : 'term3'
  if (subject.termAverages?.[key] !== undefined) return subject.termAverages[key]
  if (subject[key] !== undefined) return subject[key]
  return getTermAveragesFromSequenceMarks(subject, termCounts)[key]
}

export function getSubjectAnnualAvg(
  subject: SubjectGrade,
  termCounts: TermSequenceCounts
): number | undefined {
  if (typeof subject.annualAverage === 'number' && !Number.isNaN(subject.annualAverage)) {
    return subject.annualAverage
  }
  if (typeof subject.termAverage === 'number' && !Number.isNaN(subject.termAverage)) {
    return subject.termAverage
  }
  const termAvgs = getTermAveragesFromSequenceMarks(subject, termCounts)
  return getAnnualAverageFromTermAverages(termAvgs)
}

export function subjectHasYearSummaryMark(subject: SubjectGrade): boolean {
  if (subject.hasMark === true) return true
  if (subject.hasMark === false) return false
  return typeof subject.annualAverage === 'number' && !Number.isNaN(subject.annualAverage)
}

export function subjectCoefEligibleForYearSummary(subject: SubjectGrade): boolean {
  if (subject.coefEligible === true) return true
  if (subject.coefEligible === false) return false
  return subject.coefficient > 0
}
