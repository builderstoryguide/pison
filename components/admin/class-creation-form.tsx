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
import { X, Plus, Loader2, AlertCircle, Info } from "lucide-react"
import { useClassManagement, type ClassFormData } from "@/lib/class-management-context"
import { useSubjectManagement } from "@/lib/subject-management-context"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLevels } from "@/hooks/use-levels"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"

interface ClassCreationFormProps {
  onSuccess: (result: { classId: string; classData: ClassFormData }) => void
  onCancel: () => void
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
  const { subjects, isLoading: subjectsLoading, error: subjectsError, loadSubjects } = useSubjectManagement()
  const globalAcademicYear = useGlobalAcademicYear()
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    level: "",
    subsystem: "english",
    branch: "grammar",
    capacity: 40,
    classTeacher: "",
    subjects: [],
    academicYear: globalAcademicYear, // Use global academic year
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load subjects on mount
  useEffect(() => {
    loadSubjects({ is_active: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync academic year with global setting
  useEffect(() => {
    setFormData((prev) => ({ ...prev, academicYear: globalAcademicYear }))
  }, [globalAcademicYear])

  // Fetch levels based on selected subsystem and branch
  const { levels, isLoading: levelsLoading } = useLevels({
    subsystem: formData.subsystem || null,
    branch: formData.branch || null,
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Class name is required"
    }

    if (!formData.level.trim()) {
      newErrors.level = "Level is required"
    }

    // Class teacher is optional - no validation needed

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


  const getAvailableSubjects = () => {
    // Return active subjects from database, sorted by name
    return subjects
      .filter((subject) => subject.is_active)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const isSubjectSelected = (subjectId: string) => {
    return formData.subjects.some(s => s.subjectId === subjectId)
  }

  const toggleSubject = (subject: typeof subjects[0]) => {
    const isSelected = isSubjectSelected(subject.id)
    if (isSelected) {
      // Remove subject
      setFormData(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.subjectId !== subject.id)
      }))
    } else {
      // Add subject
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, {
          subjectId: subject.id,
          subjectName: subject.name,
          isTradeSubject: false
        }]
      }))
    }
  }

  const toggleTradeSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.subjectId === subjectId
          ? { ...s, isTradeSubject: !s.isTradeSubject }
          : s
      )
    }))
  }

  const getSelectedSubject = (subjectId: string) => {
    return formData.subjects.find(s => s.subjectId === subjectId)
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
                  disabled={levelsLoading || !formData.subsystem || !formData.branch}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={levelsLoading ? "Loading levels..." : "Select level"} />
                  </SelectTrigger>
                  <SelectContent>
                    {levels.length === 0 && !levelsLoading ? (
                      <SelectItem value="no-levels" disabled>
                        No levels available. Create levels in Class Management first.
                      </SelectItem>
                    ) : (
                      levels.map((level) => (
                        <SelectItem key={level.id} value={level.name}>
                          {level.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.level && <p className="text-sm text-red-600">{errors.level}</p>}
              </div>


              <div className="space-y-2">
                <Label htmlFor="academicYear" className="flex items-center gap-2">
                  Academic Year
                  <span className="text-xs text-muted-foreground font-normal">(Global Setting)</span>
                </Label>
                <Input
                  id="academicYear"
                  value={globalAcademicYear}
                  disabled={true}
                  className="bg-muted"
                  placeholder="Academic year"
                />
                <Alert className="mt-2 py-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Academic Year is managed globally in App Configuration. To change it, go to Settings → App Configuration → System Settings.
                  </AlertDescription>
                </Alert>
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
                <Label htmlFor="classTeacher">Class Teacher (optional)</Label>
                <Select
                  value={formData.classTeacher}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, classTeacher: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class teacher (optional)" />
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
            <CardDescription>Select subjects for this class. Mark subjects as "Trade Subjects" if they require special attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load subjects: {subjectsError}
                </AlertDescription>
              </Alert>
            )}

            {subjectsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading subjects...</span>
              </div>
            ) : getAvailableSubjects().length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active subjects available. Please create subjects in the Subject Management section first.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="bg-muted/50 border rounded-lg p-4">
                <div className="space-y-2 mb-4">
                  <Label>Available Subjects</Label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableSubjects().map((subject) => (
                      <Button
                        key={subject.id}
                        type="button"
                        variant={isSubjectSelected(subject.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSubject(subject)}
                        className="text-xs"
                      >
                        {isSubjectSelected(subject.id) ? (
                          <X className="h-3 w-3 mr-1" />
                        ) : (
                          <Plus className="h-3 w-3 mr-1" />
                        )}
                        {subject.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {formData.subjects.length > 0 && (
                  <div className="space-y-2 mt-4 pt-4 border-t">
                    <Label>Selected Subjects</Label>
                    <div className="space-y-2">
                      {formData.subjects.map((subject) => {
                        const selectedSubject = getSelectedSubject(subject.subjectId)
                        return (
                          <div key={subject.subjectId} className="flex items-center justify-between p-2 bg-background rounded-md border">
                            <div className="flex items-center gap-2">
                              <Badge variant={subject.isTradeSubject ? "default" : "secondary"} className="text-xs">
                                {subject.subjectName}
                                {subject.isTradeSubject && (
                                  <span className="ml-1 text-[10px]">★</span>
                                )}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`trade-${subject.subjectId}`} className="text-xs text-muted-foreground cursor-pointer">
                                Trade
                              </Label>
                              <Checkbox
                                id={`trade-${subject.subjectId}`}
                                checked={selectedSubject?.isTradeSubject || false}
                                onCheckedChange={() => toggleTradeSubject(subject.subjectId)}
                                className="h-3 w-3"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
                                onClick={() => toggleSubject(subjects.find(s => s.id === subject.subjectId)!)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
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
