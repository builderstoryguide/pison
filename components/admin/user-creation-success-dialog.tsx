"use client"

import { Check, Copy, Download, Mail, User, Users } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { downloadEmailContent, sendWelcomeEmail, type EmailData } from '@/lib/email-utils'
import { useToast } from '@/hooks/use-toast'

interface UserCreationSuccessDialogProps {
  userData: EmailData
  onClose: () => void
  onSuccess?: () => void
}

export function UserCreationSuccessDialog({ 
  userData, 
  onClose 
}: UserCreationSuccessDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const { toast } = useToast()

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleDownloadEmail = () => {
    downloadEmailContent(userData)
  }

  const handleSendEmail = async () => {
    setIsSendingEmail(true)
    try {
      const result = await sendWelcomeEmail(userData)
      if (result.success) {
        toast.success("Welcome email sent successfully!", {
          description: `Email has been sent to ${userData.email}`
        })
      } else {
        toast.error("Failed to send welcome email", {
          description: result.error || "An error occurred while sending the email"
        })
      }
    } catch (error) {
      toast.error("Failed to send welcome email", {
        description: "An unexpected error occurred"
      })
    } finally {
      setIsSendingEmail(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'teacher': return 'Teacher'
      case 'student': return 'Student'
      case 'parent': return 'Parent'
      case 'bursar': return 'Bursar'
      default: return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return User
      case 'teacher': return Users
      case 'student': return Users
      case 'parent': return Users
      case 'bursar': return User
      default: return User
    }
  }

  const RoleIcon = getRoleIcon(userData.role)

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 p-2">
      {/* Success Header */}
      <div className="text-center space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-green-100 animate-in zoom-in-0 duration-500 animate-pulse">
            <Check className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-green-600 animate-in fade-in-0 duration-700 delay-200">User Created Successfully!</h2>
          <p className="text-xs md:text-sm text-muted-foreground px-1 leading-relaxed animate-in fade-in-0 duration-700 delay-300">
            {userData.name} has been successfully created as a {getRoleDisplayName(userData.role)} in the system
          </p>
          <div className="flex justify-center mt-2">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        </div>
      </div>

      {/* User Information */}
      <Card className="animate-in fade-in-0 slide-in-from-left-2 duration-500 delay-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RoleIcon className="h-4 w-4" />
            User Information
          </CardTitle>
          <CardDescription className="text-xs">
            Important credentials for system access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-3">
          <div className="grid gap-3 grid-cols-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">User ID/Code</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(userData.userId || 'N/A', 'userId')}
                  className="h-6 px-2"
                >
                  {copiedField === 'userId' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                {userData.userId || 'N/A'}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Email Address</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(userData.email, 'email')}
                  className="h-6 px-2"
                >
                  {copiedField === 'email' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                {userData.email}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Default Password</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(userData.password, 'password')}
                  className="h-6 px-2"
                >
                  {copiedField === 'password' ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                {userData.password}
              </div>
            </div>

            {userData.className && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Class</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(userData.className || '', 'className')}
                    className="h-6 px-2"
                  >
                    {copiedField === 'className' ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                  {userData.className}
                </div>
              </div>
            )}
          </div>

          <Alert className="p-3 animate-in fade-in-0 duration-700 delay-400">
            <AlertDescription className="text-xs leading-relaxed">
              <strong>Important:</strong> Please save these credentials securely. The user should change their password upon first login. This password will expire in 30 days.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="animate-in fade-in-0 slide-in-from-right-2 duration-500 delay-200">
        <CardHeader>
          <CardTitle className="text-base">Next Steps</CardTitle>
          <CardDescription className="text-xs">
            Complete these steps to finalize the user account setup
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">1</Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Share Credentials</p>
                <p className="text-xs text-muted-foreground">
                  Provide the user with their login credentials securely
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">2</Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">First Login</p>
                <p className="text-xs text-muted-foreground">
                  User should log in and change their password immediately
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">3</Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">Profile Setup</p>
                <p className="text-xs text-muted-foreground">
                  Complete profile information and preferences
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">4</Badge>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">System Access</p>
                <p className="text-xs text-muted-foreground">
                  Verify access to appropriate system features and modules
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2 justify-center animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
        <div className="flex flex-col gap-2 w-full">
          <Button variant="outline" onClick={handleDownloadEmail} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Welcome Email
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmail}
            disabled={isSendingEmail}
            className="w-full"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isSendingEmail ? 'Sending...' : 'Send Welcome Email'}
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          {onSuccess && (
            <Button onClick={onSuccess} className="flex-1 bg-green-600 hover:bg-green-700">
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
