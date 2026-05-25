import {
  getTermAveragesFromSequenceMarks,
  getAnnualAverageFromTermAverages,
  getGlobalSlotsForTerm,
  mapInTermToGlobal,
  globalToTerm,
  type TermSequenceCounts,
  type TermAverages,
} from '@/lib/sequence-term-mapping'
import {
  extractGlobalSequenceNumber,
  resolveGlobalSequenceFromTitle,
} from '@/lib/report-card-assessment-resolution'

export type SequenceMarks = Record<string, number | undefined>

export function emptySequenceMarks(): SequenceMarks {
  return {
    seq1: undefined,
    seq2: undefined,
    seq3: undefined,
    seq4: undefined,
    seq5: undefined,
    seq6: undefined,
  }
}

export function averageMarks(marks: number[]): number {
  if (marks.length === 0) return 0
  return marks.reduce((a, b) => a + b, 0) / marks.length
}

export function buildSequenceMarksFromGrades(options: {
  grades: { marks_obtained: number; title: string }[]
  sequenceIdToNumberMap: Map<string, number>
  termSequenceCounts: TermSequenceCounts
  totalSequences: 5 | 6
  perTermNum: 1 | 2 | 3 | null
  yearSummary: boolean
}): { sequenceMarks: SequenceMarks; finalMark: number; hasMark: boolean } {
  const {
    grades,
    sequenceIdToNumberMap,
    termSequenceCounts,
    totalSequences,
    perTermNum,
    yearSummary,
  } = options

  const gradesBySequence: Record<number, number[]> = {}

  for (const grade of grades) {
    const assessmentTitle = grade.title || ''
    let globalSeqNum: number | null = null

    if (yearSummary) {
      globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap)
    } else if (perTermNum !== null) {
      const inTermSeqNum = extractInTermSequenceFromTitle(
        assessmentTitle,
        perTermNum,
        termSequenceCounts,
        sequenceIdToNumberMap
      )
      if (inTermSeqNum !== null) {
        globalSeqNum = mapInTermToGlobal(inTermSeqNum, perTermNum, termSequenceCounts)
      } else {
        globalSeqNum = resolveGlobalSequenceFromTitle(assessmentTitle, sequenceIdToNumberMap)
      }
    }

    if (globalSeqNum !== null && globalSeqNum >= 1 && globalSeqNum <= 6) {
      if (!gradesBySequence[globalSeqNum]) gradesBySequence[globalSeqNum] = []
      gradesBySequence[globalSeqNum].push(grade.marks_obtained)
    } else {
      if (!gradesBySequence[0]) gradesBySequence[0] = []
      gradesBySequence[0].push(grade.marks_obtained)
    }
  }

  const sequenceMarks = emptySequenceMarks()

  for (const seqNumStr of Object.keys(gradesBySequence)) {
    const seqNum = parseInt(seqNumStr, 10)
    const marks = gradesBySequence[seqNum]
    if (marks?.length && seqNum >= 1 && seqNum <= totalSequences) {
      sequenceMarks[`seq${seqNum}`] = parseFloat(averageMarks(marks).toFixed(2))
    }
  }

  distributeUnknownGrades(gradesBySequence, sequenceMarks, perTermNum, totalSequences)

  let finalMark = 0
  let hasMark = false
  const marksForTermAverage: number[] = []

  if (yearSummary) {
    const annualTermAvgs = getTermAveragesFromSequenceMarks(sequenceMarks, termSequenceCounts)
    const annualAvg = getAnnualAverageFromTermAverages(annualTermAvgs)
    if (annualAvg !== undefined) {
      marksForTermAverage.push(annualAvg)
    }
  } else if (perTermNum !== null) {
    const slots = getGlobalSlotsForTerm(perTermNum, termSequenceCounts)
    for (const slot of slots) {
      const m = sequenceMarks[`seq${slot}`]
      if (m !== undefined) marksForTermAverage.push(m)
    }
  }

  if (marksForTermAverage.length > 0) {
    finalMark = averageMarks(marksForTermAverage)
    hasMark = true
  } else if (gradesBySequence[0]?.length) {
    finalMark = averageMarks(gradesBySequence[0])
    hasMark = true
    if (perTermNum !== null) {
      const slots = getGlobalSlotsForTerm(perTermNum, termSequenceCounts)
      if (slots[0]) {
        sequenceMarks[`seq${slots[0]}`] = parseFloat(finalMark.toFixed(2))
      }
    }
  }

  return { sequenceMarks, finalMark, hasMark }
}

function extractInTermSequenceFromTitle(
  title: string,
  termNumber: number,
  termSequenceCounts: TermSequenceCounts,
  sequenceIdToNumberMap: Map<string, number>
): number | null {
  const globalSeqNum =
    resolveGlobalSequenceFromTitle(title, sequenceIdToNumberMap) ??
    extractGlobalSequenceNumber(title)
  if (globalSeqNum === null) return null
  const mapped = globalToTerm(globalSeqNum, termSequenceCounts)
  if (!mapped || mapped.termNumber !== termNumber) return null
  return mapped.inTermPosition
}

function distributeUnknownGrades(
  gradesBySequence: Record<number, number[]>,
  sequenceMarks: SequenceMarks,
  perTermNum: 1 | 2 | 3 | null,
  totalSequences: 5 | 6
): void {
  if (!gradesBySequence[0]?.length) return

  const unknownGrades = gradesBySequence[0]
  const termForDistribution = perTermNum ?? 1
  const seq1ForTerm = (termForDistribution - 1) * 2 + 1
  const seq2ForTerm = (termForDistribution - 1) * 2 + 2

  if (unknownGrades.length === 2) {
    if (!gradesBySequence[seq1ForTerm]) gradesBySequence[seq1ForTerm] = []
    if (!gradesBySequence[seq2ForTerm]) gradesBySequence[seq2ForTerm] = []
    gradesBySequence[seq1ForTerm].push(unknownGrades[0])
    gradesBySequence[seq2ForTerm].push(unknownGrades[1])
    delete gradesBySequence[0]
  } else if (unknownGrades.length === 1) {
    if (!gradesBySequence[seq1ForTerm]) gradesBySequence[seq1ForTerm] = []
    gradesBySequence[seq1ForTerm].push(unknownGrades[0])
    delete gradesBySequence[0]
  }

  for (const seqNumStr of Object.keys(gradesBySequence)) {
    const seqNum = parseInt(seqNumStr, 10)
    if (seqNum >= 1 && seqNum <= totalSequences) {
      const marks = gradesBySequence[seqNum]
      if (marks?.length) {
        sequenceMarks[`seq${seqNum}`] = parseFloat(averageMarks(marks).toFixed(2))
      }
    }
  }
}

/** Fill term sequence slots with branch term average (display parity for branched subjects). */
export function fillBranchSequenceSlotsFromTermAverage(
  sequenceMarks: SequenceMarks,
  termAverage: number,
  perTermNum: 1 | 2 | 3 | null,
  termSequenceCounts: TermSequenceCounts
): void {
  if (perTermNum === null) return
  const slots = getGlobalSlotsForTerm(perTermNum, termSequenceCounts)
  const val = parseFloat(termAverage.toFixed(2))
  for (const slot of slots) {
    if (sequenceMarks[`seq${slot}`] === undefined) {
      sequenceMarks[`seq${slot}`] = val
    }
  }
}

export function computeBranchSubjectMarks(options: {
  branchGrades: { marks_obtained: number; branch_id: string; title: string }[]
  branchIds: string[]
  sequenceIdToNumberMap: Map<string, number>
  termSequenceCounts: TermSequenceCounts
  totalSequences: 5 | 6
  perTermNum: 1 | 2 | 3 | null
  yearSummary: boolean
}): { sequenceMarks: SequenceMarks; finalMark: number; hasMark: boolean } {
  const {
    branchGrades,
    branchIds,
    sequenceIdToNumberMap,
    termSequenceCounts,
    totalSequences,
    perTermNum,
    yearSummary,
  } = options

  const branchSequenceAvgs: number[] = []

  for (const branchId of branchIds) {
    const bGrades = branchGrades.filter((bg) => bg.branch_id === branchId)
    if (bGrades.length === 0) continue

    const { finalMark, hasMark } = buildSequenceMarksFromGrades({
      grades: bGrades.map((g) => ({ marks_obtained: g.marks_obtained, title: g.title })),
      sequenceIdToNumberMap,
      termSequenceCounts,
      totalSequences,
      perTermNum,
      yearSummary,
    })

    if (hasMark) branchSequenceAvgs.push(finalMark)
  }

  if (branchSequenceAvgs.length === 0) {
    return { sequenceMarks: emptySequenceMarks(), finalMark: 0, hasMark: false }
  }

  const finalMark = averageMarks(branchSequenceAvgs)
  const sequenceMarks = emptySequenceMarks()
  fillBranchSequenceSlotsFromTermAverage(sequenceMarks, finalMark, perTermNum, termSequenceCounts)

  return { sequenceMarks, finalMark, hasMark: true }
}

export type { TermAverages }
