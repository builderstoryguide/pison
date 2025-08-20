"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useClassManagement, type ClassFormData } from "@/lib/class-management-context"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ClassCreationFormProps {
  onSuccess: (result: { classId: string; classData: ClassFormData }) => void
  onCancel: () => void
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

const mockTeachers = [
  "Mrs. Sarah Johnson",
  "Mr. John Doe",
  "Dr. Mary Smith",
  "Mr. David Wilson",
  "Dr. Paul Biya",
  "M. Pierre Dubois",
  "Mrs. Jane Adams",
  "Mr. Michael Brown",
]

export function ClassCreationForm({ onSuccess, onCancel }: ClassCreationFormProps) {
  const { createClass, isLoading } = useClassManagement()
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
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required"
    }

    if (!formData.level.trim()) {
      newErrors.level = "Level is required"
    }

    if (formData.capacity < 1 || formData.capacity > 100) {
      newErrors.capacity = "Capacity must be between 1 and 100"
    }

    if (!formData.classTeacher.trim()) {
      newErrors.classTeacher = "Class teacher is required"
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = "At least one subject is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const result = await createClass(formData)

    if (result.success && result.classId) {
      onSuccess({ classId: result.classId, classData: formData })
    } else {
      setErrors({ submit: result.error || "Failed to create class" })
    }
  }

  const addSubject = (subject: string) => {
    if (!formData.subjects.includes(subject)) {
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, subject],
      }))
    }
  }

  const removeSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }))
  }

  const getAvailableSubjects = () => {
    return availableSubjects[formData.subsystem][formData.branch] || []
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
              <CardDescription>Enter the basic class details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Class Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Form 1A, Terminale C"
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Level *</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Form 1">Form 1</SelectItem>
                    <SelectItem value="Form 2">Form 2</SelectItem>
                    <SelectItem value="Form 3">Form 3</SelectItem>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                    <SelectItem value="Form 5">Form 5</SelectItem>
                    <SelectItem value="Lower Sixth">Lower Sixth</SelectItem>
                    <SelectItem value="Upper Sixth">Upper Sixth</SelectItem>
                    <SelectItem value="Sixième">Sixième</SelectItem>
                    <SelectItem value="Cinquième">Cinquième</SelectItem>
                    <SelectItem value="Quatrième">Quatrième</SelectItem>
                    <SelectItem value="Troisième">Troisième</SelectItem>
                    <SelectItem value="Seconde">Seconde</SelectItem>
                    <SelectItem value="Première">Première</SelectItem>
                    <SelectItem value="Terminale">Terminale</SelectItem>
                  </SelectContent>
                </Select>
                {errors.level && <p className="text-sm text-red-600">{errors.level}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Class Capacity *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, capacity: Number.parseInt(e.target.value) || 0 }))}
                />
                {errors.capacity && <p className="text-sm text-red-600">{errors.capacity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  value={formData.academicYear}
                  onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
                  placeholder="2024/2025"
                />
              </div>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Configuration</CardTitle>
              <CardDescription>Configure subsystem and branch</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Subsystem *</Label>
                <Select
                  value={formData.subsystem}
                  onValueChange={(value: "english" | "french") =>
                    setFormData((prev) => ({ ...prev, subsystem: value, subjects: [] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English Subsystem</SelectItem>
                    <SelectItem value="french">French Subsystem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Branch *</Label>
                <Select
                  value={formData.branch}
                  onValueChange={(value: "grammar" | "technical" | "commercial") =>
                    setFormData((prev) => ({ ...prev, branch: value, subjects: [] }))
                  }
                >
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

              <div className="space-y-2">
                <Label htmlFor="classTeacher">Class Teacher *</Label>
                <Select
                  value={formData.classTeacher}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, classTeacher: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTeachers.map((teacher) => (
                      <SelectItem key={teacher} value={teacher}>
                        {teacher}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.classTeacher && <p className="text-sm text-red-600">{errors.classTeacher}</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Subjects</CardTitle>
            <CardDescription>Select subjects for this class</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Available Subjects</Label>
              <div className="flex flex-wrap gap-2">
                {getAvailableSubjects().map((subject) => (
                  <Button
                    key={subject}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSubject(subject)}
                    disabled={formData.subjects.includes(subject)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {subject}
                  </Button>
                ))}
              </div>
            </div>

            {formData.subjects.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <Badge key={subject} variant="default" className="text-xs">
                      {subject}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                        onClick={() => removeSubject(subject)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {errors.subjects && <p className="text-sm text-red-600">{errors.subjects}</p>}
          </CardContent>
        </Card>

        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Class"}
          </Button>
        </div>
      </form>
    </div>
  )
}
