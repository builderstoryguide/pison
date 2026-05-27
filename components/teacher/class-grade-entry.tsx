"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useSequenceConfiguration, type Sequence } from "@/hooks/use-sequence-configuration"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { useSubmitGrades } from "@/hooks/use-submit-grades"
import { calculateGrade, getGradeRemarks } from "@/lib/grading-utils"

interface ClassGradeEntryProps {
  classId: string
  subjectId?: string // Added optional subjectId
  onBack: () => void
}

interface Student {
  id: string
  name: string
  marks: string
  // Calculated fields
  total?: number
  grade?: string
  rank?: number
  remarks?: string
}

interface Subject {
  id: string
  name: string
  code: string
  coefficient: number
}

export function ClassGradeEntry({ classId, subjectId, onBack }: ClassGradeEntryProps) {
  const { user } = useAuth()
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedSequence, setSelectedSequence] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use optimistic grade submission hook
  const submitGradesMutation = useSubmitGrades()
  const saving = submitGradesMutation.isPending
  
  // Fetch sequence configuration
  const globalAcademicYear = useGlobalAcademicYear()
  const { data: sequenceConfig, isLoading: loadingSequences } = useSequenceConfiguration(globalAcademicYear)
  
  // Extract unique terms from configuration
  const terms = sequenceConfig?.sequences 
    ? Array.from(new Set(sequenceConfig.sequences.map(s => s.term))).sort()
    : []
  
  // Filter sequences by selected term
  const filteredSequences = sequenceConfig?.sequences
    ?.filter(s => s.is_active && s.term === selectedTerm)
    .sort((a, b) => a.sequence_number - b.sequence_number) || []
  
  // Reset sequence when term changes
  useEffect(() => {
    setSelectedSequence("")
  }, [selectedTerm])

  const fetchData = useCallback(async () => {
    if (!classId) return

    try {
      setLoading(true)
      
      // Fetch students and subjects in parallel
      const [studentsRes, subjectsRes] = await Promise.all([
        fetch(`/api/classes/${classId}/students`, { cache: 'no-store' }),
        fetch(`/api/classes/${classId}/subjects`, { cache: 'no-store' })
      ])

      // Handle potential errors gracefully
      if (!studentsRes.ok) {
        console.error(`Failed to fetch students: ${studentsRes.status} ${studentsRes.statusText}`)
      }
      
      if (!subjectsRes.ok) {
        console.error(`Failed to fetch subjects: ${subjectsRes.status} ${subjectsRes.statusText}`)
      }

      const studentsData = studentsRes.ok ? await studentsRes.json() : { success: false }
      const subjectsData = subjectsRes.ok ? await subjectsRes.json() : { success: false }

      if (studentsData.success && studentsData.students) {
        setStudents(studentsData.students.map((s: any) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          marks: "" // Initialize with empty marks
        })))
      }

      if (subjectsData.success && subjectsData.subjects) {
        setSubjects(subjectsData.subjects)
      }

    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load class data")
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Pre-select subject if provided
  useEffect(() => {
    if (subjectId && subjects.length > 0) {
      const subjectExists = subjects.some(s => s.id === subjectId)
      if (subjectExists) {
        setSelectedSubject(subjectId)
      }
    }
  }, [subjectId, subjects])

  const calculateRemarks = getGradeRemarks

  // Helper to calculate ranks for all students
  const calculateRanks = (currentStudents: Student[]) => {
    // Filter students with valid marks for ranking
    const studentsWithMarks = currentStudents
      .filter(s => s.marks !== "")
      .map(s => ({ ...s, numericMark: parseFloat(s.marks) }))
      .sort((a, b) => b.numericMark - a.numericMark) // Sort descending

    // Map of student ID to rank
    const rankMap = new Map<string, number>()
    
    let currentRank = 1
    for (let i = 0; i < studentsWithMarks.length; i++) {
      if (i > 0 && studentsWithMarks[i].numericMark < studentsWithMarks[i-1].numericMark) {
        currentRank = i + 1
      }
      rankMap.set(studentsWithMarks[i].id, currentRank)
    }

    return rankMap
  }

  const handleMarkChange = (id: string, value: string) => {
    // Find the coefficient for the current subject
    const currentSubject = subjects.find(s => s.id === selectedSubject)
    const coefficient = currentSubject?.coefficient || 1

    let newStudents = [...students]

    // Validate input: 0-20 or empty
    if (value === "") {
      newStudents = newStudents.map(student => {
        if (student.id === id) {
          return { 
            ...student, 
            marks: value,
            total: undefined,
            grade: undefined,
            rank: undefined,
            remarks: undefined
          }
        }
        return student
      })
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
        newStudents = newStudents.map(student => {
          if (student.id === id) {
            const grade = calculateGrade(numValue)
            return { 
              ...student, 
              marks: value,
              total: numValue * coefficient,
              grade: grade,
              remarks: calculateRemarks(grade)
            }
          }
          return student
        })
      } else {
        // Invalid input, do nothing (or show error state)
        return
      }
    }

    // Recalculate ranks for all students
    const rankMap = calculateRanks(newStudents)
    
    newStudents = newStudents.map(student => ({
      ...student,
      rank: rankMap.get(student.id)
    }))

    setStudents(newStudents)
  }

  // Recalculate everything when subject changes (due to coefficient change)
  useEffect(() => {
    if (selectedSubject && students.length > 0) {
        // Trigger a recalculation with current marks
        const currentSubject = subjects.find(s => s.id === selectedSubject)
        const coefficient = currentSubject?.coefficient || 1
        
        let newStudents = students.map(student => {
            if (student.marks !== "") {
                const numValue = parseFloat(student.marks)
                const grade = calculateGrade(numValue)
                return {
                    ...student,
                    total: numValue * coefficient,
                    grade: grade,
                    remarks: calculateRemarks(grade)
                }
            }
            return student
        })
        
        const rankMap = calculateRanks(newStudents)
        newStudents = newStudents.map(student => ({
            ...student,
            rank: rankMap.get(student.id)
        }))
        
        setStudents(newStudents)
    }
  }, [selectedSubject]) // Depend only on selectedSubject change to trigger recalc of totals

  const handleSave = async () => {
    if (!selectedSubject || !selectedTerm || !selectedSequence) {
      toast.error("Please select subject, term and sequence")
      return
    }

    if (!user?.id) {
      toast.error("You must be logged in to save grades")
      return
    }

    const gradesToSave = students
      .filter(s => s.marks !== "")
      .map(s => ({
        studentId: s.id,
        marks: parseFloat(s.marks),
        grade: s.grade,
        remarks: s.remarks,
        coefficient: subjects.find(sub => sub.id === selectedSubject)?.coefficient || 1,
        totalMarks: s.total,
        rank: s.rank
      }))
    if (gradesToSave.length === 0) {
      toast.error("No grades entered to save")
      return
    }

    // Use optimistic mutation
    submitGradesMutation.mutate(
      {
        classId,
        subjectId: selectedSubject,
        term: selectedTerm,
        sequenceId: selectedSequence,
        grades: gradesToSave
      },
      {
        onSuccess: () => {
          // Clear the form after successful submission
          setStudents(prev => prev.map(s => ({
            ...s,
            marks: "",
            total: undefined,
            grade: undefined,
            rank: undefined,
            remarks: undefined
          })))
        }
      }
    )
  }

  const currentSubject = subjects.find(s => s.id === selectedSubject)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading class data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Enter Grades</h1>
          <p className="text-muted-foreground">Class Management</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Grade Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subject</Label>
              {subjectId ? (
                <div className="p-2 border rounded-md bg-muted/50 font-medium">
                  {subjects.find(s => s.id === subjectId)?.name || "Loading..."}
                   {currentSubject?.code ? ` (${currentSubject.code})` : ''}
                </div>
              ) : (
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map(subject => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} {subject.code ? `(${subject.code})` : ''}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">No subjects found</div>
                    )}
                  </SelectContent>
                </Select>
              )}
              {currentSubject && (
                <p className="text-xs text-muted-foreground">
                  Coefficient: {currentSubject.coefficient}
                </p>
              )}
            </div>

            {/* Term Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Term</Label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm}
                disabled={loadingSequences || terms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSequences ? "Loading..." : "Select Term"} />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term, index) => (
                    <SelectItem key={`term-${index}`} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sequence Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sequence</Label>
              <Select 
                value={selectedSequence} 
                onValueChange={setSelectedSequence}
                disabled={!selectedTerm || filteredSequences.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!selectedTerm ? "Select Term first" : "Select Sequence"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSequences.map(seq => (
                    <SelectItem key={seq.id} value={seq.id}>
                      {seq.sequence_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedSubject && selectedTerm && selectedSequence ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>
                          <Input 
                            type="number" 
                            min="0" 
                            max="20"
                            step="0.5"
                            value={student.marks}
                            onChange={(e) => handleMarkChange(student.id, e.target.value)}
                            className="w-24"
                            placeholder="-"
                          />
                        </TableCell>
                        <TableCell>{currentSubject?.coefficient || 1}</TableCell>
                        <TableCell>{student.total !== undefined ? student.total.toFixed(1) : '-'}</TableCell>
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
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No students found in this class.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-md bg-muted/10">
              Please select a subject, term and sequence to start entering grades.
            </div>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={!selectedSubject || !selectedTerm || !selectedSequence || saving || students.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Grades
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
