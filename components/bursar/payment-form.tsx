"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"

const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentFeeId: z.string().min(1, "Student fee assignment is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  paymentDate: z.date(),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.enum(["first", "second", "third"]),
  description: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface Student {
  id: string
  first_name: string
  last_name: string
  student_id: string
  class?: string // class ID
  class_name?: string
}

interface StudentFee {
  id: string
  studentId: string
  studentName: string
  studentNumber: string
  feeStructureId: string
  feeStructureName: string
  academicYear: string
  term: string
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  status: string
  className?: string
}

interface FeeStructure {
  id: string
  class_id: string
  name: string
  academic_year: string
  term: string
}

interface PaymentMethod {
  id: string
  name: string
  code: string
}

interface PaymentFormProps {
  onSuccess: (paymentId: string) => void
  onCancel: () => void
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const { success: toastSuccess, error: toastError } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const [students, setStudents] = useState<Student[]>([])
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [selectedStudentClassId, setSelectedStudentClassId] = useState<string>("")
  const [availableStudentFees, setAvailableStudentFees] = useState<StudentFee[]>([])
  const [feeStructuresForClass, setFeeStructuresForClass] = useState<FeeStructure[]>([])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setIsLoadingData(true)
      
      // Load students
      const studentsResponse = await fetch("/api/students")
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json()
        setStudents(studentsData)
      }

      // Load payment methods
      const methodsResponse = await fetch("/api/bursar/payment-methods?isActive=true")
      if (methodsResponse.ok) {
        const methodsData = await methodsResponse.json()
        setPaymentMethods(methodsData)
      }
    } catch (error) {
      console.error("Error loading initial data:", error)
      toastError("Failed to load form data")
    } finally {
      setIsLoadingData(false)
    }
  }

  // Load student fees and fee structures when student is selected
  useEffect(() => {
    if (selectedStudentId && selectedStudentClassId) {
      loadStudentFeesAndFeeStructures(selectedStudentId, selectedStudentClassId)
    } else {
      setAvailableStudentFees([])
      setFeeStructuresForClass([])
    }
  }, [selectedStudentId, selectedStudentClassId])

  const loadStudentFeesAndFeeStructures = async (studentId: string, classId: string) => {
    try {
      // Validate studentId
      if (!studentId) {
        console.error("No student ID provided")
        setAvailableStudentFees([])
        return
      }

      console.log("Loading student fees for student:", studentId, "class:", classId)
      
      // Load student fees for this student
      let feesResponse: Response
      try {
        feesResponse = await fetch(`/api/bursar/student-fees?studentId=${studentId}`)
      } catch (fetchError) {
        // Network error or fetch failed
        console.error("Network error fetching student fees:", fetchError)
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`)
      }
      
      if (!feesResponse.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${feesResponse.status}: ${feesResponse.statusText}`
        let errorDetails: any = null
        try {
          const errorData = await feesResponse.json()
          // Handle new API response format: { success: false, error: "...", details: "..." }
          if (errorData.success === false) {
            errorMessage = errorData.error || errorMessage
            errorDetails = errorData.details || errorData.code
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch (parseError) {
          // Response is not JSON, use status text
          console.warn("Could not parse error response as JSON:", parseError)
        }
        // Log error details (use console.warn to avoid triggering error boundaries)
        console.warn("Error loading student fees:", {
          status: feesResponse.status,
          statusText: feesResponse.statusText,
          studentId,
          errorMessage,
          errorDetails,
          url: feesResponse.url
        })
        throw new Error(errorMessage)
      }
      
      let feesData: any
      try {
        const responseData = await feesResponse.json()
        // Handle new API response format: { success: true, data: [...] }
        feesData = responseData.success ? responseData.data : responseData
      } catch (parseError) {
        console.warn("Failed to parse student fees response as JSON:", parseError)
        throw new Error("Invalid response format from server")
      }
      
      console.log("Student fees loaded:", feesData?.length || 0, "records")
      setStudentFees(feesData || [])

      // If no class ID, show all student fees (fallback behavior)
      if (!classId) {
        console.warn("No class ID for student, showing all student fees")
        setAvailableStudentFees(feesData || [])
        setFeeStructuresForClass([])
        return
      }

      // Load fee structures assigned to this class
      let feeStructuresResponse: Response
      try {
        feeStructuresResponse = await fetch(`/api/bursar/fee-structures?classId=${classId}&isActive=true`)
      } catch (fetchError) {
        // Network error, but continue with all student fees as fallback
        console.warn("Network error fetching fee structures, showing all student fees:", fetchError)
        setAvailableStudentFees(feesData || [])
        setFeeStructuresForClass([])
        return
      }
      
      if (!feeStructuresResponse.ok) {
        // If fee structures can't be loaded, show all student fees as fallback
        let errorMessage = `HTTP ${feeStructuresResponse.status}: ${feeStructuresResponse.statusText}`
        try {
          const errorData = await feeStructuresResponse.json()
          // Handle new API response format: { success: false, error: "..." }
          if (errorData.success === false) {
            errorMessage = errorData.error || errorMessage
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } catch {
          // Response is not JSON, use status text
        }
        console.warn("Failed to load fee structures for class, showing all student fees:", {
          status: feeStructuresResponse.status,
          classId,
          errorMessage
        })
        setAvailableStudentFees(feesData || [])
        setFeeStructuresForClass([])
        return
      }
      
      let feeStructuresData: any
      try {
        const responseData = await feeStructuresResponse.json()
        // Handle new API response format: { success: true, data: [...] }
        feeStructuresData = responseData.success ? responseData.data : responseData
      } catch (parseError) {
        console.warn("Failed to parse fee structures response, showing all student fees:", parseError)
        setAvailableStudentFees(feesData || [])
        setFeeStructuresForClass([])
        return
      }
      
      console.log("Fee structures loaded for class:", feeStructuresData?.length || 0, "records")
      setFeeStructuresForClass(feeStructuresData || [])

      // Filter student fees to only show those where the fee structure is assigned to the student's class
      const classFeeStructureIds = new Set((feeStructuresData || []).map((fs: FeeStructure) => fs.id))
      const filteredFees = (feesData || []).filter((fee: StudentFee) => 
        classFeeStructureIds.has(fee.feeStructureId)
      )
      console.log("Filtered student fees:", filteredFees.length, "records match class fee structures")
      setAvailableStudentFees(filteredFees)
    } catch (error) {
      // Extract error details manually to avoid serialization issues
      const errorType = error?.constructor?.name || typeof error
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      
      // Log error details separately
      // Use console.warn instead of console.error to avoid triggering Next.js error boundaries
      console.warn("Error loading student fees and fee structures:", {
        errorType,
        errorMessage,
        studentId,
        classId,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      })
      
      const userMessage = errorMessage || "Failed to load fee assignments. Please try again or contact support."
      
      toastError(userMessage)
      setAvailableStudentFees([])
      setFeeStructuresForClass([])
    }
  }

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      studentId: "",
      studentFeeId: "",
      amount: 0,
      paymentMethodId: "",
      paymentDate: new Date(),
      academicYear: globalAcademicYear,
      term: "first",
      description: "",
    },
  })

  // Update academic year when global academic year changes
  useEffect(() => {
    form.setValue("academicYear", globalAcademicYear)
  }, [globalAcademicYear, form])

  // Auto-select fee assignment when available student fees are loaded
  useEffect(() => {
    if (availableStudentFees.length > 0 && selectedStudentId) {
      const currentFeeId = form.getValues("studentFeeId")
      // Only auto-select if no fee is currently selected
      if (!currentFeeId || !availableStudentFees.find(fee => fee.id === currentFeeId)) {
        // Automatically select the first available fee assignment
        const firstFee = availableStudentFees[0]
        if (firstFee) {
          form.setValue("studentFeeId", firstFee.id)
          // Always use the global academic year from app configuration
          form.setValue("academicYear", globalAcademicYear)
          form.setValue("term", firstFee.term as "first" | "second" | "third")
          form.setValue("amount", firstFee.balanceAmount)
        }
      }
    }
  }, [availableStudentFees, selectedStudentId, globalAcademicYear, form])

  const onSubmit = async (data: PaymentFormData) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/bursar/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: data.studentId,
          studentFeeId: data.studentFeeId,
          amount: data.amount,
          paymentMethodId: data.paymentMethodId,
          paymentDate: format(data.paymentDate, "yyyy-MM-dd"),
          academicYear: data.academicYear,
          term: data.term,
          description: data.description,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toastSuccess(`Payment recorded successfully. Receipt: ${result.receiptNumber}`)
        onSuccess(result.paymentId)
      } else {
        toastError(result.error || "Failed to record payment")
      }
    } catch (error) {
      console.error("Error recording payment:", error)
      toastError("Failed to record payment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setSelectedStudentId(studentId)
      setSelectedStudentClassId(student.class || "")
      form.setValue("studentId", studentId)
      form.setValue("studentFeeId", "")
      form.setValue("academicYear", globalAcademicYear)
      form.setValue("amount", 0)
    }
  }

  const handleStudentFeeSelect = (studentFeeId: string) => {
    const studentFee = availableStudentFees.find((fee) => fee.id === studentFeeId)
    if (studentFee) {
      form.setValue("studentFeeId", studentFeeId)
      // Always use the global academic year from app configuration
      form.setValue("academicYear", globalAcademicYear)
      form.setValue("term", studentFee.term as "first" | "second" | "third")
      form.setValue("amount", studentFee.balanceAmount)
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
              <CardDescription>Select the student making the payment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select onValueChange={handleStudentSelect} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.first_name} {student.last_name} - {student.student_id}
                            {student.class_name && ` (${student.class_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentFeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Assignment</FormLabel>
                    <Select 
                      onValueChange={handleStudentFeeSelect} 
                      defaultValue={field.value}
                      disabled={!selectedStudentId || availableStudentFees.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={selectedStudentId ? "Select fee assignment" : "Select student first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStudentFees.map((fee) => (
                          <SelectItem key={fee.id} value={fee.id}>
                            {fee.feeStructureName} - Balance: {fee.balanceAmount.toLocaleString()} FCFA
                            {fee.status !== "paid" && ` (${fee.status})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedStudentId && availableStudentFees.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No fee assignments found for this student
                      </p>
                    )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Enter payment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        className="w-full"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Payment Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024-2025" className="w-full" {...field} readOnly />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select term" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="first">First Term</SelectItem>
                          <SelectItem value="second">Second Term</SelectItem>
                          <SelectItem value="third">Third Term</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tuition fee payment" className="w-full" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

