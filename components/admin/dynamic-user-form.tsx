"use client"

import { useState } from 'react'
import { User, GraduationCap, Users, UserCheck, DollarSign } from 'lucide-react'
import { useUserManagement, User as UserType } from '@/lib/user-management-context'
import { useStudentEnrollment } from '@/lib/student-enrollment-context'
import { useTeacherManagement } from '@/lib/teacher-management-context'
import { useToast } from '@/hooks/use-toast'

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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface DynamicUserFormProps {
  onSuccess: () => void
}

export function DynamicUserForm({ onSuccess }: DynamicUserFormProps) {
  const { createUser, isLoading, error } = useUserManagement()
  const { enrollStudent } = useStudentEnrollment()
  const { addTeacher } = useTeacherManagement()
  const { toast } = useToast()
  
  const [selectedRole, setSelectedRole] = useState<UserType['role'] | ''>('')
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null)
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
    // The student enrollment form already creates everything needed:
    // - Student record in students table
    // - Parent record in parents table  
    // - Student user account in users table
    // - Parent user account in users table
    // - User profiles for both
    // - All relationships established
    
    // We just need to show the success dialog with the credentials
    setUserData({
      name: result.studentName,
      email: result.studentEmail || '',
      role: 'student',
      password: result.studentPassword || '',
      userId: result.studentId,
      className: result.className,
      parentName: result.parentName,
      parentEmail: result.parentEmail,
      parentCode: result.parentCode,
      parentPassword: result.parentPassword
    })
    
    setShowPasswordDialog(true)
    
    toast.success("Student enrolled successfully!", {
      description: `${result.studentName} has been enrolled with ID ${result.studentId}. Parent account created with code ${result.parentCode}.`
    })
    
    // Don't call onSuccess() here - let the success dialog handle it
  }

  const handleTeacherEnrollmentSuccess = async (result: { teacherId: string; teacherData: any }) => {
    // The teacher enrollment form already creates everything needed:
    // - Teacher record in teachers table
    // - Teacher user account in users table
    // - User profile for teacher
    // - All relationships established
    
    // We just need to show the success dialog with the credentials
    setUserData({
      name: `${result.teacherData.firstName} ${result.teacherData.lastName}`,
      email: result.teacherData.email,
      role: 'teacher',
      password: result.teacherData.password || '',
      userId: result.teacherId,
      className: result.teacherData.class
    })
    
    setShowPasswordDialog(true)
    
    toast.success("Teacher enrolled successfully!", {
      description: `${result.teacherData.firstName} ${result.teacherData.lastName} has been enrolled with ID ${result.teacherId}.`
    })
    
    // Don't call onSuccess() here - let the success dialog handle it
  }

  const handleAdminBursarParentSuccess = async (formData: any) => {
    try {
      const userResult = await createUser(formData)
      if (userResult.success) {
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
        toast.success(`${formData.role.charAt(0).toUpperCase() + formData.role.slice(1)} created successfully!`, {
          description: `${formData.name} has been created and user account is ready.`
        })
        // Don't call onSuccess() here - let the success dialog handle it
      } else {
        toast.error("Failed to create user account", {
          description: "An error occurred while creating the user account."
        })
      }
    } catch (error) {
      toast.error("Error creating user account", {
        description: "An unexpected error occurred while creating the user account."
      })
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
        <div className="space-y-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Creating user account...</p>
              </div>
            </div>
          )}
          
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

      {/* User Creation Success Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-300">
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
              onSuccess={() => {
                setShowPasswordDialog(false)
                setShowRoleSelection(true)
                setSelectedRole('')
                setGeneratedPassword(null)
                setUserData(null)
                onSuccess() // Call the parent's onSuccess callback
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure phone number is properly formatted
    let formattedPhone = formData.phone
    if (!formattedPhone.startsWith('+237 6')) {
      formattedPhone = '+237 6'
    }
    formattedPhone = formattedPhone.replace(/[^0-9\s\+\-\(\)]/g, '')
    
    const submitData = {
      ...formData,
      phone: formattedPhone,
      dateOfBirth: new Date(formData.dateOfBirth).toISOString().split('T')[0],
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
