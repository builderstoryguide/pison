"use client"

import React, { useState, useEffect } from 'react'
import { Filter, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { AdminMarksProvider, useAdminMarks } from '@/lib/admin-marks-context'
import { MarksByStudent } from './marks-by-student'
import { MarksByAssessment } from './marks-by-assessment'
import { useQueryClient } from '@tanstack/react-query'
import { usePrefetchClass } from '@/hooks/use-classes'
import { usePrefetchSubject } from '@/hooks/use-subjects'
import { useQuery } from '@tanstack/react-query'

function ManageMarksContent() {
  const { filters, setFilters, marks, loading, prefetchMarks } = useAdminMarks()
  const queryClient = useQueryClient()
  const prefetchClass = usePrefetchClass()
  const prefetchSubject = usePrefetchSubject()
  const [academicYear, setAcademicYear] = useState<string>('')

  // Fetch classes with React Query (cached)
  const { data: classesData = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', 'active'],
    queryFn: async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = '/api/classes?status=active'
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:37',message:'classes query: Before fetch',data:{url,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, { headers })
      // #region agent log
      const contentType = response.headers.get('content-type') || 'unknown'
      const responseText = await response.clone().text().catch(() => '')
      const responsePreview = responseText.substring(0, 200)
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:38',message:'classes query: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      let data
      try {
        data = await response.json()
      } catch (jsonError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:38',message:'classes query: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
      }
      if (Array.isArray(data)) {
        return data.map((c: any) => ({ id: c.id, name: c.name || c.class_name }))
      } else if (data.classes) {
        return data.classes.map((c: any) => ({ id: c.id, name: c.name || c.class_name }))
      }
      return []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch subjects with React Query (cached)
  const { data: subjectsData = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects', 'active'],
    queryFn: async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = '/api/subjects?is_active=true'
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:62',message:'subjects query: Before fetch',data:{url,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, { headers })
      // #region agent log
      const contentType = response.headers.get('content-type') || 'unknown'
      const responseText = await response.clone().text().catch(() => '')
      const responsePreview = responseText.substring(0, 200)
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:63',message:'subjects query: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      let data
      try {
        data = await response.json()
      } catch (jsonError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'manage-marks.tsx:63',message:'subjects query: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
      }
      if (Array.isArray(data)) {
        return data.map((s: any) => ({ id: s.id, name: s.name }))
      } else if (data.subjects) {
        return data.subjects.map((s: any) => ({ id: s.id, name: s.name }))
      }
      return []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Load academic year
  useEffect(() => {
    loadAcademicYear()
  }, [])

  // Prefetch marks when filters are likely to be used
  useEffect(() => {
    // Prefetch marks for common filter combinations
    if (filters.classId) {
      prefetchMarks({ ...filters, classId: filters.classId })
    }
    if (filters.subjectId) {
      prefetchMarks({ ...filters, subjectId: filters.subjectId })
    }
  }, [filters, prefetchMarks])

  const loadAcademicYear = async () => {
    try {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = '/api/app-config'
      const response = await fetch(url, { headers })
      
      // Check if response is OK and is JSON
      if (!response.ok) {
        console.warn(`Failed to fetch app config: ${response.status} ${response.statusText}`)
        // Use default academic year if API fails
        const defaultYear = '2024-2025'
        setAcademicYear(defaultYear)
        setFilters({ ...filters, academicYear: defaultYear })
        return
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        console.warn(`Unexpected content type from app-config: ${contentType}`)
        // Use default academic year if response is not JSON
        const defaultYear = '2024-2025'
        setAcademicYear(defaultYear)
        setFilters({ ...filters, academicYear: defaultYear })
        return
      }

      const data = await response.json()
      
      // Handle the response format
      const academicYearValue = data.config?.academicYear || data.configuration?.academic_year || '2024-2025'
      
      if (academicYearValue) {
        setAcademicYear(academicYearValue)
        setFilters({ ...filters, academicYear: academicYearValue })
      }
    } catch (error) {
      console.error('Error loading academic year:', error)
      // Fallback to default academic year on any error
      const defaultYear = '2024-2025'
      setAcademicYear(defaultYear)
      setFilters({ ...filters, academicYear: defaultYear })
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({
      ...filters,
      [key]: value === 'all' ? undefined : value,
    })
  }

  const handleClearFilters = () => {
    setFilters({
      academicYear: academicYear || undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manage Marks</h1>
        <p className="text-muted-foreground">
          View and manage student marks across all assessments
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
              <CardDescription>Filter marks by class, subject, and more</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={filters.classId || 'all'}
                onValueChange={(value) => handleFilterChange('classId', value)}
                disabled={loadingClasses}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingClasses ? 'Loading...' : 'All Classes'} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Classes</SelectItem>
                  {classesData.map((cls) => (
                    <SelectItem 
                      key={cls.id} 
                      value={cls.id}
                      onMouseEnter={() => {
                        prefetchClass(cls.id)
                        // Prefetch marks for this class
                        prefetchMarks({ ...filters, classId: cls.id })
                      }}
                    >
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Select
                value={filters.subjectId || 'all'}
                onValueChange={(value) => handleFilterChange('subjectId', value)}
                disabled={loadingSubjects}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSubjects ? 'Loading...' : 'All Subjects'} />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjectsData.map((subject) => (
                    <SelectItem 
                      key={subject.id} 
                      value={subject.id}
                      onMouseEnter={() => {
                        prefetchSubject(subject.id)
                        // Prefetch marks for this subject
                        prefetchMarks({ ...filters, subjectId: subject.id })
                      }}
                    >
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assessment Type</Label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="first sequence">First Sequence</SelectItem>
                  <SelectItem value="second sequence">Second Sequence</SelectItem>
                  <SelectItem value="third sequence">Third Sequence</SelectItem>
                  <SelectItem value="fourth sequence">Fourth Sequence</SelectItem>
                  <SelectItem value="fifth sequence">Fifth Sequence</SelectItem>
                  <SelectItem value="sixth sequence">Sixth Sequence</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Term</Label>
              <Select
                value={filters.term?.toString() || 'all'}
                onValueChange={(value) => handleFilterChange('term', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Terms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Terms</SelectItem>
                  <SelectItem value="1">Term 1</SelectItem>
                  <SelectItem value="2">Term 2</SelectItem>
                  <SelectItem value="3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content with Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="by-student" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-student">By Student</TabsTrigger>
              <TabsTrigger value="by-assessment">By Assessment</TabsTrigger>
            </TabsList>
            <TabsContent value="by-student" className="mt-4">
              <MarksByStudent />
            </TabsContent>
            <TabsContent value="by-assessment" className="mt-4">
              <MarksByAssessment />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export function ManageMarks() {
  return (
    <AdminMarksProvider>
      <ManageMarksContent />
    </AdminMarksProvider>
  )
}
