"use client"

import React, { useState, useMemo } from 'react'
import { Pencil, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAdminMarks } from '@/lib/admin-marks-context'
import type { Mark } from '@/hooks/use-admin-marks'
import { MarkEntryDialog } from './mark-entry-dialog'
import { MarkDeleteDialog } from './mark-delete-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { usePrefetchMarks, usePrefetchMark } from '@/hooks/use-admin-marks'

export function MarksByAssessment() {
  const { marks, loading } = useAdminMarks()
  const prefetchMark = usePrefetchMark()
  const prefetchMarks = usePrefetchMarks()
  const [editingMark, setEditingMark] = useState<Mark | null>(null)
  const [deletingMark, setDeletingMark] = useState<Mark | null>(null)
  const [creatingMark, setCreatingMark] = useState(false)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  // Group marks by assessment
  const marksByAssessment = useMemo(() => {
    const grouped: Record<string, Mark[]> = {}
    marks.forEach((mark) => {
      if (!grouped[mark.assessmentId]) {
        grouped[mark.assessmentId] = []
      }
      grouped[mark.assessmentId].push(mark)
    })
    return grouped
  }, [marks])

  // Get unique assessments
  const assessments = useMemo(() => {
    const assessmentMap = new Map<string, {
      id: string
      name: string
      subject: string
      type: string
      class: string
      date: string
      marks: Mark[]
    }>()
    marks.forEach((mark) => {
      if (!assessmentMap.has(mark.assessmentId)) {
        assessmentMap.set(mark.assessmentId, {
          id: mark.assessmentId,
          name: mark.assessmentName,
          subject: mark.subjectName,
          type: mark.assessmentType,
          class: mark.className,
          date: mark.assessmentDate || '',
          marks: [],
        })
      }
      assessmentMap.get(mark.assessmentId)!.marks.push(mark)
    })
    return Array.from(assessmentMap.values())
  }, [marks])

  // Filter assessments by search
  const filteredAssessments = useMemo(() => {
    if (!searchQuery) return assessments
    const query = searchQuery.toLowerCase()
    return assessments.filter((assessment) =>
      assessment.name.toLowerCase().includes(query) ||
      assessment.subject.toLowerCase().includes(query) ||
      assessment.class.toLowerCase().includes(query)
    )
  }, [assessments, searchQuery])

  // Calculate statistics for an assessment
  const calculateStats = (assessmentMarks: Mark[]) => {
    if (assessmentMarks.length === 0) {
      return { average: 0, highest: 0, lowest: 0, count: 0 }
    }
    const percentages = assessmentMarks.map((m) => m.percentage)
    const average = Math.round((percentages.reduce((a, b) => a + b, 0) / percentages.length) * 100) / 100
    const highest = Math.max(...percentages)
    const lowest = Math.min(...percentages)
    return { average, highest, lowest, count: assessmentMarks.length }
  }

  const toggleExpanded = (assessmentId: string) => {
    const newExpanded = new Set(expandedAssessments)
    if (newExpanded.has(assessmentId)) {
      newExpanded.delete(assessmentId)
    } else {
      newExpanded.add(assessmentId)
    }
    setExpandedAssessments(newExpanded)
  }

  const handleEdit = (mark: Mark) => {
    setEditingMark(mark)
  }

  const handleDelete = (mark: Mark) => {
    setDeletingMark(mark)
  }

  const handleCreate = (assessmentId?: string) => {
    setSelectedAssessmentId(assessmentId || null)
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
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => handleCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Mark
        </Button>
      </div>

      {filteredAssessments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 'No assessments found matching your search' : 'No marks found'}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((assessment) => {
            const assessmentMarks = marksByAssessment[assessment.id] || []
            const stats = calculateStats(assessmentMarks)
            const isExpanded = expandedAssessments.has(assessment.id)

            return (
              <div 
                key={assessment.id} 
                className="border rounded-lg"
                onMouseEnter={() => {
                  // Prefetch marks for this assessment when hovering
                  prefetchMarks({ assessmentId: assessment.id })
                }}
              >
                <div className="bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpanded(assessment.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <h3 className="font-semibold">{assessment.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assessment.subject} • {assessment.class} • {assessment.type}
                          {assessment.date && ` • ${new Date(assessment.date).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">
                          {stats.count} student(s)
                        </p>
                        <p className="font-medium">
                          Avg: {stats.average.toFixed(2)}% | 
                          High: {stats.highest.toFixed(2)}% | 
                          Low: {stats.lowest.toFixed(2)}%
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreate(assessment.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mark
                      </Button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Mark</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Remarks</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assessmentMarks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No marks for this assessment
                          </TableCell>
                        </TableRow>
                      ) : (
                        assessmentMarks.map((mark) => (
                          <TableRow key={mark.id}>
                            <TableCell className="font-medium">{mark.studentName}</TableCell>
                            <TableCell>{mark.marksObtained}/{mark.totalMarks}</TableCell>
                            <TableCell>{mark.percentage.toFixed(2)}%</TableCell>
                            <TableCell>
                              <Badge variant="outline">{mark.gradeLetter}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {mark.remarks || '-'}
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
                )}
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
            setSelectedAssessmentId(null)
          }
        }}
        mark={editingMark}
        assessmentId={selectedAssessmentId || undefined}
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
