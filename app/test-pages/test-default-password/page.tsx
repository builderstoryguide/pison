"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateDefaultPassword, generateTemporaryPassword, validatePassword } from '@/lib/password-utils'

export default function TestDefaultPassword() {
  const [generatedPassword, setGeneratedPassword] = useState<string>('')
  const [tempPassword, setTempPassword] = useState<string>('')
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string } | null>(null)
  const [testPassword, setTestPassword] = useState<string>('')

  const testDefaultPassword = () => {
    const password = generateDefaultPassword('teacher')
    setGeneratedPassword(password)
  }

  const testTemporaryPassword = () => {
    const password = generateTemporaryPassword()
    setTempPassword(password)
  }

  const testPasswordValidation = () => {
    const result = validatePassword(testPassword)
    setValidationResult(result)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Default Password Feature Test</h1>
        <p className="text-muted-foreground">Test the password generation and validation utilities</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Default Password Test */}
        <Card>
          <CardHeader>
            <CardTitle>Default Password Generation</CardTitle>
            <CardDescription>Test generating default passwords for different roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDefaultPassword} className="w-full">
              Generate Teacher Password
            </Button>
            {generatedPassword && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm">{generatedPassword}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Temporary Password Test */}
        <Card>
          <CardHeader>
            <CardTitle>Temporary Password Generation</CardTitle>
            <CardDescription>Test generating temporary passwords for resets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testTemporaryPassword} className="w-full">
              Generate Temporary Password
            </Button>
            {tempPassword && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-mono text-sm">{tempPassword}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Validation Test */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Password Validation</CardTitle>
            <CardDescription>Test password strength validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter password to test"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <Button onClick={testPasswordValidation}>
                Validate
              </Button>
            </div>
            {validationResult && (
              <div className={`p-4 rounded-lg ${
                validationResult.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-semibold">
                  {validationResult.isValid ? '✅ Valid Password' : '❌ Invalid Password'}
                </p>
                {validationResult.error && (
                  <p className="text-sm mt-1">{validationResult.error}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>Summary of all password generation tests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Default Password Generated:</span>
              <span className={generatedPassword ? 'text-green-600' : 'text-gray-500'}>
                {generatedPassword ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Temporary Password Generated:</span>
              <span className={tempPassword ? 'text-green-600' : 'text-gray-500'}>
                {tempPassword ? '✅ Yes' : '❌ No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Password Validation Tested:</span>
              <span className={validationResult ? 'text-green-600' : 'text-gray-500'}>
                {validationResult ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
