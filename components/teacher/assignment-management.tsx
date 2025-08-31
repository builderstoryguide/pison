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
  Upload, 
  Calendar, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const assignmentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  subject: z.string().min(1, "Subject is required"),
  class_id: z.string().min(1, "Class is required"),
  total_marks: z.number().min(0.1, "Total marks must be greater than 0"),
  passing_marks: z.number().min(0, "Passing marks must be non-negative"),
  due_date: z.string().min(1, "Due date is required"),
  instructions: z.string().optional(),
  submission_type: z.enum(["file", "text", "both"]),
  allow_late_submission: z.boolean(),
  late_penalty_percentage: z.number().min(0).max(100),
})

type AssignmentFormData = z.infer<typeof assignmentSchema>

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

export function AssignmentManagement() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  const supabase = createClient()

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      class_id: "",
      total_marks: 25,
      passing_marks: 12.5,
      due_date: "",
      instructions: "",
      submission_type: "file",
      allow_late_submission: false,
      late_penalty_percentage: 0,
    },
  })

  useEffect(() => {
    if (user?.id) {
      loadAssignments()
    }
  }, [user?.id])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user?.id)
        .order("created_at", { ascending: false })

      if (assignmentsError) {
        console.error("Error fetching assignments:", assignmentsError)
        setError("Failed to load assignments")
        return
      }

      setAssignments(assignmentsData || [])
    } catch (err) {
      console.error("Error loading assignments:", err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a PDF or Word document")
        return
      }

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
      const filePath = `assignments/${fileName}`

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

  const handleCreateAssignment = async (data: AssignmentFormData) => {
    try {
      let assignmentFileUrl: string | null = null
      let assignmentFileName: string | null = null
      let assignmentFileSize: number | null = null
      let assignmentFileType: string | null = null

      if (selectedFile) {
        assignmentFileUrl = await uploadFile(selectedFile)
        assignmentFileName = selectedFile.name
        assignmentFileSize = selectedFile.size
        assignmentFileType = selectedFile.type
      }

      const { error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          assignment_id: `ASS${Date.now()}`,
          title: data.title,
          description: data.description,
          subject: data.subject,
          class_id: data.class_id,
          teacher_id: user?.id,
          total_marks: data.total_marks,
          passing_marks: data.passing_marks,
          weight_percentage: 100.0,
          assignment_file_url: assignmentFileUrl,
          assignment_file_name: assignmentFileName,
          assignment_file_size: assignmentFileSize,
          assignment_file_type: assignmentFileType,
          assigned_date: new Date().toISOString().split('T')[0],
          due_date: data.due_date,
          status: "published",
          instructions: data.instructions,
          submission_type: data.submission_type,
          allow_late_submission: data.allow_late_submission,
          late_penalty_percentage: data.late_penalty_percentage,
        })

      if (assignmentError) {
        console.error("Error creating assignment:", assignmentError)
        alert("Failed to create assignment. Please try again.")
        return
      }

      form.reset()
      setSelectedFile(null)
      setIsCreateDialogOpen(false)
      await loadAssignments()
      alert("Assignment created successfully!")
    } catch (err) {
      console.error("Error creating assignment:", err)
      alert("An error occurred while creating the assignment")
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)

      if (error) {
        console.error("Error deleting assignment:", error)
        alert("Failed to delete assignment")
        return
      }

      await loadAssignments()
      alert("Assignment deleted successfully!")
    } catch (err) {
      console.error("Error deleting assignment:", err)
      alert("An error occurred while deleting the assignment")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>
      case "archived":
        return <Badge className="bg-red-100 text-red-800">Archived</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === "all") return matchesSearch
    return matchesSearch && assignment.status === filterStatus
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">Create and manage assignments for your classes</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
        </Button>
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
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignments Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" 
                  ? "Try adjusting your search or filters."
                  : "Create your first assignment to get started."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => (
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
                    {getStatusBadge(assignment.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.total_marks} marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.submission_type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {assignment.description && (
                    <p className="text-sm text-muted-foreground">
                      {assignment.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteAssignment(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Assignment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
            <DialogDescription>
              Create a new assignment for your students
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateAssignment)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assignment Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter assignment title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the assignment..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Form 5A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="total_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="passing_marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Passing Marks</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="submission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Submission Type</FormLabel>
                      <FormControl>
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="file">File Only</option>
                          <option value="text">Text Only</option>
                          <option value="both">Both</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide instructions for students..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <label className="text-sm font-medium">Assignment File (Optional)</label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepted formats: PDF, Word documents (max 10MB)
                  </p>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    {selectedFile.name} selected
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false)
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
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
