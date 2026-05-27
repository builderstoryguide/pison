import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateGrade,
  calculateGradeFromMarks,
  getGradeRemarks,
  getRemarkForMark,
  isNegativeRemark,
  processGradeFromMarks,
} from './grading-utils'

describe('calculateGrade', () => {
  it('uses inclusive boundaries for B and A bands', () => {
    assert.equal(calculateGrade(17), 'A')
    assert.equal(calculateGrade(16.99), 'B')
    assert.equal(calculateGrade(14), 'B')
    assert.equal(calculateGrade(13.99), 'C')
    assert.equal(calculateGrade(10), 'C')
    assert.equal(calculateGrade(9.99), 'D')
    assert.equal(calculateGrade(7), 'D')
    assert.equal(calculateGrade(6.99), 'U')
  })
})

describe('calculateGradeFromMarks', () => {
  it('grades 14/20 as B', () => {
    assert.equal(calculateGradeFromMarks(14, 20), 'B')
  })

  it('processGradeFromMarks matches calculateGradeFromMarks', () => {
    const { grade, remarks } = processGradeFromMarks(14, 20)
    assert.equal(grade, 'B')
    assert.equal(remarks, 'V.good')
  })
})

describe('isNegativeRemark', () => {
  it('detects fail and weak remarks case-insensitively', () => {
    assert.equal(isNegativeRemark('Failed'), true)
    assert.equal(isNegativeRemark('fail'), true)
    assert.equal(isNegativeRemark('Very weak'), true)
    assert.equal(isNegativeRemark('very weak'), true)
    assert.equal(isNegativeRemark('Weak'), true)
    assert.equal(isNegativeRemark('weak'), true)
  })

  it('does not flag positive remarks', () => {
    assert.equal(isNegativeRemark('Excellent'), false)
    assert.equal(isNegativeRemark('V.good'), false)
    assert.equal(isNegativeRemark('Pass'), false)
    assert.equal(isNegativeRemark(''), false)
  })

  it('matches remarks produced by getRemarkForMark', () => {
    assert.equal(isNegativeRemark(getRemarkForMark(8)), true)
    assert.equal(isNegativeRemark(getRemarkForMark(5)), true)
    assert.equal(isNegativeRemark(getRemarkForMark(12)), false)
    assert.equal(isNegativeRemark(getGradeRemarks('D')), true)
    assert.equal(isNegativeRemark(getGradeRemarks('U')), true)
  })
})
