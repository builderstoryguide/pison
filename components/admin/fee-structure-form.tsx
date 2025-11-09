"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon } from "lucide-react"
import { format, addMonths } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useFinancial, type FeeStructure } from "@/lib/financial-context"
import { useClassManagement } from "@/lib/class-management-context"
import { cn } from "@/lib/utils"
import { useLevels } from "@/hooks/use-levels"
import { useGlobalAcademicYear } from "@/lib/app-configuration-context-v2"
import { apiPost } from "@/lib/api-utils"

const feeStructureSchema = z.object({
  subsystem: z.enum(["english", "french"]),
  level: z.string().optional(),
  branch: z.enum(["grammar", "technical", "commercial"]),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  firstInstallmentAmount: z.number().min(1, "First installment amount must be greater than 0"),
  firstInstallmentDueDate: z.date(),
  secondInstallmentAmount: z.number().min(1, "Second installment amount must be greater than 0"),
  secondInstallmentDueDate: z.date(),
  thirdInstallmentAmount: z.number().min(1, "Third installment amount must be greater than 0"),
  thirdInstallmentDueDate: z.date(),
  term: z.enum(["all", "first", "second", "third"]),
  academicYear: z.string().min(1, "Academic year is required"),
  description: z.string().optional(),
  isActive: z.boolean(),
  classIds: z.array(z.string()).min(1, "At least one class must be selected"),
}).refine((data) => {
  const sum = data.firstInstallmentAmount + data.secondInstallmentAmount + data.thirdInstallmentAmount
  return Math.abs(sum - data.totalAmount) < 0.01 // Allow small floating point differences
}, {
  message: "Sum of installments must equal total amount",
  path: ["totalAmount"]
})

type FeeStructureFormData = z.infer<typeof feeStructureSchema>

interface FeeStructureFormProps {
  onSuccess: (feeStructureId: string) => void
  onCancel: () => void
  editData?: FeeStructure
}

const academicYears = ["2023-2024", "2024-2025", "2025-2026"]

// Enhanced normalization function for level comparison
const normalizeLevel = (level: string | null | undefined): string => {
  if (!level) return ""
  return level
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[\t\n\r]/g, '') // Remove tabs and newlines
}

export function FeeStructureForm({ onSuccess, onCancel, editData }: FeeStructureFormProps) {
  const { createFeeStructure, updateFeeStructure, isLoading } = useFinancial()
  const { classes, isLoading: isLoadingClasses } = useClassManagement()
  const { toast } = useToast()
  const globalAcademicYear = useGlobalAcademicYear()
  const [selectedSubsystem, setSelectedSubsystem] = useState<"english" | "french">(editData?.subsystem || "english")

  const form = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: editData
      ? {
          subsystem: editData.subsystem,
          level: editData.level,
          branch: editData.branch,
          totalAmount: editData.amount || 0,
          firstInstallmentAmount: 0,
          firstInstallmentDueDate: new Date(),
          secondInstallmentAmount: 0,
          secondInstallmentDueDate: addMonths(new Date(), 1),
          thirdInstallmentAmount: 0,
          thirdInstallmentDueDate: addMonths(new Date(), 2),
          term: editData.term,
          academicYear: globalAcademicYear, // Use global academic year
          description: editData.description,
          isActive: editData.isActive,
          classIds: editData.classIds || [],
        }
      : {
          subsystem: "english",
          level: "",
          branch: "grammar",
          totalAmount: 0,
          firstInstallmentAmount: 0,
          firstInstallmentDueDate: new Date(),
          secondInstallmentAmount: 0,
          secondInstallmentDueDate: addMonths(new Date(), 1),
          thirdInstallmentAmount: 0,
          thirdInstallmentDueDate: addMonths(new Date(), 2),
          term: "first",
          academicYear: globalAcademicYear, // Use global academic year
          description: "",
          isActive: true,
          classIds: [],
        },
  })

  // Sync form with global academic year
  useEffect(() => {
    form.setValue("academicYear", globalAcademicYear)
  }, [globalAcademicYear, form])

  const onSubmit = async (data: FeeStructureFormData) => {
    if (isLoading) return // Prevent multiple submissions
    
    // Convert sentinel value to undefined for form submission
    const formData = {
      ...data,
      level: data.level === "__ANY_LEVEL__" ? undefined : data.level
    }
    
    try {
      // Create installments array
      const installments = [
        {
          installmentNumber: 1,
          amount: formData.firstInstallmentAmount,
          dueDate: format(formData.firstInstallmentDueDate, "yyyy-MM-dd")
        },
        {
          installmentNumber: 2,
          amount: formData.secondInstallmentAmount,
          dueDate: format(formData.secondInstallmentDueDate, "yyyy-MM-dd")
        },
        {
          installmentNumber: 3,
          amount: formData.thirdInstallmentAmount,
          dueDate: format(formData.thirdInstallmentDueDate, "yyyy-MM-dd")
        }
      ]

      if (editData) {
        // For editing, we'll use the existing updateFeeStructure
        // This would need to be enhanced to support installments, but for now we'll update the basic structure
        const formattedData = {
          ...formData,
          amount: formData.totalAmount,
          dueDate: format(formData.firstInstallmentDueDate, "yyyy-MM-dd"),
          description: formData.description || "",
        }
        const result = await updateFeeStructure(editData.id, formattedData)
        if (result.success) {
          onSuccess(editData.id)
          toast.success("Fee structure updated successfully!")
        } else {
          console.error("Error updating fee structure:", result.error)
          toast.error("Failed to update fee structure", {
            description: result.error || "An error occurred while updating the fee structure."
          })
        }
      } else {
        // Determine which terms to create fee structures for
        const termsToCreate = formData.term === "all" 
          ? ["first", "second", "third"] 
          : [formData.term]

        // Create fee structure for each selected class and each term
        const promises = formData.classIds.flatMap((classId) => {
          const classData = classes.find(c => c.id === classId)
          if (!classData) return []

          return termsToCreate.map(async (term) => {
            // Generate fee structure name
            const termLabel = term === "first" ? "First Term" : term === "second" ? "Second Term" : "Third Term"
            const feeStructureName = `${termLabel} Fees - ${classData.name} - ${formData.academicYear}`

            // Use class's level if form level is not provided (when "Any Level" is selected)
            // The level is required by the database, so we get it from the class
            // formData.level will be undefined when "Any Level" is selected (see line 376)
            const levelToUse = formData.level || classData.level

            if (!levelToUse) {
              throw new Error(`Class "${classData.name}" does not have a level assigned. Please assign a level to this class first.`)
            }

            const feeStructureData = {
              name: feeStructureName,
              classId: classId,
              subsystem: formData.subsystem,
              branch: formData.branch,
              level: levelToUse, // Use class level if form level is not provided
              academicYear: formData.academicYear,
              term: term, // Use the specific term, not "all"
              dueDate: format(formData.firstInstallmentDueDate, "yyyy-MM-dd"),
              totalAmount: formData.totalAmount,
              numberOfInstallments: 3,
              installments: installments,
              description: formData.description || "",
              isActive: formData.isActive
            }

            const result = await apiPost('/api/bursar/fee-structures', feeStructureData)

            if (!result.success) {
              // Handle specific authentication/authorization errors
              if (result.status === 401) {
                throw new Error("You are not authorized. Please log in again.")
              } else if (result.status === 403) {
                throw new Error("You don't have permission to create fee structures. Admin or Bursar role required.")
              } else if (result.status === 409) {
                // Duplicate fee structure error
                const errorMessage = result.error || result.data?.error || `A fee structure already exists for ${classData.name} in ${formData.academicYear} - ${termLabel} term.`
                throw new Error(errorMessage)
              } else {
                // Use error message from response or provide fallback
                const errorMessage = result.error || result.data?.error || `Failed to create fee structure for ${classData.name} - ${termLabel}`
                throw new Error(errorMessage)
              }
            }

            return result.data
          })
        })

        const results = await Promise.all(promises)
        const successfulResults = results.filter(result => result !== null)

        if (successfulResults.length > 0) {
          const termCount = termsToCreate.length
          const classCount = formData.classIds.length
          const totalStructures = termCount * classCount
          
          toast.success("Fee structures created successfully!", {
            description: `Successfully created ${successfulResults.length} of ${totalStructures} fee structure(s) for ${classCount} class(es)`
          })
          onSuccess(successfulResults[0].feeStructureId || successfulResults[0].id)
        } else {
          throw new Error("Failed to create any fee structures")
        }
      }
    } catch (error) {
      console.error("Error saving fee structure:", error)
      toast.error("Failed to create fee structure", {
        description: error instanceof Error ? error.message : "An error occurred while creating the fee structure."
      })
    }
  }

  // Fetch levels based on selected subsystem and branch
  const selectedBranch = form.watch("branch")
  const { levels: fetchedLevels, isLoading: levelsLoading } = useLevels({
    subsystem: selectedSubsystem || null,
    branch: selectedBranch || null,
    enabled: !!selectedSubsystem && !!selectedBranch,
  })

  // Transform fetched levels to match the expected format
  const levels = fetchedLevels.map((level) => ({
    value: level.name,
    label: level.name,
  }))

  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Set up the fee structure details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="subsystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Educational Subsystem</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedSubsystem(value as "english" | "french")
                            form.setValue("level", "")
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subsystem" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="english">English Subsystem</SelectItem>
                            <SelectItem value="french">French Subsystem</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="grammar">Grammar</SelectItem>
                            <SelectItem value="technical">Technical</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
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
                            <SelectTrigger className="min-w-[140px] bg-muted">
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

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "__ANY_LEVEL__" ? undefined : value)} 
                            value={field.value || "__ANY_LEVEL__"}
                            disabled={levelsLoading || !selectedSubsystem || !selectedBranch}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={levelsLoading ? "Loading levels..." : "Select level (optional)"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__ANY_LEVEL__">Any Level</SelectItem>
                              {levels.length === 0 && !levelsLoading ? (
                                <SelectItem value="no-levels" disabled>
                                  {!selectedSubsystem || !selectedBranch 
                                    ? "Please select subsystem and branch first"
                                    : "No levels available. Create levels in Class Management first."}
                                </SelectItem>
                              ) : (
                                levels.map((level) => (
                                  <SelectItem key={level.value} value={level.value}>
                                    {level.label}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                              <SelectItem value="all">All terms</SelectItem>
                              <SelectItem value="first">First term</SelectItem>
                              <SelectItem value="second">Second term</SelectItem>
                              <SelectItem value="third">Third term</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Details</CardTitle>
                <CardDescription>Set total amount and payment installments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount (FCFA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="150000"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium">Installment Details</h4>
                  
                  {/* First Installment */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Installment</label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="firstInstallmentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (FCFA)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="firstInstallmentDueDate"
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
                  </div>

                  {/* Second Installment */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Second Installment</label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="secondInstallmentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (FCFA)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondInstallmentDueDate"
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
                  </div>

                  {/* Third Installment */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Third Installment</label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="thirdInstallmentAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount (FCFA)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="50000"
                                value={field.value ?? ""}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="thirdInstallmentDueDate"
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
                  </div>

                  {/* Summary */}
                  {(() => {
                    const totalAmount = form.watch("totalAmount") || 0
                    const firstAmount = form.watch("firstInstallmentAmount") || 0
                    const secondAmount = form.watch("secondInstallmentAmount") || 0
                    const thirdAmount = form.watch("thirdInstallmentAmount") || 0
                    const sum = firstAmount + secondAmount + thirdAmount
                    const difference = Math.abs(sum - totalAmount)
                    const isValid = difference < 0.01

                    return (
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Sum of Installments:</span>
                          <span className="font-medium">{sum.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-medium">{totalAmount.toLocaleString()} FCFA</span>
                        </div>
                        {totalAmount > 0 && !isValid && (
                          <div className="mt-2 text-sm text-amber-600">
                            Warning: Sum of installments ({sum.toLocaleString()} FCFA) does not match total amount ({totalAmount.toLocaleString()} FCFA)
                          </div>
                        )}
                        {totalAmount > 0 && isValid && (
                          <div className="mt-2 text-sm text-green-600">
                            ✓ Sum of installments matches total amount
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                <FormField
                  control={form.control}
                  name="classIds"
                  render={({ field }) => {
                    const selectedLevel = form.watch("level")
                    const selectedBranch = form.watch("branch")
                    
                    // Filter classes: only active classes, matching subsystem, and optionally level/branch
                    const activeClasses = classes.filter(cls => cls.status === "active")
                    
                    // Enhanced normalization for selected level
                    const normalizedSelectedLevel = selectedLevel && selectedLevel.trim() !== "" 
                      ? normalizeLevel(selectedLevel) 
                      : ""
                    
                    // Comprehensive debug logging when level is selected
                    if (process.env.NODE_ENV === 'development' && selectedLevel && selectedLevel.trim() !== "") {
                      const subsystemClasses = activeClasses.filter(cls => cls.subsystem === selectedSubsystem)
                      console.group('🔍 Level Filtering Debug')
                      console.log('Selected Level (raw):', selectedLevel)
                      console.log('Selected Level (normalized):', normalizedSelectedLevel)
                      console.log(`Active Classes in ${selectedSubsystem} subsystem:`, subsystemClasses.length)
                      subsystemClasses.forEach(cls => {
                        const normalized = normalizeLevel(cls.level)
                        const matches = normalized === normalizedSelectedLevel
                        console.log(`Class: "${cls.name}" | Level (raw): "${cls.level || '(null)'}" | Level (normalized): "${normalized}" | Matches: ${matches ? '✅' : '❌'}`)
                      })
                      console.groupEnd()
                    }
                    
                    const filteredClasses = activeClasses.filter(cls => {
                      const matchesSubsystem = cls.subsystem === selectedSubsystem
                      
                      // Level matching: if no level selected, show all classes; otherwise match exactly
                      let matchesLevel = true
                      if (selectedLevel && selectedLevel.trim() !== "") {
                        // Use enhanced normalization function
                        const normalizedClassLevel = normalizeLevel(cls.level)
                        matchesLevel = normalizedClassLevel === normalizedSelectedLevel
                      }
                      
                      // Branch matching: if no branch selected, show all classes; otherwise match exactly
                      let matchesBranch = true
                      if (selectedBranch && selectedBranch.trim() !== "") {
                        // Normalize branch comparison (case-insensitive, trimmed)
                        const normalizedSelectedBranch = selectedBranch.trim().toLowerCase()
                        const normalizedClassBranch = (cls.branch || "").trim().toLowerCase()
                        matchesBranch = normalizedClassBranch === normalizedSelectedBranch
                      }
                      
                      return matchesSubsystem && matchesLevel && matchesBranch
                    })

                    return (
                      <FormItem>
                        <FormLabel>Applicable Classes</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            {isLoadingClasses ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-md">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                Loading classes...
                              </div>
                            ) : activeClasses.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 border rounded-md">
                                No active classes found. Please create classes in Class Management first.
                              </p>
                            ) : filteredClasses.length === 0 ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground p-4 border rounded-md">
                                  No classes found matching the selected criteria (Subsystem: {selectedSubsystem}, Level: {selectedLevel || "Any"}, Branch: {selectedBranch || "Any"}).
                                </p>
                                {activeClasses.filter(cls => cls.subsystem === selectedSubsystem).length > 0 && (
                                  <div className="space-y-1">
                                    <p className="text-sm text-amber-600 p-2">
                                      Try adjusting the Level or Branch filters to see available classes.
                                    </p>
                                    <p className="text-xs text-muted-foreground p-2">
                                      Found {activeClasses.filter(cls => cls.subsystem === selectedSubsystem).length} active class(es) for {selectedSubsystem === "english" ? "English" : "French"} subsystem.
                                    </p>
                                    {selectedLevel && (
                                      <div className="text-xs text-muted-foreground p-2 border-t mt-2 space-y-2">
                                        <div>
                                          <p className="font-semibold mb-1">Diagnostic Information:</p>
                                          <p>Selected Level: <span className="font-mono bg-muted px-1 rounded">&quot;{selectedLevel}&quot;</span></p>
                                          <p>Normalized: <span className="font-mono bg-muted px-1 rounded">&quot;{normalizeLevel(selectedLevel)}&quot;</span></p>
                                        </div>
                                        
                                        <div>
                                          <p className="font-semibold mb-1">All Classes in {selectedSubsystem === "english" ? "English" : "French"} Subsystem:</p>
                                          <div className="max-h-40 overflow-y-auto border rounded p-2 bg-muted/50">
                                            {activeClasses
                                              .filter(cls => cls.subsystem === selectedSubsystem)
                                              .map((cls, idx) => {
                                                const normalized = normalizeLevel(cls.level)
                                                const matches = normalized === normalizeLevel(selectedLevel)
                                                return (
                                                  <div key={cls.id || idx} className="py-1 border-b last:border-b-0">
                                                    <div className="flex items-center gap-2">
                                                      <span className={matches ? "text-green-600" : "text-red-600"}>
                                                        {matches ? "✅" : "❌"}
                                                      </span>
                                                      <span className="font-medium">{cls.name}</span>
                                                    </div>
                                                    <div className="ml-6 text-xs">
                                                      <span>Level (raw): </span>
                                                      <span className="font-mono bg-background px-1 rounded">&quot;{cls.level || "(not set)"}&quot;</span>
                                                    </div>
                                                    <div className="ml-6 text-xs">
                                                      <span>Level (normalized): </span>
                                                      <span className="font-mono bg-background px-1 rounded">&quot;{normalized}&quot;</span>
                                                    </div>
                                                    {!matches && (
                                                      <div className="ml-6 text-xs text-amber-600 mt-1">
                                                        Expected: &quot;{normalizeLevel(selectedLevel)}&quot;
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <p className="font-semibold mb-1">Available Unique Levels:</p>
                                          <ul className="list-disc list-inside ml-2">
                                            {Array.from(new Set(activeClasses
                                              .filter(cls => cls.subsystem === selectedSubsystem)
                                              .map(cls => cls.level)
                                              .filter(level => level !== null && level !== undefined && level.trim() !== "")
                                            )).map((level, idx) => (
                                              <li key={idx} className="font-mono text-xs">
                                                &quot;{level}&quot; (normalized: &quot;{normalizeLevel(level)}&quot;)
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        
                                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                                          <p className="font-semibold text-amber-800 dark:text-amber-200 mb-1">💡 Tip:</p>
                                          <p className="text-xs text-amber-700 dark:text-amber-300">
                                            If classes don't match, ensure the class level in Class Management exactly matches the selected level name. 
                                            Check for case differences, extra spaces, or special characters.
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-xs text-muted-foreground mb-2">
                                  Showing {filteredClasses.length} of {activeClasses.filter(cls => cls.subsystem === selectedSubsystem).length} active class(es) matching your criteria
                                </div>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto border rounded-md p-4">
                                  {filteredClasses.map((cls) => (
                                    <div key={cls.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={cls.id}
                                        checked={field.value.includes(cls.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, cls.id])
                                          } else {
                                            field.onChange(field.value.filter((id: string) => id !== cls.id))
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={cls.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span>{cls.name}</span>
                                          <span className="text-xs text-muted-foreground ml-2">
                                            {cls.level} • {cls.branch}
                                          </span>
                                        </div>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : editData ? "Update Fee Structure" : "Create Fee Structure"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
