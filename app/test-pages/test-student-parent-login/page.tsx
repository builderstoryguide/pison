"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, User, Lock } from 'lucide-react'
import { useAuth, AuthProvider } from '@/lib/auth-context'

function TestStudentParentLoginContent() {
  const { login, isLoading, error } = useAuth()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'student' as 'student' | 'parent',
    subsystem: 'english' as 'english' | 'french'
  })
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleLogin = async () => {
    if (!formData.identifier.trim() || !formData.password.trim()) {
      setResult({ success: false, message: 'Please enter both identifier and password' })
      return
    }

    setResult(null)
    // Log only non-sensitive data
    const sanitizedData = { ...formData, password: '[REDACTED]' }
    console.log('🧪 Test: Starting login for:', sanitizedData)

    try {
      const success = await login({
        identifier: formData.identifier,
        password: formData.password,
        role: formData.role,
        subsystem: formData.subsystem
      })

      if (success) {
        setResult({ success: true, message: 'Login successful!' })
      } else {
        setResult({ success: false, message: 'Login failed. Check your credentials.' })
      }
    } catch (error) {
      console.error('🧪 Test: Login error:', error)
      setResult({ 
        success: false, 
        message: `Login error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const testCredentials = [
    {
      role: 'student' as const,
      identifier: 'STU2024001',
      password: 'Student123!',
      description: 'Test Student Account'
    },
    {
      role: 'parent' as const,
      identifier: 'PAR2024001',
      password: 'Parent123!',
      description: 'Test Parent Account'
    }
  ]

  const fillTestCredentials = (credentials: typeof testCredentials[0]) => {
    setFormData(prev => ({
      ...prev,
      identifier: credentials.identifier,
      password: credentials.password,
      role: credentials.role
    }))
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Test Student & Parent Login
          </CardTitle>
          <CardDescription>
            Test the login functionality for student and parent accounts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Test Credentials */}
          <div className="space-y-3">
            <Label>Quick Test Credentials</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {testCredentials.map((credentials, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => fillTestCredentials(credentials)}
                  className="justify-start"
                >
                  <User className="h-3 w-3 mr-2" />
                  {credentials.description}
                </Button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="identifier">
                {formData.role === 'student' ? 'Student ID or Email' : 'Parent Code or Email'}
              </Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => handleInputChange('identifier', e.target.value)}
                placeholder={formData.role === 'student' ? 'STU2024001 or student@example.com' : 'PAR2024001 or parent@example.com'}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div>
              <Label htmlFor="subsystem">Subsystem</Label>
              <Select value={formData.subsystem} onValueChange={(value) => handleInputChange('subsystem', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleLogin} 
              disabled={isLoading || !formData.identifier.trim() || !formData.password.trim()}
              className="w-full flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {isLoading ? 'Logging in...' : 'Test Login'}
            </Button>
          </div>

          {/* Results */}
          {result && (
            <Alert variant={result.success ? "default" : "destructive"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          {/* Auth Context Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Auth Error: {error}</AlertDescription>
            </Alert>
          )}

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <div className="text-sm space-y-1">
              <div>Current form data: {JSON.stringify({
                ...formData,
                password: formData.password ? 'REDACTED' : undefined
              }, null, 2)}</div>
              <div>Loading state: {isLoading ? 'Yes' : 'No'}</div>
              <div>Auth error: {error || 'None'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestStudentParentLogin() {
  return (
    <AuthProvider>
      <TestStudentParentLoginContent />
    </AuthProvider>
  )
}
