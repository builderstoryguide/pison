// Shared type definitions for report card components

export interface SubjectGrade {
  subjectName: string
  subjectId?: string
  coefficient: number
  sequences?: {
    seq1?: number
    seq2?: number
    seq3?: number
    seq4?: number
    seq5?: number
    seq6?: number
  }
  termAverages?: {
    term1?: number
    term2?: number
    term3?: number
  }
  seq1?: number
  seq2?: number
  seq3?: number
  seq4?: number
  termAverage?: number
  term1?: number
  term2?: number
  term3?: number
  annualAverage?: number
  grade?: string
  rank?: number
  remarks?: string
}

export interface StudentInfo {
  id: string
  studentId: string
  name: string
  firstName?: string
  lastName?: string
  sex: string
  dob: string
  pob: string
  class: string
  className: string
  classMaster?: string
  enrollment: number
  photoUrl?: string
  speciality?: string
}

export interface AcademicInfo {
  year: string
  term: number | 'annual' | 1 | 2 | 3
  orderNo: string
}

export interface StatsInfo {
  classSize: number
  maxAvg: number
  minAvg: number
  passed: number
  passPercent: number
  classAvg: number
  max?: number
  min?: number
  percent?: number
}

export interface DisciplineInfo {
  absences: number
  suspensions: number
  warnings: number
}

export interface HistoryInfo {
  term1?: number
  term2?: number
  term3?: number
  annualAvg?: number
  rank?: number
}

export interface ReportCardData {
  student: StudentInfo
  academic: AcademicInfo
  subjects: SubjectGrade[]
  totals: {
    coefficient: number
    totalScore: number
    average: number
    coef?: number
    score?: number
  }
  history: HistoryInfo
  stats: StatsInfo
  discipline: DisciplineInfo
  watermarkUrl?: string
}
// Legacy format for PisonReportCard (grouped subjects)
export interface PisonSubjectSection {
  title: string
  items: Array<{
    name: string
    eval: number
    coef: number
    total: number
    grade: string
    rank: number
    remark: string
  }>
  summary: {
    coef: number
    total: number
    avg: number
    rank: number
    remark: string
  }
}

export interface PisonReportCardData {
  student: StudentInfo
  academic: AcademicInfo
  subjects: {
    [key: string]: PisonSubjectSection
  }
  totals: {
    coef: number
    score: number
    average?: number
  }
  history: HistoryInfo
  stats: StatsInfo
  watermarkUrl?: string
}
