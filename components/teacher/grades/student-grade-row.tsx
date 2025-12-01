"use client"

import { TableCell, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { GradeEntry } from "@/lib/grading-utils"

interface Student {
  id: number
  studentId: string
  firstName: string
  lastName: string
  [key: string]: unknown
}

interface StudentGradeRowProps {
  student: Student
  index: number
  gradeEntry: GradeEntry
  onMarkChange: (studentId: number, mark: string) => void
  onRemarksChange: (studentId: number, remarks: string) => void
  maxMarks: number
  disabled?: boolean
}

/**
 * Component representing a single student row in the grades entry table
 * 
 * Handles:
 * - Displaying student info
 * - Mark input with validation
 * - Auto-calculated fields (coefficient, total, grade, rank)
 * - Remarks input
 */
export function StudentGradeRow({
  student,
  index,
  gradeEntry,
  onMarkChange,
  onRemarksChange,
  maxMarks,
  disabled = false
}: StudentGradeRowProps) {
  return (
    <TableRow>
      {/* Row Number */}
      <TableCell className="font-medium">{index + 1}</TableCell>

      {/* Student ID */}
      <TableCell>{student.studentId}</TableCell>

      {/* Student Name */}
      <TableCell>
        {student.firstName} {student.lastName}
      </TableCell>

      {/* Mark Input */}
      <TableCell>
        <Input
          type="number"
          min="0"
          max={maxMarks}
          step="0.5"
          value={gradeEntry.mark}
          onChange={(e) => onMarkChange(student.id, e.target.value)}
          placeholder="0"
          className="w-full"
          disabled={disabled}
        />
      </TableCell>

      {/* Coefficient (read-only) */}
      <TableCell className="text-center">
        {gradeEntry.coefficient.toFixed(1)}
      </TableCell>

      {/* Total Marks (calculated) */}
      <TableCell className="text-center font-medium">
        {gradeEntry.totalMarks ? gradeEntry.totalMarks.toFixed(2) : '-'}
      </TableCell>

      {/* Grade (calculated) */}
      <TableCell className="text-center">
        <span className={`font-semibold ${getGradeColor(gradeEntry.grade)}`}>
          {gradeEntry.grade || '-'}
        </span>
      </TableCell>

      {/* Rank (calculated) */}
      <TableCell className="text-center">
        {gradeEntry.rank || '-'}
      </TableCell>

      {/* Remarks */}
      <TableCell>
        <Input
          type="text"
          value={gradeEntry.remarks}
          onChange={(e) => onRemarksChange(student.id, e.target.value)}
          placeholder="Auto"
          className="w-full"
          disabled={disabled}
        />
      </TableCell>
    </TableRow>
  )
}

/**
 * Get color class for grade letter
 */
function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-green-600 dark:text-green-400'
    case 'B': return 'text-blue-600 dark:text-blue-400'
    case 'C': return 'text-yellow-600 dark:text-yellow-400'
    case 'D': return 'text-orange-600 dark:text-orange-400'
    case 'U': return 'text-red-600 dark:text-red-400'
    default: return 'text-muted-foreground'
  }
}
