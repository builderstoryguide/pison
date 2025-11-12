"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Mail, GraduationCap, Briefcase, X, Plus, AlertCircle, BookOpen, Users } from "lucide-react"
import { useTeacherManagement, type TeacherFormData, type Teacher } from "@/lib/teacher-management-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { copyToClipboardWithFeedback } from "@/lib/clipboard-utils"

interface EditTeacherFormProps {
  teacher: Teacher
  onSuccess: () => void
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

interface TeacherAssignment {
  id: string
  teacher_id: string
  branch_id: string
  class_id: string
  academic_year: string
  term: string
  is_primary_teacher: boolean
  assigned_at: string
  branch: SubjectBranch
  class: Class
}

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Contact & Address", icon: Mail },
  { id: 3, title: "Academic Details", icon: GraduationCap },
  { id: 4, title: "Teaching Assignments", icon: Briefcase },
]

const titles = ["Mr.", "Mrs.", "Miss", "Dr.", "Prof."]
const genders = ["male", "female"]
const nationalities = ["Cameroonian", "Nigerian", "Ghanaian", "Kenyan", "South African", "Other"]
const cities = ["Yaoundé", "Douala", "Bamenda", "Buea", "Kribi", "Kumba", "Limbe", "Bafoussam", "Garoua", "Maroua", "Bertoua", "Ebolowa", "Ngaoundéré", "Kousséri", "Mokolo", "Other"]
const regions = ["Adamawa", "Centre", "East", "Far North", "Littoral", "North", "North-West", "South", "South-West", "West"]

export function EnhancedEditTeacherForm({ teacher, onSuccess, onCancel }: EditTeacherFormProps) {
  const { updateTeacher } = useTeacherManagement()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data fetching states
  const [subjects, setSubjects] = useState<any[]>([])
  const [subjectBranches, setSubjectBranches] = useState<SubjectBranch[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [currentAssignments, setCurrentAssignments] = useState<TeacherAssignment[]>([])
  const [_isLoadingSubjects, setIsLoadingSubjects] = useState(false)
  const [_isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState<TeacherFormData>({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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
      phone: "",
    },
    status: "active",
  })

  // Assignment state
  const [selectedAssignments, setSelectedAssignments] = useState<{
    branchId: string
    classIds: string[]
    isPrimary: boolean
  }[]>([])

  // Initialize form data with teacher data
  useEffect(() => {
    setFormData({
      title: teacher.title || "",
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "+237 6",
      dateOfBirth: teacher.dateOfBirth || "",
      gender: teacher.gender || "",
      address: teacher.address || "",
      city: teacher.city || "",
      region: teacher.region || "",
      nationality: teacher.nationality || "Cameroonian",
      idNumber: teacher.idNumber || "",
      subsystem: teacher.subsystem || "english",
      subjects: teacher.subjects || [],
      classes: teacher.classes || [],
      qualifications: teacher.qualifications || [],
      experience: teacher.experience || "",
      employmentType: teacher.employmentType || "full-time",
      salary: teacher.salary || 0,
      startDate: teacher.startDate || "",
      emergencyContact: {
        name: teacher.emergencyContact?.name || "",
        relationship: teacher.emergencyContact?.relationship || "",
        phone: teacher.emergencyContact?.phone || "+237 6",
      },
      status: teacher.status || "active",
    })
  }, [teacher])

  // Function to fetch teacher assignments
  const fetchTeacherAssignments = async () => {
    if (!teacher.id) return

    setIsLoadingAssignments(true)
    try {
      console.log('🔍 Fetching current assignments for teacher:', teacher.id)
      const assignmentsResponse = await fetch(`/api/teachers/assignments/ultra-fast?teacherId=${teacher.id}`)
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json()
        if (assignmentsData.success && assignmentsData.assignments) {
          console.log('✅ Current assignments loaded:', assignmentsData.assignments)
          setCurrentAssignments(assignmentsData.assignments)
          
          // Initialize selected assignments from current assignments
          const initialAssignments = assignmentsData.assignments.map((assignment: any) => ({
            branchId: assignment.branch_id || 'none',
            classIds: [assignment.class_id],
            isPrimary: assignment.is_primary_teacher
          }))
          setSelectedAssignments(initialAssignments)
        }
      }
    } catch (error) {
      console.error('Error fetching teacher assignments:', error)
    } finally {
      setIsLoadingAssignments(false)
    }
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Fetch subjects
      setIsLoadingSubjects(true)
      try {
        const subjectsResponse = await fetch('/api/subjects')
        const subjectsData = await subjectsResponse.json()
        if (subjectsData.success) {
          setSubjects(subjectsData.subjects || [])
        }
      } catch (error) {
        console.error('Error fetching subjects:', error)
      } finally {
        setIsLoadingSubjects(false)
      }

      // Fetch subject branches
      try {
        const branchesResponse = await fetch('/api/subject-branches')
        const branchesData = await branchesResponse.json()
        if (branchesData.success) {
          setSubjectBranches(branchesData.branches || [])
        }
      } catch (error) {
        console.error('Error fetching subject branches:', error)
      }

      // Fetch classes
      setIsLoadingClasses(true)
      try {
        const classesResponse = await fetch('/api/classes')
        const classesData = await classesResponse.json()
        if (classesData.success) {
          setClasses(classesData.classes || [])
        }
      } catch (error) {
        console.error('Error fetching classes:', error)
      } finally {
        setIsLoadingClasses(false)
      }

      // Fetch teacher's current assignments
      await fetchTeacherAssignments()
    }

    fetchData()
  }, [teacher?.teacherId])

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

    // Special handling for phone numbers
    if (field === 'phone' || (field.includes('.') && field.endsWith('phone'))) {
      let formattedPhone = value
      if (!formattedPhone.startsWith('+237 6')) {
        formattedPhone = '+237 6'
      }
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

  // Assignment management functions
  const addAssignment = () => {
    setSelectedAssignments(prev => [...prev, {
      branchId: 'none',
      classIds: [],
      isPrimary: false
    }])
  }

  const removeAssignment = (index: number) => {
    setSelectedAssignments(prev => prev.filter((_, i) => i !== index))
  }

  const updateAssignment = (index: number, field: string, value: any) => {
    setSelectedAssignments(prev => prev.map((assignment, i) => 
      i === index ? { ...assignment, [field]: value } : assignment
    ))
  }

  const toggleClassForAssignment = (assignmentIndex: number, classId: string) => {
    setSelectedAssignments(prev => prev.map((assignment, i) => {
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
    }))
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.dateOfBirth)
      case 2:
        return !!(formData.phone && formData.address && formData.city && formData.region)
      case 3:
        return !!(formData.subsystem && formData.qualifications.length > 0)
      case 4:
        return selectedAssignments.length > 0 && selectedAssignments.every(a => a.classIds.length > 0)
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Update basic teacher information
      await updateTeacher(teacher.id, formData)
      
      // Update teacher assignments
      await updateTeacherAssignments(teacher.id, selectedAssignments)

      // Invalidate ultra-fast cache to ensure fresh data
      try {
        await fetch('/api/teachers/assignments/ultra-fast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'clear_cache',
            teacherId: teacher.id
          })
        })
        console.log('✅ Ultra-fast cache invalidated for teacher:', teacher.id)
      } catch (cacheError) {
        console.warn('⚠️ Failed to invalidate cache:', cacheError)
      }

      // Refresh assignments to show updated data
      await fetchTeacherAssignments()
      
      toast.success(`Teacher updated successfully! ${formData.firstName} ${formData.lastName}'s information has been updated.`)
      
      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to update teacher"
      
      toast.error(`Failed to update teacher: ${errorMessage}`)
      
      setError(errorMessage)
      console.error("Error updating teacher:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to update teacher assignments
  const updateTeacherAssignments = async (
    teacherId: string, 
    assignments: { branchId: string; classIds: string[]; isPrimary: boolean }[]
  ) => {
    try {
      console.log('🔄 Updating teacher assignments...', { teacherId, assignments })
      
      // Create assignment requests
      const assignmentRequests = []
      
      for (const assignment of assignments) {
        console.log('🔍 Processing assignment:', {
          branchId: assignment.branchId,
          classIds: assignment.classIds,
          isPrimary: assignment.isPrimary
        })
        
        // Only create assignments if branchId is provided and not "none" (required for database)
        // Convert "none" back to empty string for API, but skip if it's "none" or empty
        const branchIdValue = assignment.branchId === 'none' ? '' : assignment.branchId
        if (branchIdValue && branchIdValue.trim() !== '') {
          console.log('✅ Creating assignments with branchId:', branchIdValue)
          for (const classId of assignment.classIds) {
            assignmentRequests.push({
              teacherId,
              branchId: branchIdValue,
              classId,
              academicYear: '2024-2025',
              term: 'Term 1',
              isPrimary: assignment.isPrimary
            })
          }
        } else {
          console.warn('⚠️ Skipping assignment - no branchId provided:', {
            assignment,
            reason: assignment.branchId === 'none' ? 'branchId is "none" (no specific branch)' : !assignment.branchId ? 'branchId is null/undefined' : 'branchId is empty string'
          })
        }
      }
      
      if (assignmentRequests.length > 0) {
        const response = await fetch('/api/teachers/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assignments: assignmentRequests }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to update assignments')
        }
        
        const result = await response.json()
        if (!result.success) {
          throw new Error(result.error || 'Failed to update assignments')
        }
        
        console.log('✅ Assignments updated successfully')
      }
      
    } catch (error) {
      console.error('❌ Error updating teacher assignments:', error)
      throw error
    }
  }

  const progress = (currentStep / steps.length) * 100

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
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
                className={`flex items-center justify-center p-2 rounded-full border-2 transition-colors ${
                  step.id <= currentStep 
                    ? "text-primary border-primary bg-primary/10" 
                    : "text-muted-foreground border-muted-foreground/30"
                }`}
                title={step.title}
              >
                <Icon className="h-4 w-4" />
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

      {/* Step 1: Personal Information */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
            <CardDescription>Basic personal details of the teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Select value={formData.title} onValueChange={(value) => updateFormData("title", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select title" />
                  </SelectTrigger>
                  <SelectContent>
                    {titles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  placeholder="Enter first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    {genders.map((gender) => (
                      <SelectItem key={gender} value={gender}>
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationality">Nationality</Label>
                <Select value={formData.nationality} onValueChange={(value) => updateFormData("nationality", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent>
                    {nationalities.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>
                        {nationality}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => updateFormData("idNumber", e.target.value)}
                placeholder="Enter ID number"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Contact & Address */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Contact & Address</span>
            </CardTitle>
            <CardDescription>Contact information and address details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="+237 6XX XXX XXX"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: +237 6XXXXXXXX (Cameroon mobile number)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Select value={formData.city} onValueChange={(value) => updateFormData("city", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
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

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h4 className="font-medium">Emergency Contact</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) => updateFormData("emergencyContact.name", e.target.value)}
                    placeholder="Enter contact name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyRelationship">Relationship</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) => updateFormData("emergencyContact.relationship", e.target.value)}
                    placeholder="e.g., Spouse, Parent"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone Number</Label>
                  <Input
                    id="emergencyPhone"
                    type="tel"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => updateFormData("emergencyContact.phone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Academic Details */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GraduationCap className="h-5 w-5" />
              <span>Academic Details</span>
            </CardTitle>
            <CardDescription>Educational background and qualifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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

            {/* Qualifications */}
            <div className="space-y-2">
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

            <div className="space-y-2">
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => updateFormData("experience", e.target.value)}
                placeholder="Describe teaching experience"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Teaching Assignments */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Teaching Assignments</span>
            </CardTitle>
            <CardDescription>Assign subjects and classes to the teacher</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingAssignments ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Loading current assignments...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Current Assignments Display */}
                {currentAssignments.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Current Assignments</span>
                    </h4>
                    <div className="grid gap-3">
                      {currentAssignments.map((assignment, index) => (
                        <div key={index} className="p-3 border rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline">
                                  {assignment.branch?.subject?.subject_name || 'Unknown Subject'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">→</span>
                                <Badge variant="secondary">
                                  {assignment.branch?.branch_name || 'Unknown Branch'}
                                </Badge>
                                <span className="text-sm text-muted-foreground">→</span>
                                <Badge variant="default">
                                  {assignment.class?.class_name || 'Unknown Class'}
                                </Badge>
                                {assignment.is_primary_teacher && (
                                  <Badge variant="destructive">Primary</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {assignment.academic_year} • {assignment.term}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const assignmentText = `${assignment.branch?.subject?.subject_name || 'Unknown Subject'} - ${assignment.branch?.branch_name || 'Unknown Branch'} - ${assignment.class?.class_name || 'Unknown Class'}`
                                copyToClipboardWithFeedback(
                                  assignmentText,
                                  () => toast.success("Assignment copied to clipboard"),
                                  (error) => toast.error(`Failed to copy: ${error}`)
                                )
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Assignments */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>New Assignments</span>
                    </h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addAssignment}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Assignment
                    </Button>
                  </div>

                  {selectedAssignments.map((assignment, index) => (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="font-medium">Assignment {index + 1}</h5>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAssignment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Subject Branch Selection */}
                        <div className="space-y-2">
                          <Label>Subject Branch (Optional)</Label>
                          <Select
                            value={assignment.branchId || 'none'}
                            onValueChange={(value) => updateAssignment(index, 'branchId', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject branch" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No specific branch</SelectItem>
                              {subjects
                                .filter(subject => subject.subsystem === formData.subsystem)
                                .map(subject => {
                                  const branches = getBranchesForSubject(subject.id)
                                  return (
                                    <div key={subject.id}>
                                      <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                                        {subject.subject_name}
                                      </div>
                                      {branches.map(branch => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                          {branch.branch_name} ({branch.branch_code})
                                        </SelectItem>
                                      ))}
                                    </div>
                                  )
                                })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Primary Teacher Checkbox */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`primary-${index}`}
                            checked={assignment.isPrimary}
                            onCheckedChange={(checked) => updateAssignment(index, 'isPrimary', checked)}
                          />
                          <Label htmlFor={`primary-${index}`}>Primary Teacher</Label>
                        </div>
                      </div>

                      {/* Class Selection */}
                      <div className="space-y-2">
                        <Label>Classes *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {getClassesForSubsystem().map(cls => (
                            <div key={cls.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`class-${index}-${cls.id}`}
                                checked={assignment.classIds.includes(cls.id)}
                                onCheckedChange={() => toggleClassForAssignment(index, cls.id)}
                              />
                              <Label htmlFor={`class-${index}-${cls.id}`} className="text-sm">
                                {cls.class_name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedAssignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assignments added yet. Click "Add Assignment" to get started.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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
          <Button onClick={handleSubmit} disabled={!validateStep(currentStep) || isSubmitting}>
            {isSubmitting ? "Updating..." : currentStep === 4 ? "Update Teacher" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  )
}
