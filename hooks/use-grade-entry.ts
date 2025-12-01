"use client"

import { useState, useCallback } from 'react'
import {
  GradeEntry,
  calculateGrade,
  calculateTotalMarks,
  calculateRanks,
  getGradeRemarks,
  validateMark,
  validateAllGrades,
  countEnteredGrades
} from '@/lib/grading-utils'

interface Student {
  id: number
  [key: string]: unknown
}

interface UseGradeEntryResult {
  grades: Record<number, GradeEntry>
  updateGrade: (studentId: number, mark: string | number) => void
  updateRemarks: (studentId: number, remarks: string) => void
  clearAll: () => void
  validate: () => { valid: boolean; invalidCount: number; message?: string }
  enteredCount: number
  getGradesForSubmission: () => GradeEntry[]
}

/**
 * Custom hook to manage grade entry state and calculations
 * 
 * This hook encapsulates all the logic for:
 * - Storing grade entries
 * - Calculating grades, total marks, and ranks
 * - Validating input
 * - Preparing data for submission
 * 
 * @param students - Array of students
 * @param coefficient - Subject coefficient
 * @param maxMarks - Maximum marks (20 for subjects, 10 for branches)
 * @returns Grade management functions and state
 */
export function useGradeEntry(
  students: Student[],
  coefficient: number,
  maxMarks: number
): UseGradeEntryResult {
  const [grades, setGrades] = useState<Record<number, GradeEntry>>({})

  /**
   * Update a student's grade and recalculate all derived values
   */
  const updateGrade = useCallback((studentId: number, mark: string | number) => {
    setGrades(prev => {
      const updatedGrades = { ...prev }

      // Validate mark
      if (!validateMark(mark, maxMarks) && mark !== '' && mark !== 0) {
        return prev // Don't update if invalid
      }

      // If mark is empty, initialize empty entry
      if (mark === '' || mark === null || mark === undefined) {
        updatedGrades[studentId] = {
          studentId,
          mark: '',
          coefficient,
          totalMarks: 0,
          grade: '',
          rank: 0,
          remarks: ''
        }
        return updatedGrades
      }

      // Parse mark
      const numMark = typeof mark === 'number' ? mark : parseFloat(mark as string)

      // Calculate derived values
      const totalMarks = calculateTotalMarks(numMark, coefficient)
      const grade = calculateGrade(numMark)
      const remarks = getGradeRemarks(grade)

      updatedGrades[studentId] = {
        studentId,
        mark: numMark,
        coefficient,
        totalMarks,
        grade,
        rank: 0, // Will be calculated below
        remarks
      }

      // Recalculate all ranks
      const ranks = calculateRanks(updatedGrades, coefficient)
      Object.keys(ranks).forEach(id => {
        const studentIdNum = parseInt(id)
        if (updatedGrades[studentIdNum]) {
          updatedGrades[studentIdNum].rank = ranks[studentIdNum]
        }
      })

      return updatedGrades
    })
  }, [coefficient, maxMarks])

  /**
   * Update a student's remarks
   */
  const updateRemarks = useCallback((studentId: number, remarks: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {
          studentId,
          mark: '',
          coefficient,
          totalMarks: 0,
          grade: '',
          rank: 0,
          remarks: ''
        }),
        remarks
      }
    }))
  }, [coefficient])

  /**
   * Clear all grades
   */
  const clearAll = useCallback(() => {
    setGrades({})
  }, [])

  /**
   * Validate all grades
   */
  const validate = useCallback(() => {
    return validateAllGrades(grades, maxMarks)
  }, [grades, maxMarks])

  /**
   * Get count of entered grades
   */
  const enteredCount = countEnteredGrades(grades)

  /**
   * Get grades ready for submission (filter out empty ones)
   */
  const getGradesForSubmission = useCallback(() => {
    return Object.values(grades).filter(entry => entry.mark && entry.mark !== '')
  }, [grades])

  return {
    grades,
    updateGrade,
    updateRemarks,
    clearAll,
    validate,
    enteredCount,
    getGradesForSubmission
  }
}
