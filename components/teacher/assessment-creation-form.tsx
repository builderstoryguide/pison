"use client"

import type React from "react"
import { useState } from "react"
import { Calendar, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useTeacherGrades } from "@/lib/teacher-grades-context"

interface AssessmentCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssessmentCreationForm({ onSuccess, onCancel }: AssessmentCreationFormProps) {
  const { classes, createAssessment, loading } = useTeacherGrades()

  const [formData, setFormData] = useState({
    title: "",
    type: "" as "quiz" | "test" | "exam" | "assignment" | "project",
    subject: "",
    classId: "",
    totalMarks: 100,
    date: new Date().toISOString().split("T")[0],
    description: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedClass = classes.find((cls) => cls.id === formData.classId)

  const assessmentTypes: {
    value: "quiz" | "test" | "exam" | "assignment" | "project"
    label: string
    description: string
  }[] = [
    { value: "quiz", label: "Quiz", description: "Short assessment (10-30 minutes)" },
    { value: "test", label: "Test", description: "Medium assessment (45-90 minutes)" },
    { value: "exam", label: "Exam", description: "Major assessment (2+ hours)" },
    { value: "assignment", label: "Assignment", description: "Take-home work" },
    { value: "project", label: "Project", description: "Long-term project work" },
  ]

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = "Assessment title is required"
    if (!formData.type) newErrors.type = "Please select assessment type"
    if (!formData.subject.trim()) newErrors.subject = "Subject is required"
    if (!formData.classId) newErrors.classId = "Please select a class"
    if (formData.totalMarks <= 0) newErrors.totalMarks = "Total marks must be greater than 0"
    if (!formData.date) newErrors.date = "Assessment date is required"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      const selectedClass = classes.find((cls) => cls.id === formData.classId)

      await createAssessment({
        title: formData.title,
        type: formData.type,
        subject: formData.subject,
        classId: formData.classId,
        className: selectedClass?.name || "",
        totalMarks: formData.totalMarks,
        date: formData.date,
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      setErrors({ submit: "Failed to create assessment" })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Create New Assessment
        </CardTitle>
        <CardDescription>Create a new assessment for your students</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assessment Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Assessment Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="e.g., Mid-term Mathematics Test"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Assessment Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Assessment Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select assessment type" />
              </SelectTrigger>
              <SelectContent>
                {assessmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="space-y-1">
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-600">{errors.type}</p>}
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">Class *</Label>
            <Select
              value={formData.classId}
              onValueChange={(value) => {
                handleInputChange("classId", value)
                // Auto-fill subject based on class
                const selectedClass = classes.find((cls) => cls.id === value)
                if (selectedClass) {
                  handleInputChange("subject", selectedClass.subject)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    <div className="flex items-center gap-2">
                      <span>{cls.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {cls.studentCount} students
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.classId && <p className="text-sm text-red-600">{errors.classId}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="e.g., Mathematics, Physics, English"
              disabled={!!selectedClass} // Auto-filled when class is selected
            />
            {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Total Marks */}
            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                max="1000"
                value={formData.totalMarks}
                onChange={(e) => handleInputChange("totalMarks", Number.parseInt(e.target.value) || 0)}
              />
              {errors.totalMarks && <p className="text-sm text-red-600">{errors.totalMarks}</p>}
            </div>

            {/* Assessment Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Assessment Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.date && <p className="text-sm text-red-600">{errors.date}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the assessment content..."
              rows={3}
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Assessment"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
