"use client"

import { useState } from "react"
import { Download, FileText, Users, User, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useTeacherManagement } from "@/lib/teacher-management-context"
import { Teacher } from "@/lib/teacher-management-context"
import { useToast } from "@/hooks/use-toast"

interface TeacherExportFormProps {
  onCancel: () => void
  onSuccess?: () => void
  preSelectedTeacher?: Teacher
  preSelectedTeachers?: string[]
}

export function TeacherExportForm({ onCancel, onSuccess, preSelectedTeacher, preSelectedTeachers }: TeacherExportFormProps) {
  const { teachers } = useTeacherManagement()
  const { success: toastSuccess, error: toastError } = useToast()
  const [exportType, setExportType] = useState<"single" | "multiple">(
    preSelectedTeacher ? "single" : (preSelectedTeachers && preSelectedTeachers.length > 0 ? "multiple" : "single")
  )
  const [selectedTeacher, setSelectedTeacher] = useState<string>(preSelectedTeacher?.id || "")
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(preSelectedTeachers || (preSelectedTeacher ? [preSelectedTeacher.id] : []))
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv")
  const [selectedFields, setSelectedFields] = useState<string[]>([
    "teacherId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "subsystem",
    "status"
  ])

  // Available fields for export
  const availableFields = [
    { id: "teacherId", label: "Teacher ID", category: "Basic Info" },
    { id: "title", label: "Title", category: "Basic Info" },
    { id: "firstName", label: "First Name", category: "Basic Info" },
    { id: "lastName", label: "Last Name", category: "Basic Info" },
    { id: "email", label: "Email", category: "Contact" },
    { id: "phone", label: "Phone", category: "Contact" },
    { id: "address", label: "Address", category: "Contact" },
    { id: "city", label: "City", category: "Contact" },
    { id: "region", label: "Region", category: "Contact" },
    { id: "dateOfBirth", label: "Date of Birth", category: "Personal" },
    { id: "gender", label: "Gender", category: "Personal" },
    { id: "nationality", label: "Nationality", category: "Personal" },
    { id: "idNumber", label: "ID Number", category: "Personal" },
    { id: "subsystem", label: "Subsystem", category: "Professional" },
    { id: "subjects", label: "Subjects", category: "Professional" },
    { id: "classes", label: "Classes", category: "Professional" },
    { id: "qualifications", label: "Qualifications", category: "Professional" },
    { id: "experience", label: "Experience", category: "Professional" },
    { id: "employmentType", label: "Employment Type", category: "Professional" },
    { id: "salary", label: "Salary", category: "Professional" },
    { id: "startDate", label: "Start Date", category: "Professional" },
    { id: "status", label: "Status", category: "Professional" },
    { id: "emergencyContact", label: "Emergency Contact", category: "Emergency" },
    { id: "createdAt", label: "Created Date", category: "System" },
    { id: "updatedAt", label: "Updated Date", category: "System" }
  ]

  const groupedFields = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = []
    }
    acc[field.category].push(field)
    return acc
  }, {} as Record<string, typeof availableFields>)

  const handleFieldToggle = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId) 
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    )
  }

  const handleSelectAll = () => {
    setSelectedFields(availableFields.map(field => field.id))
  }

  const handleDeselectAll = () => {
    setSelectedFields([])
  }

  const handleTeacherToggle = (teacherId: string) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    )
  }

  const handleSelectAllTeachers = () => {
    setSelectedTeachers(teachers.map(teacher => teacher.id))
  }

  const handleDeselectAllTeachers = () => {
    setSelectedTeachers([])
  }

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(", ")
    }
    if (typeof value === "object" && value !== null) {
      return `${value.name} (${value.relationship}) - ${value.phone}`
    }
    return String(value || "")
  }

  const exportToCSV = (data: any[]) => {
    if (data.length === 0) return

    const headers = selectedFields.map(fieldId => {
      const field = availableFields.find(f => f.id === fieldId)
      return field?.label || fieldId
    })

    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        selectedFields.map(fieldId => {
          const value = formatValue(row[fieldId])
          // Escape commas and quotes in CSV
          return `"${value.replace(/"/g, '""')}"`
        }).join(",")
      )
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `teachers_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToJSON = (data: any[]) => {
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `teachers_export_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = () => {
    let teachersToExport: Teacher[] = []

    if (exportType === "single") {
      const teacher = teachers.find(t => t.id === selectedTeacher)
      if (teacher) {
        teachersToExport = [teacher]
      }
    } else {
      teachersToExport = teachers.filter(t => selectedTeachers.includes(t.id))
    }

    if (teachersToExport.length === 0) {
      toastError("No teachers selected", {
        description: "Please select at least one teacher to export."
      })
      return
    }

    if (selectedFields.length === 0) {
      toastError("No fields selected", {
        description: "Please select at least one field to export."
      })
      return
    }

    try {
      // Prepare data for export
      const exportData = teachersToExport.map(teacher => {
        const exportRow: any = {}
        selectedFields.forEach(fieldId => {
          exportRow[fieldId] = teacher[fieldId as keyof Teacher]
        })
        return exportRow
      })

      // Export based on format
      if (exportFormat === "csv") {
        exportToCSV(exportData)
      } else {
        exportToJSON(exportData)
      }

      toastSuccess("Export successful", {
        description: `Successfully exported ${teachersToExport.length} teacher(s) to ${exportFormat.toUpperCase()} format.`
      })

      onSuccess?.()
    } catch (error) {
      toastError("Export failed", {
        description: "An error occurred while exporting the data. Please try again."
      })
    }
  }

  const getSelectedTeachersCount = () => {
    return exportType === "single" 
      ? (selectedTeacher ? 1 : 0)
      : selectedTeachers.length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Export Teacher Data</h2>
          <p className="text-muted-foreground">
            Choose which teachers and data fields to export
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {getSelectedTeachersCount()} teacher(s) selected
          </Badge>
          <Badge variant="outline">
            {selectedFields.length} field(s) selected
          </Badge>
        </div>
      </div>

      {/* Export Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Export Type
          </CardTitle>
          <CardDescription>
            Choose whether to export a single teacher or multiple teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={exportType} onValueChange={(value: "single" | "multiple") => setExportType(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="single" id="single" />
              <Label htmlFor="single" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Single Teacher
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="multiple" id="multiple" />
              <Label htmlFor="multiple" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Multiple Teachers
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Teacher Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {exportType === "single" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {exportType === "single" ? "Select Teacher" : "Select Teachers"}
          </CardTitle>
          <CardDescription>
            {exportType === "single" 
              ? "Choose which teacher to export"
              : "Choose which teachers to export"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {exportType === "single" ? (
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.title} {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedTeachers.length} of {teachers.length} teachers selected
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllTeachers}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAllTeachers}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                {teachers.map((teacher) => (
                  <div key={teacher.id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id={teacher.id}
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={() => handleTeacherToggle(teacher.id)}
                    />
                    <Label htmlFor={teacher.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span>
                          {teacher.title} {teacher.firstName} {teacher.lastName}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline">{teacher.teacherId}</Badge>
                          <Badge variant="outline">{teacher.subsystem}</Badge>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Data Fields
          </CardTitle>
          <CardDescription>
            Choose which data fields to include in the export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">
              {selectedFields.length} of {availableFields.length} fields selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
              >
                Deselect All
              </Button>
            </div>
          </div>
          
          <div className="max-h-80 overflow-y-auto border rounded-md p-4">
            {Object.entries(groupedFields).map(([category, fields]) => (
              <div key={category} className="mb-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-2">
                  {category}
                </h4>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={field.id}
                        checked={selectedFields.includes(field.id)}
                        onCheckedChange={() => handleFieldToggle(field.id)}
                      />
                      <Label htmlFor={field.id} className="flex-1 cursor-pointer text-sm">
                        {field.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <Separator className="mt-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Format */}
      <Card>
        <CardHeader>
          <CardTitle>Export Format</CardTitle>
          <CardDescription>
            Choose the file format for your export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={exportFormat} onValueChange={(value: "csv" | "json") => setExportFormat(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv">CSV (Comma Separated Values)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="json" id="json" />
              <Label htmlFor="json">JSON (JavaScript Object Notation)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleExport}
          disabled={getSelectedTeachersCount() === 0 || selectedFields.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>
    </div>
  )
}
