
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Mail, 
  Download, 
  User, 
  GraduationCap, 
  Users, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { generateDefaultPassword } from "@/lib/password-utils"
import { EmailService } from "@/lib/email-service"
import { supabase } from "@/lib/supabase"

interface WelcomeEmailModalProps {
  userData: {
    id: string
    name: string
    email: string
    role: "student" | "teacher" | "parent" | "bursar" | "admin"
    userId?: string // For students: studentId, teachers: teacherId, etc.
    className?: string // For students
    parentName?: string // For students
    parentEmail?: string // For students
    parentCode?: string // For parents
  }
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface Credentials {
  email: string
  password: string
  userId?: string
  role: string
}

export function WelcomeEmailModal({ userData, isOpen, onClose, onSuccess }: WelcomeEmailModalProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  // Generate credentials when modal opens
  const generateCredentials = () => {
    const password = generateDefaultPassword(userData.role)
    const creds: Credentials = {
      email: userData.email,
      password,
      userId: userData.userId,
      role: userData.role
    }
    setCredentials(creds)
    return creds
  }

  const handleSendEmail = async () => {
    if (!credentials) return

    setIsLoading(true)
    try {
      let result: { success: boolean; error?: string }

      if (userData.role === "student" && userData.parentEmail && userData.parentName) {
        // Send welcome emails for student and parent
        const parentPassword = generateDefaultPassword("parent")
        result = await EmailService.sendWelcomeEmail({
          studentName: userData.name,
          studentEmail: userData.email,
          parentName: userData.parentName,
          parentEmail: userData.parentEmail,
          studentId: userData.userId || "",
          parentCode: userData.parentCode || "",
          studentPassword: credentials.password,
          parentPassword,
          className: userData.className || ""
        })
      } else {
        // Send generic welcome email for other roles
        result = await EmailService.sendGenericWelcomeEmail({
          name: userData.name,
          email: userData.email,
          role: userData.role,
          userId: userData.userId,
          password: credentials.password,
          className: userData.className
        })
      }

      if (result.success) {
        toast.success("Welcome email sent successfully!", {
          description: `Credentials have been sent to ${userData.email}`
        })
        setEmailSent(true)
        onSuccess?.()
      } else {
        throw new Error(result.error || "Failed to send email")
      }
    } catch (error) {
      console.error("Error sending welcome email:", error)
      toast.error("Failed to send welcome email", {
        description: error instanceof Error ? error.message : "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!credentials) return

    try {
      const pdfContent = generatePDFContent(userData, credentials)
      const blob = new Blob([pdfContent], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `welcome-credentials-${userData.name.toLowerCase().replace(/\s+/g, '-')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("Credentials downloaded successfully!", {
        description: "The file has been saved to your downloads folder"
      })
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Failed to download credentials", {
        description: "Please try again"
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard!", {
      description: "The text has been copied to your clipboard"
    })
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "student": return <GraduationCap className="h-4 w-4" />
      case "teacher": return <User className="h-4 w-4" />
      case "parent": return <Users className="h-4 w-4" />
      case "bursar": return <DollarSign className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "student": return "bg-blue-100 text-blue-800"
      case "teacher": return "bg-green-100 text-green-800"
      case "parent": return "bg-purple-100 text-purple-800"
      case "bursar": return "bg-orange-100 text-orange-800"
      case "admin": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  // Generate credentials when modal opens
  if (isOpen && !credentials) {
    generateCredentials()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Welcome Email & Credentials
          </DialogTitle>
          <DialogDescription>
            Send welcome email with login credentials or download them as a file
          </DialogDescription>
        </DialogHeader>

        {credentials && (
          <div className="space-y-6">
            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getRoleIcon(userData.role)}
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{userData.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <Badge className={getRoleColor(userData.role)}>
                      {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-sm">{userData.email}</p>
                  </div>
                  {userData.userId && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ID</label>
                      <p className="text-sm font-mono">{userData.userId}</p>
                    </div>
                  )}
                  {userData.className && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Class</label>
                      <p className="text-sm">{userData.className}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Credentials */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Login Credentials
                </CardTitle>
                <CardDescription>
                  These credentials will be included in the welcome email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm font-mono">{credentials.email}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(credentials.email)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Password</label>
                      <p className="text-sm font-mono">
                        {showPassword ? credentials.password : "••••••••••••••••"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credentials.password)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {credentials.userId && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">User ID</label>
                        <p className="text-sm font-mono">{credentials.userId}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(credentials.userId!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Important:</strong> Please ensure the user changes their password after their first login for security purposes.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSendEmail}
                disabled={isLoading || emailSent}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                {isLoading ? "Sending..." : emailSent ? "Email Sent" : "Send Welcome Email"}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Credentials
              </Button>
            </div>

            {emailSent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">
                    Welcome email has been sent successfully to {userData.email}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// Helper function to generate PDF content
function generatePDFContent(userData: any, credentials: Credentials): string {
  const roleDisplay = userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome Credentials - ${userData.name}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px; 
        }
        .header { 
          background-color: #1e40af; 
          color: white; 
          padding: 20px; 
          text-align: center; 
          border-radius: 8px 8px 0 0;
        }
        .content { 
          padding: 20px; 
          background-color: #f9fafb; 
          border: 1px solid #e5e7eb;
        }
        .credentials { 
          background-color: white; 
          padding: 20px; 
          margin: 20px 0; 
          border-left: 4px solid #1e40af; 
          border-radius: 4px;
        }
        .credential-item { 
          margin: 15px 0; 
          padding: 10px; 
          background-color: #f3f4f6; 
          border-radius: 4px;
        }
        .credential-label { 
          font-weight: bold; 
          color: #374151; 
          display: block;
          margin-bottom: 5px;
        }
        .credential-value { 
          font-family: monospace; 
          background-color: #e5e7eb; 
          padding: 8px 12px; 
          border-radius: 4px; 
          font-size: 14px;
        }
        .important { 
          background-color: #fef3c7; 
          border: 1px solid #f59e0b; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 4px; 
        }
        .footer { 
          text-align: center; 
          padding: 20px; 
          color: #6b7280; 
          font-size: 14px; 
          border-top: 1px solid #e5e7eb;
          margin-top: 20px;
        }
        .user-info {
          background-color: white;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Welcome to Government Bilingual High School Yaoundé</h1>
        <p>Your Login Credentials</p>
      </div>
      
      <div class="content">
        <div class="user-info">
          <h2>User Information</h2>
          <div class="credential-item">
            <span class="credential-label">Name:</span>
            <div class="credential-value">${userData.name}</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">Role:</span>
            <div class="credential-value">${roleDisplay}</div>
          </div>
          ${userData.userId ? `
          <div class="credential-item">
            <span class="credential-label">User ID:</span>
            <div class="credential-value">${userData.userId}</div>
          </div>
          ` : ''}
          ${userData.className ? `
          <div class="credential-item">
            <span class="credential-label">Class:</span>
            <div class="credential-value">${userData.className}</div>
          </div>
          ` : ''}
        </div>

        <div class="credentials">
          <h2>Login Credentials</h2>
          <div class="credential-item">
            <span class="credential-label">Email Address:</span>
            <div class="credential-value">${credentials.email}</div>
          </div>
          <div class="credential-item">
            <span class="credential-label">Password:</span>
            <div class="credential-value">${credentials.password}</div>
          </div>
          ${credentials.userId ? `
          <div class="credential-item">
            <span class="credential-label">User ID:</span>
            <div class="credential-value">${credentials.userId}</div>
          </div>
          ` : ''}
        </div>

        <div class="important">
          <strong>Important Security Notice:</strong><br>
          • Please keep these credentials safe and secure<br>
          • Change your password immediately after your first login<br>
          • Do not share your credentials with anyone<br>
          • Contact the school administration if you need assistance
        </div>

        <div class="footer">
          <p><strong>Government Bilingual High School Yaoundé</strong></p>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          <p>For assistance, contact the school administration</p>
        </div>
      </div>
    </body>
    </html>
  `
}
