"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, User, Mail, Phone, GraduationCap, Copy, Download, Check, Sparkles, Shield, Clock, Key, X } from "lucide-react"
import { useState, useEffect, useRef } from "react"

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
}: TeacherEnrollmentSuccessDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  
  // Accessibility: Focus management
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Focus management on mount
  useEffect(() => {
    if (dialogRef.current) {
      dialogRef.current.focus()
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

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
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      <div 
        ref={dialogRef}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
        tabIndex={-1}
      >
        {/* Main Success Card */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-green-50 via-white to-blue-50 flex flex-col h-full">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/30 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-200/30 rounded-full translate-y-12 -translate-x-12"></div>
          
          {/* Header Section with Close Button */}
          <div className="relative text-center p-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            
            {/* Close Button - Top Right */}
            <Button
              ref={closeButtonRef}
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="relative">
              {/* Success Icon with Animation */}
              <div className="mx-auto w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6 animate-in zoom-in-0 duration-500">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </div>
              
              {/* Title and Description */}
              <h1 id="dialog-title" className="text-3xl font-bold mb-3 animate-in slide-in-from-bottom-2 duration-700">
                🎉 Welcome to Our Team!
              </h1>
              <p id="dialog-description" className="text-lg text-green-100 animate-in slide-in-from-bottom-2 duration-700 delay-200">
                {teacherName} has been successfully enrolled as a Teacher
              </p>
              
              {/* Celebration Elements */}
              <div className="flex justify-center mt-6 space-x-2 animate-in fade-in-0 duration-1000 delay-500">
                <Sparkles className="h-5 w-5 text-yellow-300 animate-bounce" />
                <Sparkles className="h-5 w-5 text-yellow-300 animate-bounce delay-100" />
                <Sparkles className="h-5 w-5 text-yellow-300 animate-bounce delay-200" />
              </div>
            </div>
          </div>

          {/* Scrollable Content Section */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in-0 duration-700 delay-300">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-blue-600 font-medium">Teacher ID</p>
                <p className="text-lg font-bold text-blue-900 font-mono">{teacherId}</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-green-600 font-medium">Subsystem</p>
                <p className="text-lg font-bold text-green-900">{subsystem}</p>
              </div>
              
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <p className="text-sm text-purple-600 font-medium">Status</p>
                <p className="text-lg font-bold text-purple-900">Active</p>
              </div>
            </div>

            {/* Credentials Section */}
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Shield className="h-5 w-5" />
                  Login Credentials
                </CardTitle>
                <CardDescription className="text-green-700">
                  Save these credentials securely - they're required for system access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm bg-white p-3 rounded-lg border border-green-200 text-green-900">
                        {email}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(email, 'email')}
                        className="h-10 w-10 p-0 hover:bg-green-100"
                        aria-label={`Copy email address: ${email}`}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-green-700 flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Default Password
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm bg-white p-3 rounded-lg border border-green-200 text-green-900">
                        {password}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(password, 'password')}
                        className="h-10 w-10 p-0 hover:bg-green-100"
                        aria-label="Copy password"
                      >
                        {copiedField === 'password' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <Alert className="border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <strong>Security Notice:</strong> This password will expire in 30 days. Please change it immediately after first login.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Teaching Assignments */}
            <Card className="border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <GraduationCap className="h-5 w-5" />
                  Teaching Assignments
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Subjects and classes assigned to this teacher
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Subjects */}
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Subjects to Teach
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {subjects && subjects.length > 0 ? (
                      subjects.map((subject, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 px-3 py-1"
                        >
                          {subject}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-blue-600 text-sm italic">No subjects assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Classes */}
                <div>
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Classes to Teach
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {classes && classes.length > 0 ? (
                      classes.map((cls, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="border-blue-300 text-blue-700 hover:bg-blue-100 px-3 py-1"
                        >
                          {cls}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-blue-600 text-sm italic">No classes assigned yet</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="border border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  Next Steps
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Complete these steps to finalize your account setup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm">Share Credentials</p>
                        <p className="text-purple-700 text-xs">Provide login details securely</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">2</span>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm">First Login</p>
                        <p className="text-purple-700 text-xs">Access system and change password</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">3</span>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm">Profile Setup</p>
                        <p className="text-purple-700 text-xs">Complete personal information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-purple-600 font-bold text-sm">4</span>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900 text-sm">System Access</p>
                        <p className="text-purple-700 text-xs">Verify teaching features</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Status */}
            {emailError && (
              <Alert variant="destructive" className="animate-in fade-in-0 duration-700">
                <AlertDescription>{emailError}</AlertDescription>
              </Alert>
            )}

            {emailSent && (
              <Alert className="border-green-200 bg-green-50 animate-in fade-in-0 duration-700">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Success!</strong> Welcome email has been sent to {email}.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Action Buttons - Fixed at Bottom */}
          <div className="p-8 pt-0 border-t border-gray-200 bg-white/50">
            <div className="space-y-4">
              {/* Primary Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={generateWelcomeEmail} 
                  className="h-12 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 text-blue-700 hover:from-blue-100 hover:to-blue-200 hover:border-blue-400 transition-all duration-200"
                >
                  <Download className="h-5 w-5 mr-3" />
                  Download Welcome Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={sendWelcomeEmail}
                  disabled={isSendingEmail}
                  className="h-12 bg-gradient-to-r from-green-50 to-green-100 border-green-300 text-green-700 hover:from-green-100 hover:to-green-200 hover:border-green-400 transition-all duration-200"
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
                  className="flex-1 h-12 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
                {onEnrollAnother && (
                  <Button 
                    onClick={onEnrollAnother} 
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Enroll Another Teacher
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
