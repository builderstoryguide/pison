import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getGradeRemarks, getRemarkForMark, isNegativeRemark } from './grading-utils'

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
