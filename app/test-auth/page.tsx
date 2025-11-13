"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

export default function TestAuthPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    role: 'teacher'
  })

  const testAuth = async () => {
    setIsLoading(true)
    setTestResult('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ SUCCESS: ${JSON.stringify(data, null, 2)}`)
      } else {
        setTestResult(`❌ ERROR: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setTestResult(`❌ EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testUserCreation = async () => {
    setIsLoading(true)
    setTestResult('')

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Teacher',
          email: 'test.teacher@example.com',
          role: 'teacher',
          phone: '+237 677 123 456',
          address: 'Test Address',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          subsystem: 'english'
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        setTestResult(`✅ USER CREATED: ${JSON.stringify(data, null, 2)}`)
        // Auto-fill the test form with the created credentials
        setFormData({
          identifier: data.user.role_specific_id || 'test.teacher@example.com',
          password: data.password,
          role: 'teacher'
        })
      } else {
        setTestResult(`❌ USER CREATION FAILED: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setTestResult(`❌ EXCEPTION: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Authentication Test Page</h1>
        <p className="text-muted-foreground">Test user creation and authentication</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Creation Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test User Creation</CardTitle>
            <CardDescription>Create a test user to verify the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testUserCreation} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating...' : 'Create Test Teacher User'}
            </Button>
            <p className="text-xs text-muted-foreground">
              This will create a test teacher user and auto-fill the login form below.
            </p>
          </CardContent>
        </Card>

        {/* Authentication Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Authentication</CardTitle>
            <CardDescription>Test login with created credentials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Identifier (Email or ID)</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="Enter email or user ID"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="bursar">Bursar</option>
              </select>
            </div>

            <Button 
              onClick={testAuth} 
              disabled={isLoading || !formData.identifier || !formData.password}
              className="w-full"
            >
              {isLoading ? 'Testing...' : 'Test Authentication'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results Display */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription className="whitespace-pre-wrap font-mono text-sm">
                {testResult}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">1. Click "Create Test Teacher User" to create a test user</p>
          <p className="text-sm">2. The form below will be auto-filled with the credentials</p>
          <p className="text-sm">3. Click "Test Authentication" to verify login works</p>
          <p className="text-sm">4. Check the results to see if authentication succeeded</p>
          <p className="text-sm text-muted-foreground">
            This will help identify if the issue is with user creation or authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
