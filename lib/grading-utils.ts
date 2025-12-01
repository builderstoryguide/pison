/**
 * Grading Utilities
 * 
 * Pure functions for grade calculations, validation, and processing.
 * These functions have no dependencies on React or external state.
 */

export interface GradeEntry {
  studentId: number
  mark: number | string
  coefficient: number
  totalMarks: number
  grade: string
  rank: number
  remarks: string
}

export interface StudentWithMarks {
  studentId: number
  totalMarks: number
}

/**
 * Calculate letter grade based on numerical mark
 * @param mark - Numerical mark (typically 0-20 or 0-10)
 * @returns Letter grade (A, B, C, D, or U)
 */
export function calculateGrade(mark: number): string {
  if (mark >= 17) return 'A'
  if (mark > 14 && mark < 17) return 'B'
  if (mark >= 10 && mark < 14) return 'C'
  if (mark >= 7 && mark < 10) return 'D'
  return 'U'
}

/**
 * Get descriptive remarks for a letter grade
 * @param grade - Letter grade (A, B, C, D, or U)
 * @returns Descriptive remark
 */
export function getGradeRemarks(grade: string): string {
  switch (grade) {
    case 'A': return 'Excellent'
    case 'B': return 'V.good'
    case 'C': return 'Pass'
    case 'D': return 'Failed'
    case 'U': return 'Very weak'
    default: return ''
  }
}

/**
 * Calculate total marks by applying coefficient
 * @param mark - Raw mark
 * @param coefficient - Subject coefficient
 * @returns Total marks (mark × coefficient)
 */
export function calculateTotalMarks(mark: number, coefficient: number): number {
  return mark * coefficient
}

/**
 * Validate a mark against maximum allowed marks
 * @param mark - Mark to validate (can be string or number)
 * @param maxMarks - Maximum allowed marks (typically 20 or 10)
 * @returns True if valid, false otherwise
 */
export function validateMark(mark: string | number, maxMarks: number): boolean {
  if (!mark && mark !== 0) return true // Empty is valid (not required)
  
  const numMark = typeof mark === 'number' ? mark : parseFloat(mark)
  return !isNaN(numMark) && numMark >= 0 && numMark <= maxMarks
}

/**
 * Calculate ranks for all students based on their total marks
 * Handles ties by assigning the same rank to students with equal marks
 * 
 * @param allGrades - Record of all grade entries by student ID
 * @param coefficient - Default coefficient to use if not specified in entry
 * @returns Record mapping student IDs to their ranks
 */
export function calculateRanks(
  allGrades: Record<number, GradeEntry>,
  coefficient: number
): Record<number, number> {
  // Get all students with marks
  const studentsWithMarks: StudentWithMarks[] = Object.entries(allGrades)
    .filter(([_, entry]) => entry.mark !== '' && entry.mark !== undefined)
    .map(([studentId, entry]) => {
      const markValue = typeof entry.mark === 'number' 
        ? entry.mark 
        : parseFloat(entry.mark as string) || 0
      
      return {
        studentId: parseInt(studentId),
        totalMarks: calculateTotalMarks(
          markValue,
          entry.coefficient || coefficient
        )
      }
    })
    .sort((a, b) => b.totalMarks - a.totalMarks) // Sort descending

  // Assign ranks (handle ties)
  const ranks: Record<number, number> = {}
  let currentRank = 1
  
  for (let i = 0; i < studentsWithMarks.length; i++) {
    if (i > 0 && studentsWithMarks[i].totalMarks < studentsWithMarks[i - 1].totalMarks) {
      currentRank = i + 1
    }
    ranks[studentsWithMarks[i].studentId] = currentRank
  }

  return ranks
}

/**
 * Process a single grade entry with calculations
 * @param mark - Raw mark
 * @param coefficient - Subject coefficient
 * @returns Calculated grade, total marks, and remarks
 */
export function processGradeEntry(mark: number, coefficient: number) {
  const totalMarks = calculateTotalMarks(mark, coefficient)
  const grade = calculateGrade(mark)
  const remarks = getGradeRemarks(grade)
  
  return {
    totalMarks,
    grade,
    remarks
  }
}

/**
 * Validate all grade entries
 * @param grades - Record of all grade entries
 * @param maxMarks - Maximum allowed marks
 * @returns Validation result with any errors
 */
export function validateAllGrades(
  grades: Record<number, GradeEntry>,
  maxMarks: number
): { valid: boolean; invalidCount: number; message?: string } {
  const invalidMarks = Object.values(grades).filter(
    entry => entry.mark && entry.mark !== '' && !validateMark(entry.mark, maxMarks)
  )

  if (invalidMarks.length > 0) {
    return {
      valid: false,
      invalidCount: invalidMarks.length,
      message: `${invalidMarks.length} mark(s) are invalid. Marks must be between 0 and ${maxMarks}.`
    }
  }

  return { valid: true, invalidCount: 0 }
}

/**
 * Count how many grades have been entered
 * @param grades - Record of all grade entries
 * @returns Count of entered grades
 */
export function countEnteredGrades(grades: Record<number, GradeEntry>): number {
  return Object.values(grades).filter(entry => entry.mark && entry.mark !== '').length
}
