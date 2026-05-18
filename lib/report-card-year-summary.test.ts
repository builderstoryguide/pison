import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  isYearSummaryReport,
  isThirdTermYearSummaryTable,
  type AcademicReportTermMode,
} from './report-card-year-summary'

describe('isYearSummaryReport', () => {
  it('is true for annual', () => {
    const mode: AcademicReportTermMode = { mode: 'annual' }
    assert.equal(isYearSummaryReport(mode), true)
    assert.equal(isThirdTermYearSummaryTable(mode), false)
  })

  it('is true for third term only among per-term modes', () => {
    assert.equal(isYearSummaryReport({ mode: 'per_term', term: 3 }), true)
    assert.equal(isThirdTermYearSummaryTable({ mode: 'per_term', term: 3 }), true)
    assert.equal(isYearSummaryReport({ mode: 'per_term', term: 1 }), false)
    assert.equal(isYearSummaryReport({ mode: 'per_term', term: 2 }), false)
  })
})
