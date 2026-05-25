import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'
import { assessmentMatchesTermFilter } from './report-card-marks-list-filters'

describe('assessmentMatchesTermFilter', () => {
  it('matches second term sequences', () => {
    const map = new Map<string, number>()
    assert.equal(
      assessmentMatchesTermFilter('Third Sequence', 'second', map, DEFAULT_TERM_COUNTS),
      true
    )
    assert.equal(
      assessmentMatchesTermFilter('First Sequence', 'second', map, DEFAULT_TERM_COUNTS),
      false
    )
  })
})
