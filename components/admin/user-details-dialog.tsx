"use client"

import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

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
}

export function UserDetailsDialog({ user }: UserDetailsDialogProps) {
  return (
    <div className="space-y-6">
      {/* User Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar || "/placeholder.svg"} />
          <AvatarFallback className="text-lg">
            {user.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{user.name}</h3>
          <p className="text-muted-foreground">{user.email}</p>
          <div className="flex gap-2 mt-2">
            <Badge className={roleColors[user.role]}>
              {user.role}
            </Badge>
            <Badge className={statusColors[user.status]}>
              {user.status}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        <CardHeader>
          <CardTitle>Role Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
        </CardHeader>
        <CardContent>
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
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
    </div>
  )
}
