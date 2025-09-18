"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Eye, EyeOff, Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { copyToClipboardWithFeedback } from '@/lib/clipboard-utils'

interface PasswordDisplayDialogProps {
  isOpen: boolean
  onClose: () => void
  password: string
  userName: string
  passwordType: 'generated' | 'custom' | 'reset'
}

export function PasswordDisplayDialog({ 
  isOpen, 
  onClose, 
  password, 
  userName,
  passwordType 
}: PasswordDisplayDialogProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    await copyToClipboardWithFeedback(
      password,
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      (error) => {
        console.error('Copy failed:', error)
      }
    )
  }

  const getPasswordTypeInfo = () => {
    switch (passwordType) {
      case 'generated':
        return {
          title: 'Secure Password Generated',
          description: 'A new secure password has been generated for this user',
          alert: 'This is a secure randomly generated password. Please share it securely with the user.'
        }
      case 'custom':
        return {
          title: 'Custom Password Set',
          description: 'A custom password has been set for this user',
          alert: 'This is the custom password you set. Please share it securely with the user.'
        }
      case 'reset':
        return {
          title: 'Password Reset',
          description: 'A new default password has been generated for this user',
          alert: 'This is a temporary password that will expire in 7 days. The user should change it upon next login.'
        }
      default:
        return {
          title: 'Password Set',
          description: 'A new password has been set for this user',
          alert: 'Please share this password securely with the user.'
        }
    }
  }

  const passwordInfo = getPasswordTypeInfo()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {passwordInfo.title}
          </DialogTitle>
          <DialogDescription>
            {passwordInfo.description} - {userName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {passwordInfo.alert}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="password-display">New Password</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="password-display"
                type={showPassword ? "text" : "password"}
                value={password}
                readOnly
                className="font-mono text-lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="flex-1"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Password
                </>
              )}
            </Button>
            <Button onClick={onClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
