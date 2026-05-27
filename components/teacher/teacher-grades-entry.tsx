"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
// import { apiCall } from "@/lib/utils/api-client"
import { useSequenceConfiguration } from "@/hooks/use-sequence-configuration"
import { calculateGrade, getGradeRemarks } from "@/lib/grading-utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { 
  Save, 
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Subject {
  id: string | number
  name: string
  code: string
  coefficient?: number
  type?: 'subject' | 'branch'
  maxMarks?: number
}

interface ClassAssignment {
  id: number
  name: string
  code: string
  subjects: Subject[]
  academicYear?: string
}

interface Student {
  id: number
  studentId: string
  firstName: string
  lastName: string
  email: string
}


interface GradeEntry {
  studentId: number
  mark: number | string  // Student's mark out of 20
  coefficient: number    // Subject coefficient (auto-populated)
  totalMarks: number     // Calculated: mark * coefficient
  grade: string          // Calculated grade (A, B, C, D, U)
  rank: number           // Calculated rank based on total marks
  remarks: string        // Auto-generated remarks based on grade
}

interface TeacherGradesEntryProps {
  preSelectedClassId?: string
}

export function TeacherGradesEntry({ preSelectedClassId }: TeacherGradesEntryProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [classes, setClasses] = useState<ClassAssignment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedSubject, setSelectedSubject] = useState<string>("")
  const [selectedExam, setSelectedExam] = useState<string>("")
  
  const [grades, setGrades] = useState<Record<number, GradeEntry>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  const [selectedSubjectCoefficient, setSelectedSubjectCoefficient] = useState<number>(1.0)
  
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  
  // Dynamic sequences handling
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>(new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString())

  // Fetch sequence configuration
  const { data: sequenceConfig } = useSequenceConfiguration(currentAcademicYear)

  // Derived state for terms and filtered sequences
  const terms = sequenceConfig?.sequences 
    ? Array.from(new Set(sequenceConfig.sequences.map(s => s.term))).sort() 
    : []

  const filteredSequences = sequenceConfig?.sequences
    .filter(s => s.is_active && (!selectedTerm || s.term === selectedTerm))
    .sort((a, b) => a.sequence_number - b.sequence_number) || []

  // Update academic year when class changes
  useEffect(() => {
    if (selectedClass) {
      const cls = classes.find(c => c.id.toString() === selectedClass)
      if (cls?.academicYear) {
        setCurrentAcademicYear(cls.academicYear)
      }
    }
  }, [selectedClass, classes])

  // Reset exam when term changes
  useEffect(() => {
    setSelectedExam("")
  }, [selectedTerm])

  // Auto-select class if pre-selected from dashboard
  useEffect(() => {
    if (preSelectedClassId && classes.length > 0 && !selectedClass) {
      // console.log(`[Teacher Grades] Auto-selecting pre-selected class: ${preSelectedClassId}`)
      setSelectedClass(preSelectedClassId)
    }
  }, [preSelectedClassId, classes, selectedClass])

  // Fetch teacher's classes with comprehensive error handling and retry logic
  useEffect(() => {
    // Only fetch all classes if NOT pre-selected (direct navigation scenario)
    const fetchClasses = async () => {
      if (!user?.id) return

      setLoadingClasses(true)
      
      // Try lightweight endpoint first, then fallback to summaryOnly, then regular endpoint
      const endpoints = [
        `/api/teachers/${user.id}/assignments/lightweight`,
        `/api/teachers/${user.id}/assignments?summaryOnly=true`,
        `/api/teachers/${user.id}/assignments?includeDetails=false`,
      ]
      
      let lastError: Error | null = null
      let classesData: ClassAssignment[] = []
      
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i]
        try {
          // console.log(`[Teacher Grades] Attempting to fetch classes from endpoint ${i + 1}/${endpoints.length}: ${endpoint}`)
          
          // Use progressively longer timeouts for each endpoint attempt
          const timeout = i === 0 ? 30000 : i === 1 ? 45000 : 60000
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), timeout)
          
          let response: Response
          try {
        const cacheBuster = new Date().getTime()
            const url = `${endpoint}${endpoint.includes('?') ? '&' : '?'}t=${cacheBuster}`
            
            response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
              signal: controller.signal
            })
            clearTimeout(timeoutId)
          } catch (fetchError) {
            clearTimeout(timeoutId)
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              throw new Error(`Request timed out after ${timeout}ms`)
            }
            throw fetchError
          }
          
          if (!response.ok) {
            const errorText = await response.text()
            let errorMessage = 'Failed to fetch classes'
            try {
              const errorData = JSON.parse(errorText)
              errorMessage = errorData.message || errorData.error || errorMessage
            } catch {
              errorMessage = `HTTP ${response.status}: ${response.statusText}`
            }
            
            // If it's a 404 on lightweight endpoint, try next endpoint
            if (response.status === 404 && i < endpoints.length - 1) {
              // console.warn(`[Teacher Grades] Endpoint ${i + 1} returned 404, trying next endpoint...`)
              lastError = new Error(errorMessage)
              continue
            }
            
            throw new Error(errorMessage)
          }
        
        const data = await response.json()
          
          if (!data.ok) {
            throw new Error(data.error || 'Failed to fetch classes')
          }

          classesData = data.classes || []
          // console.log(`[Teacher Grades] Successfully fetched ${classesData.length} classes from endpoint ${i + 1}${data.timing ? ` (${data.timing.totalMs}ms)` : ''}`)

          // Success - break out of loop
          break
      } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          // console.error(`[Teacher Grades] Endpoint ${i + 1} failed:`, lastError.message)

          // If this is the last endpoint, we'll show error below
          if (i === endpoints.length - 1) {
            break
          }

          // Try next endpoint
          // console.log(`[Teacher Grades] Trying next endpoint...`)
        }
      }

      // Set classes if we got any data, otherwise show error
      if (classesData.length > 0) {
        setClasses(classesData)
      } else if (lastError) {
        // All endpoints failed - show comprehensive error message
        const error = lastError

        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          // console.error('[Teacher Grades] All endpoints timed out:', error)
        toast({
            title: "Request Timeout",
            description: "The server is taking longer than expected to respond. This could be due to:\n\n• Database performance issues\n• Missing database indexes\n• Large amount of data to process\n\nPlease check the server logs for detailed timing information, or contact support if this persists.",
            variant: "destructive",
            // duration: 15000
          })
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          // console.error('[Teacher Grades] Network error:', error)
          toast({
            title: "Network Error",
            description: "Unable to connect to the server. Please check your internet connection and try again.",
            variant: "destructive"
          })
        } else {
          // console.error('[Teacher Grades] Error fetching classes:', error)
          toast({
            title: "Error Loading Classes",
            description: error.message || "Failed to load classes. Please refresh the page or contact support if the issue persists.",
          variant: "destructive"
        })
      }
        
        // Set empty array so UI doesn't break
        setClasses([])
      }
      
      setLoadingClasses(false)
    }

    fetchClasses()

    // Refresh data when page becomes visible (when user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Don't refresh if pre-selected (shouldn't reach here due to early return above)
        if (!preSelectedClassId) {
          fetchClasses()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user?.id, toast, preSelectedClassId])

  // Fetch subjects when class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setAvailableSubjects([])
        setSelectedSubject("")
        return
      }

      try {
        setLoadingSubjects(true)
        const response = await fetch(`/api/classes/${selectedClass}/subjects${user?.id ? `?teacherId=${user.id}` : ''}`)        
        // Check if response is ok before parsing JSON
        if (!response.ok) {
          // Try to parse JSON, but handle HTML responses
          let errorData
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            try {
              errorData = await response.json()
            } catch {
              errorData = { error: `Failed to fetch subjects: ${response.status} ${response.statusText}` }
            }
          } else {
            errorData = { error: `Failed to fetch subjects: ${response.status} ${response.statusText}` }
          }
          
          const errorMessage = errorData.error || 'Failed to fetch subjects'
          // console.error('Error fetching subjects:', {
          //   status: response.status,
          //   statusText: response.statusText,
          //   error: errorData,
          //   classId: selectedClass
          // })
          
          // If API fails, try to use subjects from already-fetched classes data as fallback
          const fallbackClass = classes.find(c => {
            const classId = typeof c.id === 'number' ? c.id.toString() : c.id
            return classId === selectedClass
          })
          
          if (fallbackClass?.subjects && fallbackClass.subjects.length > 0) {
            // console.log('Using fallback subjects from classes data')
            const transformedSubjects: Subject[] = fallbackClass.subjects.map((subject: { id: number | string, name?: string, subject_name?: string, code?: string, subject_code?: string, coefficient?: number | string }) => ({
              id: subject.id,
              name: subject.name || subject.subject_name || 'Unknown Subject',
              code: subject.code || subject.subject_code || '',
              coefficient: subject.coefficient ? (typeof subject.coefficient === 'number' ? subject.coefficient : parseFloat(String(subject.coefficient))) : 1.0
            }))
            setAvailableSubjects(transformedSubjects)
          } else {
            throw new Error(errorMessage)
          }
          return
        }
        
        // Parse JSON only if response is ok
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch subjects')
        }
        
        const subjectsList = data.subjects || []
        
        // If no subjects from API, try fallback from classes data
        if (subjectsList.length === 0) {
          const fallbackClass = classes.find(c => {
            const classId = typeof c.id === 'number' ? c.id.toString() : c.id
            return classId === selectedClass
          })
          
          if (fallbackClass?.subjects && fallbackClass.subjects.length > 0) {
            // console.log('No subjects from API, using fallback from classes data')
            const transformedSubjects: Subject[] = fallbackClass.subjects.map((subject: { id: number | string, name?: string, subject_name?: string, code?: string, subject_code?: string, coefficient?: number | string }) => ({
              id: subject.id,
              name: subject.name || subject.subject_name || 'Unknown Subject',
              code: subject.code || subject.subject_code || '',
              coefficient: subject.coefficient ? (typeof subject.coefficient === 'number' ? subject.coefficient : parseFloat(String(subject.coefficient))) : 1.0
            }))
            setAvailableSubjects(transformedSubjects)
            setSelectedSubject("")
            setSelectedSubjectCoefficient(1.0)
            return
          }
        }
        
        // Transform to match our Subject interface
        const transformedSubjects: Subject[] = subjectsList
          .filter((subject: { id: number }) => subject.id) // Filter out subjects without IDs
          .map((subject: { id: number | string, name?: string, subject_name?: string, code?: string, subject_code?: string, coefficient?: number | string }) => ({
            id: subject.id,
            name: subject.name || subject.subject_name || 'Unknown Subject',
            code: subject.code || subject.subject_code || '',
            coefficient: subject.coefficient ? (typeof subject.coefficient === 'number' ? subject.coefficient : parseFloat(String(subject.coefficient))) : 1.0,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: (subject as any).type || 'subject',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            maxMarks: (subject as any).maxMarks || 20
          }))
        
        setAvailableSubjects(transformedSubjects)
        
        // Always reset subject selection when class changes
        setSelectedSubject("")
        setSelectedSubjectCoefficient(1.0)
      } catch (err) {
        // console.error('Error fetching subjects:', err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load subjects"
        
        // Last resort: try to use subjects from classes data
        const fallbackClass = classes.find(c => {
          const classId = typeof c.id === 'number' ? c.id.toString() : c.id
          return classId === selectedClass
        })
        
        if (fallbackClass?.subjects && fallbackClass.subjects.length > 0) {
          // console.log('Error occurred, using fallback subjects from classes data')
          const transformedSubjects: Subject[] = fallbackClass.subjects.map((subject: { id: number | string, name?: string, subject_name?: string, code?: string, subject_code?: string, coefficient?: number | string }) => ({
            id: subject.id,
            name: subject.name || subject.subject_name || 'Unknown Subject',
            code: subject.code || subject.subject_code || '',
            coefficient: subject.coefficient ? (typeof subject.coefficient === 'number' ? subject.coefficient : parseFloat(String(subject.coefficient))) : 1.0
          }))
          setAvailableSubjects(transformedSubjects)
        } else {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          })
          setAvailableSubjects([])
        }
      } finally {
        setLoadingSubjects(false)
      }
    }

    fetchSubjects()
  }, [selectedClass, classes, toast, user?.id])


  // Helper function to calculate total marks
  const calculateTotalMarks = (mark: number, coefficient: number): number => {
    return mark * coefficient
  }

  // Helper function to calculate rank based on total marks
  const calculateRanks = (allGrades: Record<number, GradeEntry>): Record<number, number> => {
    // Get all students with marks
    const studentsWithMarks = Object.entries(allGrades)
      .filter(([_, entry]) => entry.mark !== '' && entry.mark !== undefined)
      .map(([studentId, entry]) => ({
        studentId: parseInt(studentId),
        totalMarks: calculateTotalMarks(
          typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string) || 0,
          entry.coefficient || selectedSubjectCoefficient
        )
      }))
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

  // Fetch subject coefficient when subject is selected
  useEffect(() => {
    const fetchSubjectCoefficient = async () => {
      if (!selectedSubject) {
        setSelectedSubjectCoefficient(1.0)
        return
      }

      try {
        // Find the selected subject in availableSubjects
        const subject = availableSubjects.find(s => s.id.toString() === selectedSubject)
        let newCoefficient = 1.0
        
        if (subject?.coefficient) {
          newCoefficient = subject.coefficient
        } else {
          // If not found in availableSubjects, fetch from API
          const response = await fetch(`/api/subjects/${selectedSubject}`)
          if (response.ok) {
            const data = await response.json()
            newCoefficient = data.coefficient ? parseFloat(data.coefficient) : 1.0
          }
        }
        
        setSelectedSubjectCoefficient(newCoefficient)
        
        // Update coefficient in all existing grades and recalculate
        setGrades(prev => {
          const updatedGrades = { ...prev }
          let needsRecalculation = false
          
          Object.keys(updatedGrades).forEach(studentId => {
            const entry = updatedGrades[parseInt(studentId)]
            if (entry && entry.mark && entry.mark !== '') {
              entry.coefficient = newCoefficient
              const markNum = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
              entry.totalMarks = calculateTotalMarks(markNum, newCoefficient)
              entry.grade = calculateGrade(markNum)
              entry.remarks = getGradeRemarks(entry.grade)
              needsRecalculation = true
            } else if (entry) {
              entry.coefficient = newCoefficient
            }
          })
          
          // Recalculate ranks if needed
          if (needsRecalculation) {
            const ranks = calculateRanks(updatedGrades)
            Object.keys(ranks).forEach(id => {
              if (updatedGrades[parseInt(id)]) {
                updatedGrades[parseInt(id)].rank = ranks[parseInt(id)]
              }
            })
          }
          
      return updatedGrades
        })
      } catch (_err) {
        // console.error('Error fetching subject coefficient:', err)
        setSelectedSubjectCoefficient(1.0)
      }
    }

    fetchSubjectCoefficient()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, availableSubjects])

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([])
        return
      }

      try {
        setLoading(true)
        const response = await fetch(`/api/classes/${selectedClass}/students`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          const errorMessage = errorData.error || errorData.details || 'Failed to fetch students'
          // console.error('Error fetching students:', {
          //   status: response.status,
          //   statusText: response.statusText,
          //   error: errorData,
          //   classId: selectedClass
          // })
          throw new Error(errorMessage)
        }
        
        const data = await response.json()
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch students')
        }
        
        const studentsList = data.students || []
        setStudents(studentsList)
        
        // Initialize grades object
        const initialGrades: Record<number, GradeEntry> = {}
        studentsList.forEach((student: Student) => {
          initialGrades[student.id] = {
            studentId: student.id,
            mark: '',
            coefficient: selectedSubjectCoefficient,
            totalMarks: 0,
            grade: '',
            rank: 0,
            remarks: ''
          }
        })
        setGrades(initialGrades)
      } catch (err) {
        // console.error('Error fetching students:', err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load students"
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [selectedClass, selectedSubjectCoefficient, toast])

  const handleGradeChange = (studentId: number, _field: 'mark', value: string) => {
    const numValue = value === '' ? '' : parseFloat(value)
    
    const currentSubject = availableSubjects.find(s => s.id.toString() === selectedSubject)
    const maxMarks = currentSubject?.maxMarks || 20

    // Validate mark is between 0 and maxMarks
    if (value !== '' && (isNaN(numValue as number) || (numValue as number) < 0 || (numValue as number) > maxMarks)) {
      return
    }

    setGrades(prev => {
      const updatedGrades = {
        ...prev,
        [studentId]: {
          ...prev[studentId] || {
            studentId,
            mark: '',
            coefficient: selectedSubjectCoefficient,
            totalMarks: 0,
            grade: '',
            rank: 0,
            remarks: ''
          },
          mark: value === '' ? '' : (numValue as number),
          coefficient: selectedSubjectCoefficient
        }
      }

      // Calculate total marks, grade, and remarks for this student
      const markValue = updatedGrades[studentId].mark
      if (markValue !== '' && markValue !== undefined) {
        const markNum = typeof markValue === 'number' ? markValue : parseFloat(markValue as string)
        const totalMarks = calculateTotalMarks(markNum, selectedSubjectCoefficient)
        const grade = calculateGrade(markNum)
        const remarks = getGradeRemarks(grade)

        updatedGrades[studentId] = {
          ...updatedGrades[studentId],
          totalMarks,
          grade,
          remarks
        }
      } else {
        updatedGrades[studentId] = {
          ...updatedGrades[studentId],
          totalMarks: 0,
          grade: '',
          rank: 0,
          remarks: ''
        }
      }

      // Recalculate all ranks
      const ranks = calculateRanks(updatedGrades)
      Object.keys(ranks).forEach(id => {
        if (updatedGrades[parseInt(id)]) {
          updatedGrades[parseInt(id)].rank = ranks[parseInt(id)]
        }
      })

      return updatedGrades
    })
  }

  const validateGrade = (mark: string): boolean => {
    if (!mark) return true // Empty is valid (not required)
    const numMark = parseFloat(mark)
    const currentSubject = availableSubjects.find(s => s.id.toString() === selectedSubject)
    const maxMarks = currentSubject?.maxMarks || 20
    return !isNaN(numMark) && numMark >= 0 && numMark <= maxMarks
  }

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !selectedTerm || !selectedExam) {
      toast({
        title: "Validation Error",
        description: "Please select class, subject, term and examination",
        variant: "destructive"
      })
      return
    }

    // Validate all marks
    const invalidMarks = Object.values(grades).filter(
      entry => entry.mark && entry.mark !== '' && !validateGrade(entry.mark.toString())
    )

    if (invalidMarks.length > 0) {
      const currentSubject = availableSubjects.find(s => s.id.toString() === selectedSubject)
      toast({
        title: "Validation Error",
        description: `Some marks are invalid. Marks must be between 0 and ${currentSubject?.maxMarks || 20}.`,
        variant: "destructive"
      })
      return
    }

    // Filter out empty marks
    const gradesToSubmit = Object.values(grades).filter(entry => entry.mark && entry.mark !== '')

    if (gradesToSubmit.length === 0) {
      toast({
        title: "No Marks Entered",
        description: "Please enter at least one mark before submitting",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)
      
      const currentSubject = availableSubjects.find(s => s.id.toString() === selectedSubject)
      const currentClass = classes.find(c => c.id.toString() === selectedClass)
      
      if (currentSubject?.type === 'branch') {
        // Handle Branch Grades
        const academicYear = currentClass?.academicYear || new Date().getFullYear().toString()
        const term = selectedTerm
        
        // Search for existing assessment
        const searchParams = new URLSearchParams({
          branchId: selectedSubject,
          classId: selectedClass,
          academicYear,
          term,
          type: 'exam'
        })
        
        const searchRes = await fetch(`/api/branch-assessments?${searchParams.toString()}`)
        let assessmentId = ''
        
        if (searchRes.ok) {
          const searchData = await searchRes.json()
          if (searchData.success && searchData.assessments && searchData.assessments.length > 0) {
            assessmentId = searchData.assessments[0].id
          }
        }
        
        if (!assessmentId) {
          // Create new assessment
          const createRes = await fetch('/api/branch-assessments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branch_id: selectedSubject,
              teacher_id: user?.id,
              class_id: selectedClass,
              title: `${term} Exam`,
              type: 'exam',
              total_marks: currentSubject.maxMarks || 20,
              academic_year: academicYear,
              term: term,
              assessment_date: new Date().toISOString()
            })
          })
          
          const createData = await createRes.json()
          if (!createData.success) {
            throw new Error(createData.error || 'Failed to create assessment')
          }
          assessmentId = createData.assessment.id
        }
        
        // Submit grades
        const promises = gradesToSubmit.map(entry => {
          const markValue = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
          return fetch('/api/branch-grades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              assessment_id: assessmentId,
              student_id: entry.studentId,
              teacher_id: user?.id,
              marks_obtained: markValue,
              remarks: entry.remarks
            })
          })
        })
        
        const results = await Promise.all(promises)
        const failed = results.filter(r => !r.ok)
        
        if (failed.length > 0) {
          throw new Error(`Failed to submit ${failed.length} grades`)
        }
        
      } else {
        // Handle Legacy Subject Grades
        const response = await fetch('/api/grades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubject,
            term: selectedTerm,
            examinationName: selectedExam, // This now contains the sequence name directly
            teacherId: user?.id,
            grades: gradesToSubmit.map(entry => {
              const markValue = typeof entry.mark === 'number' ? entry.mark : parseFloat(entry.mark as string)
              return {
                studentId: entry.studentId,
                mark: markValue,
                coefficient: entry.coefficient || selectedSubjectCoefficient,
                totalMarks: entry.totalMarks,
                grade: entry.grade,
                rank: entry.rank,
                remarks: entry.remarks
              }
            })
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to submit grades')
        }
      }

      toast({
        title: "Success",
        description: `Successfully submitted ${gradesToSubmit.length} grades`,
      })

      // Clear grades after successful submission
      handleClearAll()
    } catch (err) {
      // console.error('Error submitting grades:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit grades",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClearAll = () => {
    const clearedGrades: Record<number, GradeEntry> = {}
    students.forEach((student) => {
      clearedGrades[student.id] = {
        studentId: student.id,
        mark: '',
        coefficient: selectedSubjectCoefficient,
        totalMarks: 0,
        grade: '',
        rank: 0,
        remarks: ''
      }
    })
    setGrades(clearedGrades)
  }


  const enteredGradesCount = Object.values(grades).filter(entry => entry.mark && entry.mark !== '').length

  return (
    <div className="space-y-6 px-4 md:px-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Enter Grades</h1>
        <p className="text-muted-foreground">
          {preSelectedClassId && selectedClass 
            ? `Entering grades for ${classes.find(c => c.id.toString() === selectedClass)?.name || 'selected class'}`
            : 'Enter student grades for examinations and assessments'
          }
        </p>
      </div>

      {/* Selection Form */}
      <Card>
        <CardHeader>
          <CardTitle>Select Class, Subject and Examination</CardTitle>
          <CardDescription>
            Choose the class, subject and examination to enter grades for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={loadingClasses}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select a class"} />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject Selection */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select 
                value={selectedSubject} 
                onValueChange={setSelectedSubject}
                disabled={!selectedClass || loadingSubjects || availableSubjects.length === 0}
              >
                <SelectTrigger id="subject">
                  {selectedSubject ? (
                    <SelectValue>
                      {availableSubjects.find(s => s.id.toString() === selectedSubject)?.code || "Select a subject"}
                    </SelectValue>
                  ) : (
                    <SelectValue 
                      placeholder={
                        !selectedClass 
                          ? "Select a class first" 
                          : loadingSubjects
                          ? "Loading subjects..."
                          : availableSubjects.length === 0
                          ? "No subjects assigned"
                          : "Select a subject"
                      }
                    />
                  )}
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject, index) => (
                    <SelectItem key={`subject-${subject.id}-${index}`} value={subject.id.toString()}>
                      {subject.name} ({subject.code}) {subject.type === 'branch' ? '(Sub-subject)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Term Selection */}
            <div className="space-y-2">
              <Label htmlFor="term">Term</Label>
              <Select 
                value={selectedTerm} 
                onValueChange={setSelectedTerm}
                disabled={!selectedClass}
              >
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select a term" />
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

            {/* Examination Selection */}
            <div className="space-y-2">
              <Label htmlFor="exam">Examination</Label>
              <Select 
                value={selectedExam} 
                onValueChange={setSelectedExam}
                disabled={!selectedTerm}
              >
                <SelectTrigger id="exam">
                  <SelectValue 
                    placeholder={
                      !selectedTerm 
                        ? "Select a term first" 
                        : filteredSequences.length === 0 
                        ? "No examinations found" 
                        : "Select an examination"
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSequences.map((seq) => (
                    <SelectItem key={seq.id} value={seq.sequence_name}>
                      {seq.sequence_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedClass && selectedSubject && selectedTerm && selectedExam && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Ready to enter grades for{" "}
                <strong>
                  {availableSubjects.find(s => s.id.toString() === selectedSubject)?.name}
                </strong>
                {" "}for{" "}
                  <strong>{selectedTerm} - {selectedExam}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Grades Entry Table */}
      {selectedClass && selectedSubject && selectedTerm && selectedExam && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Student Grades</CardTitle>
                <CardDescription>
                  Enter grades for {students.length} students ({enteredGradesCount} entered)
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={submitting || enteredGradesCount === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting || enteredGradesCount === 0}
                >
                  {submitting ? (
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
            {loading ? (
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
                        Mark (0-{availableSubjects.find(s => s.id.toString() === selectedSubject)?.maxMarks || 20})
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
                        coefficient: selectedSubjectCoefficient,
                        totalMarks: 0,
                        grade: '',
                        rank: 0,
                        remarks: ''
                      }
                      return (
                        <TableRow key={`student-${student.id}-${index}`}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>{student.studentId}</TableCell>
                          <TableCell>
                            {student.firstName} {student.lastName}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.01"
                              placeholder="0-20"
                              value={gradeEntry.mark || ""}
                              onChange={(e) => handleGradeChange(student.id, 'mark', e.target.value)}
                              className={
                                gradeEntry.mark && gradeEntry.mark !== '' && !validateGrade(gradeEntry.mark.toString())
                                  ? "border-red-500"
                                  : ""
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={gradeEntry.coefficient || selectedSubjectCoefficient}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={gradeEntry.totalMarks || ""}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={gradeEntry.grade || ""}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed font-semibold"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={gradeEntry.rank || ""}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed text-center"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={gradeEntry.remarks || ""}
                              readOnly
                              disabled
                              className="bg-muted cursor-not-allowed"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!selectedClass && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Selection Made</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Please select a class, subject, and examination to begin entering grades
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
