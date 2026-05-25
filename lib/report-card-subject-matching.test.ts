import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  subjectNamesMatch,
  normalizeSubjectName,
  isSubjectExcludedForClass,
} from './report-card-subject-matching'

describe('subjectNamesMatch', () => {
  it('matches aliases', () => {
    assert.equal(subjectNamesMatch('BC', 'Building Construction'), true)
    assert.equal(subjectNamesMatch('Mathematics', 'Maths'), true)
  })

  it('does not match math with business mathematics', () => {
    assert.equal(subjectNamesMatch('Mathematics', 'Business Mathematics'), false)
  })
})

describe('normalizeSubjectName', () => {
  it('canonicalizes eps', () => {
    assert.equal(normalizeSubjectName('EPS'), 'physical education')
  })
})

describe('isSubjectExcludedForClass', () => {
  it('excludes industrial computing for BC1', () => {
    assert.equal(isSubjectExcludedForClass('BC1', 'Industrial Computing'), true)
  })
})
