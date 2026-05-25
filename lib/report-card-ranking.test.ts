import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { computeDenseRanks } from './report-card-ranking'

describe('computeDenseRanks', () => {
  it('assigns dense ranks with ties', () => {
    const ranks = computeDenseRanks([
      { studentId: 'a', average: 15 },
      { studentId: 'b', average: 15 },
      { studentId: 'c', average: 12 },
    ])
    assert.equal(ranks.get('a'), 1)
    assert.equal(ranks.get('b'), 1)
    assert.equal(ranks.get('c'), 2)
  })
})
