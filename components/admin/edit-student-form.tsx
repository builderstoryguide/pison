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
  ChevronDownIcon
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { Student } from "@/lib/student-management-context"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface EditStudentFormProps {
  student: Student
  onSave: (updatedStudent: Partial<Student>) => Promise<boolean>
  onCancel: () => void
}

const classes = {
  english: {
    grammar: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"],
    technical: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
    commercial: ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5"],
  },
  french: {
    grammar: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
    technical: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
    commercial: ["6ème", "5ème", "4ème", "3ème", "2nde", "1ère", "Terminale"],
  },
}

export function EditStudentForm({ student, onSave, onCancel }: EditStudentFormProps) {
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
    academic_year: "2024-25",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("personal")

  // Initialize form data with student data
  useEffect(() => {
    setFormData({
      first_name: student.first_name || "",
      last_name: student.last_name || "",
      middle_name: student.middle_name || "",
      email: student.email || "",
      phone: student.phone || "",
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
      academic_year: student.academic_year || "2024-25",
    })
  }, [student])

  const handleInputChange = (field: keyof Student, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
      formData.class
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
                    onValueChange={(value) => handleInputChange("subsystem", value)}
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
                    onValueChange={(value) => handleInputChange("branch", value)}
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
                  <Select 
                    value={formData.class} 
                    onValueChange={(value) => handleInputChange("class", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.subsystem && formData.branch && 
                        classes[formData.subsystem as keyof typeof classes]?.[
                          formData.branch as keyof typeof classes.english
                        ]?.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
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
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Phone number"
                  />
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
                  <Label htmlFor="total_fees">Total Fees (XOF)</Label>
                  <Input
                    id="total_fees"
                    type="number"
                    value={formData.total_fees}
                    onChange={(e) => handleInputChange("total_fees", parseFloat(e.target.value) || 0)}
                    placeholder="Total fees"
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="academic_year">Academic Year</Label>
                  <Input
                    id="academic_year"
                    value={formData.academic_year}
                    onChange={(e) => handleInputChange("academic_year", e.target.value)}
                    placeholder="Academic year"
                  />
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
