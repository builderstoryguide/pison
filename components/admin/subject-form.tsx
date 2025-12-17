"use client"

import React, { useState, useEffect } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { Subject, SubBranch, SubjectGrouping, SUBJECT_GROUPINGS } from '@/lib/subject-management-context'

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100, 'Subject name must be less than 100 characters'),
  code: z.string().max(50, 'Code must be less than 50 characters').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().or(z.literal('')),
  subject_groupings: z.array(z.enum(['languages', 'related_trade_subjects', 'trade_subjects', 'others'])).default([]),
  has_sub_branches: z.boolean().default(false),
  coefficient: z.number().positive('Coefficient must be positive').default(1.0).optional(),
  is_active: z.boolean().default(true),
})

const subBranchSchema = z.object({
  name: z.string().min(1, 'Sub-branch name is required').max(100, 'Sub-branch name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional().or(z.literal('')),
  is_active: z.boolean().default(true),
})

interface SubjectFormProps {
  subject?: Subject
  onSuccess: (
    subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'>,
    subBranches?: Omit<SubBranch, 'id' | 'subject_id' | 'created_at' | 'updated_at'>[]
  ) => void
  onCancel: () => void
}

export function SubjectForm({ subject, onSuccess, onCancel }: SubjectFormProps) {
  const { error: toastError } = useToast()
  const [subBranches, setSubBranches] = useState<Array<{
    name: string
    description?: string
    is_active: boolean
  }>>([])

  const form = useForm<z.infer<typeof subjectSchema>>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: subject?.name || '',
      code: subject?.code || '',
      description: subject?.description || '',
      subject_groupings: subject?.subject_groupings || [],
      has_sub_branches: subject?.has_sub_branches || false,
      coefficient: subject?.coefficient || 1.0,
      is_active: subject?.is_active !== false,
    },
  })

  const hasSubBranches = form.watch('has_sub_branches')

  // Initialize sub-branches when editing
  useEffect(() => {
    if (subject && subject.has_sub_branches && subject.sub_branches) {
      setSubBranches(
        subject.sub_branches.map((sb) => ({
          name: sb.name,
          description: sb.description || '',
          is_active: sb.is_active,
        }))
      )
    }
  }, [subject])

  const addSubBranch = () => {
    setSubBranches([
      ...subBranches,
      {
        name: '',
        description: '',
        is_active: true,
      },
    ])
  }

  const removeSubBranch = (index: number) => {
    setSubBranches(subBranches.filter((_, i) => i !== index))
  }

  const updateSubBranch = (index: number, field: string, value: any) => {
    const updated = [...subBranches]
    updated[index] = { ...updated[index], [field]: value }
    setSubBranches(updated)
  }

  const validateSubBranches = (): boolean => {
    if (!hasSubBranches) {
      return true
    }

    if (subBranches.length === 0) {
      toastError('Validation Error', 'At least one sub-branch is required when "Has Sub-Branches" is enabled.')
      return false
    }

    // Check for empty names
    const emptyNames = subBranches.some((sb) => !sb.name.trim())
    if (emptyNames) {
      toastError('Validation Error', 'All sub-branches must have a name.')
      return false
    }

    // Check for duplicate names
    const names = subBranches.map((sb) => sb.name.toLowerCase().trim())
    const uniqueNames = new Set(names)
    if (uniqueNames.size !== names.length) {
      toastError('Validation Error', 'Sub-branch names must be unique within a subject.')
      return false
    }

    return true
  }

  const onSubmit = (data: z.infer<typeof subjectSchema>) => {
    if (!validateSubBranches()) {
      return
    }

    const subjectData: Omit<Subject, 'id' | 'created_at' | 'updated_at'> = {
      name: data.name.trim(),
      code: data.code?.trim() || undefined,
      description: data.description?.trim() || undefined,
      subject_groupings: data.subject_groupings || [],
      has_sub_branches: data.has_sub_branches,
      coefficient: data.coefficient || 1.0,
      is_active: data.is_active,
    }

    const subBranchesData = hasSubBranches && subBranches.length > 0
      ? subBranches.map((sb) => ({
          name: sb.name.trim(),
          description: sb.description?.trim() || undefined,
          is_active: sb.is_active,
        }))
      : undefined

    onSuccess(subjectData, subBranchesData)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mathematics" {...field} />
                </FormControl>
                <FormDescription>
                  The name of the subject as it will appear in the system
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., MATH" {...field} />
                </FormControl>
                <FormDescription>
                  Optional short code for the subject
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subject_groupings"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel className="text-base">Subject Groupings</FormLabel>
                  <FormDescription>
                    Select one or more groupings that apply to this subject. You can select multiple groupings.
                  </FormDescription>
                </div>
                <div className="space-y-3">
                  {(Object.keys(SUBJECT_GROUPINGS) as SubjectGrouping[]).map((grouping) => (
                    <FormField
                      key={grouping}
                      control={form.control}
                      name="subject_groupings"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={grouping}
                            className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(grouping)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, grouping])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== grouping
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {SUBJECT_GROUPINGS[grouping]}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="has_sub_branches"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Has Sub-Branches</FormLabel>
                    <FormDescription>
                      Enable if this subject has sub-branches (e.g., Mathematics with Pure Math, Mechanics, Statistics)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        // Clear coefficient when enabling sub-branches
                        if (checked) {
                          form.setValue('coefficient', undefined)
                        } else {
                          // Set default coefficient when disabling sub-branches
                          form.setValue('coefficient', 1.0)
                        }
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Coefficient field - shown for all subjects */}
          <FormField
            control={form.control}
            name="coefficient"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coefficient *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="1.0"
                    value={field.value || 1.0}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 1.0
                      field.onChange(value)
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {hasSubBranches 
                    ? "The weight/coefficient for this subject when calculating grades. Applied after aggregating sub-branch marks."
                    : "The weight/coefficient for this subject when calculating grades. Must be a positive number."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center space-x-2">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 flex-1">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Whether this subject is currently active in the system
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Sub-Branches Section */}
        {hasSubBranches && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sub-Branches</CardTitle>
                  <CardDescription>
                    Add sub-branches for this subject. The subject coefficient will be applied after aggregating marks from all sub-branches.
                  </CardDescription>
                </div>
                <Button type="button" onClick={addSubBranch} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sub-Branch
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {subBranches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sub-branches added yet.</p>
                  <p className="text-sm">Click "Add Sub-Branch" to add one.</p>
                </div>
              ) : (
                subBranches.map((sb, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <h4 className="font-medium">Sub-Branch {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubBranch(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`sb-name-${index}`}>Name *</Label>
                          <Input
                            id={`sb-name-${index}`}
                            placeholder="e.g., Pure Math"
                            value={sb.name}
                            onChange={(e) => updateSubBranch(index, 'name', e.target.value)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`sb-active-${index}`}
                            checked={sb.is_active}
                            onCheckedChange={(checked) =>
                              updateSubBranch(index, 'is_active', checked)
                            }
                          />
                          <Label htmlFor={`sb-active-${index}`}>Active</Label>
                        </div>
                        <div>
                          <Label htmlFor={`sb-description-${index}`}>Description</Label>
                          <Textarea
                            id={`sb-description-${index}`}
                            placeholder="Optional description..."
                            className="resize-none"
                            rows={2}
                            value={sb.description || ''}
                            onChange={(e) => updateSubBranch(index, 'description', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {subject ? 'Update Subject' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

