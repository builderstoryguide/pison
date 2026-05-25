import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractGlobalSequenceNumber,
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
})

describe('parseAcademicTermMode', () => {
  it('detects annual', () => {
    assert.deepEqual(parseAcademicTermMode('annual'), { mode: 'annual' })
  })
  it('detects per-term', () => {
    assert.deepEqual(parseAcademicTermMode('second'), { mode: 'per_term', term: 2 })
  })
})
