"use client"

import React, { useState } from 'react'
import { User, GraduationCap, Users, UserCheck, DollarSign } from 'lucide-react'
import { useUserManagement, User as UserType } from '@/lib/user-management-context'

// Local type to carry created-user credentials for the success dialog
type EmailData = {
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'bursar'
  password: string
  userId?: string
  className?: string
  parentName?: string
  parentEmail?: string
  parentCode?: string
  parentPassword?: string
}

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

import { StudentEnrollmentForm } from './student-enrollment-form'
import { TeacherEnrollmentForm } from './teacher-enrollment-form'
import { UserCreationSuccessDialog } from './user-creation-success-dialog'

const roleIcons = {
  admin: User,
  teacher: GraduationCap,
  student: Users,
  parent: UserCheck,
  bursar: DollarSign
}

interface CreateUserFormProps {
  onSuccess: () => void
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { createUser, error } = useUserManagement()
  
  const [selectedRole, setSelectedRole] = useState<UserType['role'] | ''>('')
  const [_generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(true)
  const [userData, setUserData] = useState<EmailData | null>(null)

  const handleRoleChange = (role: UserType['role']) => {
    setSelectedRole(role)
    setShowRoleSelection(false)
  }

  const handleBackToRoleSelection = () => {
    setSelectedRole('')
    setShowRoleSelection(true)
  }

  const handleStudentEnrollmentSuccess = async (result: { 
    studentId: string; 
    parentCode: string; 
    studentName: string;
    studentPassword?: string;
    parentPassword?: string;
    studentEmail?: string;
    parentEmail?: string;
    parentName?: string;
    className?: string;
  }) => {
    // Create user account for the student
    const userData = {
      name: result.studentName,
      email: result.studentEmail || '',
      role: 'student' as const,
      status: 'active' as const,
      studentId: result.studentId,
      subsystem: 'english' as const,
      phone: '',
      address: '',
      dateOfBirth: new Date().toISOString().split('T')[0],
      gender: 'male' as const,
      permissions: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']
    }

    const userResult = await createUser(userData)
    if (userResult.success) {
      console.log('Student enrollment success:', { userResult, result })
      setGeneratedPassword(userResult.password || null)
      setUserData({
        name: result.studentName,
        email: result.studentEmail || '',
        role: 'student',
        password: userResult.password || '',
        userId: userResult.roleSpecificId || result.studentId, // Use role-specific ID from API
        className: result.className,
        parentName: result.parentName,
        parentEmail: result.parentEmail,
        parentCode: result.parentCode,
        parentPassword: result.parentPassword
      })
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  const handleTeacherEnrollmentSuccess = async (result: { teacherId: string; teacherData: any }) => {
    // Create user account for the teacher
    const userData = {
      name: `${result.teacherData.firstName} ${result.teacherData.lastName}`,
      email: result.teacherData.email,
      role: 'teacher' as const,
      status: 'active' as const,
      teacherRegNo: result.teacherId,
      subsystem: result.teacherData.subsystem,
      phone: result.teacherData.phone,
      address: result.teacherData.address,
      dateOfBirth: result.teacherData.dateOfBirth,
      gender: result.teacherData.gender as 'male' | 'female',
      permissions: ['manage_classes', 'grade_students', 'communicate_parents']
    }

    const userResult = await createUser(userData)
    if (userResult.success) {
      console.log('Teacher enrollment success:', { userResult, result })
      setGeneratedPassword(userResult.password || null)
      setUserData({
        name: `${result.teacherData.firstName} ${result.teacherData.lastName}`,
        email: result.teacherData.email,
        role: 'teacher',
        password: userResult.password || '',
        userId: userResult.roleSpecificId || result.teacherId, // Use role-specific ID from API
        className: result.teacherData.class
      })
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  const handleAdminBursarParentSuccess = async (formData: any) => {
    const userResult = await createUser(formData)
    if (userResult.success) {
      console.log('Admin/Bursar/Parent creation success:', { userResult, formData })
      setGeneratedPassword(userResult.password || null)
      setUserData({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        password: userResult.password || '',
        userId: userResult.roleSpecificId || formData.studentId || formData.teacherRegNo || formData.parentCode, // Use role-specific ID from API
        className: formData.class
      })
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  const renderRoleSpecificForm = () => {
    switch (selectedRole) {
      case 'student':
        return (
          <StudentEnrollmentForm 
            onSuccess={handleStudentEnrollmentSuccess}
            onCancel={handleBackToRoleSelection}
          />
        )
      case 'teacher':
        return (
          <TeacherEnrollmentForm 
            onSuccess={handleTeacherEnrollmentSuccess}
            onCancel={handleBackToRoleSelection}
          />
        )
      case 'admin':
      case 'bursar':
      case 'parent':
        return (
          <AdminBursarParentForm 
            role={selectedRole}
            onSuccess={handleAdminBursarParentSuccess}
            onCancel={handleBackToRoleSelection}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      {showRoleSelection ? (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">Select User Role</h3>
            <p className="text-muted-foreground">Choose the type of user you want to create</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(roleIcons).map(([key, Icon]) => (
              <button
                key={key}
                onClick={() => handleRoleChange(key as UserType['role'])}
                className="flex flex-col items-center p-6 border rounded-lg hover:border-primary hover:bg-accent transition-colors"
              >
                <Icon className="h-8 w-8 mb-2 text-muted-foreground" />
                <span className="font-medium capitalize">{key}</span>
                <span className="text-sm text-muted-foreground mt-1">
                  {key === 'student' && 'Student enrollment form'}
                  {key === 'teacher' && 'Teacher enrollment form'}
                  {key === 'admin' && 'Administrator account'}
                  {key === 'bursar' && 'Financial management'}
                  {key === 'parent' && 'Parent account'}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onSuccess}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" size="sm" onClick={handleBackToRoleSelection}>
              ← Back to Role Selection
            </Button>
            <div className="flex items-center gap-2">
              {selectedRole && roleIcons[selectedRole as keyof typeof roleIcons] && React.createElement(roleIcons[selectedRole as keyof typeof roleIcons], { className: "h-4 w-4" })}
              <span className="font-medium capitalize">Creating {selectedRole}</span>
            </div>
          </div>

          {renderRoleSpecificForm()}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Creation Success Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {userData && (
            <UserCreationSuccessDialog
              userData={userData}
              onClose={() => {
                setShowPasswordDialog(false)
                setShowRoleSelection(true)
                setSelectedRole('')
                setGeneratedPassword(null)
                setUserData(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

// Component for Admin, Bursar, and Parent forms
function AdminBursarParentForm({ 
  role, 
  onSuccess, 
  onCancel 
}: { 
  role: 'admin' | 'bursar' | 'parent'
  onSuccess: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+237 6',
    address: '',
    dateOfBirth: '',
    gender: 'male' as 'male' | 'female',
    role: role,
    status: 'active' as const,
    permissions: [] as string[]
  })

  const rolePermissions = {
    admin: ['all'],
    parent: ['view_child_progress', 'communicate_teachers', 'view_financial_records'],
    bursar: ['manage_finances', 'track_payments', 'generate_reports', 'send_fee_notices']
  }

  const handlePhoneChange = (value: string) => {
    // Ensure phone number starts with +237 6 for Cameroon
    let formattedPhone = value
    if (!formattedPhone.startsWith('+237 6')) {
      formattedPhone = '+237 6'
    }
    // Remove any invalid characters and ensure proper format
    formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
    setFormData(prev => ({ ...prev, phone: formattedPhone }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      dateOfBirth: new Date(formData.dateOfBirth),
      permissions: rolePermissions[role]
    }
    
    onSuccess(submitData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="name">Full Name *</Label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter email address"
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="+237 6XX XXX XXX"
            maxLength={15}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Format: +237 6XXXXXXXX (Cameroon mobile number)
          </p>
        </div>

        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => setFormData(prev => ({ ...prev, gender: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="dateOfBirth">Date of Birth *</Label>
          <input
            id="dateOfBirth"
            type="date"
            required
            value={formData.dateOfBirth}
            onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter full address"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create {role.charAt(0).toUpperCase() + role.slice(1)}
        </Button>
      </div>
    </form>
  )
}
