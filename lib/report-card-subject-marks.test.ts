import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'
import {
  buildSequenceMarksFromGrades,
  fillBranchSequenceSlotsFromTermAverage,
  emptySequenceMarks,
} from './report-card-subject-marks'

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
})

describe('fillBranchSequenceSlotsFromTermAverage', () => {
  it('fills term 1 slots', () => {
    const marks = emptySequenceMarks()
    fillBranchSequenceSlotsFromTermAverage(marks, 15.5, 1, DEFAULT_TERM_COUNTS)
    assert.equal(marks.seq1, 15.5)
    assert.equal(marks.seq2, 15.5)
    assert.equal(marks.seq3, undefined)
  })
})
