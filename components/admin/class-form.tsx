"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  X, 
  Plus, 
  BookOpen, 
  Users, 
  GraduationCap, 
  UserCheck, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft
} from "lucide-react"
import { useClassManagement, type ClassFormData, type ClassData } from "@/lib/class-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface ClassFormProps {
  onSuccess: (result: { classId: string; classData: ClassFormData }) => void
  onCancel: () => void
  editClass?: ClassData | null
}

const availableSubjects = {
  english: {
    grammar: [
      "Mathematics",
      "English Language",
      "Biology",
      "Chemistry",
      "Physics",
      "History",
      "Geography",
      "Literature",
      "Economics",
      "Government",
      "Religious Studies",
      "French",
      "Computer Science",
    ],
    technical: [
      "Mathematics",
      "English Language",
      "Physics",
      "Chemistry",
      "Technical Drawing",
      "Workshop Practice",
      "Building Construction",
      "Electrical Installation",
      "Metal Work",
      "Wood Work",
    ],
    commercial: [
      "Mathematics",
      "English Language",
      "Economics",
      "Commerce",
      "Accounting",
      "Business Studies",
      "Marketing",
      "Office Practice",
      "Computer Studies",
      "Statistics",
    ],
  },
  french: {
    grammar: [
      "Mathématiques",
      "Français",
      "Physique",
      "Chimie",
      "Sciences Naturelles",
      "Histoire",
      "Géographie",
      "Philosophie",
      "Anglais",
      "Allemand",
      "Espagnol",
    ],
    technical: [
      "Mathématiques",
      "Français",
      "Physique",
      "Chimie",
      "Dessin Technique",
      "Travaux Pratiques",
      "Construction",
      "Électricité",
      "Mécanique",
    ],
    commercial: [
      "Mathématiques",
      "Français",
      "Économie",
      "Commerce",
      "Comptabilité",
      "Gestion",
      "Marketing",
      "Informatique",
    ],
  },
}

export function ClassForm({ onSuccess, onCancel, editClass }: ClassFormProps) {
  const { createClass, updateClass } = useClassManagement()
  const { teachers, isLoading: teachersLoading } = useTeacherManagement()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    level: "",
    subsystem: "english",
    branch: "grammar",
    capacity: 40,
    classTeacher: "",
    subjects: [],
    academicYear: "2024/2025",
  })

  // Initialize form with edit data if provided
  useEffect(() => {
    if (editClass) {
      setFormData({
        name: editClass.name,
        level: editClass.level,
        subsystem: editClass.subsystem,
        branch: editClass.branch,
        capacity: editClass.capacity,
        classTeacher: editClass.classTeacher,
        subjects: [...editClass.subjects],
        academicYear: editClass.academicYear,
      })
    }
  }, [editClass])

  const getAvailableSubjects = () => {
    return availableSubjects[formData.subsystem][formData.branch] || []
  }

  const getTeacherNames = () => {
    return teachers
      .filter(teacher => teacher.status === 'active')
      .map(teacher => ({
        value: `${teacher.title} ${teacher.firstName} ${teacher.lastName}`,
        label: `${teacher.title} ${teacher.firstName} ${teacher.lastName}`
      }))
  }

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editClass) {
        // Update existing class
        const result = await updateClass(editClass.id, formData)
        if (result.success) {
          onSuccess({ classId: editClass.id, classData: formData })
        } else {
          setError(result.error || "Failed to update class")
        }
      } else {
        // Create new class
        const result = await createClass(formData)
        if (result.success && result.classId) {
          onSuccess({ classId: result.classId, classData: formData })
        } else {
          setError(result.error || "Failed to create class")
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    return formData.name && formData.level && formData.classTeacher && formData.subjects.length > 0
  }

    return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">
            {editClass ? "Edit Class" : "Create New Class"}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {editClass
              ? "Update the class information and configuration"
              : "Set up a new class with all necessary details and subject assignments"
            }
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {editClass ? "Editing Mode" : "Creation Mode"}
            </Badge>
            {editClass && (
              <Badge variant="outline" className="px-4 py-2 text-sm font-mono">
                ID: {editClass.id}
              </Badge>
            )}
          </div>
        </div>

                {/* Form Content */}
        <Card className="shadow-lg">
          <CardHeader className="pb-8">
            <div>
              <CardTitle className="text-3xl font-bold">
                Class Configuration
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Configure all aspects of the class including basic information, capacity, teacher assignment, and subjects
              </CardDescription>
            </div>
          </CardHeader>

                    <CardContent className="space-y-8 p-8">
            {/* Error Alert */}
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
                            {/* Basic Information Section */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Basic Information</h3>
                </div>

                                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-base font-medium">
                      Class Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Form 1A, Terminale C"
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="level" className="text-base font-medium">
                      Level <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Form 1">Form 1</SelectItem>
                        <SelectItem value="Form 2">Form 2</SelectItem>
                        <SelectItem value="Form 3">Form 3</SelectItem>
                        <SelectItem value="Form 4">Form 4</SelectItem>
                        <SelectItem value="Form 5">Form 5</SelectItem>
                        <SelectItem value="Form 6">Form 6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="subsystem" className="text-base font-medium">
                      Educational Subsystem <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.subsystem} onValueChange={(value: "english" | "french") => setFormData({ ...formData, subsystem: value })}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English Subsystem</SelectItem>
                        <SelectItem value="french">French Subsystem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="branch" className="text-base font-medium">
                      Branch <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.branch} onValueChange={(value: "grammar" | "technical" | "commercial") => setFormData({ ...formData, branch: value })}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grammar">Grammar</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

                            <Separator className="my-8" />

              {/* Capacity and Teacher Section */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Capacity & Teacher Assignment</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-3">
                    <Label htmlFor="capacity" className="text-base font-medium">
                      Class Capacity <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                      className="h-12 text-base"
                      required
                    />
                    <p className="text-sm text-muted-foreground">Maximum number of students</p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="classTeacher" className="text-base font-medium">
                      Class Teacher <span className="text-destructive">*</span>
                    </Label>
                    {teachersLoading ? (
                      <div className="flex items-center space-x-3 h-12">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <span className="text-base text-muted-foreground">Loading teachers...</span>
                      </div>
                    ) : (
                      <Select 
                        value={formData.classTeacher} 
                        onValueChange={(value) => setFormData({ ...formData, classTeacher: value })}
                      >
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Select a teacher" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTeacherNames().map((teacher) => (
                            <SelectItem key={teacher.value} value={teacher.value}>
                              {teacher.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="academicYear" className="text-base font-medium">
                      Academic Year <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="academicYear"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      placeholder="e.g., 2024/2025"
                      className="h-12 text-base"
                      required
                    />
                  </div>
                </div>
              </div>

                            <Separator className="my-8" />

              {/* Subjects Selection Section */}
              <div className="space-y-8">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">Subject Selection</h3>
                </div>

                                <div className="bg-muted/50 border rounded-xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-lg font-semibold">
                      Available Subjects for {formData.subsystem === 'english' ? 'English' : 'French'} {formData.branch}
                    </h4>
                    <Badge variant="secondary" className="px-3 py-1 text-sm">
                      {formData.subjects.length} selected
                    </Badge>
                  </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getAvailableSubjects().map((subject) => (
                      <div key={subject} className="flex items-center space-x-4 p-4 bg-background rounded-lg border hover:border-primary transition-colors">
                        <Checkbox
                          id={subject}
                          checked={formData.subjects.includes(subject)}
                          onCheckedChange={() => handleSubjectToggle(subject)}
                          className="h-5 w-5"
                        />
                        <Label
                          htmlFor={subject}
                          className="text-base font-medium cursor-pointer hover:text-primary transition-colors"
                        >
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>

                                                      {formData.subjects.length > 0 && (
                    <div className="mt-8">
                      <h5 className="text-lg font-semibold mb-4">
                        Selected Subjects ({formData.subjects.length})
                      </h5>
                      <div className="flex flex-wrap gap-3">
                        {formData.subjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="flex items-center gap-2 px-3 py-2 text-sm"
                          >
                            {subject}
                            <X
                              className="h-4 w-4 cursor-pointer hover:text-destructive"
                              onClick={() => handleSubjectToggle(subject)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

                            {/* Form Actions */}
              <div className="flex justify-between items-center gap-6 pt-8 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="h-12 px-8 text-base"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !isFormValid()}
                  className="h-12 px-8 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground mr-2" />
                      {editClass ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-5 w-5 mr-2" />
                      {editClass ? "Update Class" : "Create Class"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
