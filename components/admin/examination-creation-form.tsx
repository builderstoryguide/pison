"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Clock, FileText, MapPin, AlertCircle } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useExamination, type ExamFormData } from "@/lib/examination-context"
import { cn } from "@/lib/utils"

const examinationSchema = z.object({
  title: z.string().min(1, "Examination title is required"),
  type: z.enum(["internal", "external", "mock", "continuous_assessment"]),
  examBoard: z.string().min(1, "Exam board is required"),
  subsystem: z.enum(["english", "french"]),
  branch: z.enum(["grammar", "technical", "commercial"]),
  level: z.string().min(1, "Level is required"),
  subjects: z.array(z.string()).min(1, "At least one subject is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duration: z.number().min(30, "Duration must be at least 30 minutes"),
  totalMarks: z.number().min(1, "Total marks must be greater than 0"),
  passingMarks: z.number().min(1, "Passing marks must be greater than 0"),
  venue: z.string().min(1, "Venue is required"),
  instructions: z.string().optional(),
  status: z.enum(["draft", "scheduled", "ongoing", "completed", "cancelled"]),
})

const examBoards = {
  english: ["Cambridge International", "Edexcel", "School Board", "Ministry of Education"],
  french: ["Ministère de l'Éducation", "DIPES", "School Board"],
}

const levels = {
  english: {
    grammar: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"],
    technical: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
    commercial: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
  },
  french: {
    grammar: ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"],
    technical: ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"],
    commercial: ["Sixième", "Cinquième", "Quatrième", "Troisième", "Seconde", "Première", "Terminale"],
  },
}

const subjects = {
  english: {
    grammar: [
      "Mathematics",
      "Further Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "English Language",
      "Literature in English",
      "French",
      "Geography",
      "History",
      "Economics",
      "Government",
      "Religious Studies",
      "Computer Science",
    ],
    technical: [
      "Mathematics",
      "Physics",
      "Chemistry",
      "Technical Drawing",
      "Workshop Practice",
      "Building Construction",
      "Electrical Installation",
      "Motor Vehicle Mechanics",
      "Computer Studies",
      "English Language",
    ],
    commercial: [
      "Mathematics",
      "Economics",
      "Accounting",
      "Commerce",
      "Marketing",
      "Office Practice",
      "Computer Studies",
      "English Language",
      "French",
      "Geography",
      "Government",
    ],
  },
  french: {
    grammar: [
      "Mathématiques",
      "Physique",
      "Chimie",
      "SVT",
      "Français",
      "Anglais",
      "Histoire",
      "Géographie",
      "Philosophie",
      "Économie",
      "Informatique",
      "EPS",
      "Arts Plastiques",
    ],
    technical: [
      "Mathématiques",
      "Physique",
      "Chimie",
      "Dessin Technique",
      "Technologie",
      "Électricité",
      "Mécanique",
      "Construction",
      "Informatique",
      "Français",
    ],
    commercial: [
      "Mathématiques",
      "Économie",
      "Comptabilité",
      "Commerce",
      "Marketing",
      "Bureautique",
      "Informatique",
      "Français",
      "Anglais",
      "Géographie",
    ],
  },
}

interface ExaminationCreationFormProps {
  onSuccess: (result: { examinationId: string }) => void
  onCancel: () => void
}

export function ExaminationCreationForm({ onSuccess, onCancel }: ExaminationCreationFormProps) {
  const { createExamination, isLoading } = useExamination()
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [error, setError] = useState<string>("")

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examinationSchema),
    defaultValues: {
      status: "draft",
      duration: 180,
      totalMarks: 100,
      passingMarks: 50,
    },
  })

  const watchedSubsystem = watch("subsystem")
  const watchedBranch = watch("branch")
  const watchedType = watch("type")

  const availableSubjects = watchedSubsystem && watchedBranch ? subjects[watchedSubsystem][watchedBranch] : []

  const availableLevels = watchedSubsystem && watchedBranch ? levels[watchedSubsystem][watchedBranch] : []

  const availableExamBoards = watchedSubsystem ? examBoards[watchedSubsystem] : []

  const handleSubjectToggle = (subject: string) => {
    const updatedSubjects = selectedSubjects.includes(subject)
      ? selectedSubjects.filter((s) => s !== subject)
      : [...selectedSubjects, subject]

    setSelectedSubjects(updatedSubjects)
    setValue("subjects", updatedSubjects)
  }

  const onSubmit = async (data: ExamFormData) => {
    setError("")

    if (!startDate || !endDate) {
      setError("Please select both start and end dates")
      return
    }

    if (endDate < startDate) {
      setError("End date must be after start date")
      return
    }

    if (data.passingMarks >= data.totalMarks) {
      setError("Passing marks must be less than total marks")
      return
    }

    const formData: ExamFormData = {
      ...data,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      subjects: selectedSubjects,
    }

    const result = await createExamination(formData)

    if (result.success && result.examinationId) {
      onSuccess({ examinationId: result.examinationId })
    } else {
      setError(result.error || "Failed to create examination")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create New Examination
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
                <Input id="title" {...register("title")} placeholder="e.g., First Term Mathematics Examination" />
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Examination Type *</Label>
                <Select onValueChange={(value) => setValue("type", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select examination type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Examination</SelectItem>
                    <SelectItem value="external">External Examination</SelectItem>
                    <SelectItem value="mock">Mock Examination</SelectItem>
                    <SelectItem value="continuous_assessment">Continuous Assessment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subsystem">Sub-system *</Label>
                <Select
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

              <div className="space-y-2">
                <Label htmlFor="branch">Branch *</Label>
                <Select
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
                <Select onValueChange={(value) => setValue("level", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.level && <p className="text-sm text-red-600">{errors.level.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examBoard">Exam Board *</Label>
              <Select onValueChange={(value) => setValue("examBoard", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam board" />
                </SelectTrigger>
                <SelectContent>
                  {availableExamBoards.map((board) => (
                    <SelectItem key={board} value={board}>
                      {board}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.examBoard && <p className="text-sm text-red-600">{errors.examBoard.message}</p>}
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {availableSubjects.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                    />
                    <Label htmlFor={subject} className="text-sm">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>

              {selectedSubjects.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Subjects:</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSubjects.map((subject) => (
                      <Badge key={subject} variant="secondary">
                        {subject}
                      </Badge>
                    ))}
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
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="duration"
                    type="number"
                    className="pl-10"
                    {...register("duration", { valueAsNumber: true })}
                    placeholder="180"
                  />
                </div>
                {errors.duration && <p className="text-sm text-red-600">{errors.duration.message}</p>}
              </div>

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

            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="venue"
                  className="pl-10"
                  {...register("venue")}
                  placeholder="e.g., Main Hall, Science Laboratory"
                />
              </div>
              {errors.venue && <p className="text-sm text-red-600">{errors.venue.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Instructions & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Provide instructions and set the examination status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                {...register("instructions")}
                placeholder="Enter any special instructions for the examination..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select onValueChange={(value) => setValue("status", value as any)}>
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

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Examination"}
          </Button>
        </div>
      </form>
    </div>
  )
}
