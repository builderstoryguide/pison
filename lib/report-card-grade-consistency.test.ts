import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { calculateGrade } from './grading-utils'
import { resolveYearSummaryFinalMark } from './report-card-subject-marks'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'

describe('report card grade consistency', () => {
  it('calculateGrade(14) is B not U (Apong Emmanuel case)', () => {
    assert.equal(calculateGrade(14), 'B')
    assert.notEqual(calculateGrade(14), 'U')
  })

  it('resolveYearSummaryFinalMark uses term means when all three terms pass', () => {
    const sequenceMarks = {
      seq1: 12,
      seq2: 13,
      seq3: 11,
      seq4: 14,
      seq5: 15,
      seq6: 16,
    }
    const resolved = resolveYearSummaryFinalMark(
      sequenceMarks,
      DEFAULT_TERM_COUNTS,
      6
    )
    assert.ok(resolved)
    assert.equal(resolved!.termAvgs.term1, 12.5)
    assert.equal(resolved!.termAvgs.term2, 12.5)
    assert.equal(resolved!.termAvgs.term3, 15.5)
    assert.equal(resolved!.finalMark, 13.5)
    assert.notEqual(calculateGrade(resolved!.finalMark), 'U')
  })

  it('partial term slots still yield passing finalMark', () => {
    const sequenceMarks = {
      seq1: 12,
      seq2: undefined,
      seq3: 11,
      seq4: undefined,
      seq5: 14,
      seq6: undefined,
    }
    const resolved = resolveYearSummaryFinalMark(
      sequenceMarks,
      DEFAULT_TERM_COUNTS,
      6
    )
    assert.ok(resolved)
    assert.equal(resolved!.termAvgs.term1, 12)
    assert.equal(resolved!.termAvgs.term2, 11)
    assert.equal(resolved!.termAvgs.term3, 14)
    assert.equal(resolved!.finalMark, parseFloat((37 / 3).toFixed(2)))
    assert.equal(calculateGrade(resolved!.finalMark), 'C')
  })
})
