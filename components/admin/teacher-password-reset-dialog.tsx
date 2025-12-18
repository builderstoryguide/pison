"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RotateCcw, Copy, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useTeacherManagement } from '@/lib/teacher-management-context'
import { useToast } from '@/hooks/use-toast'
import { copyToClipboardWithFeedback } from '@/lib/clipboard-utils'

interface TeacherPasswordResetDialogProps {
  teacher: {
    id: string
    teacherId: string
    firstName: string
    lastName: string
    email: string
  }
  isOpen: boolean
  onClose: () => void
}

export function TeacherPasswordResetDialog({
  teacher,
  isOpen,
  onClose,
}: TeacherPasswordResetDialogProps) {
  const { resetTeacherPassword } = useTeacherManagement()
  const { success: toastSuccess, error: toastError } = useToast()
  const [isResetting, setIsResetting] = useState(false)
  const [newPassword, setNewPassword] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const downloadTeacherCredentials = (password: string) => {
    try {
      const now = new Date()
      const dateTime = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      const content = `Teacher Credentials
==================
Generated: ${dateTime}

Teacher Name: ${teacher.firstName} ${teacher.lastName}
Teacher ID: ${teacher.teacherId}
Email: ${teacher.email}
Password: ${password}

IMPORTANT: Keep this information secure. The password will not be shown again.`

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.download = `teacher_credentials_${teacher.teacherId}_${now.toISOString().split('T')[0]}.txt`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download teacher credentials:', err)
      // Don't show error to user - download failure shouldn't block password reset
    }
  }

  const handleResetPassword = async () => {
    setIsResetting(true)
    setError(null)
    setNewPassword(null)

    try {
      const result = await resetTeacherPassword(teacher.id)
      if (result.success && result.password) {
        setNewPassword(result.password)
        // Automatically download credentials file
        downloadTeacherCredentials(result.password)
        toastSuccess('Password reset successfully', {
          description: `A new password has been generated for ${teacher.firstName} ${teacher.lastName}. Credentials file downloaded.`,
        })
      } else {
        const errorMsg = result.error || 'Failed to reset password'
        setError(errorMsg)
        toastError('Password reset failed', {
          description: errorMsg,
        })
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset password'
      setError(errorMsg)
      toastError('Password reset failed', {
        description: errorMsg,
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleCopyPassword = async () => {
    if (!newPassword) return

    await copyToClipboardWithFeedback(
      newPassword,
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        toastSuccess('Password copied to clipboard')
      },
      (err) => {
        console.error('Copy failed:', err)
        toastError('Failed to copy password', {
          description: 'Please copy the password manually',
        })
      }
    )
  }

  const handleClose = () => {
    setNewPassword(null)
    setError(null)
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Reset Teacher Password
          </DialogTitle>
          <DialogDescription>
            Reset password for {teacher.firstName} {teacher.lastName} ({teacher.teacherId})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!newPassword && !error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will generate a new password for this teacher. The old password will no longer work.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {newPassword && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Password reset successfully! A credentials file has been downloaded. You can also copy the password below.
              </AlertDescription>
            </Alert>
          )}

          {newPassword && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Password</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 font-mono text-sm bg-muted p-2 rounded border">
                  {newPassword}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyPassword}
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure to save this password securely. It will not be shown again.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              {newPassword ? 'Close' : 'Cancel'}
            </Button>
            {!newPassword && (
              <Button onClick={handleResetPassword} disabled={isResetting}>
                {isResetting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
