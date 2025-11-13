"use client"

import { AuthProvider, useAuth } from "@/lib/auth-context"
import { ProfileProvider, useProfile } from "@/lib/profile-context"
import { ProfileSettings } from "@/components/profile/profile-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, User, AlertCircle } from "lucide-react"


// Force dynamic rendering to skip static generation during build
export const dynamic = 'force-dynamic'

function TestProfileSettingsContent() {
  const { user, isLoading: authLoading } = useAuth()
  const { profile, isLoading: profileLoading, error } = useProfile()

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading authentication...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Not Authenticated
            </CardTitle>
            <CardDescription>
              Please log in to access profile settings
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings Test</h1>
          <p className="text-muted-foreground">
            Test page for profile settings functionality
          </p>
        </div>
        <Badge variant="outline">Test Page</Badge>
      </div>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current User Information
          </CardTitle>
          <CardDescription>
            Information from the auth context
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Name:</strong> {user.name}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Role:</strong> 
              <Badge variant="secondary" className="ml-2 capitalize">
                {user.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Context Status</CardTitle>
          <CardDescription>
            Status of the profile context and data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">Loading:</span>
            {profileLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading profile...</span>
              </div>
            ) : (
              <Badge variant="outline">Not Loading</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Error:</span>
            {error ? (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-red-600">{error}</span>
              </div>
            ) : (
              <Badge variant="outline">No Error</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Profile Data:</span>
            {profile ? (
              <Badge variant="outline">Available</Badge>
            ) : (
              <Badge variant="destructive">Not Available</Badge>
            )}
          </div>

          {profile && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Profile Data:</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Settings Component */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings Component</CardTitle>
          <CardDescription>
            The actual ProfileSettings component
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading profile settings...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600">Error loading profile: {error}</p>
              </div>
            </div>
          ) : (
            <ProfileSettings />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestProfileSettingsPage() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <TestProfileSettingsContent />
      </ProfileProvider>
    </AuthProvider>
  )
}
