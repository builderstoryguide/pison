"use client"

import { Check, Copy, Download, User } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  onClose 
}: EnrollmentSuccessDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const hasDownloadedRef = useRef(false)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const generateWelcomeEmail = () => {
    const emailContent = `
Subject: Welcome to Pison Academy of Excellence

Dear ${studentName} and Parent/Guardian,

Congratulations! Your enrollment at Pison Academy of Excellence has been successfully completed.

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
Pison Academy of Excellence
    `.trim()

    const blob = new Blob([emailContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Welcome - ${studentName}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Automatically download credentials when dialog opens
  useEffect(() => {
    if (!hasDownloadedRef.current && studentId) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        generateWelcomeEmail()
        hasDownloadedRef.current = true
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [studentId])

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 p-2">
      {/* Success Header */}
              <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 md:h-16 md:w-16 items-center justify-center rounded-full bg-green-100">
              <Check className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
            </div>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-green-600">Enrollment Successful!</h2>
                         <p className="text-xs md:text-sm text-muted-foreground px-1 leading-relaxed">
               {studentName} has been successfully enrolled at Pison Academy of Excellence
             </p>
          </div>
        </div>

      {/* Student Information */}
      <Card>
        <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-base">
             <User className="h-4 w-4" />
             Student Information
           </CardTitle>
                     <CardDescription className="text-xs">
             Important credentials for system access
           </CardDescription>
        </CardHeader>
                 <CardContent className="space-y-4 p-3">
           <div className="grid gap-3 grid-cols-1">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                                 <span className="text-xs font-medium text-muted-foreground">Student ID</span>
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
                             <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                 {studentId}
               </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                                 <span className="text-xs font-medium text-muted-foreground">Parent Access Code</span>
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
                             <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                 {parentCode}
               </div>
            </div>
          </div>

                     {(studentPassword || parentPassword) && (
             <div className="grid gap-3 grid-cols-1">
              {studentPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                                         <span className="text-xs font-medium text-muted-foreground">Student Password</span>
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
                                     <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                     {studentPassword}
                   </div>
                </div>
              )}
              {parentPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                                         <span className="text-xs font-medium text-muted-foreground">Parent Password</span>
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
                                     <div className="font-mono text-xs md:text-sm font-bold bg-muted p-2 rounded break-all overflow-hidden">
                     {parentPassword}
                   </div>
                </div>
              )}
            </div>
          )}

                     <Alert className="p-3">
             <AlertDescription className="text-xs leading-relaxed">
               <strong>Important:</strong> Please save these credentials securely. They will be needed to access the school management system.
             </AlertDescription>
           </Alert>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
                     <CardTitle className="text-base">Next Steps</CardTitle>
                     <CardDescription className="text-xs">
             Complete these steps to finalize the enrollment process
           </CardDescription>
        </CardHeader>
                 <CardContent className="p-3">
           <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">1</Badge>
              <div className="min-w-0 flex-1">
                                 <p className="font-medium text-sm">Submit Required Documents</p>
                                 <p className="text-xs text-muted-foreground">
                   Visit the school office with original documents for verification
                 </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">2</Badge>
              <div className="min-w-0 flex-1">
                                 <p className="font-medium text-sm">Pay Enrollment Fees</p>
                                 <p className="text-xs text-muted-foreground">
                   Complete fee payment at the bursar's office
                 </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">3</Badge>
              <div className="min-w-0 flex-1">
                                 <p className="font-medium text-sm">Collect Student ID Card</p>
                                 <p className="text-xs text-muted-foreground">
                   Pick up official student identification card
                 </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Badge variant="outline" className="mt-0.5 flex-shrink-0">4</Badge>
              <div className="min-w-0 flex-1">
                                 <p className="font-medium text-sm">Attend Orientation</p>
                                 <p className="text-xs text-muted-foreground">
                   Join the new student orientation session
                 </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

             {/* Actions */}
       <div className="flex flex-col gap-2 justify-center">
         <div className="flex flex-col gap-2 w-full">
                 <Button variant="outline" onClick={generateWelcomeEmail} className="w-full">
           <Download className="h-4 w-4 mr-2" />
           Download Letter
         </Button>
        </div>
                 <Button onClick={onClose} className="w-full">
           Complete
         </Button>
      </div>
    </div>
  )
}
