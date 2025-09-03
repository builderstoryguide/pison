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
      "Installation Électrique",
      "Travail des Métaux",
      "Travail du Bois",
    ],
    commercial: [
      "Mathématiques",
      "Français",
      "Économie",
      "Commerce",
      "Comptabilité",
      "Études Commerciales",
      "Marketing",
      "Pratique de Bureau",
      "Informatique",
      "Statistiques",
    ],
  },
}

export function ClassForm({ onSuccess, onCancel, editClass }: ClassFormProps) {
  const { createClass, updateClass } = useClassManagement()
  const { teachers } = useTeacherManagement()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ClassFormData>({
    name: editClass?.name || "",
    level: editClass?.level || "",
    subsystem: editClass?.subsystem || "english",
    branch: editClass?.branch || "grammar",
    classTeacher: editClass?.classTeacher || "",
    capacity: editClass?.capacity || 40,
    subjects: editClass?.subjects || [],
    academicYear: editClass?.academicYear || "",
  })

  useEffect(() => {
    if (editClass) {
      setFormData({
        name: editClass.name,
        level: editClass.level,
        subsystem: editClass.subsystem,
        branch: editClass.branch,
        classTeacher: editClass.classTeacher,
        capacity: editClass.capacity,
        subjects: editClass.subjects,
        academicYear: editClass.academicYear,
      })
    }
  }, [editClass])

  const getAvailableSubjects = () => {
    return availableSubjects[formData.subsystem as keyof typeof availableSubjects]?.[formData.branch as keyof typeof availableSubjects.english] || []
  }

  const handleSubjectToggle = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editClass) {
        const result = await updateClass(editClass.id, formData)
        if (result.success) {
          onSuccess({ classId: editClass.id, classData: formData })
        } else {
          setError(result.error || "Failed to update class")
        }
      } else {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">
          {editClass ? "Edit Class" : "Create New Class"}
        </h2>
        <p className="text-muted-foreground">
          {editClass
            ? "Update the class information and configuration"
            : "Set up a new class with all necessary details and subject assignments"
          }
        </p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <GraduationCap className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Class Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Form 1A, Terminale C"
                  className="h-10"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level" className="text-sm font-medium">
                  Level <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger className="h-10">
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

              <div className="space-y-2">
                <Label htmlFor="subsystem" className="text-sm font-medium">
                  Subsystem <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.subsystem} onValueChange={(value) => setFormData({ ...formData, subsystem: value, subjects: [] })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select subsystem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="french">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch" className="text-sm font-medium">
                  Branch <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.branch} onValueChange={(value) => setFormData({ ...formData, branch: value, subjects: [] })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classTeacher" className="text-sm font-medium">
                  Class Teacher <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.classTeacher} onValueChange={(value) => setFormData({ ...formData, classTeacher: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select class teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter(teacher => teacher.subsystem === formData.subsystem)
                      .map((teacher) => (
                        <SelectItem key={teacher.teacherId} value={teacher.teacherId}>
                          {teacher.title} {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="text-sm font-medium">
                  Capacity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="e.g., 40"
                  className="h-10"
                  min="1"
                  max="100"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear" className="text-sm font-medium">
                  Academic Year <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="e.g., 2024/2025"
                  className="h-10"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Selection Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5" />
              Subject Selection
            </CardTitle>
            <CardDescription>
              Select subjects for {formData.subsystem === 'english' ? 'English' : 'French'} {formData.branch} branch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium">
                  Available Subjects
                </h4>
                <Badge variant="secondary" className="px-2 py-1 text-xs">
                  {formData.subjects.length} selected
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAvailableSubjects().map((subject) => (
                  <div key={subject} className="flex items-center space-x-3 p-3 bg-background rounded-md border hover:border-primary transition-colors">
                    <Checkbox
                      id={subject}
                      checked={formData.subjects.includes(subject)}
                      onCheckedChange={() => handleSubjectToggle(subject)}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor={subject}
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                    >
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>

              {formData.subjects.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-3">
                    Selected Subjects ({formData.subjects.length})
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {formData.subjects.map((subject) => (
                      <Badge
                        key={subject}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1 text-xs"
                      >
                        {subject}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => handleSubjectToggle(subject)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end items-center gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-10 px-6"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || !isFormValid()}
            className="h-10 px-6"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                {editClass ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                {editClass ? "Update Class" : "Create Class"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
