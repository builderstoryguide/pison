"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Search } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useFinancial } from "@/lib/financial-context"
import { useStudentManagement } from "@/lib/student-management-context"
import { cn, getStudentClassName } from "@/lib/utils"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

const studentFeeAssignmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.enum(["first", "second", "third"]),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  dueDate: z.date(),
  notes: z.string().optional(),
})

type StudentFeeAssignmentFormData = z.infer<typeof studentFeeAssignmentSchema>

interface StudentFeeAssignmentFormProps {
  onSuccess: (assignmentId: string) => void
  onCancel: () => void
  editData?: any
}

const academicYears = ["2023-2024", "2024-2025", "2025-2026"]

export function StudentFeeAssignmentForm({ onSuccess, onCancel, editData }: StudentFeeAssignmentFormProps) {
  const { createStudentFeeAssignment, updateStudentFeeAssignment, isLoading } = useFinancial()
  const { students } = useStudentManagement()
  const { feeStructures } = useFinancial()
  const { toast } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<any>(null)

  const form = useForm<StudentFeeAssignmentFormData>({
    resolver: zodResolver(studentFeeAssignmentSchema),
    defaultValues: editData
      ? {
          studentId: editData.studentId,
          feeStructureId: editData.feeStructureId,
          academicYear: globalAcademicYear, // Use global academic year
          term: editData.term,
          totalAmount: editData.totalAmount,
          dueDate: new Date(editData.dueDate),
          notes: editData.notes,
        }
      : {
          studentId: "",
          feeStructureId: "",
          academicYear: globalAcademicYear, // Use global academic year
          term: "first",
          totalAmount: 0,
          dueDate: new Date(),
          notes: "",
        },
  })

  // Sync form with global academic year
  useEffect(() => {
    form.setValue("academicYear", globalAcademicYear)
  }, [globalAcademicYear, form])

  // Filter students based on search term
  const filteredStudents = students.filter((student) =>
    (student.first_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (student.last_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (student.student_id?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  )

  // Update total amount when fee structure changes
  useEffect(() => {
    const feeStructureId = form.watch("feeStructureId")
    if (feeStructureId) {
      const feeStructure = feeStructures.find(fs => fs.id === feeStructureId)
      if (feeStructure) {
        form.setValue("totalAmount", feeStructure.amount)
        setSelectedFeeStructure(feeStructure)
      }
    }
  }, [form.watch("feeStructureId"), feeStructures, form])

  // Update student info when student changes
  useEffect(() => {
    const studentId = form.watch("studentId")
    if (studentId) {
      const student = students.find(s => s.id === studentId)
      if (student) {
        setSelectedStudent(student)
      }
    }
  }, [form.watch("studentId"), students])

  const onSubmit = async (data: StudentFeeAssignmentFormData) => {
    if (isLoading) return

    try {
      const formattedData = {
        ...data,
        dueDate: data.dueDate.toISOString().split('T')[0],
        studentName: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : "",
        feeStructureName: selectedFeeStructure ? selectedFeeStructure.name : "",
        amountPaid: 0,
        balance: data.totalAmount,
        status: "pending" as const,
      }

      if (editData) {
        const result = await updateStudentFeeAssignment(editData.id, formattedData)
        if (result.success) {
          onSuccess(editData.id)
          toast.success("Fee assignment updated successfully!")
        } else {
          console.error("Error updating fee assignment:", result.error)
          toast.error("Failed to update fee assignment", {
            description: result.error || "An error occurred while updating the fee assignment."
          })
        }
      } else {
        const result = await createStudentFeeAssignment(formattedData)
        if (result.success && result.assignmentId) {
          onSuccess(result.assignmentId)
          toast.success("Fee assigned to student successfully!")
        } else {
          console.error("Error creating fee assignment:", result.error)
          toast.error("Failed to assign fee to student", {
            description: result.error || "An error occurred while assigning the fee."
          })
        }
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Student Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Student Selection</CardTitle>
              <CardDescription>Select the student to assign fees to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <FormLabel>Search Students</FormLabel>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Student</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredStudents.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {student.first_name} {student.last_name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ID: {student.student_id} • Class: {getStudentClassName(student) || 'Not Assigned'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedStudent && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Selected Student</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedStudent.first_name} {selectedStudent.last_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Student ID:</span>
                      <p className="font-medium">{selectedStudent.student_id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Class:</span>
                      <p className="font-medium">{selectedStudent.class}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subsystem:</span>
                      <p className="font-medium capitalize">{selectedStudent.subsystem}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Structure Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
              <CardDescription>Select the fee structure to assign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="feeStructureId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Structure</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a fee structure" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {feeStructures.map((feeStructure) => (
                          <SelectItem key={feeStructure.id} value={feeStructure.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{feeStructure.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {feeStructure.amount.toLocaleString()} FCFA • {feeStructure.subsystem} • {feeStructure.branch}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedFeeStructure && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Selected Fee Structure</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedFeeStructure.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Amount:</span>
                      <p className="font-medium">{selectedFeeStructure.amount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Subsystem:</span>
                      <p className="font-medium capitalize">{selectedFeeStructure.subsystem}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Branch:</span>
                      <p className="font-medium capitalize">{selectedFeeStructure.branch}</p>
                    </div>
                    {selectedFeeStructure.classNames && selectedFeeStructure.classNames.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Applicable Classes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedFeeStructure.classNames.map((className: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {className}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
              <CardDescription>Configure the fee assignment parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Academic Year
                        <span className="text-xs text-muted-foreground font-normal">(Global Setting)</span>
                      </FormLabel>
                      <FormControl>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || globalAcademicYear}
                          disabled={true}
                        >
                          <SelectTrigger className="bg-muted">
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={field.value || globalAcademicYear}>
                              {field.value || globalAcademicYear}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <Alert className="mt-2 py-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Academic Year is managed globally in App Configuration. To change it, go to Settings → App Configuration → System Settings.
                        </AlertDescription>
                      </Alert>
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
                          <SelectTrigger>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="75000"
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
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
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
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this fee assignment..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editData ? "Update Assignment" : "Assign Fee to Student"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
