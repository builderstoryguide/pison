"use client"

import { TeacherGradesEntry } from "./teacher-grades-entry"

interface GradesManagementProps {
  preSelectedClassId?: string
}

export function GradesManagement({ preSelectedClassId }: GradesManagementProps = {}) {
  return <TeacherGradesEntry preSelectedClassId={preSelectedClassId} />
}

