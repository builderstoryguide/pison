import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  subjectNamesMatch,
  normalizeSubjectName,
  isSubjectExcludedForClass,
  isBcOrEpsClass,
} from './report-card-subject-matching'

describe('subjectNamesMatch', () => {
  it('matches aliases', () => {
    assert.equal(subjectNamesMatch('BC', 'Building Construction'), true)
    assert.equal(subjectNamesMatch('Mathematics', 'Maths'), true)
  })

  it('does not match math with business mathematics', () => {
    assert.equal(subjectNamesMatch('Mathematics', 'Business Mathematics'), false)
  })

  it('matches BC CPB assessment name to class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Construction Process',
        'Construction process and Building practice (CPB)'
      ),
      true
    )
  })

  it('matches BC BCD drawing to class subject', () => {
    assert.equal(
      subjectNamesMatch('Drawing', 'Building Construction Drawing (BCD)'),
      true
    )
    assert.equal(
      subjectNamesMatch('Building Drawing', 'Building Construction Drawing (BCD)'),
      true
    )
  })

  it('matches BC soil survey to SMS class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Soil Survey Material',
        'Survey, Soil Mechanics and Material ( SMS)'
      ),
      true
    )
  })

  it('matches HEC Family Life to FLEG class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Family Life',
        'Family Life Education and Gerontology (FLEG)'
      ),
      true
    )
  })

  it('matches HEC Food and Nutrition to FNH class subject', () => {
    assert.equal(
      subjectNamesMatch('Food and Nutrition', 'Food, Nutrition and Health (FNH)'),
      true
    )
  })

  it('matches HEC Resource Management to RMHS class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Resource Management',
        'Resource Management on Home Studies (RMHS)'
      ),
      true
    )
  })

  it('matches HEC Law and Government to LG class subject', () => {
    assert.equal(
      subjectNamesMatch('Law and Government', 'Law and government (LG)'),
      true
    )
  })

  it('matches EPS Engineering Drawing to ENGINEERING DRAWING class subject', () => {
    assert.equal(subjectNamesMatch('Engineering Drawing', 'ENGINEERING DRAWING'), true)
  })

  it('matches EPS Electrical Technology to ETD class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Electrical Technology',
        'Electrical Technology and Diagrams (ETD)'
      ),
      true
    )
  })

  it('matches EPS Electrical Circuit to EEC class subject', () => {
    assert.equal(
      subjectNamesMatch(
        'Electrical Circuit',
        'Electrical and Electronic Circuit (EEC)'
      ),
      true
    )
  })

  it('matches EPS Electric Machine to EM class subject', () => {
    assert.equal(
      subjectNamesMatch('Electric Machine', 'Electrical Machines (EM)'),
      true
    )
  })
})

describe('normalizeSubjectName', () => {
  it('canonicalizes eps', () => {
    assert.equal(normalizeSubjectName('EPS'), 'physical education')
  })

  it('canonicalizes cpb shorthand', () => {
    assert.equal(normalizeSubjectName('CPB'), 'construction process and building practice')
  })

  it('canonicalizes fleg and fnh shorthand', () => {
    assert.equal(normalizeSubjectName('FLEG'), 'family life')
    assert.equal(normalizeSubjectName('FNH'), 'food and nutrition')
    assert.equal(normalizeSubjectName('RMHS'), 'resource management')
  })

  it('canonicalizes eps trade subject shorthand', () => {
    assert.equal(normalizeSubjectName('ETD'), 'electrical technology')
    assert.equal(normalizeSubjectName('EEC'), 'electrical and electronic circuit')
    assert.equal(normalizeSubjectName('EM'), 'electrical machines')
  })
})

describe('isBcOrEpsClass', () => {
  it('matches legacy and Form N BC names', () => {
    assert.equal(isBcOrEpsClass('BC1'), true)
    assert.equal(isBcOrEpsClass('FORM1BC'), true)
    assert.equal(isBcOrEpsClass('FORM5BC'), true)
    assert.equal(isBcOrEpsClass('AC4'), false)
  })

  it('matches Form N EPS names', () => {
    assert.equal(isBcOrEpsClass('FORM1EPS'), true)
    assert.equal(isBcOrEpsClass('FORM3EPS'), true)
    assert.equal(isBcOrEpsClass('BC1'), true)
  })
})

describe('isSubjectExcludedForClass', () => {
  it('excludes industrial computing for BC1', () => {
    assert.equal(isSubjectExcludedForClass('BC1', 'Industrial Computing'), true)
  })

  it('excludes industrial computing for Form 1 BC', () => {
    assert.equal(isSubjectExcludedForClass('Form 1 BC', 'Industrial Computing'), true)
    assert.equal(isSubjectExcludedForClass('Form 1 BC', 'INDUSTRIAL COMPUTING'), true)
  })

  it('does not exclude industrial computing for AC classes', () => {
    assert.equal(isSubjectExcludedForClass('AC 4', 'Industrial Computing'), false)
  })

  it('excludes computer science for HEC 1 but not marketing', () => {
    assert.equal(isSubjectExcludedForClass('HEC 1', 'Computer Science'), true)
    assert.equal(isSubjectExcludedForClass('HEC 1', 'Introduction to Marketing'), false)
  })

  it('excludes marketing and office practice for HEC 3', () => {
    assert.equal(isSubjectExcludedForClass('HEC 3', 'Introduction to Marketing'), true)
    assert.equal(isSubjectExcludedForClass('HEC 3', 'Office Practice'), true)
    assert.equal(isSubjectExcludedForClass('HEC 3', 'Family Life'), false)
  })

  it('does not exclude industrial computing for Form 1 EPS', () => {
    assert.equal(isSubjectExcludedForClass('form 1 EPS', 'Industrial Computing'), false)
    assert.equal(isSubjectExcludedForClass('FORM 3 EPS', 'INDUSTRIAL COMPUTING'), false)
  })
})
