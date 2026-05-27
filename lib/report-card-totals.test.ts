import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isTermCoefEligible,
  isAnnualCoefEligible,
  getPartialAnnualAverageFromTermAverages,
  PRESET_5_TERM_COUNTS,
} from './sequence-term-mapping'
import {
  computeWeightedTermHistory,
  accumulatePartialAnnualSection,
  nominalReportCoef,
} from './report-card-totals'

const termCounts = { ...PRESET_5_TERM_COUNTS }

describe('isTermCoefEligible', () => {
  it('passes when all Term 1 slots have marks', () => {
    const marks = { seq1: 10, seq2: 12 }
    assert.equal(isTermCoefEligible(marks, 1, termCounts), true)
  })

  it('fails when Term 1 is missing a slot', () => {
    const marks = { seq1: 10 }
    assert.equal(isTermCoefEligible(marks, 1, termCounts), false)
  })
})

describe('isAnnualCoefEligible', () => {
  it('fails when only Term 1 is complete (5-seq layout)', () => {
    const marks = { seq1: 10, seq2: 12 }
    assert.equal(isAnnualCoefEligible(marks, termCounts), false)
  })

  it('passes when all five slots are filled', () => {
    const marks = { seq1: 10, seq2: 12, seq3: 11, seq4: 9, seq5: 13 }
    assert.equal(isAnnualCoefEligible(marks, termCounts), true)
  })
})

describe('getPartialAnnualAverageFromTermAverages', () => {
  it('returns mean of completed terms only', () => {
    const avg = getPartialAnnualAverageFromTermAverages({ term1: 10, term2: 14 })
    assert.equal(avg, 12)
  })
})

describe('computeWeightedTermHistory', () => {
  it('computes Term 1 history using plannedCoef when full-year coef is inactive', () => {
    const history = computeWeightedTermHistory(
      [
        {
          term1: 10,
          term2: undefined,
          plannedCoef: 4,
          coef: '-',
          term1CoefEligible: true,
          term2CoefEligible: false,
        },
        {
          term1: 14,
          plannedCoef: 5,
          coef: '-',
          term1CoefEligible: true,
        },
      ],
      'term1'
    )
    assert.equal(history, 12.22)
  })

  it('returns 0 for Term 2 when no subject is term2 eligible', () => {
    const history = computeWeightedTermHistory(
      [
        {
          term1: 10,
          plannedCoef: 4,
          term1CoefEligible: true,
          term2CoefEligible: false,
        },
      ],
      'term2'
    )
    assert.equal(history, 0)
  })
})

describe('accumulatePartialAnnualSection', () => {
  it('includes partial annual subjects using plannedCoef', () => {
    const part = accumulatePartialAnnualSection({
      eval: 11.75,
      plannedCoef: 5,
      coef: '-',
      partialAnnualEligible: true,
    })
    assert.deepEqual(part, { coef: 5, total: 58.75 })
  })

  it('skips when not partial annual eligible', () => {
    assert.equal(
      accumulatePartialAnnualSection({
        eval: 11.75,
        plannedCoef: 5,
        partialAnnualEligible: false,
      }),
      null
    )
  })
})

describe('nominalReportCoef', () => {
  it('prefers plannedCoef over inactive coef', () => {
    assert.equal(nominalReportCoef({ plannedCoef: 5, coef: '-' }), 5)
  })
})
