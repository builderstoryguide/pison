"use client"

import { useState } from 'react'
import { User, GraduationCap, Users, UserCheck, DollarSign } from 'lucide-react'
import { useUserManagement, User as UserType } from '@/lib/user-management-context'
import { useStudentEnrollment } from '@/lib/student-enrollment-context'
import { useTeacherManagement } from '@/lib/teacher-management-context'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import { StudentEnrollmentForm } from './student-enrollment-form'
import { TeacherEnrollmentForm } from './teacher-enrollment-form'

const roleIcons = {
  admin: User,
  teacher: GraduationCap,
  student: Users,
  parent: UserCheck,
  bursar: DollarSign
}

interface DynamicUserFormProps {
  onSuccess: () => void
}

export function DynamicUserForm({ onSuccess }: DynamicUserFormProps) {
  const { createUser, isLoading, error } = useUserManagement()
  const { enrollStudent } = useStudentEnrollment()
  const { addTeacher } = useTeacherManagement()
  
  const [selectedRole, setSelectedRole] = useState<UserType['role'] | ''>('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [showRoleSelection, setShowRoleSelection] = useState(true)

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
    className?: string;
  }) => {
    // The student enrollment form already creates the student record in the database
    // We just need to create the user account for login purposes
    const userData = {
      name: result.studentName,
      email: result.studentEmail || '',
      role: 'student' as const,
      status: 'active' as const,
      studentId: result.studentId,
      subsystem: 'english' as const,
      phone: '',
      address: '',
      dateOfBirth: new Date(),
      gender: 'male' as const,
      permissions: ['view_grades', 'view_schedule', 'submit_assignments', 'communicate_teachers']
    }

    const userResult = await createUser(userData)
    if (userResult.success) {
      setGeneratedPassword(userResult.password || null)
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  const handleTeacherEnrollmentSuccess = async (result: { teacherId: string; teacherData: any }) => {
    // The teacher enrollment form already creates the teacher record in the database
    // We just need to create the user account for login purposes
    const userData = {
      name: `${result.teacherData.firstName} ${result.teacherData.lastName}`,
      email: result.teacherData.email,
      role: 'teacher' as const,
      status: 'active' as const,
      teacherRegNo: result.teacherId,
      subsystem: result.teacherData.subsystem,
      phone: result.teacherData.phone,
      address: result.teacherData.address,
      dateOfBirth: new Date(result.teacherData.dateOfBirth),
      gender: result.teacherData.gender as 'male' | 'female',
      permissions: ['manage_classes', 'grade_students', 'mark_attendance', 'communicate_parents']
    }

    const userResult = await createUser(userData)
    if (userResult.success) {
      setGeneratedPassword(userResult.password || null)
      setShowPasswordDialog(true)
      onSuccess()
    }
  }

  const handleAdminBursarParentSuccess = async (formData: any) => {
    const userResult = await createUser(formData)
    if (userResult.success) {
      setGeneratedPassword(userResult.password || null)
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
              {selectedRole && roleIcons[selectedRole] && (() => {
                const Icon = roleIcons[selectedRole];
                return <Icon className="h-4 w-4" />;
              })()}
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
                <input
                  id="generated-password"
                  type="text"
                  value={generatedPassword || ''}
                  readOnly
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
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
    phone: '',
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
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="+237 6XX XXX XXX"
          />
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
