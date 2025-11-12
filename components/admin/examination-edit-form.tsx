"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useExamination, type Examination, type ExamFormData } from "@/lib/examination-context"
import { cn } from "@/lib/utils"
import { useLevels } from "@/hooks/use-levels"

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


const subjects = {
  english: {
    grammar: [
      "English Language",
      "English Literature",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "History",
      "Geography",
      "Economics",
      "Business Studies",
      "Computer Science",
      "French",
      "German",
      "Spanish",
      "Religious Studies",
      "Physical Education",
      "Art",
      "Music",
      "Drama",
      "Further Mathematics",
    ],
    technical: [
      "Technical Drawing",
      "Workshop Practice",
      "Engineering Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Computer Science",
      "English Language",
      "French",
    ],
    commercial: [
      "Accounting",
      "Business Studies",
      "Economics",
      "Commerce",
      "Mathematics",
      "English Language",
      "French",
      "Computer Science",
      "Office Practice",
    ],
  },
  french: {
    grammar: [
      "Français",
      "Mathématiques",
      "Physique",
      "Chimie",
      "SVT",
      "Histoire",
      "Géographie",
      "Philosophie",
      "Anglais",
      "Espagnol",
      "Allemand",
      "Latin",
      "Grec",
      "Éducation Civique",
      "EPS",
      "Arts Plastiques",
      "Musique",
      "Informatique",
    ],
    technical: [
      "Dessin Technique",
      "Atelier",
      "Sciences de l'Ingénieur",
      "Mathématiques",
      "Physique",
      "Chimie",
      "Informatique",
      "Français",
      "Anglais",
    ],
    commercial: [
      "Comptabilité",
      "Gestion",
      "Économie",
      "Commerce",
      "Mathématiques",
      "Français",
      "Anglais",
      "Informatique",
      "Bureautique",
    ],
  },
}

interface ExaminationEditFormProps {
  examination: Examination
  onSuccess: (result: { examinationId: string }) => void
  onCancel: () => void
}

export function ExaminationEditForm({ examination, onSuccess, onCancel }: ExaminationEditFormProps) {
  const { updateExamination, isLoading } = useExamination()
  const [error, setError] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(
    examination.startDate ? new Date(examination.startDate) : undefined
  )
  const [endDate, setEndDate] = useState<Date | undefined>(
    examination.endDate ? new Date(examination.endDate) : undefined
  )
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(examination.subjects)

  const form = useForm<ExamFormData>({
    resolver: zodResolver(examinationSchema),
    defaultValues: {
      title: examination.title,
      type: examination.type,
      examBoard: examination.examBoard,
      subsystem: examination.subsystem,
      branch: examination.branch,
      level: examination.level,
      subjects: examination.subjects,
      startDate: examination.startDate,
      endDate: examination.endDate,
      duration: examination.duration,
      totalMarks: examination.totalMarks,
      passingMarks: examination.passingMarks,
      venue: examination.venue,
      instructions: examination.instructions || "",
      status: examination.status,
    },
  })

  const { watch, setValue, handleSubmit, formState: { errors } } = form
  const watchedSubsystem = watch("subsystem")
  const watchedBranch = watch("branch")

  // Fetch levels based on selected subsystem and branch
  const { levels: fetchedLevels, isLoading: levelsLoading } = useLevels({
    subsystem: watchedSubsystem || null,
    branch: watchedBranch || null,
    enabled: !!watchedSubsystem && !!watchedBranch,
  })

  const availableLevels = fetchedLevels.map((level) => level.name)

  // Update available levels and subjects when subsystem or branch changes
  useEffect(() => {
    const currentLevel = watch("level")
    
    if (!availableLevels.includes(currentLevel) && availableLevels.length > 0) {
      setValue("level", availableLevels[0])
    }
  }, [watchedSubsystem, watchedBranch, availableLevels, watch, setValue])

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

    const result = await updateExamination(examination.id, formData)

    if (result.success) {
      onSuccess({ examinationId: examination.id })
    } else {
      setError(result.error || "Failed to update examination")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Edit Examination</h2>
          <p className="text-muted-foreground">Update examination details and settings</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details of the examination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Examination Title</Label>
                <Input
                  id="title"
                  {...form.register("title")}
                  placeholder="Enter examination title"
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Examination Type</Label>
                <Select value={watch("type")} onValueChange={(value) => setValue("type", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                    <SelectItem value="mock">Mock</SelectItem>
                    <SelectItem value="continuous_assessment">Continuous Assessment</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subsystem">Sub-system</Label>
                <Select value={watch("subsystem")} onValueChange={(value) => setValue("subsystem", value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sub-system" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subsystem && <p className="text-sm text-red-600">{errors.subsystem.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select value={watch("branch")} onValueChange={(value) => setValue("branch", value as any)}>
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
                <Label htmlFor="level">Level</Label>
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

            <div className="space-y-2">
              <Label htmlFor="examBoard">Exam Board</Label>
              <Select value={watch("examBoard")} onValueChange={(value) => setValue("examBoard", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam board" />
                </SelectTrigger>
                <SelectContent>
                  {examBoards[watchedSubsystem]?.map((board) => (
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

        {/* Schedule and Venue */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule and Venue</CardTitle>
            <CardDescription>Set the examination schedule and location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...form.register("duration", { valueAsNumber: true })}
                  placeholder="180"
                />
                {errors.duration && <p className="text-sm text-red-600">{errors.duration.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  {...form.register("venue")}
                  placeholder="Main Hall, Room 101, etc."
                />
                {errors.venue && <p className="text-sm text-red-600">{errors.venue.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Academic Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Academic Settings</CardTitle>
            <CardDescription>Configure marks, passing criteria, and subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  {...form.register("totalMarks", { valueAsNumber: true })}
                  placeholder="100"
                />
                {errors.totalMarks && <p className="text-sm text-red-600">{errors.totalMarks.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="passingMarks">Passing Marks</Label>
                <Input
                  id="passingMarks"
                  type="number"
                  {...form.register("passingMarks", { valueAsNumber: true })}
                  placeholder="50"
                />
                {errors.passingMarks && <p className="text-sm text-red-600">{errors.passingMarks.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
            </div>

            <div className="space-y-2">
              <Label>Subjects</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto border rounded-md p-4">
                {subjects[watchedSubsystem]?.[watchedBranch]?.map((subject) => (
                  <div key={subject} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject}
                      checked={selectedSubjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                    />
                    <Label htmlFor={subject} className="text-sm font-normal">
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.subjects && <p className="text-sm text-red-600">{errors.subjects.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                {...form.register("instructions")}
                placeholder="Enter any special instructions for students..."
                rows={3}
              />
              {errors.instructions && <p className="text-sm text-red-600">{errors.instructions.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Examination
          </Button>
        </div>
      </form>
    </div>
  )
}
