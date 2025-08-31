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
import { 
  FileText, 
  Download, 
  Upload, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  BookOpen,
  Eye,
  Send,
  FileUp
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Form validation schema
const submissionSchema = z.object({
  submittedText: z.string().optional(),
  remarks: z.string().optional(),
})

type SubmissionFormData = z.infer<typeof submissionSchema>

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
  assignment_file_url: string | null
  assignment_file_name: string | null
  assignment_file_size: number | null
  assignment_file_type: string | null
  assigned_date: string
  due_date: string
  status: string
  instructions: string | null
  submission_type: string
  allow_late_submission: boolean
  late_penalty_percentage: number
  created_at: string
  updated_at: string
}

interface AssignmentSubmission {
  id: string
  submission_id: string
  assignment_id: string
  student_id: string
  teacher_id: string
  submitted_text: string | null
  submission_file_url: string | null
  submission_file_name: string | null
  submission_file_size: number | null
  submission_file_type: string | null
  marks_obtained: number | null
  percentage: number | null
  grade_letter: string | null
  grade_point: number | null
  remarks: string | null
  feedback: string | null
  is_late: boolean
  is_absent: boolean
  is_excused: boolean
  submitted_at: string
  graded_at: string | null
  status: string
  assignment?: Assignment
}

export function StudentAssignmentsView() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isSubmissionDialogOpen, setIsSubmissionDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const supabase = createClient()

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submittedText: "",
      remarks: "",
    },
  })

  // Load assignments for the student
  useEffect(() => {
    if (user?.id) {
      loadAssignments()
      loadSubmissions()
    }
  }, [user?.id])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // First, check if the assignments table exists
      const { error: tableCheckError } = await supabase
        .from("assignments")
        .select("id")
        .limit(1)

      if (tableCheckError) {
        console.log("Assignments table not found, showing setup message")
        setError("setup_required")
        setLoading(false)
        return
      }

      // Get student's class from user profile or context
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("class_id")
        .eq("user_id", user?.id)
        .single()

      if (studentError) {
        console.error("Error fetching student data:", studentError)
        // For now, use a default class to show sample assignments
        console.log("Using default class for demo purposes")
        const defaultClassId = "Form 5A"
        
        // Try to fetch assignments for the default class
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from("assignments")
          .select("*")
          .eq("class_id", defaultClassId)
          .eq("status", "published")
          .order("due_date", { ascending: true })

        if (assignmentsError) {
          console.error("Error fetching assignments:", assignmentsError)
          setError("no_assignments")
        } else {
          setAssignments(assignmentsData || [])
        }
        setLoading(false)
        return
      }

      // Fetch assignments for the student's class
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("class_id", studentData.class_id)
        .eq("status", "published")
        .order("due_date", { ascending: true })

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError)
        setError("no_assignments")
        return
      }

      setAssignments(assignmentsData || [])
    } catch (err) {
      console.error("Error loading assignments:", err)
      setError("no_assignments")
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async () => {
    try {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("assignment_submissions")
        .select(`
          *,
          assignment:assignments(*)
        `)
        .eq("student_id", user?.id)
        .order("submitted_at", { ascending: false })

      if (submissionsError) {
        console.error("Error fetching submissions:", submissionsError)
        return
      }

      setSubmissions(submissionsData || [])
    } catch (err) {
      console.error("Error loading submissions:", err)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a PDF, Word document, or text file")
        return
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }

      setSelectedFile(file)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}_${Date.now()}.${fileExt}`
      const filePath = `assignment-submissions/${fileName}`

      const { data, error } = await supabase.storage
        .from('assignments')
        .upload(filePath, file)

      if (error) {
        console.error("Error uploading file:", error)
        throw new Error("Failed to upload file")
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error("Error uploading file:", err)
      throw err
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmitAssignment = async (data: SubmissionFormData) => {
    if (!selectedAssignment) return

    try {
      let submissionFileUrl: string | null = null
      let submissionFileName: string | null = null
      let submissionFileSize: number | null = null
      let submissionFileType: string | null = null

      // Upload file if selected
      if (selectedFile) {
        submissionFileUrl = await uploadFile(selectedFile)
        submissionFileName = selectedFile.name
        submissionFileSize = selectedFile.size
        submissionFileType = selectedFile.type
      }

      // Check if submission is late
      const now = new Date()
      const dueDate = new Date(selectedAssignment.due_date)
      const isLate = now > dueDate

      // Create submission record
      const { error: submissionError } = await supabase
        .from("assignment_submissions")
        .insert({
          submission_id: `SUB${Date.now()}`,
          assignment_id: selectedAssignment.id,
          student_id: user?.id,
          teacher_id: selectedAssignment.teacher_id,
          submitted_text: data.submittedText || null,
          submission_file_url: submissionFileUrl,
          submission_file_name: submissionFileName,
          submission_file_size: submissionFileSize,
          submission_file_type: submissionFileType,
          remarks: data.remarks || null,
          is_late: isLate,
          status: "submitted"
        })

      if (submissionError) {
        console.error("Error submitting assignment:", submissionError)
        alert("Failed to submit assignment. Please try again.")
        return
      }

      // Reset form and close dialog
      form.reset()
      setSelectedFile(null)
      setIsSubmissionDialogOpen(false)
      setSelectedAssignment(null)

      // Reload submissions
      await loadSubmissions()

      alert("Assignment submitted successfully!")
    } catch (err) {
      console.error("Error submitting assignment:", err)
      alert("An error occurred while submitting the assignment")
    }
  }

  const downloadAssignmentFile = async (assignment: Assignment) => {
    if (!assignment.assignment_file_url) {
      alert("No file available for download")
      return
    }

    try {
      const response = await fetch(assignment.assignment_file_url)
      if (!response.ok) throw new Error("Failed to download file")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = assignment.assignment_file_name || 'assignment.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error("Error downloading file:", err)
      alert("Failed to download file")
    }
  }

  const getStatusBadge = (assignment: Assignment) => {
    const submission = submissions.find(sub => sub.assignment_id === assignment.id)
    
    if (submission) {
      if (submission.status === "graded") {
        return <Badge className="bg-green-100 text-green-800">Graded</Badge>
      } else if (submission.is_late) {
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>
      } else {
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      }
    }

    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    
    if (now > dueDate) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`
    } else if (diffDays === 0) {
      return "Due today"
    } else if (diffDays === 1) {
      return "Due tomorrow"
    } else {
      return `${diffDays} days left`
    }
  }

  const getGradeDescription = (gradeLetter: string): string => {
    switch (gradeLetter) {
      case "A": return "Excellent (16-20)"
      case "B": return "Very Good (14-15.99)"
      case "C": return "Good (12-13.99)"
      case "D": return "Fair (10-11.99)"
      case "E": return "Poor (8-9.99)"
      case "F": return "Very Poor (0-7.99)"
      default: return "Unknown"
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    
    const submission = submissions.find(sub => sub.assignment_id === assignment.id)
    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    
    switch (filterStatus) {
      case "pending":
        return matchesSearch && !submission && now <= dueDate
      case "submitted":
        return matchesSearch && submission && submission.status === "submitted"
      case "graded":
        return matchesSearch && submission && submission.status === "graded"
      case "overdue":
        return matchesSearch && (!submission && now > dueDate)
      default:
        return matchesSearch
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading assignments...</p>
        </div>
      </div>
    )
  }

  if (error === "setup_required") {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Assignment System Setup Required</h3>
        <p className="text-muted-foreground mb-4">
          The assignment management system needs to be set up in the database. 
          Please contact your administrator to run the database setup script.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg text-left max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>Setup Required:</strong><br/>
            • Run the assignments SQL script<br/>
            • Create storage buckets<br/>
            • Configure sample data
          </p>
        </div>
      </div>
    )
  }

  if (error === "no_assignments") {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No Assignments Available</h3>
        <p className="text-muted-foreground mb-4">
          There are currently no assignments assigned to your class. 
          Check back later or contact your teacher.
        </p>
        <Button onClick={loadAssignments} variant="outline">Refresh</Button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading Assignments</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadAssignments}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Assignments</h2>
          <p className="text-muted-foreground">View and submit your assignments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search assignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Assignments</option>
          <option value="pending">Pending</option>
          <option value="submitted">Submitted</option>
          <option value="graded">Graded</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignments Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filters."
                  : "You don't have any assignments at the moment."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const submission = submissions.find(sub => sub.assignment_id === assignment.id)
            const canSubmit = !submission || submission.status === "submitted"
            
            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {assignment.subject} • {assignment.class_id}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(assignment)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Assignment Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{getDaysUntilDue(assignment.due_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.total_marks} marks</span>
                      </div>
                    </div>

                    {/* Description */}
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                    )}

                    {/* Instructions */}
                    {assignment.instructions && (
                      <div className="bg-blue-50 p-3 rounded-md">
                        <p className="text-sm font-medium text-blue-900 mb-1">Instructions:</p>
                        <p className="text-sm text-blue-800">{assignment.instructions}</p>
                      </div>
                    )}

                    {/* Grade Display */}
                    {submission?.status === "graded" && (
                      <div className="bg-green-50 p-3 rounded-md">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">
                              Grade: {submission.grade_letter} ({submission.marks_obtained}/{assignment.total_marks})
                            </p>
                            <p className="text-sm text-green-800">
                              Average: {submission.grade_point}/20 • {getGradeDescription(submission.grade_letter)}
                            </p>
                            <p className="text-sm text-green-800">
                              Percentage: {submission.percentage}%
                            </p>
                          </div>
                          {submission.feedback && (
                            <p className="text-sm text-green-800">Feedback: {submission.feedback}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setIsViewDialogOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>

                      {assignment.assignment_file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadAssignmentFile(assignment)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}

                      {canSubmit && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setIsSubmissionDialogOpen(true)
                          }}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {submission ? "Resubmit" : "Submit"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedAssignment?.title}</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.subject} • {selectedAssignment?.class_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Due Date:</p>
                <p>{selectedAssignment?.due_date && new Date(selectedAssignment.due_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium">Total Marks:</p>
                <p>{selectedAssignment?.total_marks}</p>
              </div>
            </div>
            
            {selectedAssignment?.description && (
              <div>
                <p className="font-medium mb-2">Description:</p>
                <p className="text-sm text-muted-foreground">{selectedAssignment.description}</p>
              </div>
            )}
            
            {selectedAssignment?.instructions && (
              <div>
                <p className="font-medium mb-2">Instructions:</p>
                <p className="text-sm text-muted-foreground">{selectedAssignment.instructions}</p>
              </div>
            )}
            
            {selectedAssignment?.assignment_file_url && (
              <div>
                <p className="font-medium mb-2">Assignment File:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadAssignmentFile(selectedAssignment!)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {selectedAssignment.assignment_file_name || "Download File"}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Submit Assignment Dialog */}
      <Dialog open={isSubmissionDialogOpen} onOpenChange={setIsSubmissionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              Submit your work for: {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitAssignment)} className="space-y-4">
              <FormField
                control={form.control}
                name="submittedText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text Submission (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your assignment text here..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium">File Submission</label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, Word documents, text files (max 10MB)
                  </p>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {selectedFile.name} selected
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional comments..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsSubmissionDialogOpen(false)
                    setSelectedAssignment(null)
                    form.reset()
                    setSelectedFile(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingFile}>
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
