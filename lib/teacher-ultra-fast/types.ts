// Ultra-fast teacher system types and interfaces
export interface TeacherProfile {
  id: string
  teacherId: string
  name: string
  email: string
  phone?: string
  photo?: string
  subsystem: 'english' | 'french'
  employmentType: 'full-time' | 'part-time' | 'contract'
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastLoginAt?: string
}

export interface TeacherClass {
  id: string
  name: string
  level: string
  subsystem: 'english' | 'french'
  branch: 'grammar' | 'technical' | 'commercial'
  code?: string
  academicYear: string
  capacity: number
  currentEnrollment: number
  room?: string
  students: TeacherClassStudent[]
  subjects: ClassSubject[]
  schedule: ClassSchedule[]
  assignments: ClassAssignment[]
  performance: ClassPerformance
}

export interface TeacherClassStudent {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  photo?: string
  enrollmentStatus: 'enrolled' | 'pending' | 'transferred' | 'dropped'
  enrollmentDate: string
  phone?: string
  parentName?: string
  parentPhone?: string
  parentEmail?: string
  grades: StudentGrades
}

export interface ClassSubject {
  id: string
  name: string
  code: string
  coefficient: number
  description?: string
  teacherId: string
  isPrimary: boolean
  schedule: SubjectSchedule[]
}

export interface ClassSchedule {
  id: string
  day: string
  startTime: string
  endTime: string
  subject: string
  subjectId: string
  room?: string
  period: string
  isActive: boolean
}

export interface SubjectSchedule {
  id: string
  day: string
  startTime: string
  endTime: string
  room?: string
  period: string
}

export interface ClassAssignment {
  id: string
  teacherId: string
  branchId: string
  classId: string
  subjectId: string
  isPrimary: boolean
  academicYear: string
  term: string
  createdAt: string
}

export interface ClassPerformance {
  averageGrade: number
  totalAssessments: number
  completedAssessments: number
  lastActivity: string
}


export interface StudentGrades {
  totalAssessments: number
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  gradeDistribution: Record<string, number>
  lastGrade: string
}


export interface Assessment {
  id: string
  title: string
  type: 'quiz' | 'test' | 'exam' | 'assignment' | 'project'
  subjectId: string
  subjectName: string
  classId: string
  className: string
  totalMarks: number
  date: string
  dueDate?: string
  description?: string
  status: 'draft' | 'published' | 'completed'
  createdAt: string
  publishedAt?: string
  completedAt?: string
  statistics: AssessmentStatistics
}

export interface AssessmentStatistics {
  totalStudents: number
  submittedCount: number
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  passRate: number
  gradeDistribution: Record<string, number>
}

export interface Grade {
  id: string
  assessmentId: string
  studentId: string
  studentName: string
  marks: number
  percentage: number
  grade: string
  remarks?: string
  submittedAt: string
  gradedAt: string
}

export interface TeacherDataState {
  // Core teacher info
  teacher: TeacherProfile
  
  // Unified data with smart caching
  classes: Record<string, TeacherClass>
  students: Record<string, TeacherClassStudent>
  subjects: Record<string, ClassSubject>
  assignments: Record<string, ClassAssignment>
  
  // Real-time data
  grades: GradesData
  assessments: AssessmentsData
  
  // Performance metrics
  performance: PerformanceMetrics
  
  // Cache metadata
  cache: CacheMetadata
}


export interface GradesData {
  assessments: Record<string, Assessment>
  grades: Record<string, Grade>
  statistics: GradesStatistics
  lastUpdated: string
}

export interface GradesStatistics {
  totalAssessments: number
  totalGrades: number
  averageGrade: number
  pendingGrades: number
  completedAssessments: number
}

export interface AssessmentsData {
  assessments: Record<string, Assessment>
  statistics: AssessmentStatistics
  lastUpdated: string
}

export interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  cacheHitRate: number
  dataFreshness: number
  userInteractions: number
  apiResponseTime: number
  memoryUsage: number
}

export interface CacheMetadata {
  version: string
  lastUpdated: string
  ttl: number
  hits: number
  misses: number
  size: number
}

// API Response types
export type TeacherDataResponse = 
  | {
      success: true
      data: TeacherDataState
      performance: {
        totalTime: number
        cacheHit: boolean
        source: 'memory' | 'indexeddb' | 'server' | 'database'
        timestamp: string
      }
    }
  | {
      success: false
      error: string
    }

export interface CacheOperation {
  type: 'get' | 'set' | 'delete' | 'clear'
  key: string
  data?: any
  ttl?: number
  timestamp: number
}

// Real-time update types
export interface RealTimeUpdate {
  type: 'grades' | 'assessments' | 'classes' | 'students' | 'heartbeat'
  action: 'create' | 'update' | 'delete'
  data: any
  timestamp: string
}

// Performance monitoring types
export interface PerformanceEvent {
  type: 'load' | 'render' | 'api' | 'cache' | 'user_interaction' | 'memory'
  duration: number
  metadata: Record<string, any>
  timestamp: string
}

// Optimization types
export interface OptimizationConfig {
  enableVirtualScrolling: boolean
  enablePrefetching: boolean
  enableOfflineMode: boolean
  enableRealTimeUpdates: boolean
  cacheStrategy: 'aggressive' | 'balanced' | 'conservative'
  maxCacheSize: number
  ttl: number
}
