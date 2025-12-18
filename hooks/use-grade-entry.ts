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
  id: number | string
  [key: string]: unknown
}

interface UseGradeEntryResult {
  grades: Record<string | number, GradeEntry>
  updateGrade: (studentId: number | string, mark: string | number) => void
  updateRemarks: (studentId: number | string, remarks: string) => void
  clearAll: () => void
  validate: () => { valid: boolean; invalidCount: number; message?: string }
  enteredCount: number
  getGradesForSubmission: () => GradeEntry[]
  setInitialGrades: (entries: GradeEntry[]) => void
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
  _students: Student[],
  coefficient: number,
  maxMarks: number
): UseGradeEntryResult {
  const [grades, setGrades] = useState<Record<string | number, GradeEntry>>({})

  /**
   * Update a student's grade and recalculate all derived values
   */
  const updateGrade = useCallback((studentId: number | string, mark: string | number) => {
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
        // Since id comes from keys, it is string. But rank map might have nuumber keys if ID was number.
        // But calculateRanks returns Record<string|number, number>.
        // Safest is to rely on updatedGrades[id] existence.
        // However, if ID is number `1`, key is `"1"`.
        // If ranks uses number `1` as key.
        // `ranks["1"]` works for number key in JS.
        // So we can just use the key.
        if (updatedGrades[id]) {
          updatedGrades[id].rank = ranks[id]
        }
      })

      return updatedGrades
    })
  }, [coefficient, maxMarks])

  /**
   * Update a student's remarks
   */
  const updateRemarks = useCallback((studentId: number | string, remarks: string) => {
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

  /**
   * Initialize/Bulk set grades (e.g. from database)
   */
  const setInitialGrades = useCallback((entries: GradeEntry[]) => {
    setGrades(prev => {
      const newGrades = { ...prev }
      entries.forEach(entry => {
        const numMark = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
        const isValidMark = typeof entry.mark === 'number' || (typeof entry.mark === 'string' && !isNaN(parseFloat(entry.mark)))
        newGrades[entry.studentId] = {
           ...entry,
           totalMarks: isValidMark ? calculateTotalMarks(numMark, coefficient) : 0,
           grade: isValidMark ? calculateGrade(numMark) : '',
           rank: 0 // Will be calculated below
        }
      })

      // Recalculate ranks
      const ranks = calculateRanks(newGrades, coefficient)
      Object.keys(ranks).forEach(id => {
        if (newGrades[id]) {
          newGrades[id].rank = ranks[id]
        }
      })

      return newGrades
    })
  }, [coefficient])
  return {
    grades,
    updateGrade,
    updateRemarks,
    clearAll,
    validate,
    enteredCount,
    getGradesForSubmission,
    setInitialGrades
  }
}
