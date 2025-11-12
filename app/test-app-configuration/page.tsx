"use client"

import { AuthProvider } from "@/lib/auth-context"
import { AppConfigurationProvider, useAppConfiguration, useSchoolName, useSchoolLogo, useThemeColors } from "@/lib/app-configuration-context-v2"
import { AppConfiguration } from "@/components/admin/app-configuration"
import { SchoolBranding } from "@/components/ui/school-branding"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

function TestAppConfigurationContent() {
  const { configuration, isLoading, error } = useAppConfiguration()
  const schoolName = useSchoolName()
  const { url: logoUrl, alt: logoAlt } = useSchoolLogo()
  const { primary, secondary } = useThemeColors()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading configuration...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">App Configuration Test</h1>
          <p className="text-muted-foreground">
            Test page for the app configuration system
          </p>
        </div>
        <Badge variant="outline">Test Page</Badge>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Configuration Display */}
      <Card>
        <CardHeader>
          <CardTitle>Current Configuration</CardTitle>
          <CardDescription>
            Display of current app configuration values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">School Information</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {configuration?.school_name || 'Not set'}</p>
                <p><strong>Address:</strong> {configuration?.school_address || 'Not set'}</p>
                <p><strong>Phone:</strong> {configuration?.school_phone || 'Not set'}</p>
                <p><strong>Email:</strong> {configuration?.school_email || 'Not set'}</p>
                <p><strong>Website:</strong> {configuration?.school_website || 'Not set'}</p>
                <p><strong>Motto:</strong> {configuration?.school_motto || 'Not set'}</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">System Settings</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Academic Year:</strong> {configuration?.academic_year || 'Not set'}</p>
                <p><strong>Currency:</strong> {configuration?.currency || 'Not set'}</p>
                <p><strong>Timezone:</strong> {configuration?.timezone || 'Not set'}</p>
                <p><strong>Language:</strong> {configuration?.language || 'Not set'}</p>
                <p><strong>Date Format:</strong> {configuration?.date_format || 'Not set'}</p>
                <p><strong>Time Format:</strong> {configuration?.time_format || 'Not set'}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">Theme Colors</h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: configuration?.primary_color || '#1f2937' }}
                />
                <span className="text-sm">Primary: {configuration?.primary_color || '#1f2937'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: configuration?.secondary_color || '#3b82f6' }}
                />
                <span className="text-sm">Secondary: {configuration?.secondary_color || '#3b82f6'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hook Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Hook Tests</CardTitle>
          <CardDescription>
            Testing the custom hooks for configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">useSchoolName()</h4>
              <p className="text-sm text-muted-foreground">School Name:</p>
              <p className="font-medium">{schoolName}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">useSchoolLogo()</h4>
              <p className="text-sm text-muted-foreground">Logo URL:</p>
              <p className="font-medium text-xs break-all">{logoUrl}</p>
              <p className="text-sm text-muted-foreground">Alt Text:</p>
              <p className="font-medium">{logoAlt}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">useThemeColors()</h4>
              <p className="text-sm text-muted-foreground">Primary:</p>
              <p className="font-medium">{primary}</p>
              <p className="text-sm text-muted-foreground">Secondary:</p>
              <p className="font-medium">{secondary}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* School Branding Component Test */}
      <Card>
        <CardHeader>
          <CardTitle>School Branding Component</CardTitle>
          <CardDescription>
            Testing the SchoolBranding component with different configurations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Normal View</h4>
            <div className="border rounded-lg p-4">
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Admin Portal"
                collapsed={false}
              />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Collapsed View</h4>
            <div className="border rounded-lg p-4">
              <SchoolBranding 
                showSubtitle={true}
                subtitle="Admin Portal"
                collapsed={true}
              />
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Without Subtitle</h4>
            <div className="border rounded-lg p-4">
              <SchoolBranding 
                showSubtitle={false}
                collapsed={false}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Management */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Management</CardTitle>
          <CardDescription>
            Admin interface for managing app configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AppConfiguration />
        </CardContent>
      </Card>
    </div>
  )
}

export default function TestAppConfigurationPage() {
  return (
    <AuthProvider>
      <AppConfigurationProvider>
        <TestAppConfigurationContent />
      </AppConfigurationProvider>
    </AuthProvider>
  )
}
