"use client"

import { TeacherGradesEntryRefactored } from "./teacher-grades-entry-refactored"

interface GradesManagementProps {
  preSelectedClassId?: string
}

export function GradesManagement({ preSelectedClassId }: GradesManagementProps = {}) {
  return <TeacherGradesEntryRefactored preSelectedClassId={preSelectedClassId} />
}

