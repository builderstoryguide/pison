"use client"

import { useState } from 'react'
import { User, GraduationCap, Users, UserCheck, DollarSign, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'

const roleIcons = {
  admin: User,
  teacher: GraduationCap,
  student: Users,
  parent: UserCheck,
  burser: DollarSign
}

interface RegisterFormProps {
  onBack: () => void
}

export function RegisterForm({ onBack }: RegisterFormProps) {
  const { register, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '' as any,
    studentId: '',
    teacherRegNo: '',
    parentCode: '',
    subsystem: 'english' as 'english' | 'french',
    branch: '' as 'grammar' | 'technical' | 'commercial' | '',
    class: '',
    password: '',
    confirmPassword: ''
  })
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      return
    }

    const success = await register(formData)
    if (success) {
      setSuccess(true)
      // Reset form
      setFormData({
        name: '',
        email: '',
        role: '' as any,
        studentId: '',
        teacherRegNo: '',
        parentCode: '',
        subsystem: 'english',
        branch: '' as any,
        class: '',
        password: '',
        confirmPassword: ''
      })
    }
  }

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

  const handleRoleChange = (role: string) => {
    const newFormData = { ...formData, role: role as any }
    
    // Auto-generate IDs
    if (role === 'student') {
      newFormData.studentId = generateId('student')
    } else if (role === 'teacher') {
      newFormData.teacherRegNo = generateId('teacher')
    } else if (role === 'parent') {
      newFormData.parentCode = generateId('parent')
    }
    
    setFormData(newFormData)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-green-600">Registration Successful!</CardTitle>
          <CardDescription>
            The user account has been created successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={onBack} className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setSuccess(false)}
          >
            Register Another User
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Register New User</CardTitle>
            <CardDescription>Create a new account for school staff or students</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter full name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Administrator
                  </div>
                </SelectItem>
                <SelectItem value="teacher">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Teacher
                  </div>
                </SelectItem>
                <SelectItem value="student">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Student
                  </div>
                </SelectItem>
                <SelectItem value="parent">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Parent
                  </div>
                </SelectItem>
                <SelectItem value="burser">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Burser
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Role-specific fields */}
          {formData.role === 'student' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  value={formData.studentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select 
                  value={formData.branch} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, branch: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Input
                  id="class"
                  type="text"
                  placeholder="e.g., Form 5A"
                  value={formData.class}
                  onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                />
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
                required
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
                required
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

          {/* Password Fields */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              required
            />
          </div>

          {/* Password Mismatch Error */}
          {formData.password !== formData.confirmPassword && formData.confirmPassword && (
            <Alert variant="destructive">
              <AlertDescription>Passwords do not match</AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || formData.password !== formData.confirmPassword}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
