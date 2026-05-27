import { subjectNamesMatch, normalizeSubjectName } from '@/lib/report-card-subject-matching'

export interface ClassSubjectRef {
  id: string
  name: string
}

export interface ReportCardGradeFilterContext {
  classSubjects: ClassSubjectRef[]
  subjectTeacherMap: Map<string, Set<string>>
  adminUserIds: Set<string>
}

function resolveSubjectIdForAssessment(
  assessSubject: string,
  classSubjects: ClassSubjectRef[]
): string | null {
  for (const subj of classSubjects) {
    if (subjectNamesMatch(subj.name, assessSubject)) {
      return subj.id
    }
  }
  return null
}

/**
 * Same inclusion rules as report-card marks: office practice, admin teachers,
 * and relaxed handling when assignments are missing.
 */
export function shouldIncludeReportCardGrade(
  assessSubject: string,
  assessTeacherId: string | null | undefined,
  ctx: ReportCardGradeFilterContext
): boolean {
  try {
    const normalizedSubject = normalizeSubjectName(assessSubject)
    if (
      normalizedSubject.includes('office practice') ||
      normalizedSubject === 'office practice'
    ) {
      return true
    }

    if (assessTeacherId && ctx.adminUserIds.has(assessTeacherId)) {
      return true
    }

    if (ctx.subjectTeacherMap.size === 0) {
      return true
    }

    const matchingSubjectId = resolveSubjectIdForAssessment(assessSubject, ctx.classSubjects)
    if (!matchingSubjectId) {
      return false
    }

    const assignedTeachers = ctx.subjectTeacherMap.get(matchingSubjectId)
    if (!assignedTeachers || assignedTeachers.size === 0) {
      return true
    }

    if (assessTeacherId && !assignedTeachers.has(assessTeacherId)) {
      return true
    }

    return true
  } catch {
    return false
  }
}

export function shouldIncludeReportCardBranchGrade(
  branchSubjectId: string,
  assessTeacherId: string | null | undefined,
  ctx: ReportCardGradeFilterContext
): boolean {
  if (!branchSubjectId) return false

  if (ctx.subjectTeacherMap.size === 0) {
    return true
  }

  const assignedTeachers = ctx.subjectTeacherMap.get(branchSubjectId)
  if (!assignedTeachers || assignedTeachers.size === 0) {
    return true
  }

  if (assessTeacherId && !assignedTeachers.has(assessTeacherId)) {
    return true
  }

  return true
}
