"use client"

import React, { useState, useEffect } from 'react'
import { Pencil } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAdminMarks } from '@/lib/admin-marks-context'
import type { Mark } from '@/hooks/use-admin-marks'
import { StudentSearch } from '@/components/ui/student-search'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePrefetchMarks } from '@/hooks/use-admin-marks'
import {
  calculateGradeFromMarks,
  getGradeRemarks,
} from '@/lib/grading-utils'

interface MarkEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mark?: Mark | null
  assessmentId?: string
  studentId?: string
}

export function MarkEntryDialog({
  open,
  onOpenChange,
  mark,
  assessmentId: initialAssessmentId,
  studentId: initialStudentId,
}: MarkEntryDialogProps) {
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; fullName: string } | null>(null)
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedSequenceType, setSelectedSequenceType] = useState<string>('')
  const [markValue, setMarkValue] = useState<string>('')
  const [remarks, setRemarks] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const { createMark, updateMark } = useAdminMarks()
  const queryClient = useQueryClient()
  const prefetchMarks = usePrefetchMarks()

  // Load classes with React Query (cached)
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes', 'active'],
    queryFn: async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = '/api/classes?status=active'
      const response = await fetch(url, { headers })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        return data.map((c: any) => ({ id: c.id, name: c.name || c.class_name }))
      } else if (data.classes) {
        return data.classes.map((c: any) => ({ id: c.id, name: c.name || c.class_name }))
      }
      return []
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Load subjects with React Query (cached)
  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ['subjects', 'active'],
    queryFn: async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      const url = '/api/subjects?is_active=true'
      const response = await fetch(url, { headers })
      const data = await response.json()
      
      if (Array.isArray(data)) {
        return data.map((s: any) => ({ id: s.id, name: s.name || s.subject_name }))
      } else if (data.subjects) {
        return data.subjects.map((s: any) => ({ id: s.id, name: s.name || s.subject_name }))
      }
      return []
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Load assessments with React Query (cached) - kept for edit mode
  const { data: assessments = [], isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments', 'all'],
    queryFn: async () => {
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
      const user = storedUser ? JSON.parse(storedUser) : null
      
      const headers: Record<string, string> = {}
      if (user?.id) {
        headers['X-User-Id'] = user.id
      }

      // Try to fetch from assessments API, fallback to getting from marks list
      try {
        const url = '/api/assessments?limit=1000'
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:64',message:'assessments query: Before fetch',data:{url,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        const response = await fetch(url, { headers })
        // #region agent log
        const contentType = response.headers.get('content-type') || 'unknown'
        const responseText = await response.clone().text().catch(() => '')
        const responsePreview = responseText.substring(0, 200)
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:65',message:'assessments query: After fetch, before json',data:{url,status:response.status,contentType,isHTML:responsePreview.startsWith('<!'),responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
        // #endregion
        let data
        try {
          data = await response.json()
        } catch (jsonError: any) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:65',message:'assessments query: JSON parse error',data:{url,status:response.status,contentType,error:jsonError.message,responsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'K'})}).catch(()=>{});
          // #endregion
          throw new Error(`Failed to parse JSON from ${url}: ${jsonError.message}. Response preview: ${responsePreview.substring(0, 100)}`)
        }
        
        if (response.ok && data.assessments) {
          return data.assessments.map((a: any) => ({
            id: a.id,
            title: a.title || a.name,
            subject: a.subject,
            type: a.type,
            total_marks: a.total_marks || 20
          }))
        }
      } catch {
        // Fallback to marks list
      }

      // Fallback: get unique assessments from marks
      const marksUrl = '/api/admin/marks/list'
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:81',message:'assessments fallback: Before fetch',data:{url:marksUrl,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      const marksResponse = await fetch(marksUrl, { headers })
      // #region agent log
      const marksContentType = marksResponse.headers.get('content-type') || 'unknown'
      const marksResponseText = await marksResponse.clone().text().catch(() => '')
      const marksResponsePreview = marksResponseText.substring(0, 200)
      fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:82',message:'assessments fallback: After fetch, before json',data:{url:marksUrl,status:marksResponse.status,contentType:marksContentType,isHTML:marksResponsePreview.startsWith('<!'),responsePreview:marksResponsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      let marksData
      try {
        marksData = await marksResponse.json()
      } catch (jsonError: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:82',message:'assessments fallback: JSON parse error',data:{url:marksUrl,status:marksResponse.status,contentType:marksContentType,error:jsonError.message,responsePreview:marksResponsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
        // #endregion
        throw new Error(`Failed to parse JSON from ${marksUrl}: ${jsonError.message}. Response preview: ${marksResponsePreview.substring(0, 100)}`)
      }
      if (marksData.marks) {
        const uniqueAssessments = new Map()
        marksData.marks.forEach((mark: Mark) => {
          if (!uniqueAssessments.has(mark.assessmentId)) {
            uniqueAssessments.set(mark.assessmentId, {
              id: mark.assessmentId,
              title: mark.assessmentName,
              subject: mark.subjectName,
              type: mark.assessmentType,
              total_marks: mark.totalMarks
            })
          }
        })
        return Array.from(uniqueAssessments.values())
      }
      return []
    },
    enabled: open, // Only fetch when dialog is open
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Prefetch assessments when dialog is about to open
  useEffect(() => {
    if (!open) {
      // Prefetch assessments in background when dialog is closed
      queryClient.prefetchQuery({
        queryKey: ['assessments', 'all'],
        queryFn: async () => {
          const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
          const user = storedUser ? JSON.parse(storedUser) : null
          
          const headers: Record<string, string> = {}
          if (user?.id) {
            headers['X-User-Id'] = user.id
          }

          try {
            const prefetchUrl = '/api/assessments?limit=1000'
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:139',message:'assessments prefetch: Before fetch',data:{url:prefetchUrl,hasUserId:!!user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
            // #endregion
            const response = await fetch(prefetchUrl, { headers })
            // #region agent log
            const prefetchContentType = response.headers.get('content-type') || 'unknown'
            const prefetchResponseText = await response.clone().text().catch(() => '')
            const prefetchResponsePreview = prefetchResponseText.substring(0, 200)
            fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:140',message:'assessments prefetch: After fetch, before json',data:{url:prefetchUrl,status:response.status,contentType:prefetchContentType,isHTML:prefetchResponsePreview.startsWith('<!'),responsePreview:prefetchResponsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
            // #endregion
            let data
            try {
              data = await response.json()
            } catch (jsonError: any) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/ff3ab213-6dc0-4d42-bdda-aae2057cebcb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'mark-entry-dialog.tsx:140',message:'assessments prefetch: JSON parse error',data:{url:prefetchUrl,status:response.status,contentType:prefetchContentType,error:jsonError.message,responsePreview:prefetchResponsePreview},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
              // #endregion
              throw new Error(`Failed to parse JSON from ${prefetchUrl}: ${jsonError.message}. Response preview: ${prefetchResponsePreview.substring(0, 100)}`)
            }
            if (response.ok && data.assessments) {
              return data.assessments.map((a: any) => ({
                id: a.id,
                title: a.title || a.name,
                subject: a.subject,
                type: a.type,
                total_marks: a.total_marks || 20
              }))
            }
          } catch {
            // Ignore errors in prefetch
          }
          return []
        },
        staleTime: 2 * 60 * 1000,
      })
    }
  }, [open, queryClient])

  // Initialize form when dialog opens or mark changes
  useEffect(() => {
    if (open) {
      if (mark) {
        // Edit mode
        setSelectedStudent({ id: mark.studentId, fullName: mark.studentName })
        setSelectedClassId(mark.classId || '')
        setSelectedSequenceType(mark.assessmentType || '')
        setMarkValue(mark.marksObtained.toString())
        setRemarks(mark.remarks || '')
      } else {
        // Create mode
        if (initialStudentId) {
          // We'll need to fetch student name and class
          const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
          const user = storedUser ? JSON.parse(storedUser) : null
          
          const headers: Record<string, string> = {}
          
          if (user?.id) {
            headers['X-User-Id'] = user.id
          }

          fetch(`/api/students/${initialStudentId}`, { headers })
            .then(res => res.json())
            .then(data => {
              if (data.student) {
                setSelectedStudent({
                  id: data.student.id,
                  fullName: `${data.student.first_name} ${data.student.last_name}`.trim()
                })
                // Get student's class ID and set as default
                const classValue = data.student.class || data.student.class_id
                if (classValue) {
                  // Check if it's a UUID
                  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(classValue)
                  if (isUUID) {
                    setSelectedClassId(classValue)
                  } else {
                    // Try to find class by name
                    fetch(`/api/classes?name=${encodeURIComponent(classValue)}`, { headers })
                      .then(res => res.json())
                      .then(classData => {
                        if (classData.classes?.[0]?.id) {
                          setSelectedClassId(classData.classes[0].id)
                        }
                      })
                      .catch(() => {})
                  }
                }
              }
            })
            .catch(() => {})
        } else {
          setSelectedStudent(null)
          setSelectedClassId('')
        }
        setSelectedSubjectId('')
        setSelectedSequenceType('')
        setMarkValue('')
        setRemarks('')
      }
    }
  }, [open, mark, initialStudentId, initialAssessmentId])

  // Separate effect to set subject ID when subjects are loaded and we have a mark in edit mode
  useEffect(() => {
    if (open && mark && mark.subjectName && subjects.length > 0) {
      const subject = subjects.find(s => s.name === mark.subjectName)
      if (subject) {
        setSelectedSubjectId(subject.id)
      }
    }
  }, [open, mark?.id, mark?.subjectName, subjects.length])

  const handleMarkChange = (value: string) => {
    if (value === '') {
      setMarkValue('')
      return
    }
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 20) {
      setMarkValue(value)
    }
  }

  const getGradeInfo = () => {
    if (!markValue) return null
    const markNum = parseFloat(markValue)
    if (isNaN(markNum)) return null

    // Default to 20 marks for sequence assessments
    const totalMarks = 20
    const percentage = Math.round((markNum / totalMarks) * 100 * 100) / 100
    const gradeLetter = calculateGradeFromMarks(markNum, totalMarks)
    const remark = getGradeRemarks(gradeLetter)

    return { percentage, gradeLetter, remark, totalMarks }
  }

  // Find or create assessment based on student class, subject, and sequence type
  const findOrCreateAssessment = async (): Promise<string | null> => {
    if (!selectedStudent || !selectedSubjectId || !selectedSequenceType || !selectedClassId) {
      return null
    }

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('school_user') : null
    const user = storedUser ? JSON.parse(storedUser) : null
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (user?.id) {
      headers['X-User-Id'] = user.id
    }

    // Get subject name
    const subject = subjects.find(s => s.id === selectedSubjectId)
    if (!subject) {
      throw new Error('Subject not found')
    }

    const subjectName = subject.name
    // Map sequence type to sequence number for proper formatting
    const sequenceNumber = selectedSequenceType === 'first sequence' ? 1 :
                          selectedSequenceType === 'second sequence' ? 2 :
                          selectedSequenceType === 'third sequence' ? 3 :
                          selectedSequenceType === 'fourth sequence' ? 4 :
                          selectedSequenceType === 'fifth sequence' ? 5 : 6

    try {
      const response = await fetch('/api/admin/marks/find-or-create-assessment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          classId: selectedClassId,
          subjectName,
          sequenceName: selectedSequenceType, // Will be normalized on server
          sequenceType: selectedSequenceType,
          sequenceNumber,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to find or create assessment')
      }

      if (!data.assessmentId) {
        throw new Error('Assessment ID not returned from server')
      }

      return data.assessmentId
    } catch (error: any) {
      console.error('Error finding/creating assessment:', error)
      throw new Error(`Failed to find or create assessment: ${error.message}`)
    }
  }

  const handleSave = async () => {
    if (!selectedStudent || !selectedSubjectId || !selectedSequenceType || !markValue) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Student, Subject, Sequence Type, and Mark)',
        variant: 'destructive',
      })
      return
    }

    if (!selectedClassId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class for the student.',
        variant: 'destructive',
      })
      return
    }

    const markNum = parseFloat(markValue)
    if (isNaN(markNum) || markNum < 0 || markNum > 20) {
      toast({
        title: 'Invalid Mark',
        description: 'Mark must be a number between 0 and 20',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      if (mark) {
        // Update existing mark
        await updateMark(mark.id, {
          marksObtained: markNum,
          remarks: remarks || undefined,
        })
      } else {
        // Find or create assessment, then create mark
        const assessmentId = await findOrCreateAssessment()
        if (!assessmentId) {
          throw new Error('Failed to find or create assessment')
        }

        await createMark({
          studentId: selectedStudent.id,
          assessmentId,
          marksObtained: markNum,
          remarks: remarks || undefined,
        })
      }
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to register mark',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const gradeInfo = getGradeInfo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            {mark ? 'Edit Mark' : 'Create Mark'}
          </DialogTitle>
          <DialogDescription>
            {mark ? 'Update the student mark' : 'Enter a new mark for a student'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0">
          <div className="grid gap-2">
            <Label htmlFor="student">Student *</Label>
            {mark ? (
              <Input
                id="student"
                value={selectedStudent?.fullName || ''}
                disabled
                className="bg-muted"
              />
            ) : (
              <StudentSearch
                value={selectedStudent}
                onSelect={setSelectedStudent}
                placeholder="Search for a student..."
              />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="class">Class *</Label>
            <Select
              value={selectedClassId}
              onValueChange={setSelectedClassId}
              disabled={!!mark || !selectedStudent}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder={!selectedStudent ? "Select student first" : loadingClasses ? "Loading..." : "Select class"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {loadingClasses ? (
                  <SelectItem value="loading" disabled>Loading classes...</SelectItem>
                ) : !selectedStudent ? (
                  <SelectItem value="none" disabled>Please select a student first</SelectItem>
                ) : classes.length === 0 ? (
                  <SelectItem value="none" disabled>No classes found</SelectItem>
                ) : (
                  classes.map((classItem) => (
                    <SelectItem key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
              disabled={!!mark || !selectedStudent || !selectedClassId}
            >
              <SelectTrigger id="subject">
                <SelectValue placeholder={!selectedStudent || !selectedClassId ? "Select student and class first" : loadingSubjects ? "Loading..." : "Select subject"} />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {loadingSubjects ? (
                  <SelectItem value="loading" disabled>Loading subjects...</SelectItem>
                ) : !selectedStudent || !selectedClassId ? (
                  <SelectItem value="none" disabled>Please select a student and class first</SelectItem>
                ) : subjects.length === 0 ? (
                  <SelectItem value="none" disabled>No subjects found</SelectItem>
                ) : (
                  subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sequenceType">Sequence Type *</Label>
            <Select
              value={selectedSequenceType}
              onValueChange={setSelectedSequenceType}
              disabled={!!mark}
            >
              <SelectTrigger id="sequenceType">
                <SelectValue placeholder="Select sequence type" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                <SelectItem value="first sequence">First Sequence</SelectItem>
                <SelectItem value="second sequence">Second Sequence</SelectItem>
                <SelectItem value="third sequence">Third Sequence</SelectItem>
                <SelectItem value="fourth sequence">Fourth Sequence</SelectItem>
                <SelectItem value="fifth sequence">Fifth Sequence</SelectItem>
                <SelectItem value="sixth sequence">Sixth Sequence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mark">Mark (0-20) *</Label>
            <Input
              id="mark"
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={markValue}
              onChange={(e) => handleMarkChange(e.target.value)}
              placeholder="Enter mark"
            />
            {gradeInfo && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Percentage: {gradeInfo.percentage.toFixed(2)}%</p>
                <p>Grade: {gradeInfo.gradeLetter}</p>
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter remarks"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedStudent || !selectedClassId || !selectedSubjectId || !selectedSequenceType || !markValue}>
            {saving ? 'Registering...' : mark ? 'Update' : 'Register Mark'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
