"use client"

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { RotateCcw, Shield, Clock, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { User } from '@/lib/user-management-context'

const roleColors = {
  admin: 'bg-red-100 text-red-800',
  teacher: 'bg-blue-100 text-blue-800',
  student: 'bg-green-100 text-green-800',
  parent: 'bg-purple-100 text-purple-800',
  bursar: 'bg-orange-100 text-orange-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  suspended: 'bg-red-100 text-red-800'
}

interface UserDetailsDialogProps {
  user: User
  onResetPassword?: (userId: string) => void
}

export function UserDetailsDialog({ user, onResetPassword }: UserDetailsDialogProps) {
  return (
    <div className="space-y-4">
      {/* User Header */}
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{user.name}</h3>
          <p className="text-muted-foreground text-sm">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <Badge className={roleColors[user.role]} variant="secondary">
              {user.role}
            </Badge>
            <Badge className={statusColors[user.status]} variant="secondary">
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p>{user.phone || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="capitalize">{user.gender || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p>{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sub-system</p>
              <p className="capitalize">{user.subsystem || 'Not specified'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{user.address || 'Not provided'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Role Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          {user.role === 'student' && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                <p className="font-mono">{user.studentId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Class</p>
                <p>{user.class}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Branch</p>
                <p className="capitalize">{user.branch}</p>
              </div>
            </div>
          )}

          {user.role === 'teacher' && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Teacher Registration Number</p>
              <p className="font-mono">{user.teacherRegNo}</p>
            </div>
          )}

          {user.role === 'parent' && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Parent Access Code</p>
              <p className="font-mono">{user.parentCode}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Permissions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((permission) => (
              <Badge key={permission} variant="outline">
                {permission.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Password Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Password Status</p>
              <div className="flex items-center gap-2">
                <Badge variant={user.hasDefaultPassword ? "destructive" : "default"}>
                  {user.hasDefaultPassword ? "Default/Temporary" : "Custom"}
                </Badge>
                {user.hasDefaultPassword && (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Changed</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
          
          {user.passwordExpiryDate && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Password Expires</p>
              <p className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(user.passwordExpiryDate).toLocaleDateString()}
                {new Date(user.passwordExpiryDate) < new Date() && (
                  <Badge variant="destructive" className="ml-2">Expired</Badge>
                )}
              </p>
            </div>
          )}

          {user.hasDefaultPassword && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This user is using a default or temporary password. They should change it upon next login.
              </AlertDescription>
            </Alert>
          )}

          {onResetPassword && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResetPassword(user.id)}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Bottom padding for scroll space */}
      <div className="h-4"></div>
    </div>
  )
}
