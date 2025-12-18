// Types for Admin Marks Tracking Feature

export interface MarksTrackingSummary {
  totalTeachers: number
  teachersFilled: number
  teachersPending: number
  totalSubjects: number
  subjectsFilled: number
  totalClasses: number
  classesFilled: number
}

export interface TeacherMarksStatus {
  teacherId: string
  teacherName: string
  teacherEmail?: string
  subjectsCount: number
  classesCount: number
  totalMarksEntered: number
  lastEntryDate?: string
}

export interface TeacherPendingStatus {
  teacherId: string
  teacherName: string
  teacherEmail?: string
  expectedSubjects: Array<{
    subjectId: string
    subjectName: string
    branchId?: string
    branchName?: string
  }>
  expectedClasses: Array<{
    classId: string
    className: string
  }>
}

export interface SubjectClassBreakdown {
  subjectId: string
  subjectName: string
  branchId?: string
  branchName?: string
  classes: Array<{
    classId: string
    className: string
    teacherId?: string
    teacherName?: string
    marksCount: number
    lastEntryDate?: string
  }>
}

export interface ClassSubjectBreakdown {
  classId: string
  className: string
  subjects: Array<{
    subjectId: string
    subjectName: string
    branchId?: string
    branchName?: string
    teacherId?: string
    teacherName?: string
    marksCount: number
    lastEntryDate?: string
  }>
}

export interface MarksTrackingResponse {
  success: boolean
  error?: string
  summary: MarksTrackingSummary
  teachers: {
    filled: TeacherMarksStatus[]
    pending: TeacherPendingStatus[]
  }
  subjects: SubjectClassBreakdown[]
  classes: ClassSubjectBreakdown[]
}

