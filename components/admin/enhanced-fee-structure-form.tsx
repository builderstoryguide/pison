"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarIcon, Plus, Trash2, Check, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Schema for the enhanced fee structure form
const enhancedFeeStructureSchema = z.object({
  name: z.string().min(1, "Fee structure name is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  term: z.enum(["first", "second", "third"]),
  dueDate: z.date(),
  totalAmount: z.number().min(1, "Total amount must be greater than 0"),
  numberOfInstallments: z.number().min(1, "Number of installments must be at least 1").max(12, "Maximum 12 installments"),
  selectedClasses: z.array(z.string()).min(1, "At least one class must be selected"),
  description: z.string().optional(),
  isActive: z.boolean(),
})

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

interface Installment {
  installmentNumber: number
  amount: number
  dueDate: Date
}

interface EnhancedFeeStructureFormProps {
  onSuccess: (feeStructureId: string) => void
  onCancel: () => void
  editData?: any
}

const academicYears = ["2023-2024", "2024-2025", "2025-2026"]

export function EnhancedFeeStructureForm({ onSuccess, onCancel, editData }: EnhancedFeeStructureFormProps) {
  const { toast } = useToast()
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(true)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [showInstallmentPreview, setShowInstallmentPreview] = useState(false)

  const form = useForm<EnhancedFeeStructureFormData>({
    resolver: zodResolver(enhancedFeeStructureSchema),
    defaultValues: editData
      ? {
          name: editData.name,
          academicYear: editData.academicYear,
          term: editData.term,
          dueDate: new Date(editData.dueDate),
          totalAmount: editData.totalAmount,
          numberOfInstallments: editData.numberOfInstallments || 1,
          selectedClasses: editData.selectedClasses || [],
          description: editData.description,
          isActive: editData.isActive,
        }
      : {
          name: "",
          academicYear: "2024-2025",
          term: "first",
          dueDate: new Date(),
          totalAmount: 0,
          numberOfInstallments: 1,
          selectedClasses: [],
          description: "",
          isActive: true,
        },
  })

  // Load classes from the database
  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes')
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      } else {
        // Fallback to mock data if API fails
        setClasses([
          {
            id: "cls1",
            name: "Form 1A",
            level: "Form 1",
            subsystem: "english",
            branch: "grammar",
            academicYear: "2024-2025",
            status: "active"
          },
          {
            id: "cls2",
            name: "Form 2B",
            level: "Form 2",
            subsystem: "english",
            branch: "technical",
            academicYear: "2024-2025",
            status: "active"
          },
          {
            id: "cls3",
            name: "Terminale C",
            level: "Terminale",
            subsystem: "french",
            branch: "grammar",
            academicYear: "2024-2025",
            status: "active"
          }
        ])
      }
    } catch (error) {
      console.error("Error loading classes:", error)
      toast({
        title: "Error",
        description: "Failed to load classes. Using sample data.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingClasses(false)
    }
  }

  // Calculate installments when total amount or number of installments changes
  useEffect(() => {
    const totalAmount = form.watch("totalAmount")
    const numberOfInstallments = form.watch("numberOfInstallments")
    const dueDate = form.watch("dueDate")

    if (totalAmount > 0 && numberOfInstallments > 0 && dueDate) {
      calculateInstallments(totalAmount, numberOfInstallments, dueDate)
    }
  }, [form.watch("totalAmount"), form.watch("numberOfInstallments"), form.watch("dueDate")])

  const calculateInstallments = (totalAmount: number, numberOfInstallments: number, startDate: Date) => {
    const installmentAmount = Math.ceil(totalAmount / numberOfInstallments)
    const lastInstallmentAmount = totalAmount - (installmentAmount * (numberOfInstallments - 1))

    const newInstallments: Installment[] = []
    
    for (let i = 0; i < numberOfInstallments; i++) {
      const installmentDate = addMonths(startDate, i)
      const amount = i === numberOfInstallments - 1 ? lastInstallmentAmount : installmentAmount
      
      newInstallments.push({
        installmentNumber: i + 1,
        amount,
        dueDate: installmentDate
      })
    }

    setInstallments(newInstallments)
  }

  const onSubmit = async (data: EnhancedFeeStructureFormData) => {
    try {
      // Create fee structure for each selected class
      const promises = data.selectedClasses.map(async (classId) => {
        const classData = classes.find(c => c.id === classId)
        if (!classData) return null

        const feeStructureData = {
          name: `${data.name} - ${classData.name}`,
          classId,
          subsystem: classData.subsystem,
          branch: classData.branch,
          academicYear: data.academicYear,
          term: data.term,
          dueDate: format(data.dueDate, "yyyy-MM-dd"),
          totalAmount: data.totalAmount,
          numberOfInstallments: data.numberOfInstallments,
          installments: installments.map(inst => ({
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: format(inst.dueDate, "yyyy-MM-dd")
          })),
          description: data.description,
          isActive: data.isActive
        }

        const response = await fetch('/api/bursar/fee-structures', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feeStructureData),
        })

        if (!response.ok) {
          throw new Error(`Failed to create fee structure for ${classData.name}`)
        }

        return await response.json()
      })

      const results = await Promise.all(promises)
      const successfulResults = results.filter(result => result !== null)

      if (successfulResults.length > 0) {
        toast({
          title: "Success",
          description: `Created fee structures for ${successfulResults.length} class(es)`,
        })
        onSuccess(successfulResults[0].feeStructureId)
      } else {
        throw new Error("Failed to create any fee structures")
      }
    } catch (error) {
      console.error("Error creating fee structures:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create fee structures",
        variant: "destructive"
      })
    }
  }

  const selectedClasses = form.watch("selectedClasses")
  const totalAmount = form.watch("totalAmount")
  const numberOfInstallments = form.watch("numberOfInstallments")

  const filteredClasses = classes.filter(cls => cls.status === "active")

  return (
    <div className="max-w-6xl mx-auto">
      <DialogHeader>
        <DialogTitle>{editData ? "Edit Fee Structure" : "Create Enhanced Fee Structure"}</DialogTitle>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid gap-6 md:grid-cols-2">
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
                        <Input placeholder="e.g., First Term Fees 2024-2025" {...field} />
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
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
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

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>First Payment Due Date</FormLabel>
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

                {/* Installment Preview */}
                {installments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel>Installment Preview</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInstallmentPreview(!showInstallmentPreview)}
                      >
                        {showInstallmentPreview ? "Hide" : "Show"} Details
                      </Button>
                    </div>
                    
                    {showInstallmentPreview && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {installments.map((installment) => (
                          <div key={installment.installmentNumber} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="text-sm font-medium">
                              Installment {installment.installmentNumber}
                            </span>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {installment.amount.toLocaleString()} FCFA
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Due: {format(installment.dueDate, "MMM dd, yyyy")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                <div className="text-center py-4">Loading classes...</div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center space-x-2">
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
                      />
                      <label
                        htmlFor={cls.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div className="flex items-center justify-between">
                          <span>{cls.name}</span>
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs">
                              {cls.subsystem}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {cls.branch}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {cls.level} • {cls.academicYear}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage />
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional details about this fee structure..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                      {totalAmount.toLocaleString()} FCFA
                    </div>
                    <div className="text-sm text-muted-foreground">Total Amount</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {numberOfInstallments}
                    </div>
                    <div className="text-sm text-muted-foreground">Installments</div>
                  </div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  This will create {selectedClasses.length} fee structure(s) with {numberOfInstallments} installment(s) each.
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
