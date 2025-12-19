"use client"

import React, { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAdminMarks } from '@/lib/admin-marks-context'
import type { Mark } from '@/hooks/use-admin-marks'
import { MarkEntryDialog } from './mark-entry-dialog'
import { MarkDeleteDialog } from './mark-delete-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrefetchMark, usePrefetchMarks } from '@/hooks/use-admin-marks'

export function MarksByStudent() {
  const { marks, loading } = useAdminMarks()
  const prefetchMark = usePrefetchMark()
  const prefetchMarks = usePrefetchMarks()
  const [editingMark, setEditingMark] = useState<Mark | null>(null)
  const [deletingMark, setDeletingMark] = useState<Mark | null>(null)
  const [creatingMark, setCreatingMark] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Group marks by student
  const marksByStudent = useMemo(() => {
    const grouped: Record<string, Mark[]> = {}
    marks.forEach((mark) => {
      if (!grouped[mark.studentId]) {
        grouped[mark.studentId] = []
      }
      grouped[mark.studentId].push(mark)
    })
    return grouped
  }, [marks])

  // Get unique students
  const students = useMemo(() => {
    const studentMap = new Map<string, { id: string; name: string; marks: Mark[] }>()
    marks.forEach((mark) => {
      if (!studentMap.has(mark.studentId)) {
        studentMap.set(mark.studentId, {
          id: mark.studentId,
          name: mark.studentName,
          marks: [],
        })
      }
      studentMap.get(mark.studentId)!.marks.push(mark)
    })
    return Array.from(studentMap.values())
  }, [marks])

  // Filter students by search
  const filteredStudents = useMemo(() => {
    if (!searchQuery) return students
    const query = searchQuery.toLowerCase()
    return students.filter((student) =>
      student.name.toLowerCase().includes(query)
    )
  }, [students, searchQuery])

  // Calculate average for a student
  const calculateAverage = (studentMarks: Mark[]): number => {
    if (studentMarks.length === 0) return 0
    const sum = studentMarks.reduce((acc, mark) => acc + mark.percentage, 0)
    return Math.round((sum / studentMarks.length) * 100) / 100
  }

  const handleEdit = (mark: Mark) => {
    setEditingMark(mark)
  }

  const handleDelete = (mark: Mark) => {
    setDeletingMark(mark)
  }

  const handleCreate = (studentId?: string) => {
    setSelectedStudentId(studentId || null)
    setCreatingMark(true)
  }

  // No need for handleDialogClose - React Query handles refetching automatically

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => handleCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Mark
        </Button>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No students found matching your search' : 'No marks found'}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredStudents.map((student) => {
            const studentMarks = marksByStudent[student.id] || []
            const average = calculateAverage(studentMarks)

            return (
              <div 
                key={student.id} 
                className="border rounded-lg"
                onMouseEnter={() => {
                  // Prefetch marks for this student when hovering
                  if (student.marks.length > 0) {
                    prefetchMarks({ studentId: student.id })
                  }
                }}
              >
                <div className="bg-muted/50 p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {studentMarks.length} mark(s) • Average: {average.toFixed(2)}%
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreate(student.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mark
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Mark</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentMarks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No marks for this student
                        </TableCell>
                      </TableRow>
                    ) : (
                      studentMarks.map((mark) => (
                        <TableRow 
                          key={mark.id}
                          onMouseEnter={() => prefetchMark(mark.id)}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{mark.assessmentName}</TableCell>
                          <TableCell>{mark.subjectName}</TableCell>
                          <TableCell>{mark.className}</TableCell>
                          <TableCell>{mark.marksObtained}/{mark.totalMarks}</TableCell>
                          <TableCell>{mark.percentage.toFixed(2)}%</TableCell>
                          <TableCell>
                            <Badge variant="outline">{mark.gradeLetter}</Badge>
                          </TableCell>
                          <TableCell>
                            {mark.assessmentDate
                              ? new Date(mark.assessmentDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(mark)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(mark)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
      )}

      <MarkEntryDialog
        open={!!editingMark || creatingMark}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMark(null)
            setCreatingMark(false)
            setSelectedStudentId(null)
          }
        }}
        mark={editingMark}
        studentId={selectedStudentId || undefined}
      />

      <MarkDeleteDialog
        open={!!deletingMark}
        onOpenChange={(open) => {
          if (!open) setDeletingMark(null)
        }}
        mark={deletingMark}
        onDeleted={() => {
        setDeletingMark(null)
      }}
      />
    </div>
  )
}
