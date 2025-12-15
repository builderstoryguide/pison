// =====================================================
// Subject Branches System - TypeScript Interfaces
// =====================================================

export interface SubjectBranch {
  id: string
  branch_id: string
  subject_id: string
  branch_name: string
  branch_code: string
  description: string | null
  weight_percentage: number
  is_optional: boolean
  is_active: boolean
  academic_year: string
  term: string | null
  created_at: string
  updated_at: string
}

export interface TeacherBranchAssignment {
  id: string
  teacher_id: string
  branch_id: string
  class_id: string
  academic_year: string
  term: string | null
  is_primary_teacher: boolean
  assigned_at: string
  created_at: string
  updated_at: string
}

export interface StudentBranchEnrollment {
  id: string
  student_id: string
  branch_id: string
  class_id: string
  academic_year: string
  term: string | null
  enrollment_status: 'enrolled' | 'dropped' | 'completed'
  enrolled_at: string
  created_at: string
  updated_at: string
}

export interface BranchAssessment {
  id: string
  assessment_id: string
  branch_id: string
  teacher_id: string
  class_id: string
  title: string
  description: string | null
  type: 'quiz' | 'test' | 'exam' | 'assignment' | 'project' | 'practical'
  total_marks: number
  passing_marks: number
  weight_percentage: number
  assessment_date: string
  due_date: string | null
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'archived'
  is_graded: boolean
  academic_year: string
  term: string | null
  created_at: string
  updated_at: string
}

export interface BranchGrade {
  id: string
  grade_id: string
  assessment_id: string
  student_id: string
  teacher_id: string
  branch_id: string
  marks_obtained: number
  percentage: number
  grade_letter: string
  grade_point: number | null
  remarks: string | null
  feedback: string | null
  is_late: boolean
  is_absent: boolean
  is_excused: boolean
  submitted_at: string
  // graded_at field removed - column doesn't exist in database, use created_at instead
  created_at: string
  updated_at: string
}

export interface AggregatedSubjectGrade {
  id: string
  grade_id: string
  student_id: string
  subject_id: string
  class_id: string
  total_marks: number
  total_possible_marks: number
  final_percentage: number
  final_grade_letter: string
  final_grade_point: number | null
  branch_breakdown: Record<string, BranchBreakdown>
  academic_year: string
  term: string | null
  calculated_at: string
  created_at: string
  updated_at: string
}

export interface BranchBreakdown {
  branch_name: string
  weight_percentage: number
  average_percentage: number
  assessment_count: number
}

// =====================================================
// Extended Interfaces with Related Data
// =====================================================

export interface SubjectBranchWithDetails extends SubjectBranch {
  subject: {
    id: string
    subject_name: string
    subject_code: string
    subsystem: string
  }
  teachers: Array<{
    id: string
    teacher_id: string
    first_name: string
    last_name: string
    email: string
    is_primary_teacher: boolean
  }>
  enrolled_students_count: number
}

export interface TeacherBranchAssignmentWithDetails extends TeacherBranchAssignment {
  teacher: {
    id: string
    teacher_id: string
    first_name: string
    last_name: string
    email: string
  }
  branch: {
    id: string
    branch_name: string
    branch_code: string
    subject_id: string
  }
  subject: {
    id: string
    subject_name: string
    subject_code: string
  }
  class: {
    id: string
    class_name: string
    class_level: string
  }
}

export interface StudentBranchEnrollmentWithDetails extends StudentBranchEnrollment {
  student: {
    id: string
    student_id: string
    first_name: string
    last_name: string
    email: string
  }
  branch: {
    id: string
    branch_name: string
    branch_code: string
    subject_id: string
  }
  subject: {
    id: string
    subject_name: string
    subject_code: string
  }
  class: {
    id: string
    class_name: string
    class_level: string
  }
}

export interface BranchAssessmentWithDetails extends BranchAssessment {
  branch: {
    id: string
    branch_name: string
    branch_code: string
    subject_id: string
  }
  subject: {
    id: string
    subject_name: string
    subject_code: string
  }
  teacher: {
    id: string
    teacher_id: string
    first_name: string
    last_name: string
  }
  class: {
    id: string
    class_name: string
    class_level: string
  }
  grades_count: number
  average_grade: number | null
}

export interface BranchGradeWithDetails extends BranchGrade {
  assessment: {
    id: string
    title: string
    type: string
    total_marks: number
    assessment_date: string
  }
  student: {
    id: string
    student_id: string
    first_name: string
    last_name: string
  }
  teacher: {
    id: string
    teacher_id: string
    first_name: string
    last_name: string
  }
  branch: {
    id: string
    branch_name: string
    branch_code: string
  }
}

// =====================================================
// Request/Response Types
// =====================================================

export interface CreateSubjectBranchRequest {
  subject_id: string
  branch_name: string
  branch_code: string
  description?: string
  weight_percentage: number
  is_optional?: boolean
  academic_year: string
  term?: string
}

export interface UpdateSubjectBranchRequest {
  branch_name?: string
  branch_code?: string
  description?: string
  weight_percentage?: number
  is_optional?: boolean
  is_active?: boolean
}

export interface AssignTeacherToBranchRequest {
  teacher_id: string
  branch_id: string
  class_id: string
  academic_year: string
  term?: string
  is_primary_teacher?: boolean
}

export interface EnrollStudentInBranchRequest {
  student_id: string
  branch_id: string
  class_id: string
  academic_year: string
  term?: string
}

export interface CreateBranchAssessmentRequest {
  branch_id: string
  teacher_id: string
  class_id: string
  title: string
  description?: string
  type: 'quiz' | 'test' | 'exam' | 'assignment' | 'project' | 'practical'
  total_marks: number
  passing_marks?: number
  weight_percentage?: number
  assessment_date: string
  due_date?: string
  academic_year: string
  term?: string
}

export interface GradeBranchAssessmentRequest {
  assessment_id: string
  student_id: string
  teacher_id: string
  marks_obtained: number
  remarks?: string
  feedback?: string
  is_late?: boolean
  is_absent?: boolean
  is_excused?: boolean
}

// =====================================================
// API Response Types
// =====================================================

export interface SubjectBranchesResponse {
  success: boolean
  branches: SubjectBranchWithDetails[]
  total: number
  error?: string
}

export interface TeacherBranchAssignmentsResponse {
  success: boolean
  assignments: TeacherBranchAssignmentWithDetails[]
  total: number
  error?: string
}

export interface StudentBranchEnrollmentsResponse {
  success: boolean
  enrollments: StudentBranchEnrollmentWithDetails[]
  total: number
  error?: string
}

export interface BranchAssessmentsResponse {
  success: boolean
  assessments: BranchAssessmentWithDetails[]
  total: number
  error?: string
}

export interface BranchGradesResponse {
  success: boolean
  grades: BranchGradeWithDetails[]
  total: number
  error?: string
}

export interface AggregatedGradesResponse {
  success: boolean
  grades: AggregatedSubjectGrade[]
  total: number
  error?: string
}

// =====================================================
// Utility Types
// =====================================================

export interface GradeCalculationResult {
  total_marks: number
  total_possible_marks: number
  final_percentage: number
  final_grade_letter: string
  final_grade_point: number
  branch_breakdown: Record<string, BranchBreakdown>
}

export interface SubjectBranchSummary {
  subject_id: string
  subject_name: string
  subject_code: string
  branches: Array<{
    branch_id: string
    branch_name: string
    branch_code: string
    weight_percentage: number
    is_optional: boolean
    enrolled_students_count: number
    teachers_count: number
  }>
  total_enrolled_students: number
  total_teachers: number
}

export interface StudentSubjectProgress {
  student_id: string
  subject_id: string
  subject_name: string
  enrolled_branches: Array<{
    branch_id: string
    branch_name: string
    branch_code: string
    weight_percentage: number
    average_grade: number | null
    assessment_count: number
  }>
  final_grade: AggregatedSubjectGrade | null
  progress_percentage: number
}
