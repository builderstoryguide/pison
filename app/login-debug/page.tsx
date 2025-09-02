"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react'

export default function LoginDebugPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [formData, setFormData] = useState({
    identifier: 'admin@pisonacademy.cm',
    password: 'Admin@2024',
    role: 'admin',
    subsystem: 'english'
  })

  const addTestResult = (testName: string, success: boolean, details: string, data?: any) => {
    setTestResults(prev => [...prev, {
      testName,
      success,
      details,
      data,
      timestamp: new Date().toISOString()
    }])
  }

  const runComprehensiveTests = async () => {
    setIsRunningTests(true)
    setTestResults([])
    
    console.log('🚀 Starting comprehensive login system diagnostics...')

    // Test 1: Environment Variables
    try {
      console.log('1️⃣ Testing environment variables...')
      const envTest = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing'
      }
      
      if (envTest.NEXT_PUBLIC_SUPABASE_URL && envTest.SUPABASE_SERVICE_ROLE_KEY === '✅ Set') {
        addTestResult('Environment Variables', true, 'All required environment variables are set', envTest)
      } else {
        addTestResult('Environment Variables', false, 'Missing required environment variables', envTest)
      }
    } catch (error) {
      addTestResult('Environment Variables', false, `Error: ${error}`, { error: error.toString() })
    }

    // Test 2: API Endpoint Availability
    try {
      console.log('2️⃣ Testing API endpoint availability...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'test@test.com',
          password: 'test',
          role: 'admin'
        })
      })
      
      if (response.status === 400) {
        // 400 is expected for invalid credentials, means endpoint is working
        addTestResult('API Endpoint', true, 'Login API endpoint is accessible and responding', {
          status: response.status,
          statusText: response.statusText
        })
      } else {
        addTestResult('API Endpoint', false, `Unexpected response: ${response.status}`, {
          status: response.status,
          statusText: response.statusText
        })
      }
    } catch (error) {
      addTestResult('API Endpoint', false, `API endpoint error: ${error}`, { error: error.toString() })
    }

    // Test 3: Database Connection (via API)
    try {
      console.log('3️⃣ Testing database connection...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'nonexistent@test.com',
          password: 'test',
          role: 'admin'
        })
      })
      
      const data = await response.json()
      
      if (data.error && data.error.includes('Invalid credentials')) {
        addTestResult('Database Connection', true, 'Database is accessible via API', {
          response: data
        })
      } else {
        addTestResult('Database Connection', false, 'Database connection test failed', {
          response: data
        })
      }
    } catch (error) {
      addTestResult('Database Connection', false, `Database test error: ${error}`, { error: error.toString() })
    }

    // Test 4: Admin User Existence
    try {
      console.log('4️⃣ Testing admin user existence...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@pisonacademy.cm',
          password: 'wrongpassword',
          role: 'admin'
        })
      })
      
      const data = await response.json()
      
      if (data.error && data.error.includes('Invalid credentials')) {
        addTestResult('Admin User Existence', true, 'Admin user exists in database', {
          response: data
        })
      } else if (data.error && data.error.includes('not found')) {
        addTestResult('Admin User Existence', false, 'Admin user not found in database', {
          response: data
        })
      } else {
        addTestResult('Admin User Existence', false, 'Unexpected response for admin user test', {
          response: data
        })
      }
    } catch (error) {
      addTestResult('Admin User Existence', false, `Admin user test error: ${error}`, { error: error.toString() })
    }

    // Test 5: Password Verification
    try {
      console.log('5️⃣ Testing password verification...')
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@pisonacademy.cm',
          password: 'Admin@2024',
          role: 'admin'
        })
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        addTestResult('Password Verification', true, 'Password verification successful - login should work!', {
          user: data.user,
          message: data.message
        })
      } else {
        addTestResult('Password Verification', false, 'Password verification failed', {
          status: response.status,
          response: data
        })
      }
    } catch (error) {
      addTestResult('Password Verification', false, `Password verification error: ${error}`, { error: error.toString() })
    }

    // Test 6: Form Validation
    try {
      console.log('6️⃣ Testing form validation...')
      const validationTests = [
        { identifier: '', password: 'test', role: 'admin', expected: 'missing identifier' },
        { identifier: 'test@test.com', password: '', role: 'admin', expected: 'missing password' },
        { identifier: 'test@test.com', password: 'test', role: '', expected: 'missing role' }
      ]
      
      let validationPassed = true
      for (const test of validationTests) {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test)
        })
        
        if (response.status !== 400) {
          validationPassed = false
          break
        }
      }
      
      if (validationPassed) {
        addTestResult('Form Validation', true, 'Form validation is working correctly')
      } else {
        addTestResult('Form Validation', false, 'Form validation has issues')
      }
    } catch (error) {
      addTestResult('Form Validation', false, `Form validation error: ${error}`, { error: error.toString() })
    }

    // Test 7: Role-based Authentication
    try {
      console.log('7️⃣ Testing role-based authentication...')
      const roleTest = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: 'admin@pisonacademy.cm',
          password: 'Admin@2024',
          role: 'teacher' // Wrong role for admin user
        })
      })
      
      const roleData = await roleTest.json()
      
      if (roleTest.status === 401 && roleData.error.includes('Invalid credentials')) {
        addTestResult('Role-based Authentication', true, 'Role-based authentication is working correctly')
      } else {
        addTestResult('Role-based Authentication', false, 'Role-based authentication has issues', {
          response: roleData
        })
      }
    } catch (error) {
      addTestResult('Role-based Authentication', false, `Role-based auth error: ${error}`, { error: error.toString() })
    }

    console.log('✅ All tests completed!')
    setIsRunningTests(false)
  }

  const testSpecificLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        addTestResult('Specific Login Test', true, 'Login successful with provided credentials!', {
          user: data.user,
          message: data.message
        })
      } else {
        addTestResult('Specific Login Test', false, 'Login failed with provided credentials', {
          status: response.status,
          response: data
        })
      }
    } catch (error) {
      addTestResult('Specific Login Test', false, `Login test error: ${error}`, { error: error.toString() })
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">🔍 Login System Diagnostic Tool</h1>
        <p className="text-muted-foreground">
          Comprehensive testing of the authentication system to identify and resolve login issues
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Run comprehensive diagnostics or test specific login credentials
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runComprehensiveTests} 
              disabled={isRunningTests}
              className="flex-1"
            >
              {isRunningTests ? 'Running Tests...' : '🚀 Run Comprehensive Tests'}
            </Button>
            <Button 
              onClick={clearResults} 
              variant="outline"
            >
              Clear Results
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="identifier">Identifier</Label>
              <Input
                id="identifier"
                value={formData.identifier}
                onChange={(e) => setFormData(prev => ({ ...prev, identifier: e.target.value }))}
                placeholder="Email, ID, or Code"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
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
            <div>
              <Label htmlFor="subsystem">Subsystem</Label>
              <Select 
                value={formData.subsystem} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, subsystem: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={testSpecificLogin} 
            variant="outline"
            className="w-full"
          >
            🧪 Test Specific Login
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {testResults.length} tests completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? 'PASS' : 'FAIL'}
                    </Badge>
                    <span className="font-medium">{result.testName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{result.details}</p>
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground">
                        View Details
                      </summary>
                      <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testResults.length}</div>
                <div className="text-sm text-muted-foreground">Total Tests</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {testResults.filter(r => r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Passed</div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {testResults.filter(r => !r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
            
            {testResults.filter(r => !r.success).length > 0 && (
              <Alert className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Issues Found:</strong> Some tests failed. Check the detailed results above to identify and fix the problems.
                </AlertDescription>
              </Alert>
            )}
            
            {testResults.filter(r => r.success).length === testResults.length && testResults.length > 0 && (
              <Alert className="mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>All Tests Passed!</strong> Your login system appears to be working correctly.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">1. Run Comprehensive Tests</p>
              <p className="text-sm text-muted-foreground">
                This will test all aspects of your authentication system automatically
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">2. Test Specific Credentials</p>
              <p className="text-sm text-muted-foreground">
                Use this to test specific login credentials and see detailed responses
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium">3. Review Results</p>
              <p className="text-sm text-muted-foreground">
                Check which tests pass/fail and use the detailed information to fix issues
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
