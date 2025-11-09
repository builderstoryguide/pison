"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const levelSchema = z.object({
  name: z.string().min(1, "Level name is required").max(100, "Level name must be less than 100 characters"),
  subsystem: z.enum(["english", "french"], {
    required_error: "Subsystem is required",
  }),
  branch: z.enum(["grammar", "technical", "commercial"], {
    required_error: "Branch is required",
  }),
})

type LevelFormData = z.infer<typeof levelSchema>

interface LevelFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function LevelForm({ onSuccess, onCancel }: LevelFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LevelFormData>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      name: "",
      subsystem: "english",
      branch: "grammar",
    },
  })

  const onSubmit = async (data: LevelFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create level')
      }

      const result = await response.json()
      
      toast.success("Level created successfully!", {
        description: `Level "${data.name}" has been created for ${data.subsystem} subsystem and ${data.branch} branch.`
      })
      
      form.reset()
      onSuccess()
    } catch (error) {
      console.error("Error creating level:", error)
      toast.error("Failed to create level", {
        description: error instanceof Error ? error.message : "An error occurred while creating the level."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Level</CardTitle>
              <CardDescription>Create a new level attached to a branch and subsystem</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Form 1, Form 2, 6ème, 5ème" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="subsystem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Educational Subsystem</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Level"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

