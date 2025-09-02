"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle, User, Mail, Phone, GraduationCap, Copy, Download, Check, Sparkles, Shield, Clock, Key } from "lucide-react"
import { useState } from "react"

interface TeacherEnrollmentSuccessDialogProps {
  teacherId: string
  teacherName: string
  email: string
  phone: string
  subsystem: string
  subjects: string[]
  classes: string[]
  password: string
  onClose: () => void
  onViewTeacher?: () => void
  onEnrollAnother?: () => void
  open: boolean
}

export function TeacherEnrollmentSuccessDialog({
  teacherId,
  teacherName,
  email,
  phone,
  subsystem,
  subjects = [],
  classes = [],
  password,
  onClose,
  onViewTeacher,
  onEnrollAnother,
  open,
}: TeacherEnrollmentSuccessDialogProps) {
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

Dear ${teacherName},

Congratulations! Your enrollment as a teacher at Government Bilingual High School Yaoundé has been successfully completed.

Teacher Details:
- Teacher ID: ${teacherId}
- Email: ${email}
- Password: ${password}
- Subsystem: ${subsystem} Sub-system
- Subjects: ${subjects.join(', ')}
- Classes: ${classes.join(', ')}

Please keep these credentials safe as they will be needed to access the school management system.

Next Steps:
1. Complete document submission at the school office
2. Attend teacher orientation session
3. Set up your teaching schedule
4. Access the teacher portal with your credentials

Welcome to our teaching staff!

Best regards,
Administration Team
Government Bilingual High School Yaoundé
    `.trim()

    const blob = new Blob([emailContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `welcome-email-${teacherId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const sendWelcomeEmail = async () => {
    if (!email) {
      setEmailError('No email address available to send welcome email')
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
          teacherName,
          teacherId,
          email,
          password,
          subsystem,
          subjects,
          classes,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEmailSent(true)
        setEmailError(null)
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            🎉 Welcome to Our Team!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Success Message */}
          <div className="text-center p-6 bg-muted rounded-lg border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg">
              {teacherName} has been successfully enrolled as a Teacher
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="h-6 w-6" />
                </div>
                <CardTitle className="text-sm font-medium">Teacher ID</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-bold font-mono">{teacherId}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <CardTitle className="text-sm font-medium">Subsystem</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-bold">{subsystem}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="text-center pb-2">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2">
                  <Key className="h-6 w-6" />
                </div>
                <CardTitle className="text-sm font-medium">Status</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-bold">Active</p>
              </CardContent>
            </Card>
          </div>

          {/* Credentials Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Login Credentials
              </CardTitle>
              <CardDescription>
                Save these credentials securely - they're required for system access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-md border">
                      {email}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(email, 'email')}
                      className="h-10 w-10 p-0"
                    >
                      {copiedField === 'email' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Default Password
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm bg-muted p-3 rounded-md border">
                      {password}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(password, 'password')}
                      className="h-10 w-10 p-0"
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Security Notice:</strong> This password will expire in 30 days. Please change it immediately after first login.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Teaching Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Teaching Assignments
              </CardTitle>
              <CardDescription>
                Subjects and classes assigned to this teacher
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Subjects */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Subjects to Teach
                </h4>
                <div className="flex flex-wrap gap-2">
                  {subjects && subjects.length > 0 ? (
                    subjects.map((subject, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary"
                      >
                        {subject}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No subjects assigned yet</p>
                  )}
                </div>
              </div>

              {/* Classes */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Classes to Teach
                </h4>
                <div className="flex flex-wrap gap-2">
                  {classes && classes.length > 0 ? (
                    classes.map((cls, index) => (
                      <Badge 
                        key={index} 
                        variant="outline"
                      >
                        {cls}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No classes assigned yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">✓</span>
                </div>
                Next Steps
              </CardTitle>
              <CardDescription>
                Complete these steps to finalize your account setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Share Credentials</p>
                      <p className="text-muted-foreground text-xs">Provide login details securely</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">First Login</p>
                      <p className="text-muted-foreground text-xs">Access system and change password</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Profile Setup</p>
                      <p className="text-muted-foreground text-xs">Complete personal information</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">System Access</p>
                      <p className="text-muted-foreground text-xs">Verify teaching features</p>
                    </div>
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
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Success!</strong> Welcome email has been sent to {email}.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={generateWelcomeEmail} 
                className="h-12"
              >
                <Download className="h-5 w-5 mr-3" />
                Download Welcome Email
              </Button>
              <Button 
                variant="outline" 
                onClick={sendWelcomeEmail}
                disabled={isSendingEmail}
                className="h-12"
              >
                <Mail className="h-5 w-5 mr-3" />
                {isSendingEmail ? 'Sending...' : 'Send Welcome Email'}
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 h-12"
              >
                Close
              </Button>
              {onEnrollAnother && (
                <Button 
                  onClick={onEnrollAnother} 
                  className="flex-1 h-12"
                >
                  <User className="h-5 w-5 mr-2" />
                  Enroll Another Teacher
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
