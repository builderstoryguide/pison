"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ClipboardList,
  Users,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { useSequenceConfiguration } from "@/hooks/use-sequence-configuration"
import type { MarksTrackingResponse } from "@/lib/marks-tracking-types"
import { useToast } from "@/hooks/use-toast"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { useQuery, useQueryClient } from "@tanstack/react-query"

// Query keys for caching
const marksTrackingKeys = {
  all: ['marks-tracking'] as const,
  lists: () => [...marksTrackingKeys.all, 'list'] as const,
  list: (filters: {
    academicYear: string
    term?: string
    classId?: string
    subjectId?: string
  }) => [...marksTrackingKeys.lists(), filters] as const,
}

const classesKeys = {
  all: ['classes'] as const,
  lists: () => [...classesKeys.all, 'list'] as const,
  list: (filters: { academicYear?: string; status?: string }) => 
    [...classesKeys.lists(), filters] as const,
}

// Fetch functions
async function fetchMarksTracking(filters: {
  academicYear: string
  term?: string
  classId?: string
  subjectId?: string
}): Promise<MarksTrackingResponse> {
  const params = new URLSearchParams()
  params.set('academicYear', filters.academicYear)
  if (filters.term) {
    params.set('term', filters.term)
  }
  if (filters.classId && filters.classId !== 'all') {
    params.set('classId', filters.classId)
  }
  if (filters.subjectId && filters.subjectId !== 'all') {
    params.set('subjectId', filters.subjectId)
  }

  const response = await fetch(`/api/admin/marks-tracking?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch marks tracking data')
  }
  return response.json()
}

async function fetchClasses(filters: { academicYear?: string; status?: string }): Promise<Array<{ id: string; name: string }>> {
  const params = new URLSearchParams()
  if (filters.academicYear) {
    params.set('academicYear', filters.academicYear)
  }
  if (filters.status) {
    params.set('status', filters.status)
  }

  const response = await fetch(`/api/classes?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch classes')
  }
  
  const classesData = await response.json()
  return (classesData || []).map((cls: any) => ({
    id: cls.id,
    name: cls.name || cls.class_name || 'Unknown Class'
  }))
}

export function MarksTracking() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const globalAcademicYear = useGlobalAcademicYear()
  const [academicYear, setAcademicYear] = useState(globalAcademicYear)
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [selectedClass, setSelectedClass] = useState<string>("all")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set())

  // Sync academic year with global academic year from app configuration
  // Defaults to global value when available, but allows manual override
  useEffect(() => {
    if (globalAcademicYear && !academicYear) {
      setAcademicYear(globalAcademicYear)
    }
  }, [globalAcademicYear, academicYear])

  // Fetch sequence configuration
  const { data: sequenceConfig, isLoading: loadingSequences } = useSequenceConfiguration(academicYear)

  // Extract unique terms from configuration
  const sequences = sequenceConfig?.sequences
  const terms = useMemo(() => {
    if (!sequences) return []
    return Array.from(new Set(sequences.map(s => s.term))).sort()
  }, [sequences])

  // Set default term to first term if available
  useEffect(() => {
    if (terms.length > 0 && (!selectedTerm || !terms.includes(selectedTerm))) {
      setSelectedTerm(terms[0])
    }
  }, [terms, selectedTerm])
  // Fetch classes list with React Query (cached)
  const { 
    data: classesList = [], 
    isLoading: loadingClasses,
    error: classesError 
  } = useQuery({
    queryKey: classesKeys.list({ academicYear, status: 'active' }),
    queryFn: () => fetchClasses({ academicYear, status: 'active' }),
    enabled: !!academicYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Show error toast for classes if needed
  useEffect(() => {
    if (classesError) {
      toast({
        title: "Error",
        description: "Failed to load classes list",
        variant: "destructive"
      })
    }
  }, [classesError, toast])

  // Fetch marks tracking data with React Query (cached and prefetched)
  const marksTrackingFilters = useMemo(() => ({
    academicYear,
    term: selectedTerm || undefined,
    classId: selectedClass !== 'all' ? selectedClass : undefined,
    subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
  }), [academicYear, selectedTerm, selectedClass, selectedSubject])

  const { 
    data, 
    isLoading: loading, 
    error: marksError,
    refetch,
    isFetching 
  } = useQuery({
    queryKey: marksTrackingKeys.list(marksTrackingFilters),
    queryFn: () => fetchMarksTracking(marksTrackingFilters),
    enabled: !!academicYear && !!selectedTerm,
    staleTime: 2 * 60 * 1000, // 2 minutes - marks data changes frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
  })

  // Show error toast for marks tracking if needed
  useEffect(() => {
    if (marksError) {
      toast({
        title: "Error",
        description: marksError instanceof Error ? marksError.message : "Failed to load marks tracking data",
        variant: "destructive"
      })
    }
  }, [marksError, toast])

  // Prefetch next likely filter combinations (optimistic prefetching)
  useEffect(() => {
    if (!academicYear || !selectedTerm) return

    // Prefetch with different class selections
    if (classesList.length > 0) {
      classesList.slice(0, 3).forEach((cls) => {
        queryClient.prefetchQuery({
          queryKey: marksTrackingKeys.list({
            ...marksTrackingFilters,
            classId: cls.id,
          }),
          queryFn: () => fetchMarksTracking({
            ...marksTrackingFilters,
            classId: cls.id,
          }),
          staleTime: 2 * 60 * 1000,
        })
      })
    }
  }, [academicYear, selectedTerm, classesList, marksTrackingFilters, queryClient])

  // Optimistic filter updates - update UI immediately and prefetch
  const handleClassChange = useCallback((value: string) => {
    setSelectedClass(value)
    // Prefetch data for the new class selection
    const newFilters = {
      ...marksTrackingFilters,
      classId: value !== 'all' ? value : undefined,
    }
    queryClient.prefetchQuery({
      queryKey: marksTrackingKeys.list(newFilters),
      queryFn: () => fetchMarksTracking(newFilters),
      staleTime: 2 * 60 * 1000,
    })
  }, [marksTrackingFilters, queryClient])

  const handleSubjectChange = useCallback((value: string) => {
    setSelectedSubject(value)
    // Prefetch data for the new subject selection
    const newFilters = {
      ...marksTrackingFilters,
      subjectId: value !== 'all' ? value : undefined,
    }
    queryClient.prefetchQuery({
      queryKey: marksTrackingKeys.list(newFilters),
      queryFn: () => fetchMarksTracking(newFilters),
      staleTime: 2 * 60 * 1000,
    })
  }, [marksTrackingFilters, queryClient])

  // Prefetch on hover for better UX
  const handleClassHover = useCallback((classId: string) => {
    if (classId === 'all' || !academicYear || !selectedTerm) return
    
    queryClient.prefetchQuery({
      queryKey: marksTrackingKeys.list({
        ...marksTrackingFilters,
        classId,
      }),
      queryFn: () => fetchMarksTracking({
        ...marksTrackingFilters,
        classId,
      }),
      staleTime: 2 * 60 * 1000,
    })
  }, [academicYear, selectedTerm, marksTrackingFilters, queryClient])

  // Calculate percentages
  const teacherCompletionRate = data?.summary
    ? Math.round((data.summary.teachersFilled / data.summary.totalTeachers) * 100) || 0
    : 0

  const subjectCompletionRate = data?.summary
    ? Math.round((data.summary.subjectsFilled / data.summary.totalSubjects) * 100) || 0
    : 0

  const classCompletionRate = data?.summary
    ? Math.round((data.summary.classesFilled / data.summary.totalClasses) * 100) || 0
    : 0

  // Filter teachers by search query
  const filteredTeachersFilled = useMemo(() => {
    if (!data?.teachers.filled) return []
    if (!searchQuery) return data.teachers.filled
    const query = searchQuery.toLowerCase()
    return data.teachers.filled.filter(teacher =>
      teacher.teacherName.toLowerCase().includes(query) ||
      teacher.teacherEmail?.toLowerCase().includes(query)
    )
  }, [data?.teachers.filled, searchQuery])

  const filteredTeachersPending = useMemo(() => {
    if (!data?.teachers.pending) return []
    if (!searchQuery) return data.teachers.pending
    const query = searchQuery.toLowerCase()
    return data.teachers.pending.filter(teacher =>
      teacher.teacherName.toLowerCase().includes(query) ||
      teacher.teacherEmail?.toLowerCase().includes(query)
    )
  }, [data?.teachers.pending, searchQuery])

  // Export functionality
  const handleExport = () => {
    if (!data) return

    const csvRows: string[] = []
    
    // Summary
    csvRows.push('Marks Tracking Summary')
    csvRows.push(`Academic Year: ${academicYear}`)
    csvRows.push(`Term: ${selectedTerm || 'All'}`)
    csvRows.push('')
    csvRows.push('Metric,Total,Filled,Pending')
    csvRows.push(`Teachers,${data.summary.totalTeachers},${data.summary.teachersFilled},${data.summary.teachersPending}`)
    csvRows.push(`Subjects,${data.summary.totalSubjects},${data.summary.subjectsFilled},${data.summary.totalSubjects - data.summary.subjectsFilled}`)
    csvRows.push(`Classes,${data.summary.totalClasses},${data.summary.classesFilled},${data.summary.totalClasses - data.summary.classesFilled}`)
    csvRows.push('')
    
    // Teachers Filled
    csvRows.push('Teachers Who Filled Marks')
    csvRows.push('Teacher Name,Email,Subjects Count,Classes Count,Total Marks Entered')
    data.teachers.filled.forEach(teacher => {
      csvRows.push(`${teacher.teacherName},${teacher.teacherEmail || ''},${teacher.subjectsCount},${teacher.classesCount},${teacher.totalMarksEntered}`)
    })
    csvRows.push('')
    
    // Teachers Pending
    csvRows.push('Teachers Who Haven\'t Filled Marks')
    csvRows.push('Teacher Name,Email,Expected Subjects,Expected Classes')
    data.teachers.pending.forEach(teacher => {
      csvRows.push(`${teacher.teacherName},${teacher.teacherEmail || ''},${teacher.expectedSubjects.length},${teacher.expectedClasses.length}`)
    })

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marks-tracking-${academicYear}-${selectedTerm || 'all'}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Successful",
      description: "Marks tracking data has been exported to CSV",
    })
  }

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const newSet = new Set(prev)
      if (newSet.has(subjectId)) {
        newSet.delete(subjectId)
      } else {
        newSet.add(subjectId)
      }
      return newSet
    })
  }

  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => {
      const newSet = new Set(prev)
      if (newSet.has(classId)) {
        newSet.delete(classId)
      } else {
        newSet.add(classId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Marks Tracking</h1>
          <p className="text-muted-foreground">
            Track marks entry status across teachers, subjects, and classes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={loading || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(loading || isFetching) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {isFetching && !loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Updating...</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Academic Year</label>
              <Input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="e.g., 2024-2025"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Term</label>
              <Select
                value={selectedTerm}
                onValueChange={(value) => {
                  setSelectedTerm(value)
                  // Prefetch data for the new term
                  if (academicYear && value) {
                    queryClient.prefetchQuery({
                      queryKey: marksTrackingKeys.list({
                        academicYear,
                        term: value,
                        classId: selectedClass !== 'all' ? selectedClass : undefined,
                        subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
                      }),
                      queryFn: () => fetchMarksTracking({
                        academicYear,
                        term: value,
                        classId: selectedClass !== 'all' ? selectedClass : undefined,
                        subjectId: selectedSubject !== 'all' ? selectedSubject : undefined,
                      }),
                      staleTime: 2 * 60 * 1000,
                    })
                  }
                }}
                disabled={loadingSequences || terms.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map(term => (
                    <SelectItem key={term} value={term}>
                      {term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Class</label>
              <Select value={selectedClass} onValueChange={handleClassChange} disabled={loadingClasses}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClasses ? "Loading classes..." : "All Classes"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesList.map((cls) => (
                    <SelectItem 
                      key={cls.id} 
                      value={cls.id}
                      onMouseEnter={() => handleClassHover(cls.id)}
                    >
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Subject</label>
              <Select value={selectedSubject} onValueChange={handleSubjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {/* Could populate from data.subjects */}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.teachersFilled} / {data.summary.totalTeachers}
              </div>
              <p className="text-xs text-muted-foreground">
                {teacherCompletionRate}% completion rate
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {data.summary.teachersFilled} Filled
                </Badge>
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  {data.summary.teachersPending} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.subjectsFilled} / {data.summary.totalSubjects}
              </div>
              <p className="text-xs text-muted-foreground">
                {subjectCompletionRate}% completion rate
              </p>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-500">
                  {data.summary.subjectsFilled} With Marks
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classes</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.summary.classesFilled} / {data.summary.totalClasses}
              </div>
              <p className="text-xs text-muted-foreground">
                {classCompletionRate}% completion rate
              </p>
              <div className="mt-2">
                <Badge variant="default" className="bg-green-500">
                  {data.summary.classesFilled} With Marks
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Views */}
      {data && (
        <Tabs defaultValue="teachers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="classes">Classes</TabsTrigger>
          </TabsList>

          <TabsContent value="teachers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Teachers Status</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="filled" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="filled">
                      Filled ({filteredTeachersFilled.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({filteredTeachersPending.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="filled">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead>Classes</TableHead>
                          <TableHead>Marks Entered</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeachersFilled.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              No teachers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeachersFilled.map((teacher) => (
                            <TableRow key={teacher.teacherId}>
                              <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                              <TableCell>{teacher.teacherEmail || '-'}</TableCell>
                              <TableCell>{teacher.subjectsCount}</TableCell>
                              <TableCell>{teacher.classesCount}</TableCell>
                              <TableCell>{teacher.totalMarksEntered}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Filled
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="pending">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Teacher Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Expected Subjects</TableHead>
                          <TableHead>Expected Classes</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTeachersPending.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              No pending teachers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTeachersPending.map((teacher) => (
                            <TableRow key={teacher.teacherId}>
                              <TableCell className="font-medium">{teacher.teacherName}</TableCell>
                              <TableCell>{teacher.teacherEmail || '-'}</TableCell>
                              <TableCell>{teacher.expectedSubjects.length}</TableCell>
                              <TableCell>{teacher.expectedClasses.length}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subjects Breakdown</CardTitle>
                <CardDescription>
                  View marks entry status by subject and class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.subjects.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No subjects found
                    </p>
                  ) : (
                    data.subjects.map((subject) => (
                      <Collapsible
                        key={subject.subjectId || subject.branchId || `subject-${subject.subjectName}`}
                        open={expandedSubjects.has(subject.subjectId || subject.branchId || '')}
                      >
                        <CollapsibleTrigger
                          className="flex items-center justify-between w-full p-4 border rounded-lg hover:bg-accent"
                          onClick={() => toggleSubject(subject.subjectId || subject.branchId || '')}
                        >
                          <div className="flex items-center gap-2">
                            {expandedSubjects.has(subject.subjectId || subject.branchId || '') ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {subject.subjectName}
                              {subject.branchName && ` (${subject.branchName})`}
                            </span>
                            <Badge variant="outline">
                              {subject.classes.length} classes
                            </Badge>
                            <Badge
                              variant={subject.classes.some(c => c.hasMarks) ? "default" : "secondary"}
                              className={subject.classes.some(c => c.hasMarks) ? "bg-green-500" : ""}
                            >
                              {subject.classes.filter(c => c.hasMarks).length} with marks
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-6 space-y-2">
                            {subject.classes.map((classItem) => (
                              <div
                                key={classItem.classId}
                                className="flex items-center justify-between p-3 border rounded-md"
                              >
                                <div>
                                  <span className="font-medium">{classItem.className}</span>
                                  {classItem.teacherName && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      - {classItem.teacherName}
                                    </span>
                                  )}
                                </div>
                                <Badge
                                  variant={classItem.hasMarks ? "default" : "secondary"}
                                  className={classItem.hasMarks ? "bg-green-500" : ""}
                                >
                                  {classItem.hasMarks ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Marks Entered
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      No Marks
                                    </>
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Classes Breakdown</CardTitle>
                <CardDescription>
                  View marks entry status by class and subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.classes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No classes found
                    </p>
                  ) : (
                    data.classes.map((classItem) => (
                      <Collapsible
                        key={classItem.classId}
                        open={expandedClasses.has(classItem.classId)}
                      >
                        <CollapsibleTrigger
                          className="flex items-center justify-between w-full p-4 border rounded-lg hover:bg-accent"
                          onClick={() => toggleClass(classItem.classId)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedClasses.has(classItem.classId) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <span className="font-medium">{classItem.className}</span>
                            <Badge variant="outline">
                              {classItem.subjects.length} subjects
                            </Badge>
                            <Badge
                              variant={classItem.subjects.some(s => s.hasMarks) ? "default" : "secondary"}
                              className={classItem.subjects.some(s => s.hasMarks) ? "bg-green-500" : ""}
                            >
                              {classItem.subjects.filter(s => s.hasMarks).length} with marks
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-6 space-y-2">
{classItem.subjects.map((subject) => (
  <div
    key={subject.subjectId || subject.branchId || `${classItem.classId}-${subject.subjectName}`}
    className="flex items-center justify-between p-3 border rounded-md"                              >
                                <div>
                                  <span className="font-medium">
                                    {subject.subjectName}
                                    {subject.branchName && ` (${subject.branchName})`}
                                  </span>
                                  {subject.teacherName && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      - {subject.teacherName}
                                    </span>
                                  )}
                                </div>
                                <Badge
                                  variant={subject.hasMarks ? "default" : "secondary"}
                                  className={subject.hasMarks ? "bg-green-500" : ""}
                                >
                                  {subject.hasMarks ? (
                                    <>
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Marks Entered
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-3 w-3 mr-1" />
                                      No Marks
                                    </>
                                  )}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {(loading || isFetching) && !data && (
        <div className="text-center py-8 text-muted-foreground">
          <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin" />
          <p>Loading marks tracking data...</p>
        </div>
      )}

      {!loading && !isFetching && !data && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No data available. Please check your filters and try again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

