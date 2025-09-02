"use client"

import React, { useState } from 'react'
import { Eye, EyeOff, School, Languages, User, GraduationCap, Users, DollarSign, UserCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth-context'

const roleIcons = {
  admin: User,
  teacher: GraduationCap,
  student: Users,
  parent: UserCheck,
  bursar: DollarSign
}

const roleLabels = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
  parent: 'Parent',
  bursar: 'Bursar'
}

const placeholderTexts = {
  admin: 'Enter your email address',
  teacher: 'Enter email or teacher registration number',
  student: 'Enter student ID or email',
  parent: 'Enter parent code or email',
  bursar: 'Enter your email address'
}

// Demo credentials removed - use real user credentials from the system

export function LoginForm() {
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: '' as any,
    subsystem: 'english' as 'english' | 'french'
  })
  const [showPassword, setShowPassword] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.role) return

    const success = await login(formData)
    if (!success) {
      // Error is handled by the auth context
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <School className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Pison Academy of Excellence</h1>
          <p className="text-muted-foreground">School Management System</p>
          <div className="flex justify-center">
            <Badge variant="outline" className="flex items-center gap-1">
              <Languages className="h-3 w-3" />
              Excellence in Education
            </Badge>
          </div>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Access your school management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">Select Your Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(roleLabels).map(([key, label]) => {
                      const Icon = roleIcons[key as keyof typeof roleIcons]
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Subsystem Selection */}
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

              {/* Identifier Input */}
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {formData.role === 'student' ? 'Student ID or Email' :
                   formData.role === 'teacher' ? 'Teacher Reg. No. or Email' :
                   formData.role === 'parent' ? 'Parent Code or Email' :
                   'Email Address'}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={formData.role ? placeholderTexts[formData.role] : 'Select role first'}
                  value={formData.identifier}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                  required
                  disabled={!formData.role}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    disabled={!formData.role}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={!formData.role}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

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
                disabled={isLoading || !formData.role}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              {/* Help Text */}
              <div className="text-center text-xs text-muted-foreground">
                <p>Use the credentials provided when your account was created</p>
                <p>For students: Use Student ID or email</p>
                <p>For teachers: Use Teacher ID or email</p>
                <p>For parents: Use Parent Code or email</p>
              </div>


            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2024 Pison Academy of Excellence</p>
          <p>Secure Educational Management System</p>
        </div>
      </div>
    </div>
  )
}
