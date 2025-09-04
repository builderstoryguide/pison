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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  ArrowLeft,
  Trash2
} from "lucide-react"
import { useClassManagement, type ClassFormData, type ClassData } from "@/lib/class-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ClassFormProps {
  onSuccess: (result: { classId: string; classData: ClassFormData } | { classIds: string[]; classData: ClassFormData[] }) => void
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

interface ClassName {
  id: string
  name: string
  classTeacher: string
  subjects: string[]
}

export function ClassForm({ onSuccess, onCancel, editClass }: ClassFormProps) {
  const { createClass, updateClass } = useClassManagement()
  const { teachers } = useTeacherManagement()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<{
    classIds: string[]
    classData: ClassFormData[]
    count: number
  } | null>(null)

  // Form data
  const [formData, setFormData] = useState<ClassFormData>({
    name: editClass?.name || "",
    level: editClass?.level || "",
    subsystem: editClass?.subsystem || "english",
    branch: editClass?.branch || "grammar",
    classTeacher: editClass?.classTeacher || "",
    capacity: editClass?.capacity || 40,
    subjects: editClass?.subjects || [],
    academicYear: editClass?.academicYear || `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
  })

  // Individual class names with their specific teachers and subjects
  const [classNames, setClassNames] = useState<ClassName[]>([
    {
      id: "1",
      name: "",
      classTeacher: "__global__",
      subjects: [],
    }
  ])

  // Global settings for the entire class group
  const [globalSettings, setGlobalSettings] = useState({
    classTeacher: "",
    subjects: [] as string[],
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

  const handleSubjectToggle = (subject: string, classNameId?: string) => {
    if (classNameId) {
      // Toggle subject for individual class name
      setClassNames(prev => prev.map(cls => 
        cls.id === classNameId 
          ? {
              ...cls,
              subjects: cls.subjects.includes(subject)
                ? cls.subjects.filter(s => s !== subject)
                : [...cls.subjects, subject]
            }
          : cls
      ))
    } else {
      // Toggle subject for global settings
      setGlobalSettings(prev => ({
        ...prev,
        subjects: prev.subjects.includes(subject)
          ? prev.subjects.filter(s => s !== subject)
          : [...prev.subjects, subject]
      }))
    }
  }

  const addClassName = () => {
    const newClassName: ClassName = {
      id: Date.now().toString(),
      name: "",
      classTeacher: "__global__",
      subjects: [...globalSettings.subjects], // Inherit global subjects
    }
    setClassNames(prev => [...prev, newClassName])
  }

  const removeClassName = (id: string) => {
    if (classNames.length > 1) {
      setClassNames(prev => prev.filter(cls => cls.id !== id))
    }
  }

  const updateClassName = (id: string, field: keyof ClassName, value: any) => {
    setClassNames(prev => prev.map(cls => 
      cls.id === id ? { ...cls, [field]: value } : cls
    ))
  }

  const updateGlobalSetting = (field: keyof typeof globalSettings, value: any) => {
    setGlobalSettings(prev => ({ ...prev, [field]: value }))
    
    // Update all class names with new global settings
    if (field === 'subjects') {
      setClassNames(prev => prev.map(cls => ({
        ...cls,
        subjects: [...value]
      })))
    } else if (field === 'classTeacher') {
      setClassNames(prev => prev.map(cls => ({
        ...cls,
        classTeacher: cls.classTeacher === "__global__" ? "__global__" : value
      })))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (editClass) {
        // Single class editing
        console.log("Editing class with data:", formData)
        const result = await updateClass(editClass.id, formData)
        if (result.success) {
          toast.success("Class Updated Successfully!", {
            description: `Class "${formData.name}" has been updated.`
          })
          onSuccess({ classId: editClass.id, classData: formData })
        } else {
          const errorMessage = result.error || "Failed to update class"
          setError(errorMessage)
          toast.error("Class Update Failed", {
            description: errorMessage
          })
        }
      } else {
        // Create multiple classes
        const validClassNames = classNames.filter(cls => {
          const hasName = cls.name.trim() !== ""
          const hasTeacher = cls.classTeacher === "__global__" 
            ? globalSettings.classTeacher && globalSettings.classTeacher.trim() !== ""
            : cls.classTeacher && cls.classTeacher.trim() !== ""
          return hasName && hasTeacher
        })

        if (validClassNames.length === 0) {
          setError("Please provide at least one class name and assign a teacher")
          return
        }

        console.log("Creating classes with data:", {
          formData,
          classNames: validClassNames,
          globalSettings
        })

        const results = []
        const errors = []

        for (const className of validClassNames) {
          try {
            const classData: ClassFormData = {
              name: className.name,
              level: formData.level,
              subsystem: formData.subsystem,
              branch: formData.branch,
              classTeacher: className.classTeacher === "__global__" ? globalSettings.classTeacher : className.classTeacher,
              capacity: formData.capacity,
              subjects: className.subjects.length > 0 ? className.subjects : globalSettings.subjects,
              academicYear: formData.academicYear,
            }

            console.log(`Creating class "${className.name}" with data:`, classData)

            const result = await createClass(classData)
            console.log(`Result for class "${className.name}":`, result)

            if (result.success && result.classId) {
              results.push({ classId: result.classId, classData })
            } else {
              errors.push(`Failed to create class "${className.name}": ${result.error}`)
            }
          } catch (err) {
            console.error(`Error creating class "${className.name}":`, err)
            errors.push(`Failed to create class "${className.name}": Unexpected error`)
          }
        }

        if (results.length > 0) {
          console.log("Successfully created classes:", results)
          
          // Show success toast
          if (results.length === 1) {
            toast.success("Class Created Successfully!", {
              description: `Class "${results[0].classData.name}" has been created.`
            })
          } else {
            toast.success("Classes Created Successfully!", {
              description: `${results.length} classes have been created successfully.`
            })
          }

          // Set success data for dialog
          setSuccessData({
            classIds: results.map(r => r.classId),
            classData: results.map(r => r.classData),
            count: results.length
          })
          setShowSuccessDialog(true)

          // Call onSuccess callback
          if (results.length === 1) {
            onSuccess({ classId: results[0].classId, classData: results[0].classData })
          } else {
            onSuccess({ 
              classIds: results.map(r => r.classId), 
              classData: results.map(r => r.classData) 
            })
          }
        } else {
          const errorMessage = "Failed to create any classes. " + errors.join("; ")
          setError(errorMessage)
          toast.error("Class Creation Failed", {
            description: errorMessage
          })
        }
      }
    } catch (err) {
      console.error("Form submission error:", err)
      setError("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    if (editClass) {
      return formData.name && formData.level && formData.classTeacher && formData.subjects.length > 0
    } else {
      return formData.level && formData.subsystem && formData.branch && 
             classNames.some(cls => cls.name && (cls.classTeacher === "__global__" ? globalSettings.classTeacher : cls.classTeacher || globalSettings.classTeacher)) &&
             (globalSettings.subjects.length > 0 || classNames.some(cls => cls.subjects.length > 0))
    }
  }

  if (editClass) {
    // Edit mode - show single form
    return (
      <>
        <div className="space-y-6">
        {/* Description */}
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            Update the class information and configuration
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
                  <Select value={formData.subsystem} onValueChange={(value: "english" | "french") => setFormData({ ...formData, subsystem: value, subjects: [] })}>
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
                  <Select value={formData.branch} onValueChange={(value: "grammar" | "technical" | "commercial") => setFormData({ ...formData, branch: value, subjects: [] })}>
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
                  <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>
                        {new Date().getFullYear()}/{new Date().getFullYear() + 1} (Current)
                      </SelectItem>
                      <SelectItem value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>
                        {new Date().getFullYear() - 1}/{new Date().getFullYear()} (Previous)
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                        onCheckedChange={() => {
                          setFormData(prev => ({
                            ...prev,
                            subjects: prev.subjects.includes(subject)
                              ? prev.subjects.filter(s => s !== subject)
                              : [...prev.subjects, subject]
                          }))
                        }}
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
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                subjects: prev.subjects.filter(s => s !== subject)
                              }))
                            }}
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
                  Updating...
                </>
              ) : (
                <>
                  Update Class
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Classes Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {successData?.count === 1 
                ? `Class "${successData?.classData[0]?.name}" has been created successfully.`
                : `${successData?.count} classes have been created successfully.`
              }
            </p>
            
            {successData && successData.count > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Created Classes:</h4>
                <div className="space-y-1">
                  {successData.classData.map((classData, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {classData.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setShowSuccessDialog(false)
                  setSuccessData(null)
                }}
                className="px-4"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    )
  }

  // Create mode - show form for multiple classes
  return (
    <>
      <div className="space-y-6">
      {/* Description */}
      <div className="text-center space-y-3">
        <p className="text-muted-foreground">
          Set up multiple classes with shared settings and individual configurations
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
            <CardDescription>
              Configure shared settings for all classes in this group
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
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
                <Select value={formData.subsystem} onValueChange={(value: "english" | "french") => setFormData({ ...formData, subsystem: value, subjects: [] })}>
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
                <Select value={formData.branch} onValueChange={(value: "grammar" | "technical" | "commercial") => setFormData({ ...formData, branch: value, subjects: [] })}>
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
                <Select value={formData.academicYear} onValueChange={(value) => setFormData({ ...formData, academicYear: value })}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select academic year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={`${new Date().getFullYear()}/${new Date().getFullYear() + 1}`}>
                      {new Date().getFullYear()}/{new Date().getFullYear() + 1} (Current)
                    </SelectItem>
                    <SelectItem value={`${new Date().getFullYear() - 1}/${new Date().getFullYear()}`}>
                      {new Date().getFullYear() - 1}/{new Date().getFullYear()} (Previous)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Global Settings Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Global Settings
            </CardTitle>
            <CardDescription>
              These settings will apply to all classes. You can override them for individual classes below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="globalClassTeacher" className="text-sm font-medium">
                  Class Teacher (All Classes)
                </Label>
                <Select value={globalSettings.classTeacher} onValueChange={(value) => updateGlobalSetting('classTeacher', value)}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select teacher for all classes" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers
                      .filter(teacher => teacher.subsystem === formData.subsystem && teacher.teacherId)
                      .map((teacher) => (
                        <SelectItem key={teacher.teacherId} value={teacher.teacherId}>
                          {teacher.title} {teacher.firstName} {teacher.lastName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Global Subjects
                </Label>
                <div className="text-xs text-muted-foreground">
                  {globalSettings.subjects.length} subjects selected
                </div>
              </div>
            </div>

            {/* Global Subjects Selection */}
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {getAvailableSubjects().map((subject) => (
                  <div key={subject} className="flex items-center space-x-3 p-3 bg-background rounded-md border hover:border-primary transition-colors">
                    <Checkbox
                      id={`global-${subject}`}
                      checked={globalSettings.subjects.includes(subject)}
                      onCheckedChange={() => updateGlobalSetting('subjects', 
                        globalSettings.subjects.includes(subject)
                          ? globalSettings.subjects.filter(s => s !== subject)
                          : [...globalSettings.subjects, subject]
                      )}
                      className="h-4 w-4"
                    />
                    <Label
                      htmlFor={`global-${subject}`}
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                    >
                      {subject}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Individual Class Names Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" />
                  Individual Class Names
                </CardTitle>
                <CardDescription>
                  Add specific class names (e.g., Form 1A, Form 1B, Form 1C) and configure individual settings
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={addClassName}
                className="h-10 px-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Class Name
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {classNames.map((className, index) => (
              <div key={className.id} className="border rounded-lg p-4 bg-muted/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Class Name {index + 1}</h4>
                  {classNames.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeClassName(className.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Class Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={className.name}
                      onChange={(e) => updateClassName(className.id, 'name', e.target.value)}
                      placeholder="e.g., Form 1A, Form 1B, Form 1C"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Individual Class Teacher
                    </Label>
                    <Select value={className.classTeacher} onValueChange={(value) => updateClassName(className.id, 'classTeacher', value)}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Override global teacher (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__global__">Use Global Teacher</SelectItem>
                        {teachers
                          .filter(teacher => teacher.subsystem === formData.subsystem && teacher.teacherId)
                          .map((teacher) => (
                            <SelectItem key={teacher.teacherId} value={teacher.teacherId}>
                              {teacher.title} {teacher.firstName} {teacher.lastName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Individual Subjects
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      {className.subjects.length} subjects selected
                    </div>
                  </div>
                </div>

                {/* Individual Subjects Selection */}
                <div className="mt-4 bg-muted/50 border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getAvailableSubjects().map((subject) => (
                      <div key={subject} className="flex items-center space-x-3 p-3 bg-background rounded-md border hover:border-primary transition-colors">
                        <Checkbox
                          id={`${className.id}-${subject}`}
                          checked={className.subjects.includes(subject)}
                          onCheckedChange={() => handleSubjectToggle(subject, className.id)}
                          className="h-4 w-4"
                        />
                        <Label
                          htmlFor={`${className.id}-${subject}`}
                          className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                        >
                          {subject}
                        </Label>
                      </div>
                    ))}
                  </div>

                  {className.subjects.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-3">
                        Selected Subjects ({className.subjects.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {className.subjects.map((subject) => (
                          <Badge
                            key={subject}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1 text-xs"
                          >
                            {subject}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => handleSubjectToggle(subject, className.id)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
                Creating Classes...
              </>
            ) : (
              <>
                Create {classNames.length} Class{classNames.length > 1 ? 'es' : ''}
              </>
            )}
          </Button>
        </div>
              </form>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Classes Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {successData?.count === 1 
                ? `Class "${successData?.classData[0]?.name}" has been created successfully.`
                : `${successData?.count} classes have been created successfully.`
              }
            </p>
            
            {successData && successData.count > 1 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Created Classes:</h4>
                <div className="space-y-1">
                  {successData.classData.map((classData, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {classData.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setShowSuccessDialog(false)
                  setSuccessData(null)
                }}
                className="px-4"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    )
  }
