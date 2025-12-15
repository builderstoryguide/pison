"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, addMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { useGlobalAcademicYear, useCurrencyFormatter } from "@/lib/app-configuration-context-v2"
import { apiPost } from "@/lib/api-utils"

// Schema for the enhanced fee structure form
const enhancedFeeStructureSchema = z.object({
  name: z.string().min(1, "Fee structure name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.enum(["all", "first", "second", "third"]),
  dueDate: z.date(),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  firstInstallmentAmount: z.number().min(1, "First installment amount must be greater than 0"),
  secondInstallmentAmount: z.number().min(1, "Second installment amount must be greater than 0"),
  selectedClasses: z.array(z.string()).min(1, "At least one class must be selected"),
  description: z.string().optional(),
  isActive: z.boolean(),
}).refine(data => data.firstInstallmentAmount + data.secondInstallmentAmount === data.totalAmount, {
  message: "The sum of the installments must be equal to the total amount",
  path: ["firstInstallmentAmount"],
});
type EnhancedFeeStructureFormData = z.infer<typeof enhancedFeeStructureSchema>

interface Class {
  id: string
  name: string
  level: string
  subsystem: "english" | "french"
  branch: "grammar" | "technical" | "commercial"
  academicYear: string
  status: "active" | "inactive"
}



interface FeeStructureEditData {
  id?: string
  name: string
  academicYear: string
  term: "all" | "first" | "second" | "third"
  dueDate: string | Date
  totalAmount: number
  firstInstallmentAmount?: number
  secondInstallmentAmount?: number
  selectedClasses?: string[]
  description?: string
  isActive: boolean
}

interface EnhancedFeeStructureFormProps {
  onSuccess: (feeStructureId: string) => void
  onCancel: () => void
  editData?: Partial<FeeStructureEditData>
}

export function EnhancedFeeStructureForm({ onSuccess, onCancel, editData }: EnhancedFeeStructureFormProps) {
  const { success: toastSuccess, error: toastError } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)

  const form = useForm<EnhancedFeeStructureFormData>({
    resolver: zodResolver(enhancedFeeStructureSchema),
    defaultValues: editData
        ? {
          name: editData.name,
          academicYear: globalAcademicYear, // Use global academic year
          term: editData.term,
          dueDate: editData.dueDate ? new Date(editData.dueDate) : new Date(),
          totalAmount: editData.totalAmount,
          firstInstallmentAmount: editData.firstInstallmentAmount || 0,
          secondInstallmentAmount: editData.secondInstallmentAmount || 0,
          selectedClasses: editData.selectedClasses || [],
          description: editData.description || "",
          isActive: editData.isActive,
        }
      : {
          name: "",
          academicYear: globalAcademicYear, // Use global academic year
          term: "first",
          dueDate: new Date(),
          totalAmount: 0,
          firstInstallmentAmount: 0,
          secondInstallmentAmount: 0,
          selectedClasses: [],
          description: "",
          isActive: true,
        },
  })

  // Load classes from the database
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch('/api/classes?status=active')
        if (response.ok) {
          const data = await response.json()
          // Ensure we only use active classes
          const activeClasses = Array.isArray(data) ? data.filter((cls: Class) => cls.status === "active") : []
          setClasses(activeClasses)
        } else {
          // Don't use mock data in production - show error state instead
          setClasses([])
          toastError("Error loading classes", {
            description: "Could not fetch classes from the server. Please try again."
          })
        }      } catch (_error) {
        toastError("Error loading classes", {
          description: "Failed to load classes. Using sample data."
        })
      } finally {
        setIsLoadingClasses(false)
      }
    }

    loadClasses()
  }, [globalAcademicYear, toastError])



  const onSubmit = async (data: EnhancedFeeStructureFormData) => {
    try {
      // Create fee structure for each selected class
      const promises = data.selectedClasses.map(async (classId) => {
        const classData = classes.find(c => c.id === classId)
        if (!classData) return null

        // Ensure level is provided - use class's level if not specified
        const levelToUse = classData.level
        if (!levelToUse) {
          throw new Error(`Class "${classData.name}" does not have a level assigned. Please assign a level to this class first.`)
        }

        const feeStructureData = {
          name: `${data.name} - ${classData.name}`,
          classId,
          subsystem: classData.subsystem,
          branch: classData.branch,
          level: levelToUse, // Include level field - required by database
          academicYear: data.academicYear,
          term: data.term,
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
          totalAmount: data.totalAmount,
          numberOfInstallments: 2, // Hardcoded to 2 as per new requirements
          installments: [
            {
              installmentNumber: 1,
              amount: data.firstInstallmentAmount,
              dueDate: format(data.dueDate, "yyyy-MM-dd"),
            },
            {
              installmentNumber: 2,
              amount: data.secondInstallmentAmount,
              dueDate: format(addMonths(data.dueDate, 1), "yyyy-MM-dd"),
            }
          ],
          description: data.description,
          isActive: data.isActive
        }

        const result = await apiPost('/api/bursar/fee-structures', feeStructureData)

        if (!result.success) {
          // Handle specific authentication/authorization errors
          if (result.status === 401) {
            throw new Error("You are not authorized. Please log in again.")
          } else if (result.status === 403) {
            throw new Error("You don't have permission to create fee structures. Admin or Bursar role required.")
          } else {
            const errorMessage = result.error || result.data?.error || `Failed to create fee structure for ${classData.name}`
            throw new Error(errorMessage)
          }
        }

        return result.data
      })

      const results = await Promise.all(promises)
      const successfulResults = results.filter(result => result !== null)

      if (successfulResults.length > 0) {
        toastSuccess("Fee structures created", {
          description: `Successfully created fee structures for ${successfulResults.length} class(es)`
        })
        onSuccess(successfulResults[0].feeStructureId)
      } else {
        throw new Error("Failed to create any fee structures")
      }
    } catch (error) {
      toastError("Error creating fee structures", {
        description: error instanceof Error ? error.message : "Failed to create fee structures"
      })
    }
  }

  const selectedClasses = form.watch("selectedClasses")
  const totalAmount = form.watch("totalAmount")


  const filteredClasses = classes.filter(cls => cls.status === "active")

  return (
    <div className="max-w-6xl mx-auto">


      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the fee structure details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Structure Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Tuition Fee, Exam Fee"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectTrigger className="bg-muted w-full">
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={field.value || globalAcademicYear}>
                              {field.value || globalAcademicYear}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Set amount and payment terms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount ({getCurrencySymbol()})</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstInstallmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Installment ({getCurrencySymbol()})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="37500"
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
                    name="secondInstallmentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Second Installment ({getCurrencySymbol()})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="37500"
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
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <div className="text-sm text-muted-foreground">Enable this fee structure for student billing</div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Class Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Class Selection</CardTitle>
              <CardDescription>Select the classes this fee structure applies to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingClasses ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading classes...
                </div>
              ) : filteredClasses.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground p-4 border rounded-md">
                    {classes.length === 0 
                      ? "No classes found. Please create classes in Class Management first."
                      : `No active classes found. Found ${classes.length} total class(es), but none are active. Please activate classes in Class Management.`}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground">
                    Showing {filteredClasses.length} active class(es)
                  </div>
                  <div className="grid gap-3 md:grid-cols-1">
                    {filteredClasses.map((cls) => (
                      <div 
                        key={cls.id} 
                        className="flex items-start space-x-3 p-3 rounded-lg border transition-colors hover:bg-accent/50"
                      >
                        <Checkbox
                          id={cls.id}
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              form.setValue("selectedClasses", [...selectedClasses, cls.id])
                            } else {
                              form.setValue("selectedClasses", selectedClasses.filter(id => id !== cls.id))
                            }
                          }}
                          className="mt-1"
                        />
                        <label
                          htmlFor={cls.id}
                          className="flex-1 cursor-pointer space-y-1.5"
                        >
                          <div className="font-medium text-sm">
                            {cls.name}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs font-normal">
                              {cls.subsystem === "english" ? "English" : "French"}
                            </Badge>
                            <Badge variant="secondary" className="text-xs font-normal capitalize">
                              {cls.branch}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              {cls.level}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-normal">
                              {cls.academicYear}
                            </Badge>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FormMessage />
            </CardContent>
          </Card>



          {/* Summary */}
          {selectedClasses.length > 0 && totalAmount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {selectedClasses.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Classes Selected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totalAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      2
                    </div>
                    <div className="text-sm text-muted-foreground">Installments</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  This will create {selectedClasses.length} fee structure(s) with 2 installment(s) each.
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingClasses}>
              {editData ? "Update Fee Structure" : "Create Fee Structures"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
