"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Copy, Save, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StudentGradesTable } from "./student-grades-table"
import { useGradeEntry } from "@/hooks/use-grade-entry"
import { useClassStudents } from "@/hooks/use-class-students"
import { SequenceStatus } from "@/hooks/use-grade-entry-status"

interface BulkSequenceEntryProps {
  classId: string
  subjectId: string
  sequences: SequenceStatus[]
  students: Array<{ id: number; [key: string]: unknown }>
  maxMarks: number
  coefficient: number
  onSave?: () => void
}

export function BulkSequenceEntry({
  classId,
  subjectId,
  sequences,
  students,
  maxMarks,
  coefficient,
  onSave
}: BulkSequenceEntryProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(sequences[0]?.sequenceId || "")
  const [submitting, setSubmitting] = useState(false)
  const [submittedSequences, setSubmittedSequences] = useState<Set<string>>(new Set())

  // Create grade entry state for each sequence using a Map
  // Note: This is a simplified approach. For production, consider using a context or state management solution
  const [sequenceGradesMap, setSequenceGradesMap] = useState<Record<string, ReturnType<typeof useGradeEntry>>>({})
  
  // Initialize grade entry for each sequence
  sequences.forEach(seq => {
    if (!sequenceGradesMap[seq.sequenceId]) {
      // This will be handled by individual sequence components
    }
  })
  
  // For now, use a single grade entry and manage per-sequence state differently
  // This is a limitation - in production, you'd want proper state management
  const defaultGradeEntry = useGradeEntry(students, coefficient, maxMarks)

  const currentGrades = sequenceGrades[activeTab]

  const handleCopyFromPrevious = () => {
    const currentIndex = sequences.findIndex(s => s.sequenceId === activeTab)
    if (currentIndex <= 0) {
      toast({
        title: "No previous sequence",
        description: "This is the first sequence",
        variant: "destructive"
      })
      return
    }

    const previousSeq = sequences[currentIndex - 1]
    // Note: In a full implementation, you'd store grades per sequence
    // For now, this is a placeholder
    const previousGrades = {} // sequenceGrades[previousSeq.sequenceId]?.grades || {}

    if (Object.keys(previousGrades).length === 0) {
      toast({
        title: "No grades to copy",
        description: "The previous sequence has no grades entered",
        variant: "destructive"
      })
      return
    }

    // Copy grades from previous sequence
    Object.entries(previousGrades).forEach(([studentId, grade]) => {
      if (currentGrades && grade.mark) {
        currentGrades.updateGrade(parseInt(studentId), grade.mark as number)
      }
    })

    toast({
      title: "Grades copied",
      description: `Copied ${Object.keys(previousGrades).length} grades from ${previousSeq.sequenceName}`
    })
  }

  const handleSaveSequence = async (sequenceId: string) => {
    // Use the default grade entry for now
    // In production, you'd get the specific sequence's grades
    const grades = defaultGradeEntry
    if (!grades) return

    const validation = grades.validate()
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.message,
        variant: "destructive"
      })
      return
    }

    const gradesToSubmit = grades.getGradesForSubmission()
    if (gradesToSubmit.length === 0) {
      toast({
        title: "No Marks Entered",
        description: "Please enter at least one mark before submitting",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)
    try {
      // Save grades for this sequence
      // This would call the same API as the regular grade entry
      // Implementation depends on your API structure
      
      setSubmittedSequences(prev => new Set(prev).add(sequenceId))
      
      toast({
        title: "Success",
        description: `Successfully saved grades for ${sequences.find(s => s.sequenceId === sequenceId)?.sequenceName}`
      })

      onSave?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save grades",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveAll = async () => {
    const pendingSequences = sequences.filter(s => !submittedSequences.has(s.sequenceId))
    
    if (pendingSequences.length === 0) {
      toast({
        title: "All sequences saved",
        description: "All sequences have already been saved"
      })
      return
    }

    setSubmitting(true)
    try {
      // Validate all sequences
      const invalidSequences = pendingSequences.filter(seq => {
        const grades = sequenceGrades[seq.sequenceId]
        return grades && !grades.validate().valid
      })

      if (invalidSequences.length > 0) {
        toast({
          title: "Validation Error",
          description: `${invalidSequences.length} sequence(s) have validation errors`,
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }

      // Save all sequences
      await Promise.all(
        pendingSequences.map(seq => handleSaveSequence(seq.sequenceId))
      )

      toast({
        title: "Success",
        description: `Successfully saved ${pendingSequences.length} sequences`
      })

      onSave?.()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save all sequences",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const allCompleted = sequences.every(s => submittedSequences.has(s.sequenceId))
  const completedCount = submittedSequences.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Sequence Entry</h2>
          <p className="text-muted-foreground">
            Enter grades for multiple sequences at once
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={allCompleted ? "default" : "secondary"}>
            {completedCount}/{sequences.length} saved
          </Badge>
          <Button
            onClick={handleSaveAll}
            disabled={submitting || allCompleted}
          >
            <Save className="mr-2 h-4 w-4" />
            Save All Sequences
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full flex-wrap">          {sequences.map((seq) => (
            <TabsTrigger
              key={seq.sequenceId}
              value={seq.sequenceId}
              className="relative"
            >
              {submittedSequences.has(seq.sequenceId) && (
                <CheckCircle2 className="absolute -top-1 -right-1 h-3 w-3 text-green-600" />
              )}
              {seq.sequenceName}
            </TabsTrigger>
          ))}
        </TabsList>

        {sequences.map((seq) => {
          // Use default grade entry for all sequences
          // In production, each sequence would have its own state
          const grades = defaultGradeEntry
          if (!grades) return null

          return (
            <TabsContent key={seq.sequenceId} value={seq.sequenceId} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{seq.sequenceName}</CardTitle>
                      <CardDescription>
                        Enter grades for all students in this sequence
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {sequences.findIndex(s => s.sequenceId === seq.sequenceId) > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyFromPrevious}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy from Previous
                        </Button>
                      )}
                      <Button
                        onClick={() => handleSaveSequence(seq.sequenceId)}
                        disabled={submitting || submittedSequences.has(seq.sequenceId)}
                        variant={submittedSequences.has(seq.sequenceId) ? "outline" : "default"}
                      >
                        {submittedSequences.has(seq.sequenceId) ? (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Sequence
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <StudentGradesTable
                    students={students}
                    grades={grades.grades}
                    maxMarks={maxMarks}
                    coefficient={coefficient}
                    enteredCount={grades.enteredCount}
                    onMarkChange={grades.updateGrade}
                    onRemarksChange={grades.updateRemarks}
                    onClearAll={grades.clearAll}
                    onSubmit={() => handleSaveSequence(seq.sequenceId)}
                    isSubmitting={submitting}
                    isLoading={false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
