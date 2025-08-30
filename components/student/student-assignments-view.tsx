"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Download, Upload, FileText, Clock, CheckCircle, AlertCircle, Eye } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// Types
interface Assignment {
  id: string
  assignment_id: string
  title: string
  description: string
  subject: string
  class_id: string
  teacher_id: string
  total_marks: number
  passing_marks: number
  weight_percentage: number
  assignment_file_url?: string
  assignment_file_name?: string
  assignment_file_size?: number
  assignment_file_type?: string
  assigned_date: string
  due_date: string
  status: string
  instructions?: string
  submission_type: string
  allow_late_submission: boolean
  late_penalty_percentage: number
  created_at: string
  updated_at: string
  assignment_submissions?: AssignmentSubmission[]
}

interface AssignmentSubmission {
  id: string
  submission_id: string
  assignment_id: string
  student_id: string
  teacher_id: string
  submitted_text?: string
  submission_file_url?: string
  submission_file_name?: string
  submission_file_size?: number
  submission_file_type?: string
  marks_obtained?: number
  percentage?: number
  grade_letter?: string
  remarks?: string
  feedback?: string
  is_late: boolean
  is_absent: boolean
  is_excused: boolean
  submitted_at: string
  graded_at?: string
  status: string
}

// Form schema for submission
const submissionSchema = z.object({
  submitted_text: z.string().optional(),
  submission_file: z.any().optional(),
})

type SubmissionFormData = z.infer<typeof submissionSchema>

export function StudentAssignmentsView() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submitted_text: "",
    },
  })

  // Fetch assignments for the student
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch(`/api/assignments?studentId=${user?.id}`)
        if (response.ok) {
          const data = await response.json()
          setAssignments(data.assignments || [])
        }
      } catch (error) {
        console.error("Error fetching assignments:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchAssignments()
    }
  }, [user?.id])

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Handle assignment submission
  const handleSubmit = async (data: SubmissionFormData) => {
    if (!selectedAssignment || !user) return

    setSubmitting(true)
    try {
      // In a real application, you would upload the file to Supabase Storage first
      // For now, we'll simulate the file upload
      const submissionData = {
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        teacher_id: selectedAssignment.teacher_id,
        submitted_text: data.submitted_text,
        submission_file_url: selectedFile ? `/uploads/${selectedFile.name}` : undefined,
        submission_file_name: selectedFile?.name,
        submission_file_size: selectedFile?.size,
        submission_file_type: selectedFile?.type,
        status: "submitted"
      }

      const response = await fetch("/api/assignments/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      })

      if (response.ok) {
        // Refresh assignments to show updated submission status
        const updatedResponse = await fetch(`/api/assignments?studentId=${user?.id}`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setAssignments(updatedData.assignments || [])
        }
        
        // Reset form
        form.reset()
        setSelectedFile(null)
        setSelectedAssignment(null)
      } else {
        const errorData = await response.json()
        console.error("Submission error:", errorData.error)
      }
    } catch (error) {
      console.error("Error submitting assignment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get submission status for an assignment
  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = assignment.assignment_submissions?.[0]
    if (!submission) return "not_submitted"
    return submission.status
  }

  // Get status badge
  const getStatusBadge = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment)
    const isOverdue = new Date(assignment.due_date) < new Date()
    
    if (status === "graded") {
      return <Badge variant="default" className="bg-green-500">Graded</Badge>
    } else if (status === "submitted") {
      return <Badge variant="secondary">Submitted</Badge>
    } else if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>
    } else {
      return <Badge variant="outline">Not Submitted</Badge>
    }
  }

  // Get grade display
  const getGradeDisplay = (assignment: Assignment) => {
    const submission = assignment.assignment_submissions?.[0]
    if (submission?.marks_obtained !== undefined) {
      return (
        <div className="text-sm">
          <span className="font-medium">{submission.marks_obtained}/{assignment.total_marks}</span>
          {submission.grade_letter && (
            <Badge variant="outline" className="ml-2">
              {submission.grade_letter}
            </Badge>
          )}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Loading your assignments...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground">Track your assignments and deadlines</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
            <p className="text-muted-foreground">You don't have any assignments at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const submission = assignment.assignment_submissions?.[0]
            const isOverdue = new Date(assignment.due_date) < new Date()
            const canSubmit = !submission || submission.status === "submitted"

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {assignment.title}
                        {getStatusBadge(assignment)}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {assignment.subject}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Due: {format(new Date(assignment.due_date), "PPP")}
                          </span>
                          <span className="font-medium">
                            {assignment.total_marks} marks
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    {getGradeDisplay(assignment)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {assignment.description}
                  </p>
                  
                  {assignment.assignment_file_name && (
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{assignment.assignment_file_name}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(assignment.assignment_file_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}

                  {assignment.instructions && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Instructions:</h4>
                      <p className="text-sm">{assignment.instructions}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{assignment.title}</DialogTitle>
                          <DialogDescription>
                            Assignment details and submission
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          </div>
                          
                          {assignment.assignment_file_name && (
                            <div>
                              <h4 className="font-medium mb-2">Assignment File</h4>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{assignment.assignment_file_name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(assignment.assignment_file_url, '_blank')}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          )}

                          {assignment.instructions && (
                            <div>
                              <h4 className="font-medium mb-2">Instructions</h4>
                              <p className="text-sm text-muted-foreground">{assignment.instructions}</p>
                            </div>
                          )}

                          {submission && (
                            <div>
                              <h4 className="font-medium mb-2">Your Submission</h4>
                              <div className="p-3 bg-muted rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <span className="text-sm font-medium">Submitted on {format(new Date(submission.submitted_at), "PPP")}</span>
                                </div>
                                {submission.submission_file_name && (
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4" />
                                    <span className="text-sm">{submission.submission_file_name}</span>
                                  </div>
                                )}
                                {submission.submitted_text && (
                                  <div className="text-sm text-muted-foreground">
                                    {submission.submitted_text}
                                  </div>
                                )}
                                {submission.feedback && (
                                  <div className="mt-2 p-2 bg-background rounded border">
                                    <h5 className="font-medium text-sm mb-1">Feedback:</h5>
                                    <p className="text-sm">{submission.feedback}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {canSubmit && !isOverdue && (
                            <div>
                              <h4 className="font-medium mb-2">Submit Assignment</h4>
                              <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name="submitted_text"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Text Submission (Optional)</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Enter your submission text here..."
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  
                                  <div>
                                    <FormLabel>File Submission (Optional)</FormLabel>
                                    <Input
                                      type="file"
                                      accept=".pdf,.docx,.doc"
                                      onChange={handleFileChange}
                                      className="mt-1"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Accepted formats: PDF, DOCX, DOC
                                    </p>
                                  </div>

                                  <Button type="submit" disabled={submitting}>
                                    {submitting ? "Submitting..." : "Submit Assignment"}
                                  </Button>
                                </form>
                              </Form>
                            </div>
                          )}

                          {isOverdue && !submission && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm font-medium text-red-700">Assignment is overdue</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {canSubmit && !isOverdue && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedAssignment(assignment)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Submit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
