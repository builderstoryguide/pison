"use client"

import { Check, Copy, Download, Mail, User, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

interface EnrollmentSuccessDialogProps {
  studentId: string
  parentCode: string
  studentName: string
  studentPassword?: string
  parentPassword?: string
  studentEmail?: string
  parentEmail?: string
  className?: string
  onClose: () => void
}

export function EnrollmentSuccessDialog({ 
  studentId, 
  parentCode, 
  studentName, 
  studentPassword,
  parentPassword,
  studentEmail,
  parentEmail,
  className,
  onClose 
}: EnrollmentSuccessDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const generateWelcomeEmail = () => {
    const emailContent = `
Subject: Welcome to Government Bilingual High School Yaoundé

Dear ${studentName} and Parent/Guardian,

Congratulations! Your enrollment at Government Bilingual High School Yaoundé has been successfully completed.

Student Details:
- Student ID: ${studentId}
- Parent Access Code: ${parentCode}
${studentPassword ? `- Student Password: ${studentPassword}` : ''}
${parentPassword ? `- Parent Password: ${parentPassword}` : ''}

Please keep these credentials safe as they will be needed to access the school management system.

Next Steps:
1. Complete document submission at the school office
2. Pay enrollment fees at the bursar's office
3. Collect your student ID card
4. Attend orientation session

Welcome to our school community!

Best regards,
Administration Team
Government Bilingual High School Yaoundé
    `.trim()

    const blob = new Blob([emailContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `welcome-email-${studentId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const sendWelcomeEmail = async () => {
    if (!studentEmail && !parentEmail) {
      setEmailError('No email addresses available to send welcome email')
      return
    }

    setIsSendingEmail(true)
    setEmailError(null)

    try {
      const response = await fetch('/api/email/welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentName,
          studentEmail,
          parentName: 'Parent/Guardian', // You might want to pass this as a prop
          parentEmail,
          studentId,
          parentCode,
          studentPassword,
          parentPassword,
          className: className || 'Not specified'
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEmailSent(true)
      } else {
        setEmailError(result.error || 'Failed to send welcome email')
      }
    } catch (error) {
      setEmailError('Failed to send welcome email. Please try again.')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-green-600">Enrollment Successful!</h2>
          <p className="text-muted-foreground">
            {studentName} has been successfully enrolled at Government Bilingual High School Yaoundé
          </p>
        </div>
      </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Information
          </CardTitle>
          <CardDescription>
            Important credentials for system access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Student ID</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(studentId, 'studentId')}
                  className="h-6 px-2"
                >
                  {copiedField === 'studentId' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-lg font-bold bg-muted p-2 rounded">
                {studentId}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Parent Access Code</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(parentCode, 'parentCode')}
                  className="h-6 px-2"
                >
                  {copiedField === 'parentCode' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-lg font-bold bg-muted p-2 rounded">
                {parentCode}
              </div>
            </div>
          </div>

          {(studentPassword || parentPassword) && (
            <div className="grid gap-4 md:grid-cols-2">
              {studentPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Student Password</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(studentPassword, 'studentPassword')}
                      className="h-6 px-2"
                    >
                      {copiedField === 'studentPassword' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-lg font-bold bg-muted p-2 rounded">
                    {studentPassword}
                  </div>
                </div>
              )}
              {parentPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Parent Password</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(parentPassword, 'parentPassword')}
                      className="h-6 px-2"
                    >
                      {copiedField === 'parentPassword' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-lg font-bold bg-muted p-2 rounded">
                    {parentPassword}
                  </div>
                </div>
              )}
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Important:</strong> Please save these credentials securely. They will be needed to access the school management system.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
          <CardDescription>
            Complete these steps to finalize the enrollment process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">1</Badge>
              <div>
                <p className="font-medium">Submit Required Documents</p>
                <p className="text-sm text-muted-foreground">
                  Visit the school office with original documents for verification
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">2</Badge>
              <div>
                <p className="font-medium">Pay Enrollment Fees</p>
                <p className="text-sm text-muted-foreground">
                  Complete fee payment at the bursar's office
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">3</Badge>
              <div>
                <p className="font-medium">Collect Student ID Card</p>
                <p className="text-sm text-muted-foreground">
                  Pick up official student identification card
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5">4</Badge>
              <div>
                <p className="font-medium">Attend Orientation</p>
                <p className="text-sm text-muted-foreground">
                  Join the new student orientation session
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Status */}
      {emailError && (
        <Alert variant="destructive">
          <AlertDescription>{emailError}</AlertDescription>
        </Alert>
      )}

      {emailSent && (
        <Alert>
          <AlertDescription>
            <strong>Success!</strong> Welcome emails have been sent to the student and parent.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Button variant="outline" onClick={generateWelcomeEmail}>
          <Download className="h-4 w-4 mr-2" />
          Download Welcome Letter
        </Button>
        <Button 
          variant="outline" 
          onClick={sendWelcomeEmail}
          disabled={isSendingEmail || !studentEmail && !parentEmail}
        >
          <Mail className="h-4 w-4 mr-2" />
          {isSendingEmail ? 'Sending...' : 'Send Email Notification'}
        </Button>
        <Button onClick={onClose}>
          Complete
        </Button>
      </div>
    </div>
  )
}
