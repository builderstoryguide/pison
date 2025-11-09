"use client"

import { useState } from "react"
import { FileText, BookOpen, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExaminationSelection } from "./examination-selection"
import { ExamMarksEntryForm } from "./exam-marks-entry-form"
import type { Examination } from "@/lib/examination-context"

type View = "selection" | "marks-entry"

export function TeacherExaminationManagement() {
  const [currentView, setCurrentView] = useState<View>("selection")
  const [selectedExamination, setSelectedExamination] = useState<Examination | null>(null)

  const handleSelectExamination = (examination: Examination) => {
    setSelectedExamination(examination)
    setCurrentView("marks-entry")
  }

  const handleBackToSelection = () => {
    setSelectedExamination(null)
    setCurrentView("selection")
  }

  const handleMarksSaved = () => {
    // Optionally show success message and go back to selection
    // Or stay on marks entry form to enter marks for another class/subject
    // For now, we'll stay on the form
  }

  return (
    <div className="space-y-6">
      {currentView === "selection" ? (
        <>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Examination Management
            </h1>
            <p className="text-muted-foreground">
              Select an examination to enter marks for your classes
            </p>
          </div>
          <ExaminationSelection
            onSelectExamination={handleSelectExamination}
            selectedExaminationId={selectedExamination?.id}
          />
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToSelection}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Examinations
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                Enter Exam Marks
              </h1>
              <p className="text-muted-foreground">
                Enter marks for {selectedExamination?.title}
              </p>
            </div>
          </div>

          {selectedExamination && (
            <Card>
              <CardHeader>
                <CardTitle>Examination Details</CardTitle>
                <CardDescription>
                  {selectedExamination.type.charAt(0).toUpperCase() + selectedExamination.type.slice(1).replace('_', ' ')} - {selectedExamination.level}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Marks</p>
                    <p className="font-medium">{selectedExamination.totalMarks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Passing Marks</p>
                    <p className="font-medium">{selectedExamination.passingMarks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Subjects</p>
                    <p className="font-medium">{selectedExamination.subjects.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{selectedExamination.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedExamination && (
            <ExamMarksEntryForm
              examination={selectedExamination}
              onSuccess={handleMarksSaved}
              onCancel={handleBackToSelection}
            />
          )}
        </>
      )}
    </div>
  )
}

