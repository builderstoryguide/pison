"use client"

import { useState } from 'react'
import { User, GraduationCap, Users, UserCheck, DollarSign } from 'lucide-react'
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

import { useUserManagement, User as UserType } from '@/lib/user-management-context'

const roleIcons = {
  admin: User,
  teacher: GraduationCap,
  student: Users,
  parent: UserCheck,
  bursar: DollarSign
}

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
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  studentId: z.string().optional(),
  teacherRegNo: z.string().optional(),
  parentCode: z.string().optional(),
  subsystem: z.enum(['english', 'french']).default('english'),
  branch: z.enum(['grammar', 'technical', 'commercial']).optional(),
  class: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date({
    required_error: "Date of birth is required.",
  }),
  gender: z.enum(['male', 'female'], {
    required_error: "Gender is required.",
  }),
  permissions: z.array(z.string()).default([])
})

interface CreateUserFormProps {
  onSuccess: () => void
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { createUser, isLoading, error } = useUserManagement()
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: undefined,
      status: 'active',
      studentId: '',
      teacherRegNo: '',
      parentCode: '',
      subsystem: 'english',
      branch: undefined,
      class: '',
      phone: '',
      address: '',
      dateOfBirth: undefined,
      gender: undefined,
      permissions: []
    }
  })

  const generateId = (role: string) => {
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    switch (role) {
      case 'student':
        return `STU${year}${random}`
      case 'teacher':
        return `TCH${year}${random}`
      case 'parent':
        return `PAR${year}${random}`
      default:
        return ''
    }
  }

  const handleRoleChange = (role: UserType['role']) => {
    // Auto-generate IDs
    if (role === 'student') {
      form.setValue('studentId', generateId('student'))
    } else if (role === 'teacher') {
      form.setValue('teacherRegNo', generateId('teacher'))
    } else if (role === 'parent') {
      form.setValue('parentCode', generateId('parent'))
    }
    
    // Set default permissions
    form.setValue('permissions', rolePermissions[role] || [])
  }

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const userData = {
      ...data,
      dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
      branch: data.branch || undefined
    }

    const result = await createUser(userData)
    if (result.success) {
      setGeneratedPassword(result.password || null)
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+237 6XX XXX XXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter full address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date of Birth *</FormLabel>
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

      {/* Role and System Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Role & System Information</h3>
        
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role *</FormLabel>
              <Select onValueChange={(value) => {
                field.onChange(value)
                handleRoleChange(value as UserType['role'])
              }} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(roleIcons).map(([key, Icon]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{key}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Role-specific fields */}
        {form.watch('role') === 'student' && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input type="text" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., Form 5A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
          </>
        )}

        {form.watch('role') === 'teacher' && (
          <FormField
            control={form.control}
            name="teacherRegNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teacher Registration Number</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {form.watch('role') === 'parent' && (
          <FormField
            control={form.control}
            name="parentCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Access Code</FormLabel>
                <FormControl>
                  <Input type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Subsystem Selection */}
        {(form.watch('role') === 'student' || form.watch('role') === 'teacher') && (
          <FormField
            control={form.control}
            name="subsystem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Educational Sub-system</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="english">English Sub-system</SelectItem>
                    <SelectItem value="french">French Sub-system</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Permissions */}
      {form.watch('role') && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Permissions</h3>
          <div className="space-y-2">
            {rolePermissions[form.watch('role')]?.map((permission) => (
              <div key={permission} className="flex items-center space-x-2">
                <Checkbox
                  id={permission}
                  checked={form.watch('permissions').includes(permission)}
                  onCheckedChange={(checked) => {
                    const currentPermissions = form.watch('permissions')
                    if (checked) {
                      form.setValue('permissions', [...currentPermissions, permission])
                    } else {
                      form.setValue('permissions', currentPermissions.filter(p => p !== permission))
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
      )}

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
        <Button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create User'}
        </Button>
      </div>
        </form>
      </Form>

    {/* Password Dialog */}
    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>User Created Successfully</DialogTitle>
          <DialogDescription>
            A new user account has been created with a default password. Please share this password with the user securely.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] pr-2 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generated-password">Default Password</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="generated-password"
                type="text"
                value={generatedPassword || ''}
                readOnly
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (generatedPassword) {
                    navigator.clipboard.writeText(generatedPassword)
                  }
                }}
              >
                Copy
              </Button>
            </div>
          </div>
          <Alert>
            <AlertDescription>
              <strong>Important:</strong> This password will expire in 30 days. The user should change their password upon first login.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button onClick={() => setShowPasswordDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
  )
}
