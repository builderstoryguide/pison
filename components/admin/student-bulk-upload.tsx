"use client"

import { useState, useRef } from "react"
import { Upload, FileSpreadsheet, FileText, X, CheckCircle, AlertCircle, Download, Eye, Trash2 } from "lucide-react"
import * as XLSX from "xlsx"
import Papa from "papaparse"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useStudentEnrollment } from "@/lib/student-enrollment-context"
import { useNotifications } from "@/lib/notification-context"
import { UploadDebugInfo } from "./upload-debug-info"

interface StudentUploadData {
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth: string
  gender: string
  placeOfBirth: string
  nationality: string
  religion?: string
  email: string
  phone?: string
  address: string
  city: string
  region: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  class: string
  previousSchool?: string
  previousClass?: string
  parentName: string
  parentEmail: string
  parentPhone: string
  parentAddress?: string
  parentOccupation?: string
  relationship: "father" | "mother" | "guardian" | "other"
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship?: string
  medicalConditions?: string
  allergies?: string
  bloodGroup?: string
}

interface ValidationError {
  row: number
  field: string
  message: string
}

interface UploadResult {
  success: boolean
  studentId?: string
  parentCode?: string
  error?: string
}

interface StudentBulkUploadProps {
  onSuccess?: () => void
  onCancel?: () => void
}

const REQUIRED_FIELDS = [
  'firstName', 'lastName', 'dateOfBirth', 'gender', 'placeOfBirth', 'nationality',
  'email', 'address', 'city', 'region', 'subsystem', 'branch', 'class',
  'parentName', 'parentEmail', 'parentPhone', 'relationship',
  'emergencyContactName', 'emergencyContactPhone'
]

const FIELD_MAPPING = {
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Middle Name': 'middleName',
  'Date of Birth': 'dateOfBirth',
  'Gender': 'gender',
  'Place of Birth': 'placeOfBirth',
  'Nationality': 'nationality',
  'Religion': 'religion',
  'Email': 'email',
  'Phone': 'phone',
  'Address': 'address',
  'City': 'city',
  'Region': 'region',
  'Subsystem': 'subsystem',
  'Branch': 'branch',
  'Class': 'class',
  'Previous School': 'previousSchool',
  'Previous Class': 'previousClass',
  'Parent Name': 'parentName',
  'Parent Email': 'parentEmail',
  'Parent Phone': 'parentPhone',
  'Parent Address': 'parentAddress',
  'Parent Occupation': 'parentOccupation',
  'Relationship': 'relationship',
  'Emergency Contact Name': 'emergencyContactName',
  'Emergency Contact Phone': 'emergencyContactPhone',
  'Emergency Contact Relationship': 'emergencyContactRelationship',
  'Medical Conditions': 'medicalConditions',
  'Allergies': 'allergies',
  'Blood Group': 'bloodGroup'
}

export function StudentBulkUpload({ onSuccess, onCancel }: StudentBulkUploadProps) {
  const { enrollStudent, isLoading } = useStudentEnrollment()
  const { addNotification } = useNotifications()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<StudentUploadData[]>([])
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState<'upload' | 'validate' | 'process'>('upload')
  const [progress, setProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault() // Prevent any form submission
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ]

    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xls|xlsx|csv)$/i)) {
      addNotification({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please select a valid Excel (.xls, .xlsx) or CSV file.'
      })
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = (file: File) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        let data: any[] = []
        
        if (file.name.toLowerCase().endsWith('.csv')) {
          // Parse CSV
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              console.log('CSV parsing results:', results)
              data = results.data as any[]
              processParsedData(data)
            },
            error: (error) => {
              console.error('CSV parsing error:', error)
              addNotification({
                type: 'error',
                title: 'CSV parsing error',
                message: error.message
              })
            }
          })
        } else {
          // Parse Excel
          const workbook = XLSX.read(e.target?.result, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          data = XLSX.utils.sheet_to_json(worksheet)
          console.log('Excel parsing results:', data)
          processParsedData(data)
        }
      } catch (error) {
        console.error('File parsing error:', error)
        addNotification({
          type: 'error',
          title: 'File parsing error',
          message: 'Failed to parse the uploaded file.'
        })
      }
    }
    
    reader.readAsBinaryString(file)
  }

  const processParsedData = (data: any[]) => {
    console.log('Processing data:', data)
    const processedData: StudentUploadData[] = []
    const errors: ValidationError[] = []

    // Filter out empty rows
    const validRows = data.filter(row => {
      return Object.values(row).some(value => value && value.toString().trim() !== '')
    })

    console.log('Valid rows after filtering:', validRows)

    validRows.forEach((row, index) => {
      const processedRow: any = {}
      
      // Map column headers to our expected field names
      Object.keys(row).forEach(key => {
        const mappedField = FIELD_MAPPING[key as keyof typeof FIELD_MAPPING]
        if (mappedField) {
          processedRow[mappedField] = row[key]
        }
      })

      console.log('Processed row:', processedRow)

      // Validate required fields
      REQUIRED_FIELDS.forEach(field => {
        if (!processedRow[field] || processedRow[field].toString().trim() === '') {
          errors.push({
            row: index + 1,
            field,
            message: `${field} is required`
          })
        }
      })

      // Validate specific fields only if they exist
      if (processedRow.email && !isValidEmail(processedRow.email)) {
        errors.push({
          row: index + 1,
          field: 'email',
          message: 'Invalid email format'
        })
      }

      if (processedRow.subsystem && !['english', 'french'].includes(processedRow.subsystem.toLowerCase())) {
        errors.push({
          row: index + 1,
          field: 'subsystem',
          message: 'Subsystem must be "english" or "french"'
        })
      }

      if (processedRow.branch && !['grammar', 'technical', 'commercial'].includes(processedRow.branch.toLowerCase())) {
        errors.push({
          row: index + 1,
          field: 'branch',
          message: 'Branch must be "grammar", "technical", or "commercial"'
        })
      }

      if (processedRow.gender && !['male', 'female'].includes(processedRow.gender.toLowerCase())) {
        errors.push({
          row: index + 1,
          field: 'gender',
          message: 'Gender must be "male" or "female"'
        })
      }

      if (processedRow.relationship && !['father', 'mother', 'guardian', 'other'].includes(processedRow.relationship.toLowerCase())) {
        errors.push({
          row: index + 1,
          field: 'relationship',
          message: 'Relationship must be "father", "mother", "guardian", or "other"'
        })
      }

      // Normalize data
      processedRow.subsystem = processedRow.subsystem?.toLowerCase()
      processedRow.branch = processedRow.branch?.toLowerCase()
      processedRow.gender = processedRow.gender?.toLowerCase()
      processedRow.relationship = processedRow.relationship?.toLowerCase()

      processedData.push(processedRow as StudentUploadData)
    })

    console.log('Final processed data:', processedData)
    console.log('Validation errors:', errors)

    setParsedData(processedData)
    setValidationErrors(errors)
    setCurrentStep('validate')
  }

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleUpload = async () => {
    if (validationErrors.length > 0) {
      addNotification({
        type: 'error',
        title: 'Validation errors found',
        message: `Please fix ${validationErrors.length} validation errors before proceeding.`
      })
      return
    }

    setIsProcessing(true)
    setCurrentStep('process')
    setProgress(0)
    const results: UploadResult[] = []

    for (let i = 0; i < parsedData.length; i++) {
      const studentData = parsedData[i]
      
      try {
        // Add default values for required boolean fields
        const enrollmentData = {
          ...studentData,
          birthCertificate: false,
          previousTranscript: false,
          medicalCertificate: false,
          passportPhoto: false
        }

        console.log('Enrolling student:', enrollmentData)
        const result = await enrollStudent(enrollmentData)
        results.push(result)
        
        if (result.success) {
          addNotification({
            type: 'success',
            title: 'Student enrolled successfully',
            message: `Student ${studentData.firstName} ${studentData.lastName} enrolled with ID: ${result.studentId}`
          })
        } else {
          addNotification({
            type: 'error',
            title: 'Enrollment failed',
            message: `Failed to enroll ${studentData.firstName} ${studentData.lastName}: ${result.error}`
          })
        }
      } catch (error) {
        console.error('Enrollment error:', error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      setProgress(((i + 1) / parsedData.length) * 100)
    }

    setUploadResults(results)
    setIsProcessing(false)

    const successCount = results.filter(r => r.success).length
    if (successCount > 0) {
      addNotification({
        type: 'success',
        title: 'Bulk upload completed',
        message: `Successfully enrolled ${successCount} out of ${parsedData.length} students.`
      })
      onSuccess?.()
    }
  }

  const resetUpload = () => {
    setFile(null)
    setParsedData([])
    setValidationErrors([])
    setUploadResults([])
    setCurrentStep('upload')
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const downloadTemplate = () => {
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Middle Name': 'Michael',
        'Date of Birth': '2008-05-15',
        'Gender': 'male',
        'Place of Birth': 'Yaounde',
        'Nationality': 'Cameroonian',
        'Religion': 'Christian',
        'Email': 'john.doe@example.com',
        'Phone': '+237612345678',
        'Address': '123 Main Street',
        'City': 'Yaounde',
        'Region': 'Centre',
        'Subsystem': 'english',
        'Branch': 'grammar',
        'Class': 'Form 1',
        'Previous School': 'Primary School',
        'Previous Class': 'Class 6',
        'Parent Name': 'Jane Doe',
        'Parent Email': 'jane.doe@example.com',
        'Parent Phone': '+237612345679',
        'Parent Address': '123 Main Street',
        'Parent Occupation': 'Teacher',
        'Relationship': 'mother',
        'Emergency Contact Name': 'John Doe Sr',
        'Emergency Contact Phone': '+237612345680',
        'Emergency Contact Relationship': 'father',
        'Medical Conditions': 'None',
        'Allergies': 'None',
        'Blood Group': 'O+'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Student Template')
    XLSX.writeFile(wb, 'student_upload_template.xlsx')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Student Upload</h2>
          <p className="text-muted-foreground">
            Upload Excel or CSV files to enroll multiple students at once
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          {currentStep !== 'upload' && (
            <Button variant="outline" onClick={resetUpload}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      <Tabs value={currentStep} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" disabled={currentStep === 'process'}>Upload File</TabsTrigger>
          <TabsTrigger value="validate" disabled={currentStep === 'process'}>Validate Data</TabsTrigger>
          <TabsTrigger value="process" disabled={currentStep === 'upload'}>Process Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Student File</CardTitle>
              <CardDescription>
                Select an Excel (.xls, .xlsx) or CSV file containing student information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    {file ? (
                      <>
                        <div className="flex items-center space-x-2">
                          {file.name.toLowerCase().endsWith('.csv') ? (
                            <FileText className="h-8 w-8 text-blue-500" />
                          ) : (
                            <FileSpreadsheet className="h-8 w-8 text-green-500" />
                          )}
                          <span className="font-medium">{file.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-muted-foreground" />
                        <div>
                          <p className="text-lg font-medium">Drop your file here</p>
                          <p className="text-sm text-muted-foreground">
                            or click to browse
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    onChange={handleFileSelect}
                    className="mt-4"
                    onClick={(e) => e.preventDefault()} // Prevent any form submission
                  />
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>File Requirements:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>File must be in Excel (.xls, .xlsx) or CSV format</li>
                      <li>First row should contain column headers</li>
                      <li>Required fields: First Name, Last Name, Date of Birth, Gender, Email, etc.</li>
                      <li>Download the template for the correct column format</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Validation</CardTitle>
              <CardDescription>
                Review and validate the parsed data before uploading
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Parsed Records: {parsedData.length}</p>
                    <p className="text-sm text-muted-foreground">
                      {validationErrors.length} validation errors found
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPreview(true)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview Data
                    </Button>
                    {validationErrors.length === 0 && (
                      <Button onClick={handleUpload} disabled={isLoading}>
                        Proceed with Upload
                      </Button>
                    )}
                  </div>
                </div>

                {validationErrors.length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Validation Errors Found:</strong>
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        {validationErrors.map((error, index) => (
                          <div key={index} className="text-sm">
                            Row {error.row}: {error.field} - {error.message}
                          </div>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Upload</CardTitle>
              <CardDescription>
                Enrolling students in the system...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>

                {!isProcessing && uploadResults.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Upload Results</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {uploadResults.filter(r => r.success).length}
                        </div>
                        <div className="text-sm text-green-600">Successful</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">
                          {uploadResults.filter(r => !r.success).length}
                        </div>
                        <div className="text-sm text-red-600">Failed</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {uploadResults.length}
                        </div>
                        <div className="text-sm text-blue-600">Total</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Data Preview</DialogTitle>
            <DialogDescription>
              Preview of the first 10 records from your uploaded file
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedData.slice(0, 10).map((student, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {student.firstName} {student.lastName}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell>
                      {validationErrors.some(e => e.row === index + 1) ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : (
                        <Badge variant="default">Valid</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug Information */}
      <UploadDebugInfo 
        parsedData={parsedData}
        validationErrors={validationErrors}
        uploadResults={uploadResults}
      />
    </div>
  )
}
