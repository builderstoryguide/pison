"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  GraduationCap, 
  Mail, 
  Phone, 
  MapPin, 
  Save,
  X,
  AlertCircle,
  ChevronDownIcon,
  Loader2,
  CheckCircle2
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Student } from "@/lib/student-management-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { Info } from "lucide-react"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface EditStudentFormProps {
  student: Student
  onSave: (updatedStudent: Partial<Student>) => Promise<boolean>
  onCancel: () => void
}

interface ClassData {
  id: string
  name: string
  level: string
  subsystem: string
  branch: string
  academicYear?: string
  status: string
}

export function EditStudentForm({ student, onSave, onCancel }: EditStudentFormProps) {
  const globalAcademicYear = useGlobalAcademicYear()
  const [formData, setFormData] = useState<Partial<Student>>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    gender: "",
    place_of_birth: "",
    nationality: "",
    religion: "",
    address: "",
    city: "",
    region: "",
    subsystem: "english",
    branch: "grammar",
    class: "",
    previous_school: "",
    previous_class: "",
    total_fees: 0,
    paid_fees: 0,
    fees_status: "pending",
    enrollment_status: "pending",
    academic_year: globalAcademicYear, // Use global academic year
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")
  const [availableClasses, setAvailableClasses] = useState<ClassData[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [classesError, setClassesError] = useState<string | null>(null)
  
  // Fee structure state management
  const [isLoadingFeeStructure, setIsLoadingFeeStructure] = useState(false)
  const [feeStructureError, setFeeStructureError] = useState<string | null>(null)
  const [hasValidFeeStructure, setHasValidFeeStructure] = useState(false)
  const [feeStructureName, setFeeStructureName] = useState<string | null>(null)
  const [term, setTerm] = useState<"first" | "second" | "third">("first")

  // Function to check if a string is a UUID
  const isUUID = (str: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(str)
  }

  // Function to fetch classes from API
  const fetchClasses = async (subsystem: string, branch: string) => {
    if (!subsystem || !branch) {
      setAvailableClasses([])
      return
    }

    setIsLoadingClasses(true)
    setClassesError(null)

    try {
      const params = new URLSearchParams({
        subsystem,
        branch,
        status: 'active',
      })

      const response = await fetch(`/api/classes?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }

      const data = await response.json()
      
      // Transform API response to match our format
      const transformedClasses: ClassData[] = (data || []).map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        level: cls.level,
        subsystem: cls.subsystem,
        branch: cls.branch,
        academicYear: cls.academicYear,
        status: cls.status,
      }))

      setAvailableClasses(transformedClasses)

      // If student has a class assigned, try to match it and update formData
      if (student.class) {
        let matchedClass: ClassData | undefined

        // Check if student.class is a UUID (class ID)
        if (isUUID(student.class)) {
          // Find by ID
          matchedClass = transformedClasses.find((cls) => cls.id === student.class)
        } else {
          // Find by name
          matchedClass = transformedClasses.find((cls) => cls.name === student.class)
        }

        // If we found a match, update formData with the class ID (UUID)
        if (matchedClass) {
          setFormData((prev) => {
            // Only update if the class ID is different to avoid unnecessary re-renders
            if (prev.class !== matchedClass!.id) {
              return { ...prev, class: matchedClass!.id }
            }
            return prev
          })
        }
        // If no match found, keep the current class value (handles edge cases)
      }
    } catch (err) {
      console.error('Error fetching classes:', err)
      setClassesError(err instanceof Error ? err.message : 'Failed to load classes')
      setAvailableClasses([])
    } finally {
      setIsLoadingClasses(false)
    }
  }

  // Initialize form data with student data
  useEffect(() => {
    setFormData({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      middle_name: student.middle_name || "",
      email: student.email || "",
      phone: student.phone || "+237 6",
      date_of_birth: student.date_of_birth || "",
      gender: student.gender || "",
      place_of_birth: student.place_of_birth || "",
      nationality: student.nationality || "",
      religion: student.religion || "",
      address: student.address || "",
      city: student.city || "",
      region: student.region || "",
      subsystem: student.subsystem || "english",
      branch: student.branch || "grammar",
      class: student.class || "",
      previous_school: student.previous_school || "",
      previous_class: student.previous_class || "",
      total_fees: student.total_fees || 0,
      paid_fees: student.paid_fees || 0,
      fees_status: student.fees_status || "pending",
      enrollment_status: student.enrollment_status || "pending",
      academic_year: globalAcademicYear, // Use global academic year
    })
    // Initialize term - default to "first" if not available
    setTerm("first")
    // Reset fee structure state
    setHasValidFeeStructure(false)
    setFeeStructureName(null)
    setFeeStructureError(null)
  }, [student, globalAcademicYear])

  // Sync academic year with global setting whenever it changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, academic_year: globalAcademicYear }))
  }, [globalAcademicYear])

  // Fetch classes when form loads or when subsystem/branch changes
  useEffect(() => {
    if (formData.subsystem && formData.branch) {
      fetchClasses(formData.subsystem, formData.branch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.subsystem, formData.branch])

  // Function to fetch fee structure for class
  const fetchFeeStructureForClass = async (classId: string, academicYear: string, termValue: string) => {
    // Validate all three parameters are present
    if (!classId || !academicYear || !termValue) {
      setHasValidFeeStructure(false)
      setFeeStructureError("Class, academic year, and term are required")
      setFeeStructureName(null)
      setFormData(prev => ({ ...prev, total_fees: 0 }))
      return
    }

    // Only fetch if class is a valid UUID
    if (!isUUID(classId)) {
      setHasValidFeeStructure(false)
      setFeeStructureError("Invalid class ID")
      setFeeStructureName(null)
      setFormData(prev => ({ ...prev, total_fees: 0 }))
      return
    }

    setIsLoadingFeeStructure(true)
    setFeeStructureError(null)

    try {
      const params = new URLSearchParams({
        classId,
        academicYear,
        term: termValue,
      })

      const response = await fetch(`/api/bursar/fee-structures/by-class?${params.toString()}`)
      
      if (response.status === 404) {
        // No fee structure found
        setHasValidFeeStructure(false)
        setFeeStructureError("No fee structure found for this class, academic year, and term combination")
        setFeeStructureName(null)
        setFormData(prev => ({ ...prev, total_fees: 0 }))
      } else if (!response.ok) {
        // API error
        const errorData = await response.json().catch(() => ({}))
        setHasValidFeeStructure(false)
        setFeeStructureError(errorData.error || "Failed to fetch fee structure")
        setFeeStructureName(null)
        setFormData(prev => ({ ...prev, total_fees: 0 }))
      } else {
        // Success
        const data = await response.json()
        setHasValidFeeStructure(true)
        setFeeStructureName(data.name)
        setFeeStructureError(null)
        setFormData(prev => ({ ...prev, total_fees: data.totalAmount || 0 }))
      }
    } catch (err) {
      console.error('Error fetching fee structure:', err)
      setHasValidFeeStructure(false)
      setFeeStructureError("An error occurred while fetching fee structure")
      setFeeStructureName(null)
      setFormData(prev => ({ ...prev, total_fees: 0 }))
    } finally {
      setIsLoadingFeeStructure(false)
    }
  }

  // Fetch fee structure when class, academic year, or term changes
  useEffect(() => {
    if (formData.class && formData.academic_year && term) {
      // Reset validation state immediately when any field changes
      setHasValidFeeStructure(false)
      // Fetch fee structure
      fetchFeeStructureForClass(formData.class, formData.academic_year, term)
    } else {
      // If any required field is missing, reset state
      setHasValidFeeStructure(false)
      setFeeStructureError(null)
      setFeeStructureName(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.class, formData.academic_year, term])

  const handleInputChange = (field: keyof Student, value: string | number) => {
    // Special handling for phone numbers
    if (field === 'phone') {
      // Ensure phone number starts with +237 6 for Cameroon
      let formattedPhone = String(value)
      if (!formattedPhone.startsWith('+237 6')) {
        formattedPhone = '+237 6'
      }
      // Remove any invalid characters and ensure proper format
      formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
      setFormData(prev => ({ ...prev, [field]: formattedPhone }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await onSave(formData)
      if (!success) {
        setError("Failed to update student. Please try again.")
      }
    } catch (err) {
      setError("An error occurred while updating the student.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = () => {
    return !!(
      formData.first_name &&
      formData.last_name &&
      formData.email &&
      formData.class &&
      hasValidFeeStructure // Require valid fee structure
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Edit Student</h2>
          <p className="text-muted-foreground">
            Update information for {student.first_name} {student.last_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!isFormValid() || isLoading}
            title={!hasValidFeeStructure ? "Cannot save: No fee structure assigned to this class" : undefined}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="academic">Academic Info</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="fees">Fees & Status</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange("first_name", e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange("last_name", e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middle_name">Middle Name</Label>
                  <Input
                    id="middle_name"
                    value={formData.middle_name}
                    onChange={(e) => handleInputChange("middle_name", e.target.value)}
                    placeholder="Middle name"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        id="date_of_birth"
                        className="w-full justify-between font-normal"
                      >
                        {formData.date_of_birth ? new Date(formData.date_of_birth).toLocaleDateString() : "Select date"}
                        <ChevronDownIcon />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date_of_birth ? new Date(formData.date_of_birth) : undefined}
                        captionLayout="dropdown"
                        onSelect={(date) => {
                          if (date) {
                            handleInputChange("date_of_birth", format(date, "yyyy-MM-dd"))
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_of_birth">Place of Birth</Label>
                  <Input
                    id="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={(e) => handleInputChange("place_of_birth", e.target.value)}
                    placeholder="Place of birth"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality}
                    onChange={(e) => handleInputChange("nationality", e.target.value)}
                    placeholder="Nationality"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input
                    id="religion"
                    value={formData.religion}
                    onChange={(e) => handleInputChange("religion", e.target.value)}
                    placeholder="Religion"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Academic Information Tab */}
        <TabsContent value="academic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Academic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="subsystem">Sub-system</Label>
                  <Select 
                    value={formData.subsystem} 
                    onValueChange={(value) => {
                      handleInputChange("subsystem", value)
                      handleInputChange("class", "") // Reset class when subsystem changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sub-system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select 
                    value={formData.branch} 
                    onValueChange={(value) => {
                      handleInputChange("branch", value)
                      handleInputChange("class", "") // Reset class when branch changes
                    }}
                  >
                    <SelectTrigger>
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
                  <Label htmlFor="class">Class *</Label>
                  {isLoadingClasses ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading classes...
                    </div>
                  ) : classesError ? (
                    <div className="space-y-2">
                      <Select disabled>
                        <SelectTrigger>
                          <SelectValue placeholder="Error loading classes" />
                        </SelectTrigger>
                      </Select>
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {classesError}. Please try again or ensure classes are created in Class Management.
                        </AlertDescription>
                      </Alert>
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
                          {formData.subsystem && formData.branch
                            ? `No active classes found for ${formData.subsystem === 'english' ? 'English' : 'French'} Sub-system, ${formData.branch.charAt(0).toUpperCase() + formData.branch.slice(1)} branch. Please create classes in Class Management first.`
                            : 'Please select subsystem and branch first.'}
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <Select 
                      value={formData.class} 
                      onValueChange={(value) => {
                        handleInputChange("class", value)
                        setHasValidFeeStructure(false) // Reset validation when class changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableClasses.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="term">Term *</Label>
                  <Select 
                    value={term} 
                    onValueChange={(value: "first" | "second" | "third") => {
                      setTerm(value)
                      setHasValidFeeStructure(false) // Reset validation when term changes
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Term</SelectItem>
                      <SelectItem value="second">Second Term</SelectItem>
                      <SelectItem value="third">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="academic_year" className="flex items-center gap-2">
                    Academic Year *
                    <span className="text-xs text-muted-foreground font-normal">(Global Setting)</span>
                  </Label>
                  <Input
                    id="academic_year"
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
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="previous_school">Previous School</Label>
                  <Input
                    id="previous_school"
                    value={formData.previous_school}
                    onChange={(e) => handleInputChange("previous_school", e.target.value)}
                    placeholder="Previous school"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="previous_class">Previous Class</Label>
                  <Input
                    id="previous_class"
                    value={formData.previous_class}
                    onChange={(e) => handleInputChange("previous_class", e.target.value)}
                    placeholder="Previous class"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    maxLength={15}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: +237 6XXXXXXXX (Cameroon mobile number)
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Full address"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => handleInputChange("region", e.target.value)}
                    placeholder="Region"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fees & Status Tab */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Fees & Status Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="total_fees">Total Fees (XOF)</Label>
                    {hasValidFeeStructure && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Auto-filled
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="total_fees"
                      type="text"
                      value={isLoadingFeeStructure ? "Loading..." : (formData.total_fees?.toLocaleString() || "0")}
                      disabled
                      className="pr-10"
                      placeholder="Total fees"
                    />
                    {isLoadingFeeStructure && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {feeStructureName && hasValidFeeStructure && (
                    <p className="text-xs text-muted-foreground">
                      From: {feeStructureName}
                    </p>
                  )}
                  {!hasValidFeeStructure && formData.class && formData.academic_year && term && !isLoadingFeeStructure && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        No fee structure found for this class, academic year, and term combination. Please create and assign a fee structure in Fee Management before saving.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid_fees">Paid Fees (XOF)</Label>
                  <Input
                    id="paid_fees"
                    type="number"
                    value={formData.paid_fees}
                    onChange={(e) => handleInputChange("paid_fees", parseFloat(e.target.value) || 0)}
                    placeholder="Paid fees"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fees_status">Fees Status</Label>
                  <Select 
                    value={formData.fees_status} 
                    onValueChange={(value) => handleInputChange("fees_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fees status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="enrollment_status">Enrollment Status</Label>
                  <Select 
                    value={formData.enrollment_status} 
                    onValueChange={(value) => handleInputChange("enrollment_status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select enrollment status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">Enrolled</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Fees Summary */}
              {(formData.total_fees || 0) > 0 && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Fees Summary</h4>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Fees:</span>
                                             <span className="font-medium">{formData.total_fees?.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                                             <span className="font-medium text-green-600">{formData.paid_fees?.toLocaleString()} XOF</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span className="font-medium text-red-600">
                                                 {((formData.total_fees || 0) - (formData.paid_fees || 0)).toLocaleString()} XOF
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Payment Progress:</span>
                      <span className="font-medium">
                        {(formData.total_fees || 0) > 0 
                          ? Math.round(((formData.paid_fees || 0) / (formData.total_fees || 1)) * 100) 
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
