"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Clock, FileText, MapPin, AlertCircle, Loader2, Search, Plus, Trash2, Award } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useExamination, type ExamFormData, type GradeDefinition } from "@/lib/examination-context"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLevels } from "@/hooks/use-levels"

const gradeDefinitionSchema = z.object({
  label: z.string().min(1, "Grade label is required"),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
}).refine((data) => data.minPercentage < data.maxPercentage, {
  message: "Minimum percentage must be less than maximum percentage",
  path: ["maxPercentage"],
})

const examinationSchema = z.object({
  title: z.enum(["First sequence", "Second sequence", "Third sequence", "Fourth sequence", "Fifth sequence", "Sixth sequence"]),
  subsystem: z.enum(["english", "french"]),
  branch: z.enum(["grammar", "technical", "commercial"]),
  level: z.string().min(1, "Level is required"),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duration: z.union([z.number().min(30, "Duration must be at least 30 minutes"), z.undefined()]),
  totalMarks: z.number().min(1, "Total marks must be greater than 0"),
  passingMarks: z.number().min(1, "Passing marks must be greater than 0"),
  venue: z.string().optional(),
  instructions: z.string().optional(),
  status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"]),
  gradingSystem: z.array(gradeDefinitionSchema).optional(),
})

const examinationTitles = [
  "First sequence",
  "Second sequence",
  "Third sequence",
  "Fourth sequence",
  "Fifth sequence",
  "Sixth sequence",
]


interface ExaminationCreationFormProps {
  onSuccess: (result: { examinationId: string }) => void
  onCancel: () => void
}

interface Subject {
  id: string
  name: string
  code?: string
  is_active: boolean
}

export function ExaminationCreationForm({ onSuccess, onCancel }: ExaminationCreationFormProps) {
  const { createExamination, isLoading } = useExamination()
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [allSubjects, setAllSubjects] = useState<Subject[]>([])
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [subjectSearchTerm, setSubjectSearchTerm] = useState<string>("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [error, setError] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [grades, setGrades] = useState<GradeDefinition[]>([])

  // Check if user is admin
  const isAdmin = user?.role === 'admin'

  type ExaminationFormData = z.infer<typeof examinationSchema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExaminationFormData>({
    resolver: zodResolver(examinationSchema),
    defaultValues: {
      status: "draft",
      duration: 180,
      totalMarks: 100,
      passingMarks: 50,
      subsystem: "english" as const,
      branch: "grammar" as const,
      level: "",
      title: "First sequence" as const,
      startDate: "",
      endDate: "",
      subjects: [],
    },
  })

  const watchedSubsystem = watch("subsystem")
  const watchedBranch = watch("branch")

  // Fetch levels based on selected subsystem and branch
  const { levels: fetchedLevels, isLoading: levelsLoading } = useLevels({
    subsystem: watchedSubsystem || null,
    branch: watchedBranch || null,
    enabled: !!watchedSubsystem && !!watchedBranch,
  })

  const availableLevels = fetchedLevels.map((level) => level.name)

  // Filter subjects based on search term
  const filteredSubjects = allSubjects.filter((subject) =>
    subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
    (subject.code && subject.code.toLowerCase().includes(subjectSearchTerm.toLowerCase()))
  )

  // Load subjects from database
  useEffect(() => {
    const loadSubjects = async () => {
      setIsLoadingSubjects(true)
      try {
        const response = await fetch('/api/subjects?is_active=true')
        if (!response.ok) {
          throw new Error('Failed to load subjects')
        }
        const data = await response.json()
        // Filter only active subjects and extract just the name
        const activeSubjects = (data || []).filter((subject: Subject) => subject.is_active !== false)
        setAllSubjects(activeSubjects)
      } catch (err) {
        console.error('Error loading subjects:', err)
        toastError("Failed to Load Subjects", {
          description: "Could not load subjects from database. Please try again.",
        })
      } finally {
        setIsLoadingSubjects(false)
      }
    }

    loadSubjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubjectToggle = (subject: string) => {
    const updatedSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((s) => s !== subject)
      : [...selectedSubjects, subject]

    setSelectedSubjects(updatedSubjects)
    setValue("subjects", updatedSubjects)
  }

  // Grade management functions
  const addGrade = () => {
    const newGrade: GradeDefinition = {
      label: "",
      minPercentage: 0,
      maxPercentage: 100,
    }
    const updatedGrades = [...grades, newGrade]
    setGrades(updatedGrades)
    setValue("gradingSystem", updatedGrades)
  }

  const removeGrade = (index: number) => {
    const updatedGrades = grades.filter((_, i) => i !== index)
    setGrades(updatedGrades)
    setValue("gradingSystem", updatedGrades.length > 0 ? updatedGrades : undefined)
  }

  const updateGrade = (index: number, field: keyof GradeDefinition, value: string | number) => {
    const updatedGrades = [...grades]
    updatedGrades[index] = {
      ...updatedGrades[index],
      [field]: field === "label" ? value : Number(value),
    }
    setGrades(updatedGrades)
    setValue("gradingSystem", updatedGrades)
  }

  // Simplified validation function for grading system
  const validateGradingSystem = (): string | null => {
    if (grades.length === 0) return null // Optional field

    const labels = new Set<string>()

    // Check each grade - basic validation only
    for (let i = 0; i < grades.length; i++) {
      const grade = grades[i]

      // Check label is filled
      if (!grade.label.trim()) {
        return "All grades must have a label"
      }

      // Check unique labels
      if (labels.has(grade.label.trim())) {
        return `Duplicate grade label: ${grade.label}`
      }
      labels.add(grade.label.trim())

      // Check min < max
      if (grade.minPercentage >= grade.maxPercentage) {
        return `Grade "${grade.label}": Minimum percentage must be less than maximum percentage`
      }

      // Check bounds
      if (grade.minPercentage < 0 || grade.minPercentage > 100) {
        return `Grade "${grade.label}": Minimum percentage must be between 0 and 100`
      }
      if (grade.maxPercentage < 0 || grade.maxPercentage > 100) {
        return `Grade "${grade.label}": Maximum percentage must be between 0 and 100`
      }
    }

    return null
  }

  const onSubmit = async (data: ExaminationFormData) => {
    console.log("Form submitted with data:", data)
    console.log("Selected subjects:", selectedSubjects)
    console.log("Start date:", startDate)
    console.log("End date:", endDate)
    
    setError("")
    setIsSubmitting(true)

    try {
      // Validate dates
      if (!startDate || !endDate) {
        const errorMessage = "Please select both start and end dates"
        setError(errorMessage)
        toastError("Validation Error", {
          description: errorMessage,
        })
        setIsSubmitting(false)
        return
      }

      if (endDate < startDate) {
        const errorMessage = "End date must be after start date"
        setError(errorMessage)
        toastError("Validation Error", {
          description: errorMessage,
        })
        setIsSubmitting(false)
        return
      }

      // Validate marks
      if (data.passingMarks >= data.totalMarks) {
        const errorMessage = "Passing marks must be less than total marks"
        setError(errorMessage)
        toastError("Validation Error", {
          description: errorMessage,
        })
        setIsSubmitting(false)
        return
      }

      // Validate subjects
      if (selectedSubjects.length === 0) {
        const errorMessage = "Please select at least one subject"
        setError(errorMessage)
        toastError("Validation Error", {
          description: errorMessage,
        })
        setIsSubmitting(false)
        return
      }

      // Validate grading system if provided
      const gradingSystemError = validateGradingSystem()
      if (gradingSystemError) {
        setError(gradingSystemError)
        toastError("Grading System Validation Error", {
          description: gradingSystemError,
        })
        setIsSubmitting(false)
        return
      }

      const formData: ExamFormData = {
        ...data,
        type: "internal", // Default type since it's removed from the form
        examBoard: "School Board", // Default exam board since it's removed from the form
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        subjects: selectedSubjects,
        venue: data.venue || "", // Ensure venue is a string, not undefined
        duration: data.duration ?? 180, // Ensure duration is a number
        gradingSystem: grades.length > 0 ? grades : undefined,
      }

      console.log("Calling createExamination with:", formData)
      
      // Pass user ID and role for authorization check
      const result = await createExamination(formData, user?.id, user?.role)
      console.log("createExamination result:", result)

      if (result.success && result.examinationId) {
        toastSuccess("Examination Created Successfully!", {
          description: `"${data.title}" has been created successfully.`,
        })
        
        // Clear form data
        setSelectedSubjects([])
        setStartDate(undefined)
        setEndDate(undefined)
        setGrades([])
        
        // Call success callback
        onSuccess({ examinationId: result.examinationId })
      } else {
        const errorMessage = result.error || "Failed to create examination"
        console.error("Examination creation failed:", errorMessage)
        setError(errorMessage)
        toastError("Failed to Create Examination", {
          description: errorMessage,
        })
      }
    } catch (error) {
      console.error("Error creating examination:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while creating the examination"
      setError(errorMessage)
      toastError("Failed to Create Examination", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show unauthorized message if user is not admin
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unauthorized: Only administrators can create examinations. Please contact an administrator if you need to create an examination.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create New Examination
        </h2>
        <p className="text-muted-foreground">Fill in the details below to create a new examination</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, (errors) => {
        console.log("Form validation errors:", errors)
        // Show validation errors to user
        if (Object.keys(errors).length > 0) {
          const errorMessages = Object.entries(errors).map(([key, error]: [string, any]) => {
            return `${key}: ${error?.message || "Invalid value"}`
          }).join(", ")
          setError(`Please fix the following errors: ${errorMessages}`)
          toastError("Validation Error", {
            description: `Please fix the form errors: ${errorMessages}`,
          })
        }
      })} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the examination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Examination Title *</Label>
                <Select value={watch("title")} onValueChange={(value) => setValue("title", value as any)}>
                  <SelectTrigger id="title">
                    <SelectValue placeholder="Select examination title" />
                  </SelectTrigger>
                  <SelectContent>
                    {examinationTitles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subsystem">Sub-system *</Label>
                <Select
                  value={watch("subsystem")}
                  onValueChange={(value) => {
                    setValue("subsystem", value as any)
                    setSelectedSubjects([])
                    setValue("subjects", [])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English Sub-system</SelectItem>
                    <SelectItem value="french">French Sub-system</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subsystem && <p className="text-sm text-red-600">{errors.subsystem.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select
                  value={watch("branch")}
                  onValueChange={(value) => {
                    setValue("branch", value as any)
                    setSelectedSubjects([])
                    setValue("subjects", [])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                {errors.branch && <p className="text-sm text-red-600">{errors.branch.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select 
                  value={watch("level")} 
                  onValueChange={(value) => setValue("level", value)}
                  disabled={levelsLoading || !watchedSubsystem || !watchedBranch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={levelsLoading ? "Loading levels..." : "Select level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.length === 0 && !levelsLoading ? (
                      <SelectItem value="no-levels" disabled>
                        {!watchedSubsystem || !watchedBranch 
                          ? "Please select subsystem and branch first"
                          : "No levels available. Create levels in Class Management first."}
                      </SelectItem>
                    ) : (
                      availableLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.level && <p className="text-sm text-red-600">{errors.level.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Select the subjects for this examination</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
                  value={subjectSearchTerm}
                  onChange={(e) => setSubjectSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoadingSubjects ? (
                <div className="text-center py-4 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                  Loading subjects...
                </div>
              ) : filteredSubjects.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {allSubjects.length === 0 ? (
                    <p>No subjects found. Please create subjects first.</p>
                  ) : (
                    <p>No subjects match your search "{subjectSearchTerm}".</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredSubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={subject.id}
                        checked={selectedSubjects.includes(subject.name)}
                        onCheckedChange={() => handleSubjectToggle(subject.name)}
                      />
                      <Label htmlFor={subject.id} className="text-sm" title={subject.name}>
                        {subject.code || subject.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {selectedSubjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Subjects:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subjectName) => {
                      const subject = allSubjects.find((s) => s.name === subjectName)
                      const displayText = subject?.code || subjectName
                      return (
                        <Badge key={subjectName} variant="secondary" title={subjectName}>
                          {displayText}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              )}

              {errors.subjects && <p className="text-sm text-red-600">{errors.subjects.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Venue */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule & Venue</CardTitle>
            <CardDescription>Set the examination schedule and venue details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Start Date"
                date={startDate}
                onSelect={(date) => {
                  setStartDate(date)
                  setValue("startDate", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true })
                }}
                placeholder="Pick a start date"
                required
                error={errors.startDate?.message}
              />
              <DatePicker
                label="End Date"
                date={endDate}
                onSelect={(date) => {
                  setEndDate(date)
                  setValue("endDate", date ? format(date, "yyyy-MM-dd") : "", { shouldValidate: true })
                }}
                placeholder="Pick an end date"
                required
                error={errors.endDate?.message}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="duration"
                  type="number"
                  className="pl-10"
                  {...register("duration", { valueAsNumber: true })}
                  placeholder="180"
                  disabled
                />
              </div>
              {errors.duration && <p className="text-sm text-red-600">{errors.duration.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="venue"
                  className="pl-10"
                  {...register("venue")}
                  placeholder="e.g., Main Hall, Science Laboratory"
                  disabled
                />
              </div>
              {errors.venue && <p className="text-sm text-red-600">{errors.venue.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={watch("status")} onValueChange={(value) => setValue("status", value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-sm text-red-600">{errors.status.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Grading System */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Grading System
            </CardTitle>
            <CardDescription>Define the grading system for this examination (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks *</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  {...register("totalMarks", { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.totalMarks && <p className="text-sm text-red-600">{errors.totalMarks.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks *</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  {...register("passingMarks", { valueAsNumber: true })}
                  placeholder="50"
                />
                {errors.passingMarks && <p className="text-sm text-red-600">{errors.passingMarks.message}</p>}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-4 mb-4">
                <div>
                  <Label>Grade Definitions (Optional)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define custom grade ranges based on percentages. If no custom grades are defined, the default system (A+, A, B+, B, C+, C, D, F) will be used.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addGrade}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Grade
                </Button>
              </div>

              {grades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <p className="mb-2">No custom grades defined.</p>
                  <p className="text-sm">The default grading system will be used (A+: 90-100%, A: 80-89%, B+: 70-79%, B: 60-69%, C+: 50-59%, C: 40-49%, D: 30-39%, F: 0-29%).</p>
                  <p className="text-sm mt-2">Click "Add Grade" above to create a custom grading system.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grades.map((grade, index) => {
                    return (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">Grade {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeGrade(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`grade-label-${index}`}>Grade Label *</Label>
                            <Input
                              id={`grade-label-${index}`}
                              value={grade.label}
                              onChange={(e) => updateGrade(index, "label", e.target.value)}
                              placeholder="e.g., A, B+, Excellent"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`grade-min-${index}`}>Min % *</Label>
                            <Input
                              id={`grade-min-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={grade.minPercentage}
                              onChange={(e) => updateGrade(index, "minPercentage", e.target.value)}
                              placeholder="0"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`grade-max-${index}`}>Max % *</Label>
                            <Input
                              id={`grade-max-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              value={grade.maxPercentage}
                              onChange={(e) => updateGrade(index, "maxPercentage", e.target.value)}
                              placeholder="100"
                            />
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Range: {grade.minPercentage}% - {grade.maxPercentage}%
                        </div>
                      </div>
                    )
                  })}

                  {validateGradingSystem() && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{validateGradingSystem()}</AlertDescription>
                    </Alert>
                  )}

                  {!validateGradingSystem() && grades.length > 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Custom grading system is valid. Grades will be assigned based on these ranges.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {errors.gradingSystem && (
                <p className="text-sm text-red-600">{errors.gradingSystem.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

                 {/* Action Buttons */}
         <div className="flex justify-end gap-4">
           <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
             Cancel
           </Button>
           <Button type="submit" disabled={isLoading || isSubmitting}>
             {isSubmitting ? (
               <>
                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                 Creating...
               </>
             ) : (
               "Create Examination"
             )}
           </Button>
         </div>
      </form>
    </div>
  )
}
