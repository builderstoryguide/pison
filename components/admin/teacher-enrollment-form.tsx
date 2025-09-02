"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { User, Mail, MapPin, GraduationCap, Briefcase, X, Plus, AlertCircle } from "lucide-react"
import { useTeacherManagement, type TeacherFormData } from "@/lib/teacher-management-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

interface TeacherEnrollmentFormProps {
  onSuccess: (result: { teacherId: string; teacherData: TeacherFormData }) => void
  onCancel: () => void
}

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Contact Details", icon: Mail },
  { id: 3, title: "Address Information", icon: MapPin },
  { id: 4, title: "Academic Qualifications", icon: GraduationCap },
  { id: 5, title: "Teaching Assignment", icon: Briefcase },
  { id: 6, title: "Employment Details", icon: User },
]

const subjects = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English Language",
  "French",
  "History",
  "Geography",
  "Economics",
  "Accounting",
  "Computer Science",
  "Physical Education",
  "Arts",
  "Music",
  "Religious Studies",
  "Civic Education",
]

const classes = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6", "Form 7"]

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

export function TeacherEnrollmentForm({ onSuccess, onCancel }: TeacherEnrollmentFormProps) {
  const { addTeacher } = useTeacherManagement()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<TeacherFormData>({
    title: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "+237 6", // Prefill with Cameroon country code
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
      phone: "+237 6", // Prefill emergency contact phone too
    },
    status: "active",
  })

  const updateFormData = (field: string, value: any) => {
    // Special handling for phone numbers
    if (field === "phone" || field === "emergencyContact.phone") {
      // Ensure phone number starts with +237 6 for Cameroon
      let formattedPhone = value
      if (!formattedPhone.startsWith("+237 6")) {
        formattedPhone = "+237 6"
      }
      // Remove any invalid characters and ensure proper format
      formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, "")
      
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
      setFormData((prev) => {
        const updatedData = { ...prev, [field]: value }
        
        // Auto-set gender based on title selection
        if (field === "title") {
          switch (value) {
            case "Mr.":
              updatedData.gender = "male"
              break
            case "Mrs.":
            case "Ms.":
              updatedData.gender = "female"
              break
            // For Dr. and Prof., don't auto-set gender as they can be either
            default:
              break
          }
        }
        
        return updatedData
      })
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

  // Helper function to format phone number for database
  const formatPhoneForDatabase = (phone: string): string => {
    // Remove all non-numeric characters except + and spaces
    let formatted = phone.replace(/[^0-9\s\+]/g, "")
    
    // Ensure it starts with +237
    if (!formatted.startsWith("+237")) {
      formatted = "+237" + formatted.replace(/^\+/, "")
    }
    
    // Ensure it's at least 13 characters (+237 + 9 digits)
    if (formatted.length < 13) {
      formatted = formatted + "0".repeat(13 - formatted.length)
    }
    
    return formatted
  }

  // Helper function to validate phone number format
  const isValidPhoneFormat = (phone: string): boolean => {
    // Check if phone matches Cameroon mobile format: +237 6XXXXXXXX
    const phoneRegex = /^\+237\s?6\d{8}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.title && formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender)
      case 2:
        return !!(formData.email && formData.phone && isValidPhoneFormat(formData.phone))
      case 3:
        return !!(formData.address && formData.city && formData.region)
      case 4:
        return formData.qualifications.length > 0
      case 5:
        return formData.subjects.length > 0 && formData.classes.length > 0
      case 6:
        return !!(
          formData.employmentType &&
          formData.salary &&
          formData.startDate &&
          formData.emergencyContact.name &&
          formData.emergencyContact.phone &&
          isValidPhoneFormat(formData.emergencyContact.phone)
        )
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    console.log("🚀 Starting form submission...")
    console.log("📋 Current step:", currentStep)
    console.log("✅ Step validation:", validateStep(currentStep))
    
    if (!validateStep(currentStep)) {
      console.log("❌ Step validation failed")
      toast.error("Form validation failed", {
        description: "Please fill in all required fields before proceeding."
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    // Show loading toast
    toast.info("Enrolling teacher...", {
      description: "Please wait while we process your request."
    })

    try {
      console.log("📤 Submitting teacher data...")
      
      // Format phone numbers for database submission
      const formattedFormData = {
        ...formData,
        phone: formatPhoneForDatabase(formData.phone),
        emergencyContact: {
          ...formData.emergencyContact,
          phone: formatPhoneForDatabase(formData.emergencyContact.phone)
        }
      }
      
      console.log("📊 Original form data:", formData)
      console.log("📊 Formatted form data:", formattedFormData)
      
      const teacherId = await addTeacher(formattedFormData)
      console.log("✅ Teacher added successfully with ID:", teacherId)
      
      // Show success toast
      toast.success("Teacher enrolled successfully!", {
        description: `${formData.title} ${formData.firstName} ${formData.lastName} has been added to the system.`
      })
      
      onSuccess({ teacherId, teacherData: formData })
    } catch (err) {
      console.error("❌ Error in form submission:", err)
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to enroll teacher"
      
      // Show error toast
      toast.error("Failed to enroll teacher", {
        description: errorMessage
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
          <div className="space-y-4">
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
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Enter email address"
                />
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
          <div className="space-y-4">
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
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Qualifications *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add qualification"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addToArray("qualifications", e.currentTarget.value)
                      e.currentTarget.value = ""
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    addToArray("qualifications", input.value)
                    input.value = ""
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.qualifications.map((qual, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {qual}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray("qualifications", qual)} />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="experience">Teaching Experience</Label>
              <Textarea
                id="experience"
                value={formData.experience}
                onChange={(e) => updateFormData("experience", e.target.value)}
                placeholder="Describe teaching experience"
                rows={4}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label>Sub-system</Label>
              <Select value={formData.subsystem} onValueChange={(value) => updateFormData("subsystem", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English Sub-system</SelectItem>
                  <SelectItem value="french">French Sub-system</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subjects to Teach *</Label>
              <Select onValueChange={(value) => addToArray("subjects", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subjects" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.subjects.map((subject, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {subject}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray("subjects", subject)} />
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Classes to Teach *</Label>
              <Select onValueChange={(value) => addToArray("classes", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select classes" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.classes.map((cls, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {cls}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeFromArray("classes", cls)} />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => updateFormData("employmentType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="salary">Monthly Salary (FCFA) *</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => updateFormData("salary", Number.parseInt(e.target.value) || 0)}
                  placeholder="Enter monthly salary"
                />
              </div>
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
            <div className="space-y-2">
              <Label>Emergency Contact *</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Contact name"
                  value={formData.emergencyContact.name}
                  onChange={(e) => updateFormData("emergencyContact.name", e.target.value)}
                />
                <Input
                  placeholder="Relationship"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => updateFormData("emergencyContact.relationship", e.target.value)}
                />
                <Input
                  placeholder="+237 6XX XXX XXX"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => updateFormData("emergencyContact.phone", e.target.value)}
                  maxLength={15}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: +237 6XXXXXXXX (Cameroon mobile number)
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Teacher Enrollment
        </CardTitle>
        <CardDescription>Complete all steps to enroll a new teacher</CardDescription>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / steps.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Navigation */}
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const StepIcon = step.icon
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  step.id === currentStep
                    ? "bg-primary text-primary-foreground"
                    : step.id < currentStep
                      ? "bg-green-100 text-green-800"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <StepIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            )
          })}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStep()}</div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <div>
            {currentStep > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={isSubmitting}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            {currentStep < steps.length ? (
              <Button onClick={nextStep} disabled={!validateStep(currentStep) || isSubmitting}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!validateStep(currentStep) || isSubmitting}>
                {isSubmitting ? "Enrolling..." : "Enroll Teacher"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
