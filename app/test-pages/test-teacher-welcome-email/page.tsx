"use client"

export const dynamic = 'force-dynamic'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, Download, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestTeacherWelcomeEmail() {
  const [formData, setFormData] = useState({
    teacherName: 'John Doe',
    teacherId: 'TCH-2024-001',
    email: 'john.doe@example.com',
    password: 'TempPass123!',
    subsystem: 'english',
    subjects: [
      {
        subjectId: '1',
        subjectName: 'Mathematics',
        branchId: '1',
        branchName: 'Pure Mathematics',
        classIds: ['1', '2'],
        classNames: ['Form 1A', 'Form 1B'],
        isPrimary: true
      },
      {
        subjectId: '2',
        subjectName: 'Physics',
        branchId: '2',
        branchName: 'General Physics',
        classIds: ['3'],
        classNames: ['Form 2A'],
        isPrimary: false
      }
    ],
    classes: [
      { classId: '1', className: 'Form 1A', classLevel: 'Form 1' },
      { classId: '2', className: 'Form 1B', classLevel: 'Form 1' },
      { classId: '3', className: 'Form 2A', classLevel: 'Form 2' }
    ]
  })

  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateWelcomeFile = () => {
    const emailContent = `
Subject: Welcome to Pison Academy of Excellence

Dear ${formData.teacherName},

Congratulations! Your enrollment as a teacher at Pison Academy of Excellence has been successfully completed.

Teacher Details:
- Teacher ID: ${formData.teacherId}
- Email: ${formData.email}
- Password: ${formData.password}
- Subsystem: ${formData.subsystem} Sub-system
- Subjects: ${formData.subjects.map(s => s.subjectName).join(', ')}
- Classes: ${formData.classes.map(c => c.className).join(', ')}

Please keep these credentials safe as they will be needed to access the school management system.

Next Steps:
1. Complete document submission at the school office
2. Attend teacher orientation session
3. Set up your teaching schedule
4. Access the teacher portal with your credentials

Welcome to our teaching staff!

Best regards,
Administration Team
Pison Academy of Excellence
    `.trim()

    const blob = new Blob([emailContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `welcome-email-${formData.teacherId}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const sendWelcomeEmail = async () => {
    setIsSendingEmail(true)
    setEmailResult(null)

    try {
      const response = await fetch('/api/email/teacher-welcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setEmailResult({ success: true, message: 'Welcome email sent successfully!' })
      } else {
        setEmailResult({ success: false, message: result.error || 'Failed to send welcome email' })
      }
    } catch (error) {
      setEmailResult({ success: false, message: 'Failed to send welcome email. Please try again.' })
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Teacher Welcome Email
          </CardTitle>
          <CardDescription>
            Test the teacher welcome email functionality with password inclusion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="teacherName">Teacher Name</Label>
              <Input
                id="teacherName"
                value={formData.teacherName}
                onChange={(e) => handleInputChange('teacherName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="teacherId">Teacher ID</Label>
              <Input
                id="teacherId"
                value={formData.teacherId}
                onChange={(e) => handleInputChange('teacherId', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="subsystem">Subsystem</Label>
              <Input
                id="subsystem"
                value={formData.subsystem}
                onChange={(e) => handleInputChange('subsystem', e.target.value)}
              />
            </div>
          </div>

          {/* Subjects and Classes Display */}
          <div>
            <Label>Subjects & Classes</Label>
            <div className="mt-2 p-4 bg-gray-50 rounded-md">
              <div className="space-y-2">
                {formData.subjects.map((subject, index) => (
                  <div key={index} className="text-sm">
                    <strong>{subject.subjectName}</strong> ({subject.branchName}) - 
                    Classes: {subject.classNames.join(', ')}
                    {subject.isPrimary && <span className="text-green-600 ml-2">(Primary)</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button onClick={generateWelcomeFile} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Generate Welcome File
            </Button>
            <Button 
              onClick={sendWelcomeEmail} 
              disabled={isSendingEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {isSendingEmail ? 'Sending...' : 'Send Welcome Email'}
            </Button>
          </div>

          {/* Results */}
          {emailResult && (
            <Alert variant={emailResult.success ? "default" : "destructive"}>
              {emailResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{emailResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          <div>
            <Label>Email Preview</Label>
            <Textarea
              value={`
Dear ${formData.teacherName},

Your login credentials:
- Email: ${formData.email}
- Password: ${formData.password}
- Teacher ID: ${formData.teacherId}

Subjects: ${formData.subjects.map(s => s.subjectName).join(', ')}
Classes: ${formData.classes.map(c => c.className).join(', ')}
              `.trim()}
              readOnly
              rows={8}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
