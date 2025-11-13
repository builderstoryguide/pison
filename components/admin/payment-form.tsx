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
import { useFinancial, type Payment } from "@/lib/financial-context"
import { useStudentManagement } from "@/lib/student-management-context"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { cn } from "@/lib/utils"

const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  studentName: z.string().min(1, "Student name is required"),
  feeStructureId: z.string().min(1, "Fee structure is required"),
  feeName: z.string().min(1, "Fee name is required"),
  amount: z.number().min(1, "Total amount must be greater than 0"),
  amountPaid: z.number().min(1, "Amount paid must be greater than 0"),
  paymentDate: z.date(),
  paymentMethod: z.enum(["cash", "bank_transfer", "mobile_money", "cheque"]),
  paidBy: z.string().min(1, "Payer name is required"),
  notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentSchema>

interface PaymentFormProps {
  onSuccess: (paymentId: string) => void
  onCancel: () => void
  editData?: Payment
}

export function PaymentForm({ onSuccess, onCancel, editData }: PaymentFormProps) {
  const { recordPayment, updatePayment, feeStructures, isLoading } = useFinancial()
  const { students, loadStudents } = useStudentManagement()
  const globalAcademicYear = useGlobalAcademicYear()
  const [selectedStudent, setSelectedStudent] = useState<string>(editData?.studentId || "")
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<string>(editData?.feeStructureId || "")

  // Load students when component mounts
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: editData
      ? {
          studentId: editData.studentId,
          studentName: editData.studentName,
          feeStructureId: editData.feeStructureId,
          feeName: editData.feeName,
          amount: editData.amount,
          amountPaid: editData.amountPaid,
          paymentDate: new Date(editData.paymentDate),
          paymentMethod: editData.paymentMethod,
          paidBy: editData.paidBy,
          notes: editData.notes,
        }
      : {
          studentId: "",
          studentName: "",
          feeStructureId: "",
          feeName: "",
          amount: 0,
          amountPaid: 0,
          paymentDate: new Date(),
          paymentMethod: "cash",
          paidBy: "",
          notes: "",
        },
  })

  const onSubmit = async (data: PaymentFormData) => {
    try {
      const balance = data.amount - data.amountPaid
      const status = balance === 0 ? "completed" : balance > 0 ? "partial" : "completed"

      const paymentData = {
        ...data,
        balance,
        status: status as "pending" | "partial" | "completed" | "overdue",
        paymentDate: format(data.paymentDate, "yyyy-MM-dd"),
        term: "first" as const, // This should be determined from fee structure
        academicYear: globalAcademicYear, // Use global academic year
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`, // Generate a receipt number
      }

      if (editData) {
        await updatePayment(editData.id, paymentData)
        onSuccess(editData.id)
      } else {
        const result = await recordPayment(paymentData)
        if (result.success && result.paymentId) {
          onSuccess(result.paymentId)
        } else {
          console.error("Failed to record payment:", result.error)
        }
      }
    } catch (error) {
      console.error("Error saving payment:", error)
    }
  }

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (student) {
      setSelectedStudent(studentId)
      form.setValue("studentId", studentId)
      form.setValue("studentName", `${student.first_name} ${student.last_name}`)
    }
  }

  const handleFeeStructureSelect = (feeStructureId: string) => {
    const feeStructure = feeStructures.find((f) => f.id === feeStructureId)
    if (feeStructure) {
      setSelectedFeeStructure(feeStructureId)
      form.setValue("feeStructureId", feeStructureId)
      form.setValue("feeName", feeStructure.name)
      form.setValue("amount", feeStructure.amount)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
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
                              {student.first_name} {student.last_name} - {(student as any).class_name || student.class}
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
                  name="paidBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paid By</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Parent - John Doe" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Fee Information */}
            <Card>
              <CardHeader>
                <CardTitle>Fee Information</CardTitle>
                <CardDescription>Select the fee being paid</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="feeStructureId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Structure</FormLabel>
                      <Select onValueChange={handleFeeStructureSelect} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select fee structure" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feeStructures.map((fee) => (
                            <SelectItem key={fee.id} value={fee.id}>
                              {fee.name} - {fee.amount.toLocaleString()} FCFA
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Amount (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            readOnly
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
                    name="amountPaid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount Paid (FCFA)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="50000"
                            className="w-full"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mobile_money">Mobile Money</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <Textarea placeholder="Additional notes about this payment..." {...field} />
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
              {isLoading ? "Saving..." : editData ? "Update Payment" : "Record Payment"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
