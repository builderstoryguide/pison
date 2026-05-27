import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractGlobalSequenceNumber,
  getTermFromAssessment,
  resolveGlobalSequenceFromTitle,
  parseAcademicTermMode,
} from './report-card-assessment-resolution'

describe('extractGlobalSequenceNumber', () => {
  it('parses word-based titles', () => {
    assert.equal(extractGlobalSequenceNumber('First Sequence'), 1)
    assert.equal(extractGlobalSequenceNumber('Second Seq'), 2)
    assert.equal(extractGlobalSequenceNumber('6th Sequence'), 6)
  })

  it('parses numeric titles', () => {
    assert.equal(extractGlobalSequenceNumber('Seq 3'), 3)
    assert.equal(extractGlobalSequenceNumber('seq4'), 4)
  })
})

describe('resolveGlobalSequenceFromTitle', () => {
  it('resolves UUID via map', () => {
    const map = new Map([['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2]])
    assert.equal(
      resolveGlobalSequenceFromTitle('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', map),
      2
    )
  })

  it('resolves lower-case sequence names via map', () => {
    const map = new Map([['second sequence', 2]])
    assert.equal(resolveGlobalSequenceFromTitle('second sequence', map), 2)
  })
})

describe('getTermFromAssessment', () => {
  it('returns term from DB term string when title is missing', () => {
    const map = new Map<string, number>()
    assert.equal(getTermFromAssessment(null, 'second', map, {
      'Term 1': 2,
      'Term 2': 2,
      'Term 3': 2,
    }), 2)
  })

  it('returns term from title UUID map even when term string is present', () => {
    const map = new Map([['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1]])
    assert.equal(
      getTermFromAssessment('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'third', map, {
        'Term 1': 2,
        'Term 2': 2,
        'Term 3': 2,
      }),
      1
    )
  })
})

describe('parseAcademicTermMode', () => {
  it('detects annual', () => {
    assert.deepEqual(parseAcademicTermMode('annual'), { mode: 'annual' })
  })
  it('detects per-term', () => {
    assert.deepEqual(parseAcademicTermMode('second'), { mode: 'per_term', term: 2 })
  })
})

describe('report-card grade filtering (end-to-end regression)', () => {
  const termSequenceCounts = { 'Term 1': 2, 'Term 2': 2, 'Term 3': 2 }
  const emptySequenceMap = new Map<string, number>()

  it('includes grades with missing title but valid DB term string for term-specific reports', () => {
    // Grade with no title (no UUID), but valid DB term string "second"
    // This is the missing term fallback scenario we fixed
    const gradeTermFromDb = getTermFromAssessment(null, 'second', emptySequenceMap, termSequenceCounts)
    assert.equal(gradeTermFromDb, 2, 'DB term string "second" should resolve to term 2')

    // Grade with no title, but term string "Term 2"
    const gradeTermFromDbV2 = getTermFromAssessment(null, 'Term 2', emptySequenceMap, termSequenceCounts)
    assert.equal(gradeTermFromDbV2, 2, 'DB term string "Term 2" should resolve to term 2')
  })

  it('excludes grades with neither title nor term metadata from term-specific filtering', () => {
    // Grade with no title and no DB term string
    // This should return null and be excluded by isTargetTerm logic
    const gradeTermMissing = getTermFromAssessment(null, null, emptySequenceMap, termSequenceCounts)
    assert.equal(gradeTermMissing, null, 'Grade with no title and no term should return null')
  })

  it('prioritizes title-based sequence lookup over DB term string', () => {
    // If both title and term are present, title map takes precedence
    // This ensures UUIDs (sequence IDs) resolve correctly
    // Sequence 3 is the first sequence in Term 2 (term counts: T1=2, T2=2, T3=2)
    const sequenceMapWithUuid = new Map([['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3]])
    const gradeTermFromTitle = getTermFromAssessment(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'second',
      sequenceMapWithUuid,
      termSequenceCounts
    )
    assert.equal(gradeTermFromTitle, 2, 'Title/UUID lookup (seq 3 = term 2) should take precedence over DB term string')
  })
})
