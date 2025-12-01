"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { GradableItem } from "@/hooks/use-gradable-items"

interface ClassAssignment {
  id: number
  name: string
  code: string
  [key: string]: unknown
}

interface ExaminationSequence {
  id: string
  name: string
}

interface GradeEntryFiltersProps {
  classes: ClassAssignment[]
  gradableItems: GradableItem[]
  examinationSequences: ExaminationSequence[]
  selectedClass: string
  selectedSubject: string
  selectedExam: string
  onClassChange: (classId: string) => void
  onSubjectChange: (subjectId: string) => void
  onExamChange: (examId: string) => void
  loadingClasses: boolean
  loadingSubjects: boolean
  preSelectedClassId?: string
  preSelectedSubjectId?: string
}

/**
 * Component for selecting class, subject, and examination
 * 
 * Handles:
 * - Class selection
 * - Subject/branch selection (unified)
 * - Examination sequence selection
 * - Displays ready state when all selected
 */
export function GradeEntryFilters({
  classes,
  gradableItems,
  examinationSequences,
  selectedClass,
  selectedSubject,
  selectedExam,
  onClassChange,
  onSubjectChange,
  onExamChange,
  loadingClasses,
  loadingSubjects,
  preSelectedSubjectId
}: GradeEntryFiltersProps) {
  const selectedItem = gradableItems.find(item => item.id === selectedSubject)

  return (
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
              onValueChange={onClassChange}
              disabled={loadingClasses}
            >
              <SelectTrigger id="class">
                <SelectValue
                  placeholder={loadingClasses ? "Loading classes..." : "Select a class"}
                />
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
              onValueChange={onSubjectChange}
              disabled={!!preSelectedSubjectId || !selectedClass || loadingSubjects || gradableItems.length === 0}
            >
              <SelectTrigger id="subject">
                {selectedSubject && selectedItem ? (
                  <SelectValue>
                    {selectedItem.code || selectedItem.name}
                  </SelectValue>
                ) : (
                  <SelectValue
                    placeholder={
                      !selectedClass
                        ? "Select a class first"
                        : loadingSubjects
                        ? "Loading subjects..."
                        : gradableItems.length === 0
                        ? "No subjects assigned"
                        : "Select a subject"
                    }
                  />
                )}
              </SelectTrigger>
              <SelectContent>
                {gradableItems.map((item, index) => (
                  <SelectItem key={`subject-${item.id}-${index}`} value={item.id}>
                    {item.name} ({item.code}) {item.type === 'branch' ? '(Sub-subject)' : ''}
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
              onValueChange={onExamChange}
              disabled={!selectedClass}
            >
              <SelectTrigger id="exam">
                <SelectValue placeholder="Select an examination" />
              </SelectTrigger>
              <SelectContent>
                {examinationSequences.map((exam, index) => (
                  <SelectItem key={`exam-${exam.id}-${index}`} value={exam.id}>
                    {exam.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ready State Alert */}
        {selectedClass && selectedSubject && selectedExam && selectedItem && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              Ready to enter grades for{" "}
              <strong>{selectedItem.name}</strong>
              {" "}for{" "}
              <strong>
                {examinationSequences.find(e => e.id === selectedExam)?.name}
              </strong>
              {selectedItem.type === 'branch' && (
                <span className="ml-2 text-xs text-muted-foreground">
                  (Max marks: {selectedItem.maxMarks})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
