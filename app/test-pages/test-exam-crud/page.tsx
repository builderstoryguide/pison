"use client"

export const dynamic = 'force-dynamic'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useExamination, ExaminationProvider, type Examination } from "@/lib/examination-context"
import { ExaminationCreationForm } from "@/components/admin/examination-creation-form"
import { ExaminationEditForm } from "@/components/admin/examination-edit-form"
import { ExaminationDetailsDialog } from "@/components/admin/examination-details-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

function TestExamCRUDContent() {
  const { examinations, createExamination, updateExamination, deleteExamination, getExaminationById } = useExamination()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testCreateOperation = async () => {
    addTestResult("Testing CREATE operation...")
    
    const testExamData = {
      title: "Test Examination - CRUD Test",
      type: "internal" as const,
      examBoard: "Test Board",
      subsystem: "english" as const,
      branch: "grammar" as const,
      level: "Form 5",
      subjects: ["Mathematics", "English"],
      startDate: "2024-02-01",
      endDate: "2024-02-02",
      duration: 120,
      totalMarks: 100,
      passingMarks: 50,
      venue: "Test Venue",
      instructions: "This is a test examination for CRUD operations",
      status: "draft" as const
    }

    try {
      const result = await createExamination(testExamData)
      if (result.success) {
        addTestResult(`✅ CREATE successful - Exam ID: ${result.examinationId}`)
      } else {
        addTestResult(`❌ CREATE failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`❌ CREATE error: ${error}`)
    }
  }

  const testReadOperation = () => {
    addTestResult("Testing READ operation...")
    
    if (examinations.length === 0) {
      addTestResult("❌ READ failed: No examinations found")
      return
    }

    const exam = examinations[0]
    addTestResult(`✅ READ successful - Found ${examinations.length} examinations`)
    addTestResult(`   Latest exam: ${exam.title} (${exam.status})`)
    
    // Test getExaminationById
    const foundExam = getExaminationById(exam.id)
    if (foundExam) {
      addTestResult(`✅ getExaminationById successful - Found: ${foundExam.title}`)
    } else {
      addTestResult("❌ getExaminationById failed")
    }
  }

  const testUpdateOperation = async () => {
    addTestResult("Testing UPDATE operation...")
    
    if (examinations.length === 0) {
      addTestResult("❌ UPDATE failed: No examinations to update")
      return
    }

    const examToUpdate = examinations[0]
    const updateData = {
      title: `${examToUpdate.title} - UPDATED`,
      status: "scheduled" as const
    }

    try {
      const result = await updateExamination(examToUpdate.id, updateData)
      if (result.success) {
        addTestResult(`✅ UPDATE successful - Updated exam: ${examToUpdate.title}`)
      } else {
        addTestResult(`❌ UPDATE failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`❌ UPDATE error: ${error}`)
    }
  }

  const testDeleteOperation = async () => {
    addTestResult("Testing DELETE operation...")
    
    if (examinations.length === 0) {
      addTestResult("❌ DELETE failed: No examinations to delete")
      return
    }

    // Find a test examination to delete
    const examToDelete = examinations.find(exam => exam.title.includes("CRUD Test"))
    if (!examToDelete) {
      addTestResult("❌ DELETE failed: No test examination found to delete")
      return
    }

    try {
      const result = await deleteExamination(examToDelete.id)
      if (result.success) {
        addTestResult(`✅ DELETE successful - Deleted exam: ${examToDelete.title}`)
      } else {
        addTestResult(`❌ DELETE failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`❌ DELETE error: ${error}`)
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    addTestResult("🚀 Starting CRUD Operations Test Suite...")
    
    await testCreateOperation()
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for state update
    
    testReadOperation()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testUpdateOperation()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testDeleteOperation()
    
    addTestResult("🏁 CRUD Operations Test Suite completed!")
  }

  const handleViewDetails = (exam: Examination) => {
    setSelectedExam(exam)
    setShowDetailsDialog(true)
  }

  const handleEditExam = (exam: Examination) => {
    setSelectedExam(exam)
    setShowEditForm(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Examination CRUD Operations Test</h1>
        <p className="text-muted-foreground">Testing all CRUD operations for Examination Management</p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>Run tests to verify CRUD operations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} variant="default">
              🚀 Run All Tests
            </Button>
            <Button onClick={testCreateOperation} variant="outline">
              Test CREATE
            </Button>
            <Button onClick={testReadOperation} variant="outline">
              Test READ
            </Button>
            <Button onClick={testUpdateOperation} variant="outline">
              Test UPDATE
            </Button>
            <Button onClick={testDeleteOperation} variant="outline">
              Test DELETE
            </Button>
            <Button onClick={() => setShowCreateForm(true)} variant="secondary">
              Open Create Form
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Real-time test execution results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">No tests run yet. Click "Run All Tests" to start.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Examinations */}
      <Card>
        <CardHeader>
          <CardTitle>Current Examinations ({examinations.length})</CardTitle>
          <CardDescription>All examinations in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {examinations.length === 0 ? (
            <p className="text-muted-foreground">No examinations found. Create one to get started.</p>
          ) : (
            <div className="space-y-2">
              {examinations.slice(0, 5).map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <h4 className="font-medium">{exam.title}</h4>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">{exam.type}</Badge>
                      <Badge variant="outline">{exam.status}</Badge>
                      <Badge variant="outline">{exam.level}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleViewDetails(exam)}>
                      View
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEditExam(exam)}>
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
              {examinations.length > 5 && (
                <p className="text-sm text-muted-foreground">
                  Showing 5 of {examinations.length} examinations
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* CRUD Operations Status */}
      <Card>
        <CardHeader>
          <CardTitle>CRUD Operations Status</CardTitle>
          <CardDescription>Implementation status of each operation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium">CREATE</h4>
              <p className="text-sm text-muted-foreground">Fully Implemented</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium">READ</h4>
              <p className="text-sm text-muted-foreground">Fully Implemented</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium">UPDATE</h4>
              <p className="text-sm text-muted-foreground">Fully Implemented</p>
            </div>
            <div className="text-center p-4 border rounded-md">
              <div className="text-2xl mb-2">✅</div>
              <h4 className="font-medium">DELETE</h4>
              <p className="text-sm text-muted-foreground">Fully Implemented</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Examination</DialogTitle>
          </DialogHeader>
          <ExaminationCreationForm 
            onSuccess={(result) => {
              setShowCreateForm(false)
              addTestResult(`✅ Manual CREATE successful - Exam ID: ${result.examinationId}`)
            }} 
            onCancel={() => setShowCreateForm(false)} 
          />
        </DialogContent>
      </Dialog>

      {selectedExam && (
        <>
          <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Examination</DialogTitle>
              </DialogHeader>
              <ExaminationEditForm
                examination={selectedExam}
                onSuccess={(result) => {
                  setShowEditForm(false)
                  addTestResult(`✅ Manual UPDATE successful - Exam ID: ${result.examinationId}`)
                }}
                onCancel={() => setShowEditForm(false)}
              />
            </DialogContent>
          </Dialog>

          <ExaminationDetailsDialog
            examination={selectedExam}
            open={showDetailsDialog}
            onOpenChange={setShowDetailsDialog}
            onEdit={() => {
              setShowDetailsDialog(false)
              handleEditExam(selectedExam)
            }}
            onDelete={async () => {
              setShowDetailsDialog(false)
              try {
                await deleteExamination(selectedExam.id)
                addTestResult(`✅ Manual DELETE successful - Exam: ${selectedExam.title}`)
              } catch (error) {
                addTestResult(`❌ Manual DELETE failed - Exam: ${selectedExam.title} - Error: ${error}`)
              }
            }}
          />
        </>
      )}
    </div>
  )
}

export default function TestExamCRUD() {
  return (
    <ExaminationProvider>
      <TestExamCRUDContent />
    </ExaminationProvider>
  )
}
