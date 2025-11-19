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
import { cn } from "@/lib/utils"

const paymentPlanSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  numberOfInstallments: z.number().min(1, "At least 1 installment required").max(12, "Maximum 12 installments"),
  startDate: z.date(),
  notes: z.string().optional(),
})

type PaymentPlanFormData = z.infer<typeof paymentPlanSchema>

interface PaymentPlanFormProps {
  onSuccess: (planId: string) => void
  onCancel: () => void
  editData?: any
}

export function PaymentPlanForm({ onSuccess, onCancel, editData }: PaymentPlanFormProps) {
  const { createPaymentPlan, updatePaymentPlan, isLoading } = useFinancial()
  const { students } = useStudentManagement()
  const { success: toastSuccess, error: toastError } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const form = useForm<PaymentPlanFormData>({
    resolver: zodResolver(paymentPlanSchema),
    defaultValues: editData
      ? {
          studentId: editData.studentId,
          totalAmount: editData.totalAmount,
          numberOfInstallments: editData.numberOfInstallments || 1,
          startDate: new Date(editData.startDate),
          notes: editData.notes,
        }
      : {
          studentId: "",
          totalAmount: 0,
          numberOfInstallments: 1,
          startDate: new Date(),
          notes: "",
        },
  })

  const filteredStudents = students.filter((student) =>
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  useEffect(() => {
    const studentId = form.watch("studentId")
    if (studentId) {
      const student = students.find(s => s.id === studentId)
      if (student) {
        setSelectedStudent(student)
      }
    }
  }, [form.watch("studentId"), students])

  const onSubmit = async (data: PaymentPlanFormData) => {
    if (isLoading) return

    try {
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString().split('T')[0],
        studentName: students.find(s => s.id === data.studentId)?.first_name + ' ' + students.find(s => s.id === data.studentId)?.last_name || 'Unknown Student',
        status: 'active' as 'active' | 'completed' | 'defaulted',
        amountPaid: 0,
        installments: Array.from({ length: data.numberOfInstallments }, (_, i) => {
          const installmentAmount = Math.round(data.totalAmount / data.numberOfInstallments * 100) / 100;
          const dueDate = new Date(data.startDate);
          dueDate.setMonth(dueDate.getMonth() + i);
          
          return {
            id: `inst-${Date.now()}-${i}`,
            amount: installmentAmount,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'pending' as 'pending' | 'paid' | 'overdue'
          };
        })
      }

      if (editData) {
        const result = await updatePaymentPlan(editData.id, formattedData)
        if (result.success) {
          onSuccess(editData.id)
          toastSuccess("Payment plan updated successfully!")
        } else {
          toastError("Failed to update payment plan")
        }
      } else {
        const result = await createPaymentPlan(formattedData)
        if (result.success && result.planId) {
          onSuccess(result.planId)
          toastSuccess("Payment plan created successfully!")
        } else {
          toastError("Failed to create payment plan")
        }
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toastError("An unexpected error occurred")
    }
  }

  const totalAmount = form.watch("totalAmount")
  const numberOfInstallments = form.watch("numberOfInstallments")
  const installmentAmount = Math.floor(totalAmount / numberOfInstallments)
  const remainder = totalAmount % numberOfInstallments

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Selection</CardTitle>
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
                            {student.first_name} {student.last_name} - {student.student_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  name="numberOfInstallments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Installments</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="12"
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
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

              {totalAmount > 0 && numberOfInstallments > 0 && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Payment Plan Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <p className="font-medium">{totalAmount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Number of Installments:</span>
                      <p className="font-medium">{numberOfInstallments}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Per Installment:</span>
                      <p className="font-medium">{installmentAmount.toLocaleString()} FCFA</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remainder:</span>
                      <p className="font-medium">{remainder} FCFA</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this payment plan..." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editData ? "Update Payment Plan" : "Create Payment Plan"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
