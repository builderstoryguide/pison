import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'
import {
  buildSequenceMarksFromGrades,
  fillBranchSequenceSlotsFromTermAverage,
  computeBranchSubjectMarks,
  emptySequenceMarks,
  getAverageFromPopulatedSequenceMarks,
} from './report-card-subject-marks'
import { PRESET_5_TERM_COUNTS } from './sequence-term-mapping'

describe('buildSequenceMarksFromGrades', () => {
  it('averages marks per sequence for term 1', () => {
    const map = new Map<string, number>()
    const { sequenceMarks, finalMark, hasMark } = buildSequenceMarksFromGrades({
      grades: [
        { marks_obtained: 12, title: 'First Sequence' },
        { marks_obtained: 14, title: 'Second Sequence' },
      ],
      sequenceIdToNumberMap: map,
      termSequenceCounts: DEFAULT_TERM_COUNTS,
      totalSequences: 6,
      perTermNum: 1,
      yearSummary: false,
    })
    assert.equal(hasMark, true)
    assert.equal(sequenceMarks.seq1, 12)
    assert.equal(sequenceMarks.seq2, 14)
    assert.equal(finalMark, 13)
  })

  it('year-summary with seq1 only still produces hasMark via populated-sequence fallback', () => {
    const map = new Map<string, number>()
    const { sequenceMarks, finalMark, hasMark } = buildSequenceMarksFromGrades({
      grades: [{ marks_obtained: 10, title: 'First Sequence' }],
      sequenceIdToNumberMap: map,
      termSequenceCounts: PRESET_5_TERM_COUNTS,
      totalSequences: 5,
      perTermNum: null,
      yearSummary: true,
    })
    assert.equal(hasMark, true)
    assert.equal(sequenceMarks.seq1, 10)
    assert.equal(sequenceMarks.seq2, undefined)
    assert.equal(finalMark, 10)
  })
})

describe('getAverageFromPopulatedSequenceMarks', () => {
  it('returns mean of populated slots only', () => {
    const marks = emptySequenceMarks()
    marks.seq1 = 10
    marks.seq3 = 14
    assert.equal(getAverageFromPopulatedSequenceMarks(marks, 5), 12)
  })

  it('returns undefined when no slots populated', () => {
    assert.equal(getAverageFromPopulatedSequenceMarks(emptySequenceMarks(), 5), undefined)
  })
})

describe('fillBranchSequenceSlotsFromTermAverage', () => {
  it('fills term 1 slots', () => {
    const marks = emptySequenceMarks()
    fillBranchSequenceSlotsFromTermAverage(marks, 15.5, 1, DEFAULT_TERM_COUNTS)
    assert.equal(marks.seq1, 15.5)
    assert.equal(marks.seq2, 15.5)
    assert.equal(marks.seq3, undefined)
  })

  it('does not fill slots on year-summary (perTermNum null)', () => {
    const marks = emptySequenceMarks()
    fillBranchSequenceSlotsFromTermAverage(marks, 15.5, null, DEFAULT_TERM_COUNTS)
    assert.equal(marks.seq1, undefined)
  })
})

describe('computeBranchSubjectMarks year-summary', () => {
  it('merges per-branch sequence marks for annual reports', () => {
    const map = new Map<string, number>()
    const { sequenceMarks, hasMark } = computeBranchSubjectMarks({
      branchGrades: [
        { branch_id: 'b1', marks_obtained: 10, title: 'First Sequence' },
        { branch_id: 'b1', marks_obtained: 12, title: 'Second Sequence' },
        { branch_id: 'b2', marks_obtained: 8, title: 'First Sequence' },
        { branch_id: 'b2', marks_obtained: 14, title: 'Second Sequence' },
      ],
      branchIds: ['b1', 'b2'],
      sequenceIdToNumberMap: map,
      termSequenceCounts: PRESET_5_TERM_COUNTS,
      totalSequences: 5,
      perTermNum: null,
      yearSummary: true,
    })
    assert.equal(hasMark, true)
    assert.equal(sequenceMarks.seq1, 9)
    assert.equal(sequenceMarks.seq2, 13)
  })
})
