import { getTermFromAssessment } from '@/lib/report-card-assessment-resolution'
import {
  buildSequenceMarksFromGrades,
  computeBranchSubjectMarks,
  type SequenceMarks,
} from '@/lib/report-card-subject-marks'
import { computeDenseRanks, computeSubjectDenseRanks } from '@/lib/report-card-ranking'
import { subjectNamesMatch, normalizeSubjectName } from '@/lib/report-card-subject-matching'
import {
  getTermAveragesFromSequenceMarks,
  getAnnualAverageFromTermAverages,
  getPartialAnnualAverageFromTermAverages,
  isAnnualCoefEligible,
  isTermCoefEligible,
  getGlobalSlotsForTerm,
  type TermSequenceCounts,
} from '@/lib/sequence-term-mapping'

/** Which average to use when ranking the class cohort. */
export type RankingScope = 'annual' | 'term1' | 'term2' | 'term3' | 'active_term'

export interface ClassRankingSubject {
  id: string
  name: string
  coefficient: number
  hasSubBranches?: boolean
}

export interface StudentGradeRow {
  marks_obtained: number
  title: string
  term?: string | null
  subject?: string | null
}

export interface StudentBranchGradeRow {
  marks_obtained: number
  branch_id: string
  title: string
  term?: string | null
}

export interface StudentRankingMetrics {
  studentId: string
  weightedAvg: number
  totalCoef: number
  totalPoints: number
  passedSubjects: number
  hasMarks: boolean
  /** Normalized subject name → display-scale eval used for ranking. */
  subjectEvals: Map<string, number>
}

export interface BuildCohortRankingOptions {
  studentIds: string[]
  subjects: ClassRankingSubject[]
  gradesByStudentId: Map<string, StudentGradeRow[]>
  branchGradesByStudentId: Map<string, StudentBranchGradeRow[]>
  branchIdsBySubjectId: Map<string, string[]>
  scope: RankingScope
  yearSummary: boolean
  activeTerm: 1 | 2 | 3 | null
  sequenceIdToNumberMap: Map<string, number>
  termSequenceCounts: TermSequenceCounts
  totalSequences: 5 | 6
  /** Mirrors report-card grade filter (annual = all terms). */
  gradeIncluded: (
    assessmentTerm: string | null | undefined,
    assessmentTitle: string | null | undefined,
    assessmentSubject: string | null | undefined
  ) => boolean
  gradeBelongsToTerm: (
    term: 1 | 2 | 3,
    assessmentTerm: string | null | undefined,
    assessmentTitle: string | null | undefined,
    assessmentSubject: string | null | undefined
  ) => boolean
  includeAllTermsGrades: boolean
  academicTermId: string
}

function round2(value: number): number {
  return parseFloat(value.toFixed(2))
}

function scopeMatchesGrade(
  scope: RankingScope,
  options: BuildCohortRankingOptions,
  assessmentTerm: string | null | undefined,
  assessmentTitle: string | null | undefined,
  assessmentSubject: string | null | undefined
): boolean {
  if (!options.gradeIncluded(assessmentTerm, assessmentTitle, assessmentSubject)) {
    return false
  }
  if (scope === 'annual' || scope === 'active_term') {
    return true
  }
  const termNum = scope === 'term1' ? 1 : scope === 'term2' ? 2 : 3
  return options.gradeBelongsToTerm(termNum, assessmentTerm, assessmentTitle, assessmentSubject)
}

function isPartialAnnualCoefEligible(
  sequenceMarks: SequenceMarks,
  termSequenceCounts: TermSequenceCounts
): boolean {
  return (
    isAnnualCoefEligible(sequenceMarks, termSequenceCounts) ||
    isTermCoefEligible(sequenceMarks, 1, termSequenceCounts) ||
    isTermCoefEligible(sequenceMarks, 2, termSequenceCounts) ||
    isTermCoefEligible(sequenceMarks, 3, termSequenceCounts)
  )
}

function isCoefEligibleForScope(
  scope: RankingScope,
  sequenceMarks: SequenceMarks,
  termSequenceCounts: TermSequenceCounts,
  yearSummary: boolean,
  activeTerm: 1 | 2 | 3 | null
): boolean {
  if (scope === 'annual' && yearSummary) {
    return isPartialAnnualCoefEligible(sequenceMarks, termSequenceCounts)
  }
  if (scope === 'term1' || scope === 'term2' || scope === 'term3') {
    const termNum = scope === 'term1' ? 1 : scope === 'term2' ? 2 : 3
    const slots = getGlobalSlotsForTerm(termNum, termSequenceCounts)
    return (
      slots.length > 0 &&
      slots.every((slot) => typeof sequenceMarks[`seq${slot}`] === 'number')
    )
  }
  if (scope === 'active_term' && yearSummary) {
    return isPartialAnnualCoefEligible(sequenceMarks, termSequenceCounts)
  }
  if (scope === 'active_term' && activeTerm !== null) {
    const slots = getGlobalSlotsForTerm(activeTerm, termSequenceCounts)
    return (
      slots.length > 0 &&
      slots.every((slot) => typeof sequenceMarks[`seq${slot}`] === 'number')
    )
  }
  return true
}

function subjectEvalFromSequenceMarks(
  scope: RankingScope,
  sequenceMarks: SequenceMarks,
  finalMark: number,
  termSequenceCounts: TermSequenceCounts,
  yearSummary: boolean,
  activeTerm: 1 | 2 | 3 | null
): number | undefined {
  if (scope === 'term1' || scope === 'term2' || scope === 'term3') {
    const termNum = scope === 'term1' ? 1 : scope === 'term2' ? 2 : 3
    const termAvgs = getTermAveragesFromSequenceMarks(sequenceMarks, termSequenceCounts)
    const field = termNum === 1 ? termAvgs.term1 : termNum === 2 ? termAvgs.term2 : termAvgs.term3
    return typeof field === 'number' ? round2(field) : undefined
  }

  if (scope === 'active_term' && activeTerm !== null && !yearSummary) {
    return round2(finalMark)
  }

  if (yearSummary) {
    const termAvgs = getTermAveragesFromSequenceMarks(sequenceMarks, termSequenceCounts)
    const annualAvg = getAnnualAverageFromTermAverages(termAvgs)
    if (annualAvg !== undefined) {
      return round2(annualAvg)
    }
    const partial: number[] = []
    if (typeof termAvgs.term1 === 'number') partial.push(termAvgs.term1)
    if (typeof termAvgs.term2 === 'number') partial.push(termAvgs.term2)
    if (typeof termAvgs.term3 === 'number') partial.push(termAvgs.term3)
    if (partial.length > 0) {
      return round2(partial.reduce((a, b) => a + b, 0) / partial.length)
    }
    return undefined
  }

  return round2(finalMark)
}

function computeSubjectEval(
  subject: ClassRankingSubject,
  grades: StudentGradeRow[],
  branchGrades: StudentBranchGradeRow[],
  branchIds: string[],
  options: BuildCohortRankingOptions
): { eval: number; coefEligible: boolean } | null {
  const { scope, yearSummary, activeTerm, sequenceIdToNumberMap, termSequenceCounts, totalSequences } =
    options

  const perTermNum =
    scope === 'term1'
      ? 1
      : scope === 'term2'
        ? 2
        : scope === 'term3'
          ? 3
          : scope === 'active_term'
            ? activeTerm
            : null

  const filteredGrades = grades.filter((g) => {
    const subj = g.subject || ''
    if (!subjectNamesMatch(subj, subject.name)) return false
    return scopeMatchesGrade(scope, options, g.term ?? null, g.title, subj)
  })

  const filteredBranch = branchGrades.filter((bg) => {
    if (!branchIds.includes(bg.branch_id)) return false
    return scopeMatchesGrade(scope, options, bg.term ?? null, bg.title, subject.name)
  })

  let sequenceMarks: SequenceMarks = {}
  let finalMark = 0
  let hasMark = false

  if (subject.hasSubBranches && branchIds.length > 0) {
    const useYearSummaryBranch =
      scope === 'annual' || (scope === 'active_term' && yearSummary && perTermNum === null)
    const branchResult = computeBranchSubjectMarks({
      branchGrades: filteredBranch.map((bg) => ({
        marks_obtained: bg.marks_obtained,
        branch_id: bg.branch_id,
        title: bg.title,
      })),
      branchIds,
      sequenceIdToNumberMap,
      termSequenceCounts,
      totalSequences,
      perTermNum: useYearSummaryBranch ? null : perTermNum,
      yearSummary: useYearSummaryBranch,
    })
    sequenceMarks = branchResult.sequenceMarks
    finalMark = branchResult.finalMark
    hasMark = branchResult.hasMark
  }

  if (!hasMark && filteredGrades.length > 0) {
    const useYearSummaryBuild =
      scope === 'annual' || (scope === 'active_term' && yearSummary && perTermNum === null)
    const built = buildSequenceMarksFromGrades({
      grades: filteredGrades.map((g) => ({
        marks_obtained: g.marks_obtained,
        title: g.title,
      })),
      sequenceIdToNumberMap,
      termSequenceCounts,
      totalSequences,
      perTermNum: useYearSummaryBuild ? null : perTermNum,
      yearSummary: useYearSummaryBuild,
    })
    sequenceMarks = built.sequenceMarks
    finalMark = built.finalMark
    hasMark = built.hasMark
  }

  if (
    !hasMark &&
    yearSummary &&
    (scope === 'annual' || (scope === 'active_term' && perTermNum === null))
  ) {
    const termAvgs = getTermAveragesFromSequenceMarks(sequenceMarks, termSequenceCounts)
    const partialAnnual = getPartialAnnualAverageFromTermAverages(termAvgs)
    if (partialAnnual !== undefined) {
      hasMark = true
      finalMark = partialAnnual
    }
  }

  if (!hasMark) return null

  const evalValue = subjectEvalFromSequenceMarks(
    scope,
    sequenceMarks,
    finalMark,
    termSequenceCounts,
    yearSummary,
    activeTerm
  )
  if (evalValue === undefined) return null

  const coefEligible = isCoefEligibleForScope(
    scope,
    sequenceMarks,
    termSequenceCounts,
    yearSummary,
    activeTerm
  )

  return { eval: evalValue, coefEligible }
}

/** Build per-student weighted averages using the same rules as the printed report card. */
export function buildCohortRankingMetrics(
  options: BuildCohortRankingOptions
): Map<string, StudentRankingMetrics> {
  const result = new Map<string, StudentRankingMetrics>()

  for (const studentId of options.studentIds) {
    const grades = options.gradesByStudentId.get(studentId) || []
    const branchGrades = options.branchGradesByStudentId.get(studentId) || []

    const subjectEvals = new Map<string, number>()
    let totalPoints = 0
    let totalCoef = 0
    let passedSubjects = 0

    for (const subject of options.subjects) {
      const normalized = normalizeSubjectName(subject.name)
      const branchIds = options.branchIdsBySubjectId.get(subject.id) || []
      const subjectResult = computeSubjectEval(subject, grades, branchGrades, branchIds, options)
      if (!subjectResult || !subjectResult.coefEligible) continue

      const coef = subject.coefficient > 0 ? subject.coefficient : 0
      if (coef <= 0) continue

      subjectEvals.set(normalized, subjectResult.eval)
      totalPoints += subjectResult.eval * coef
      totalCoef += coef
      if (subjectResult.eval >= 10) passedSubjects += 1
    }

    result.set(studentId, {
      studentId,
      weightedAvg: totalCoef > 0 ? round2(totalPoints / totalCoef) : 0,
      totalCoef,
      totalPoints: round2(totalPoints),
      passedSubjects,
      hasMarks: totalCoef > 0,
      subjectEvals,
    })
  }

  return result
}

/** Legacy classmate path: pool all raw marks per subject (pre-fix behaviour). */
export function buildCohortRawPooledMetrics(options: {
  studentIds: string[]
  subjects: ClassRankingSubject[]
  gradesByStudentId: Map<string, StudentGradeRow[]>
  branchGradesByStudentId: Map<string, StudentBranchGradeRow[]>
  branchIdToSubjectId: Map<string, string>
  subjectIdToName: Map<string, string>
  gradeIncluded: BuildCohortRankingOptions['gradeIncluded']
}): Map<string, { weightedAvg: number; hasMarks: boolean }> {
  const subjectCoefByName = new Map<string, number>()
  for (const s of options.subjects) {
    subjectCoefByName.set(normalizeSubjectName(s.name), s.coefficient > 0 ? s.coefficient : 0)
  }

  const result = new Map<string, { weightedAvg: number; hasMarks: boolean }>()

  for (const studentId of options.studentIds) {
    const marksBySubject = new Map<string, number[]>()

    const pushMark = (normalizedSubject: string, mark: number) => {
      if (!subjectCoefByName.has(normalizedSubject) || !Number.isFinite(mark)) return
      if (!marksBySubject.has(normalizedSubject)) marksBySubject.set(normalizedSubject, [])
      marksBySubject.get(normalizedSubject)!.push(mark)
    }

    for (const g of options.gradesByStudentId.get(studentId) || []) {
      const subj = g.subject || ''
      if (!subj || !options.gradeIncluded(g.term ?? null, g.title, subj)) continue
      pushMark(normalizeSubjectName(subj), g.marks_obtained)
    }

    for (const bg of options.branchGradesByStudentId.get(studentId) || []) {
      const subjectId = options.branchIdToSubjectId.get(bg.branch_id)
      if (!subjectId) continue
      const subjectName = options.subjectIdToName.get(subjectId)
      if (!subjectName) continue
      if (!options.gradeIncluded(bg.term ?? null, bg.title, subjectName)) continue
      pushMark(normalizeSubjectName(subjectName), bg.marks_obtained)
    }

    let totalPoints = 0
    let totalCoef = 0
    for (const [normalizedSubject, marks] of marksBySubject.entries()) {
      const coef = subjectCoefByName.get(normalizedSubject) || 0
      if (coef <= 0 || !marks.length) continue
      const subjectAverage = marks.reduce((s, v) => s + v, 0) / marks.length
      totalPoints += subjectAverage * coef
      totalCoef += coef
    }

    result.set(studentId, {
      weightedAvg: totalCoef > 0 ? round2(totalPoints / totalCoef) : 0,
      hasMarks: totalCoef > 0,
    })
  }

  return result
}

export function rankCohortByMetrics(
  metrics: Map<string, StudentRankingMetrics>
): Map<string, number> {
  const inputs = [...metrics.values()]
    .filter((m) => m.hasMarks)
    .map((m) => ({ studentId: m.studentId, average: m.weightedAvg }))
  return computeDenseRanks(inputs)
}

export function rankSubjectsForCohort(
  metrics: Map<string, StudentRankingMetrics>,
  normalizedSubject: string
): Map<string, number> {
  const rows: Array<{
    studentId: string
    subjectAvg: number
    totalPoints: number
    passedSubjects: number
  }> = []

  for (const m of metrics.values()) {
    const subjectAvg = m.subjectEvals.get(normalizedSubject)
    if (subjectAvg === undefined) continue
    rows.push({
      studentId: m.studentId,
      subjectAvg,
      totalPoints: m.totalPoints,
      passedSubjects: m.passedSubjects,
    })
  }

  return computeSubjectDenseRanks(rows)
}

/** Re-export for diagnostics / term resolution in scripts. */
export { getTermFromAssessment }
