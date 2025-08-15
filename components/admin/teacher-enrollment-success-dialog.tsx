"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, User, Mail, Phone, GraduationCap, Copy, Download } from "lucide-react"
import { useState } from "react"

interface TeacherEnrollmentSuccessDialogProps {
  teacherId: string
  teacherName: string
  email: string
  phone: string
  subsystem: string
  subjects: string[]
  classes: string[]
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
  onClose,
  onViewTeacher,
  onEnrollAnother,
}: TeacherEnrollmentSuccessDialogProps) {
  const [copied, setCopied] = useState(false)

  const copyTeacherId = async () => {
    try {
      await navigator.clipboard.writeText(teacherId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy teacher ID:", error)
    }
  }

  const generateTeacherCard = () => {
    const cardData = {
      teacherId,
      teacherName,
      email,
      phone,
      subsystem,
      subjects,
      classes,
      enrollmentDate: new Date().toLocaleDateString(),
    }

    const dataStr = JSON.stringify(cardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `teacher-${teacherId}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">Teacher Enrolled Successfully!</CardTitle>
          <CardDescription>The teacher has been successfully enrolled in the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Teacher ID */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Teacher ID</p>
                <p className="text-2xl font-bold font-mono">{teacherId}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyTeacherId}
                className="flex items-center gap-2 bg-transparent"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Teacher Details */}
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{teacherName}</p>
                <p className="text-sm text-muted-foreground">Full Name</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{email}</p>
                <p className="text-sm text-muted-foreground">Email Address</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{phone}</p>
                <p className="text-sm text-muted-foreground">Phone Number</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <div>
                <Badge variant="outline" className="capitalize mb-1">
                  {subsystem} Sub-system
                </Badge>
                <p className="text-sm text-muted-foreground">Educational System</p>
              </div>
            </div>
          </div>

          {/* Subjects and Classes */}
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Subjects to Teach</p>
              <div className="flex flex-wrap gap-2">
                {subjects && subjects.length > 0 ? (
                  subjects.map((subject, index) => (
                    <Badge key={index} variant="secondary">
                      {subject}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No subjects assigned</p>
                )}
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Classes to Teach</p>
              <div className="flex flex-wrap gap-2">
                {classes && classes.length > 0 ? (
                  classes.map((cls, index) => (
                    <Badge key={index} variant="outline">
                      {cls}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No classes assigned</p>
                )}
              </div>
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• The teacher ID has been automatically generated</li>
              <li>• Login credentials will be sent to the provided email address</li>
              <li>• The teacher can access the system immediately</li>
              <li>• All teaching assignments have been configured</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button onClick={generateTeacherCard} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Download Teacher Card
            </Button>

            {onViewTeacher && (
              <Button onClick={onViewTeacher} variant="outline" className="flex items-center gap-2 bg-transparent">
                <User className="h-4 w-4" />
                View Teacher Profile
              </Button>
            )}

            {onEnrollAnother && (
              <Button onClick={onEnrollAnother} variant="outline" className="flex items-center gap-2 bg-transparent">
                <User className="h-4 w-4" />
                Enroll Another Teacher
              </Button>
            )}

            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
