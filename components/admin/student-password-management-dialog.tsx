"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RotateCcw, Shield, Clock, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'
import { useUserManagement } from '@/lib/user-management-context'
import { generateSecurePassword, generateDefaultPassword, validatePasswordStrength } from '@/lib/password-generator'
import { PasswordDisplayDialog } from './password-display-dialog'
import { Student } from '@/lib/student-management-context'

interface StudentPasswordManagementDialogProps {
  student: Student
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentPasswordManagementDialog({ 
  student, 
  open, 
  onOpenChange 
}: StudentPasswordManagementDialogProps) {
  const { getPasswordInfo, setUserPassword, resetUserPassword } = useUserManagement()
  const [userId, setUserId] = useState<string | null>(null)
  const [passwordInfo, setPasswordInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Password generation and setting states
  const [customPassword, setCustomPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<any>(null)
  const [isSettingPassword, setIsSettingPassword] = useState(false)
  
  // Password display dialog state
  const [showPasswordDisplay, setShowPasswordDisplay] = useState(false)
  const [displayedPassword, setDisplayedPassword] = useState('')
  const [displayedPasswordType, setDisplayedPasswordType] = useState<'generated' | 'custom' | 'reset'>('generated')

  // Get user ID for the student when dialog opens
  useEffect(() => {
    if (open && student) {
      getUserIdForStudent()
    }
  }, [open, student])

  // Load password info when we have a user ID
  useEffect(() => {
    if (userId && open) {
      loadPasswordInfo()
    }
  }, [userId, open])

  const getUserIdForStudent = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/users?studentId=${student.student_id}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData.users && userData.users.length > 0) {
          setUserId(userData.users[0].id)
        } else {
          setError('No user account found for this student. The student may not have been enrolled through the system.')
        }
      } else {
        setError('Failed to find the student\'s user account.')
      }
    } catch (err) {
      setError('Error finding the student\'s user account.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadPasswordInfo = async () => {
    if (!userId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getPasswordInfo(userId)
      if (result.success && result.passwordInfo) {
        setPasswordInfo(result.passwordInfo)
      } else {
        setError('Failed to load password information')
      }
    } catch (err) {
      setError('Error loading password information')
    } finally {
      setIsLoading(false)
    }
  }

  const generateNewPassword = () => {
    if (!passwordInfo || !passwordInfo.userRole) {
      setError('Unable to generate password: User role not available')
      return
    }
    
    // Use the same format as default password generation: Role@Year + 4 random characters
    const newPassword = generateDefaultPassword(passwordInfo.userRole)
    setGeneratedPassword(newPassword)
    setShowGeneratedPassword(true)
  }

  const handleSetCustomPassword = async () => {
    if (!customPassword || !userId) return

    const strength = validatePasswordStrength(customPassword)
    if (!strength.isValid) {
      setError('Password does not meet security requirements')
      return
    }

    setIsSettingPassword(true)
    setError(null)

    try {
      const result = await setUserPassword(userId, customPassword)
      if (result.success) {
        setCustomPassword('')
        await loadPasswordInfo()
        setDisplayedPassword(result.password || customPassword)
        setDisplayedPasswordType('custom')
        setShowPasswordDisplay(true)
      } else {
        setError('Failed to set password')
      }
    } catch (err) {
      setError('Error setting password')
    } finally {
      setIsSettingPassword(false)
    }
  }

  const handleSetGeneratedPassword = async () => {
    if (!generatedPassword || !userId) return

    setIsSettingPassword(true)
    setError(null)

    try {
      const result = await setUserPassword(userId, generatedPassword)
      if (result.success) {
        setGeneratedPassword('')
        setShowGeneratedPassword(false)
        await loadPasswordInfo()
        setDisplayedPassword(result.password || generatedPassword)
        setDisplayedPasswordType('generated')
        setShowPasswordDisplay(true)
      } else {
        setError('Failed to set password')
      }
    } catch (err) {
      setError('Error setting password')
    } finally {
      setIsSettingPassword(false)
    }
  }

  const handleResetPassword = async () => {
    if (!userId) return
    
    setIsSettingPassword(true)
    setError(null)

    try {
      const result = await resetUserPassword(userId)
      if (result.success && result.password) {
        await loadPasswordInfo()
        setDisplayedPassword(result.password)
        setDisplayedPasswordType('reset')
        setShowPasswordDisplay(true)
      } else {
        setError('Failed to reset password')
      }
    } catch (err) {
      setError('Error resetting password')
    } finally {
      setIsSettingPassword(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        try {
          document.execCommand('copy')
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
          // Show password in alert as last resort
          alert(`Password: ${text}\n\nPlease copy this password manually.`)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (err) {
      console.error('Failed to copy password:', err)
      // Show password in alert as last resort
      alert(`Password: ${text}\n\nPlease copy this password manually.`)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPasswordStatusColor = () => {
    if (!passwordInfo) return 'default'
    if (passwordInfo.isExpired) return 'destructive'
    if (passwordInfo.expiresSoon) return 'secondary'
    if (passwordInfo.hasDefaultPassword) return 'destructive'
    return 'default'
  }

  const getPasswordStatusText = () => {
    if (!passwordInfo) return 'Unknown'
    if (passwordInfo.isExpired) return 'Expired'
    if (passwordInfo.expiresSoon) return 'Expires Soon'
    if (passwordInfo.hasDefaultPassword) return 'Default/Temporary'
    return 'Custom'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Password Management
          </DialogTitle>
          <DialogDescription>
            Manage password for {student.first_name} {student.last_name} (Student ID: {student.student_id})
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {passwordInfo && !isLoading && (
          <div className="space-y-6">
            {/* Current Password Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Current Password Information
                </CardTitle>
                <CardDescription>
                  Password details and security status for {student.first_name} {student.last_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Password Status:</span>
                  <Badge variant={getPasswordStatusColor()}>
                    {getPasswordStatusText()}
                  </Badge>
                </div>

                {/* Password Security Alert */}
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Note:</strong> Current passwords cannot be displayed for security reasons. 
                    Passwords are encrypted and cannot be retrieved. You can generate new passwords or reset to default passwords.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Changed</p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(passwordInfo.passwordLastChanged)}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Password Age</p>
                    <p>
                      {passwordInfo.passwordAge !== null 
                        ? `${passwordInfo.passwordAge} days`
                        : 'Unknown'
                      }
                    </p>
                  </div>
                </div>

                {passwordInfo.passwordExpiryDate && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expires On</p>
                    <p className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(passwordInfo.passwordExpiryDate)}
                      {passwordInfo.isExpired && (
                        <Badge variant="destructive" className="ml-2">Expired</Badge>
                      )}
                      {passwordInfo.expiresSoon && !passwordInfo.isExpired && (
                        <Badge variant="secondary" className="ml-2">Soon</Badge>
                      )}
                    </p>
                  </div>
                )}

                {/* Password Type Information */}
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Password Type</p>
                  {passwordInfo.hasDefaultPassword ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">Default/Temporary</Badge>
                        <span className="text-sm text-muted-foreground">
                          This student is using a system-generated password
                        </span>
                      </div>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm font-medium mb-1">Default Password Format:</p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {passwordInfo.userRole}@2024****
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Format: Role@Year + 4 random characters
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="default">Custom</Badge>
                      <span className="text-sm text-muted-foreground">
                        This student has set their own password
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Password Actions</CardTitle>
                <CardDescription>
                  Since current passwords cannot be retrieved for security reasons, you can:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Available Actions List */}
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-900 mb-2">Available Actions:</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>Generate Role-Based Password:</strong> Create a new password in the format Role@Year + random characters</li>
                    <li>• <strong>Set Custom Password:</strong> Define a specific password for the student</li>
                    <li>• <strong>Reset to Default:</strong> Generate a temporary password that expires in 7 days</li>
                    <li>• <strong>View New Passwords:</strong> All newly generated/set passwords are displayed with eye icon toggle</li>
                  </ul>
                </div>

                {/* Generate Secure Password */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Generate Role-Based Password</Label>
                      <p className="text-sm text-muted-foreground">
                        Creates a password in the format: Role@Year + random characters
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateNewPassword}
                      disabled={isSettingPassword}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                  
                  {generatedPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Input
                          type={showGeneratedPassword ? "text" : "password"}
                          value={generatedPassword}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowGeneratedPassword(!showGeneratedPassword)}
                        >
                          {showGeneratedPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={handleSetGeneratedPassword}
                          disabled={isSettingPassword}
                          size="sm"
                        >
                          Set Password
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Set Custom Password */}
                <div className="space-y-3">
                  <Label>Set Custom Password</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={customPassword}
                      onChange={(e) => {
                        setCustomPassword(e.target.value)
                        setPasswordStrength(validatePasswordStrength(e.target.value))
                      }}
                      placeholder="Enter custom password"
                      className="font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      onClick={handleSetCustomPassword}
                      disabled={isSettingPassword || !customPassword}
                      size="sm"
                    >
                      Set Password
                    </Button>
                  </div>
                  
                  {passwordStrength && customPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Strength:</span>
                        <Badge variant={passwordStrength.isValid ? "default" : "destructive"}>
                          {passwordStrength.score}/6
                        </Badge>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          {passwordStrength.feedback.map((msg: string, index: number) => (
                            <div key={index}>• {msg}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Reset to Default Password */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reset to Default Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Generate a role-based default password (7-day expiry)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleResetPassword}
                    disabled={isSettingPassword}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Password Display Dialog */}
      <PasswordDisplayDialog
        isOpen={showPasswordDisplay}
        onClose={() => setShowPasswordDisplay(false)}
        password={displayedPassword}
        userName={`${student.first_name} ${student.last_name}`}
        passwordType={displayedPasswordType}
      />
    </Dialog>
  )
}
