"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Save, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { calculateGrade, getGradeRemarks } from "@/lib/grading-utils"

interface GradeViewEditProps {
  assessmentId: string
  classId: string
  subject: string
  sequence: string
  className: string
  onBack: () => void
}

interface StudentGrade {
  id: string // grade ID
  studentId: string
  studentName: string
  marks: string
  coefficient: number
  total: number
  grade: string
  rank?: number
  remarks: string
}

export function GradeViewEdit({ 
  assessmentId, 
  classId, 
  subject, 
  sequence, 
  className,
  onBack 
}: GradeViewEditProps) {
  const { user } = useAuth()
  const [students, setStudents] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [subjectCoefficient, setSubjectCoefficient] = useState(1)

  useEffect(() => {
    fetchGrades()
  }, [assessmentId])

  const fetchGrades = async () => {
    try {
      setLoading(true)
      
      // Fetch the grades for this assessment
      const response = await fetch(`/api/grades/${assessmentId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch grades')
      }

      const data = await response.json()
      
      if (data.success) {
        setSubjectCoefficient(data.coefficient || 1)
        setStudents(data.grades.map((g: any) => ({
          id: g.id,
          studentId: g.student_id,
          studentName: g.student_name,
          marks: g.marks_obtained.toString(),
          coefficient: data.coefficient || 1,
          total: g.marks_obtained * (data.coefficient || 1),
          grade: g.grade_letter,
          rank: g.rank,
          remarks: g.remarks
        })))
      }
    } catch (error) {
      console.error("Error fetching grades:", error)
      toast.error("Failed to load grades")
    } finally {
      setLoading(false)
    }
  }

  const calculateRemarks = getGradeRemarks

  // Helper to calculate ranks for all students
  const calculateRanks = (currentStudents: StudentGrade[]) => {
    const studentsWithMarks = currentStudents
      .filter(s => s.marks !== "")
      .map(s => ({ ...s, numericMark: parseFloat(s.marks) }))
      .sort((a, b) => b.numericMark - a.numericMark)

    const rankMap = new Map<string, number>()
    
    let currentRank = 1
    for (let i = 0; i < studentsWithMarks.length; i++) {
      if (i > 0 && studentsWithMarks[i].numericMark < studentsWithMarks[i-1].numericMark) {
        currentRank = i + 1
      }
      rankMap.set(studentsWithMarks[i].studentId, currentRank)
    }

    return rankMap
  }

  const handleMarkChange = (studentId: string, value: string) => {
    // Validate input: 0-20 or empty
    if (value !== "" && (isNaN(parseFloat(value)) || parseFloat(value) < 0 || parseFloat(value) > 20)) {
      return
    }

    let newStudents = students.map(student => {
      if (student.studentId === studentId) {
        if (value === "") {
          return {
            ...student,
            marks: value,
            total: 0,
            grade: '',
            remarks: ''
          }
        }

        const numValue = parseFloat(value)
        const grade = calculateGrade(numValue)
        return {
          ...student,
          marks: value,
          total: numValue * subjectCoefficient,
          grade: grade,
          remarks: calculateRemarks(grade)
        }
      }
      return student
    })

    // Recalculate ranks
    const rankMap = calculateRanks(newStudents)
    newStudents = newStudents.map(student => ({
      ...student,
      rank: rankMap.get(student.studentId)
    }))

    setStudents(newStudents)
  }

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to save grades")
      return
    }

    setSaving(true)
    try {
      const gradesToUpdate = students
        .filter(s => s.marks !== "")
        .map(s => ({
          id: s.id,
          studentId: s.studentId,
          marks: parseFloat(s.marks),
          grade: s.grade,
          remarks: s.remarks
        }))

      const response = await fetch(`/api/grades/${assessmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grades: gradesToUpdate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update grades')
      }
      
      toast.success("Grades updated successfully")
      setEditing(false)
      fetchGrades() // Refresh data
      
    } catch (error: any) {
      console.error("Error updating grades:", error)
      toast.error(error.message || "Failed to update grades")
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    fetchGrades() // Reset to original data
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading grades...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Grade Management</h1>
          <p className="text-muted-foreground">
            {className} • {subject} • {sequence}
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)}>
              Edit Grades
            </Button>
          )}
        </div>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Grades ({students.length} students)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">#</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead className="w-[120px]">Mark (/20)</TableHead>
                  <TableHead className="w-[80px]">Coeff</TableHead>
                  <TableHead className="w-[80px]">Total</TableHead>
                  <TableHead className="w-[80px]">Grade</TableHead>
                  <TableHead className="w-[80px]">Rank</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length > 0 ? (
                  students.map((student, index) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{student.studentName}</TableCell>
                      <TableCell>
                        {editing ? (
                          <Input
                            type="number"
                            min="0"
                            max="20"
                            step="0.5"
                            value={student.marks}
                            onChange={(e) => handleMarkChange(student.studentId, e.target.value)}
                            className="w-24"
                            placeholder="-"
                          />
                        ) : (
                          <span>{student.marks || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>{student.coefficient}</TableCell>
                      <TableCell>{student.total.toFixed(1)}</TableCell>
                      <TableCell>
                        <span className={`font-bold ${
                          student.grade === 'A' ? 'text-green-600' :
                          student.grade === 'B' ? 'text-green-500' :
                          student.grade === 'C' ? 'text-blue-500' :
                          student.grade === 'D' ? 'text-orange-500' :
                          student.grade === 'U' ? 'text-red-600' : ''
                        }`}>
                          {student.grade || '-'}
                        </span>
                      </TableCell>
                      <TableCell>{student.rank ? `#${student.rank}` : '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {student.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No grades found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

