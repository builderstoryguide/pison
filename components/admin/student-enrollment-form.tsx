"use client"

import React, { useState } from 'react'
import { Check, User, MapPin, GraduationCap, Users, Heart, FileText, AlertCircle, CalendarIcon, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'


import { useStudentEnrollment, StudentEnrollmentData } from '@/lib/student-enrollment-context'
import { useClassManagement } from '@/lib/class-management-context'
import { formatPhoneNumber, isValidPhoneFormat } from '@/lib/phone-utils'

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

const emergencyContactRelationships = [
  { value: 'father', label: 'Father' },
  { value: 'mother', label: 'Mother' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'grandfather', label: 'Grandfather' },
  { value: 'grandmother', label: 'Grandmother' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'family_friend', label: 'Family Friend' },
  { value: 'other', label: 'Other' }
]

interface StudentEnrollmentFormProps {
  onSuccess: (result: { 
    studentId: string; 
    parentCode: string; 
    studentName: string;
    studentPassword?: string;
    parentPassword?: string;
    studentEmail?: string;
    parentEmail?: string;
    className?: string;
  }) => void
  onCancel: () => void
}

export function StudentEnrollmentForm({ onSuccess, onCancel }: StudentEnrollmentFormProps) {
  const { enrollStudent, generateStudentId, isLoading, error } = useStudentEnrollment()
  const { classes: allClasses, isLoading: classesLoading, error: classesError } = useClassManagement()
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
    phone: '+237 6',
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
    parentPhone: '+237 6',
    parentAddress: '',
    parentOccupation: '',
    relationship: 'father',
    emergencyContactName: '',
    emergencyContactPhone: '+237 6',
    emergencyContactRelationship: '',
    medicalConditions: '',
    allergies: '',
    bloodGroup: '',
    birthCertificate: false,
    previousTranscript: false,
    medicalCertificate: false,
    passportPhoto: false
  })

  // Create a form for the date picker specifically
  const dateForm = useForm<{ dateOfBirth: Date }>({
    resolver: zodResolver(z.object({
      dateOfBirth: z.date({
        required_error: "Date of birth is required.",
      })
    })),
    defaultValues: {
      dateOfBirth: undefined
    }
  })

  const totalSteps = 6
  const progress = (currentStep / totalSteps) * 100

  const updateFormData = (field: keyof StudentEnrollmentData, value: any) => {
    // Special handling for phone numbers
    if (field === 'phone' || field === 'parentPhone' || field === 'emergencyContactPhone') {
      // Use the centralized phone utility for formatting
      const formattedPhone = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, [field]: formattedPhone }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
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
      onSuccess({ 
        studentId: result.studentId, 
        parentCode: result.parentCode, 
        studentName,
        studentPassword: result.studentPassword,
        parentPassword: result.parentPassword,
        studentEmail: formData.email,
        parentEmail: formData.parentEmail,
        className: formData.class
      })
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.placeOfBirth)
      case 2:
        return !!(formData.address && formData.city && (!formData.email || formData.email.includes('@')) && (!formData.phone || isValidPhoneFormat(formData.phone)))
      case 3:
        return !!(formData.class)
      case 4:
        const parentEmailValid = formData.parentEmail?.trim() && formData.parentEmail.includes('@')
        return !!(formData.parentName && formData.parentEmail?.trim() && parentEmailValid && (!formData.parentPhone || isValidPhoneFormat(formData.parentPhone)))
      case 5:
        return !!(formData.emergencyContactName && (!formData.emergencyContactPhone || isValidPhoneFormat(formData.emergencyContactPhone)))
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
        if (!formData.address) return "Home address is required"
        if (!formData.city) return "City is required"
        if (formData.email && !formData.email.includes('@')) return "Please enter a valid email address"
        if (formData.phone && !isValidPhoneFormat(formData.phone)) return "Valid phone number is required (Format: +237 6XXXXXXXX)"
        break
      case 3:
        if (!formData.class) return "Class selection is required"
        break
      case 4:
        if (!formData.parentName) return "Parent/guardian name is required"
        if (!formData.parentEmail?.trim()) return "Parent email address is required"
        if (formData.parentEmail && !formData.parentEmail.includes('@')) return "Please enter a valid parent email address"
        if (formData.parentPhone && !isValidPhoneFormat(formData.parentPhone)) return "Valid parent phone number is required (Format: +237 6XXXXXXXX)"
        break
      case 5:
        if (!formData.emergencyContactName) return "Emergency contact name is required"
        if (formData.emergencyContactPhone && !isValidPhoneFormat(formData.emergencyContactPhone)) return "Valid emergency contact phone number is required (Format: +237 6XXXXXXXX)"
        break
      case 6:
        if (!formData.birthCertificate) return "Birth certificate confirmation is required"
        if (!formData.passportPhoto) return "Passport photo confirmation is required"
        break
    }
    return null
  }

  // Filter classes from class management system based on subsystem and branch
  const availableClasses = allClasses
    .filter(cls => 
      cls.subsystem === formData.subsystem &&
      cls.branch === formData.branch &&
      cls.status === 'active'
    )
    .map(cls => ({
      id: cls.id,
      name: cls.name,
      displayName: cls.name
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

  const steps = [
    { id: 1, title: 'Personal Information', icon: User, description: 'Basic personal details' },
    { id: 2, title: 'Contact Information', icon: MapPin, description: 'Contact and address details' },
    { id: 3, title: 'Academic Information', icon: GraduationCap, description: 'Academic program and class' },
    { id: 4, title: 'Parent/Guardian', icon: Users, description: 'Parent or guardian details' },
    { id: 5, title: 'Emergency & Medical', icon: Heart, description: 'Emergency contact and medical info' },
    { id: 6, title: 'Required Documents', icon: FileText, description: 'Document confirmation' }
  ]

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Enrollment Progress</span>
            <span className="text-sm font-bold text-primary">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="space-y-6 pt-6">
            {/* Validation Alert */}
            {!isStepValid(currentStep) && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getStepValidationMessage(currentStep)}
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">
                      First Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => updateFormData('firstName', e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">
                      Last Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => updateFormData('lastName', e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-4">
                  <Form {...dateForm} className="w-full">
                    <FormField
                      control={dateForm.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col space-y-2 w-full">
                          <FormLabel>
                            Date of Birth <span className="text-destructive">*</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={`pl-3 text-left font-normal w-full ${!field.value ? "text-muted-foreground" : ""}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  field.onChange(date)
                                  if (date) {
                                    updateFormData('dateOfBirth', format(date, "yyyy-MM-dd"))
                                  }
                                }}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </Form>
                  <div className="space-y-2 w-full">
                    <Label htmlFor="gender">
                      Gender <span className="text-destructive">*</span>
                    </Label>
                    <Select value={formData.gender || ''} onValueChange={(value) => updateFormData('gender', value)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="placeOfBirth">
                      Place of Birth <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="placeOfBirth"
                      value={formData.placeOfBirth}
                      onChange={(e) => updateFormData('placeOfBirth', e.target.value)}
                      placeholder="Enter place of birth"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">
                      Nationality
                    </Label>
                    <Input
                      id="nationality"
                      value={formData.nationality}
                      onChange={(e) => updateFormData('nationality', e.target.value)}
                      placeholder="Enter nationality"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">
                    Religion (Optional)
                  </Label>
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
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email Address (Optional)
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="student@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Phone Number (Optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData('phone', e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      maxLength={15}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: +237 6XXXXXXXX (Cameroon mobile number)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="address">
                    Home Address <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="Enter complete home address"
                    required
                  />
                </div>

                <Separator />

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">
                      Region <span className="text-destructive">*</span>
                    </Label>
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
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="subsystem">
                      Educational Sub-system <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="branch">
                      Branch <span className="text-destructive">*</span>
                    </Label>
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

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="class">
                    Class <span className="text-destructive">*</span>
                  </Label>
                  {classesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading classes...
                    </div>
                  ) : availableClasses.length === 0 ? (
                    <div className="space-y-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="No classes available" />
                        </SelectTrigger>
                      </Select>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {classesError 
                            ? `Error loading classes: ${classesError}. Please ensure classes are created in Class Management.`
                            : `No active classes found for ${formData.subsystem === 'english' ? 'English' : 'French'} Sub-system, ${formData.branch.charAt(0).toUpperCase() + formData.branch.slice(1)} branch. Please create classes in Class Management first.`
                          }
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Select value={formData.class} onValueChange={(value) => updateFormData('class', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map(classOption => (
                          <SelectItem key={classOption.id} value={classOption.id}>
                            {classOption.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <Separator />

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="previousSchool">
                      Previous School
                    </Label>
                    <Input
                      id="previousSchool"
                      value={formData.previousSchool}
                      onChange={(e) => updateFormData('previousSchool', e.target.value)}
                      placeholder="Enter previous school name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="previousClass">
                      Previous Class
                    </Label>
                    <Input
                      id="previousClass"
                      value={formData.previousClass}
                      onChange={(e) => updateFormData('previousClass', e.target.value)}
                      placeholder="Enter previous class"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Parent/Guardian Information */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">
                      Parent/Guardian Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="parentName"
                      value={formData.parentName}
                      onChange={(e) => updateFormData('parentName', e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="relationship">
                      Relationship <span className="text-destructive">*</span>
                    </Label>
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

                <Separator />

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">
                      Parent Email
                    </Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      value={formData.parentEmail}
                      onChange={(e) => updateFormData('parentEmail', e.target.value)}
                      onBlur={(e) => updateFormData('parentEmail', e.target.value.trim())}
                      placeholder="parent@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">
                      Parent Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => updateFormData('parentPhone', e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      maxLength={15}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: +237 6XXXXXXXX (Cameroon mobile number)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="parentAddress">
                    Parent Address
                  </Label>
                  <Textarea
                    id="parentAddress"
                    value={formData.parentAddress}
                    onChange={(e) => updateFormData('parentAddress', e.target.value)}
                    placeholder="Enter parent/guardian address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parentOccupation">
                    Parent Occupation
                  </Label>
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
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">
                      Emergency Contact Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="emergencyContactName"
                      value={formData.emergencyContactName}
                      onChange={(e) => updateFormData('emergencyContactName', e.target.value)}
                      placeholder="Enter emergency contact name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">
                      Emergency Contact Phone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => updateFormData('emergencyContactPhone', e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      maxLength={15}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format: +237 6XXXXXXXX (Cameroon mobile number)
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactRelationship">
                    Emergency Contact Relationship
                  </Label>
                  <Select 
                    value={formData.emergencyContactRelationship || ''} 
                    onValueChange={(value) => updateFormData('emergencyContactRelationship', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {emergencyContactRelationships.map(rel => (
                        <SelectItem key={rel.value} value={rel.value}>{rel.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bloodGroup">
                      Blood Group
                    </Label>
                    <Select value={formData.bloodGroup} onValueChange={(value) => updateFormData('bloodGroup', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        {bloodGroups.map(group => (
                          <SelectItem key={group} value={group}>{group}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">
                    Medical Conditions
                  </Label>
                  <Textarea
                    id="medicalConditions"
                    value={formData.medicalConditions}
                    onChange={(e) => updateFormData('medicalConditions', e.target.value)}
                    placeholder="List any medical conditions (if any)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">
                    Allergies
                  </Label>
                  <Textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => updateFormData('allergies', e.target.value)}
                    placeholder="List any allergies (if any)"
                  />
                </div>
              </div>
            )}

            {/* Step 6: Required Documents */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-muted/50 border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Required Documents</h3>
                  <p className="text-muted-foreground mb-6">
                    Please confirm that you have the following documents ready for submission:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="birthCertificate"
                        checked={formData.birthCertificate}
                        onCheckedChange={(checked) => updateFormData('birthCertificate', checked)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="birthCertificate" className="text-sm font-semibold">
                          Birth Certificate <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Original or certified copy of birth certificate
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="passportPhoto"
                        checked={formData.passportPhoto}
                        onCheckedChange={(checked) => updateFormData('passportPhoto', checked)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="passportPhoto" className="text-sm font-semibold">
                          Passport Photo <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recent passport-sized photograph (2x2 inches)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="previousTranscript"
                        checked={formData.previousTranscript}
                        onCheckedChange={(checked) => updateFormData('previousTranscript', checked)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="previousTranscript" className="text-sm font-semibold">
                          Previous Academic Transcript
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Transcript from previous school (if applicable)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="medicalCertificate"
                        checked={formData.medicalCertificate}
                        onCheckedChange={(checked) => updateFormData('medicalCertificate', checked)}
                        className="mt-1"
                      />
                      <div className="space-y-1">
                        <Label htmlFor="medicalCertificate" className="text-sm font-semibold">
                          Medical Certificate
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Medical fitness certificate (if required)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="w-full sm:w-auto"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!isStepValid(currentStep) || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Enrollment
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
