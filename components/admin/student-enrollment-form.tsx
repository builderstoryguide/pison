"use client"

import { useState } from 'react'
import { Check, User, MapPin, GraduationCap, Users, Heart, FileText, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

import { useStudentEnrollment, StudentEnrollmentData } from '@/lib/student-enrollment-context'

const cameroonRegions = [
  'Adamawa', 'Centre', 'East', 'Far North', 'Littoral', 
  'North', 'Northwest', 'South', 'Southwest', 'West'
]

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const relationships = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'other', label: 'Other' }
]

const classes = {
  english: {
    grammar: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5', 'Lower Sixth', 'Upper Sixth'],
    technical: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5'],
    commercial: ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Form 5']
  },
  french: {
    grammar: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
    technical: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale'],
    commercial: ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Terminale']
  }
}

interface StudentEnrollmentFormProps {
  onSuccess: (result: { studentId: string; parentCode: string; studentName: string }) => void
  onCancel: () => void
}

export function StudentEnrollmentForm({ onSuccess, onCancel }: StudentEnrollmentFormProps) {
  const { enrollStudent, generateStudentId, isLoading, error } = useStudentEnrollment()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<StudentEnrollmentData>({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: 'male',
    placeOfBirth: '',
    nationality: 'Cameroonian',
    religion: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: 'Centre',
    subsystem: 'english',
    branch: 'grammar',
    class: '',
    previousSchool: '',
    previousClass: '',
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentAddress: '',
    parentOccupation: '',
    relationship: 'father',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalConditions: '',
    allergies: '',
    bloodGroup: '',
    birthCertificate: false,
    previousTranscript: false,
    medicalCertificate: false,
    passportPhoto: false
  })

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (field: keyof StudentEnrollmentData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    const result = await enrollStudent(formData)
    if (result.success && result.studentId && result.parentCode) {
      const studentName = `${formData.firstName} ${formData.lastName}`
      onSuccess({ studentId: result.studentId, parentCode: result.parentCode, studentName })
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.placeOfBirth)
      case 2:
        return !!(formData.email && formData.address && formData.city)
      case 3:
        return !!(formData.class)
      case 4:
        return !!(formData.parentName && formData.parentEmail && formData.parentPhone)
      case 5:
        return !!(formData.emergencyContactName && formData.emergencyContactPhone)
      case 6:
        return formData.birthCertificate && formData.passportPhoto
      default:
        return true
    }
  }

  const getStepValidationMessage = (step: number): string | null => {
    switch (step) {
      case 1:
        if (!formData.firstName) return "First name is required"
        if (!formData.lastName) return "Last name is required"
        if (!formData.dateOfBirth) return "Date of birth is required"
        if (!formData.placeOfBirth) return "Place of birth is required"
        break
      case 2:
        if (!formData.email) return "Email address is required"
        if (!formData.address) return "Home address is required"
        if (!formData.city) return "City is required"
        break
      case 3:
        if (!formData.class) return "Class selection is required"
        break
      case 4:
        if (!formData.parentName) return "Parent/guardian name is required"
        if (!formData.parentEmail) return "Parent email is required"
        if (!formData.parentPhone) return "Parent phone is required"
        break
      case 5:
        if (!formData.emergencyContactName) return "Emergency contact name is required"
        if (!formData.emergencyContactPhone) return "Emergency contact phone is required"
        break
      case 6:
        if (!formData.birthCertificate) return "Birth certificate confirmation is required"
        if (!formData.passportPhoto) return "Passport photo confirmation is required"
        break
    }
    return null
  }

  const availableClasses = classes[formData.subsystem]?.[formData.branch] || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Student Enrollment</h2>
        <p className="text-muted-foreground">
          Complete the enrollment process for a new student
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
          <Badge variant="outline">Student ID: {generateStudentId()}</Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <><User className="h-5 w-5" /> Personal Information</>}
            {currentStep === 2 && <><MapPin className="h-5 w-5" /> Contact Information</>}
            {currentStep === 3 && <><GraduationCap className="h-5 w-5" /> Academic Information</>}
            {currentStep === 4 && <><Users className="h-5 w-5" /> Parent/Guardian Information</>}
            {currentStep === 5 && <><Heart className="h-5 w-5" /> Emergency & Medical Information</>}
            {currentStep === 6 && <><FileText className="h-5 w-5" /> Required Documents</>}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter the student's basic personal details"}
            {currentStep === 2 && "Provide contact and address information"}
            {currentStep === 3 && "Select academic program and class"}
            {currentStep === 4 && "Enter parent or guardian details"}
            {currentStep === 5 && "Provide emergency contact and medical information"}
            {currentStep === 6 && "Confirm required documents are available"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => updateFormData('middleName', e.target.value)}
                    placeholder="Enter middle name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender || 'none'} onValueChange={(value) => updateFormData('gender', value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth">Place of Birth *</Label>
                  <Input
                    id="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={(e) => updateFormData('placeOfBirth', e.target.value)}
                    placeholder="Enter place of birth"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => updateFormData('nationality', e.target.value)}
                    placeholder="Enter nationality"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="religion">Religion (Optional)</Label>
                <Input
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => updateFormData('religion', e.target.value)}
                  placeholder="Enter religion"
                />
              </div>
            </div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="student@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Home Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  placeholder="Enter complete home address"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    placeholder="Enter city"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select value={formData.region} onValueChange={(value) => updateFormData('region', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cameroonRegions.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Academic Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subsystem">Educational Sub-system *</Label>
                  <Select 
                    value={formData.subsystem} 
                    onValueChange={(value) => {
                      updateFormData('subsystem', value)
                      updateFormData('class', '') // Reset class when subsystem changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English Sub-system</SelectItem>
                      <SelectItem value="french">French Sub-system</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch *</Label>
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => {
                      updateFormData('branch', value)
                      updateFormData('class', '') // Reset class when branch changes
                    }}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => updateFormData('class', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClasses.map(cls => (
                      <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Previous School Information (Optional)</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="previousSchool">Previous School</Label>
                    <Input
                      id="previousSchool"
                      value={formData.previousSchool}
                      onChange={(e) => updateFormData('previousSchool', e.target.value)}
                      placeholder="Enter previous school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousClass">Previous Class</Label>
                    <Input
                      id="previousClass"
                      value={formData.previousClass}
                      onChange={(e) => updateFormData('previousClass', e.target.value)}
                      placeholder="Enter previous class"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Parent/Guardian Information */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parentName">Parent/Guardian Name *</Label>
                  <Input
                    id="parentName"
                    value={formData.parentName}
                    onChange={(e) => updateFormData('parentName', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select value={formData.relationship} onValueChange={(value) => updateFormData('relationship', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {relationships.map(rel => (
                        <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="parentEmail">Email Address *</Label>
                  <Input
                    id="parentEmail"
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => updateFormData('parentEmail', e.target.value)}
                    placeholder="parent@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parentPhone">Phone Number *</Label>
                  <Input
                    id="parentPhone"
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => updateFormData('parentPhone', e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentAddress">Address (Optional)</Label>
                <Textarea
                  id="parentAddress"
                  value={formData.parentAddress}
                  onChange={(e) => updateFormData('parentAddress', e.target.value)}
                  placeholder="Enter parent/guardian address (if different from student)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentOccupation">Occupation (Optional)</Label>
                <Input
                  id="parentOccupation"
                  value={formData.parentOccupation}
                  onChange={(e) => updateFormData('parentOccupation', e.target.value)}
                  placeholder="Enter occupation"
                />
              </div>
            </div>
          )}

          {/* Step 5: Emergency & Medical Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Emergency Contact</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">Contact Name *</Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => updateFormData('emergencyContactName', e.target.value)}
                      placeholder="Enter emergency contact name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Contact Phone *</Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => updateFormData('emergencyContactPhone', e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">Relationship to Student</Label>
                  <Input
                    id="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={(e) => updateFormData('emergencyContactRelationship', e.target.value)}
                    placeholder="e.g., Uncle, Aunt, Family Friend"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Medical Information (Optional)</h4>
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup || 'none'} onValueChange={(value) => updateFormData('bloodGroup', value === 'none' ? '' : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not specified</SelectItem>
                      {bloodGroups.map(group => (
                        <SelectItem key={group} value={group}>{group}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">Medical Conditions</Label>
                  <Textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => updateFormData('medicalConditions', e.target.value)}
                    placeholder="List any medical conditions or ongoing treatments"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => updateFormData('allergies', e.target.value)}
                    placeholder="List any known allergies"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Required Documents */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please confirm that you have the following required documents. These will need to be submitted during the enrollment process.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="birthCertificate"
                    checked={formData.birthCertificate}
                    onCheckedChange={(checked) => updateFormData('birthCertificate', checked)}
                  />
                  <Label htmlFor="birthCertificate" className="text-sm font-medium">
                    Birth Certificate (Original and Copy) *
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="passportPhoto"
                    checked={formData.passportPhoto}
                    onCheckedChange={(checked) => updateFormData('passportPhoto', checked)}
                  />
                  <Label htmlFor="passportPhoto" className="text-sm font-medium">
                    Passport-sized Photographs (4 copies) *
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="previousTranscript"
                    checked={formData.previousTranscript}
                    onCheckedChange={(checked) => updateFormData('previousTranscript', checked)}
                  />
                  <Label htmlFor="previousTranscript" className="text-sm font-medium">
                    Previous School Transcript (if applicable)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="medicalCertificate"
                    checked={formData.medicalCertificate}
                    onCheckedChange={(checked) => updateFormData('medicalCertificate', checked)}
                  />
                  <Label htmlFor="medicalCertificate" className="text-sm font-medium">
                    Medical Certificate
                  </Label>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Note:</strong> Documents marked with * are mandatory for enrollment completion.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

                {/* Validation Message */}
          {!isStepValid(currentStep) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {getStepValidationMessage(currentStep)}
              </AlertDescription>
            </Alert>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={prevStep}>
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              {currentStep < totalSteps ? (
                <Button 
                  onClick={nextStep} 
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={!isStepValid(currentStep) || isLoading}
                >
                  {isLoading ? 'Enrolling...' : 'Complete Enrollment'}
                </Button>
              )}
            </div>
          </div>
    </div>
  )
}
