"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Trash2, Save, Loader2, AlertCircle } from "lucide-react"
import { StudentGradeRow } from "./student-grade-row"
import { GradeEntry } from "@/lib/grading-utils"

interface Student {
  id: number | string
  studentId: string
  firstName: string
  lastName: string
  [key: string]: unknown
}

interface StudentGradesTableProps {
  students: Student[]
  grades: Record<string | number, GradeEntry>
  maxMarks: number
  coefficient: number
  enteredCount: number
  onMarkChange: (studentId: number | string, mark: string) => void
  onRemarksChange: (studentId: number | string, remarks: string) => void
  onClearAll: () => void
  onSubmit: () => void
  isSubmitting: boolean
  isLoading: boolean
}

/**
 * Component displaying the grades entry table with all students
 * 
 * Features:
 * - Displays all students in a table
 * - Allows mark and remarks entry
 * - Shows calculated fields (grade, rank, total)
 * - Bulk actions (Clear All, Submit)
 */
export function StudentGradesTable({
  students,
  grades,
  maxMarks,
  coefficient,
  enteredCount,
  onMarkChange,
  onRemarksChange,
  onClearAll,
  onSubmit,
  isSubmitting,
  isLoading
}: StudentGradesTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>
              Enter grades for {students.length} students ({enteredCount} entered)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClearAll}
              disabled={isSubmitting || enteredCount === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting || enteredCount === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit Grades
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No students found in this class</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">
                    Mark (0-{maxMarks})
                  </TableHead>
                  <TableHead className="w-[100px]">Coefficient</TableHead>
                  <TableHead className="w-[100px]">Total Marks</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => {
                  const gradeEntry = grades[student.id] || {
                    studentId: student.id,
                    mark: '',
                    coefficient,
                    totalMarks: 0,
                    grade: '',
                    rank: 0,
                    remarks: ''
                  }

                  return (
                    <StudentGradeRow
                      key={`student-${student.id}-${index}`}
                      student={student}
                      index={index}
                      gradeEntry={gradeEntry}
                      onMarkChange={onMarkChange}
                      onRemarksChange={onRemarksChange}
                      maxMarks={maxMarks}
                      disabled={isSubmitting}
                    />
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
