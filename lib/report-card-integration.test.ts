/**
 * Integration-style checks for report card calculation modules (no DB).
 * Run: npx tsx --test lib/report-card-integration.test.ts
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { flattenPisonSubjects } from './report-card-transform'
import { isSubjectExcludedForClass } from './report-card-subject-matching'
import { computeWeightedTotal } from './report-card-totals'
import { DEFAULT_TERM_COUNTS } from './sequence-term-mapping'
import { buildSequenceMarksFromGrades } from './report-card-subject-marks'

describe('report card integration', () => {
  it('flattens grouped subjects and computes weighted total', () => {
    const flat = flattenPisonSubjects({
      trade_subjects: {
        items: [
          {
            name: 'Mathematics',
            eval: 14,
            coef: 4,
            hasMark: true,
            coefEligible: true,
            seq1: 12,
            seq2: 16,
          },
        ],
      },
    })
    assert.equal(flat.length, 1)
    assert.equal(flat[0].termAverage, 14)

    const { average, totalCoef } = computeWeightedTotal([
      { eval: 14, coef: 4, coefEligible: true },
    ])
    assert.equal(totalCoef, 4)
    assert.equal(average, 14)
  })

  it('builds term 2 marks from third and fourth sequences', () => {
    const { finalMark, hasMark } = buildSequenceMarksFromGrades({
      grades: [
        { marks_obtained: 11, title: 'Third Sequence' },
        { marks_obtained: 13, title: 'Fourth Sequence' },
      ],
      sequenceIdToNumberMap: new Map(),
      termSequenceCounts: DEFAULT_TERM_COUNTS,
      totalSequences: 6,
      perTermNum: 2,
      yearSummary: false,
    })
    assert.equal(hasMark, true)
    assert.equal(finalMark, 12)
  })

  it('flatten omits legacy Excluded for class rows from API sections', () => {
    const flat = flattenPisonSubjects({
      general: {
        items: [
          {
            name: 'Mathematics',
            eval: 10,
            coef: 4,
            hasMark: true,
            coefEligible: true,
          },
          {
            name: 'Computer Science',
            eval: '-',
            coef: 0,
            remark: 'Excluded for class',
            hasMark: false,
            coefEligible: false,
          },
        ],
      },
    })
    assert.equal(flat.length, 1)
    assert.equal(flat[0].subjectName, 'Mathematics')
  })

  it('HEC 1 curriculum filter drops Computer Science from offered list', () => {
    const subjects = [
      { name: 'Family Life Education and Gerontology (FLEG)' },
      { name: 'Computer Science' },
      { name: 'Introduction to Marketing' },
    ]
    const offered = subjects.filter(
      (s) => !isSubjectExcludedForClass('HEC 1', s.name)
    )
    assert.equal(offered.length, 2)
    assert.ok(offered.every((s) => !/computer science/i.test(s.name)))
  })
})
