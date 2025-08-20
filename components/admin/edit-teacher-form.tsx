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
import { User, Mail, MapPin, GraduationCap, Briefcase, X, Plus, AlertCircle } from "lucide-react"
import { useTeacherManagement, type TeacherFormData, type Teacher } from "@/lib/teacher-management-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface EditTeacherFormProps {
  teacher: Teacher
  onSuccess: () => void
  onCancel: () => void
}

const steps = [
  { id: 1, title: "Personal Information", icon: User },
  { id: 2, title: "Contact & Address", icon: Mail },
  { id: 3, title: "Academic Details", icon: GraduationCap },
  { id: 4, title: "Employment Details", icon: Briefcase },
]

const titles = ["Mr.", "Mrs.", "Miss", "Dr.", "Prof."]
const genders = ["male", "female"]
const nationalities = ["Cameroonian", "Nigerian", "Ghanaian", "Kenyan", "South African", "Other"]
const cities = ["Yaoundé", "Douala", "Bamenda", "Buea", "Kribi", "Kumba", "Limbe", "Bafoussam", "Garoua", "Maroua", "Bertoua", "Ebolowa", "Ngaoundéré", "Kousséri", "Mokolo", "Other"]
const regions = ["Adamawa", "Centre", "East", "Far North", "Littoral", "North", "North-West", "South", "South-West", "West"]

export function EditTeacherForm({ teacher, onSuccess, onCancel }: EditTeacherFormProps) {
  const { updateTeacher } = useTeacherManagement()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // Initialize form data with teacher data
  useEffect(() => {
    setFormData({
      title: teacher.title || "",
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
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
        phone: teacher.emergencyContact?.phone || "",
      },
      status: teacher.status || "active",
    })
  }, [teacher])

  const updateFormData = (field: string, value: any) => {
    if (field.includes(".")) {
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

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.dateOfBirth)
      case 2:
        return !!(formData.phone && formData.address && formData.city && formData.region)
      case 3:
        return !!(formData.subsystem && formData.subjects.length > 0 && formData.classes.length > 0)
      case 4:
        return !!(formData.employmentType && formData.salary > 0 && formData.startDate)
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
      await updateTeacher(teacher.id, formData)
      onSuccess()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 
        typeof err === 'string' ? err : 
        err && typeof err === 'object' && 'message' in err ? String(err.message) :
        "Failed to update teacher"
      setError(errorMessage)
      console.error("Error updating teacher:", err)
    } finally {
      setIsSubmitting(false)
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={formData.phone}
                onChange={(e) => updateFormData("phone", e.target.value)}
                placeholder="Enter phone number"
              />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    value={formData.emergencyContact.phone}
                    onChange={(e) => updateFormData("emergencyContact.phone", e.target.value)}
                    placeholder="Enter phone number"
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
            <CardDescription>Educational background and teaching subjects</CardDescription>
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

            {/* Subjects */}
            <div className="space-y-2">
              <Label>Subjects Taught *</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a subject"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addToArray("subjects", input.value)
                        input.value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a subject"]') as HTMLInputElement
                      if (input && input.value) {
                        addToArray("subjects", input.value)
                        input.value = ""
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="flex items-center space-x-1">
                      <span>{subject}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray("subjects", subject)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Classes */}
            <div className="space-y-2">
              <Label>Classes Assigned *</Label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Add a class"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const input = e.target as HTMLInputElement
                        addToArray("classes", input.value)
                        input.value = ""
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Add a class"]') as HTMLInputElement
                      if (input && input.value) {
                        addToArray("classes", input.value)
                        input.value = ""
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.classes.map((classItem) => (
                    <Badge key={classItem} variant="secondary" className="flex items-center space-x-1">
                      <span>{classItem}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray("classes", classItem)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Qualifications */}
            <div className="space-y-2">
              <Label>Qualifications</Label>
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

      {/* Step 4: Employment Details */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Briefcase className="h-5 w-5" />
              <span>Employment Details</span>
            </CardTitle>
            <CardDescription>Employment information and contract details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateFormData("employmentType", value as "full-time" | "part-time" | "contract")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => updateFormData("startDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Salary (FCFA) *</Label>
              <Input
                id="salary"
                type="number"
                value={formData.salary}
                onChange={(e) => updateFormData("salary", parseFloat(e.target.value) || 0)}
                placeholder="Enter salary amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => updateFormData("status", value as "active" | "inactive")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
