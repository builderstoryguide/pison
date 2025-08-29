"use client"

import { useState, useEffect } from 'react'
import { CalendarIcon } from 'lucide-react'
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { cn } from '@/lib/utils'

import { useUserManagement, User } from '@/lib/user-management-context'

const rolePermissions = {
  admin: ['all'],
  teacher: ['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents'],
  student: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers'],
  parent: ['view_child_progress', 'communicate_teachers', 'view_financial_records'],
  bursar: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
}

const FormSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(['admin', 'teacher', 'student', 'parent', 'bursar']),
  status: z.enum(['active', 'inactive', 'suspended']),
  studentId: z.string().optional(),
  teacherRegNo: z.string().optional(),
  parentCode: z.string().optional(),
  subsystem: z.enum(['english', 'french']).optional(),
  branch: z.enum(['grammar', 'technical', 'commercial']).optional(),
  class: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(['male', 'female']).optional(),
  permissions: z.array(z.string()).default([])
})

interface EditUserFormProps {
  user: User
  onSuccess: () => void
}

export function EditUserForm({ user, onSuccess }: EditUserFormProps) {
  const { updateUser, isLoading, error } = useUserManagement()

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      studentId: user.studentId || '',
      teacherRegNo: user.teacherRegNo || '',
      parentCode: user.parentCode || '',
      subsystem: user.subsystem || 'english',
      branch: user.branch,
      class: user.class || '',
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      gender: user.gender,
      permissions: user.permissions
    }
  })

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const userData = {
      ...data,
      dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, "yyyy-MM-dd") : undefined
    }
    
    const success = await updateUser(user.id, userData)
    if (success) {
      onSuccess()
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value as 'male' | 'female' }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
        </div>

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Role-specific Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Role Information</h3>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select 
            value={formData.role} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
                              <SelectItem value="bursar">Bursar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Role-specific fields */}
        {formData.role === 'student' && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
            <Select 
              value={formData.branch || 'none'} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value === 'none' ? undefined : value as 'grammar' | 'technical' | 'commercial' }))}
            >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  <SelectItem value="grammar">Grammar</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {formData.role === 'teacher' && (
          <div className="space-y-2">
            <Label htmlFor="teacherRegNo">Teacher Registration Number</Label>
            <Input
              id="teacherRegNo"
              type="text"
              value={formData.teacherRegNo}
              onChange={(e) => setFormData(prev => ({ ...prev, teacherRegNo: e.target.value }))}
            />
          </div>
        )}

        {formData.role === 'parent' && (
          <div className="space-y-2">
            <Label htmlFor="parentCode">Parent Access Code</Label>
            <Input
              id="parentCode"
              type="text"
              value={formData.parentCode}
              onChange={(e) => setFormData(prev => ({ ...prev, parentCode: e.target.value }))}
            />
          </div>
        )}

        {/* Subsystem Selection */}
        {(formData.role === 'student' || formData.role === 'teacher') && (
          <div className="space-y-2">
            <Label htmlFor="subsystem">Educational Sub-system</Label>
            <Select 
              value={formData.subsystem} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, subsystem: value as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English Sub-system</SelectItem>
                <SelectItem value="french">French Sub-system</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="status">Account Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Permissions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Permissions</h3>
        <div className="space-y-2">
          {rolePermissions[formData.role]?.map((permission) => (
            <div key={permission} className="flex items-center space-x-2">
              <Checkbox
                id={permission}
                checked={formData.permissions.includes(permission)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFormData(prev => ({
                      ...prev,
                      permissions: [...prev.permissions, permission]
                    }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      permissions: prev.permissions.filter(p => p !== permission)
                    }))
                  }
                }}
              />
              <Label htmlFor={permission} className="text-sm capitalize">
                {permission.replace(/_/g, ' ')}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update User'}
        </Button>
      </div>
        </form>
      </Form>
  )
}
