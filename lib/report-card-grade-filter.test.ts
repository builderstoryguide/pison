import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  shouldIncludeReportCardGrade,
  shouldIncludeReportCardBranchGrade,
  type ReportCardGradeFilterContext,
} from './report-card-grade-filter'

function ctx(
  overrides: Partial<ReportCardGradeFilterContext> = {}
): ReportCardGradeFilterContext {
  return {
    classSubjects: [{ id: 'subj-1', name: 'Mathematics' }],
    subjectTeacherMap: new Map([['subj-1', new Set(['teacher-a'])]]),
    adminUserIds: new Set(['admin-1']),
    ...overrides,
  }
}

describe('shouldIncludeReportCardGrade', () => {
  it('always includes office practice', () => {
    const filterCtx = ctx({
      classSubjects: [],
      subjectTeacherMap: new Map(),
    })
    assert.equal(
      shouldIncludeReportCardGrade('Office Practice', 'unknown', filterCtx),
      true
    )
  })

  it('includes grades entered by admin users', () => {
    assert.equal(
      shouldIncludeReportCardGrade('Mathematics', 'admin-1', ctx()),
      true
    )
  })

  it('excludes grades when subject cannot be resolved', () => {
    assert.equal(
      shouldIncludeReportCardGrade('Unknown Subject', 'teacher-a', ctx()),
      false
    )
  })

  it('includes when no teacher assignments exist', () => {
    assert.equal(
      shouldIncludeReportCardGrade(
        'Mathematics',
        'teacher-z',
        ctx({ subjectTeacherMap: new Map() })
      ),
      true
    )
  })
})

describe('shouldIncludeReportCardBranchGrade', () => {
  it('excludes when branch subject id is missing', () => {
    assert.equal(
      shouldIncludeReportCardBranchGrade('', 'teacher-a', ctx()),
      false
    )
  })

  it('includes when no teachers are assigned to the subject', () => {
    assert.equal(
      shouldIncludeReportCardBranchGrade(
        'subj-1',
        'teacher-z',
        ctx({ subjectTeacherMap: new Map() })
      ),
      true
    )
  })
})
