"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { RotateCcw, Shield, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useUserManagement } from '@/lib/user-management-context'

interface PasswordInfoDialogProps {
  userId: string
  userName: string
  isOpen: boolean
  onClose: () => void
  onResetPassword?: (userId: string) => void
}

export function PasswordInfoDialog({ 
  userId, 
  userName, 
  isOpen, 
  onClose, 
  onResetPassword 
}: PasswordInfoDialogProps) {
  const { getPasswordInfo } = useUserManagement()
  const [passwordInfo, setPasswordInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && userId) {
      loadPasswordInfo()
    }
  }, [isOpen, userId])

  const loadPasswordInfo = async () => {
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold">Password Information</h2>
                <p className="text-sm text-muted-foreground">{userName}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

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
              {/* Password Status Overview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Password Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Status:</span>
                    <Badge variant={getPasswordStatusColor()}>
                      {getPasswordStatusText()}
                    </Badge>
                  </div>
                  
                  {passwordInfo.hasDefaultPassword && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This user is using a default or temporary password. They should change it upon next login.
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordInfo.isExpired && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This password has expired. The user must reset their password to continue accessing the system.
                      </AlertDescription>
                    </Alert>
                  )}

                  {passwordInfo.expiresSoon && !passwordInfo.isExpired && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This password will expire soon. Consider reminding the user to change their password.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Password Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Password Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Created</p>
                    <p className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {formatDate(passwordInfo.accountCreated)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              {onResetPassword && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => onResetPassword(userId)}
                    className="flex-1"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
