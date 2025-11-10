"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Lock } from 'lucide-react'
import { generateDefaultPassword } from '@/lib/password-utils'

export default function TestPasswordHashing() {
  const [testPassword, setTestPassword] = useState('')
  const [hashedPassword, setHashedPassword] = useState('')
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const testPasswordHashing = async () => {
    if (!testPassword.trim()) {
      setResult({ success: false, message: 'Please enter a password to test' })
      return
    }

    try {
      console.log('🧪 Testing password hashing for:', testPassword)

      // Test the hashing API
      const response = await fetch('/api/test-password-hash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: testPassword }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setHashedPassword(data.hashedPassword)
        setResult({ success: true, message: 'Password hashed successfully!' })
      } else {
        setResult({ success: false, message: data.error || 'Failed to hash password' })
      }
    } catch (error) {
      console.error('🧪 Password hashing test error:', error)
      setResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const testPasswordComparison = async () => {
    if (!testPassword.trim() || !hashedPassword.trim()) {
      setResult({ success: false, message: 'Please hash a password first' })
      return
    }

    try {
      console.log('🧪 Testing password comparison')

      // Test the comparison API
      const response = await fetch('/api/test-password-compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          password: testPassword,
          hashedPassword: hashedPassword 
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ success: true, message: 'Password comparison successful!' })
      } else {
        setResult({ success: false, message: data.error || 'Password comparison failed' })
      }
    } catch (error) {
      console.error('🧪 Password comparison test error:', error)
      setResult({ 
        success: false, 
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      })
    }
  }

  const generateTestPassword = () => {
    const password = generateDefaultPassword('student')
    setTestPassword(password)
    // Clear stale state when password changes
    setHashedPassword('')
    setResult(null)
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Test Password Hashing
          </CardTitle>
          <CardDescription>
            Test password hashing and comparison functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Password Input */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">Password to Test</Label>
              <div className="flex gap-2">
                <Input
                  id="password"
                  type="password"
                  value={testPassword}
                  onChange={(e) => {
                    setTestPassword(e.target.value)
                    // Clear stale state when password changes
                    setHashedPassword('')
                    setResult(null)
                  }}
                  placeholder="Enter password to test"
                />
                <Button onClick={generateTestPassword} variant="outline">
                  Generate Test Password
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={testPasswordHashing} 
                disabled={!testPassword.trim()}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Test Hashing
              </Button>
              <Button 
                onClick={testPasswordComparison} 
                disabled={!testPassword.trim() || !hashedPassword.trim()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Test Comparison
              </Button>
            </div>
          </div>

          {/* Hashed Password Display */}
          {hashedPassword && (
            <div>
              <Label>Hashed Password</Label>
              <div className="p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                {hashedPassword}
              </div>
            </div>
          )}

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

          {/* Debug Info */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Debug Information</h4>
            <div className="text-sm space-y-1">
              <div>Test password: {testPassword || 'None'}</div>
              <div>Hashed password: {hashedPassword ? 'Generated' : 'None'}</div>
              <div>Result: {result ? result.message : 'None'}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
