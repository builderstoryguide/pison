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
import { CalendarIcon, Download, Upload, FileText, Clock, CheckCircle, AlertCircle, Eye, Plus, Edit, Trash2, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// Form schemas
const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  subject: z.string().min(1, "Subject is required"),
  class_id: z.string().min(1, "Class is required"),
  total_marks: z.number().min(1, "Total marks must be greater than 0"),
  passing_marks: z.number().min(0, "Passing marks must be 0 or greater"),
  weight_percentage: z.number().min(1, "Weight percentage must be greater than 0").max(100, "Weight percentage cannot exceed 100"),
  assigned_date: z.date(),
  due_date: z.date(),
  instructions: z.string().optional(),
  submission_type: z.enum(["file", "text", "both"]),
  allow_late_submission: z.boolean(),
  late_penalty_percentage: z.number().min(0).max(100),
  status: z.enum(["draft", "published", "in_progress", "completed", "archived"]),
})

const gradingSchema = z.object({
  marks_obtained: z.number().min(0, "Marks must be 0 or greater"),
  feedback: z.string().optional(),
  remarks: z.string().optional(),
})

type AssignmentFormData = z.infer<typeof assignmentSchema>
type GradingFormData = z.infer<typeof gradingSchema>

export function AssignmentManagement() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showGradingDialog, setShowGradingDialog] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      class_id: "",
      total_marks: 0,
      passing_marks: 50,
      weight_percentage: 100,
      assigned_date: new Date(),
      due_date: new Date(),
      instructions: "",
      submission_type: "file",
      allow_late_submission: false,
      late_penalty_percentage: 0,
      status: "draft",
    },
  })

  const gradingForm = useForm<GradingFormData>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      marks_obtained: 0,
      feedback: "",
      remarks: "",
    },
  })

  // Fetch assignments for the teacher
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch(`/api/assignments?teacherId=${user?.id}`)
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

  // Handle file selection for assignment creation
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Handle assignment creation
  const handleCreateAssignment = async (data: AssignmentFormData) => {
    if (!user) return

    setSubmitting(true)
    try {
      // In a real application, you would upload the file to Supabase Storage first
      const assignmentData = {
        ...data,
        teacher_id: user.id,
        assignment_file_url: selectedFile ? `/uploads/${selectedFile.name}` : undefined,
        assignment_file_name: selectedFile?.name,
        assignment_file_size: selectedFile?.size,
        assignment_file_type: selectedFile?.type,
        assigned_date: format(data.assigned_date, "yyyy-MM-dd"),
        due_date: format(data.due_date, "yyyy-MM-dd"),
      }

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assignmentData),
      })

      if (response.ok) {
        // Refresh assignments
        const updatedResponse = await fetch(`/api/assignments?teacherId=${user?.id}`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setAssignments(updatedData.assignments || [])
        }
        
        // Reset form
        assignmentForm.reset()
        setSelectedFile(null)
        setShowCreateDialog(false)
      } else {
        const errorData = await response.json()
        console.error("Creation error:", errorData.error)
      }
    } catch (error) {
      console.error("Error creating assignment:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle assignment deletion
  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      const response = await fetch(`/api/assignments?id=${assignmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Refresh assignments
        const updatedResponse = await fetch(`/api/assignments?teacherId=${user?.id}`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setAssignments(updatedData.assignments || [])
        }
      }
    } catch (error) {
      console.error("Error deleting assignment:", error)
    }
  }

  // Handle grading submission
  const handleGradeSubmission = async (data: GradingFormData) => {
    if (!selectedSubmission) return

    setSubmitting(true)
    try {
      const gradingData = {
        id: selectedSubmission.id,
        marks_obtained: data.marks_obtained,
        percentage: (data.marks_obtained / selectedAssignment!.total_marks) * 100,
        grade_letter: getGradeLetter((data.marks_obtained / selectedAssignment!.total_marks) * 100),
        feedback: data.feedback,
        remarks: data.remarks,
      }

      const response = await fetch("/api/assignments/submissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gradingData),
      })

      if (response.ok) {
        // Refresh assignments
        const updatedResponse = await fetch(`/api/assignments?teacherId=${user?.id}`)
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json()
          setAssignments(updatedData.assignments || [])
        }
        
        // Reset form
        gradingForm.reset()
        setShowGradingDialog(false)
        setSelectedSubmission(null)
      }
    } catch (error) {
      console.error("Error grading submission:", error)
    } finally {
      setSubmitting(false)
    }
  }

  // Get grade letter
  const getGradeLetter = (percentage: number): string => {
    if (percentage >= 90) return "A+"
    if (percentage >= 80) return "A"
    if (percentage >= 70) return "B+"
    if (percentage >= 60) return "B"
    if (percentage >= 50) return "C"
    if (percentage >= 40) return "D"
    return "F"
  }

  // Get submission statistics
  const getSubmissionStats = (assignment: Assignment) => {
    const submissions = assignment.assignment_submissions || []
    const total = submissions.length
    const submitted = submissions.filter(s => s.status === "submitted" || s.status === "graded").length
    const graded = submissions.filter(s => s.status === "graded").length
    const late = submissions.filter(s => s.is_late).length

    return { total, submitted, graded, late }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assignment Management</h1>
            <p className="text-muted-foreground">Create and manage assignments for your classes</p>
          </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignment Management</h1>
          <p className="text-muted-foreground">Create and manage assignments for your classes</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Create a new assignment for your students
              </DialogDescription>
            </DialogHeader>
            <Form {...assignmentForm}>
              <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assignmentForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Assignment title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={assignmentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Assignment description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assignmentForm.control}
                    name="class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                          <Input placeholder="Class (e.g., Form 5A)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="total_marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assignmentForm.control}
                    name="assigned_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Assigned Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="due_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={assignmentForm.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Special instructions for students" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={assignmentForm.control}
                    name="submission_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select submission type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="file">File Only</SelectItem>
                            <SelectItem value="text">Text Only</SelectItem>
                            <SelectItem value="both">File & Text</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={assignmentForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>Assignment File (Optional)</FormLabel>
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

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Assignment"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Assignments</h3>
            <p className="text-muted-foreground">Create your first assignment to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => {
            const stats = getSubmissionStats(assignment)
            
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {assignment.title}
                        <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
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
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4" />
                      <span>{stats.submitted}/{stats.total} submitted</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>{stats.graded} graded</span>
                    </div>
                    {stats.late > 0 && (
                      <div className="flex items-center gap-1 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{stats.late} late</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View Submissions
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{assignment.title} - Submissions</DialogTitle>
                          <DialogDescription>
                            View and grade student submissions
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {assignment.assignment_submissions?.map((submission) => (
                            <Card key={submission.id}>
                              <CardHeader>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <CardTitle className="text-lg">Student {submission.student_id}</CardTitle>
                                    <CardDescription>
                                      Submitted on {format(new Date(submission.submitted_at), "PPP")}
                                      {submission.is_late && (
                                        <Badge variant="destructive" className="ml-2">Late</Badge>
                                      )}
                                    </CardDescription>
                                  </div>
                                  {submission.status === "graded" ? (
                                    <div className="text-right">
                                      <div className="font-medium">{submission.marks_obtained}/{assignment.total_marks}</div>
                                      <Badge variant="outline">{submission.grade_letter}</Badge>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedSubmission(submission)
                                        setSelectedAssignment(assignment)
                                        setShowGradingDialog(true)
                                      }}
                                    >
                                      Grade
                                    </Button>
                                  )}
                                </div>
                              </CardHeader>
                              <CardContent>
                                {submission.submitted_text && (
                                  <div className="mb-4">
                                    <h4 className="font-medium mb-2">Text Submission:</h4>
                                    <p className="text-sm text-muted-foreground">{submission.submitted_text}</p>
                                  </div>
                                )}
                                
                                {submission.submission_file_name && (
                                  <div className="mb-4">
                                    <h4 className="font-medium mb-2">File Submission:</h4>
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm">{submission.submission_file_name}</span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(submission.submission_file_url, '_blank')}
                                      >
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                {submission.feedback && (
                                  <div className="p-3 bg-muted rounded-lg">
                                    <h4 className="font-medium mb-1">Feedback:</h4>
                                    <p className="text-sm">{submission.feedback}</p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Grading Dialog */}
      <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              Grade the student's submission
            </DialogDescription>
          </DialogHeader>
          <Form {...gradingForm}>
            <form onSubmit={gradingForm.handleSubmit(handleGradeSubmission)} className="space-y-4">
              <FormField
                control={gradingForm.control}
                name="marks_obtained"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marks Obtained</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`0-${selectedAssignment?.total_marks}`}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={gradingForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Provide feedback to the student" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={gradingForm.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional remarks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowGradingDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Grading..." : "Submit Grade"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
