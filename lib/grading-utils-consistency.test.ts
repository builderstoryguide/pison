import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGrade,
  calculateGradeFromMarks,
  getGradeRemarks,
  markOnScaleOf20,
  processGradeFromMarks,
} from './grading-utils'

const CASES: { mark: number; letter: string; remark: string }[] = [
  { mark: 17, letter: 'A', remark: 'Excellent' },
  { mark: 16, letter: 'B', remark: 'V.good' },
  { mark: 14, letter: 'B', remark: 'V.good' },
  { mark: 13, letter: 'C', remark: 'Pass' },
  { mark: 10, letter: 'C', remark: 'Pass' },
  { mark: 9, letter: 'D', remark: 'Failed' },
  { mark: 7, letter: 'D', remark: 'Failed' },
  { mark: 6, letter: 'U', remark: 'Very weak' },
]

describe('grading scale consistency', () => {
  for (const { mark, letter, remark } of CASES) {
    it(`mark ${mark} → ${letter}`, () => {
      assert.equal(calculateGrade(mark), letter)
      assert.equal(getGradeRemarks(letter), remark)
      assert.equal(calculateGradeFromMarks(mark, 20), letter)
    })
  }

  it('calculateGradeFromMarks(14, 20) is B not U', () => {
    assert.equal(calculateGradeFromMarks(14, 20), 'B')
  })

  it('scales non-20 totals to 0–20 before grading', () => {
    assert.equal(markOnScaleOf20(7, 10), 14)
    assert.equal(calculateGradeFromMarks(7, 10), 'B')
  })

  it('processGradeFromMarks returns paired grade and remark', () => {
    const r = processGradeFromMarks(14, 20)
    assert.equal(r.grade, 'B')
    assert.equal(r.remarks, 'V.good')
  })
})
