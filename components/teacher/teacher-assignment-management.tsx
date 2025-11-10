"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
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
  Calendar as CalendarIcon, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Clock,
  Award,
  Send,
  FileUp,
  RefreshCw
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { ChevronDownIcon } from "lucide-react"
import * as React from "react"
import { useTeacherGrades } from "@/lib/teacher-grades-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShimmerList } from "@/components/ui/shimmer-loading"
import { serializeSupabaseError } from "@/lib/safe-error"

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
  submission_count?: number
  graded_count?: number
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
  student_name?: string
}

export function TeacherAssignmentManagement() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { teacherSubjects } = useTeacherGrades()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewSubmissionsDialogOpen, setIsViewSubmissionsDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterClass, setFilterClass] = useState("all")
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [assignmentPage, setAssignmentPage] = useState(1)
  const assignmentsPerPage = 20

  const supabase = createClient()

  /**
   * Helper function to sleep for a given number of milliseconds
   */
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  /**
   * Retry a function with exponential backoff
   */
  const retryWithBackoff = async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelay: number = 1000
  ): Promise<T> => {
    let lastError: unknown
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt)
          console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`)
          await sleep(delay)
        }
      }
    }
    throw lastError
  }

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
      // First check if table exists, then load assignments
      checkTableExists().then((tableExists) => {
        if (tableExists) {
          loadAssignments()
        } else {
          setLoading(false)
        }
      })
    }
  }, [user?.id])

  const checkTableExists = async () => {
    try {
      // Try to query the assignments table to see if it exists
      const { data, error } = await supabase
        .from("assignments")
        .select("id")
        .limit(1)
      
      if (error) {
        const errorDetails = serializeSupabaseError(error)
        const errorMessage = errorDetails.message || ""
        const errorCode = errorDetails.code || ""
        
        // Check for table doesn't exist error
        if (errorMessage.includes('relation "assignments" does not exist') || 
            errorMessage.includes('does not exist') ||
            errorCode === '42P01') {
          console.error("Assignments table does not exist:", errorDetails)
          toast.error("Database setup required", { 
            description: "The assignments table doesn't exist. Please run the migration script: scripts/2025-11-04_018_create_assignments_tables.sql",
            duration: 10000
          })
          setError("Database setup required - Please run the migration script to create the assignments table")
          return false
        }
        
        // Check for RLS policy error
        if (errorMessage.includes('permission denied') || 
            errorMessage.includes('row-level security') ||
            errorCode === '42501') {
          console.error("RLS policy error:", errorDetails)
          toast.error("Permission denied", { 
            description: "You don't have permission to access assignments. Please check RLS policies.",
            duration: 8000
          })
          setError("Permission denied - Please check database RLS policies")
          return false
        }
        
        console.warn("Error checking table existence:", errorDetails)
        return false
      }
      
      // Table exists
      return true
    } catch (err) {
      const errorDetails = serializeSupabaseError(err)
      console.error("Error checking table existence:", errorDetails)
      return false
    }
  }

  const loadAssignments = async (isRetry: boolean = false) => {
    const operationContext = {
      operation: "loadAssignments",
      userId: user?.id,
      userEmail: user?.email,
      timestamp: new Date().toISOString(),
      retryCount: retryCount,
      isRetry: isRetry,
    }

    try {
      if (!isRetry) {
        setLoading(true)
        setRetryCount(0)
      }
      setError(null)
      
      // Check if user is available
      if (!user?.id) {
        const warningMessage = "User not available, cannot load assignments"
        console.warn(warningMessage, operationContext)
        setError("Please log in to view assignments")
        setLoading(false)
        return
      }
      
      // Execute the database query
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false })

      if (assignmentsError) {
        // Log raw error first for debugging - try multiple methods to extract error info
        const errorInfo = {
          error: assignmentsError,
          errorType: typeof assignmentsError,
          errorConstructor: assignmentsError?.constructor?.name,
          errorKeys: assignmentsError ? Object.keys(assignmentsError) : [],
          // Try to access properties that might not be enumerable
          errorMessage: (assignmentsError as any)?.message || (assignmentsError as any)?.error_description || (assignmentsError as any)?.error || undefined,
          errorCode: (assignmentsError as any)?.code || undefined,
          errorDetails: (assignmentsError as any)?.details || undefined,
          errorHint: (assignmentsError as any)?.hint || undefined,
          // Try JSON.stringify to see if we can serialize it
          errorStringified: (() => {
            try {
              return JSON.stringify(assignmentsError)
            } catch {
              return "Could not stringify error"
            }
          })(),
          // Try toString
          errorToString: (() => {
            try {
              return String(assignmentsError)
            } catch {
              return "Could not convert error to string"
            }
          })(),
          context: operationContext,
        }
        console.error("Raw assignment error:", errorInfo)

        // Validate error before serialization
        let errorDetails
        try {
          if (assignmentsError === null || assignmentsError === undefined) {
            errorDetails = {
              message: "Null or undefined error received from Supabase",
              type: "null_error",
              ...operationContext,
            }
          } else {
            errorDetails = serializeSupabaseError(assignmentsError)
            // Ensure errorDetails has a message
            if (!errorDetails.message || errorDetails.message.trim() === "") {
              errorDetails.message = "Error occurred but no message available"
            }
          }
        } catch (serializationError) {
          // If serialization itself fails, create a fallback error
          console.error("Error serialization failed:", {
            originalError: assignmentsError,
            serializationError: serializationError instanceof Error ? serializationError.message : String(serializationError),
            context: operationContext,
          })
          errorDetails = {
            message: "Error occurred but could not be serialized. Check console for details.",
            type: "serialization_failure",
            rawError: String(assignmentsError),
            ...operationContext,
          }
        }

        // Log serialized error with context
        console.error("Error fetching assignments:", {
          errorDetails,
          context: operationContext,
          stackTrace: new Error().stack,
        })
        
        // Provide specific error messages based on error type
        let userErrorMessage = "Failed to load assignments"
        let userErrorDescription = "An error occurred while loading assignments."
        
        // Check for table doesn't exist error
        if (errorDetails.message?.includes('relation "assignments" does not exist') || 
            errorDetails.message?.includes('does not exist') ||
            errorDetails.code === '42P01' ||
            errorDetails.type === 'empty_object_with_properties') {
          userErrorMessage = "Database setup required"
          userErrorDescription = `The assignments table doesn't exist or is not accessible. Please run the migration script: scripts/2025-11-04_018_create_assignments_tables.sql\n\nError: ${errorDetails.message || errorDetails.raw || 'Unknown error'}`
          setError("Database setup required - Please run the migration script")
        } else if (errorDetails.message?.includes('permission denied') || 
                   errorDetails.message?.includes('row-level security') ||
                   errorDetails.code === '42501') {
          userErrorMessage = "Permission denied"
          userErrorDescription = "You don't have permission to view assignments. Please contact your administrator."
          setError("Permission denied")
        } else if (errorDetails.message?.includes('network') || errorDetails.message?.includes('fetch')) {
          userErrorMessage = "Network error"
          userErrorDescription = "Unable to connect to the server. Please check your internet connection."
          setError("Network error")
        } else if (errorDetails.type === "empty_object") {
          userErrorMessage = "Unexpected error"
          userErrorDescription = "An unexpected error occurred. Please try refreshing the page or contact support if the issue persists."
          setError("Unexpected error occurred")
        } else {
          userErrorMessage = "Failed to load assignments"
          userErrorDescription = errorDetails.message || "An error occurred while loading assignments."
          setError("Failed to load assignments")
        }

        // Determine if error is retryable
        const isRetryable = 
          errorDetails.message?.includes('network') ||
          errorDetails.message?.includes('fetch') ||
          errorDetails.message?.includes('timeout') ||
          errorDetails.code === 'PGRST116' ||
          errorDetails.code === 'PGRST301' ||
          errorDetails.type === "empty_object"

        // Show error toast with retry option if applicable
        if (isRetryable && retryCount < 2) {
          toast.error(userErrorMessage, {
            description: `${userErrorDescription} Retrying... (${retryCount + 1}/2)`,
            duration: 3000,
          })
          // Auto-retry with exponential backoff
          const delay = 1000 * Math.pow(2, retryCount)
          setIsRetrying(true)
          setRetryCount(prev => prev + 1)
          setTimeout(() => {
            loadAssignments(true).finally(() => setIsRetrying(false))
          }, delay)
        } else {
          toast.error(userErrorMessage, {
            description: userErrorDescription,
            action: isRetryable ? {
              label: "Retry",
              onClick: () => {
                setRetryCount(0)
                loadAssignments(false)
              },
            } : undefined,
          })
          setLoading(false)
        }
        return
      }

      // Handle case where data is null or undefined
      if (!assignmentsData) {
        console.warn("No assignments data returned", operationContext)
        setAssignments([])
        setLoading(false)
        return
      }

      // Get submission counts for each assignment with proper error handling
      const assignmentsWithCounts = await Promise.all(
        assignmentsData.map(async (assignment) => {
          let submissionCount = 0
          let gradedCount = 0

          try {
            // Get total submission count
            const { count, error: countError } = await supabase
              .from("assignment_submissions")
              .select("*", { count: "exact", head: true })
              .eq("assignment_id", assignment.id)

            if (countError) {
              // Validate error before serialization
              let errorDetails
              try {
                if (countError !== null && countError !== undefined) {
                  errorDetails = serializeSupabaseError(countError)
                } else {
                  errorDetails = { message: "Null error received", type: "null_error" }
                }
              } catch (serializationError) {
                errorDetails = {
                  message: "Error serialization failed",
                  type: "serialization_failure",
                  rawError: String(countError),
                }
              }
              console.warn(`Error fetching submission count for assignment ${assignment.id}:`, {
                errorDetails,
                assignmentId: assignment.id,
                context: operationContext,
              })
              // Continue with default count of 0 instead of failing
            } else {
              submissionCount = count || 0
            }

            // Get graded submission count
            const { count: gradedCountValue, error: gradedError } = await supabase
              .from("assignment_submissions")
              .select("*", { count: "exact", head: true })
              .eq("assignment_id", assignment.id)
              .eq("status", "graded")

            if (gradedError) {
              // Validate error before serialization
              let errorDetails
              try {
                if (gradedError !== null && gradedError !== undefined) {
                  errorDetails = serializeSupabaseError(gradedError)
                } else {
                  errorDetails = { message: "Null error received", type: "null_error" }
                }
              } catch (serializationError) {
                errorDetails = {
                  message: "Error serialization failed",
                  type: "serialization_failure",
                  rawError: String(gradedError),
                }
              }
              console.warn(`Error fetching graded count for assignment ${assignment.id}:`, {
                errorDetails,
                assignmentId: assignment.id,
                context: operationContext,
              })
              // Continue with default count of 0 instead of failing
            } else {
              gradedCount = gradedCountValue || 0
            }
          } catch (err) {
            // Validate error before serialization
            let errorDetails
            try {
              if (err !== null && err !== undefined) {
                errorDetails = serializeSupabaseError(err)
              } else {
                errorDetails = { message: "Null error received", type: "null_error" }
              }
            } catch (serializationError) {
              errorDetails = {
                message: "Error serialization failed",
                type: "serialization_failure",
                rawError: String(err),
              }
            }
            console.warn(`Unexpected error fetching counts for assignment ${assignment.id}:`, {
              errorDetails,
              assignmentId: assignment.id,
              context: operationContext,
              stackTrace: err instanceof Error ? err.stack : undefined,
            })
            // Continue with default counts instead of failing the entire operation
          }

          return {
            ...assignment,
            submission_count: submissionCount,
            graded_count: gradedCount,
          }
        })
      )

      setAssignments(assignmentsWithCounts)
      setError(null)
      setRetryCount(0) // Reset retry count on success
      setIsRetrying(false)
    } catch (err) {
      // Log raw error first for debugging
      console.error("Raw unexpected error in loadAssignments:", {
        error: err,
        errorType: typeof err,
        errorConstructor: err instanceof Error ? err.constructor.name : undefined,
        context: operationContext,
        stackTrace: err instanceof Error ? err.stack : new Error().stack,
      })

      // Validate error before serialization
      let errorDetails
      try {
        if (err === null || err === undefined) {
          errorDetails = {
            message: "Null or undefined error caught in loadAssignments",
            type: "null_error",
            ...operationContext,
          }
        } else {
          errorDetails = serializeSupabaseError(err)
          // Ensure errorDetails has a message
          if (!errorDetails.message || errorDetails.message.trim() === "") {
            errorDetails.message = "An unexpected error occurred but no message available"
          }
        }
      } catch (serializationError) {
        // If serialization itself fails, create a fallback error
        console.error("Error serialization failed in catch block:", {
          originalError: err,
          serializationError: serializationError instanceof Error ? serializationError.message : String(serializationError),
          context: operationContext,
        })
        errorDetails = {
          message: "An unexpected error occurred but could not be serialized. Check console for details.",
          type: "serialization_failure",
          rawError: String(err),
          ...operationContext,
        }
      }

      // Log serialized error with full context
      console.error("Error loading assignments:", {
        errorDetails,
        context: operationContext,
        stackTrace: err instanceof Error ? err.stack : new Error().stack,
      })

      const userErrorMessage = "An unexpected error occurred"
      const userErrorDescription = errorDetails.message || "An unexpected error occurred while loading assignments. Please try again."
      
      setError(userErrorMessage)
      
      // Determine if error is retryable
      const isRetryable = 
        errorDetails.message?.includes('network') ||
        errorDetails.message?.includes('fetch') ||
        errorDetails.message?.includes('timeout') ||
        errorDetails.type === "empty_object"

      // Show error toast with retry option if applicable
      if (isRetryable && retryCount < 2 && !isRetry) {
        toast.error("Error loading assignments", {
          description: `${userErrorDescription} Retrying... (${retryCount + 1}/2)`,
          duration: 3000,
        })
        // Auto-retry with exponential backoff
        const delay = 1000 * Math.pow(2, retryCount)
        setIsRetrying(true)
        setRetryCount(prev => prev + 1)
        setTimeout(() => {
          loadAssignments(true).finally(() => setIsRetrying(false))
        }, delay)
      } else {
        toast.error("Error loading assignments", {
          description: userErrorDescription,
          action: isRetryable ? {
            label: "Retry",
            onClick: () => {
              setRetryCount(0)
              loadAssignments(false)
            },
          } : undefined,
        })
      }
    } finally {
      if (!isRetrying) {
        setLoading(false)
      }
    }
  }

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("assignment_submissions")
        .select("*")
        .eq("assignment_id", assignmentId)
        .order("submitted_at", { ascending: false })

      if (submissionsError) {
        const errorDetails = serializeSupabaseError(submissionsError)
        console.error("Error fetching submissions:", errorDetails)
        toast.error("Failed to load submissions", {
          description: errorDetails.message || "An error occurred while loading submissions.",
        })
        setSubmissions([])
        return
      }

      setSubmissions(submissionsData || [])
    } catch (err) {
      const errorDetails = serializeSupabaseError(err)
      console.error("Error loading submissions:", errorDetails)
      toast.error("Error loading submissions", {
        description: errorDetails.message || "An unexpected error occurred while loading submissions.",
      })
      setSubmissions([])
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
        toast.error("Invalid file type", { description: "Please select a PDF or Word document" })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File too large", { description: "File size must be less than 10MB" })
        return
      }

      setSelectedFile(file)
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploadingFile(true)
      
      // Check if user is available
      if (!user?.id) {
        throw new Error("User not authenticated")
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}_${Date.now()}.${fileExt}`
      const filePath = `assignments/${fileName}`

      // First, check if the storage bucket exists
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      
      if (bucketError) {
        console.warn("Could not check storage buckets:", bucketError)
      }
      
      const assignmentsBucket = buckets?.find(bucket => bucket.name === 'assignments')
      
      if (!assignmentsBucket) {
        console.warn("Storage bucket 'assignments' not found. File upload will be skipped.")
        // Return null to indicate no file was uploaded, but don't fail the assignment creation
        return null
      }

      const { data, error } = await supabase.storage
        .from('assignments')
        .upload(filePath, file)

      if (error) {
        console.error("Error uploading file:", error)
        
        // Provide specific error messages based on the error type
        if (error.message.includes('bucket') || error.message.includes('not found')) {
          throw new Error("Storage bucket not configured. Please contact your administrator.")
        } else if (error.message.includes('permission') || error.message.includes('access')) {
          throw new Error("Permission denied. Please check your storage permissions.")
        } else if (error.message.includes('size') || error.message.includes('limit')) {
          throw new Error("File too large. Please select a smaller file.")
        } else {
          throw new Error(`Upload failed: ${error.message}`)
        }
      }

      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (err) {
      console.error("Error uploading file:", err)
      
      // If it's a storage-related error, we can still create the assignment without the file
      if (err instanceof Error && (
        err.message.includes('Storage bucket') || 
        err.message.includes('Permission denied') ||
        err.message.includes('Upload failed')
      )) {
        console.warn("Storage error, continuing without file upload")
        return null
      }
      
      throw err
    } finally {
      setUploadingFile(false)
    }
  }

  const handleCreateAssignment = async (data: AssignmentFormData) => {
    try {
            // Check if user is available
      if (!user?.id) {
        toast.error("Authentication required", { description: "Please log in to create assignments." })
        return
      }

      // Validate due date
      const today = new Date().toISOString().split('T')[0]
      if (data.due_date <= today) {
        toast.error("Invalid due date", { 
          description: "Due date must be after today's date." 
        })
        return
      }

      let assignmentFileUrl: string | null = null
      let assignmentFileName: string | null = null
      let assignmentFileSize: number | null = null
      let assignmentFileType: string | null = null

      if (selectedFile) {
        try {
          assignmentFileUrl = await uploadFile(selectedFile)
          if (assignmentFileUrl) {
            assignmentFileName = selectedFile.name
            assignmentFileSize = selectedFile.size
            assignmentFileType = selectedFile.type
          } else {
            // File upload failed but we can still create the assignment
            console.warn("File upload failed, creating assignment without file")
            toast.warning("File upload failed", { description: "Assignment will be created without the attached file due to storage issues." })
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError)
          // Continue with assignment creation without the file
          toast.error("File upload failed", { description: "Assignment will be created without the attached file due to upload issues." })
        }
      }

      const { error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          assignment_id: `ASS${Date.now()}`,
          title: data.title,
          description: data.description,
          subject: data.subject,
          class_id: data.class_id,
          teacher_id: user.id,
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
        console.error("Error details:", {
          message: assignmentError.message,
          details: assignmentError.details,
          hint: assignmentError.hint,
          code: assignmentError.code
        })
        
        // Provide more specific error messages
        if (assignmentError.message?.includes('relation "assignments" does not exist')) {
          toast.error("Database setup required", { 
            description: "The assignments table doesn't exist. Please run the database setup script." 
          })
        } else if (assignmentError.message?.includes('column') && assignmentError.message?.includes('does not exist')) {
          toast.error("Database schema mismatch", { 
            description: "The database schema doesn't match the expected structure. Please update the database." 
          })
        } else if (assignmentError.message?.includes('permission denied')) {
          toast.error("Permission denied", { 
            description: "You don't have permission to create assignments. Please check your database permissions." 
          })
        } else if (assignmentError.message?.includes('valid_dates')) {
          toast.error("Invalid date range", { 
            description: "The due date must be after the assigned date. Please select a future due date." 
          })
        } else {
          toast.error("Failed to create assignment", { 
            description: assignmentError.message || "Please try again." 
          })
        }
        return
      }

      form.reset()
      setSelectedFile(null)
      setIsCreateDialogOpen(false)
      await loadAssignments()
      toast.success("Assignment created successfully!")
    } catch (err) {
      console.error("Error creating assignment:", err)
      toast.error("Error creating assignment", { description: "An error occurred while creating the assignment" })
    }
  }

  const handleEditAssignment = async (data: AssignmentFormData) => {
    if (!selectedAssignment) return

    try {
      let assignmentFileUrl = selectedAssignment.assignment_file_url
      let assignmentFileName = selectedAssignment.assignment_file_name
      let assignmentFileSize = selectedAssignment.assignment_file_size
      let assignmentFileType = selectedAssignment.assignment_file_type

      if (selectedFile) {
        assignmentFileUrl = await uploadFile(selectedFile)
        assignmentFileName = selectedFile.name
        assignmentFileSize = selectedFile.size
        assignmentFileType = selectedFile.type
      }

      const { error: assignmentError } = await supabase
        .from("assignments")
        .update({
          title: data.title,
          description: data.description,
          subject: data.subject,
          class_id: data.class_id,
          total_marks: data.total_marks,
          passing_marks: data.passing_marks,
          assignment_file_url: assignmentFileUrl,
          assignment_file_name: assignmentFileName,
          assignment_file_size: assignmentFileSize,
          assignment_file_type: assignmentFileType,
          due_date: data.due_date,
          instructions: data.instructions,
          submission_type: data.submission_type,
          allow_late_submission: data.allow_late_submission,
          late_penalty_percentage: data.late_penalty_percentage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedAssignment.id)

      if (assignmentError) {
        console.error("Error updating assignment:", assignmentError)
        toast.error("Failed to update assignment", { description: "Please try again." })
        return
      }

      form.reset()
      setSelectedFile(null)
      setIsEditDialogOpen(false)
      setSelectedAssignment(null)
      await loadAssignments()
      toast.success("Assignment updated successfully!")
    } catch (err) {
      console.error("Error updating assignment:", err)
      toast.error("Error updating assignment", { description: "An error occurred while updating the assignment" })
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This will also delete all student submissions.")) return

    try {
      const { error } = await supabase
        .from("assignments")
        .delete()
        .eq("id", assignmentId)

      if (error) {
        console.error("Error deleting assignment:", error)
        toast.error("Failed to delete assignment", { description: "Please try again." })
        return
      }

      await loadAssignments()
      toast.success("Assignment deleted successfully!")
    } catch (err) {
      console.error("Error deleting assignment:", err)
      toast.error("Error deleting assignment", { description: "An error occurred while deleting the assignment" })
    }
  }

  const handleGradeSubmission = async (submissionId: string, marks: number, feedback: string) => {
    try {
      const submission = submissions.find(sub => sub.id === submissionId)
      if (!submission || !selectedAssignment) return

      const percentage = (marks / selectedAssignment.total_marks) * 100
      const gradeLetter = getGradeLetter(percentage)
      const averageOn20 = getAverageOn20(percentage)

      const { error } = await supabase
        .from("assignment_submissions")
        .update({
          marks_obtained: marks,
          percentage: percentage,
          grade_letter: gradeLetter,
          grade_point: averageOn20, // Store average on 20 instead of GPA
          feedback: feedback,
          status: "graded",
          graded_at: new Date().toISOString(),
        })
        .eq("id", submissionId)

      if (error) {
        console.error("Error grading submission:", error)
        toast.error("Failed to grade submission", { description: "Please try again." })
        return
      }

      await loadSubmissions(selectedAssignment.id)
      toast.success("Submission graded successfully!")
    } catch (err) {
      console.error("Error grading submission:", err)
      toast.error("Error grading submission", { description: "An error occurred while grading the submission" })
    }
  }

  const getGradeLetter = (percentage: number): string => {
    // Convert percentage to Cameroonian scale of 20
    const averageOn20 = (percentage / 100) * 20
    
    if (averageOn20 >= 16) return "A" // 16-20: Excellent
    if (averageOn20 >= 14) return "B" // 14-15.99: Very Good
    if (averageOn20 >= 12) return "C" // 12-13.99: Good
    if (averageOn20 >= 10) return "D" // 10-11.99: Fair
    if (averageOn20 >= 8) return "E"  // 8-9.99: Poor
    return "F" // 0-7.99: Very Poor
  }

  const getAverageOn20 = (percentage: number): number => {
    return Math.round((percentage / 100) * 20 * 100) / 100 // Round to 2 decimal places
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

  const getSubmissionStatusBadge = (status: string) => {
    switch (status) {
      case "graded":
        return <Badge className="bg-green-100 text-green-800">Graded</Badge>
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>
      case "late":
        return <Badge className="bg-orange-100 text-orange-800">Late</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || assignment.status === filterStatus
    const matchesClass = filterClass === "all" || assignment.class_id === filterClass
    
    return matchesSearch && matchesStatus && matchesClass
  })

  // Paginated assignments
  const paginatedAssignments = filteredAssignments.slice(0, assignmentPage * assignmentsPerPage)
  const hasMoreAssignments = filteredAssignments.length > paginatedAssignments.length

  // Reset page when filters change
  useEffect(() => {
    setAssignmentPage(1)
  }, [searchTerm, filterStatus, filterClass])

  const handleEditClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    form.reset({
      title: assignment.title,
      description: assignment.description || "",
      subject: assignment.subject,
      class_id: assignment.class_id,
      total_marks: assignment.total_marks,
      passing_marks: assignment.passing_marks,
      due_date: assignment.due_date,
      instructions: assignment.instructions || "",
      submission_type: assignment.submission_type as "file" | "text" | "both",
      allow_late_submission: assignment.allow_late_submission,
      late_penalty_percentage: assignment.late_penalty_percentage,
    })
    setIsEditDialogOpen(true)
  }

  const handleViewSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment)
    await loadSubmissions(assignment.id)
    setIsViewSubmissionsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Assignment Management</h2>
          <p className="text-muted-foreground">Create and manage assignments for your classes</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Your created assignments and submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ShimmerList items={6} />
          </CardContent>
        </Card>
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
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Classes</option>
          <option value="Form 5A">Form 5A</option>
          <option value="Form 5B">Form 5B</option>
          <option value="Form 6A">Form 6A</option>
          <option value="Form 6B">Form 6B</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-red-900 mb-1">Error Loading Assignments</h3>
                <p className="text-sm text-red-700 mb-4">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAssignments()}
                  disabled={loading}
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 && !error ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Assignments Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterStatus !== "all" || filterClass !== "all" 
                  ? "Try adjusting your search or filters."
                  : "Create your first assignment to get started."
                }
              </p>
            </CardContent>
          </Card>
        ) : !error ? (
          <>
          {paginatedAssignments.map((assignment) => (
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                                         <div className="flex items-center gap-2">
                       <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                       <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                     </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.total_marks} marks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.submission_count || 0} submissions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>{assignment.graded_count || 0} graded</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewSubmissions(assignment)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Submissions ({assignment.submission_count || 0})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(assignment)}
                    >
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
          ))}
          {hasMoreAssignments && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => setAssignmentPage(prev => prev + 1)}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${filteredAssignments.length - paginatedAssignments.length} remaining)`
                )}
              </Button>
            </div>
          )}
          </>
        ) : null}
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
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="">Select Subject</option>
                          {teacherSubjects.length > 0 ? (
                            teacherSubjects.map((subject: string) => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))
                          ) : (
                            <option value="" disabled>No subjects assigned</option>
                          )}
                        </select>
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
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="">Select Class</option>
                          <option value="Form 5A">Form 5A</option>
                          <option value="Form 5B">Form 5B</option>
                          <option value="Form 6A">Form 6A</option>
                          <option value="Form 6B">Form 6B</option>
                        </select>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? new Date(field.value).toLocaleDateString() : "Select due date"}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toISOString().split('T')[0])
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
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

      {/* Edit Assignment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update assignment details
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditAssignment)} className="space-y-4">
              {/* Same form fields as create dialog */}
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
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="">Select Subject</option>
                          {teacherSubjects.length > 0 ? (
                            teacherSubjects.map((subject: string) => (
                              <option key={subject} value={subject}>{subject}</option>
                            ))
                          ) : (
                            <option value="" disabled>No subjects assigned</option>
                          )}
                        </select>
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
                        <select 
                          className="w-full px-3 py-2 border rounded-md"
                          {...field}
                        >
                          <option value="">Select Class</option>
                          <option value="Form 5A">Form 5A</option>
                          <option value="Form 5B">Form 5B</option>
                          <option value="Form 6A">Form 6A</option>
                          <option value="Form 6B">Form 6B</option>
                        </select>
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
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between font-normal"
                            >
                              {field.value ? new Date(field.value).toLocaleDateString() : "Select due date"}
                              <ChevronDownIcon className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value ? new Date(field.value) : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  field.onChange(date.toISOString().split('T')[0])
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
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
                    setIsEditDialogOpen(false)
                    form.reset()
                    setSelectedFile(null)
                    setSelectedAssignment(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploadingFile}>
                  {uploadingFile ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Assignment
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Submissions Dialog */}
      <Dialog open={isViewSubmissionsDialogOpen} onOpenChange={setIsViewSubmissionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.title} - Submissions
            </DialogTitle>
            <DialogDescription>
              View and grade student submissions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Submissions Yet</h3>
                <p className="text-muted-foreground">
                  Students haven't submitted any work for this assignment yet.
                </p>
              </div>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Student {submission.student_id}</CardTitle>
                        <CardDescription>
                          Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                          {submission.is_late && (
                            <Badge variant="destructive" className="ml-2">Late</Badge>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSubmissionStatusBadge(submission.status)}
                        {submission.status === "graded" && (
                          <div className="text-right">
                            <div className="font-medium">{submission.marks_obtained}/{selectedAssignment?.total_marks}</div>
                            <div className="text-sm text-muted-foreground">
                              {submission.grade_point}/20 ({submission.grade_letter})
                            </div>
                            <Badge variant="outline">{submission.grade_letter}</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {submission.submitted_text && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Text Submission:</h4>
                        <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                          {submission.submitted_text}
                        </p>
                      </div>
                    )}
                    
                    {submission.submission_file_name && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">File Submission:</h4>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{submission.submission_file_name}</span>
                          {submission.submission_file_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(submission.submission_file_url!, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {submission.status !== "graded" && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-2">Grade Submission:</h4>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            placeholder={`0-${selectedAssignment?.total_marks}`}
                            className="w-24"
                            id={`marks-${submission.id}`}
                          />
                          <Input
                            placeholder="Feedback (optional)"
                            className="flex-1"
                            id={`feedback-${submission.id}`}
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const marksInput = document.getElementById(`marks-${submission.id}`) as HTMLInputElement
                              const feedbackInput = document.getElementById(`feedback-${submission.id}`) as HTMLInputElement
                              const marks = parseFloat(marksInput.value)
                              const feedback = feedbackInput.value
                              
                              if (isNaN(marks) || marks < 0 || marks > (selectedAssignment?.total_marks || 0)) {
                                toast.error("Invalid marks", { description: "Please enter valid marks" })
                                return
                              }
                              
                              handleGradeSubmission(submission.id, marks, feedback)
                            }}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Grade
                          </Button>
                        </div>
                      </div>
                    )}

                    {submission.feedback && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium mb-1">Feedback:</h4>
                        <p className="text-sm text-blue-800">{submission.feedback}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
