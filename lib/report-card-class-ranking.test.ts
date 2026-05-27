import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildCohortRankingMetrics,
  buildCohortRawPooledMetrics,
  rankCohortByMetrics,
} from './report-card-class-ranking'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'

const termCounts = { ...DEFAULT_TERM_COUNTS }
const sequenceIdToNumberMap = new Map<string, number>()

const subjects = [
  { id: 'subj-a', name: 'Mathematics', coefficient: 4, hasSubBranches: false },
  { id: 'subj-b', name: 'English Language', coefficient: 4, hasSubBranches: false },
]

const SEQ_TITLES = [
  'First Seq',
  'Second Seq',
  'Third Seq',
  'Fourth Seq',
  'Fifth Seq',
  'Sixth Seq',
]

function gradesForStudent(
  studentId: string,
  subject: string,
  marksBySeq: number[]
): Array<{ studentId: string; row: { marks_obtained: number; title: string; subject: string; term: null } }> {
  return marksBySeq.map((mark, i) => ({
    studentId,
    row: {
      marks_obtained: mark,
      title: SEQ_TITLES[i] || `Seq ${i + 1}`,
      subject,
      term: null,
    },
  }))
}

function buildMaps(
  entries: Array<{ studentId: string; row: { marks_obtained: number; title: string; subject: string; term: null } }>
) {
  const gradesByStudentId = new Map<string, typeof entries[0]['row'][]>()
  for (const e of entries) {
    if (!gradesByStudentId.has(e.studentId)) gradesByStudentId.set(e.studentId, [])
    gradesByStudentId.get(e.studentId)!.push(e.row)
  }
  return gradesByStudentId
}

describe('buildCohortRankingMetrics vs raw pooled', () => {
  it('assigns rank 1 and 2 when display-scale averages differ', () => {
    // Term1 high, term2/3 lower — annual avg (mean of term avgs) differs from raw mean of all six marks.
    const seqMarksA = [20, 20, 10, 10, 10, 10]
    const seqMarksB = [20.5, 20.5, 10.5, 10.5, 10.5, 10.5]
    const gradesA = [
      ...gradesForStudent('a', 'Mathematics', seqMarksA),
      ...gradesForStudent('a', 'English Language', seqMarksA),
    ]
    const gradesB = [
      ...gradesForStudent('b', 'Mathematics', seqMarksB),
      ...gradesForStudent('b', 'English Language', seqMarksB),
    ]

    const gradesByStudentId = buildMaps([...gradesA, ...gradesB])
    const cohortBase = {
      studentIds: ['a', 'b'],
      subjects,
      gradesByStudentId,
      branchGradesByStudentId: new Map(),
      branchIdsBySubjectId: new Map(),
      scope: 'annual' as const,
      yearSummary: true,
      activeTerm: null,
      sequenceIdToNumberMap,
      termSequenceCounts: termCounts,
      totalSequences: 6 as const,
      gradeIncluded: () => true,
      gradeBelongsToTerm: () => true,
      includeAllTermsGrades: true,
      academicTermId: 'annual',
    }

    const cohort = buildCohortRankingMetrics(cohortBase)
    const raw = buildCohortRawPooledMetrics({
      studentIds: ['a', 'b'],
      subjects,
      gradesByStudentId,
      branchGradesByStudentId: new Map(),
      branchIdToSubjectId: new Map(),
      subjectIdToName: new Map(subjects.map((s) => [s.id, s.name])),
      gradeIncluded: () => true,
    })

    const avgA = cohort.get('a')?.weightedAvg ?? 0
    const avgB = cohort.get('b')?.weightedAvg ?? 0
    assert.ok(avgB > avgA, `expected B (${avgB}) > A (${avgA})`)

    const ranks = rankCohortByMetrics(cohort)
    assert.equal(ranks.get('b'), 1)
    assert.equal(ranks.get('a'), 2)

    assert.notEqual(avgA, avgB, 'sequence-based annual avgs must differ')
    const rawRanks = rankCohortByMetrics(
      new Map(
        [...raw.entries()].map(([id, m]) => [
          id,
          {
            studentId: id,
            weightedAvg: m.weightedAvg,
            totalCoef: 1,
            totalPoints: m.weightedAvg,
            passedSubjects: 0,
            hasMarks: m.hasMarks,
            subjectEvals: new Map(),
          },
        ])
      )
    )
    assert.equal(rawRanks.get('b'), 1)
    assert.equal(rawRanks.get('a'), 2)
  })

  it('shares rank 1 when display-scale averages tie', () => {
    const seqMarks = [15, 15, 15, 15, 15, 15]
    const entries = [
      ...gradesForStudent('a', 'Mathematics', seqMarks),
      ...gradesForStudent('b', 'Mathematics', seqMarks),
    ]
    const gradesByStudentId = buildMaps(entries)
    const cohort = buildCohortRankingMetrics({
      studentIds: ['a', 'b'],
      subjects: [{ id: 'subj-a', name: 'Mathematics', coefficient: 1 }],
      gradesByStudentId,
      branchGradesByStudentId: new Map(),
      branchIdsBySubjectId: new Map(),
      scope: 'annual',
      yearSummary: true,
      activeTerm: null,
      sequenceIdToNumberMap,
      termSequenceCounts: termCounts,
      totalSequences: 6,
      gradeIncluded: () => true,
      gradeBelongsToTerm: () => true,
      includeAllTermsGrades: true,
      academicTermId: 'annual',
    })
    const ranks = rankCohortByMetrics(cohort)
    assert.equal(ranks.get('a'), 1)
    assert.equal(ranks.get('b'), 1)
  })

  it('includes partial-year subjects when only term 1 slots are complete', () => {
    const seqMarksPartial = [15, 15, undefined, undefined, undefined, undefined]
    const gradesByStudentId = buildMaps([
      ...gradesForStudent('a', 'Mathematics', seqMarksPartial),
      ...gradesForStudent('a', 'English Language', seqMarksPartial),
    ])
    const cohort = buildCohortRankingMetrics({
      studentIds: ['a'],
      subjects,
      gradesByStudentId,
      branchGradesByStudentId: new Map(),
      branchIdsBySubjectId: new Map(),
      scope: 'annual',
      yearSummary: true,
      activeTerm: null,
      sequenceIdToNumberMap,
      termSequenceCounts: termCounts,
      totalSequences: 6,
      gradeIncluded: () => true,
      gradeBelongsToTerm: () => true,
      includeAllTermsGrades: true,
      academicTermId: 'annual',
    })
    const metrics = cohort.get('a')
    assert.ok(metrics?.hasMarks, 'partial year should still rank student')
    assert.ok((metrics?.totalCoef ?? 0) > 0)
  })
})
