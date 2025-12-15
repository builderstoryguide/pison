"use client"

import { useState, useEffect } from 'react'
import { 
  Search,
  GraduationCap,
  ArrowLeft,
  FileText,
  Users,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TermReportCard } from './reports/TermReportCard'
import { AnnualReportCard } from './reports/AnnualReportCard'
import { ReportCardData } from './reports/report-card-types'

interface Student {
  id: string
  student_id: string
  first_name: string
  last_name: string
  class: string
  class_name?: string
  gender?: string
  photo_url?: string
  status: string
}

interface ClassData {
  id: string
  name: string
  currentEnrollment?: number
}

type TermType = '1' | '2' | 'annual'

export function ReportCardsWrapper() {
  // State
  const [selectedTerm, setSelectedTerm] = useState<TermType>('annual')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  
  const [classes, setClasses] = useState<ClassData[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [reportData, setReportData] = useState<ReportCardData | null>(null)
  
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch classes on mount
  useEffect(() => {
    fetchClasses()
  }, [])

  // Fetch students when class changes
  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass)
    } else {
      setStudents([])
    }
    setSelectedStudent(null)
    setReportData(null)
  }, [selectedClass])
  // Fetch report data when student is selected
  useEffect(() => {
    if (selectedStudent) {
      fetchReportData(selectedStudent.id, selectedTerm)
    } else {
      setReportData(null)
    }
  }, [selectedStudent, selectedTerm])

  const fetchClasses = async () => {
    setLoadingClasses(true)
    setError(null)
    try {
      const response = await fetch('/api/classes')
      const data = await response.json()
      
      // Handle error response from API
      if (!response.ok || (data && data.ok === false)) {
        const errorMessage = typeof data?.error === 'string' ? data.error : (data?.error?.message || 'Failed to fetch classes')
        console.error('API error:', errorMessage)
        setError(errorMessage)
        setClasses([])
        return
      }
      
      // Handle successful response
      const classesArray = Array.isArray(data) ? data : []
      console.log('Fetched classes:', classesArray.length, classesArray)
      
      if (classesArray.length === 0) {
        console.warn('No classes found in API response')
      }
      
      setClasses(classesArray)
    } catch (err) {
      console.error('Error fetching classes:', err)
      setError('Failed to fetch classes. Please try again.')
      setClasses([])
    } finally {
      setLoadingClasses(false)
    }
  }

  const fetchStudents = async (classId: string) => {
    setLoadingStudents(true)
    try {
      const response = await fetch(`/api/students?classId=${classId}&status=active`)
      if (response.ok) {
        const data = await response.json()
        setStudents(Array.isArray(data) ? data : [])
      } else {
        setError('Failed to fetch students')
      }
    } catch (_err) {
      setError('Failed to fetch students')
    } finally {
      setLoadingStudents(false)
    }
  }

  const fetchReportData = async (studentId: string, term: TermType) => {
    setLoadingReport(true)
    try {
      const url = `/api/report-cards/${studentId}?term=${term}`
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setReportData(result.data)
        } else {
          const errorMessage = typeof result.error === 'string' ? result.error : (result.error?.message || 'Failed to fetch report data')
          setError(errorMessage)
        }
      } else {
        const errorText = await response.text()
        let parsedError
        try {
          parsedError = JSON.parse(errorText)
        } catch {
          parsedError = null
        }
        const errorMessage = parsedError?.error?.message || parsedError?.error || parsedError?.message || 'Failed to fetch report data'
        setError(errorMessage)
      }
    } catch (err: any) {
      setError('Failed to fetch report data')
    } finally {
      setLoadingReport(false)
    }
  }

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
  }

  const handleBack = () => {
    setSelectedStudent(null)
    setReportData(null)
    setError(null)
  }
  // Filter students by search query
  const filteredStudents = students.filter(student => {
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase()
    const studentId = student.student_id?.toLowerCase() || ''
    return fullName.includes(searchQuery.toLowerCase()) || 
           studentId.includes(searchQuery.toLowerCase())
  })

  // Render report card based on term type
  if (selectedStudent && reportData) {
    return (
      <div className="space-y-4">
        {/* Back Button - Hidden on print */}
        <div className="print:hidden">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student Selection
          </Button>
        </div>

        {/* Render appropriate report card */}
        {selectedTerm === 'annual' ? (
          <AnnualReportCard data={reportData} />
        ) : (
          <TermReportCard data={{
            ...reportData,
            academic: {
              ...reportData.academic,
              term: selectedTerm === '1' ? 1 : 2
            }
          }} />
        )}      </div>
    )
  }

  // Loading report
  if (selectedStudent && loadingReport) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading report card...</p>
        </div>
      </div>
    )
  }

  // Main selection UI
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Report Cards</h1>
          <p className="text-muted-foreground">
            Generate and view student report cards
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Options</CardTitle>
          <CardDescription>Choose the term type and class to view student report cards</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Term Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedTerm} onValueChange={(v) => setSelectedTerm(v as TermType)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      First Term (Seq 1 + 2)
                    </span>
                  </SelectItem>
                  <SelectItem value="2">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Second Term (Seq 3 + 4)
                    </span>
                  </SelectItem>
                  <SelectItem value="annual">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Annual Report (All Terms)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Class Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={loadingClasses}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      loadingClasses 
                        ? "Loading..." 
                        : classes.length === 0 
                        ? "No classes available" 
                        : "Select class"
                    } 
                  />
                </SelectTrigger>
                <SelectContent className="max-h-[240px] overflow-y-auto">
                  {classes.length > 0 ? (
                    classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {cls.name} ({cls.currentEnrollment || 0} students)
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground px-2">
                      {loadingClasses ? 'Loading classes...' : 'No classes available'}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Student</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  disabled={!selectedClass}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {typeof error === 'string' ? error : (error?.message || 'An error occurred')}
          <Button variant="link" className="ml-2 p-0 h-auto" onClick={() => setError(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Student List */}
      {selectedClass && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students ({filteredStudents.length})
            </CardTitle>
            <CardDescription>
              Click on a student to view their report card
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No students match your search' : 'No students found in this class'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredStudents.map((student) => (
                  <Card key={student.id}>
                    <CardContent className="p-0">
                      <button
                        onClick={() => handleStudentSelect(student)}
                        className="w-full p-4 text-left hover:bg-accent rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            {student.photo_url ? (
                              <img 
                                src={student.photo_url} 
                                alt={student.first_name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-semibold text-muted-foreground">
                                {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {student.student_id || 'No ID'}
                            </p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {student.class_name || 'Unknown Class'}
                            </Badge>
                          </div>
                        </div>
                      </button>
                    </CardContent>
                  </Card>
                ))}              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!selectedClass && !loadingClasses && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Select a Class to Get Started</p>
              <p className="text-sm">Choose a report type and class from the options above to view student report cards</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportCardsWrapper
