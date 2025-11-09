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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  X, 
  BookOpen, 
  GraduationCap, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react"
import { useClassManagement, type ClassFormData, type ClassData } from "@/lib/class-management-context"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { useSubjectManagement } from "@/lib/subject-management-context"
import { useToast } from "@/hooks/use-toast"
import { useLevels } from "@/hooks/use-levels"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { Info } from "lucide-react"

interface ClassFormProps {
  onSuccess: (result: { classId: string; classData: ClassFormData } | { classIds: string[]; classData: ClassFormData[] }) => void
  onCancel: () => void
  editClass?: ClassData | null
}


export function ClassForm({ onSuccess, onCancel, editClass }: ClassFormProps) {
  const { createClass, updateClass } = useClassManagement()
  const { teachers } = useTeacherManagement()
  const { subjects, isLoading: subjectsLoading, error: subjectsError, loadSubjects } = useSubjectManagement()
  const { toast } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successData, setSuccessData] = useState<{
    classId: string
    classData: ClassFormData
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
    academicYear: globalAcademicYear, // Use global academic year
  })

  // Fetch levels based on selected subsystem and branch
  const { levels, isLoading: levelsLoading } = useLevels({
    subsystem: formData.subsystem || null,
    branch: formData.branch || null,
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
        academicYear: globalAcademicYear, // Use global academic year
      })
    }
  }, [editClass, globalAcademicYear])

  // Sync academic year with global setting
  useEffect(() => {
    setFormData((prev) => ({ ...prev, academicYear: globalAcademicYear }))
  }, [globalAcademicYear])

  // Load subjects on mount
  useEffect(() => {
    loadSubjects({ is_active: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        // Create single class
        console.log("Creating class with data:", formData)
        const result = await createClass(formData)
        
        if (result.success && result.classId) {
          toast.success("Class Created Successfully!", {
            description: `Class "${formData.name}" has been created.`
          })
          
          // Set success data for dialog
          setSuccessData({
            classId: result.classId,
            classData: formData
          })
          setShowSuccessDialog(true)
          
          // Call onSuccess callback
          onSuccess({ classId: result.classId, classData: formData })
        } else {
          const errorMessage = result.error || "Failed to create class"
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
    return formData.name && formData.level && formData.subsystem && formData.branch && 
           formData.subjects.length > 0
  }

  const handleSubsystemOrBranchChange = (field: 'subsystem' | 'branch', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      subjects: [] // Clear subjects when subsystem or branch changes
    }))
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
                  <Select 
                    value={formData.level} 
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                    disabled={levelsLoading || !formData.subsystem || !formData.branch}
                  >
                    <SelectTrigger className="h-10">
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
                  <Label htmlFor="academicYear" className="text-sm font-medium flex items-center gap-2">
                    Academic Year <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground font-normal">(Global Setting)</span>
                  </Label>
                  <Select 
                    value={globalAcademicYear} 
                    disabled={true}
                  >
                    <SelectTrigger className="h-10 bg-muted">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={globalAcademicYear}>
                        {globalAcademicYear}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Alert className="mt-2 py-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Academic Year is managed globally in App Configuration. To change it, go to Settings → App Configuration → System Settings.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="classTeacher" className="text-sm font-medium">
                    Class Teacher
                  </Label>
                  <Select value={formData.classTeacher} onValueChange={(value) => setFormData({ ...formData, classTeacher: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select class teacher (optional)" />
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
                Select subjects for this class from the subjects created in Subject Management. Mark subjects as "Trade Subjects" if they require special attention.
              </CardDescription>
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">
                      Available Subjects
                    </h4>
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      {formData.subjects.length} selected
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getAvailableSubjects().map((subject) => {
                      const isSelected = isSubjectSelected(subject.id)
                      const selectedSubject = getSelectedSubject(subject.id)
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-background rounded-md border hover:border-primary transition-colors">
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              id={subject.id}
                              checked={isSelected}
                              onCheckedChange={() => toggleSubject(subject)}
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={subject.id}
                              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors flex-1"
                            >
                              {subject.name}
                            </Label>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-2 ml-2">
                              <Label htmlFor={`trade-${subject.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                Trade
                              </Label>
                              <Checkbox
                                id={`trade-${subject.id}`}
                                checked={selectedSubject?.isTradeSubject || false}
                                onCheckedChange={() => toggleTradeSubject(subject.id)}
                                className="h-3 w-3"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {formData.subjects.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-3">
                        Selected Subjects ({formData.subjects.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects.map((subject) => (
                          <Badge
                            key={subject.subjectId}
                            variant={subject.isTradeSubject ? "default" : "secondary"}
                            className="flex items-center gap-1 px-2 py-1 text-xs"
                          >
                            {subject.subjectName}
                            {subject.isTradeSubject && (
                              <span className="ml-1 text-[10px]">★</span>
                            )}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  subjects: prev.subjects.filter(s => s.subjectId !== subject.subjectId)
                                }))
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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

  // Create mode - show single class form
  return (
    <>
      <div className="space-y-6">
        {/* Description */}
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">
            Create a new class with the information below
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
                  <Select 
                    value={formData.level} 
                    onValueChange={(value) => setFormData({ ...formData, level: value })}
                    disabled={levelsLoading || !formData.subsystem || !formData.branch}
                  >
                    <SelectTrigger className="h-10">
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
                  <Label htmlFor="academicYear" className="text-sm font-medium flex items-center gap-2">
                    Academic Year <span className="text-destructive">*</span>
                    <span className="text-xs text-muted-foreground font-normal">(Global Setting)</span>
                  </Label>
                  <Select 
                    value={globalAcademicYear} 
                    disabled={true}
                  >
                    <SelectTrigger className="h-10 bg-muted">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={globalAcademicYear}>
                        {globalAcademicYear}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Alert className="mt-2 py-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Academic Year is managed globally in App Configuration. To change it, go to Settings → App Configuration → System Settings.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="classTeacher" className="text-sm font-medium">
                    Class Teacher
                  </Label>
                  <Select value={formData.classTeacher} onValueChange={(value) => setFormData({ ...formData, classTeacher: value })}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select class teacher (optional)" />
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
                Select subjects for this class from the subjects created in Subject Management. Mark subjects as "Trade Subjects" if they require special attention.
              </CardDescription>
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
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">
                      Available Subjects
                    </h4>
                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                      {formData.subjects.length} selected
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getAvailableSubjects().map((subject) => {
                      const isSelected = isSubjectSelected(subject.id)
                      const selectedSubject = getSelectedSubject(subject.id)
                      return (
                        <div key={subject.id} className="flex items-center justify-between p-3 bg-background rounded-md border hover:border-primary transition-colors">
                          <div className="flex items-center space-x-3 flex-1">
                            <Checkbox
                              id={subject.id}
                              checked={isSelected}
                              onCheckedChange={() => toggleSubject(subject)}
                              className="h-4 w-4"
                            />
                            <Label
                              htmlFor={subject.id}
                              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors flex-1"
                            >
                              {subject.name}
                            </Label>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-2 ml-2">
                              <Label htmlFor={`trade-create-${subject.id}`} className="text-xs text-muted-foreground cursor-pointer">
                                Trade
                              </Label>
                              <Checkbox
                                id={`trade-create-${subject.id}`}
                                checked={selectedSubject?.isTradeSubject || false}
                                onCheckedChange={() => toggleTradeSubject(subject.id)}
                                className="h-3 w-3"
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {formData.subjects.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium mb-3">
                        Selected Subjects ({formData.subjects.length})
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {formData.subjects.map((subject) => (
                          <Badge
                            key={subject.subjectId}
                            variant={subject.isTradeSubject ? "default" : "secondary"}
                            className="flex items-center gap-1 px-2 py-1 text-xs"
                          >
                            {subject.subjectName}
                            {subject.isTradeSubject && (
                              <span className="ml-1 text-[10px]">★</span>
                            )}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  subjects: prev.subjects.filter(s => s.subjectId !== subject.subjectId)
                                }))
                              }}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                  Creating...
                </>
              ) : (
                <>
                  Create Class
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
              Class Created Successfully!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Class "{successData?.classData?.name}" has been created successfully.
            </p>
            
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
