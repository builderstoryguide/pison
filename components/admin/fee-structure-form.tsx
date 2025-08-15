"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useFinancial, type FeeStructure } from "@/lib/financial-context"
import { cn } from "@/lib/utils"

const feeStructureSchema = z.object({
  name: z.string().min(1, "Fee structure name is required"),
  subsystem: z.enum(["english", "french"]),
  level: z.string().min(1, "Level is required"),
  branch: z.enum(["grammar", "technical", "commercial"]),
  amount: z.number().min(1, "Amount must be greater than 0"),
  dueDate: z.date(),
  term: z.enum(["first", "second", "third"]),
  academicYear: z.string().min(1, "Academic year is required"),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

type FeeStructureFormData = z.infer<typeof feeStructureSchema>

interface FeeStructureFormProps {
  onSuccess: (feeStructureId: string) => void
  onCancel: () => void
  editData?: FeeStructure
}

const englishLevels = [
  { value: "form-1", label: "Form 1" },
  { value: "form-2", label: "Form 2" },
  { value: "form-3", label: "Form 3" },
  { value: "form-4", label: "Form 4" },
  { value: "form-5", label: "Form 5" },
  { value: "lower-6", label: "Lower 6" },
  { value: "upper-6", label: "Upper 6" },
]

const frenchLevels = [
  { value: "6eme", label: "6ème" },
  { value: "5eme", label: "5ème" },
  { value: "4eme", label: "4ème" },
  { value: "3eme", label: "3ème" },
  { value: "seconde", label: "Seconde" },
  { value: "premiere", label: "Première" },
  { value: "terminale", label: "Terminale" },
]

const academicYears = ["2023-2024", "2024-2025", "2025-2026"]

export function FeeStructureForm({ onSuccess, onCancel, editData }: FeeStructureFormProps) {
  const { createFeeStructure, updateFeeStructure, isLoading } = useFinancial()
  const [selectedSubsystem, setSelectedSubsystem] = useState<"english" | "french">(editData?.subsystem || "english")

  const form = useForm<FeeStructureFormData>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: editData
      ? {
          name: editData.name,
          subsystem: editData.subsystem,
          level: editData.level,
          branch: editData.branch,
          amount: editData.amount,
          dueDate: new Date(editData.dueDate),
          term: editData.term,
          academicYear: editData.academicYear,
          description: editData.description,
          isActive: editData.isActive,
        }
      : {
          name: "",
          subsystem: "english",
          level: "",
          branch: "grammar",
          amount: 0,
          dueDate: new Date(),
          term: "first",
          academicYear: "2024-2025",
          description: "",
          isActive: true,
        },
  })

  const onSubmit = async (data: FeeStructureFormData) => {
    try {
      const formattedData = {
        ...data,
        dueDate: format(data.dueDate, "yyyy-MM-dd"),
      }

      if (editData) {
        await updateFeeStructure(editData.id, formattedData)
        onSuccess(editData.id)
      } else {
        const feeStructureId = await createFeeStructure(formattedData)
        onSuccess(feeStructureId)
      }
    } catch (error) {
      console.error("Error saving fee structure:", error)
    }
  }

  const levels = selectedSubsystem === "english" ? englishLevels : frenchLevels

  return (
    <div className="max-w-4xl mx-auto">
      <DialogHeader>
        <DialogTitle>{editData ? "Edit Fee Structure" : "Create New Fee Structure"}</DialogTitle>
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
                        <Input placeholder="e.g., First Term Fees - Form 5 Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level/Class</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (FCFA)</FormLabel>
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
