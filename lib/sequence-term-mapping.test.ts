import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_TERM_COUNTS,
  getTermAveragesFromSequenceMarks,
} from './sequence-term-mapping'

describe('getTermAveragesFromSequenceMarks', () => {
  it('averages populated slots only within a term', () => {
    const sequenceMarks = {
      seq1: 12,
      seq2: undefined,
      seq3: 14,
      seq4: undefined,
    }
    const termAvgs = getTermAveragesFromSequenceMarks(
      sequenceMarks,
      DEFAULT_TERM_COUNTS
    )
    assert.equal(termAvgs.term1, 12)
    assert.equal(termAvgs.term2, 14)
    assert.equal(termAvgs.term3, undefined)
  })
})
