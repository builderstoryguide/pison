import { RANK_EPSILON } from '@/lib/report-card-totals'

export interface StudentRankInput {
  studentId: string
  average: number
}

/** Dense rank: 1 = highest average; ties share rank. */
export function computeDenseRanks(students: StudentRankInput[]): Map<string, number> {
  const sorted = [...students].sort((a, b) => {
    if (Math.abs(b.average - a.average) < RANK_EPSILON) {
      return a.studentId.localeCompare(b.studentId)
    }
    return b.average - a.average
  })

  const ranks = new Map<string, number>()
  let rank = 1
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].average < sorted[i - 1].average - RANK_EPSILON) {
      rank++
    }
    ranks.set(sorted[i].studentId, rank)
  }
  return ranks
}

export interface SubjectRankInput {
  studentId: string
  subjectAvg: number
  totalPoints: number
  passedSubjects: number
}

/** Per-subject dense rank by subjectAvg descending. */
export function computeSubjectDenseRanks(inputs: SubjectRankInput[]): Map<string, number> {
  const sorted = [...inputs].sort((a, b) => {
    if (Math.abs(b.subjectAvg - a.subjectAvg) >= RANK_EPSILON) {
      return b.subjectAvg - a.subjectAvg
    }
    if (Math.abs(b.totalPoints - a.totalPoints) >= RANK_EPSILON) {
      return b.totalPoints - a.totalPoints
    }
    if (b.passedSubjects !== a.passedSubjects) {
      return b.passedSubjects - a.passedSubjects
    }
    return a.studentId.localeCompare(b.studentId)
  })

  const ranks = new Map<string, number>()
  let rank = 1
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].subjectAvg < sorted[i - 1].subjectAvg - RANK_EPSILON) {
      rank++
    }
    ranks.set(sorted[i].studentId, rank)
  }
  return ranks
}
