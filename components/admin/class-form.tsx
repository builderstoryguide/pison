"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useClassManagement, type ClassFormData, type ClassData } from "@/lib/class-management-context"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <DialogHeader>
        <DialogTitle>{editClass ? "Edit Class" : "Create New Class"}</DialogTitle>
      </DialogHeader>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Class name, level, and system details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Form 1A"
                required
              />
            </div>

            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                <SelectTrigger>
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

            <div>
              <Label htmlFor="subsystem">Subsystem</Label>
              <Select value={formData.subsystem} onValueChange={(value: "english" | "french") => setFormData({ ...formData, subsystem: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(value: "grammar" | "technical" | "commercial") => setFormData({ ...formData, branch: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Capacity and Teacher */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity & Teacher</CardTitle>
            <CardDescription>Class capacity and assigned teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="100"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div>
              <Label htmlFor="classTeacher">Class Teacher</Label>
              <Input
                id="classTeacher"
                value={formData.classTeacher}
                onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                placeholder="e.g., Mrs. Sarah Johnson"
                required
              />
            </div>

            <div>
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="e.g., 2024/2025"
                required
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
          <CardDescription>Select subjects for this class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {getAvailableSubjects().map((subject) => (
              <div key={subject} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={subject}
                  checked={formData.subjects.includes(subject)}
                  onChange={() => handleSubjectToggle(subject)}
                  className="rounded"
                />
                <Label htmlFor={subject} className="text-sm cursor-pointer">
                  {subject}
                </Label>
              </div>
            ))}
          </div>

          {formData.subjects.length > 0 && (
            <div className="mt-4">
              <Label>Selected Subjects ({formData.subjects.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject) => (
                  <Badge key={subject} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleSubjectToggle(subject)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : editClass ? "Update Class" : "Create Class"}
        </Button>
      </div>
    </form>
  )
}
