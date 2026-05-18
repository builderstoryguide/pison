import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  flattenPisonSubjects,
  normalizeReportCategory,
  normalizeReportItem,
} from './report-card-transform'

describe('normalizeReportCategory', () => {
  it('maps known categories', () => {
    assert.equal(normalizeReportCategory('general'), 'general')
    assert.equal(normalizeReportCategory('trade_subjects'), 'trade_subjects')
  })

  it('defaults unknown to others', () => {
    assert.equal(normalizeReportCategory('science'), 'others')
    assert.equal(normalizeReportCategory(undefined), 'others')
  })
})

describe('normalizeReportItem', () => {
  it('normalizes eligible coefficient from numeric coef', () => {
    const row = normalizeReportItem({
      name: 'Math',
      eval: 12.5,
      coef: 4,
      grade: 'C',
      remark: 'Pass',
      hasMark: true,
      coefEligible: true,
    })
    assert.equal(row.coefficient, 4)
    assert.equal(row.hasMark, true)
    assert.equal(row.coefEligible, true)
    assert.equal(row.annualAverage, 12.5)
  })

  it('treats dash coef as ineligible but keeps mark', () => {
    const row = normalizeReportItem({
      name: 'CPB',
      eval: 11,
      coef: '-',
      plannedCoef: 3,
      grade: 'C',
      remark: 'Pass',
      hasMark: true,
      coefEligible: false,
    })
    assert.equal(row.coefficient, 0)
    assert.equal(row.plannedCoefficient, 3)
    assert.equal(row.hasMark, true)
    assert.equal(row.coefEligible, false)
    assert.equal(row.annualAverage, 11)
  })

  it('marks subjects without eval as no mark', () => {
    const row = normalizeReportItem({
      name: 'Art',
      eval: '-',
      coef: 0,
      plannedCoef: 2,
      grade: '-',
      remark: 'No Grade',
    })
    assert.equal(row.hasMark, false)
    assert.equal(row.coefEligible, false)
    assert.equal(row.annualAverage, undefined)
  })
})

describe('flattenPisonSubjects', () => {
  it('flattens grouped sections', () => {
    const subjects = flattenPisonSubjects({
      trade_subjects: {
        items: [
          { name: 'Accounting', eval: 14, coef: 5, hasMark: true, coefEligible: true },
        ],
      },
      others: {
        items: [{ name: 'Citizenship', eval: '-', coef: 0, plannedCoef: 1 }],
      },
    })
    assert.equal(subjects.length, 2)
    assert.equal(subjects[0].subjectName, 'Accounting')
    assert.equal(subjects[1].subjectName, 'Citizenship')
  })
})
