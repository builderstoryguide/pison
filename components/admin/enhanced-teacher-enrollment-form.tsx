"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Mail, MapPin, GraduationCap, Briefcase, X, Plus, AlertCircle, BookOpen, Users } from "lucide-react"
import type { TeacherFormData } from "@/lib/teacher-management-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { ShimmerSubjectBranchAssignment } from "@/components/ui/shimmer-loading"

interface TeacherEnrollmentFormProps {
  onSuccess: (result: { 
    teacherId: string; 
    teacherData: TeacherFormData; 
    password: string;
    subjects: Array<{
      subjectId: string;
      subjectName: string;
      branchId: string;
      branchName: string;
      classIds: string[];
      classNames: string[];
      isPrimary: boolean;
    }>;
    classes: Array<{
      classId: string;
      className: string;
      classLevel: string;
    }>;
  }) => void
  onCancel: () => void
}

interface SubjectBranch {
  id: string
  subject_id: string
  branch_name: string
  branch_code: string
  weight_percentage: number
  is_active: boolean
  subject: {
    id: string
    subject_name: string
    subject_code: string
    subsystem: string
  }
}

interface Class {
  id: string
  class_name: string
  class_level: string
  stream: string
  subsystem: string
  capacity: number
  current_enrollment: number
  status: string
}

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Contact Details", icon: Mail },
  { id: 3, title: "Address Information", icon: MapPin },
  { id: 4, title: "Academic Qualifications", icon: GraduationCap },
  { id: 5, title: "Teaching Assignment (Required)", icon: Briefcase },
  { id: 6, title: "Employment Details", icon: User },
]

const regions = [
  "Adamawa",
  "Centre",
  "East",
  "Far North",
  "Littoral",
  "North",
  "Northwest",
  "South",
  "Southwest",
  "West",
]

export function EnhancedTeacherEnrollmentForm({ onSuccess, onCancel }: TeacherEnrollmentFormProps) {
  
  const { success: toastSuccess, error: toastError, warning: toastWarning, info: toastInfo } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Subject-branch assignment state
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectBranches, setSubjectBranches] = useState<SubjectBranch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedSubjectBranches, setSelectedSubjectBranches] = useState<{
    subjectId: string
    branchId: string
    classIds: string[]
    isPrimary: boolean
  }[]>([])
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [loadingClasses, setLoadingClasses] = useState(false)
  
  const [formData, setFormData] = useState<TeacherFormData>({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "+237 6",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    region: "",
    nationality: "Cameroonian",
    idNumber: "",
    subsystem: "english",
    subjects: [],
    classes: [],
    qualifications: [],
    experience: "",
    employmentType: "full-time",
    salary: 0,
    startDate: "",
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "+237 6",
    },
    status: "active",
  })

  // Fetch subjects and subject branches
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoadingSubjects(true)
      try {
        const response = await fetch('/api/subjects')
        const data = await response.json()
        if (data.success) {
          setSubjects(data.subjects || [])
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
      } finally {
        setLoadingSubjects(false)
      }
    }

    const fetchSubjectBranches = async () => {
      try {
        const response = await fetch('/api/subject-branches')
        const data = await response.json()
        if (data.success) {
          setSubjectBranches(data.branches || [])
        }
      } catch (error) {
        console.error('Error fetching subject branches:', error)
      }
    }

    const fetchClasses = async () => {
      setLoadingClasses(true)
      try {
        const response = await fetch('/api/classes')
        const data = await response.json()
        if (data.success) {
          setClasses(data.classes || [])
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setLoadingClasses(false)
      }
    }

    fetchSubjects()
    fetchSubjectBranches()
    fetchClasses()
  }, [])

  const updateFormData = (field: string, value: any) => {
    // Special handling for title changes - auto-set gender
    if (field === 'title') {
      setFormData((prev) => {
        let resolvedGender = prev.gender // preserve existing gender by default
        
        if (value === 'Mrs.' || value === 'Ms.' || value === 'Miss') {
          resolvedGender = 'female'
        } else if (value === 'Mr.') {
          resolvedGender = 'male'
        }
        // For Dr. and Prof., keep the previous gender value
        
        return { 
          ...prev, 
          [field]: value,
          gender: resolvedGender
        }
      })
      return
    }

    // Special handling for subsystem changes - clear dependent assignment data
    if (field === 'subsystem') {
      setFormData((prev) => ({ 
        ...prev, 
        [field]: value,
        // Clear assignment-related state when subsystem changes
        selectedSubjectBranches: [],
        builtAssignments: []
      }))
      // Also clear the selected subject branches state
      setSelectedSubjectBranches([])
      return
    }
    
    // Special handling for phone numbers
    if (field === 'phone' || (field.includes('.') && field.endsWith('phone'))) {
      // Ensure phone number starts with +237 6 for Cameroon
      let formattedPhone = value
      if (!formattedPhone.startsWith('+237 6')) {
        formattedPhone = '+237 6'
      }
      // Remove any invalid characters and ensure proper format
      formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
      
      if (field.includes(".")) {
        const [parent, child] = field.split(".")
        setFormData((prev) => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof typeof prev] as any),
            [child]: formattedPhone,
          },
        }))
      } else {
        setFormData((prev) => ({ ...prev, [field]: formattedPhone }))
      }
    } else if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const addToArray = (field: string, value: string) => {
    if (value && !(formData[field as keyof typeof formData] as string[]).includes(value)) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field as keyof typeof prev] as string[]), value],
      }))
    }
  }

  const removeFromArray = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).filter((item) => item !== value),
    }))
  }

  // Subject-branch assignment functions
  const addSubjectBranchAssignment = (subjectId: string, branchId: string, classIds: string[], isPrimary: boolean = false) => {
    const newAssignment = { subjectId, branchId, classIds, isPrimary }
    setSelectedSubjectBranches(prev => [...prev, newAssignment])
  }

  const removeSubjectBranchAssignment = (index: number) => {
    setSelectedSubjectBranches(prev => prev.filter((_, i) => i !== index))
  }

  const updateSubjectBranchAssignment = (index: number, field: string, value: any) => {
    setSelectedSubjectBranches(prev => 
      prev.map((assignment, i) => {
        if (i === index) {
          if (field === 'subjectId') {
            // When subjectId changes, clear dependent fields and reset
            return {
              subjectId: value,
              branchId: '',
              classIds: [],
              isPrimary: false
            }
          } else {
            return { ...assignment, [field]: value }
          }
        }
        return assignment
      })
    )
  }

  const toggleClassSelection = (assignmentIndex: number, classId: string) => {
    setSelectedSubjectBranches(prev => 
      prev.map((assignment, i) => {
        if (i === assignmentIndex) {
          const currentClassIds = assignment.classIds || []
          const isSelected = currentClassIds.includes(classId)
          return {
            ...assignment,
            classIds: isSelected 
              ? currentClassIds.filter(id => id !== classId)
              : [...currentClassIds, classId]
          }
        }
        return assignment
      })
    )
  }

  const getBranchesForSubject = (subjectId: string) => {
    return subjectBranches.filter(branch => 
      branch.subject_id === subjectId && 
      branch.is_active &&
      branch.subject.subsystem === formData.subsystem
    )
  }

  const getClassesForSubsystem = () => {
    return classes.filter(cls => 
      cls.subsystem === formData.subsystem && 
      cls.status === 'active'
    )
  }

  // Helper function to format phone number for database
  const formatPhoneForDatabase = (phone: string) => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    // Ensure it starts with +237
    if (cleaned.startsWith('237')) {
      return '+' + cleaned
    } else if (cleaned.startsWith('+237')) {
      return cleaned
    } else {
      return '+237' + cleaned
    }
  }

  // Email validation
  const isValidEmailFormat = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender)
      case 2:
        return !!(formData.email && isValidEmailFormat(formData.email) && formData.phone)
      case 3:
        return !!(formData.address && formData.city && formData.region)
      case 4:
        return !!(formData.subsystem && formData.qualifications.length > 0)
      case 5:
        // Subject branches are optional - always return true
        return true
      case 6:
        return !!(formData.employmentType && formData.startDate)
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before proceeding.",
        variant: "destructive"
      })
      return
    }

    if (currentStep < 6) {
      setCurrentStep(currentStep + 1)
      return
    }

    setIsSubmitting(true)
    setError(null)

    toast({
      title: "Enrolling teacher...",
      description: "Please wait while we process the enrollment."
    })

    try {
      // Format phone numbers for database
      const formattedFormData = {
        ...formData,
        phone: formatPhoneForDatabase(formData.phone),
        emergencyContact: {
          ...formData.emergencyContact,
          phone: formatPhoneForDatabase(formData.emergencyContact.phone)
        }
      }

      // Create teacher with assignments
      const result = await fetch('/api/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherData: formattedFormData,
          assignments: selectedSubjectBranches.map(assignment => ({
            branchId: assignment.branchId,
            classIds: assignment.classIds,
            isPrimary: assignment.isPrimary
          }))
        }),
      })

      if (!result.ok) {
        const errorData = await result.json()
        throw new Error(errorData.error || 'Failed to enroll teacher')
      }

      const responseData = await result.json()
      
      if (!responseData.success) {
        throw new Error(responseData.error || 'Failed to enroll teacher')
      }

      // Prepare subjects data for success callback
      const subjectsData = selectedSubjectBranches.map(assignment => {
        const branch = subjectBranches.find(b => b.id === assignment.branchId)
        const subject = subjects.find(s => s.id === assignment.subjectId)
        const classNames = assignment.classIds.map(classId => {
          const cls = classes.find(c => c.id === classId)
          return cls?.class_name || 'Unknown Class'
        })
        
        return {
          subjectId: assignment.subjectId,
          subjectName: subject?.subject_name || 'Unknown Subject',
          branchId: assignment.branchId,
          branchName: branch?.branch_name || 'Unknown Branch',
          classIds: assignment.classIds,
          classNames,
          isPrimary: assignment.isPrimary
        }
      })

      // Prepare classes data for success callback
      const classesData = selectedSubjectBranches
        .flatMap(assignment => assignment.classIds)
        .filter((classId, index, array) => array.indexOf(classId) === index) // Remove duplicates
        .map(classId => {
          const cls = classes.find(c => c.id === classId)
          return {
            classId,
            className: cls?.class_name || 'Unknown Class',
            classLevel: cls?.class_level || 'Unknown Level'
          }
        })

      onSuccess({ 
        teacherId: responseData.teacherId, 
        teacherData: formattedFormData,
        password: responseData.password,
        subjects: subjectsData,
        classes: classesData
      })
    } catch (err) {
      console.error("❌ Error in form submission:", err)
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to enroll teacher"
      
      // Show error toast
      toast({
        title: "Failed to enroll teacher",
        description: errorMessage,
        variant: "destructive"
      })
      
      setError(errorMessage)
      console.error("Error enrolling teacher:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Select value={formData.title} onValueChange={(value) => updateFormData("title", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mr.">Mr.</SelectItem>
                    <SelectItem value="Mrs.">Mrs.</SelectItem>
                    <SelectItem value="Ms.">Ms.</SelectItem>
                    <SelectItem value="Dr.">Dr.</SelectItem>
                    <SelectItem value="Prof.">Prof.</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input
                  id="nationality"
                  value={formData.nationality}
                  onChange={(e) => updateFormData("nationality", e.target.value)}
                  placeholder="Enter nationality"
                />
              </div>
              <div>
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  value={formData.idNumber}
                  onChange={(e) => updateFormData("idNumber", e.target.value)}
                  placeholder="Enter ID number"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter email address"
                  className={formData.email && !isValidEmailFormat(formData.email) ? "border-red-500" : ""}
                />
                {formData.email && !isValidEmailFormat(formData.email) && (
                  <p className="text-sm text-red-600 mt-1">
                    Please enter a valid email address (e.g., user@example.com)
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData("phone", e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: +237 6XXXXXXXX (Cameroon mobile number)
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <Label htmlFor="region">Region *</Label>
                <Select value={formData.region} onValueChange={(value) => updateFormData("region", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                <Input
                  id="emergencyName"
                  value={formData.emergencyContact.name}
                  onChange={(e) => updateFormData("emergencyContact.name", e.target.value)}
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                <Input
                  id="emergencyPhone"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => updateFormData("emergencyContact.phone", e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                  maxLength={15}
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-3">
            <div>
              <Label htmlFor="subsystem">Educational Sub-system *</Label>
              <Select value={formData.subsystem} onValueChange={(value) => updateFormData("subsystem", value as "english" | "french")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subsystem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English Sub-system</SelectItem>
                  <SelectItem value="french">French Sub-system</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Qualifications *</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a qualification"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addToArray("qualifications", input.value)
                        input.value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a qualification"]') as HTMLInputElement
                      if (input && input.value) {
                        addToArray("qualifications", input.value)
                        input.value = ""
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.qualifications.map((qualification) => (
                    <Badge key={qualification} variant="secondary" className="flex items-center space-x-1">
                      <span>{qualification}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray("qualifications", qualification)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => updateFormData("experience", e.target.value)}
                placeholder="Describe teaching experience"
                rows={3}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Teaching Assignment</h3>
              <p className="text-muted-foreground">
                Assign subjects and classes to the teacher. This step is optional.
              </p>
            </div>

            {loadingSubjects || loadingClasses ? (
              <ShimmerSubjectBranchAssignment />
            ) : (
              <div className="space-y-4">
                {selectedSubjectBranches.map((assignment, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Assignment {index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSubjectBranchAssignment(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Subject Selection */}
                      <div className="space-y-2">
                        <Label>Subject *</Label>
                        <Select
                          value={assignment.subjectId}
                          onValueChange={(value) => updateSubjectBranchAssignment(index, 'subjectId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects
                              .filter(subject => subject.subsystem === formData.subsystem)
                              .map(subject => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.subject_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Branch Selection */}
                      <div className="space-y-2">
                        <Label>Subject Branch (Optional)</Label>
                        <Select
                          value={assignment.branchId}
                          onValueChange={(value) => updateSubjectBranchAssignment(index, 'branchId', value)}
                          disabled={!assignment.subjectId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {assignment.subjectId && getBranchesForSubject(assignment.subjectId).map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.branch_name} ({branch.branch_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Class Selection */}
                    <div className="space-y-2">
                      <Label>Classes *</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {getClassesForSubsystem().map(cls => (
                          <div key={cls.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`class-${index}-${cls.id}`}
                              checked={assignment.classIds.includes(cls.id)}
                              onCheckedChange={() => toggleClassSelection(index, cls.id)}
                            />
                            <Label htmlFor={`class-${index}-${cls.id}`} className="text-sm">
                              {cls.class_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Primary Teacher Checkbox */}
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                        id={`primary-${index}`}
                        checked={assignment.isPrimary}
                        onCheckedChange={(checked) => updateSubjectBranchAssignment(index, 'isPrimary', checked)}
                      />
                      <Label htmlFor={`primary-${index}`}>Primary Teacher for this assignment</Label>
                    </div>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSubjectBranchAssignment('', '', [], false)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Assignment
                </Button>

                {selectedSubjectBranches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No assignments added yet. Click "Add Another Assignment" to get started.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )

      case 6:
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateFormData("employmentType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="substitute">Substitute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData("startDate", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="salary">Salary (Optional)</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => updateFormData("salary", parseFloat(e.target.value) || 0)}
                placeholder="Enter salary amount"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const progress = (currentStep / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>Step {currentStep} of {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center space-x-2">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`flex items-center space-x-2 text-sm ${
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
            <span>{steps[currentStep - 1].title}</span>
          </CardTitle>
          <CardDescription>
            {currentStep === 5 
              ? "Assign subjects and classes to the teacher. This step is optional."
              : `Please fill in the ${steps[currentStep - 1].title.toLowerCase()} information.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="space-x-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
              Previous
            </Button>
          )}
          <Button 
            onClick={handleSubmit} 
            disabled={!validateStep(currentStep) || isSubmitting}
          >
            {isSubmitting ? "Processing..." : currentStep === 6 ? "Enroll Teacher" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
