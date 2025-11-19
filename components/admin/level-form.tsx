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
import { useAuth } from "@/lib/auth-context"

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
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError } = useToast()
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
    if (!user) {
      toastError("Authentication Error", {
        description: "You must be logged in to create a level."
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/levels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create level'
        try {
          const errorData = await response.json()
          // Handle different error response formats
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error
          } else if (errorData.error && typeof errorData.error === 'object') {
            // serializeSupabaseError returns an object with a 'message' property
            errorMessage = errorData.error.message || 
                          errorData.error.error_description ||
                          errorData.error.error ||
                          JSON.stringify(errorData.error)
          } else if (errorData.message) {
            errorMessage = errorData.message
          }
        } catch (parseError) {
          // If JSON parsing fails, use status text
          errorMessage = response.statusText || 'Failed to create level'
        }
        // Don't throw, just show error toast
        toastError("Failed to create level", {
          description: errorMessage
        })
        return
      }

      const result = await response.json()
      
      toastSuccess("Level created successfully!", {
        description: `Level "${data.name}" has been created for ${data.subsystem} subsystem and ${data.branch} branch.`
      })
      
      form.reset()
      onSuccess()
    } catch (error) {
      // Only log unexpected errors (not API errors which are already handled)
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : "An error occurred while creating the level."
      
      // Only log if it's not an API error (API errors are handled above)
      if (!errorMessage.includes('Level already exists') && !errorMessage.includes('Failed to create level')) {
        console.error("Unexpected error creating level:", errorMessage, error)
      }
      
      toastError("Failed to create level", {
        description: errorMessage
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

