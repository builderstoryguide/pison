"use client"

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function TestEmailPage() {
  const [testEmail, setTestEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    error?: string
    details?: string
  } | null>(null)

  const handleTestEmail = async () => {
    if (!testEmail) {
      setResult({
        success: false,
        error: 'Please enter a test email address'
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testEmail }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({
          success: true,
          message: data.message
        })
      } else {
        setResult({
          success: false,
          error: data.error || 'Failed to send test email',
          details: data.details
        })
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error occurred while testing email service'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Email Service Test</h1>
            <p className="text-muted-foreground">
              Test the email functionality to ensure it's working correctly
            </p>
          </div>
        </div>

        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
            <CardDescription>
              Enter an email address to test the email service functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="testEmail" className="text-sm font-medium">
                Test Email Address
              </label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Enter your email address"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button 
              onClick={handleTestEmail} 
              disabled={isLoading || !testEmail}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Test Email...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Test Successful
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Test Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Success!</strong> {result.message}
                    <br />
                    <span className="text-sm text-muted-foreground">
                      Check your email inbox for the test message.
                    </span>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {result.error}
                    {result.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm">View Details</summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {result.details}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>What This Test Does</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Test Process:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Validates your Resend API key configuration</li>
                <li>Sends a test email to the address you provide</li>
                <li>Verifies the email service is working correctly</li>
                <li>Confirms the system can send welcome emails to students and parents</li>
              </ol>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Next Steps:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>If the test is successful, you can proceed with student enrollment</li>
                <li>If the test fails, check your API key and network connection</li>
                <li>Review the error details for troubleshooting information</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
